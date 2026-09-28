import { UnsplashImage } from "@/components/unsplash-image";
import Link from "next/link";
import { hero } from "@/lib/catalog";

// Editorial split from lg: the campaign image on the left, a quiet panel on
// the right with the season line, an inset second image and the headline.
// Below lg the same copy block sits over a single full-bleed image.
export function Hero() {
  const [first, second] = hero.images;

  return (
    <section
      aria-labelledby="hero-title"
      className="relative grid h-[calc(100svh-var(--spacing-header)-2.25rem)] min-h-[34rem] grid-cols-1 overflow-hidden bg-surface lg:h-[calc(100svh-var(--spacing-header-lg)-5.25rem)] lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
    >
      <div className="relative overflow-hidden">
        <UnsplashImage
          src={first.src}
          alt={first.alt}
          fill
          preload
          sizes="(min-width: 64rem) 60vw, 100vw"
          className="object-cover object-[50%_30%] motion-safe:animate-settle"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent lg:hidden" />
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-10 px-gutter pb-10 text-white md:pb-14 lg:static lg:justify-between lg:p-12 lg:text-ink xl:p-16">
        <div className="eyebrow hidden items-center gap-4 text-ink-muted lg:flex">
          <span>{hero.eyebrow}</span>
          <span aria-hidden="true" className="h-px flex-1 bg-line" />
        </div>

        <div className="relative hidden min-h-0 w-1/2 flex-1 self-end overflow-hidden lg:block [@media(max-height:46rem)]:hidden">
          <UnsplashImage
            src={second.src}
            alt={second.alt}
            fill
            loading="eager"
            sizes="20vw"
            className="object-cover object-[50%_30%] motion-safe:animate-settle"
          />
        </div>

        <div className="flex max-w-md flex-col gap-5 motion-safe:animate-rise motion-safe:[animation-delay:200ms]">
          <p className="eyebrow lg:hidden">{hero.eyebrow}</p>
          <h1 id="hero-title" className="text-display">
            {hero.title}
          </h1>
          <p className="text-lead text-white/85 lg:text-ink-muted">
            {hero.description}
          </p>
          <div className="mt-3 flex flex-col items-start gap-5 md:flex-row md:items-center md:gap-8">
            <Link
              href={hero.primaryCta.href}
              className="btn btn-block max-lg:btn-light lg:btn-primary"
            >
              {hero.primaryCta.label}
            </Link>
            <Link href={hero.secondaryCta.href} className="link-cta">
              {hero.secondaryCta.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
