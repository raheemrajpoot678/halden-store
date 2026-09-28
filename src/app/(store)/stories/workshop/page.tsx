import type { Metadata } from "next";
import Link from "next/link";
import { editorial } from "@/lib/catalog";
import { ContentPage, ContentSection } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Inside the workshop",
  description: "Every piece begins at a workbench. It takes longer. That is the point.",
};

export default function CraftsmanshipPage() {
  return (
    <ContentPage
      href="/stories/workshop"
      navGroup="The company"
      eyebrow={editorial.eyebrow}
      title={editorial.title}
      intro={editorial.body[0]}
      image={editorial.image}
    >
      <ContentSection title="Cut by eye">
        <p>
          Each hide is different. Our cutters read it before they cut it,
          placing every panel where the grain is strongest and the colour most
          even. Nothing is stamped out by the hundred.
        </p>
      </ContentSection>

      <ContentSection title="Edges in layers">
        <p>
          Edges are sanded, painted and polished by hand, one thin layer at a
          time, until they’re smooth enough to wear against a sleeve for
          years without fraying.
        </p>
      </ContentSection>

      <ContentSection title="Finished by the same hands">
        <p>
          The person who starts a piece finishes it. {editorial.body[1]}
        </p>
        <p>
          <Link href="/collections/bags">Shop bags</Link> or{" "}
          <Link href="/collections/small-leather-goods">small leather goods</Link>.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
