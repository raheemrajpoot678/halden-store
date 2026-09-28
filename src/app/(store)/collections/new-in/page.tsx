import type { Metadata } from "next";
import { getLatestProducts } from "@/lib/products";
import { CollectionPage } from "@/components/collection-page";

// Product rows come from the database; regenerate at most once a minute.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "New arrivals",
  description: "The latest pieces from the Halden workshop, newest first.",
};

export default async function NewArrivalsPage() {
  const products = await getLatestProducts();

  return (
    <CollectionPage
      eyebrow="Just landed"
      title="New arrivals"
      description="The latest pieces from the Halden workshop, newest first."
      products={products}
    />
  );
}
