"use server";

import { redirect } from "next/navigation";
import { EMPTY_CART, MAX_PER_LINE, type Cart } from "@/lib/cart-config";
import {
  addItem,
  findCartId,
  getOrCreateCartId,
  loadCart,
  removeItem,
  setItemQuantity,
} from "@/lib/cart";
import { releaseOpenCheckouts, startCheckout } from "@/lib/checkout";
import { getSession } from "@/lib/session";

export type BagActionResult = { cart: Cart; error: string | null };

function isSlug(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9-]{1,120}$/.test(value);
}

function isQuantity(value: unknown, min: number): value is number {
  return Number.isInteger(value) && (value as number) >= min && (value as number) <= MAX_PER_LINE;
}

const invalid = async (): Promise<BagActionResult> => {
  const cartId = await findCartId();
  return {
    cart: cartId ? await loadCart(cartId) : EMPTY_CART,
    error: "Something went wrong. Please try again.",
  };
};

export async function addToBag(slug: string, quantity = 1): Promise<BagActionResult> {
  if (!isSlug(slug) || !isQuantity(quantity, 1)) return invalid();

  const cartId = await getOrCreateCartId();
  const { error } = await addItem(cartId, slug, quantity);
  return { cart: await loadCart(cartId), error };
}

export async function updateBagQuantity(
  slug: string,
  quantity: number,
): Promise<BagActionResult> {
  if (!isSlug(slug) || !isQuantity(quantity, 0)) return invalid();

  const cartId = await findCartId();
  if (!cartId) return { cart: EMPTY_CART, error: null };
  // Editing the bag abandons any open Checkout Session and frees its stock.
  await releaseOpenCheckouts(cartId);
  const { error } = await setItemQuantity(cartId, slug, quantity);
  return { cart: await loadCart(cartId), error };
}

export async function removeFromBag(slug: string): Promise<BagActionResult> {
  if (!isSlug(slug)) return invalid();

  const cartId = await findCartId();
  if (!cartId) return { cart: EMPTY_CART, error: null };
  await releaseOpenCheckouts(cartId);
  await removeItem(cartId, slug);
  return { cart: await loadCart(cartId), error: null };
}

export type CheckoutActionState = { error: string | null };

// Form action for the bag's Checkout button: reserves stock, creates a Stripe
// Checkout Session and redirects to it.
export async function checkout(): Promise<CheckoutActionState> {
  const cartId = await findCartId();
  if (!cartId) return { error: "Your bag is empty." };

  const session = await getSession();
  let result;
  try {
    result = await startCheckout({
      cartId,
      userId: session?.user.id ?? null,
      email: session?.user.email ?? null,
    });
  } catch (error) {
    console.error("[checkout]", error);
    return { error: "We couldn’t start checkout. Please try again." };
  }
  if ("error" in result) return { error: result.error };
  redirect(result.url);
}
