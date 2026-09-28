import { MiniBag } from "@/components/cart/mini-bag";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

// Header, footer and bag drawer around every storefront page (the admin
// dashboard has its own shell).
export function StoreChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <MiniBag />
    </>
  );
}
