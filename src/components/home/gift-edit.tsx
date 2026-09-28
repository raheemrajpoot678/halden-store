import { giftEditSlugs } from "@/lib/catalog";
import { getProductsBySlugs } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/home/section-heading";

export async function GiftEdit() {
  const giftEdit = await getProductsBySlugs(giftEditSlugs);

  return (
    <section aria-labelledby="gift-edit-title" className="section border-t">
      <div className="container-page">
        <SectionHeading
          id="gift-edit-title"
          eyebrow="Considered gifts"
          title="The Gift Edit"
          cta={{ label: "Shop gifts", href: "/collections/gifts" }}
        />
        <ul className="grid-products">
          {giftEdit.map((product) => (
            <li key={product.slug}>
              <ProductCard
                product={product}
                sizes="(min-width: 80rem) 25vw, (min-width: 48rem) 33vw, 50vw"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
