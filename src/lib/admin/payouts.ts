// Stripe balance and payouts, read live from Stripe (nothing is stored
// locally). Payouts are Stripe's transfers of the available balance to the
// store's bank account.
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

export type BalanceAmount = { amountCents: number; currency: string };

function sumByCurrency(amounts: { amount: number; currency: string }[]): BalanceAmount[] {
  return amounts.map(({ amount, currency }) => ({ amountCents: amount, currency }));
}

export async function getBalance() {
  const balance = await getStripe().balance.retrieve();
  return {
    available: sumByCurrency(balance.available),
    pending: sumByCurrency(balance.pending),
  };
}

export async function listPayouts({
  startingAfter,
  endingBefore,
  limit = 20,
}: { startingAfter?: string; endingBefore?: string; limit?: number } = {}) {
  const list = await getStripe().payouts.list({
    limit,
    ...(startingAfter ? { starting_after: startingAfter } : {}),
    ...(endingBefore ? { ending_before: endingBefore } : {}),
  });
  return { payouts: list.data, hasMore: list.has_more };
}

export async function getPayout(id: string) {
  const stripe = getStripe();
  let payout: Stripe.Payout;
  try {
    payout = await stripe.payouts.retrieve(id);
  } catch (error) {
    if (error instanceof Error && "statusCode" in error && error.statusCode === 404) return null;
    throw error;
  }
  const transactions = await stripe.balanceTransactions.list({
    payout: id,
    limit: 100,
    expand: ["data.source"],
  });
  return { payout, transactions: transactions.data, hasMoreTransactions: transactions.has_more };
}

// The payment intent behind a balance transaction whose source is a charge or
// refund (used to link it to an order).
export function paymentIntentOfTransaction(transaction: Stripe.BalanceTransaction) {
  const source = transaction.source;
  if (!source || typeof source === "string") return null;
  if (source.object !== "charge" && source.object !== "refund") return null;
  const intent = source.payment_intent;
  if (!intent) return null;
  return typeof intent === "string" ? intent : intent.id;
}

export function payoutTone(status: string) {
  if (status === "paid") return "success" as const;
  if (status === "failed" || status === "canceled") return "sale" as const;
  return "accent" as const;
}
