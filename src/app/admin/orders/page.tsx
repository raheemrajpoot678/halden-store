import Link from "next/link";
import {
  EmptyState,
  FilterBar,
  FULFILMENT_LABELS,
  FulfilmentBadge,
  ORDER_STATUS_LABELS,
  OrderStatusBadge,
  PageHeader,
  Pagination,
  table,
} from "@/components/admin/ui";
import { FULFILMENT_STATUSES, ORDER_STATUSES } from "@/db/schema";
import { listAdminOrders } from "@/lib/admin/orders";
import { oneOf, pageParam, param, withParams } from "@/lib/admin/params";
import { formatDateTime, formatMoney } from "@/lib/format";
import { orderReference } from "@/lib/notifications";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin("/admin/orders");
  const params = await searchParams;
  const query = param(params, "q") ?? "";
  const status = oneOf(param(params, "status"), ORDER_STATUSES);
  const fulfilment = oneOf(param(params, "fulfilment"), FULFILMENT_STATUSES);
  const { rows, total, page, pageCount } = await listAdminOrders({
    query,
    status,
    fulfilment,
    page: pageParam(params),
  });

  return (
    <>
      <PageHeader
        eyebrow="Store"
        title="Orders"
        description="Paid, processing and failed orders. Abandoned checkouts are hidden unless you filter for them."
      />

      <FilterBar action="/admin/orders" hasFilters={Boolean(query || status || fulfilment)}>
        <div className="md:w-72">
          <label htmlFor="q" className="field-label">Search</label>
          <input id="q" name="q" type="search" defaultValue={query} placeholder="Order number, email or name" className="field" />
        </div>
        <div className="md:w-48">
          <label htmlFor="status" className="field-label">Payment</label>
          <select id="status" name="status" defaultValue={status ?? ""} className="field">
            <option value="">All but abandoned</option>
            {ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>{ORDER_STATUS_LABELS[value]}</option>
            ))}
          </select>
        </div>
        <div className="md:w-48">
          <label htmlFor="fulfilment" className="field-label">Fulfilment</label>
          <select id="fulfilment" name="fulfilment" defaultValue={fulfilment ?? ""} className="field">
            <option value="">All</option>
            {FULFILMENT_STATUSES.map((value) => (
              <option key={value} value={value}>{FULFILMENT_LABELS[value]}</option>
            ))}
          </select>
        </div>
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState title="No orders match">Orders appear here once a customer completes checkout.</EmptyState>
      ) : (
        <table className={table.root}>
          <thead className={table.head}>
            <tr className={table.headRow}>
              <th scope="col" className={table.th}>Order</th>
              <th scope="col" className={table.th}>Customer</th>
              <th scope="col" className={table.th}>Payment</th>
              <th scope="col" className={table.th}>Fulfilment</th>
              <th scope="col" className={table.thEnd}>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((order) => {
              const pieces = order.items.reduce((sum, item) => sum + item.quantity, 0);
              return (
                <tr key={order.id} className={table.row}>
                  <td className={table.td}>
                    <Link href={`/admin/orders/${order.id}`} className="link font-medium tabular-nums">
                      {orderReference(order.id)}
                    </Link>
                    <p className="text-ink-muted">{formatDateTime(order.createdAt)}</p>
                  </td>
                  <td className={`min-w-0 ${table.td}`}>
                    <p className="truncate">{order.customerName ?? order.shippingDetails?.name ?? "Guest"}</p>
                    <p className="truncate text-ink-muted">{order.email ?? "—"}</p>
                  </td>
                  <td className={table.td}><OrderStatusBadge status={order.status} /></td>
                  <td className={table.td}>
                    {order.paidAt ? <FulfilmentBadge status={order.fulfilmentStatus} /> : <span className="text-ink-subtle">—</span>}
                  </td>
                  <td className={`max-md:text-left ${table.tdEnd}`}>
                    {formatMoney(order.totalCents, order.currency)}
                    <p className="text-ink-muted">
                      {pieces} {pieces === 1 ? "piece" : "pieces"}
                      {order.refundedCents > 0 ? ` · −${formatMoney(order.refundedCents, order.currency)}` : ""}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <Pagination
        page={page}
        pageCount={pageCount}
        total={total}
        href={(p) => withParams("/admin/orders", params, { page: p })}
      />
    </>
  );
}
