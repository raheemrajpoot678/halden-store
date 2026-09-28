import Link from "next/link";

export function BrandStatement() {
  return (
    <section aria-labelledby="statement-title" className="section border-t">
      <div className="container-prose flex flex-col items-center gap-6 text-center">
        <p className="eyebrow text-ink-subtle">Since the first stitch</p>
        <h2 id="statement-title" className="text-heading">
          Fewer things, made better, meant to be kept.
        </h2>
        <p className="text-lead text-ink-muted">
          We design in small collections and produce in limited runs, so every
          piece gets the time it deserves.
        </p>
        <Link href="/about" className="link-cta">
          Our story
        </Link>
      </div>
    </section>
  );
}
