import Link from "next/link";
import { footerNav } from "@/lib/catalog";

export function SiteFooter() {
  return (
    <footer className="theme-inverse">
      <div className="container-page section grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-[2fr_repeat(3,1fr)]">
        <div className="col-span-2 flex flex-col gap-4 lg:col-span-1">
          <p className="text-title uppercase tracking-wordmark">Atelier</p>
          <p className="max-w-xs text-body-sm text-ink-muted">
            Leather goods, shoes and ready-to-wear, made in small runs by
            people who sign their work.
          </p>
        </div>

        {footerNav.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="eyebrow mb-5 text-ink-subtle">{group.title}</h2>
            <ul className="flex flex-col gap-3">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="link-quiet text-body-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="container-page flex flex-col gap-2 border-t py-6 text-caption text-ink-subtle sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} Atelier. All rights reserved.</p>
        <p>United States · English · USD</p>
      </div>
    </footer>
  );
}
