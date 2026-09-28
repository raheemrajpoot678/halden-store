import Link from "next/link";
import { CategoryForm, DeleteCategoryButton } from "@/components/admin/category-form";
import { EmptyState, PageHeader, Panel } from "@/components/admin/ui";
import { UnsplashImage } from "@/components/unsplash-image";
import { listAdminCategories } from "@/lib/admin/catalog";
import { requireAdmin } from "@/lib/session";
import { removeCategory, saveCategory } from "./actions";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireAdmin("/admin/categories");
  const categories = await listAdminCategories();

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Categories"
        description="Each product belongs to one category, shown at /collections/<slug>."
      />

      <div className="flex flex-col gap-6">
        <Panel title="New category">
          <CategoryForm
            idPrefix="new"
            values={{ name: "", slug: "", description: "", imageUrl: "", imageAlt: "" }}
            action={saveCategory.bind(null, null)}
            submitLabel="Add category"
            resetOnSuccess
          />
        </Panel>

        {categories.length === 0 ? (
          <EmptyState title="No categories yet" />
        ) : (
          <ul className="hairline-strong divide-y">
            {categories.map((category) => (
              <li key={category.id}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-4 py-4 hover:bg-surface [&::-webkit-details-marker]:hidden">
                    <span className="media-frame w-12 shrink-0">
                      {category.imageUrl ? (
                        <UnsplashImage src={category.imageUrl} alt="" fill sizes="48px" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-body">{category.name}</span>
                      <span className="block truncate text-body-sm text-ink-muted">/collections/{category.slug}</span>
                    </span>
                    <span className="text-right text-body-sm text-ink-muted">
                      {category.activeCount} listed
                      {category.productCount > category.activeCount
                        ? ` · ${category.productCount - category.activeCount} hidden`
                        : ""}
                    </span>
                    <span className="ui-label pr-2 text-ink-muted group-open:hidden">Edit</span>
                    <span className="ui-label hidden pr-2 text-ink-muted group-open:inline">Close</span>
                  </summary>
                  <div className="flex flex-col gap-6 border-t bg-surface/40 p-5">
                    <CategoryForm
                      idPrefix={`c${category.id}`}
                      values={{
                        name: category.name,
                        slug: category.slug,
                        description: category.description ?? "",
                        imageUrl: category.imageUrl ?? "",
                        imageAlt: category.imageAlt ?? "",
                      }}
                      action={saveCategory.bind(null, category.id)}
                      submitLabel="Save changes"
                    />
                    <div className="flex flex-wrap items-start justify-between gap-4 border-t pt-4">
                      <Link href={`/admin/products?category=${category.id}`} className="link text-body-sm">
                        View its {category.productCount} {category.productCount === 1 ? "product" : "products"}
                      </Link>
                      <DeleteCategoryButton
                        name={category.name}
                        disabled={category.productCount > 0}
                        action={removeCategory.bind(null, category.id)}
                      />
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
