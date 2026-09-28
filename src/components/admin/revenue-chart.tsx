"use client";

import { useState } from "react";
import { formatMoney, formatPrice } from "@/lib/format";

export type ChartPoint = {
  label: string; // bucket label, e.g. "12 Sep"
  grossCents: number;
  refundsCents: number;
  orders: number;
};

const HEIGHT = 200;
const GRID_LINES = 4;

// Rounds the axis maximum up to a readable figure (1, 2, 2.5 or 5 × 10^n).
function niceMax(value: number) {
  if (value <= 0) return 100_00;
  const exponent = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((f) => f * exponent >= value) ?? 10;
  return step * exponent;
}

// Gross sales per bucket: one series, so no legend; hover (or focus) a bar for
// its figures. The table below is the accessible equivalent.
export function RevenueChart({ points, title }: { points: ChartPoint[]; title: string }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(...points.map((p) => p.grossCents), 0));
  const labelEvery = Math.max(1, Math.ceil(points.length / 8));
  const current = active === null ? null : points[active];

  return (
    <figure className="flex flex-col gap-3">
      <div className="flex min-h-10 items-baseline justify-between gap-4">
        <figcaption className="ui-label">{title}</figcaption>
        <p className="text-right text-body-sm text-ink-muted tabular-nums" aria-live="polite">
          {current ? (
            <>
              <span className="text-ink">{current.label}</span> · {formatMoney(current.grossCents)} ·{" "}
              {current.orders} {current.orders === 1 ? "order" : "orders"}
              {current.refundsCents > 0 ? ` · ${formatMoney(current.refundsCents)} refunded` : ""}
            </>
          ) : (
            "Hover a bar for details"
          )}
        </p>
      </div>

      <div className="relative" style={{ height: HEIGHT }} aria-hidden="true">
        {/* Recessive grid with axis labels. */}
        {Array.from({ length: GRID_LINES + 1 }, (_, i) => {
          const value = (max / GRID_LINES) * i;
          return (
            <div
              key={i}
              className="absolute inset-x-0 flex items-end border-t border-line"
              style={{ bottom: `${(i / GRID_LINES) * 100}%` }}
            >
              <span className="absolute -top-2 left-0 bg-canvas pr-2 text-caption text-ink-subtle tabular-nums">
                {formatPrice(value)}
              </span>
            </div>
          );
        })}

        <div
          className="absolute inset-y-0 right-0 left-12 flex items-end gap-[2px]"
          onMouseLeave={() => setActive(null)}
        >
          {points.map((point, index) => (
            <div
              key={index}
              className="group relative flex h-full flex-1 items-end"
              onMouseEnter={() => setActive(index)}
            >
              <div
                className={`w-full transition-colors ${
                  active === null || active === index ? "bg-ink" : "bg-ink-subtle/40"
                }`}
                style={{
                  height: `${(point.grossCents / max) * 100}%`,
                  minHeight: point.grossCents > 0 ? 2 : 0,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="ml-12 flex gap-[2px]" aria-hidden="true">
        {points.map((point, index) => (
          <span key={index} className="flex-1 truncate text-caption text-ink-subtle">
            {index % labelEvery === 0 ? point.label : ""}
          </span>
        ))}
      </div>

      <details className="text-body-sm">
        <summary className="link-quiet ui-label w-fit text-ink-muted">Show as table</summary>
        <table className="mt-3 w-full text-left tabular-nums">
          <thead>
            <tr className="border-b">
              <th scope="col" className="eyebrow py-2 font-medium text-ink-subtle">Period</th>
              <th scope="col" className="eyebrow py-2 text-right font-medium text-ink-subtle">Gross</th>
              <th scope="col" className="eyebrow py-2 text-right font-medium text-ink-subtle">Refunds</th>
              <th scope="col" className="eyebrow py-2 text-right font-medium text-ink-subtle">Orders</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point, index) => (
              <tr key={index} className="border-b">
                <td className="py-2">{point.label}</td>
                <td className="py-2 text-right">{formatMoney(point.grossCents)}</td>
                <td className="py-2 text-right">{formatMoney(point.refundsCents)}</td>
                <td className="py-2 text-right">{point.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
