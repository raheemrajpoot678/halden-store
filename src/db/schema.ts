// Drizzle table definitions live here.
// Generate Better Auth's tables with: npx @better-auth/cli generate
import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
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
    ...timestamps,
  },
  (table) => [
    index("products_category_id_idx").on(table.categoryId),
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
