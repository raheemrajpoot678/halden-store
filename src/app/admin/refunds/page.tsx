import Link from "next/link";
import { Badge, EmptyState, PageHeader, Pagination, table } from "@/components/admin/ui";
import { listRefunds } from "@/lib/admin/orders";
import { pageParam, withParams } from "@/lib/admin/params";
import { formatDateTime, formatMoney } from "@/lib/format";
import { orderReference } from "@/lib/notifications";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Refunds" };

const REASONS: Record<string, string> = {
  requested_by_customer: "Requested by customer",
  duplicate: "Duplicate",
  fraudulent: "Fraudulent",
};

function statusTone(status: string) {
  if (status === "succeeded") return "success" as const;
  if (status === "failed" || status === "canceled") return "sale" as const;
  return "accent" as const;
}

export default async function RefundsPage({ searchParams }: PageProps<"/admin/refunds">) {
  await requireAdmin("/admin/refunds");
  const params = await searchParams;
  const { rows, total, page, pageCount } = await listRefunds({ page: pageParam(params) });

  return (
    <>
      <PageHeader
        eyebrow="Money"
        title="Refunds"
        description="Refunds issued from an order page or in the Stripe Dashboard. To refund, open the order."
      />

      {rows.length === 0 ? (
        <EmptyState title="No refunds yet">
          <Link href="/admin/orders" className="link">Go to orders</Link>
        </EmptyState>
      ) : (
        <table className={table.root}>
          <thead className={table.head}>
            <tr className={table.headRow}>
              <th scope="col" className={table.th}>Order</th>
              <th scope="col" className={table.th}>Reason</th>
              <th scope="col" className={table.th}>Issued by</th>
              <th scope="col" className={table.th}>Status</th>
              <th scope="col" className={table.thEnd}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((refund) => {
              const pieces = refund.restocked.reduce((sum, line) => sum + line.quantity, 0);
              return (
                <tr key={refund.id} className={table.row}>
                  <td className={table.td}>
                    <Link href={`/admin/orders/${refund.orderId}`} className="link font-medium tabular-nums">
                      {orderReference(refund.orderId)}
                    </Link>
                    <p className="text-ink-muted">{formatDateTime(refund.createdAt)}</p>
                  </td>
                  <td className={`text-ink-muted ${table.td}`}>
                    {refund.reason ? (REASONS[refund.reason] ?? refund.reason) : "—"}
                    {pieces > 0 ? <p>{pieces} restocked</p> : null}
                  </td>
                  <td className={`text-ink-muted ${table.td}`}>{refund.createdByName ?? "Stripe Dashboard"}</td>
                  <td className={table.td}><Badge tone={statusTone(refund.status)}>{refund.status.replace("_", " ")}</Badge></td>
                  <td className={`max-md:text-left ${table.tdEnd}`}>{formatMoney(refund.amountCents, refund.currency)}</td>
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
        href={(p) => withParams("/admin/refunds", params, { page: p })}
      />
    </>
  );
}
