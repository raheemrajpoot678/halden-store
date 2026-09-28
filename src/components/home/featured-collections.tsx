import { UnsplashImage } from "@/components/unsplash-image";
import Link from "next/link";
import { featuredCollections } from "@/lib/catalog";

export function FeaturedCollections() {
  return (
    <section aria-label="Featured collections" className="grid gap-1 md:grid-cols-2">
      {featuredCollections.map((collection) => (
        <Link
          key={collection.slug}
          href={`/collections/${collection.slug}`}
          className="group relative block aspect-portrait overflow-hidden bg-surface md:aspect-auto md:h-[min(90svh,60rem)]"
        >
          <UnsplashImage
            src={collection.image.src}
            alt={collection.image.alt}
            fill
            sizes="(min-width: 48rem) 50vw, 100vw"
            className="object-cover transition-transform duration-1000 ease-standard group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 via-45% to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-8 text-center text-white md:p-12">
            <p className="eyebrow">{collection.eyebrow}</p>
            <h2 className="text-heading">{collection.title}</h2>
            <p className="max-w-md text-body text-white/90">
              {collection.description}
            </p>
            <span className="link-cta mt-2">Shop now</span>
          </div>
        </Link>
      ))}
    </section>
  );
}
