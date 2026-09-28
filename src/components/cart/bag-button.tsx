"use client";

import Link from "next/link";
import { BagIcon } from "@/components/icons";
import { useCart } from "@/components/cart/cart-provider";

// Header bag link with a live item count. Stays a plain link to /bag so it
// works before hydration; the count is fetched on the client.
export function BagButton() {
  const { cart } = useCart();
  const count = cart?.itemCount ?? 0;
  const label =
    count > 0
      ? `Shopping bag, ${count} ${count === 1 ? "item" : "items"}`
      : "Shopping bag";

  return (
    <Link href="/bag" className="icon-btn relative" aria-label={label}>
      <BagIcon />
      {count > 0 ? (
        <span
          aria-hidden="true"
          className="absolute top-1 right-0 flex h-3.5 min-w-3.5 items-center justify-center bg-ink px-0.5 text-[0.5625rem] leading-none font-medium text-canvas tabular-nums"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
