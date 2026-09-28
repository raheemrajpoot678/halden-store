import type { Metadata } from "next";
import Link from "next/link";
import { clientServices } from "@/lib/catalog";
import { ContentPage, ContentSection } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What personal data Halden collects and how it is used.",
};

export default function PrivacyPage() {
  return (
    <ContentPage
      href="/legal/privacy"
      navGroup="Legal"
      title="Privacy policy"
      updated="September 2026"
      intro="This policy explains what we collect when you use this site, why, and the choices you have."
    >
      <ContentSection title="What we collect">
        <ul>
          <li>
            <strong className="text-ink">Account details</strong>: your name,
            email address and a securely hashed password when you create an
            account.
          </li>
          <li>
            <strong className="text-ink">Orders</strong>: the pieces you buy,
            amounts and your shipping details.
          </li>
          <li>
            <strong className="text-ink">Your bag</strong>: the pieces you add,
            linked to your account or to a cookie on your device.
          </li>
        </ul>
      </ContentSection>

      <ContentSection title="Payments">
        <p>
          Payments are processed by Stripe on its secure checkout page. We
          never see or store your full card details. Stripe’s handling of your
          data is covered by its own privacy policy.
        </p>
      </ContentSection>

      <ContentSection title="How we use it">
        <p>
          We use your data to run your account, fulfil and support your
          orders, and keep the site secure. We don’t sell your data.
        </p>
      </ContentSection>

      <ContentSection title="Cookies">
        <p>
          We only use cookies that the site needs to work. See{" "}
          <Link href="/legal/cookies">cookie settings</Link>.
        </p>
      </ContentSection>

      <ContentSection title="Your rights">
        <p>
          You can ask to see, correct or delete your data at any time by
          emailing <a href={`mailto:${clientServices.email}`}>{clientServices.email}</a>.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
