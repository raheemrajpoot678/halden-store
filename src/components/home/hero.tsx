import { UnsplashImage } from "@/components/unsplash-image";
import Link from "next/link";
import { hero } from "@/lib/catalog";

export function Hero() {
  const [first, second] = hero.images;

  return (
    <section
      aria-labelledby="hero-title"
      className="relative grid h-[calc(100svh-var(--spacing-header)-2.25rem)] min-h-[34rem] grid-cols-1 overflow-hidden bg-surface md:grid-cols-2 lg:h-[calc(100svh-var(--spacing-header-lg)-5.25rem)]"
    >
      <div className="relative">
        <UnsplashImage
          src={first.src}
          alt={first.alt}
          fill
          preload
          sizes="(min-width: 48rem) 50vw, 100vw"
          className="object-cover object-[50%_30%]"
        />
      </div>
      <div className="relative hidden md:block">
        <UnsplashImage
          src={second.src}
          alt={second.alt}
          fill
          preload
          sizes="50vw"
          className="object-cover object-[50%_35%]"
        />
      </div>

      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-5 px-gutter pb-12 text-center text-white md:pb-16">
        <p className="eyebrow">{hero.eyebrow}</p>
        <h1 id="hero-title" className="text-display">
          {hero.title}
        </h1>
        <p className="max-w-md text-lead text-white/85">{hero.description}</p>
        <div className="mt-2 flex w-full flex-col items-center gap-3 md:w-auto md:flex-row">
          <Link href={hero.primaryCta.href} className="btn btn-light btn-block">
            {hero.primaryCta.label}
          </Link>
          <Link href={hero.secondaryCta.href} className="link-cta">
            {hero.secondaryCta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
