import { UnsplashImage } from "@/components/unsplash-image";
import Link from "next/link";
import { homeCategorySlugs } from "@/lib/catalog";
import { getCategoriesBySlugs } from "@/lib/products";
import { SectionHeading } from "@/components/home/section-heading";

export async function ShopByCategory() {
  const categories = await getCategoriesBySlugs(homeCategorySlugs);

  return (
    <section aria-labelledby="categories-title" className="section bg-surface">
      <div className="container-page">
        <SectionHeading id="categories-title" title="Shop by category" />
        <ul className="grid grid-cols-2 gap-x-1 gap-y-8 lg:grid-cols-4 lg:gap-x-2">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/collections/${category.slug}`}
                className="group flex flex-col gap-4"
              >
                <div className="relative aspect-portrait overflow-hidden bg-surface-strong">
                  {category.image ? (
                    <UnsplashImage
                      src={category.image.src}
                      alt={category.image.alt}
                      fill
                      sizes="(min-width: 64rem) 25vw, 50vw"
                      className="object-cover transition-transform duration-700 ease-standard group-hover:scale-[1.03]"
                    />
                  ) : null}
                </div>
                <span className="ui-label self-center border-b border-transparent pb-1 transition-colors group-hover:border-ink">
                  {category.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
