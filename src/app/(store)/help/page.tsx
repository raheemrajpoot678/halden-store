import type { Metadata } from "next";
import Link from "next/link";
import { clientServices } from "@/lib/catalog";
import { ContentPage, ContentSection } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Answers on orders, payment, shipping, returns and your account.",
};

export default function HelpPage() {
  return (
    <ContentPage
      href="/help"
      navGroup="Client services"
      eyebrow="Client services"
      title="Frequently asked questions"
      intro="The questions we’re asked most often. If yours isn’t here, our client advisors are happy to help."
    >
      <ContentSection title="Orders and payment">
        <p>
          <strong className="text-ink">Which currency do you charge in?</strong>{" "}
          All prices are shown and charged in US dollars.
        </p>
        <p>
          <strong className="text-ink">How can I pay?</strong> Checkout is
          handled securely by Stripe. The payment methods available depend on
          your country and are shown at checkout.
        </p>
        <p>
          <strong className="text-ink">Where can I see my orders?</strong> Sign
          in and visit <Link href="/account">your account</Link> for every order
          placed while signed in, with its status.
        </p>
        <p>
          <strong className="text-ink">Is my bag saved?</strong> Your bag is
          kept on this device, and moves to your account when you sign in.
          Pieces are only reserved once you continue to payment.
        </p>
      </ContentSection>

      <ContentSection title="Shipping and returns">
        <p>
          Every order ships free by express courier. See{" "}
          <Link href="/help/shipping">shipping</Link> for delivery times and
          destinations, and <Link href="/help/returns">returns</Link> for our
          30-day policy.
        </p>
      </ContentSection>

      <ContentSection title="Products and care">
        <p>
          <strong className="text-ink">A piece is sold out. Will it return?</strong>{" "}
          We produce in small runs, so some pieces don’t come back. Contact us
          and we’ll let you know if another run is planned.
        </p>
        <p>
          <strong className="text-ink">Can you personalise leather goods?</strong>{" "}
          Selected leather goods can be hot-stamped with initials. Ask a client
          advisor before ordering.
        </p>
      </ContentSection>

      <ContentSection title="Still need help?">
        <p>
          Email <a href={`mailto:${clientServices.email}`}>{clientServices.email}</a>{" "}
          or see all the ways to <Link href="/help/contact">contact us</Link>.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
