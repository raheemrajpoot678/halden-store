import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm, ProductStatusActions, StockForm } from "@/components/admin/product-form";
import { PageHeader, Panel, ProductStatusBadge } from "@/components/admin/ui";
import { getAdminProduct, listCategoryOptions } from "@/lib/admin/catalog";
import { requireAdmin } from "@/lib/session";
import { changeProductStatus, changeStock, saveProduct } from "../actions";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const { id: rawId } = await params;
  const created = (await searchParams).created === "1";
  await requireAdmin(`/admin/products/${rawId}`);
  const id = Number(rawId);
  const [product, categories] = await Promise.all([
    Number.isInteger(id) && id > 0 ? getAdminProduct(id) : null,
    listCategoryOptions(),
  ]);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        back={{ href: "/admin/products", label: "Products" }}
        title={product.name}
        description={
          <span className="flex flex-wrap items-center gap-3">
            <ProductStatusBadge status={product.status} />
            {product.status === "active" ? (
              <Link href={`/products/${product.slug}`} className="link" target="_blank">
                View on store
              </Link>
            ) : (
              <span>Not visible on the store</span>
            )}
          </span>
        }
        actions={<ProductStatusActions status={product.status} action={changeProductStatus.bind(null, product.id)} />}
      />

      {created ? (
        <p role="status" className="mb-6 border border-success px-5 py-4 text-body-sm text-success">
          Product created{product.status === "draft" ? " as a draft. Publish it when it’s ready." : "."}
        </p>
      ) : null}

      <div className="flex flex-col gap-6">
        <Panel title="Inventory" className="xl:max-w-[calc((100%-1.5rem)/3)]">
          <StockForm stock={product.stock} action={changeStock.bind(null, product.id)} />
        </Panel>
        <ProductForm
          key={product.updatedAt.toISOString()}
          categories={categories}
          action={saveProduct.bind(null, product.id)}
          submitLabel="Save changes"
          values={{
            name: product.name,
            slug: product.slug,
            categoryId: product.categoryId,
            price: (product.priceCents / 100).toFixed(2),
            badge: product.badge ?? "",
            colour: product.colour,
            description: product.description,
            details: product.details.join("\n"),
            images: product.images,
            status: product.status,
          }}
        />
      </div>
    </>
  );
}
