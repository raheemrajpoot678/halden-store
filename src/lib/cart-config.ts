// Cart constants and types. No server imports, so client components can use
// these too (types via `import type`).
import type { Photo } from "@/db/schema";

export const CART_COOKIE = "halden_cart";
export const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
export const MAX_PER_LINE = 10;

export type CartLineIssue = "sold-out" | "insufficient-stock";

export type CartLine = {
  slug: string;
  name: string;
  colour: string;
  category: string;
  image: Photo;
  unitPriceCents: number;
  quantity: number;
  stock: number;
  // Highest quantity the stepper allows: stock, capped per line.
  maxQuantity: number;
  lineTotalCents: number;
  issue: CartLineIssue | null;
};

export type Cart = {
  lines: CartLine[];
  itemCount: number;
  subtotalCents: number;
  hasIssues: boolean;
};

export const EMPTY_CART: Cart = {
  lines: [],
  itemCount: 0,
  subtotalCents: 0,
  hasIssues: false,
};

// What a line needs to know about its product. The PDP passes this to
// "Add to bag" so the line can appear before the server confirms it.
export type CartProduct = Pick<
  CartLine,
  "slug" | "name" | "colour" | "category" | "image" | "unitPriceCents" | "stock"
>;

// Shared by the server (src/lib/cart.ts) and the optimistic client updates,
// so both derive limits, issues and totals the same way.
export function toCartLine(product: CartProduct, quantity: number): CartLine {
  return {
    ...product,
    quantity,
    maxQuantity: Math.max(1, Math.min(product.stock, MAX_PER_LINE)),
    lineTotalCents: product.unitPriceCents * quantity,
    issue:
      product.stock <= 0
        ? "sold-out"
        : quantity > product.stock
          ? "insufficient-stock"
          : null,
  };
}

export function toCart(lines: CartLine[]): Cart {
  // Sold-out lines can't be bought, so they don't count towards totals.
  const payable = lines.filter((line) => line.issue !== "sold-out");
  return {
    lines,
    itemCount: payable.reduce((sum, line) => sum + line.quantity, 0),
    subtotalCents: payable.reduce((sum, line) => sum + line.lineTotalCents, 0),
    hasIssues: lines.some((line) => line.issue !== null),
  };
}

// Shown when "Add to bag" can't add another of a piece.
export function lineLimitMessage(stock: number) {
  if (stock <= 0) return "Sorry, this piece has just sold out.";
  if (stock > MAX_PER_LINE) return `You can add up to ${MAX_PER_LINE} of each piece.`;
  return stock === 1
    ? "Only 1 left, and it’s already in your bag."
    : `Only ${stock} left, and they’re all in your bag.`;
}
