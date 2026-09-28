import type { Metadata } from "next";
import Link from "next/link";
import { SHIPPING_COUNTRIES, SHIPPING_RATE } from "@/lib/checkout-config";
import { ContentPage, ContentSection } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Shipping",
  description: "Complimentary express shipping on every order.",
};

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

export default function ShippingPage() {
  const countries = SHIPPING_COUNTRIES.map((code) => countryNames.of(code) ?? code).sort();

  return (
    <ContentPage
      href="/help/shipping"
      navGroup="Client services"
      eyebrow="Client services"
      title="Shipping"
      intro="Every order ships free by express courier, packed in our signature box."
    >
      <ContentSection title="Delivery times">
        <p>
          {SHIPPING_RATE.displayName} arrives in {SHIPPING_RATE.minBusinessDays}–
          {SHIPPING_RATE.maxBusinessDays} business days from dispatch. Orders placed while
          signed in appear in <Link href="/account">your account</Link>.
        </p>
      </ContentSection>

      <ContentSection title="Where we ship">
        <p>We currently deliver to:</p>
        <ul className="sm:columns-2">
          {countries.map((country) => (
            <li key={country}>{country}</li>
          ))}
        </ul>
      </ContentSection>

      <ContentSection title="Duties and taxes">
        <p>
          Prices are charged in US dollars. Orders delivered outside the United
          States may be subject to import duties and taxes, payable on
          delivery.
        </p>
      </ContentSection>

      <ContentSection title="Questions">
        <p>
          For anything about a delivery, <Link href="/help/contact">contact
          client services</Link> with your order number.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
