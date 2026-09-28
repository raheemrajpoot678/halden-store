import Link from "next/link";
import {
  EmptyState,
  FilterBar,
  PageHeader,
  Pagination,
  ProductStatusBadge,
  table,
} from "@/components/admin/ui";
import { UnsplashImage } from "@/components/unsplash-image";
import { PRODUCT_STATUSES } from "@/db/schema";
import { listAdminProducts, listCategoryOptions } from "@/lib/admin/catalog";
import { oneOf, pageParam, param, withParams } from "@/lib/admin/params";
import { formatPrice } from "@/lib/format";
import { requireAdmin } from "@/lib/session";
import { getStockStatus } from "@/lib/stock";

export const metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin("/admin/products");
  const params = await searchParams;
  const query = param(params, "q") ?? "";
  const status = oneOf(param(params, "status"), PRODUCT_STATUSES);
  const categoryId = Number(param(params, "category")) || undefined;
  const lowStock = param(params, "stock") === "low";

  const [{ rows, total, page, pageCount }, categories] = await Promise.all([
    listAdminProducts({ query, status, categoryId, lowStock, page: pageParam(params) }),
    listCategoryOptions(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        actions={
          <Link href="/admin/products/new" className="btn btn-primary btn-sm">
            Add product
          </Link>
        }
      />

      <FilterBar action="/admin/products" hasFilters={Boolean(query || status || categoryId || lowStock)}>
        <div className="md:w-64">
          <label htmlFor="q" className="field-label">Search</label>
          <input id="q" name="q" type="search" defaultValue={query} placeholder="Name or slug" className="field" />
        </div>
        <div className="md:w-40">
          <label htmlFor="status" className="field-label">Status</label>
          <select id="status" name="status" defaultValue={status ?? ""} className="field">
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="md:w-48">
          <label htmlFor="category" className="field-label">Category</label>
          <select id="category" name="category" defaultValue={categoryId ?? ""} className="field">
            <option value="">All</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
        <div className="md:w-40">
          <label htmlFor="stock" className="field-label">Stock</label>
          <select id="stock" name="stock" defaultValue={lowStock ? "low" : ""} className="field">
            <option value="">All</option>
            <option value="low">Low or sold out</option>
          </select>
        </div>
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState title="No products match">
          <Link href="/admin/products/new" className="link">Add a product</Link>
        </EmptyState>
      ) : (
        <table className={table.root}>
          <thead className={table.head}>
            <tr className={table.headRow}>
              <th scope="col" className={table.th}>Product</th>
              <th scope="col" className={table.th}>Status</th>
              <th scope="col" className={table.th}>Category</th>
              <th scope="col" className={table.th}>Stock</th>
              <th scope="col" className={table.thEnd}>Price</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((product) => {
              const stock = getStockStatus(product.stock);
              return (
                <tr key={product.id} className={table.row}>
                  <td className={`col-span-2 ${table.td}`}>
                    <Link href={`/admin/products/${product.id}`} className="flex items-center gap-3">
                      <span className="media-frame w-10 shrink-0">
                        <UnsplashImage src={product.images[0].src} alt="" fill sizes="40px" />
                      </span>
                      <span className="min-w-0">
                        <span className="link-quiet block truncate text-body">{product.name}</span>
                        <span className="block truncate text-ink-muted">{product.colour}</span>
                      </span>
                    </Link>
                  </td>
                  <td className={table.td}><ProductStatusBadge status={product.status} /></td>
                  <td className={`text-ink-muted ${table.td}`}>{product.categoryName}</td>
                  <td className={table.td}>
                    <span className={stock.state === "in-stock" ? "" : "text-sale"}>
                      {stock.state === "sold-out" ? "Sold out" : `${product.stock} in stock`}
                    </span>
                  </td>
                  <td className={`max-md:text-left ${table.tdEnd}`}>{formatPrice(product.priceCents)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <Pagination
        page={page}
        pageCount={pageCount}
        total={total}
        href={(p) => withParams("/admin/products", params, { page: p })}
      />
    </>
  );
}
