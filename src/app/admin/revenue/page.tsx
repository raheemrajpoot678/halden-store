import Link from "next/link";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { EmptyState, PageHeader, Panel, StatGrid, StatTile, table } from "@/components/admin/ui";
import {
  getSeries,
  getSummary,
  getTopProducts,
  parseRange,
  previousRangeStart,
  RANGES,
  rangeStart,
  toChartPoints,
  type RangeKey,
} from "@/lib/admin/analytics";
import { param } from "@/lib/admin/params";
import { formatMoney } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Revenue" };

function change(current: number, previous: number) {
  if (previous === 0) return null;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}% vs previous period`;
}

export default async function RevenuePage({ searchParams }: PageProps<"/admin/revenue">) {
  await requireAdmin("/admin/revenue");
  const range = parseRange(param(await searchParams, "range"));
  const since = rangeStart(range);
  const previousSince = previousRangeStart(range);

  const [summary, previous, series, topProducts] = await Promise.all([
    getSummary(since),
    getSummary(previousSince, since),
    getSeries(range),
    getTopProducts(since, 8),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Money"
        title="Revenue & earnings"
        description="Gross sales are counted when an order is paid, refunds when they’re issued. Net earnings are what you keep after refunds and Stripe fees."
      />

      <nav aria-label="Period" className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(RANGES) as RangeKey[]).map((key) => (
          <Link
            key={key}
            href={key === "30d" ? "/admin/revenue" : `/admin/revenue?range=${key}`}
            aria-current={key === range ? "page" : undefined}
            className={`btn btn-sm ${key === range ? "btn-primary" : "btn-secondary"}`}
          >
            {RANGES[key].label}
          </Link>
        ))}
      </nav>

      <div className="flex flex-col gap-6">
        <StatGrid>
          <StatTile
            label="Gross sales"
            value={formatMoney(summary.grossCents)}
            detail={change(summary.grossCents, previous.grossCents) ?? `${summary.orders} orders`}
          />
          <StatTile
            label="Refunds"
            value={summary.refundsCents > 0 ? `−${formatMoney(summary.refundsCents)}` : formatMoney(0)}
            tone={summary.refundsCents > 0 ? "sale" : undefined}
            detail={
              summary.grossCents > 0
                ? `${((summary.refundsCents / summary.grossCents) * 100).toFixed(1)}% of gross`
                : undefined
            }
          />
          <StatTile
            label="Stripe fees"
            value={summary.feesCents > 0 ? `−${formatMoney(summary.feesCents)}` : formatMoney(0)}
            detail={
              summary.ordersMissingFee > 0
                ? `${summary.ordersMissingFee} ${summary.ordersMissingFee === 1 ? "fee" : "fees"} not reported yet`
                : undefined
            }
          />
          <StatTile
            label="Net earnings"
            value={formatMoney(summary.netCents)}
            tone="success"
            detail={change(summary.netCents, previous.netCents) ?? undefined}
          />
        </StatGrid>

        <StatGrid>
          <StatTile label="Orders" value={summary.orders} detail={change(summary.orders, previous.orders) ?? undefined} />
          <StatTile label="Average order" value={formatMoney(summary.averageOrderCents)} />
        </StatGrid>

        <Panel>
          <RevenueChart title={`Gross sales · ${RANGES[range].label.toLowerCase()}`} points={toChartPoints(series, range)} />
        </Panel>

        <Panel title="Top products">
          {topProducts.length === 0 ? (
            <EmptyState title="No sales in this period" />
          ) : (
            <table className={table.root}>
              <thead className={table.head}>
                <tr className={table.headRow}>
                  <th scope="col" className={table.th}>Product</th>
                  <th scope="col" className={table.thEnd}>Sold</th>
                  <th scope="col" className={table.thEnd}>Gross</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product) => (
                  <tr key={product.productId} className={table.row}>
                    <td className={`col-span-2 ${table.td}`}>
                      <Link href={`/admin/products/${product.productId}`} className="link-quiet">
                        {product.name}
                      </Link>
                    </td>
                    <td className={`max-md:text-left ${table.tdEnd} md:pr-4`}>
                      {product.quantity} <span className="md:hidden">sold</span>
                    </td>
                    <td className={`${table.tdEnd}`}>{formatMoney(product.revenueCents)}</td>
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
