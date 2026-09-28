import type { Metadata } from "next";
import Link from "next/link";
import { clientServices } from "@/lib/catalog";
import { ContentPage, ContentSection } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Reach a Halden client advisor by email or phone.",
};

export default function ContactPage() {
  return (
    <ContentPage
      href="/help/contact"
      navGroup="Client services"
      eyebrow="Client services"
      title="Contact us"
      intro="Our client advisors can help with orders, sizing, care and personalisation, or book you an appointment in person or by video."
    >
      <dl className="grid gap-px bg-line sm:grid-cols-2">
        <div className="flex flex-col gap-2 bg-canvas py-6 sm:pr-6">
          <dt className="ui-label">Email</dt>
          <dd>
            <a href={`mailto:${clientServices.email}`} className="link text-body">
              {clientServices.email}
            </a>
          </dd>
        </div>
        <div className="flex flex-col gap-2 bg-canvas py-6 sm:pl-6">
          <dt className="ui-label">Phone</dt>
          <dd className="flex flex-col gap-1">
            <a
              href={`tel:${clientServices.phone.replace(/[^+\d]/g, "")}`}
              className="link text-body"
            >
              {clientServices.phone}
            </a>
            <span className="text-body-sm text-ink-muted">{clientServices.hours}</span>
          </dd>
        </div>
      </dl>

      <ContentSection title="About an order">
        <p>
          Please include your order number, shown in{" "}
          <Link href="/account">your account</Link> and on your confirmation
          page, so we can help straight away. We reply within one business day.
        </p>
      </ContentSection>

      <ContentSection title="Book an appointment">
        <p>
          Shop in person or by video with a client advisor. Email us with a
          few times that suit you and what you’d like to see.
        </p>
      </ContentSection>

      <ContentSection title="Quick answers">
        <ul>
          <li>
            <Link href="/help/shipping">Shipping times and destinations</Link>
          </li>
          <li>
            <Link href="/help/returns">Returns and exchanges</Link>
          </li>
          <li>
            <Link href="/help">Frequently asked questions</Link>
          </li>
        </ul>
      </ContentSection>
    </ContentPage>
  );
}
