import Link from "next/link";
import type { Product } from "@/lib/products";
import { ProductCard } from "@/components/product-card";

// Shared layout for product listing pages (/collections/*): breadcrumb,
// heading, product count and the product grid, with an empty state.
export function CollectionPage({
  title,
  eyebrow,
  description,
  products,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  products: Product[];
}) {
  return (
    <div className="container-page pt-8 pb-section lg:pt-12">
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="eyebrow flex flex-wrap items-center gap-2 text-ink-subtle">
          <li>
            <Link href="/" className="link-quiet">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            {title}
          </li>
        </ol>
      </nav>

      <header className="mb-block flex flex-col gap-3">
        {eyebrow ? <p className="eyebrow text-ink-subtle">{eyebrow}</p> : null}
        <h1 className="text-heading">{title}</h1>
        {description ? (
          <p className="max-w-md text-lead text-ink-muted">{description}</p>
        ) : null}
      </header>

      {products.length > 0 ? (
        <>
          <p className="mb-6 border-t pt-4 text-body-sm text-ink-muted">
            {products.length} {products.length === 1 ? "piece" : "pieces"}
          </p>
          <ul className="grid-products">
            {products.map((product) => (
              <li key={product.slug}>
                <ProductCard
                  product={product}
                  sizes="(min-width: 80rem) 25vw, (min-width: 48rem) 33vw, 50vw"
                />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="flex flex-col items-start gap-6 border-t pt-8">
          <p className="text-body text-ink-muted">
            Nothing here just yet. Check back soon.
          </p>
          <Link href="/" className="btn btn-secondary">
            Return to the homepage
          </Link>
        </div>
      )}
    </div>
  );
}
