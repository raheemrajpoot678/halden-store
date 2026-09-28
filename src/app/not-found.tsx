import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-prose section flex flex-col items-center gap-6 text-center">
      <p className="eyebrow text-ink-subtle">Error 404</p>
      <h1 className="text-heading">This page could not be found</h1>
      <p className="text-lead text-ink-muted">
        The page you’re looking for may have moved or is no longer available.
      </p>
      <Link href="/" className="btn btn-primary btn-block mt-4">
        Return to the homepage
      </Link>
    </div>
  );
}
