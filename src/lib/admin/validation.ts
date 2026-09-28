// Hand-written parsing of admin form submissions (no validation library).
// Each parser returns either the typed input or the first error to show.
import { PRODUCT_STATUSES, type Photo, type ProductStatus } from "@/db/schema";
import type { CategoryInput, ProductInput } from "@/lib/admin/catalog";

type Parsed<T> = { input: T; error: null } | { input: null; error: string };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_IMAGES = 8;

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

// "1,250.50" → 125050 cents; null if it isn't a plain non-negative amount.
export function parseCents(value: string) {
  const cleaned = value.replace(/[$,\s]/g, "");
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ""] = cleaned.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

// Photos must come from Unsplash's CDN: that's the only remote host the
// storefront's UnsplashImage loader (and next.config) serves.
export function parsePhotoUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "images.unsplash.com") return null;
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function parseProductForm(formData: FormData): Parsed<ProductInput> {
  const fail = (error: string) => ({ input: null, error }) as const;

  const name = str(formData, "name");
  if (!name || name.length > 120) return fail("Give the product a name (up to 120 characters).");

  const slug = str(formData, "slug") || slugify(name);
  if (!SLUG.test(slug) || slug.length > 120) {
    return fail("The URL slug can only use lowercase letters, numbers and single hyphens.");
  }

  const categoryId = Number(str(formData, "categoryId"));
  if (!Number.isInteger(categoryId) || categoryId <= 0) return fail("Choose a category.");

  const priceCents = parseCents(str(formData, "price"));
  if (priceCents === null) return fail("Enter a price in dollars, e.g. 1250 or 1250.00.");

  // Absent on the edit form, where stock is adjusted separately.
  const stock = formData.has("stock") ? Number(str(formData, "stock")) : 0;
  if (!Number.isInteger(stock) || stock < 0 || stock > 100_000) {
    return fail("Stock must be a whole number of zero or more.");
  }

  const colour = str(formData, "colour");
  if (!colour || colour.length > 60) return fail("Add the colour (up to 60 characters).");

  const description = str(formData, "description");
  if (!description || description.length > 2000) {
    return fail("Add a description (up to 2,000 characters).");
  }

  const badge = str(formData, "badge").slice(0, 30) || null;

  const details = str(formData, "details")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (details.length > 20 || details.some((line) => line.length > 200)) {
    return fail("Keep details to 20 lines of up to 200 characters.");
  }

  const srcs = formData.getAll("imageSrc");
  const alts = formData.getAll("imageAlt");
  const images: Photo[] = [];
  for (let i = 0; i < srcs.length; i++) {
    const rawSrc = typeof srcs[i] === "string" ? (srcs[i] as string).trim() : "";
    const alt = typeof alts[i] === "string" ? (alts[i] as string).trim() : "";
    if (!rawSrc && !alt) continue;
    const src = parsePhotoUrl(rawSrc);
    if (!src) return fail(`Photo ${i + 1}: use an https://images.unsplash.com/… URL.`);
    if (!alt || alt.length > 200) return fail(`Photo ${i + 1}: describe the photo in the alt text.`);
    images.push({ src, alt });
  }
  if (images.length === 0) return fail("Add at least one photo.");
  if (images.length > MAX_IMAGES) return fail(`Use up to ${MAX_IMAGES} photos.`);

  const statusValue = str(formData, "status");
  const status = (PRODUCT_STATUSES as readonly string[]).includes(statusValue)
    ? (statusValue as ProductStatus)
    : "draft";

  return {
    input: {
      name,
      slug,
      categoryId,
      priceCents,
      stock,
      colour,
      description,
      badge,
      details,
      images: images as [Photo, ...Photo[]],
      status,
    },
    error: null,
  };
}

export function parseCategoryForm(formData: FormData): Parsed<CategoryInput> {
  const fail = (error: string) => ({ input: null, error }) as const;

  const name = str(formData, "name");
  if (!name || name.length > 60) return fail("Give the category a name (up to 60 characters).");

  const slug = str(formData, "slug") || slugify(name);
  if (!SLUG.test(slug) || slug.length > 60) {
    return fail("The URL slug can only use lowercase letters, numbers and single hyphens.");
  }

  const description = str(formData, "description").slice(0, 500) || null;

  const rawImage = str(formData, "imageUrl");
  const imageAlt = str(formData, "imageAlt") || null;
  let imageUrl: string | null = null;
  if (rawImage) {
    imageUrl = parsePhotoUrl(rawImage);
    if (!imageUrl) return fail("Use an https://images.unsplash.com/… URL for the tile image.");
    if (!imageAlt) return fail("Describe the tile image in the alt text.");
  }

  return {
    input: { name, slug, description, imageUrl, imageAlt: imageUrl ? imageAlt : null },
    error: null,
  };
}
