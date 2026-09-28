import Link from "next/link";
import { RevenueChart } from "@/components/admin/revenue-chart";
import {
  EmptyState,
  FulfilmentBadge,
  OrderStatusBadge,
  PageHeader,
  Panel,
  StatGrid,
  StatTile,
} from "@/components/admin/ui";
import {
  countLowStockProducts,
  getLowStockProducts,
  getSeries,
  getSummary,
  rangeStart,
  toChartPoints,
} from "@/lib/admin/analytics";
import { countNewCustomers } from "@/lib/admin/customers";
import { countOrdersToFulfil, getRecentOrders } from "@/lib/admin/orders";
import { formatDateTime, formatMoney } from "@/lib/format";
import { listNotifications, orderReference } from "@/lib/notifications";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  const { user } = await requireAdmin("/admin");

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const monthStart = rangeStart("30d");

  const [todaySummary, monthSummary, series, toFulfil, lowStockCount, lowStock, recentOrders, feed, newCustomers] =
    await Promise.all([
      getSummary(today),
      getSummary(monthStart),
      getSeries("30d"),
      countOrdersToFulfil(),
      countLowStockProducts(),
      getLowStockProducts(),
      getRecentOrders(8),
      listNotifications({ limit: 6 }),
      countNewCustomers(monthStart),
    ]);

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title={`Good to see you, ${user.name.split(" ")[0]}`}
        actions={
          <>
            <Link href="/admin/products/new" className="btn btn-primary btn-sm">
              Add product
            </Link>
            <Link href="/admin/orders?fulfilment=unfulfilled" className="btn btn-secondary btn-sm">
              Orders to fulfil
            </Link>
          </>
        }
      />

      <div className="flex flex-col gap-6">
        <StatGrid>
          <StatTile
            label="Sales today"
            value={formatMoney(todaySummary.grossCents)}
            detail={`${todaySummary.orders} ${todaySummary.orders === 1 ? "order" : "orders"}`}
          />
          <StatTile
            label="Net earnings · 30 days"
            value={formatMoney(monthSummary.netCents)}
            detail={`${formatMoney(monthSummary.grossCents)} gross`}
          />
          <StatTile
            label="Orders to fulfil"
            value={toFulfil}
            tone={toFulfil > 0 ? "sale" : undefined}
            detail={<Link href="/admin/orders?fulfilment=unfulfilled" className="link">View orders</Link>}
          />
          <StatTile
            label="Low stock"
            value={lowStockCount}
            tone={lowStockCount > 0 ? "sale" : undefined}
            detail={`${newCustomers} new ${newCustomers === 1 ? "customer" : "customers"} in 30 days`}
          />
        </StatGrid>

        <Panel>
          <RevenueChart title="Gross sales · last 30 days" points={toChartPoints(series, "30d")} />
        </Panel>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Panel
            title="Recent orders"
            action={<Link href="/admin/orders" className="link-cta">All orders</Link>}
          >
            {recentOrders.length === 0 ? (
              <EmptyState title="No orders yet" />
            ) : (
              <ul className="divide-y">
                {recentOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3 hover:bg-surface sm:grid-cols-[7rem_1fr_auto_auto]"
                    >
                      <span className="font-medium tabular-nums">{orderReference(order.id)}</span>
                      <span className="truncate text-body-sm text-ink-muted max-sm:order-3">
                        {order.email ?? "Guest"} · {formatDateTime(order.createdAt)}
                      </span>
                      <span className="flex gap-1 max-sm:order-4 max-sm:justify-end">
                        <OrderStatusBadge status={order.status} />
                        {order.paidAt ? <FulfilmentBadge status={order.fulfilmentStatus} /> : null}
                      </span>
                      <span className="text-right tabular-nums max-sm:order-2">
                        {formatMoney(order.totalCents, order.currency)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <div className="flex flex-col gap-6">
            <Panel
              title="Notifications"
              action={<Link href="/admin/notifications" className="link-cta">All</Link>}
            >
              {feed.length === 0 ? (
                <p className="text-body-sm text-ink-muted">Nothing new.</p>
              ) : (
                <ul className="divide-y">
                  {feed.map((item) => (
                    <li key={item.id} className="flex flex-col gap-0.5 py-3">
                      <p className={item.readAt ? "text-body-sm" : "text-body-sm font-medium"}>
                        {item.readAt ? null : <span className="mr-2 inline-block size-1.5 bg-accent align-middle" aria-label="Unread" />}
                        {item.title}
                      </p>
                      <p className="text-body-sm text-ink-muted">
                        {item.body ? `${item.body} · ` : ""}
                        {formatDateTime(item.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              title="Low stock"
              action={<Link href="/admin/products?stock=low" className="link-cta">Restock</Link>}
            >
              {lowStock.length === 0 ? (
                <p className="text-body-sm text-ink-muted">Everything is well stocked.</p>
              ) : (
                <ul className="divide-y">
                  {lowStock.map((product) => (
                    <li key={product.id}>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="flex justify-between gap-4 py-3 text-body-sm hover:bg-surface"
                      >
                        <span className="truncate">{product.name}</span>
                        <span className={product.stock === 0 ? "text-sale" : "text-ink-muted"}>
                          {product.stock === 0 ? "Sold out" : `${product.stock} left`}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}
