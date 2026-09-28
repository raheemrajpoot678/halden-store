import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Terms of sale",
  description: "The terms that apply when you buy from Halden.",
};

export default function TermsPage() {
  return (
    <ContentPage
      href="/legal/terms"
      navGroup="Legal"
      title="Terms of sale"
      updated="September 2026"
      intro="These terms apply to every order placed on this site."
    >
      <ContentSection title="Prices and payment">
        <p>
          Prices are shown and charged in US dollars. Payment is taken in full
          at checkout through Stripe. Your order is confirmed once payment
          succeeds.
        </p>
      </ContentSection>

      <ContentSection title="Availability">
        <p>
          We make pieces in small runs. Adding a piece to your bag doesn’t
          reserve it; stock is held for 30 minutes once you continue to
          payment, and released if checkout isn’t completed.
        </p>
      </ContentSection>

      <ContentSection title="Delivery">
        <p>
          Delivery is free. Times and destinations are set out on our{" "}
          <Link href="/help/shipping">shipping</Link> page.
        </p>
      </ContentSection>

      <ContentSection title="Returns">
        <p>
          You may return eligible pieces within 30 days of delivery, as
          described on our <Link href="/help/returns">returns</Link> page. This
          doesn’t affect your statutory rights.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
