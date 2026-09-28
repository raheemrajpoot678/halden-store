"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { formatPrice } from "@/lib/format";
import { CloseIcon } from "@/components/icons";
import { BagLine } from "@/components/cart/bag-line";
import { useCart } from "@/components/cart/cart-provider";

// Slide-out bag, opened after "Add to bag". Same <dialog> pattern as the
// mobile menu, anchored to the right.
export function MiniBag() {
  const { cart, drawerOpen, closeDrawer } = useCart();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (drawerOpen && !dialog.open) dialog.showModal();
    if (!drawerOpen && dialog.open) dialog.close();
  }, [drawerOpen]);

  const lines = cart?.lines ?? [];
  const count = cart?.itemCount ?? 0;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="mini-bag-title"
      className="m-0 ml-auto h-dvh max-h-none w-full max-w-md bg-canvas text-ink backdrop:bg-black/40 open:flex open:flex-col"
      onClose={closeDrawer}
      onClick={(event) => {
        // Clicking the backdrop lands on the dialog element itself.
        if (event.target === dialogRef.current) closeDrawer();
      }}
    >
      <div className="flex h-header items-center justify-between border-b px-gutter">
        <h2 id="mini-bag-title" className="ui-label">
          Shopping bag{count > 0 ? ` (${count})` : ""}
        </h2>
        <button
          type="button"
          className="icon-btn -mr-3"
          aria-label="Close shopping bag"
          onClick={closeDrawer}
        >
          <CloseIcon />
        </button>
      </div>

      {lines.length > 0 ? (
        <>
          <ul className="flex-1 overflow-y-auto px-gutter">
            {lines.map((line) => (
              <BagLine key={line.slug} line={line} compact onNavigate={closeDrawer} />
            ))}
          </ul>

          <div className="flex flex-col gap-4 border-t px-gutter py-6">
            <div className="flex items-baseline justify-between">
              <span className="ui-label">Subtotal</span>
              <span className="text-body">{formatPrice(cart?.subtotalCents ?? 0)}</span>
            </div>
            <p className="text-body-sm text-ink-muted">
              Complimentary express shipping and returns.
            </p>
            <Link href="/bag" onClick={closeDrawer} className="btn btn-primary w-full">
              View bag
            </Link>
            <button
              type="button"
              onClick={closeDrawer}
              className="link-quiet ui-label self-center"
            >
              Continue shopping
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-gutter text-center">
          <p className="text-title">Your bag is empty</p>
          <Link
            href="/collections/new-in"
            onClick={closeDrawer}
            className="btn btn-primary w-full"
          >
            Discover new arrivals
          </Link>
        </div>
      )}
    </dialog>
  );
}
