import type { Metadata } from "next";
import { clientServices } from "@/lib/catalog";
import { ContentPage, ContentSection } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Accessibility",
  description: "Our commitment to an accessible store.",
};

export default function AccessibilityPage() {
  return (
    <ContentPage
      href="/accessibility"
      navGroup="Legal"
      title="Accessibility"
      intro="We want everyone to be able to browse and buy from Halden, whatever device or assistive technology they use."
    >
      <ContentSection title="Our approach">
        <ul>
          <li>Semantic structure and labelled controls for screen readers.</li>
          <li>Every feature usable with a keyboard alone.</li>
          <li>Text and controls that remain usable when zoomed to 200%.</li>
          <li>Descriptive alternative text on product and editorial imagery.</li>
        </ul>
        <p>We aim to meet the Web Content Accessibility Guidelines 2.2, level AA.</p>
      </ContentSection>

      <ContentSection title="Feedback">
        <p>
          If something on the site is hard to use, please tell us at{" "}
          <a href={`mailto:${clientServices.email}?subject=Accessibility`}>
            {clientServices.email}
          </a>{" "}
          or {clientServices.phone}. A client advisor can also take your order
          by phone.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
