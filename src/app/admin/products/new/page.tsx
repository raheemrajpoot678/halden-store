import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui";
import { listCategoryOptions } from "@/lib/admin/catalog";
import { requireAdmin } from "@/lib/session";
import { saveProduct } from "../actions";

export const metadata = { title: "Add product" };

export default async function NewProductPage() {
  await requireAdmin("/admin/products/new");
  const categories = await listCategoryOptions();

  return (
    <>
      <PageHeader back={{ href: "/admin/products", label: "Products" }} title="Add product" />
      <ProductForm
        categories={categories}
        action={saveProduct.bind(null, null)}
        submitLabel="Create product"
        values={{
          name: "",
          slug: "",
          categoryId: null,
          price: "",
          stock: 0,
          badge: "",
          colour: "",
          description: "",
          details: "",
          images: [],
          status: "draft",
        }}
      />
    </>
  );
}
