"use client";

import Link from "next/link";
import { useState } from "react";
import type { CartLine } from "@/lib/cart-config";
import { formatPrice } from "@/lib/format";
import { MinusIcon, PlusIcon } from "@/components/icons";
import { UnsplashImage } from "@/components/unsplash-image";
import { useCart } from "@/components/cart/cart-provider";

// One bag row, shared by the mini bag and /bag. `compact` tightens it for the
// drawer.
export function BagLine({
  line,
  compact = false,
  onNavigate,
}: {
  line: CartLine;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const { updateQuantity, remove } = useCart();
  const [error, setError] = useState<string | null>(null);
  const href = `/products/${line.slug}`;
  const soldOut = line.issue === "sold-out";

  // Changes apply optimistically in CartProvider, so controls never wait on
  // the server; only a failure message comes back here.
  const run = async (action: () => ReturnType<typeof remove>) => {
    setError(null);
    const result = await action();
    setError(result.error);
  };

  const issue =
    line.issue === "sold-out"
      ? "Sold out, please remove it to continue."
      : line.issue === "insufficient-stock"
        ? `Only ${line.stock} left, please reduce the quantity.`
        : null;

  return (
    <li
      className={`grid gap-4 border-b py-5 ${compact ? "grid-cols-[5rem_1fr]" : "grid-cols-[6rem_1fr] md:grid-cols-[8rem_1fr] md:gap-6"}`}
    >
      <Link href={href} onClick={onNavigate} className="media-frame block">
        <UnsplashImage
          src={line.image.src}
          alt={line.image.alt}
          fill
          sizes={compact ? "5rem" : "(min-width: 48rem) 8rem, 6rem"}
        />
      </Link>

      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1 text-body-sm">
            <p className="eyebrow text-ink-subtle">{line.category}</p>
            <Link href={href} onClick={onNavigate} className="link-quiet">
              {line.name}
            </Link>
            <p className="text-ink-muted">{line.colour}</p>
          </div>
          <p className="shrink-0 text-body-sm">
            {soldOut ? (
              <span className="text-ink-subtle line-through">
                {formatPrice(line.lineTotalCents)}
              </span>
            ) : (
              formatPrice(line.lineTotalCents)
            )}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-4">
          {soldOut ? (
            <span />
          ) : (
            <div className="flex h-control-sm items-center border">
              <button
                type="button"
                className="flex size-control-sm items-center justify-center disabled:text-ink-subtle"
                aria-label={`Decrease quantity of ${line.name}`}
                disabled={line.quantity <= 1}
                onClick={() => run(() => updateQuantity(line.slug, line.quantity - 1))}
              >
                <MinusIcon width={14} height={14} />
              </button>
              <span
                className="min-w-8 text-center text-body-sm tabular-nums"
                aria-label={`Quantity ${line.quantity}`}
                aria-live="polite"
              >
                {line.quantity}
              </span>
              <button
                type="button"
                className="flex size-control-sm items-center justify-center disabled:text-ink-subtle"
                aria-label={`Increase quantity of ${line.name}`}
                disabled={line.quantity >= line.maxQuantity}
                onClick={() => run(() => updateQuantity(line.slug, line.quantity + 1))}
              >
                <PlusIcon width={14} height={14} />
              </button>
            </div>
          )}
          <button
            type="button"
            className="link text-body-sm text-ink-muted"
            onClick={() => run(() => remove(line.slug))}
          >
            Remove<span className="sr-only"> {line.name}</span>
          </button>
        </div>

        {issue || error ? (
          <p role="alert" className="text-body-sm text-sale">
            {error ?? issue}
          </p>
        ) : null}
      </div>
    </li>
  );
}
