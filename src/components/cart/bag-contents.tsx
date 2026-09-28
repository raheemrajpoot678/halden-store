"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { checkout, type CheckoutActionState } from "@/app/(store)/bag/actions";
import type { Cart } from "@/lib/cart-config";
import { formatPrice } from "@/lib/format";
import { BagLine } from "@/components/cart/bag-line";
import { useCart } from "@/components/cart/cart-provider";

// /bag body. Server-rendered from `initialCart`, then follows the shared cart
// state so edits here also update the header and mini bag.
export function BagContents({
  initialCart,
  checkoutCancelled = false,
}: {
  initialCart: Cart;
  checkoutCancelled?: boolean;
}) {
  const { cart: liveCart, seed, refresh } = useCart();
  const cart = liveCart ?? initialCart;
  // On success the action redirects to Stripe, so it only ever resolves with
  // an error.
  const [checkoutState, checkoutAction, checkoutPending] = useActionState<
    CheckoutActionState,
    FormData
  >(checkout, { error: null });
  // A failed checkout usually means stock moved: show the bag as it is now.
  useEffect(() => {
    if (checkoutState.error) void refresh();
  }, [checkoutState, refresh]);
  const checkoutError = cart.hasIssues
    ? "Some pieces in your bag need your attention before you can check out."
    : checkoutState.error;

  // Let edits made before the client fetch lands apply to this data.
  useEffect(() => seed(initialCart), [seed, initialCart]);

  if (cart.lines.length === 0) {
    return (
      <div className="container-prose section flex flex-col items-center gap-6 text-center">
        <p className="eyebrow text-ink-subtle">Shopping bag</p>
        <h1 className="text-heading">Your bag is empty</h1>
        <p className="text-lead text-ink-muted">
          Pieces you add to your bag will appear here.
        </p>
        <Link href="/collections/new-in" className="btn btn-primary btn-block mt-4">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page pt-8 pb-section lg:pt-12">
      <header className="mb-block flex flex-col gap-3">
        <p className="eyebrow text-ink-subtle">Shopping bag</p>
        <h1 className="text-heading">
          Your bag{" "}
          <span className="text-ink-subtle">({cart.itemCount})</span>
        </h1>
      </header>

      <div className="grid gap-block lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-16 xl:gap-24">
        <section aria-label="Items">
          <ul className="hairline-strong">
            {cart.lines.map((line) => (
              <BagLine key={line.slug} line={line} />
            ))}
          </ul>
        </section>

        <aside
          aria-labelledby="summary-heading"
          className="flex flex-col gap-5 self-start bg-surface p-6 lg:sticky lg:top-[calc(var(--spacing-header-lg)+3rem+2rem)] lg:p-8"
        >
          <h2 id="summary-heading" className="ui-label">
            Order summary
          </h2>
          <dl className="flex flex-col gap-3 text-body-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd>{formatPrice(cart.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Shipping</dt>
              <dd>Complimentary</dd>
            </div>
            <div className="hairline-strong flex justify-between gap-4 pt-4 text-body">
              <dt>Total</dt>
              <dd>{formatPrice(cart.subtotalCents)}</dd>
            </div>
          </dl>
          <form action={checkoutAction}>
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={cart.hasIssues || cart.itemCount === 0 || checkoutPending}
            >
              {checkoutPending ? "Redirecting to checkout…" : "Checkout"}
            </button>
          </form>
          <p
            className={`text-body-sm ${checkoutError ? "text-sale" : "text-ink-muted"}`}
            role={checkoutError ? "alert" : undefined}
          >
            {checkoutError ??
              (checkoutCancelled
                ? "Checkout was cancelled. Your bag is saved whenever you’re ready."
                : "Secure payment by Stripe.")}
          </p>
          <Link href="/collections/new-in" className="link text-body-sm self-start">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
