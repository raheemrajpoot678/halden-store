// Refunds and Stripe fees. Refunds can be issued from admin or the Stripe
// Dashboard; either way the Stripe Refund is upserted into `refunds` and the
// order's refunded_cents/status are recomputed from those rows, so running a
// sync twice (webhook retries, admin + webhook racing) changes nothing.
import { eq, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db";
import { orders, type RestockedLine } from "@/db/schema";
import { notifyRefund } from "@/lib/notifications";
import { getStripe } from "@/lib/stripe";

// Refunds in these states no longer count against the order.
const VOID_REFUND_STATUSES = ["failed", "canceled"];

function idOf(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

async function orderIdForPaymentIntent(paymentIntentId: string) {
  const [order] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.stripePaymentIntentId, paymentIntentId));
  if (order) return order.id;
  // The charge can land before the order records its payment intent.
  const intent = await getStripe().paymentIntents.retrieve(paymentIntentId);
  return intent.metadata?.orderId ?? null;
}

// Sets refunded_cents from the order's live refunds and moves a captured order
// between paid / partially_refunded / refunded to match.
async function recomputeRefunded(orderId: string) {
  await db.execute(sql`
    with total as (
      select coalesce(sum(amount_cents), 0)::int as cents
      from refunds
      where order_id = ${orderId}
        and status not in (${sql.join(VOID_REFUND_STATUSES.map((s) => sql`${s}`), sql`, `)})
    )
    update orders set
      refunded_cents = least(total.cents, orders.total_cents),
      status = case
        when orders.status not in ('paid', 'partially_refunded', 'refunded') then orders.status
        when total.cents = 0 then 'paid'
        when total.cents >= orders.total_cents then 'refunded'
        else 'partially_refunded'
      end,
      updated_at = now()
    from total
    where orders.id = ${orderId}
  `);
}

// Records a Stripe Refund. `restock` lines go back into stock only if no
// earlier call already attached restock lines to this refund, so a repeated
// call can't restock twice. Returns the order id it was recorded against.
export async function syncRefund(
  refund: Stripe.Refund,
  options: { createdBy?: string; restock?: RestockedLine[] } = {},
): Promise<string | null> {
  const paymentIntentId = idOf(refund.payment_intent);
  const orderId =
    refund.metadata?.orderId ??
    (paymentIntentId ? await orderIdForPaymentIntent(paymentIntentId) : null);
  if (!orderId) {
    console.warn(`[refunds] No order found for refund ${refund.id}`);
    return null;
  }

  const upserted = await db.execute(sql`
    insert into refunds (order_id, stripe_refund_id, amount_cents, status, reason, created_by)
    values (
      ${orderId}, ${refund.id}, ${refund.amount}, ${refund.status ?? "pending"},
      ${refund.reason}, ${options.createdBy ?? null}
    )
    on conflict (stripe_refund_id) do update set
      amount_cents = excluded.amount_cents,
      status = excluded.status,
      reason = coalesce(excluded.reason, refunds.reason),
      created_by = coalesce(refunds.created_by, excluded.created_by),
      updated_at = now()
    returning (xmax = 0) as inserted
  `);
  const inserted = (upserted.rows[0] as { inserted: boolean } | undefined)?.inserted ?? false;

  const restock = (options.restock ?? []).filter((line) => line.quantity > 0);
  if (restock.length > 0) {
    // Claims the refund's (still empty) restock slot and returns the stock in
    // the same statement.
    await db.execute(sql`
      with claimed as (
        update refunds set restocked = ${JSON.stringify(restock)}::jsonb, updated_at = now()
        where stripe_refund_id = ${refund.id} and restocked = '[]'::jsonb
        returning restocked
      )
      update products p set stock = p.stock + x.quantity
      from claimed, jsonb_to_recordset(claimed.restocked) as x("productId" int, quantity int)
      where p.id = x."productId"
    `);
  }

  await recomputeRefunded(orderId);
  if (inserted) await notifyRefund(orderId, refund.amount, refund.currency);
  return orderId;
}

// Stores Stripe's processing fee on the order once the charge's balance
// transaction exists (it may still be null when the charge first succeeds;
// charge.updated follows when it's set).
export async function recordStripeFee(charge: Stripe.Charge) {
  const balanceTransactionId = idOf(charge.balance_transaction);
  const paymentIntentId = idOf(charge.payment_intent);
  if (!balanceTransactionId || !paymentIntentId) return;

  const orderId = await orderIdForPaymentIntent(paymentIntentId);
  if (!orderId) return;
  const transaction =
    typeof charge.balance_transaction === "object" && charge.balance_transaction
      ? charge.balance_transaction
      : await getStripe().balanceTransactions.retrieve(balanceTransactionId);

  // The fee is in the account's settlement currency, which can differ from
  // the charge's (e.g. a USD charge settling in AED); store it in the order's.
  const feeCents =
    transaction.currency === charge.currency || !transaction.exchange_rate
      ? transaction.fee
      : Math.round(transaction.fee / transaction.exchange_rate);

  await db
    .update(orders)
    .set({ stripeFeeCents: feeCents })
    .where(eq(orders.id, orderId));
}

export type RefundReason = "requested_by_customer" | "duplicate" | "fraudulent";

// Issues a refund through Stripe and records it straight away (the webhook
// then finds it already recorded). The idempotency key covers the order's
// refund state, so a double-submitted form creates one refund, while a second,
// deliberate refund after the first is a new request.
export async function issueRefund({
  orderId,
  amountCents,
  reason,
  restock,
  createdBy,
}: {
  orderId: string;
  amountCents: number;
  reason: RefundReason | null;
  restock: RestockedLine[];
  createdBy: string;
}): Promise<{ error: string | null }> {
  const [order] = await db
    .select({
      status: orders.status,
      totalCents: orders.totalCents,
      refundedCents: orders.refundedCents,
      paymentIntentId: orders.stripePaymentIntentId,
    })
    .from(orders)
    .where(eq(orders.id, orderId));
  if (!order) return { error: "Order not found." };
  if (order.status !== "paid" && order.status !== "partially_refunded") {
    return { error: "Only paid orders can be refunded." };
  }
  if (!order.paymentIntentId) {
    return { error: "This order has no Stripe payment to refund." };
  }
  const refundable = order.totalCents - order.refundedCents;
  if (amountCents <= 0 || amountCents > refundable) {
    return { error: "Enter an amount up to the refundable balance." };
  }

  let refund: Stripe.Refund;
  try {
    refund = await getStripe().refunds.create(
      {
        payment_intent: order.paymentIntentId,
        amount: amountCents,
        ...(reason ? { reason } : {}),
        metadata: { orderId },
      },
      { idempotencyKey: `refund-${orderId}-${order.refundedCents}-${amountCents}` },
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Stripe couldn’t issue the refund." };
  }
  if (refund.status === "failed" || refund.status === "canceled") {
    return { error: `Stripe reported the refund as ${refund.status}.` };
  }

  await syncRefund(refund, { createdBy, restock });
  return { error: null };
}
