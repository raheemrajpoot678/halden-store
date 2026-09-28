import Link from "next/link";
import { notFound } from "next/navigation";
import { FulfilmentForm, RefundForm } from "@/components/admin/order-forms";
import { FulfilmentBadge, OrderStatusBadge, PageHeader, Panel } from "@/components/admin/ui";
import { UnsplashImage } from "@/components/unsplash-image";
import { getAdminOrder, restockedQuantities } from "@/lib/admin/orders";
import { formatDateTime, formatMoney } from "@/lib/format";
import { orderReference } from "@/lib/notifications";
import { requireAdmin } from "@/lib/session";
import { stripeDashboardUrl } from "@/lib/stripe";
import { refundOrder, setFulfilment, shipOrder } from "./actions";

export const metadata = { title: "Order" };

const REFUND_REASONS: Record<string, string> = {
  requested_by_customer: "Requested by customer",
  duplicate: "Duplicate",
  fraudulent: "Fraudulent",
};

export default async function OrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/orders/${id}`);
  const order = /^[0-9a-f-]{36}$/.test(id) ? await getAdminOrder(id) : null;
  if (!order) notFound();

  const money = (cents: number) => formatMoney(cents, order.currency);
  const captured = order.paidAt !== null && order.status !== "processing";
  const refundable = order.totalCents - order.refundedCents;
  const canRefund =
    (order.status === "paid" || order.status === "partially_refunded") &&
    refundable > 0 &&
    Boolean(order.stripePaymentIntentId);
  const restocked = restockedQuantities(order);
  const address = order.shippingDetails?.address;
  const pieces = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const timeline = [
    { label: "Order placed", at: order.createdAt },
    order.paidAt ? { label: "Payment received", at: order.paidAt } : null,
    order.shippedAt
      ? { label: `Shipped${order.carrier ? ` via ${order.carrier}` : ""}`, at: order.shippedAt }
      : null,
    order.deliveredAt ? { label: "Delivered", at: order.deliveredAt } : null,
    ...order.refunds.map((refund) => ({
      label: `Refunded ${money(refund.amountCents)}${refund.status !== "succeeded" ? ` (${refund.status})` : ""}`,
      at: refund.createdAt,
    })),
  ]
    .filter((event) => event !== null)
    .sort((a, b) => b.at.getTime() - a.at.getTime());

  return (
    <>
      <PageHeader
        back={{ href: "/admin/orders", label: "Orders" }}
        title={`Order ${orderReference(order.id)}`}
        description={`Placed ${formatDateTime(order.createdAt)} · ${pieces} ${pieces === 1 ? "piece" : "pieces"}`}
        actions={
          <>
            <OrderStatusBadge status={order.status} />
            {captured ? <FulfilmentBadge status={order.fulfilmentStatus} /> : null}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Panel title="Items">
            <ul className="divide-y">
              {order.items.map((item) => (
                <li key={item.productId} className="flex items-center gap-4 py-3">
                  <div className="media-frame w-14 shrink-0">
                    <UnsplashImage src={item.image.src} alt={item.image.alt} fill sizes="56px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${item.slug}`} className="link-quiet block truncate">
                      {item.name}
                    </Link>
                    <p className="text-body-sm text-ink-muted">
                      {item.colour} · {money(item.unitPriceCents)} × {item.quantity}
                      {restocked.get(item.productId) ? ` · ${restocked.get(item.productId)} restocked` : ""}
                    </p>
                  </div>
                  <p className="tabular-nums">{money(item.unitPriceCents * item.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="hairline-strong mt-2 flex flex-col gap-2 pt-4 text-body-sm tabular-nums">
              <div className="flex justify-between"><dt className="text-ink-muted">Subtotal</dt><dd>{money(order.subtotalCents)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Shipping</dt><dd>{order.shippingCents === 0 ? "Free" : money(order.shippingCents)}</dd></div>
              <div className="flex justify-between text-body"><dt>Total</dt><dd>{money(order.totalCents)}</dd></div>
              {order.refundedCents > 0 ? (
                <div className="flex justify-between text-sale"><dt>Refunded</dt><dd>−{money(order.refundedCents)}</dd></div>
              ) : null}
              {order.stripeFeeCents !== null ? (
                <div className="flex justify-between"><dt className="text-ink-muted">Stripe fee</dt><dd>−{money(order.stripeFeeCents)}</dd></div>
              ) : null}
              {captured ? (
                <div className="flex justify-between border-t pt-2 text-body">
                  <dt>Net</dt>
                  <dd>{money(order.totalCents - order.refundedCents - (order.stripeFeeCents ?? 0))}</dd>
                </div>
              ) : null}
            </dl>
          </Panel>

          {captured ? (
            <Panel title="Fulfilment">
              <FulfilmentForm
                status={order.fulfilmentStatus}
                carrier={order.carrier}
                trackingNumber={order.trackingNumber}
                shipAction={shipOrder.bind(null, order.id)}
                setFulfilmentAction={setFulfilment.bind(null, order.id)}
              />
            </Panel>
          ) : null}

          {captured ? (
            <Panel title="Refunds">
              {order.refunds.length > 0 ? (
                <ul className="mb-6 divide-y border-b text-body-sm">
                  {order.refunds.map((refund) => (
                    <li key={refund.id} className="flex flex-wrap justify-between gap-2 py-3">
                      <span>
                        {money(refund.amountCents)}
                        <span className="text-ink-muted">
                          {" "}· {refund.reason ? REFUND_REASONS[refund.reason] ?? refund.reason : "No reason"} ·{" "}
                          {refund.createdByName ?? "Stripe Dashboard"}
                        </span>
                      </span>
                      <span className="text-ink-muted">
                        {refund.status} · {formatDateTime(refund.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {canRefund ? (
                <RefundForm
                  // Remount after each refund so the amount resets to the new balance.
                  key={order.refundedCents}
                  refundableCents={refundable}
                  currency={order.currency}
                  action={refundOrder.bind(null, order.id)}
                  lines={order.items.map((item) => ({
                    productId: item.productId,
                    name: item.name,
                    quantity: item.quantity,
                    restockable: item.quantity - (restocked.get(item.productId) ?? 0),
                  }))}
                />
              ) : (
                <p className="text-body-sm text-ink-muted">
                  {refundable <= 0
                    ? "This order has been refunded in full."
                    : "This order has no Stripe payment to refund (e.g. sample data)."}
                </p>
              )}
            </Panel>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Customer">
            <div className="flex flex-col gap-1 text-body-sm">
              {order.customer ? (
                <Link href={`/admin/customers/${order.customer.id}`} className="link">
                  {order.customer.name}
                </Link>
              ) : (
                <p>Guest checkout</p>
              )}
              <p className="break-all text-ink-muted">{order.email ?? order.customer?.email ?? "No email"}</p>
            </div>
          </Panel>

          <Panel title="Shipping address">
            {address ? (
              <address className="text-body-sm not-italic">
                {[
                  order.shippingDetails?.name,
                  address.line1,
                  address.line2,
                  [address.city, address.state, address.postal_code].filter(Boolean).join(", "),
                  address.country,
                ]
                  .filter(Boolean)
                  .map((line) => <span key={line} className="block">{line}</span>)}
              </address>
            ) : (
              <p className="text-body-sm text-ink-muted">Not collected yet.</p>
            )}
            {order.trackingNumber ? (
              <p className="mt-3 text-body-sm">
                <span className="text-ink-muted">Tracking:</span> {order.carrier ? `${order.carrier} ` : ""}
                {order.trackingNumber}
              </p>
            ) : null}
          </Panel>

          <Panel title="Payment">
            <dl className="flex flex-col gap-2 text-body-sm">
              <div className="flex justify-between gap-4"><dt className="text-ink-muted">Status</dt><dd><OrderStatusBadge status={order.status} /></dd></div>
              {order.stripePaymentIntentId ? (
                <div className="flex flex-col gap-1">
                  <dt className="text-ink-muted">Stripe payment</dt>
                  <dd>
                    <a
                      href={stripeDashboardUrl(`payments/${order.stripePaymentIntentId}`)}
                      target="_blank"
                      rel="noreferrer"
                      className="link break-all"
                    >
                      {order.stripePaymentIntentId}
                    </a>
                  </dd>
                </div>
              ) : null}
              <div className="flex flex-col gap-1">
                <dt className="text-ink-muted">Order id</dt>
                <dd className="break-all">{order.id}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Timeline">
            <ol className="flex flex-col gap-3 border-l pl-4 text-body-sm">
              {timeline.map((event, index) => (
                <li key={index} className="relative">
                  <span className="absolute top-2 -left-[1.28rem] size-1.5 bg-ink" aria-hidden="true" />
                  <p>{event.label}</p>
                  <p className="text-ink-muted">{formatDateTime(event.at)}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </>
  );
}
