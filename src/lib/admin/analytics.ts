// Revenue and earnings figures. Gross sales and fees are counted when an order
// is paid; refunds when they're issued; net earnings = gross − refunds − fees.
// All amounts are USD cents (the store's only currency).
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { LOW_STOCK_THRESHOLD } from "@/lib/stock";

export const RANGES = {
  "7d": { label: "Last 7 days", days: 7, bucket: "day" },
  "30d": { label: "Last 30 days", days: 30, bucket: "day" },
  "90d": { label: "Last 90 days", days: 90, bucket: "week" },
  "12m": { label: "Last 12 months", days: 365, bucket: "month" },
} as const;
export type RangeKey = keyof typeof RANGES;

export function parseRange(value: unknown): RangeKey {
  return typeof value === "string" && value in RANGES ? (value as RangeKey) : "30d";
}

export function rangeStart(key: RangeKey, now = new Date()) {
  const { days, bucket } = RANGES[key];
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  if (bucket === "month") start.setUTCDate(1);
  return start;
}

// The equally long period just before the current one, for comparisons.
export function previousRangeStart(key: RangeKey, now = new Date()) {
  const start = rangeStart(key, now);
  return new Date(start.getTime() - (now.getTime() - start.getTime()));
}

const paid = sql.raw(`status in ('paid', 'partially_refunded', 'refunded')`);
const liveRefund = sql.raw(`status not in ('failed', 'canceled')`);

export type Summary = {
  grossCents: number;
  refundsCents: number;
  feesCents: number;
  netCents: number;
  orders: number;
  averageOrderCents: number;
  // Paid orders whose fee isn't known yet (net is then slightly overstated).
  ordersMissingFee: number;
};

export async function getSummary(since: Date, until?: Date): Promise<Summary> {
  const from = since.toISOString();
  const to = (until ?? new Date("9999-12-31T00:00:00Z")).toISOString();
  const result = await db.execute(sql`
    select
      (select coalesce(sum(total_cents), 0) from orders
        where ${paid} and paid_at >= ${from} and paid_at < ${to})::bigint as gross,
      (select count(*) from orders
        where ${paid} and paid_at >= ${from} and paid_at < ${to})::int as orders,
      (select coalesce(sum(stripe_fee_cents), 0) from orders
        where ${paid} and paid_at >= ${from} and paid_at < ${to})::bigint as fees,
      (select count(*) from orders
        where ${paid} and paid_at >= ${from} and paid_at < ${to}
          and stripe_fee_cents is null and stripe_payment_intent_id is not null)::int as missing_fee,
      (select coalesce(sum(amount_cents), 0) from refunds
        where ${liveRefund} and created_at >= ${from} and created_at < ${to})::bigint as refunds
  `);
  const row = result.rows[0] as Record<string, string | number>;
  const grossCents = Number(row.gross);
  const refundsCents = Number(row.refunds);
  const feesCents = Number(row.fees);
  const orders = Number(row.orders);
  return {
    grossCents,
    refundsCents,
    feesCents,
    netCents: grossCents - refundsCents - feesCents,
    orders,
    averageOrderCents: orders > 0 ? Math.round(grossCents / orders) : 0,
    ordersMissingFee: Number(row.missing_fee),
  };
}

export type SeriesPoint = { start: Date; grossCents: number; refundsCents: number; orders: number };

// One point per day/week/month bucket (UTC), including empty ones.
export async function getSeries(key: RangeKey): Promise<SeriesPoint[]> {
  const bucket = RANGES[key].bucket;
  const from = rangeStart(key).toISOString();
  const result = await db.execute(sql`
    with buckets as (
      select generate_series(
        date_trunc(${bucket}, ${from}::timestamptz at time zone 'UTC'),
        date_trunc(${bucket}, now() at time zone 'UTC'),
        ('1 ' || ${bucket})::interval
      ) as start
    ),
    sales as (
      select date_trunc(${bucket}, paid_at at time zone 'UTC') as start,
        sum(total_cents) as gross, count(*) as orders
      from orders where ${paid} and paid_at >= ${from}
      group by 1
    ),
    refunded as (
      select date_trunc(${bucket}, created_at at time zone 'UTC') as start, sum(amount_cents) as refunds
      from refunds where ${liveRefund} and created_at >= ${from}
      group by 1
    )
    select to_char(b.start, 'YYYY-MM-DD') as start,
      coalesce(s.gross, 0)::bigint as gross,
      coalesce(r.refunds, 0)::bigint as refunds,
      coalesce(s.orders, 0)::int as orders
    from buckets b
    left join sales s on s.start = b.start
    left join refunded r on r.start = b.start
    order by b.start
  `);
  return (result.rows as { start: string; gross: string; refunds: string; orders: number }[]).map(
    (row) => ({
      start: new Date(`${row.start}T00:00:00Z`),
      grossCents: Number(row.gross),
      refundsCents: Number(row.refunds),
      orders: Number(row.orders),
    }),
  );
}

export type TopProduct = {
  productId: number;
  name: string;
  slug: string;
  quantity: number;
  revenueCents: number;
};

export async function getTopProducts(since: Date, limit = 5): Promise<TopProduct[]> {
  const result = await db.execute(sql`
    select x."productId" as product_id,
      (array_agg(x.name order by o.paid_at desc))[1] as name,
      (array_agg(x.slug order by o.paid_at desc))[1] as slug,
      sum(x.quantity)::int as quantity,
      sum(x.quantity * x."unitPriceCents")::bigint as revenue
    from orders o,
      jsonb_to_recordset(o.items) as x("productId" int, name text, slug text, quantity int, "unitPriceCents" int)
    where o.status in ('paid', 'partially_refunded', 'refunded') and o.paid_at >= ${since.toISOString()}
    group by x."productId"
    order by revenue desc
    limit ${limit}
  `);
  return (
    result.rows as { product_id: number; name: string; slug: string; quantity: number; revenue: string }[]
  ).map((row) => ({
    productId: row.product_id,
    name: row.name,
    slug: row.slug,
    quantity: row.quantity,
    revenueCents: Number(row.revenue),
  }));
}

export async function getLowStockProducts(limit = 6) {
  const result = await db.execute(sql`
    select id, name, slug, stock from products
    where status = 'active' and stock <= ${LOW_STOCK_THRESHOLD}
    order by stock asc, name asc
    limit ${limit}
  `);
  return result.rows as { id: number; name: string; slug: string; stock: number }[];
}

export async function countLowStockProducts() {
  const result = await db.execute(sql`
    select count(*)::int as value from products
    where status = 'active' and stock <= ${LOW_STOCK_THRESHOLD}
  `);
  return (result.rows[0] as { value: number }).value;
}

const bucketLabels = {
  day: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
  week: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
  month: new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" }),
};

export function toChartPoints(series: SeriesPoint[], key: RangeKey) {
  const format = bucketLabels[RANGES[key].bucket];
  return series.map(({ start, ...point }) => ({ ...point, label: format.format(start) }));
}
