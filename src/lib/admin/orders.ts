// Admin reads and fulfilment writes for orders. Like src/lib/orders.ts, every
// write is a single statement guarded on the order's current state.
import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  orders,
  PAID_ORDER_STATUSES,
  refunds,
  user,
  type FulfilmentStatus,
  type OrderStatus,
} from "@/db/schema";
import { likePattern, paged, PAGE_SIZE } from "@/lib/admin/shared";

export type AdminOrder = typeof orders.$inferSelect;

export type OrderFilters = {
  query?: string;
  status?: OrderStatus;
  fulfilment?: FulfilmentStatus;
  page?: number;
};

// Abandoned (pending/expired) checkouts are hidden unless asked for by status.
const listableStatuses: OrderStatus[] = ["processing", ...PAID_ORDER_STATUSES, "failed"];

export async function listAdminOrders({ query = "", status, fulfilment, page = 1 }: OrderFilters) {
  const term = query.trim();
  const where = and(
    status ? eq(orders.status, status) : inArray(orders.status, listableStatuses),
    fulfilment ? eq(orders.fulfilmentStatus, fulfilment) : undefined,
    term
      ? or(
          ilike(orders.id, `${term.toLowerCase().replace(/[\\%_]/g, "\\$&")}%`),
          ilike(orders.email, likePattern(term)),
          ilike(user.name, likePattern(term)),
        )
      : undefined,
  );
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ order: orders, customerName: user.name })
      .from(orders)
      .leftJoin(user, eq(orders.userId, user.id))
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ total: count() })
      .from(orders)
      .leftJoin(user, eq(orders.userId, user.id))
      .where(where),
  ]);
  return paged(
    rows.map(({ order, customerName }) => ({ ...order, customerName })),
    total,
    page,
  );
}

export async function getRecentOrders(limit = 8) {
  return db
    .select()
    .from(orders)
    .where(inArray(orders.status, listableStatuses))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

export async function getAdminOrder(id: string) {
  const [row] = await db
    .select({
      order: orders,
      customer: { id: user.id, name: user.name, email: user.email },
    })
    .from(orders)
    .leftJoin(user, eq(orders.userId, user.id))
    .where(eq(orders.id, id));
  if (!row) return null;

  const orderRefunds = await db
    .select({ refund: refunds, createdByName: user.name })
    .from(refunds)
    .leftJoin(user, eq(refunds.createdBy, user.id))
    .where(eq(refunds.orderId, id))
    .orderBy(desc(refunds.createdAt));

  return {
    ...row.order,
    customer: row.customer?.id ? row.customer : null,
    refunds: orderRefunds.map(({ refund, createdByName }) => ({ ...refund, createdByName })),
  };
}

export type AdminOrderDetail = NonNullable<Awaited<ReturnType<typeof getAdminOrder>>>;

// Quantity of each product already returned to stock by this order's refunds.
export function restockedQuantities(detail: AdminOrderDetail) {
  const totals = new Map<number, number>();
  for (const refund of detail.refunds) {
    for (const line of refund.restocked) {
      totals.set(line.productId, (totals.get(line.productId) ?? 0) + line.quantity);
    }
  }
  return totals;
}

const fulfillable = sql`${orders.status} in ('paid', 'partially_refunded')`;

export async function markShipped(
  id: string,
  { carrier, trackingNumber }: { carrier: string | null; trackingNumber: string | null },
) {
  // Also lets an admin correct the tracking details of a shipped order.
  const updated = await db
    .update(orders)
    .set({
      fulfilmentStatus: "shipped",
      carrier,
      trackingNumber,
      shippedAt: sql`coalesce(${orders.shippedAt}, now())`,
    })
    .where(and(eq(orders.id, id), fulfillable, inArray(orders.fulfilmentStatus, ["unfulfilled", "shipped"])))
    .returning({ id: orders.id });
  return updated.length > 0;
}

export async function markDelivered(id: string) {
  const updated = await db
    .update(orders)
    .set({ fulfilmentStatus: "delivered", deliveredAt: new Date() })
    .where(and(eq(orders.id, id), fulfillable, eq(orders.fulfilmentStatus, "shipped")))
    .returning({ id: orders.id });
  return updated.length > 0;
}

export async function markUnfulfilled(id: string) {
  const updated = await db
    .update(orders)
    .set({
      fulfilmentStatus: "unfulfilled",
      shippedAt: null,
      deliveredAt: null,
    })
    .where(and(eq(orders.id, id), eq(orders.fulfilmentStatus, "shipped")))
    .returning({ id: orders.id });
  return updated.length > 0;
}

export async function countOrdersToFulfil() {
  const [row] = await db
    .select({ value: count() })
    .from(orders)
    .where(and(fulfillable, eq(orders.fulfilmentStatus, "unfulfilled")));
  return row?.value ?? 0;
}

export async function getOrderIdsByPaymentIntent(paymentIntentIds: string[]) {
  if (paymentIntentIds.length === 0) return new Map<string, string>();
  const rows = await db
    .select({ id: orders.id, paymentIntentId: orders.stripePaymentIntentId })
    .from(orders)
    .where(inArray(orders.stripePaymentIntentId, paymentIntentIds));
  return new Map(rows.map((row) => [row.paymentIntentId!, row.id]));
}

/* Refund list */

export async function listRefunds({ page = 1 }: { page?: number }) {
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        refund: refunds,
        orderEmail: orders.email,
        currency: orders.currency,
        createdByName: user.name,
      })
      .from(refunds)
      .innerJoin(orders, eq(refunds.orderId, orders.id))
      .leftJoin(user, eq(refunds.createdBy, user.id))
      .orderBy(desc(refunds.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(refunds),
  ]);
  return paged(
    rows.map(({ refund, ...rest }) => ({ ...refund, ...rest })),
    total,
    page,
  );
}
