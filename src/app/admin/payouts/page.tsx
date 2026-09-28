import Link from "next/link";
import { Badge, EmptyState, PageHeader, StatGrid, StatTile, table } from "@/components/admin/ui";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { param } from "@/lib/admin/params";
import { getBalance, listPayouts, payoutTone } from "@/lib/admin/payouts";
import { formatDate, formatMoney } from "@/lib/format";
import { requireAdmin } from "@/lib/session";
import { stripeDashboardUrl } from "@/lib/stripe";

export const metadata = { title: "Payouts" };

const STRIPE_ID = /^po_[A-Za-z0-9]+$/;

export default async function PayoutsPage({ searchParams }: PageProps<"/admin/payouts">) {
  await requireAdmin("/admin/payouts");
  const params = await searchParams;
  const after = param(params, "after");
  const before = param(params, "before");

  let data;
  try {
    data = await Promise.all([
      getBalance(),
      listPayouts({
        startingAfter: after && STRIPE_ID.test(after) ? after : undefined,
        endingBefore: before && STRIPE_ID.test(before) ? before : undefined,
      }),
    ]);
  } catch (error) {
    console.error("[admin/payouts] Stripe request failed", error);
    return (
      <>
        <PageHeader eyebrow="Money" title="Payouts" />
        <EmptyState title="Couldn’t reach Stripe">
          Check STRIPE_SECRET_KEY and try again.
        </EmptyState>
      </>
    );
  }
  const [balance, { payouts, hasMore }] = data;
  const paging = Boolean(after || before);

  return (
    <>
      <PageHeader
        eyebrow="Money"
        title="Payouts"
        description="Stripe pays your available balance out to your bank account on its payout schedule. Figures come live from Stripe."
        actions={
          <a href={stripeDashboardUrl("payouts")} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
            Open in Stripe
          </a>
        }
      />

      <div className="flex flex-col gap-6">
        <StatGrid>
          {balance.available.map((amount) => (
            <StatTile
              key={`a-${amount.currency}`}
              label={`Available · ${amount.currency.toUpperCase()}`}
              value={formatMoney(amount.amountCents, amount.currency)}
              detail="Ready for the next payout"
            />
          ))}
          {balance.pending.map((amount) => (
            <StatTile
              key={`p-${amount.currency}`}
              label={`Pending · ${amount.currency.toUpperCase()}`}
              value={formatMoney(amount.amountCents, amount.currency)}
              detail="Settling from recent payments"
            />
          ))}
        </StatGrid>

        <section>
          <h2 className="ui-label mb-4">Payout history</h2>
          {payouts.length === 0 ? (
            <EmptyState title="No payouts yet">
              Payouts appear here once Stripe sends money to your bank.
            </EmptyState>
          ) : (
            <table className={table.root}>
              <thead className={table.head}>
                <tr className={table.headRow}>
                  <th scope="col" className={table.th}>Arrival</th>
                  <th scope="col" className={table.th}>Status</th>
                  <th scope="col" className={table.th}>Method</th>
                  <th scope="col" className={table.thEnd}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout.id} className={table.row}>
                    <td className={table.td}>
                      <Link href={`/admin/payouts/${payout.id}`} className="link">
                        {formatDate(payout.arrival_date * 1000)}
                      </Link>
                      <p className="text-ink-muted">Created {formatDate(payout.created * 1000)}</p>
                    </td>
                    <td className={table.td}>
                      <Badge tone={payoutTone(payout.status)}>{payout.status.replace("_", " ")}</Badge>
                    </td>
                    <td className={`text-ink-muted ${table.td}`}>
                      {payout.method === "instant" ? "Instant" : "Standard"}
                      {payout.automatic ? " · automatic" : " · manual"}
                    </td>
                    <td className={`max-md:text-left ${table.tdEnd}`}>{formatMoney(payout.amount, payout.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {paging || hasMore ? (
            <nav aria-label="Pagination" className="mt-6 flex justify-end gap-2">
              {paging && payouts.length > 0 ? (
                <Link href={`/admin/payouts?before=${payouts[0].id}`} className="btn btn-secondary btn-sm" aria-label="Newer payouts">
                  <ChevronLeftIcon width={16} height={16} />
                </Link>
              ) : null}
              {(before || hasMore) && payouts.length > 0 ? (
                <Link
                  href={`/admin/payouts?after=${payouts[payouts.length - 1].id}`}
                  className="btn btn-secondary btn-sm"
                  aria-label="Older payouts"
                >
                  <ChevronRightIcon width={16} height={16} />
                </Link>
              ) : null}
            </nav>
          ) : null}
        </section>
      </div>
    </>
  );
}
