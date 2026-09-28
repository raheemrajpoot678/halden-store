// Drizzle table definitions live here.
// The Better Auth tables (user, session, account, verification) mirror what
// `npx auth@latest generate --config src/lib/auth.ts` produces; re-run it after
// adding auth plugins and merge any new columns here.
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export type Photo = {
  src: string;
  alt: string;
};

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const categories = pgTable(
  "categories",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    // Only categories shown as homepage tiles have an image.
    imageUrl: text("image_url"),
    imageAlt: text("image_alt"),
    ...timestamps,
  },
  (table) => [
    check(
      "categories_image_complete",
      sql`(${table.imageUrl} is null) = (${table.imageAlt} is null)`,
    ),
  ],
);

export const PRODUCT_STATUSES = [
  "active", // listed on the storefront
  "draft", // being prepared in admin; not listed
  "archived", // withdrawn; kept because orders reference it
] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const products = pgTable(
  "products",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    slug: text("slug").notNull().unique(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    priceCents: integer("price_cents").notNull(),
    stock: integer("stock").notNull().default(0),
    badge: text("badge"),
    colour: text("colour").notNull(),
    description: text("description").notNull(),
    details: text("details")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    images: jsonb("images").$type<Photo[]>().notNull(),
    status: text("status").$type<ProductStatus>().notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    index("products_category_id_idx").on(table.categoryId),
    index("products_status_idx").on(table.status),
    check(
      "products_status_valid",
      sql`${table.status} in ('active', 'draft', 'archived')`,
    ),
    check("products_price_cents_non_negative", sql`${table.priceCents} >= 0`),
    check("products_stock_non_negative", sql`${table.stock} >= 0`),
    check(
      "products_images_not_empty",
      sql`jsonb_array_length(${table.images}) >= 1`,
    ),
  ],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

/* ------------------------------------------------------------------ */
/* Better Auth                                                         */
/* ------------------------------------------------------------------ */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  // Admin plugin: "user" | "admin".
  role: text("role").notNull().default("user"),
  banned: boolean("banned").notNull().default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { withTimezone: true }),
  ...timestamps,
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
    ...timestamps,
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    uniqueIndex("account_provider_account_idx").on(
      table.providerId,
      table.accountId,
    ),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

/* ------------------------------------------------------------------ */
/* Cart                                                                */
/* ------------------------------------------------------------------ */

// One cart per signed-in user (user_id) or per guest cookie (user_id null).
// The id doubles as the guest cookie value. Prices are read live from
// products, never stored here.
export const carts = pgTable("carts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  ...timestamps,
});

