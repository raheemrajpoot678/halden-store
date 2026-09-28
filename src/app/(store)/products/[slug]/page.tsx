import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllProductSlugs, getProduct, getRelatedProducts } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { getStockStatus } from "@/lib/stock";
import { AddToBagButton } from "@/components/cart/add-to-bag-button";
import { ProductCard } from "@/components/product-card";
import { ProductAccordion } from "@/components/product/product-accordion";
import { ProductGallery } from "@/components/product/product-gallery";
import { StockIndicator } from "@/components/product/stock-indicator";

// Prerendered at build, regenerated in the background at most once a minute.
// Products added later render on first request; unknown slugs 404 below.
export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/products/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProduct(slug);
  if (!product) return {};

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: `${product.images[0].src}?w=1200`, alt: product.images[0].alt }],
    },
  };
}

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const soldOut = getStockStatus(product.stock).state === "sold-out";
  const related = await getRelatedProducts(product);
  const categoryHref = `/collections/${product.categorySlug}`;

  return (
    <>
      <div className="container-page grid gap-8 pb-section lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16 lg:pt-8 xl:gap-24">
        <ProductGallery images={product.images} />

        <div className="lg:sticky lg:top-[calc(var(--spacing-header-lg)+3rem+2rem)] lg:self-start">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="eyebrow flex flex-wrap items-center gap-2 text-ink-subtle">
              <li>
                <Link href="/" className="link-quiet">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={categoryHref} className="link-quiet">
                  {product.category}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-ink">
                {product.name}
              </li>
            </ol>
          </nav>

          <div className="flex flex-col gap-4">
            {product.badge && !soldOut ? (
              <p className="eyebrow text-accent">{product.badge}</p>
            ) : null}
            <h1 className="text-heading">{product.name}</h1>
            <p className="text-lead">{formatPrice(product.priceCents)}</p>
          </div>

          <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t pt-6 text-body-sm">
            <dt className="text-ink-subtle">Category</dt>
            <dd>
              <Link href={categoryHref} className="link">
                {product.category}
              </Link>
            </dd>
            <dt className="text-ink-subtle">Colour</dt>
            <dd>{product.colour}</dd>
            <dt className="text-ink-subtle">Availability</dt>
            <dd>
              <StockIndicator stock={product.stock} />
            </dd>
          </dl>

          <div className="mt-8 flex flex-col gap-3">
            {soldOut ? (
              <>
                <button type="button" className="btn btn-primary w-full" disabled>
                  Sold out
                </button>
                <button type="button" className="btn btn-secondary w-full">
                  Notify me when available
                </button>
              </>
            ) : (
              <AddToBagButton
                product={{
                  slug: product.slug,
                  name: product.name,
                  colour: product.colour,
                  category: product.category,
                  image: product.images[0],
                  unitPriceCents: product.priceCents,
                  stock: product.stock,
                }}
              />
            )}
          </div>

          <ul className="mt-6 flex flex-col gap-1 text-body-sm text-ink-muted">
            <li>Complimentary express shipping</li>
            <li>Free returns within 30 days</li>
          </ul>

          <p className="mt-10 text-body text-ink-muted">{product.description}</p>

          <div className="mt-8">
            <ProductAccordion
              items={[
                {
                  title: "Product details",
                  open: true,
                  content: (
                    <ul className="flex list-disc flex-col gap-1.5 pl-4">
                      {product.details.map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                  ),
                },
                {
                  title: "Shipping & returns",
                  content: (
                    <p>
                      Complimentary express delivery in 2–4 business days, in our
                      signature packaging. Return or exchange unworn items
                      within 30 days and we’ll collect them from your door.
                    </p>
                  ),
                },
                {
                  title: "Care",
                  content: (
                    <p>
                      Store in the dust bag provided, away from direct sunlight
                      and humidity. Our client advisors can arrange repairs and
                      refurbishment for the life of the piece.
                    </p>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>

      <section aria-labelledby="related-title" className="section border-t">
        <div className="container-page">
          <h2 id="related-title" className="mb-block text-heading">
            You may also like
          </h2>
          <ul className="grid-products">
            {related.map((item) => (
              <li key={item.slug}>
                <ProductCard
                  product={item}
                  sizes="(min-width: 80rem) 25vw, (min-width: 48rem) 33vw, 50vw"
                />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
