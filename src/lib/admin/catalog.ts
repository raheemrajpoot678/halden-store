// Admin reads and writes for products and categories. Unlike src/lib/products.ts
// these see every status (draft, archived) and expose ids.
import { and, asc, count, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  products,
  type Photo,
  type ProductStatus,
} from "@/db/schema";
import { likePattern, paged, PAGE_SIZE } from "@/lib/admin/shared";
import { LOW_STOCK_THRESHOLD } from "@/lib/stock";

export type AdminProduct = typeof products.$inferSelect & {
  categoryName: string;
  categorySlug: string;
};

export type ProductInput = {
  slug: string;
  name: string;
  categoryId: number;
  priceCents: number;
  stock: number;
  badge: string | null;
  colour: string;
  description: string;
  details: string[];
  images: [Photo, ...Photo[]];
  status: ProductStatus;
};

function selectAdminProducts() {
  return db
    .select({
      product: products,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .$dynamic();
}

const flatten = (row: {
  product: typeof products.$inferSelect;
  categoryName: string;
  categorySlug: string;
}): AdminProduct => ({ ...row.product, categoryName: row.categoryName, categorySlug: row.categorySlug });

export async function listAdminProducts({
  query = "",
  status,
  categoryId,
  lowStock = false,
  page = 1,
}: {
  query?: string;
  status?: ProductStatus;
  categoryId?: number;
  lowStock?: boolean;
  page?: number;
}) {
  const term = query.trim();
  const where = and(
    term
      ? or(ilike(products.name, likePattern(term)), ilike(products.slug, likePattern(term)))
      : undefined,
    status ? eq(products.status, status) : undefined,
    categoryId ? eq(products.categoryId, categoryId) : undefined,
    lowStock ? sql`${products.stock} <= ${LOW_STOCK_THRESHOLD}` : undefined,
  );
  const [rows, [{ total }]] = await Promise.all([
    selectAdminProducts()
      .where(where)
      .orderBy(desc(products.updatedAt), desc(products.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ total: count() })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(where),
  ]);
  return paged(rows.map(flatten), total, page);
}

export async function getAdminProduct(id: number) {
  const [row] = await selectAdminProducts().where(eq(products.id, id)).limit(1);
  return row ? flatten(row) : null;
}

export async function isProductSlugTaken(slug: string, exceptId?: number) {
  const [row] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.slug, slug), exceptId ? ne(products.id, exceptId) : undefined))
    .limit(1);
  return Boolean(row);
}

export async function createProduct(input: ProductInput) {
  const [row] = await db.insert(products).values(input).returning({ id: products.id });
  return row.id;
}

// Returns the previous slug, so its storefront page can be refreshed. Stock is
// left alone: orders change it concurrently, so edits go through adjustStock.
export async function updateProduct(id: number, input: Omit<ProductInput, "stock">) {
  const [before] = await db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.id, id));
  if (!before) return null;
  const { name, slug, categoryId, priceCents, badge, colour, description, details, images, status } = input;
  await db
    .update(products)
    .set({ name, slug, categoryId, priceCents, badge, colour, description, details, images, status })
    .where(eq(products.id, id));
  return { previousSlug: before.slug };
}

export async function setProductStatus(id: number, status: ProductStatus) {
  const [row] = await db
    .update(products)
    .set({ status })
    .where(eq(products.id, id))
    .returning({ slug: products.slug });
  return row ?? null;
}

// Adds (or with a negative delta, removes) stock in one conditional statement,
// never going below zero. Returns the new stock, or null if it would.
export async function adjustStock(id: number, delta: number) {
  const [row] = await db
    .update(products)
    .set({ stock: sql`${products.stock} + ${delta}` })
    .where(and(eq(products.id, id), sql`${products.stock} + ${delta} >= 0`))
    .returning({ stock: products.stock, slug: products.slug });
  return row ?? null;
}

/* Categories */

export type AdminCategory = typeof categories.$inferSelect & {
  productCount: number;
  activeCount: number;
};

export type CategoryInput = {
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
};

export async function listAdminCategories(): Promise<AdminCategory[]> {
  const rows = await db
    .select({
      category: categories,
      productCount: sql<number>`count(${products.id})`.mapWith(Number),
      activeCount:
        sql<number>`count(${products.id}) filter (where ${products.status} = 'active')`.mapWith(
          Number,
        ),
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.name));
  return rows.map(({ category, ...counts }) => ({ ...category, ...counts }));
}

export async function listCategoryOptions() {
  return db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.name));
}

export async function isCategorySlugTaken(slug: string, exceptId?: number) {
  const [row] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.slug, slug), exceptId ? ne(categories.id, exceptId) : undefined))
    .limit(1);
  return Boolean(row);
}

export async function createCategory(input: CategoryInput) {
  await db.insert(categories).values(input);
}

export async function updateCategory(id: number, input: CategoryInput) {
  const [before] = await db
    .select({ slug: categories.slug })
    .from(categories)
    .where(eq(categories.id, id));
  if (!before) return null;
  await db.update(categories).set(input).where(eq(categories.id, id));
  return { previousSlug: before.slug };
}

// Only deletes a category with no products (the FK is ON DELETE restrict);
// returns the deleted slug, or null if it's in use or gone.
export async function deleteCategory(id: number) {
  const [row] = await db
    .delete(categories)
    .where(
      and(
        eq(categories.id, id),
        sql`not exists (select 1 from ${products} where ${products.categoryId} = ${categories.id})`,
      ),
    )
    .returning({ slug: categories.slug });
  return row?.slug ?? null;
}
