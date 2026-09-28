// Starts and cancels Stripe Checkout Sessions for a cart. Payment results are
// recorded by the webhook (src/app/api/stripe/webhook/route.ts).
import type Stripe from "stripe";
import {
  CHECKOUT_CURRENCY,
  CHECKOUT_INTEGRATION_ID,
  CHECKOUT_TTL_MINUTES,
  SHIPPING_COUNTRIES,
  SHIPPING_RATE,
} from "@/lib/checkout-config";
import { loadCartLines } from "@/lib/cart";
import {
  attachCheckoutSession,
  createPendingOrder,
  getPendingOrdersForCart,
  releaseOrder,
  reserveStock,
  toOrderItems,
} from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

// An order without a session is still being set up by another request; only
// treat it as abandoned once that request has clearly finished or died.
const ORPHAN_AFTER_MS = 2 * 60 * 1000;

function appUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}

function productImageUrl(src: string) {
  const url = new URL(src);
  url.searchParams.set("w", "600");
  url.searchParams.set("q", "75");
  url.searchParams.set("fit", "max");
  return url.toString();
}

// Expires a pending order's Checkout Session and returns its stock. Leaves the
// order alone if its session has already been completed (the webhook owns it).
export async function cancelPendingOrder(order: {
  id: string;
  stripeCheckoutSessionId: string | null;
  createdAt: Date;
}) {
  if (!order.stripeCheckoutSessionId) {
    if (Date.now() - order.createdAt.getTime() > ORPHAN_AFTER_MS) {
      await releaseOrder(order.id, "expired");
    }
    return;
  }

  const stripe = getStripe();
  try {
    await stripe.checkout.sessions.expire(order.stripeCheckoutSessionId);
  } catch {
    const session = await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId);
    if (session.status !== "expired") return;
  }
  await releaseOrder(order.id, "expired");
}

// Cancels every checkout this cart still has open, so a cart never holds stock
// twice and the shopper can edit it again.
export async function releaseOpenCheckouts(cartId: string) {
  const pending = await getPendingOrdersForCart(cartId);
  await Promise.all(pending.map(cancelPendingOrder));
}

export type StartCheckoutResult = { url: string } | { error: string };

export async function startCheckout(params: {
  cartId: string;
  userId: string | null;
  email: string | null;
}): Promise<StartCheckoutResult> {
  await releaseOpenCheckouts(params.cartId);

  const lines = (await loadCartLines(params.cartId)).filter(
    (line) => line.issue !== "sold-out",
  );
  if (lines.length === 0) return { error: "Your bag is empty." };
  if (lines.some((line) => line.issue)) {
    return { error: "Some pieces in your bag need your attention before you can check out." };
  }

  const items = toOrderItems(lines);
  if (!(await reserveStock(items))) {
    return { error: "Sorry, a piece in your bag has just sold out." };
  }
  const order = await createPendingOrder({
    cartId: params.cartId,
    userId: params.userId,
    email: params.email,
    items,
    shippingCents: SHIPPING_RATE.amountCents,
  });

  const stripe = getStripe();
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: lines.map((line) => ({
          quantity: line.quantity,
          price_data: {
            currency: CHECKOUT_CURRENCY,
            unit_amount: line.unitPriceCents,
            product_data: {
              name: line.name,
              description: line.colour,
              images: [productImageUrl(line.image.src)],
              metadata: { slug: line.slug },
            },
          },
        })),
        shipping_address_collection: { allowed_countries: SHIPPING_COUNTRIES },
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              display_name: SHIPPING_RATE.displayName,
              fixed_amount: { amount: SHIPPING_RATE.amountCents, currency: CHECKOUT_CURRENCY },
              delivery_estimate: {
                minimum: { unit: "business_day", value: SHIPPING_RATE.minBusinessDays },
                maximum: { unit: "business_day", value: SHIPPING_RATE.maxBusinessDays },
              },
            },
          },
        ],
        ...(params.email ? { customer_email: params.email } : {}),
        client_reference_id: order.id,
        metadata: { orderId: order.id },
        payment_intent_data: { metadata: { orderId: order.id } },
        expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_TTL_MINUTES * 60,
        integration_identifier: CHECKOUT_INTEGRATION_ID,
        success_url: `${appUrl("/checkout/success")}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl("/checkout/cancel")}?order=${order.id}`,
      },
      { idempotencyKey: `checkout-${order.id}` },
    );
  } catch (error) {
    console.error("[checkout] Could not create Checkout Session", error);
    await releaseOrder(order.id, "failed");
    return { error: "We couldn’t start checkout. Please try again." };
  }

  if (!(await attachCheckoutSession(order.id, session.id)) || !session.url) {
    // Released by a concurrent request while Stripe was creating the session.
    await stripe.checkout.sessions.expire(session.id).catch(() => {});
    return { error: "We couldn’t start checkout. Please try again." };
  }
  return { url: session.url };
}
