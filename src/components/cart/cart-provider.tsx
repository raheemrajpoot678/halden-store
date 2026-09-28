"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  addToBag,
  removeFromBag,
  updateBagQuantity,
  type BagActionResult,
} from "@/app/(store)/bag/actions";
import {
  EMPTY_CART,
  lineLimitMessage,
  MAX_PER_LINE,
  toCart,
  toCartLine,
  type Cart,
  type CartProduct,
} from "@/lib/cart-config";

type MutationResult = { error: string | null };

type CartContextValue = {
  // The bag as the shopper should see it: server state with any pending
  // changes applied. null until the first load (or a seed) arrives.
  cart: Cart | null;
  refresh: () => Promise<void>;
  // Adopt server-rendered data (from /bag) if nothing has loaded yet.
  seed: (cart: Cart) => void;
  add: (product: CartProduct, quantity?: number) => Promise<MutationResult>;
  updateQuantity: (slug: string, quantity: number) => Promise<MutationResult>;
  remove: (slug: string) => Promise<MutationResult>;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

type OptimisticChange =
  | { type: "add"; product: CartProduct; quantity: number }
  | { type: "set"; slug: string; quantity: number }
  | { type: "remove"; slug: string };

// Mirrors the server's rules (caps from toCartLine) so the optimistic bag
// rarely differs from what the server sends back.
function applyChange(cart: Cart, change: OptimisticChange): Cart {
  switch (change.type) {
    case "add": {
      const { product } = change;
      const existing = cart.lines.find((line) => line.slug === product.slug);
      if (existing) {
        const quantity = Math.min(
          existing.quantity + change.quantity,
          existing.maxQuantity,
        );
        return toCart(
          cart.lines.map((line) =>
            line.slug === product.slug ? toCartLine(line, quantity) : line,
          ),
        );
      }
      const maxQuantity = Math.max(1, Math.min(product.stock, MAX_PER_LINE));
      return toCart([
        ...cart.lines,
        toCartLine(product, Math.min(change.quantity, maxQuantity)),
      ]);
    }
    case "set":
      return toCart(
        cart.lines.map((line) =>
          line.slug === change.slug
            ? toCartLine(line, Math.max(1, Math.min(change.quantity, line.maxQuantity)))
            : line,
        ),
      );
    case "remove":
      return toCart(cart.lines.filter((line) => line.slug !== change.slug));
  }
}

const CartContext = createContext<CartContextValue | null>(null);

async function fetchCart(): Promise<Cart | null> {
  try {
    const response = await fetch("/api/cart", { cache: "no-store" });
    return response.ok ? ((await response.json()) as Cart) : null;
  } catch {
    return null;
  }
}

const NETWORK_ERROR = "We couldn’t update your bag. Please try again.";

export function CartProvider({ children }: { children: ReactNode }) {
  // Last state confirmed by the server.
  const [serverCart, setServerCart] = useState<Cart | null>(null);
  const [optimisticCart, addOptimistic] = useOptimistic(
    serverCart ?? EMPTY_CART,
    applyChange,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Bumped by every mutation so a slow GET /api/cart can't overwrite newer
  // results from a Server Action.
  const revision = useRef(0);

  const load = useCallback(async () => {
    const started = revision.current;
    const next = await fetchCart();
    if (next && revision.current === started) setServerCart(next);
  }, []);

  const seed = useCallback(
    (initial: Cart) => setServerCart((current) => current ?? initial),
    [],
  );

  useEffect(() => {
    // Only schedules the fetch; state is set after it resolves.
    void load();
  }, [load]);

  const mutate = useCallback(
    (change: OptimisticChange, action: () => Promise<BagActionResult>) =>
      new Promise<MutationResult>((resolve) => {
        revision.current += 1;
        startTransition(async () => {
          addOptimistic(change);
          try {
            const result = await action();
            startTransition(() => setServerCart(result.cart));
            resolve({ error: result.error });
          } catch {
            // The optimistic change is dropped when the transition ends,
            // so the bag falls back to the last confirmed state.
            resolve({ error: NETWORK_ERROR });
          }
        });
      }),
    [addOptimistic],
  );

  // Hide the empty placeholder until something real has loaded.
  const cart =
    serverCart === null && optimisticCart === EMPTY_CART ? null : optimisticCart;

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      refresh: load,
      seed,
      add: async (product, quantity = 1) => {
        const existing = cart?.lines.find((line) => line.slug === product.slug);
        if (existing && existing.quantity >= existing.maxQuantity) {
          return { error: lineLimitMessage(existing.stock) };
        }
        setDrawerOpen(true);
        const result = await mutate({ type: "add", product, quantity }, () =>
          addToBag(product.slug, quantity),
        );
        // Don't leave the drawer covering the error on the product page.
        if (result.error) setDrawerOpen(false);
        return result;
      },
      updateQuantity: (slug, quantity) =>
        mutate({ type: "set", slug, quantity }, () => updateBagQuantity(slug, quantity)),
      remove: (slug) =>
        mutate({ type: "remove", slug }, () => removeFromBag(slug)),
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }),
    [cart, load, seed, mutate, drawerOpen],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
