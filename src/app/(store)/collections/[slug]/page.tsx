import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllCategorySlugs,
  getCategory,
  getProductsByCategory,
  getProductsBySlugs,
} from "@/lib/products";
import { curatedCollections, getCuratedCollection } from "@/lib/catalog";
import { CollectionPage } from "@/components/collection-page";

// Prerendered at build, regenerated in the background at most once a minute.
// Categories added later render on first request; unknown slugs 404 below.
// Curated collections (women, men, gifts) come from src/lib/catalog.ts and
// take precedence over a category with the same slug.
export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getAllCategorySlugs();
  return [...curatedCollections.map((collection) => collection.slug), ...slugs]
    .filter((slug, index, all) => all.indexOf(slug) === index)
    .map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/collections/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;

  const curated = getCuratedCollection(slug);
  if (curated) {
    return { title: curated.title, description: curated.description };
  }

  const category = await getCategory(slug);
  if (!category) return {};

  return {
    title: category.name,
    description: `Shop ${category.name.toLowerCase()} from Halden.`,
  };
}

export default async function CategoryPage(
  props: PageProps<"/collections/[slug]">,
) {
  const { slug } = await props.params;

  const curated = getCuratedCollection(slug);
  if (curated) {
    const products = await getProductsBySlugs(curated.productSlugs);
    return (
      <CollectionPage
        eyebrow={curated.eyebrow}
        title={curated.title}
        description={curated.description}
        products={products}
      />
    );
  }

  const category = await getCategory(slug);
  if (!category) notFound();

  const products = await getProductsByCategory(category.slug);

  return (
    <CollectionPage eyebrow="Collection" title={category.name} products={products} />
  );
}
