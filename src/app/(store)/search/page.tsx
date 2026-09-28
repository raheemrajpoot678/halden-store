import type { Metadata } from "next";
import Link from "next/link";
import { searchProducts } from "@/lib/products";
import { primaryNav } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Halden’s bags, shoes, jewellery and ready-to-wear.",
};

export default async function SearchPage(props: PageProps<"/search">) {
  const { q } = await props.searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim().slice(0, 100) ?? "";
  const results = query ? await searchProducts(query) : [];

  return (
    <div className="container-page pt-8 pb-section lg:pt-12">
      <header className="mb-block flex flex-col gap-6">
        <h1 className="text-heading">Search</h1>
        <form role="search" action="/search" className="flex max-w-xl gap-2">
          <label htmlFor="search-q" className="sr-only">
            Search products
          </label>
          <input
            id="search-q"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Bags, shoes, cognac…"
            autoComplete="off"
            maxLength={100}
            className="field flex-1"
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </header>

      {query ? (
        results.length > 0 ? (
          <>
            <p className="mb-6 border-t pt-4 text-body-sm text-ink-muted" aria-live="polite">
              {results.length} {results.length === 1 ? "result" : "results"} for
              “{query}”
            </p>
            <ul className="grid-products">
              {results.map((product) => (
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
            <p className="text-body text-ink-muted" aria-live="polite">
              Nothing matches “{query}”. Try a category or a colour instead.
            </p>
            <SuggestedLinks />
          </div>
        )
      ) : (
        <div className="flex flex-col gap-6 border-t pt-8">
          <p className="eyebrow text-ink-subtle">Popular</p>
          <SuggestedLinks />
        </div>
      )}
    </div>
  );
}

function SuggestedLinks() {
  return (
    <ul className="flex flex-wrap gap-2">
      {primaryNav.map((item) => (
        <li key={item.href}>
          <Link href={item.href} className="btn btn-secondary btn-sm">
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
