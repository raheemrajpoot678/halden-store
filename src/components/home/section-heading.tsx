import Link from "next/link";

export function SectionHeading({
  id,
  eyebrow,
  title,
  cta,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="mb-block flex items-end justify-between gap-6">
      <div className="flex flex-col gap-3">
        {eyebrow ? <p className="eyebrow text-ink-subtle">{eyebrow}</p> : null}
        <h2 id={id} className="text-heading">
          {title}
        </h2>
      </div>
      {cta ? (
        <Link href={cta.href} className="link-cta shrink-0">
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}
