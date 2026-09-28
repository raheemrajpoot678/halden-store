import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Sustainability",
  description: "Making less, making it well, and helping it last.",
};

export default function SustainabilityPage() {
  return (
    <ContentPage
      href="/sustainability"
      navGroup="The company"
      eyebrow="Our approach"
      title="Sustainability"
      intro="The most sustainable piece is the one you keep. We try to make less, make it well, and help it last."
    >
      <ContentSection title="Small runs">
        <p>
          We produce in limited quantities and rarely restock, so we don’t
          make what won’t be worn. That’s why some pieces sell out for good.
        </p>
      </ContentSection>

      <ContentSection title="Materials that age well">
        <p>
          We choose leathers and fabrics for how they wear over time, and
          build pieces so the parts that wear first can be repaired.
        </p>
      </ContentSection>

      <ContentSection title="Care and repair">
        <p>
          If something needs attention, <Link href="/help/contact">contact
          client services</Link> and we’ll advise on care or repair.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
