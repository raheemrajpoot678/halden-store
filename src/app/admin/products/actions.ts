"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PRODUCT_STATUSES, type ProductStatus } from "@/db/schema";
import { errorMessage, requireAdminAction, type FormState } from "@/lib/admin/authorize";
import {
  adjustStock,
  createProduct,
  getAdminProduct,
  isProductSlugTaken,
  setProductStatus,
  updateProduct,
} from "@/lib/admin/catalog";
import { revalidateStorefront } from "@/lib/admin/shared";
import { parseProductForm } from "@/lib/admin/validation";

function isId(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

// Creates a product (productId null) or updates one.
export async function saveProduct(
  productId: number | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { error } = await requireAdminAction();
  if (error) return { error };
  if (productId !== null && !isId(productId)) return { error: "Product not found." };

  const parsed = parseProductForm(formData);
  if (parsed.error !== null) return { error: parsed.error };
  const input = parsed.input;

  if (await isProductSlugTaken(input.slug, productId ?? undefined)) {
    return { error: `Another product already uses the URL /products/${input.slug}.` };
  }

  let id = productId;
  try {
    if (id === null) {
      id = await createProduct(input);
    } else {
      const result = await updateProduct(id, input);
      if (!result) return { error: "Product not found." };
      if (result.previousSlug !== input.slug) revalidatePath(`/products/${result.previousSlug}`);
    }
  } catch (e) {
    return { error: errorMessage(e) };
  }

  const product = await getAdminProduct(id);
  revalidateStorefront({
    productSlugs: [input.slug],
    categorySlugs: product ? [product.categorySlug] : [],
  });
  revalidatePath("/admin/products");
  revalidatePath("/admin");

  if (productId === null) redirect(`/admin/products/${id}?created=1`);
  revalidatePath(`/admin/products/${id}`);
  return { error: null, message: "Saved." };
}

export async function changeProductStatus(productId: number, status: ProductStatus): Promise<FormState> {
  const { error } = await requireAdminAction();
  if (error) return { error };
  if (!isId(productId) || !PRODUCT_STATUSES.includes(status)) return { error: "Invalid request." };

  const product = await getAdminProduct(productId);
  if (!product) return { error: "Product not found." };
  await setProductStatus(productId, status);

  revalidateStorefront({ productSlugs: [product.slug], categorySlugs: [product.categorySlug] });
  revalidatePath("/admin/products", "layout");
  return { error: null };
}

export async function changeStock(productId: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const { error } = await requireAdminAction();
  if (error) return { error };
  if (!isId(productId)) return { error: "Product not found." };

  const delta = Number(formData.get("delta"));
  if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 100_000) {
    return { error: "Enter a whole number to add (or a negative number to remove)." };
  }
  const result = await adjustStock(productId, delta);
  if (!result) return { error: "That would take stock below zero." };

  const product = await getAdminProduct(productId);
  revalidateStorefront({ productSlugs: [result.slug], categorySlugs: product ? [product.categorySlug] : [] });
  revalidatePath("/admin/products", "layout");
  revalidatePath("/admin");
  return { error: null, message: `Stock is now ${result.stock}.` };
}
