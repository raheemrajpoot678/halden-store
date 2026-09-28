// Presentational building blocks for admin pages (server components).
import Link from "next/link";
import type { FulfilmentStatus, OrderStatus, ProductStatus } from "@/db/schema";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

export function PageHeader({
  title,
  eyebrow,
  description,
  back,
  actions,
}: {
  title: React.ReactNode;
  eyebrow?: string;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex min-w-0 flex-col gap-2">
        {back ? (
          <Link href={back.href} className="link-quiet ui-label -ml-1 flex items-center gap-1 text-ink-muted">
            <ChevronLeftIcon width={16} height={16} />
            {back.label}
          </Link>
        ) : eyebrow ? (
          <p className="eyebrow text-ink-subtle">{eyebrow}</p>
        ) : null}
        <h1 className="text-heading break-words">{title}</h1>
        {description ? <p className="text-body text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`border p-5 md:p-6 ${className}`}>
      {title ? (
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="ui-label">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function StatTile({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  tone?: "sale" | "success";
}) {
  const toneClass = tone === "sale" ? "text-sale" : tone === "success" ? "text-success" : "";
  return (
    <div className="flex flex-col gap-2 border p-5">
      <p className="eyebrow text-ink-subtle">{label}</p>
      <p className={`text-title tabular-nums ${toneClass}`}>{value}</p>
      {detail ? <p className="text-body-sm text-ink-muted">{detail}</p> : null}
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">{children}</div>;
}

type Tone = "neutral" | "success" | "sale" | "accent" | "muted";

const toneClasses: Record<Tone, string> = {
  neutral: "border-ink text-ink",
  success: "border-success text-success",
  sale: "border-sale text-sale",
  accent: "border-accent text-accent",
  muted: "border-line text-ink-subtle",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`eyebrow inline-flex items-center border px-2 py-0.5 whitespace-nowrap ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

const orderStatus: Record<OrderStatus, { label: string; tone: Tone }> = {
  pending: { label: "Checkout open", tone: "muted" },
  processing: { label: "Processing", tone: "accent" },
  paid: { label: "Paid", tone: "success" },
  failed: { label: "Failed", tone: "sale" },
  expired: { label: "Abandoned", tone: "muted" },
  partially_refunded: { label: "Part refunded", tone: "accent" },
  refunded: { label: "Refunded", tone: "sale" },
};

export const ORDER_STATUS_LABELS = Object.fromEntries(
  Object.entries(orderStatus).map(([key, value]) => [key, value.label]),
) as Record<OrderStatus, string>;

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, tone } = orderStatus[status];
  return <Badge tone={tone}>{label}</Badge>;
}

const fulfilmentStatus: Record<FulfilmentStatus, { label: string; tone: Tone }> = {
  unfulfilled: { label: "Unfulfilled", tone: "neutral" },
  shipped: { label: "Shipped", tone: "accent" },
  delivered: { label: "Delivered", tone: "success" },
};

export const FULFILMENT_LABELS = Object.fromEntries(
  Object.entries(fulfilmentStatus).map(([key, value]) => [key, value.label]),
) as Record<FulfilmentStatus, string>;

export function FulfilmentBadge({ status }: { status: FulfilmentStatus }) {
  const { label, tone } = fulfilmentStatus[status];
  return <Badge tone={tone}>{label}</Badge>;
}

const productStatus: Record<ProductStatus, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "success" },
  draft: { label: "Draft", tone: "muted" },
  archived: { label: "Archived", tone: "sale" },
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const { label, tone } = productStatus[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 border border-dashed px-6 py-16 text-center">
      <p className="text-title">{title}</p>
      {children ? <div className="text-body-sm text-ink-muted">{children}</div> : null}
    </div>
  );
}

// Plain GET form: filters live in the URL so they survive reloads and links.
export function FilterBar({
  action,
  children,
  hasFilters,
}: {
  action: string;
  children: React.ReactNode;
  hasFilters: boolean;
}) {
  return (
    <form action={action} className="mb-6 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
      {children}
      <div className="flex gap-2">
        <button type="submit" className="btn btn-secondary">
          Apply
        </button>
        {hasFilters ? (
          <Link href={action} className="btn">
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}

export function Pagination({
  page,
  pageCount,
  total,
  href,
}: {
  page: number;
  pageCount: number;
  total: number;
  href: (page: number) => string;
}) {
  if (pageCount <= 1) {
    return <p className="mt-4 text-body-sm text-ink-muted">{total} total</p>;
  }
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-4">
      <p className="text-body-sm text-ink-muted">
        Page {page} of {pageCount} · {total} total
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className="btn btn-secondary btn-sm" aria-label="Previous page">
            <ChevronLeftIcon width={16} height={16} />
          </Link>
        ) : null}
        {page < pageCount ? (
          <Link href={href(page + 1)} className="btn btn-secondary btn-sm" aria-label="Next page">
            <ChevronRightIcon width={16} height={16} />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

// Table styling shared by admin lists. Below md each row becomes a card
// (grid) and the header is visually hidden; from md it's a normal table.
export const table = {
  root: "hairline-strong w-full text-left text-body-sm",
  head: "sr-only md:not-sr-only",
  headRow: "border-b",
  th: "eyebrow py-3 pr-4 font-medium text-ink-subtle",
  thEnd: "eyebrow py-3 text-right font-medium text-ink-subtle",
  row: "grid grid-cols-2 gap-x-4 gap-y-2 border-b py-4 md:table-row md:py-0",
  td: "md:py-4 md:pr-4 align-middle",
  tdEnd: "md:py-4 text-right align-middle tabular-nums",
};
