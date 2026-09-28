import type { Metadata } from "next";
import Link from "next/link";
import { hero } from "@/lib/catalog";
import { ContentPage, ContentSection } from "@/components/content-page";

export const metadata: Metadata = {
  title: "About Halden",
  description: "Fewer things, made better, meant to be kept.",
};

export default function AboutPage() {
  return (
    <ContentPage
      href="/about"
      navGroup="The company"
      eyebrow="Our story"
      title="About Halden"
      intro="Fewer things, made better, meant to be kept."
      image={hero.images[0]}
    >
      <ContentSection title="Since the first stitch">
        <p>
          Halden began at a single workbench, making leather goods by hand
          for people who wanted to keep them for years. It still works the
          same way: we design in small collections and produce in limited
          runs, so every piece gets the time it deserves.
        </p>
        <p>
          Today we make bags, shoes, jewellery and ready-to-wear, each made
          by people who sign their work.
        </p>
      </ContentSection>

      <ContentSection title="What we believe">
        <ul>
          <li>Honest materials, chosen for how they age, not how they photograph.</li>
          <li>Quiet design that outlasts the season it was made for.</li>
          <li>Small runs over overstock: when a piece is gone, it’s gone.</li>
        </ul>
      </ContentSection>

      <ContentSection title="Read more">
        <p>
          Go <Link href="/stories/workshop">inside the workshop</Link>, or read
          how we approach <Link href="/sustainability">sustainability</Link>.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
