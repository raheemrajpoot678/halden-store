import { BrandStatement } from "@/components/home/brand-statement";
import { EditorialStory } from "@/components/home/editorial-story";
import { FeaturedCollections } from "@/components/home/featured-collections";
import { GiftEdit } from "@/components/home/gift-edit";
import { Hero } from "@/components/home/hero";
import { NewArrivals } from "@/components/home/new-arrivals";
import { Services } from "@/components/home/services";
import { ShopByCategory } from "@/components/home/shop-by-category";

// Product rows come from the database; regenerate at most once a minute.
export const revalidate = 60;

export default function Home() {
  return (
    <>
      <Hero />
      <NewArrivals />
      <FeaturedCollections />
      <BrandStatement />
      <ShopByCategory />
      <EditorialStory />
      <GiftEdit />
      <Services />
    </>
  );
}
