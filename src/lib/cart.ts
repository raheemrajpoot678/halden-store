// Server-side cart reads and writes. A cart belongs to the signed-in user, or
// to a guest through the httpOnly CART_COOKIE. Every write is one conditional
// statement (neon-http has no interactive transactions), and quantities are
// always capped by live stock and MAX_PER_LINE.
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/db";
import { cartItems, carts, categories, products } from "@/db/schema";
import {
  CART_COOKIE,
  CART_COOKIE_MAX_AGE,
  EMPTY_CART,
  MAX_PER_LINE,
  lineLimitMessage,
  toCart,
  toCartLine,
  type Cart,
  type CartLine,
} from "@/lib/cart-config";
import { getSession } from "@/lib/session";

// Returns the current visitor's cart id without creating one.
export async function findCartId(): Promise<string | null> {
  const session = await getSession();
  if (session) {
    const [row] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.userId, session.user.id));
    return row?.id ?? null;
  }

  const cookieId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cookieId) return null;
  const [row] = await db
    .select({ id: carts.id })
    .from(carts)
    .where(and(eq(carts.id, cookieId), isNull(carts.userId)));
  return row?.id ?? null;
}

// For Server Actions / Route Handlers only: may set the guest cookie.
export async function getOrCreateCartId(): Promise<string> {
  const session = await getSession();
  if (session) {
    const [row] = await db
      .insert(carts)
      .values({ id: crypto.randomUUID(), userId: session.user.id })
      .onConflictDoUpdate({ target: carts.userId, set: { updatedAt: new Date() } })
      .returning({ id: carts.id });
    return row.id;
  }

  const existing = await findCartId();
  if (existing) return existing;

  const id = crypto.randomUUID();
  await db.insert(carts).values({ id });
  (await cookies()).set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
  return id;
}

// Stock this cart's own open checkout is holding (src/lib/orders.ts reserves
// it when the Checkout Session is created). It is added back so a shopper who
// returns from Stripe without paying still sees their bag as available.
const ownReservedStock = (cartId: string) => sql<number>`coalesce((
  select sum(r.quantity)
  from orders o, jsonb_to_recordset(o.items) as r("productId" int, quantity int)
  where o.cart_id = ${cartId} and o.status = 'pending' and r."productId" = ${products.id}
), 0)`;

export type CheckoutLine = CartLine & { productId: number };

export async function loadCartLines(cartId: string): Promise<CheckoutLine[]> {
  const rows = await db
    .select({
      productId: products.id,
      slug: products.slug,
      name: products.name,
      colour: products.colour,
      category: categories.name,
      images: products.images,
      unitPriceCents: products.priceCents,
      // Unlisted (draft/archived) pieces read as sold out: they stay visible
      // in the bag but can't be bought.
      stock: sql<number>`case when ${products.status} = 'active'
        then ${products.stock} + ${ownReservedStock(cartId)} else 0 end`.mapWith(Number),
      quantity: cartItems.quantity,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(cartItems.cartId, cartId))
    .orderBy(asc(cartItems.createdAt), asc(cartItems.id));

  return rows.map(({ images, quantity, productId, ...product }) => ({
    ...toCartLine({ ...product, image: images[0] }, quantity),
    productId,
  }));
}

export async function loadCart(cartId: string): Promise<Cart> {
  return toCart(await loadCartLines(cartId));
}

export const getCart = cache(async (): Promise<Cart> => {
  const cartId = await findCartId();
  return cartId ? loadCart(cartId) : EMPTY_CART;
});

type Result = { error: string | null };

export async function addItem(
  cartId: string,
  slug: string,
  quantity: number,
): Promise<Result> {
  const added = await db.execute(sql`
    insert into cart_items (cart_id, product_id, quantity)
    select ${cartId}, p.id, least(${quantity}, p.stock, ${MAX_PER_LINE})
    from products p
    where p.slug = ${slug} and p.stock > 0 and p.status = 'active'
    on conflict (cart_id, product_id) do update
    set quantity = least(
          cart_items.quantity + excluded.quantity,
          (select stock from products where id = excluded.product_id),
          ${MAX_PER_LINE}
        ),
        updated_at = now()
    where cart_items.quantity < least(
      (select stock from products where id = excluded.product_id),
      ${MAX_PER_LINE}
    )
    returning quantity
  `);
  if (added.rows.length > 0) return { error: null };

  // Nothing changed: work out why for the message.
  const [product] = await db
    .select({ stock: products.stock, status: products.status })
    .from(products)
    .where(eq(products.slug, slug));
  if (!product || product.status !== "active") {
    return { error: "This piece is no longer available." };
  }
  return { error: lineLimitMessage(product.stock) };
}

export async function setItemQuantity(
  cartId: string,
  slug: string,
  quantity: number,
): Promise<Result> {
  if (quantity <= 0) return removeItem(cartId, slug);

  const updated = await db.execute(sql`
    update cart_items ci
    set quantity = least(${quantity}, p.stock, ${MAX_PER_LINE}), updated_at = now()
    from products p
    where ci.product_id = p.id and ci.cart_id = ${cartId}
      and p.slug = ${slug} and p.stock > 0 and p.status = 'active'
    returning ci.quantity
  `);

  const [row] = updated.rows as { quantity: number }[];
  if (!row) return { error: "Sorry, this piece has sold out." };
  if (row.quantity < quantity) {
    return {
      error:
        row.quantity === MAX_PER_LINE
          ? `You can add up to ${MAX_PER_LINE} of each piece.`
          : `Only ${row.quantity} left.`,
    };
  }
  return { error: null };
}

export async function removeItem(cartId: string, slug: string): Promise<Result> {
  await db.execute(sql`
    delete from cart_items ci
    using products p
    where ci.product_id = p.id and ci.cart_id = ${cartId} and p.slug = ${slug}
  `);
  return { error: null };
}