export const cartItems = pgTable(
  "cart_items",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    cartId: text("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("cart_items_cart_product_idx").on(table.cartId, table.productId),
    check("cart_items_quantity_positive", sql`${table.quantity} > 0`),
  ],
);

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(user, { fields: [carts.userId], references: [user.id] }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export const ORDER_STATUSES = [
  "pending", // Checkout Session open; stock reserved
  "processing", // paid with a delayed method, awaiting confirmation; stock reserved
  "paid",
  "failed", // stock released
  "expired", // session expired or cancelled; stock released
  "partially_refunded", // paid, then part of the total refunded
  "refunded", // paid, then refunded in full
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Statuses whose money was captured: these count towards revenue.
export const PAID_ORDER_STATUSES = [
  "paid",
  "partially_refunded",
  "refunded",
] as const satisfies readonly OrderStatus[];

export const FULFILMENT_STATUSES = ["unfulfilled", "shipped", "delivered"] as const;
export type FulfilmentStatus = (typeof FULFILMENT_STATUSES)[number];

// Snapshot of a line at checkout time, so later price or name changes never
// rewrite an order.
export type OrderItem = {
  productId: number;
  slug: string;
  name: string;
  colour: string;
  image: Photo;
  unitPriceCents: number;
  quantity: number;
};

export type ShippingDetails = {
  name: string | null;
  address: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
  } | null;
};

// One row per Stripe Checkout Session. Stock is reserved when the order is
// created and returned when it moves to failed/expired (src/lib/orders.ts).
export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    // No FK: deleting a cart must never touch its orders.
    cartId: text("cart_id"),
    status: text("status").$type<OrderStatus>().notNull().default("pending"),
    items: jsonb("items").$type<OrderItem[]>().notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),
    shippingCents: integer("shipping_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    currency: text("currency").notNull().default("usd"),
    email: text("email"),
    shippingDetails: jsonb("shipping_details").$type<ShippingDetails>(),
    stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    // Kept in sync with the refunds table (sum of non-failed refunds).
    refundedCents: integer("refunded_cents").notNull().default(0),
    // Stripe's processing fee, filled in once the charge's balance transaction exists.
    stripeFeeCents: integer("stripe_fee_cents"),
    fulfilmentStatus: text("fulfilment_status")
      .$type<FulfilmentStatus>()
      .notNull()
      .default("unfulfilled"),
    carrier: text("carrier"),
    trackingNumber: text("tracking_number"),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("orders_user_id_idx").on(table.userId),
    index("orders_cart_id_status_idx").on(table.cartId, table.status),
    index("orders_status_paid_at_idx").on(table.status, table.paidAt),
    index("orders_stripe_payment_intent_id_idx").on(table.stripePaymentIntentId),
    check(
      "orders_status_valid",
      sql`${table.status} in ('pending', 'processing', 'paid', 'failed', 'expired', 'partially_refunded', 'refunded')`,
    ),
    check(
      "orders_fulfilment_status_valid",
      sql`${table.fulfilmentStatus} in ('unfulfilled', 'shipped', 'delivered')`,
    ),
    check(
      "orders_refunded_within_total",
      sql`${table.refundedCents} >= 0 and ${table.refundedCents} <= ${table.totalCents}`,
    ),
    check("orders_items_not_empty", sql`jsonb_array_length(${table.items}) >= 1`),
    check(
      "orders_amounts_non_negative",
      sql`${table.subtotalCents} >= 0 and ${table.shippingCents} >= 0 and ${table.totalCents} >= 0`,
    ),
  ],
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(user, { fields: [orders.userId], references: [user.id] }),
  refunds: many(refunds),
}));

/* ------------------------------------------------------------------ */
/* Refunds                                                             */
/* ------------------------------------------------------------------ */

export type RestockedLine = { productId: number; quantity: number };

// One row per Stripe Refund, whether issued from admin or the Stripe
// Dashboard (synced by the webhook). orders.refunded_cents is recomputed from
// these rows, so syncing the same refund twice changes nothing.
export const refunds = pgTable(
  "refunds",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    stripeRefundId: text("stripe_refund_id").notNull().unique(),
    amountCents: integer("amount_cents").notNull(),
    // Stripe's refund status: pending, requires_action, succeeded, failed, canceled.
    status: text("status").notNull(),
    reason: text("reason"),
    restocked: jsonb("restocked").$type<RestockedLine[]>().notNull().default([]),
    // Null when the refund was made outside admin.
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    index("refunds_order_id_idx").on(table.orderId),
    index("refunds_created_at_idx").on(table.createdAt),
    check("refunds_amount_positive", sql`${table.amountCents} > 0`),
  ],
);

export const refundsRelations = relations(refunds, ({ one }) => ({
  order: one(orders, { fields: [refunds.orderId], references: [orders.id] }),
  createdByUser: one(user, { fields: [refunds.createdBy], references: [user.id] }),
}));

/* ------------------------------------------------------------------ */
/* Admin notifications                                                 */
/* ------------------------------------------------------------------ */

export const NOTIFICATION_TYPES = [
  "order_paid",
  "order_processing",
  "payment_failed",
  "refund",
  "low_stock",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// Store-wide feed shown to every admin; read state is shared.
export const notifications = pgTable(
  "notifications",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    type: text("type").$type<NotificationType>().notNull(),
    title: text("title").notNull(),
    body: text("body"),
    orderId: text("order_id").references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, {
      onDelete: "cascade",
    }),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("notifications_read_at_created_at_idx").on(table.readAt, table.createdAt),
    check(
      "notifications_type_valid",
      sql`${table.type} in ('order_paid', 'order_processing', 'payment_failed', 'refund', 'low_stock')`,
    ),
  ],
);
