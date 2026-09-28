// Helpers shared by the admin data layer and its Server Actions.
import { revalidatePath } from "next/cache";

export const PAGE_SIZE = 25;

export type Paged<T> = { rows: T[]; total: number; page: number; pageCount: number };

export function paged<T>(rows: T[], total: number, page: number, pageSize = PAGE_SIZE): Paged<T> {
  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

// `%`, `_` and `\` are escaped so a search matches them literally.
export function likePattern(term: string) {
  return `%${term.replace(/[\\%_]/g, "\\$&")}%`;
}

// Storefront pages are ISR; after a catalogue edit, refresh the ones that can
// show the changed product or category.
export function revalidateStorefront({
  productSlugs = [],
  categorySlugs = [],
}: { productSlugs?: string[]; categorySlugs?: string[] } = {}) {
  revalidatePath("/");
  revalidatePath("/collections/new-in");
  for (const slug of productSlugs) revalidatePath(`/products/${slug}`);
  for (const slug of categorySlugs) revalidatePath(`/collections/${slug}`);
  // Curated collections pick products by slug and may include this one.
  revalidatePath("/collections/[slug]", "page");
}
