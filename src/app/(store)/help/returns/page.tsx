import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Returns",
  description: "Return or exchange within 30 days, collected from your door.",
};

export default function ReturnsPage() {
  return (
    <ContentPage
      href="/help/returns"
      navGroup="Client services"
      eyebrow="Client services"
      title="Returns"
      intro="Return or exchange within 30 days of delivery, collected from your door at no cost."
    >
      <ContentSection title="How to return">
        <ul>
          <li>
            <Link href="/help/contact">Contact client services</Link> within 30
            days of delivery with your order number and the pieces you’d like
            to return.
          </li>
          <li>We’ll arrange a free courier collection from your address.</li>
          <li>
            Pack pieces in their original packaging, with tags and dust bags.
          </li>
        </ul>
      </ContentSection>

      <ContentSection title="Refunds">
        <p>
          Once your return has been received and checked, we refund the
          original payment method. Your bank may take a few further days to
          show the refund.
        </p>
      </ContentSection>

      <ContentSection title="Exchanges">
        <p>
          To exchange for another colour or piece, tell us when arranging your
          return and we’ll reserve it while it’s in stock.
        </p>
      </ContentSection>

      <ContentSection title="Exceptions">
        <p>
          Personalised pieces and pieces that have been worn or altered can’t
          be returned, unless they arrive faulty.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
