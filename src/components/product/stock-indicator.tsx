import { getStockStatus } from "@/lib/stock";

const dotColour = {
  "in-stock": "bg-success",
  "low-stock": "bg-sale",
  "sold-out": "bg-ink-subtle",
} as const;

export function StockIndicator({ stock }: { stock: number }) {
  const status = getStockStatus(stock);

  return (
    <p className="flex items-center gap-2 text-body-sm">
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${dotColour[status.state]}`}
      />
      <span className={status.state === "sold-out" ? "text-ink-muted" : undefined}>
        {status.label}
      </span>
    </p>
  );
}
