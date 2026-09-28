import { UnsplashImage } from "@/components/unsplash-image";
import Link from "next/link";
import { editorial } from "@/lib/catalog";

export function EditorialStory() {
  return (
    <section aria-labelledby="editorial-title" className="section">
      <div className="container-page grid-split lg:gap-24">
        <div className="relative aspect-portrait overflow-hidden bg-surface md:aspect-landscape lg:aspect-portrait">
          <UnsplashImage
            src={editorial.image.src}
            alt={editorial.image.alt}
            fill
            sizes="(min-width: 64rem) 50vw, 100vw"
            className="object-cover object-[50%_25%]"
          />
        </div>
        <div className="flex max-w-lg flex-col gap-6 lg:py-16">
          <p className="eyebrow text-ink-subtle">{editorial.eyebrow}</p>
          <h2 id="editorial-title" className="text-heading">
            {editorial.title}
          </h2>
          {editorial.body.map((paragraph) => (
            <p key={paragraph} className="text-lead text-ink-muted">
              {paragraph}
            </p>
          ))}
          <Link
            href={editorial.cta.href}
            className="btn btn-secondary btn-block mt-2 self-start"
          >
            {editorial.cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
