import type { Metadata } from "next";
import { CART_COOKIE } from "@/lib/cart-config";
import { ContentPage, ContentSection } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Cookie settings",
  description: "The cookies Halden uses and why.",
};

const cookies = [
  {
    name: "better-auth.session_token",
    purpose: "Keeps you signed in to your account.",
    duration: "Up to 7 days",
  },
  {
    name: CART_COOKIE,
    purpose: "Remembers your bag before you sign in.",
    duration: "30 days",
  },
];

export default function CookiesPage() {
  return (
    <ContentPage
      href="/legal/cookies"
      navGroup="Legal"
      title="Cookie settings"
      updated="September 2026"
      intro="We only use strictly necessary cookies. There is no advertising or analytics tracking, so there’s nothing to switch off."
    >
      <ContentSection title="Cookies we set">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="ui-label text-ink">
              <tr className="border-b">
                <th scope="col" className="py-3 pr-4 font-medium">Cookie</th>
                <th scope="col" className="py-3 pr-4 font-medium">Purpose</th>
                <th scope="col" className="py-3 font-medium">Duration</th>
              </tr>
            </thead>
            <tbody>
              {cookies.map((cookie) => (
                <tr key={cookie.name} className="border-b align-top">
                  <td className="py-3 pr-4 font-mono text-ink">{cookie.name}</td>
                  <td className="py-3 pr-4">{cookie.purpose}</td>
                  <td className="py-3 whitespace-nowrap">{cookie.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentSection>

      <ContentSection title="Checkout">
        <p>
          Checkout takes place on Stripe’s secure page, which sets its own
          cookies to process payment and prevent fraud.
        </p>
      </ContentSection>

      <ContentSection title="Managing cookies">
        <p>
          You can clear or block cookies in your browser settings. Blocking
          them will sign you out and empty a guest bag.
        </p>
      </ContentSection>
    </ContentPage>
  );
}
