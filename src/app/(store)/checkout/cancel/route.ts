// cancel_url for Stripe Checkout: closes the session right away (rather than
// holding stock until it expires) and returns the shopper to their bag.
import { findCartId } from "@/lib/cart";
import { cancelPendingOrder } from "@/lib/checkout";
import { getOrder } from "@/lib/orders";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order");
  const cartId = await findCartId();

  if (orderId && cartId) {
    const order = await getOrder(orderId).catch(() => null);
    // Only the bag that started the checkout may cancel it.
    if (order && order.cartId === cartId && order.status === "pending") {
      await cancelPendingOrder(order).catch((error) =>
        console.error("[checkout] Could not cancel order", orderId, error),
      );
    }
  }
  return Response.redirect(new URL("/bag?checkout=cancelled", url), 303);
}
