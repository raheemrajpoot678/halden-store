import Link from "next/link";
import { primaryNav } from "@/lib/catalog";
import { SearchIcon, UserIcon } from "@/components/icons";
import { BagButton } from "@/components/cart/bag-button";
import { MobileMenu } from "@/components/mobile-menu";

export function SiteHeader() {
  return (
    <>
      <p className="eyebrow bg-ink py-2.5 text-center text-canvas">
        Complimentary express shipping and returns
      </p>

      <header className="sticky top-0 z-40 border-b bg-canvas/95 backdrop-blur-sm">
        <div className="container-page grid h-header grid-cols-[1fr_auto_1fr] items-center lg:h-header-lg">
          <div className="flex items-center">
            <MobileMenu items={primaryNav} />
            <Link href="/search" className="icon-btn" aria-label="Search">
              <SearchIcon />
            </Link>
          </div>

          <Link
            href="/"
            className="text-title uppercase tracking-wordmark"
            aria-label="Halden home"
          >
            Halden
          </Link>

          <div className="-mr-3 flex items-center justify-end">
            <Link href="/account" className="icon-btn" aria-label="Account">
              <UserIcon />
            </Link>
            <BagButton />
          </div>
        </div>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="container-page flex h-12 items-center justify-center gap-10">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="link-quiet ui-label">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
    </>
  );
}
