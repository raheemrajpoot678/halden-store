// Stripe webhook: records Checkout results, refunds and fees on orders. Every
// handler is idempotent (status-guarded or recomputed), so Stripe's retries are
// safe; a 500 asks Stripe to retry later.
//
// Events to enable: checkout.session.completed, .async_payment_succeeded,
// .async_payment_failed, .expired; refund.created, refund.updated,
// charge.refunded; charge.succeeded, charge.updated.
import type Stripe from "stripe";
import { markOrderPaid, markOrderProcessing, releaseOrder } from "@/lib/orders";
import { recordStripeFee, syncRefund } from "@/lib/refunds";
import { getStripe, getWebhookSecret } from "@/lib/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    // Signature verification needs the raw, unparsed body.
    event = getStripe().webhooks.constructEvent(
      await request.text(),
      signature,
      getWebhookSecret(),
    );
  } catch (error) {
    console.error("[stripe webhook] Signature verification failed", error);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    await handleEvent(event);
  } catch (error) {
    console.error(`[stripe webhook] Failed to handle ${event.type} ${event.id}`, error);
    return new Response("Webhook handler failed", { status: 500 });
  }
  return Response.json({ received: true });
}

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      if (!orderId) return;
      // Delayed payment methods complete the session before the money arrives.
      if (session.payment_status === "unpaid") await markOrderProcessing(orderId);
      else await markOrderPaid(orderId, session);
      return;
    }
    case "checkout.session.async_payment_failed": {
      const orderId = event.data.object.metadata?.orderId;
      if (orderId) await releaseOrder(orderId, "failed");
      return;
    }
    case "checkout.session.expired": {
      const orderId = event.data.object.metadata?.orderId;
      if (orderId) await releaseOrder(orderId, "expired");
      return;
    }
    // Covers refunds made in the Stripe Dashboard as well as from admin.
    case "refund.created":
    case "refund.updated": {
      await syncRefund(event.data.object);
      return;
    }
    // Fallback for accounts whose endpoint only sends charge.refunded.
    case "charge.refunded": {
      const refunds = event.data.object.refunds?.data ?? [];
      for (const refund of refunds) await syncRefund(refund);
      return;
    }
    case "charge.succeeded":
    case "charge.updated": {
      await recordStripeFee(event.data.object);
      return;
    }
  }
}
