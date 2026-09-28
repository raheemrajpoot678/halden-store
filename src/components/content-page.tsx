import Link from "next/link";
import type { ReactNode } from "react";
import { footerNav, type Photo } from "@/lib/catalog";
import { UnsplashImage } from "@/components/unsplash-image";

// Shared layout for editorial, help and legal pages: breadcrumb, heading,
// optional lead image, and a side nav listing the page's footer group so
// sibling pages stay one click away.
export function ContentPage({
  title,
  eyebrow,
  intro,
  image,
  navGroup,
  href,
  updated,
  children,
}: {
  title: string;
  eyebrow?: string;
  intro?: string;
  image?: Photo;
  /** Title of the footerNav group this page belongs to. */
  navGroup: string;
  /** This page's path, to mark it current in the side nav. */
  href: string;
  /** Shown under the heading on legal pages, e.g. "September 2026". */
  updated?: string;
  children: ReactNode;
}) {
  const group = footerNav.find((item) => item.title === navGroup);

  return (
    <div className="container-page pt-8 pb-section lg:pt-12">
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="eyebrow flex flex-wrap items-center gap-2 text-ink-subtle">
          <li>
            <Link href="/" className="link-quiet">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            {title}
          </li>
        </ol>
      </nav>

      <div className="grid gap-12 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-24">
        {group ? (
          <nav aria-label={group.title} className="order-last border-t pt-8 lg:order-none lg:border-t-0 lg:pt-0">
            <h2 className="eyebrow mb-5 text-ink-subtle">{group.title}</h2>
            <ul className="flex flex-col gap-3">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={link.href === href ? "page" : undefined}
                    className={
                      link.href === href
                        ? "text-body-sm text-ink underline underline-offset-4"
                        : "link-quiet text-body-sm text-ink-muted"
                    }
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <article className="max-w-prose">
          <header className="mb-block flex flex-col gap-3">
            {eyebrow ? <p className="eyebrow text-ink-subtle">{eyebrow}</p> : null}
            <h1 className="text-heading">{title}</h1>
            {updated ? (
              <p className="text-body-sm text-ink-subtle">Last updated {updated}</p>
            ) : null}
            {intro ? <p className="text-lead text-ink-muted">{intro}</p> : null}
          </header>

          {image ? (
            <div className="relative mb-block aspect-landscape overflow-hidden bg-surface">
              <UnsplashImage
                src={image.src}
                alt={image.alt}
                fill
                preload
                sizes="(min-width: 64rem) 60vw, 100vw"
                className="object-cover object-[50%_30%]"
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-10">{children}</div>
        </article>
      </div>
    </div>
  );
}

export function ContentSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-t pt-8">
      <h2 className="text-title">{title}</h2>
      <div className="flex flex-col gap-4 text-body text-ink-muted [&_a]:link [&_li]:pl-1 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
