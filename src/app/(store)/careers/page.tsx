import type { Metadata } from "next";
import { clientServices } from "@/lib/catalog";
import { ContentPage, ContentSection } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Careers",
  description: "Work with the Halden workshop.",
};

export default function CareersPage() {
  return (
    <ContentPage
      href="/careers"
      navGroup="The company"
      eyebrow="Work with us"
      title="Careers"
      intro="We’re a small team of makers, designers and client advisors who care about doing things properly."
    >
      <ContentSection title="Open roles">
        <p>
          There are no open roles right now. We’re always glad to hear from
          skilled leatherworkers and client advisors.
        </p>
      </ContentSection>

      <ContentSection title="Get in touch">
        <p>
          Send a short note about yourself and your work to{" "}
          <a href={`mailto:${clientServices.email}?subject=Careers`}>
            {clientServices.email}
          </a>
          .
        </p>
      </ContentSection>
    </ContentPage>
  );
}
