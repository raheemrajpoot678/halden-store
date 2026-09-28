import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, PageHeader, Panel, StatGrid, StatTile, table } from "@/components/admin/ui";
import { getOrderIdsByPaymentIntent } from "@/lib/admin/orders";
import { getPayout, paymentIntentOfTransaction, payoutTone } from "@/lib/admin/payouts";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { orderReference } from "@/lib/notifications";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Payout" };

const TYPE_LABELS: Record<string, string> = {
  charge: "Payment",
  payment: "Payment",
  refund: "Refund",
  payment_refund: "Refund",
  adjustment: "Adjustment",
  stripe_fee: "Stripe fee",
  payout: "Payout",
};

export default async function PayoutPage({ params }: PageProps<"/admin/payouts/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/payouts/${id}`);
  if (!/^po_[A-Za-z0-9]+$/.test(id)) notFound();

  const detail = await getPayout(id);
  if (!detail) notFound();
  const { payout, transactions, hasMoreTransactions } = detail;

  // Everything in the payout except the payout's own (negative) entry.
  const entries = transactions.filter((transaction) => transaction.type !== "payout");
  const orderIds = await getOrderIdsByPaymentIntent(
    entries.map(paymentIntentOfTransaction).filter((value): value is string => value !== null),
  );
  const totals = entries.reduce(
    (sum, transaction) => ({
      gross: sum.gross + transaction.amount,
      fees: sum.fees + transaction.fee,
    }),
    { gross: 0, fees: 0 },
  );

  return (
    <>
      <PageHeader
        back={{ href: "/admin/payouts", label: "Payouts" }}
        title={formatMoney(payout.amount, payout.currency)}
        description={`Arriving ${formatDate(payout.arrival_date * 1000)} · ${payout.id}`}
        actions={<Badge tone={payoutTone(payout.status)}>{payout.status.replace("_", " ")}</Badge>}
      />

      <div className="flex flex-col gap-6">
        <StatGrid>
          <StatTile label="Gross" value={formatMoney(totals.gross, payout.currency)} detail="Payments less refunds" />
          <StatTile label="Fees" value={`−${formatMoney(totals.fees, payout.currency)}`} />
          <StatTile label="Paid out" value={formatMoney(payout.amount, payout.currency)} tone="success" />
          <StatTile label="Transactions" value={entries.length} />
        </StatGrid>

        {payout.failure_message ? (
          <p role="alert" className="border border-sale px-5 py-4 text-body-sm text-sale">
            {payout.failure_message}
          </p>
        ) : null}

        <Panel title="Included in this payout">
          {entries.length === 0 ? (
            <p className="text-body-sm text-ink-muted">
              Stripe hasn’t itemised this payout (manual payouts aren’t broken down by transaction).
            </p>
          ) : (
            <table className={table.root}>
              <thead className={table.head}>
                <tr className={table.headRow}>
                  <th scope="col" className={table.th}>Type</th>
                  <th scope="col" className={table.th}>Order</th>
                  <th scope="col" className={table.thEnd}>Amount</th>
                  <th scope="col" className={table.thEnd}>Fee</th>
                  <th scope="col" className={table.thEnd}>Net</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((transaction) => {
                  const intent = paymentIntentOfTransaction(transaction);
                  const orderId = intent ? orderIds.get(intent) : undefined;
                  return (
                    <tr key={transaction.id} className={table.row}>
                      <td className={table.td}>
                        {TYPE_LABELS[transaction.type] ?? transaction.type.replaceAll("_", " ")}
                        <p className="text-ink-muted">{formatDateTime(transaction.created * 1000)}</p>
                      </td>
                      <td className={table.td}>
                        {orderId ? (
                          <Link href={`/admin/orders/${orderId}`} className="link tabular-nums">
                            {orderReference(orderId)}
                          </Link>
                        ) : (
                          <span className="text-ink-subtle">—</span>
                        )}
                      </td>
                      <td className={`max-md:text-left ${table.tdEnd} md:pr-4`}>{formatMoney(transaction.amount, transaction.currency)}</td>
                      <td className={`max-md:text-left ${table.tdEnd} md:pr-4`}>{formatMoney(-transaction.fee, transaction.currency)}</td>
                      <td className={`max-md:text-left ${table.tdEnd}`}>{formatMoney(transaction.net, transaction.currency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {hasMoreTransactions ? (
            <p className="mt-4 text-body-sm text-ink-muted">Showing the first 100 transactions.</p>
          ) : null}
        </Panel>
      </div>
    </>
  );
}
