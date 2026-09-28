// Server-side reads for products and categories. Each function is wrapped in
// React `cache` so generateMetadata and the page share one query per render.
import { cache } from "react";
import { asc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, type Photo } from "@/db/schema";

export type Product = {
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  priceCents: number;
  badge: string | null;
  stock: number;
  colour: string;
  description: string;
  details: string[];
  images: [Photo, ...Photo[]];
};

export type Category = {
  slug: string;
  name: string;
  image: Photo | null;
};

function selectProducts() {
  return db
    .select({
      slug: products.slug,
      name: products.name,
      category: categories.name,
      categorySlug: categories.slug,
      priceCents: products.priceCents,
      badge: products.badge,
      stock: products.stock,
      colour: products.colour,
      description: products.description,
      details: products.details,
      // Non-empty is enforced by the products_images_not_empty check.
      images: sql`${products.images}`.mapWith(
        (value) => products.images.mapFromDriverValue(value) as Product["images"],
      ),
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .$dynamic();
}

// Returns rows in the order of `slugs`, dropping slugs that don't exist.
function inSlugOrder<T extends { slug: string }>(rows: T[], slugs: string[]) {
  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  return slugs.flatMap((slug) => bySlug.get(slug) ?? []);
}

export const getProduct = cache(
  async (slug: string): Promise<Product | undefined> => {
    const [product] = await selectProducts()
      .where(eq(products.slug, slug))
      .limit(1);
    return product;
  },
);

// Same category first, then everything else, in catalogue order.
export const getRelatedProducts = cache(
  async (product: Product, limit = 4): Promise<Product[]> =>
    selectProducts()
      .where(ne(products.slug, product.slug))
      .orderBy(
        sql`${categories.slug} = ${product.categorySlug} desc`,
        asc(products.id),
      )
      .limit(limit),
);

export const getProductsBySlugs = cache(
  async (slugs: string[]): Promise<Product[]> => {
    if (slugs.length === 0) return [];
    const rows = await selectProducts().where(inArray(products.slug, slugs));
    return inSlugOrder(rows, slugs);
  },
);

export const getAllProductSlugs = cache(async (): Promise<string[]> => {
  const rows = await db
    .select({ slug: products.slug })
    .from(products)
    .orderBy(asc(products.id));
  return rows.map((row) => row.slug);
});

export const getCategoriesBySlugs = cache(
  async (slugs: string[]): Promise<Category[]> => {
    if (slugs.length === 0) return [];
    const rows = await db
      .select({
        slug: categories.slug,
        name: categories.name,
        imageUrl: categories.imageUrl,
        imageAlt: categories.imageAlt,
      })
      .from(categories)
      .where(inArray(categories.slug, slugs));
    return inSlugOrder(
      rows.map(({ slug, name, imageUrl, imageAlt }) => ({
        slug,
        name,
        image:
          imageUrl && imageAlt !== null ? { src: imageUrl, alt: imageAlt } : null,
      })),
      slugs,
    );
  },
);
