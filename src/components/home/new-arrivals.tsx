import { newArrivalSlugs } from "@/lib/catalog";
import { getProductsBySlugs } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/home/section-heading";

export async function NewArrivals() {
  const newArrivals = await getProductsBySlugs(newArrivalSlugs);

  return (
    <section aria-labelledby="new-arrivals-title" className="section">
      <div className="container-page">
        <SectionHeading
          id="new-arrivals-title"
          eyebrow="Just landed"
          title="New arrivals"
          cta={{ label: "View all", href: "/collections/new-in" }}
        />
        <ul className="rail">
          {newArrivals.map((product) => (
            <li key={product.slug}>
              <ProductCard
                product={product}
                sizes="(min-width: 80rem) 25vw, (min-width: 48rem) 33vw, 70vw"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
