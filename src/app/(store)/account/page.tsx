import type { Metadata } from "next";
import Link from "next/link";
import { formatMoney, formatPrice } from "@/lib/format";
import { getOrdersForUser, type Order } from "@/lib/orders";
import { isAdmin, requireSession } from "@/lib/session";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false },
};

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "long" });

function orderProgress(order: Order) {
  if (order.status === "processing") return "Payment processing";
  if (order.status === "refunded") return "Refunded";
  if (order.fulfilmentStatus === "delivered") return "Delivered";
  if (order.fulfilmentStatus === "shipped") return "Shipped";
  return "Preparing your order";
}

export default async function AccountPage() {
  const { user } = await requireSession("/account");
  const firstName = user.name.split(" ")[0];
  const orders = await getOrdersForUser(user.id);

  const details = [
    { label: "Name", value: user.name },
    { label: "Email", value: user.email },
    { label: "Account type", value: isAdmin(user) ? "Administrator" : "Customer" },
    { label: "Member since", value: dateFormat.format(user.createdAt) },
  ];

  return (
    <div className="container-prose section flex flex-col gap-block">
      <header className="flex flex-col gap-3">
        <p className="eyebrow text-ink-subtle">My account</p>
        <h1 className="text-heading">Welcome, {firstName}</h1>
      </header>

      <section aria-labelledby="details-heading" className="flex flex-col gap-4">
        <h2 id="details-heading" className="ui-label">
          Account details
        </h2>
        <dl className="hairline-strong divide-y">
          {details.map((item) => (
            <div
              key={item.label}
              className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:items-baseline sm:gap-6"
            >
              <dt className="text-body-sm text-ink-muted">{item.label}</dt>
              <dd className="break-words">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="orders-heading" className="flex flex-col gap-4">
        <h2 id="orders-heading" className="ui-label">
          Orders
        </h2>
        {orders.length === 0 ? (
          <p className="hairline-strong pt-4 text-body-sm text-ink-muted">
            You haven’t placed any orders yet.
          </p>
        ) : (
          <ul className="hairline-strong divide-y">
            {orders.map((order) => {
              const pieces = order.items.reduce((sum, item) => sum + item.quantity, 0);
              return (
                <li
                  key={order.id}
                  className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr_auto] sm:items-baseline sm:gap-6"
                >
                  <p className="text-body-sm text-ink-muted">
                    {dateFormat.format(order.createdAt)}
                  </p>
                  <div className="flex min-w-0 flex-col gap-1">
                    <p>Order {order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-body-sm text-ink-muted">
                      {pieces} {pieces === 1 ? "piece" : "pieces"} · {orderProgress(order)}
                    </p>
                    {order.trackingNumber && order.fulfilmentStatus !== "unfulfilled" ? (
                      <p className="text-body-sm text-ink-muted">
                        Tracking: {order.carrier ? `${order.carrier} ` : ""}
                        {order.trackingNumber}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col sm:items-end">
                    <p>{formatPrice(order.totalCents)}</p>
                    {order.refundedCents > 0 ? (
                      <p className="text-body-sm text-ink-muted">
                        {formatMoney(order.refundedCents)} refunded
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="flex flex-col gap-3 md:flex-row">
        {isAdmin(user) ? (
          <Link href="/admin" className="btn btn-primary btn-block">
            Admin dashboard
          </Link>
        ) : (
          <Link href="/collections/new-in" className="btn btn-primary btn-block">
            Continue shopping
          </Link>
        )}
        <SignOutButton />
      </div>
    </div>
  );
}
