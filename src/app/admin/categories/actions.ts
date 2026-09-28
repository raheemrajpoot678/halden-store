"use server";

import { revalidatePath } from "next/cache";
import { errorMessage, requireAdminAction, type FormState } from "@/lib/admin/authorize";
import {
  createCategory,
  deleteCategory,
  isCategorySlugTaken,
  updateCategory,
} from "@/lib/admin/catalog";
import { revalidateStorefront } from "@/lib/admin/shared";
import { parseCategoryForm } from "@/lib/admin/validation";

function isId(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export async function saveCategory(
  categoryId: number | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { error } = await requireAdminAction();
  if (error) return { error };
  if (categoryId !== null && !isId(categoryId)) return { error: "Category not found." };

  const parsed = parseCategoryForm(formData);
  if (parsed.error !== null) return { error: parsed.error };
  const input = parsed.input;

  if (await isCategorySlugTaken(input.slug, categoryId ?? undefined)) {
    return { error: `Another category already uses /collections/${input.slug}.` };
  }

  const categorySlugs = [input.slug];
  try {
    if (categoryId === null) {
      await createCategory(input);
    } else {
      const result = await updateCategory(categoryId, input);
      if (!result) return { error: "Category not found." };
      categorySlugs.push(result.previousSlug);
    }
  } catch (e) {
    return { error: errorMessage(e) };
  }

  revalidateStorefront({ categorySlugs });
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products", "layout");
  return { error: null, message: categoryId === null ? "Category added." : "Saved." };
}

export async function removeCategory(categoryId: number): Promise<FormState> {
  const { error } = await requireAdminAction();
  if (error) return { error };
  if (!isId(categoryId)) return { error: "Category not found." };

  const slug = await deleteCategory(categoryId);
  if (!slug) return { error: "Move or archive its products first: a category with products can’t be deleted." };

  revalidateStorefront({ categorySlugs: [slug] });
  revalidatePath("/admin/categories");
  return { error: null };
}
