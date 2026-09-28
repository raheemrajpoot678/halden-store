import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type Stripe from "stripe";
import { formatPrice } from "@/lib/format";
import { getOrder, markOrderPaid } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";
import { CartRefresh } from "@/components/cart/cart-refresh";
import { UnsplashImage } from "@/components/unsplash-image";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

async function retrieveSession(sessionId: string) {
  try {
    return await getStripe().checkout.sessions.retrieve(sessionId);
  } catch {
    return null;
  }
}

export default async function CheckoutSuccessPage({
  searchParams,
}: PageProps<"/checkout/success">) {
  const { session_id: sessionId } = await searchParams;
  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) notFound();

  const session: Stripe.Checkout.Session | null = await retrieveSession(sessionId);
  const orderId = session?.metadata?.orderId;
  if (!session || !orderId) notFound();

  // The webhook records payment too; doing it here as well (idempotently)
  // means this page never shows a paid order as pending.
  if (session.status === "complete" && session.payment_status !== "unpaid") {
    await markOrderPaid(orderId, session);
  }
  const order = await getOrder(orderId);
  if (!order) notFound();

  const paid = order.paidAt !== null;
  const address = order.shippingDetails?.address;
  const addressLines = address
    ? [
        order.shippingDetails?.name,
        address.line1,
        address.line2,
        [address.city, address.state, address.postal_code].filter(Boolean).join(", "),
        address.country,
      ].filter(Boolean)
    : [];

  return (
    <div className="container-prose section flex flex-col gap-block">
      <CartRefresh />
      <header className="flex flex-col gap-3">
        <p className="eyebrow text-ink-subtle">
          Order {order.id.slice(0, 8).toUpperCase()}
        </p>
        <h1 className="text-heading">
          {paid ? "Thank you for your order" : "Your payment is processing"}
        </h1>
        <p className="text-lead text-ink-muted">
          {paid
            ? `We’ll send a confirmation${order.email ? ` to ${order.email}` : ""} and let you know when your pieces are on their way.`
            : "We’ll confirm your order as soon as your payment clears."}
        </p>
      </header>

      <section aria-labelledby="items-heading" className="flex flex-col gap-4">
        <h2 id="items-heading" className="ui-label">
          Items
        </h2>
        <ul className="hairline-strong">
          {order.items.map((item) => (
            <li
              key={item.productId}
              className="grid grid-cols-[5rem_1fr] gap-4 border-b py-5 md:grid-cols-[6rem_1fr] md:gap-6"
            >
              <Link href={`/products/${item.slug}`} className="media-frame block">
                <UnsplashImage
                  src={item.image.src}
                  alt={item.image.alt}
                  fill
                  sizes="(min-width: 48rem) 6rem, 5rem"
                />
              </Link>
              <div className="flex items-start justify-between gap-4 text-body-sm">
                <div className="flex min-w-0 flex-col gap-1">
                  <Link href={`/products/${item.slug}`} className="link-quiet">
                    {item.name}
                  </Link>
                  <p className="text-ink-muted">{item.colour}</p>
                  <p className="text-ink-muted">Qty {item.quantity}</p>
                </div>
                <p>{formatPrice(item.unitPriceCents * item.quantity)}</p>
              </div>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-3 text-body-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Subtotal</dt>
            <dd>{formatPrice(order.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Shipping</dt>
            <dd>
              {order.shippingCents === 0 ? "Complimentary" : formatPrice(order.shippingCents)}
            </dd>
          </div>
          <div className="hairline-strong flex justify-between gap-4 pt-4 text-body">
            <dt>Total</dt>
            <dd>{formatPrice(order.totalCents)}</dd>
          </div>
        </dl>
      </section>

      {addressLines.length > 0 && (
        <section aria-labelledby="shipping-heading" className="flex flex-col gap-4">
          <h2 id="shipping-heading" className="ui-label">
            Shipping to
          </h2>
          <address className="text-body-sm not-italic text-ink-muted">
            {addressLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
        </section>
      )}

      <div className="flex flex-col gap-3 md:flex-row">
        <Link href="/collections/new-in" className="btn btn-primary btn-block">
          Continue shopping
        </Link>
        {order.userId && (
          <Link href="/account" className="btn btn-secondary btn-block">
            View your orders
          </Link>
        )}
      </div>
    </div>
  );
}
