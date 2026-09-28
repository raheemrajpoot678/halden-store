// Orders and stock reservations for Stripe Checkout. Stock is reserved when a
// Checkout Session is created and returned if it expires or its payment fails.
// neon-http has no interactive transactions, so every state change is a single
// conditional statement guarded on the order's status; running one twice (e.g.
// a retried webhook) is a no-op.
import { and, desc, eq, sql } from "drizzle-orm";
import { cache } from "react";
import type Stripe from "stripe";
import { db } from "@/db";
import {
  orders,
  type OrderItem,
  type OrderStatus,
  type ShippingDetails,
} from "@/db/schema";
import type { CheckoutLine } from "@/lib/cart";
import { notifyLowStock, notifyOrder } from "@/lib/notifications";

export type Order = typeof orders.$inferSelect;

// Reads the OrderItem[] jsonb as rows.
const itemRows = (items: unknown) =>
  sql`jsonb_to_recordset(${items}) as x("productId" int, quantity int)`;

type Reservation = Pick<OrderItem, "productId" | "quantity">;

function reservationJson(items: Reservation[]) {
  return JSON.stringify(
    items.map(({ productId, quantity }) => ({ productId, quantity })),
  );
}

async function returnStock(items: Reservation[]) {
  if (items.length === 0) return;
  await db.execute(sql`
    update products p set stock = p.stock + x.quantity
    from ${itemRows(sql`${reservationJson(items)}::jsonb`)}
    where p.id = x."productId"
  `);
}

// Takes every line's quantity out of stock, or none of them: if another buyer
// got there first, whatever was taken is put back and false is returned.
export async function reserveStock(items: Reservation[]): Promise<boolean> {
  const taken = await db.execute(sql`
    update products p set stock = p.stock - x.quantity
    from ${itemRows(sql`${reservationJson(items)}::jsonb`)}
    where p.id = x."productId" and p.stock >= x.quantity
    returning p.id
  `);
  const takenIds = new Set((taken.rows as { id: number }[]).map((r) => r.id));
  if (takenIds.size === items.length) return true;

  await returnStock(items.filter((item) => takenIds.has(item.productId)));
  return false;
}

export function toOrderItems(lines: CheckoutLine[]): OrderItem[] {
  return lines.map((line) => ({
    productId: line.productId,
    slug: line.slug,
    name: line.name,
    colour: line.colour,
    image: line.image,
    unitPriceCents: line.unitPriceCents,
    quantity: line.quantity,
  }));
}

// Inserts the order for stock that reserveStock has already taken. If the
// insert fails the stock is returned, so nothing stays reserved without an
// order that can release it.
export async function createPendingOrder(values: {
  cartId: string;
  userId: string | null;
  email: string | null;
  items: OrderItem[];
  shippingCents: number;
}): Promise<Order> {
  const subtotalCents = values.items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  );
  try {
    const [order] = await db
      .insert(orders)
      .values({
        id: crypto.randomUUID(),
        ...values,
        status: "pending",
        subtotalCents,
        totalCents: subtotalCents + values.shippingCents,
      })
      .returning();
    return order;
  } catch (error) {
    await returnStock(values.items);
    throw error;
  }
}

// Records the Checkout Session on the order. Returns false if the order was
// released in the meantime (the caller must then expire the session).
export async function attachCheckoutSession(orderId: string, sessionId: string) {
  const updated = await db
    .update(orders)
    .set({ stripeCheckoutSessionId: sessionId })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
    .returning({ id: orders.id });
  return updated.length > 0;
}

// Moves a pending/processing order to failed or expired and returns its stock,
// in one statement. Returns whether this call did the release.
export async function releaseOrder(
  orderId: string,
  status: Extract<OrderStatus, "failed" | "expired">,
): Promise<boolean> {
  const result = await db.execute(sql`
    with o as (
      update orders set status = ${status}, updated_at = now()
      where id = ${orderId} and status in ('pending', 'processing')
      returning items
    ),
    restocked as (
      update products p set stock = p.stock + x.quantity
      from o, ${itemRows(sql`o.items`)}
      where p.id = x."productId"
      returning p.id
    )
    select count(*)::int as released from o
  `);
  const released = (result.rows[0] as { released: number }).released > 0;
  // Abandoned checkouts (expired) are routine; only failed payments are news.
  if (released && status === "failed") await notifyOrder("payment_failed", orderId);
  return released;
}

export async function markOrderProcessing(orderId: string) {
  const updated = await db
    .update(orders)
    .set({ status: "processing" })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
    .returning({ id: orders.id });
  if (updated.length > 0) await notifyOrder("order_processing", orderId);
}

function shippingDetailsOf(session: Stripe.Checkout.Session): ShippingDetails | null {
  const shipping = session.collected_information?.shipping_details;
  if (!shipping) return null;
  const { line1, line2, city, state, postal_code, country } = shipping.address;
  return {
    name: shipping.name,
    address: { line1, line2, city, state, postal_code, country },
  };
}

// Fulfils a paid Checkout Session: marks the order paid and removes the bought
// pieces from the bag it came from (anything added since stays). Stock was
// taken at reservation; if the order had already been released (a payment
// landing after its session was expired), the stock is taken again, floored at
// zero. Safe to call from both the webhook and the success page.
export async function markOrderPaid(orderId: string, session: Stripe.Checkout.Session) {
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);
  const email = session.customer_details?.email ?? null;
  const shipping = shippingDetailsOf(session);

  const result = await db.execute(sql`
    with prev as (
      select id, status from orders
      where id = ${orderId} and status in ('pending', 'processing', 'failed', 'expired')
      for update
    ),
    o as (
      update orders set
        status = 'paid',
        paid_at = now(),
        updated_at = now(),
        email = coalesce(${email}, orders.email),
        shipping_details = coalesce(${shipping ? JSON.stringify(shipping) : null}::jsonb, orders.shipping_details),
        stripe_checkout_session_id = ${session.id},
        stripe_payment_intent_id = ${paymentIntentId}
      from prev
      where orders.id = prev.id
      returning orders.items, orders.cart_id, prev.status as prev_status
    ),
    retaken as (
      update products p set stock = greatest(p.stock - x.quantity, 0)
      from o, ${itemRows(sql`o.items`)}
      where o.prev_status in ('failed', 'expired') and p.id = x."productId"
      returning p.id
    ),
    cleared as (
      delete from cart_items ci
      using o, ${itemRows(sql`o.items`)}
      where ci.cart_id = o.cart_id and ci.product_id = x."productId"
      returning ci.id
    )
    select prev_status from o
  `);
  const [row] = result.rows as { prev_status: OrderStatus }[];
  if (!row) return; // already paid (or refunded): nothing to do
  if (row.prev_status === "failed" || row.prev_status === "expired") {
    console.warn(
      `[orders] Order ${orderId} was paid after being ${row.prev_status}; stock re-taken, check for overselling.`,
    );
  }
  await notifyOrder("order_paid", orderId);
  await notifyLowStock(orderId);
}

export async function getPendingOrdersForCart(cartId: string) {
  return db
    .select({
      id: orders.id,
      stripeCheckoutSessionId: orders.stripeCheckoutSessionId,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(and(eq(orders.cartId, cartId), eq(orders.status, "pending")));
}

export const getOrder = cache(async (orderId: string) => {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  return order ?? null;
});

export const getOrdersForUser = cache(async (userId: string) =>
  db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.userId, userId),
        sql`${orders.status} in ('processing', 'paid', 'partially_refunded', 'refunded')`,
      ),
    )
    .orderBy(desc(orders.createdAt)),
);
