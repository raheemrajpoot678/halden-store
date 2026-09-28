"use server";

import { revalidatePath } from "next/cache";
import { errorMessage, requireAdminAction, type FormState } from "@/lib/admin/authorize";
import {
  getAdminOrder,
  markDelivered,
  markShipped,
  markUnfulfilled,
  restockedQuantities,
} from "@/lib/admin/orders";
import { revalidateStorefront } from "@/lib/admin/shared";
import { issueRefund, type RefundReason } from "@/lib/refunds";
import type { RestockedLine } from "@/db/schema";

const ORDER_ID = /^[0-9a-f-]{36}$/;

function refresh(orderId: string) {
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

function text(formData: FormData, key: string, max: number) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed || null;
}

export async function shipOrder(orderId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { error } = await requireAdminAction();
  if (error) return { error };
  if (!ORDER_ID.test(orderId)) return { error: "Order not found." };

  const carrier = text(formData, "carrier", 60);
  const trackingNumber = text(formData, "trackingNumber", 100);
  try {
    const updated = await markShipped(orderId, { carrier, trackingNumber });
    if (!updated) return { error: "Only paid orders that haven’t been delivered can be shipped." };
  } catch (e) {
    return { error: errorMessage(e) };
  }
  refresh(orderId);
  return { error: null, message: "Saved. The customer can see this on their account." };
}

export async function setFulfilment(
  orderId: string,
  next: "delivered" | "unfulfilled",
): Promise<FormState> {
  const { error } = await requireAdminAction();
  if (error) return { error };
  if (!ORDER_ID.test(orderId)) return { error: "Order not found." };

  const updated = next === "delivered" ? await markDelivered(orderId) : await markUnfulfilled(orderId);
  if (!updated) return { error: "The order’s status changed; reload and try again." };
  refresh(orderId);
  return { error: null };
}

const REASONS: RefundReason[] = ["requested_by_customer", "duplicate", "fraudulent"];

// "12.50" → 1250. Rejects anything that isn't a plain amount with ≤ 2 decimals.
function parseAmount(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^\d{1,7}(\.\d{1,2})?$/.test(value.trim())) return null;
  const [whole, fraction = ""] = value.trim().split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export async function refundOrder(orderId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { session, error } = await requireAdminAction();
  if (error || !session) return { error };
  if (!ORDER_ID.test(orderId)) return { error: "Order not found." };

  const amountCents = parseAmount(formData.get("amount"));
  if (!amountCents) return { error: "Enter the amount to refund, e.g. 120.00." };

  const reasonValue = formData.get("reason");
  const reason = REASONS.includes(reasonValue as RefundReason) ? (reasonValue as RefundReason) : null;

  // Restock quantities are checked against the order's lines (and what
  // earlier refunds already put back), never trusted from the form.
  const order = await getAdminOrder(orderId);
  if (!order) return { error: "Order not found." };
  const alreadyRestocked = restockedQuantities(order);
  const restock: RestockedLine[] = [];
  for (const item of order.items) {
    const raw = formData.get(`restock-${item.productId}`);
    const quantity = typeof raw === "string" && raw !== "" ? Number(raw) : 0;
    const max = item.quantity - (alreadyRestocked.get(item.productId) ?? 0);
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > max) {
      return { error: `You can restock up to ${max} of ${item.name}.` };
    }
    if (quantity > 0) restock.push({ productId: item.productId, quantity });
  }

  const result = await issueRefund({
    orderId,
    amountCents,
    reason,
    restock,
    createdBy: session.user.id,
  });
  if (result.error) return result;

  refresh(orderId);
  revalidatePath("/admin/refunds");
  revalidatePath("/admin/products");
  if (restock.length > 0) {
    const restockedIds = new Set(restock.map((line) => line.productId));
    revalidateStorefront({
      productSlugs: order.items.filter((item) => restockedIds.has(item.productId)).map((item) => item.slug),
    });
  }
  return { error: null, message: "Refund issued." };
}
