// Moves a guest cart onto a user when they sign in or sign up. Kept apart from
// src/lib/cart.ts because the Better Auth hook in src/lib/auth.ts calls it, and
// cart.ts depends on auth through the session helpers.
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { MAX_PER_LINE } from "@/lib/cart-config";

export async function mergeGuestCart(guestCartId: string, userId: string) {
  // No cart yet for this user: adopt the guest cart as-is.
  const adopted = await db
    .execute(
      sql`update carts set user_id = ${userId}, updated_at = now()
          where id = ${guestCartId} and user_id is null
            and not exists (select 1 from carts where user_id = ${userId})
          returning id`,
    )
    .catch(() => null); // unique violation: a user cart appeared meanwhile
  if (adopted && adopted.rows.length > 0) return;

  // Otherwise add the guest lines into the user's cart, capped by stock.
  await db.execute(sql`
    insert into cart_items (cart_id, product_id, quantity)
    select uc.id, gi.product_id, least(gi.quantity, p.stock, ${MAX_PER_LINE})
    from cart_items gi
    join carts gc on gc.id = gi.cart_id and gc.user_id is null
    join carts uc on uc.user_id = ${userId}
    join products p on p.id = gi.product_id
    where gi.cart_id = ${guestCartId} and p.stock > 0
    on conflict (cart_id, product_id) do update
    set quantity = least(
          cart_items.quantity + excluded.quantity,
          (select stock from products where id = excluded.product_id),
          ${MAX_PER_LINE}
        ),
        updated_at = now()
  `);

  await db.execute(
    sql`delete from carts where id = ${guestCartId} and user_id is null`,
  );
}
