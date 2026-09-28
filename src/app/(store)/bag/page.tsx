import type { Metadata } from "next";
import { getCart } from "@/lib/cart";
import { BagContents } from "@/components/cart/bag-contents";

export const metadata: Metadata = {
  title: "Shopping bag",
  robots: { index: false },
};

export default async function BagPage({ searchParams }: PageProps<"/bag">) {
  const { checkout } = await searchParams;
  return (
    <BagContents
      initialCart={await getCart()}
      checkoutCancelled={checkout === "cancelled"}
    />
  );
}
