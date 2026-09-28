import Link from "next/link";
import { notFound } from "next/navigation";
import { UserActions } from "@/components/admin/user-actions";
import {
  Badge,
  EmptyState,
  FulfilmentBadge,
  OrderStatusBadge,
  PageHeader,
  Panel,
  StatGrid,
  StatTile,
  table,
} from "@/components/admin/ui";
import { getCustomer } from "@/lib/admin/customers";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { orderReference } from "@/lib/notifications";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Customer" };

export default async function CustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  const { id } = await params;
  const session = await requireAdmin(`/admin/customers/${id}`);
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const isSelf = customer.id === session.user.id;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/customers", label: "Customers" }}
        title={customer.name}
        description={customer.email}
        actions={
          isSelf ? null : (
            <UserActions userId={customer.id} name={customer.name} role={customer.role} banned={customer.banned} />
          )
        }
      />

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          {customer.role === "admin" ? <Badge>Admin</Badge> : <Badge tone="muted">Customer</Badge>}
          {customer.banned ? <Badge tone="sale">Banned</Badge> : <Badge tone="success">Active</Badge>}
          {customer.emailVerified ? <Badge tone="muted">Email verified</Badge> : null}
        </div>
        {customer.banned && customer.banReason ? (
          <p className="text-body-sm text-sale">Ban reason: {customer.banReason}</p>
        ) : null}

        <StatGrid>
          <StatTile label="Lifetime spend" value={formatMoney(customer.spentCents)} detail="Net of refunds" />
          <StatTile label="Orders" value={customer.orderCount} />
          <StatTile
            label="Average order"
            value={formatMoney(customer.orderCount ? Math.round(customer.spentCents / customer.orderCount) : 0)}
          />
          <StatTile
            label="Customer since"
            value={formatDate(customer.createdAt)}
            detail={customer.lastOrderAt ? `Last order ${formatDate(customer.lastOrderAt)}` : "No orders yet"}
          />
        </StatGrid>

        <Panel title="Orders">
          {customer.orders.length === 0 ? (
            <EmptyState title="No orders yet" />
          ) : (
            <table className={table.root}>
              <thead className={table.head}>
                <tr className={table.headRow}>
                  <th scope="col" className={table.th}>Order</th>
                  <th scope="col" className={table.th}>Date</th>
                  <th scope="col" className={table.th}>Status</th>
                  <th scope="col" className={table.thEnd}>Total</th>
                </tr>
              </thead>
              <tbody>
                {customer.orders.map((order) => (
                  <tr key={order.id} className={table.row}>
                    <td className={table.td}>
                      <Link href={`/admin/orders/${order.id}`} className="link font-medium tabular-nums">
                        {orderReference(order.id)}
                      </Link>
                    </td>
                    <td className={`text-ink-muted ${table.td}`}>{formatDateTime(order.createdAt)}</td>
                    <td className={table.td}>
                      <span className="flex flex-wrap gap-1">
                        <OrderStatusBadge status={order.status} />
                        {order.paidAt ? <FulfilmentBadge status={order.fulfilmentStatus} /> : null}
                      </span>
                    </td>
                    <td className={`max-md:text-left ${table.tdEnd}`}>{formatMoney(order.totalCents, order.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </>
  );
}
