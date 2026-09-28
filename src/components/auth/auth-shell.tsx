import type { ReactNode } from "react";

// Shared frame for the sign-in / sign-up / password pages: a narrow prose
// column with an eyebrow, a quiet headline and a hairline footer for links.
export function AuthShell({
  eyebrow,
  title,
  intro,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="container-prose section">
      <div className="mx-auto flex max-w-md flex-col gap-block">
        <header className="flex flex-col gap-3 text-center">
          <p className="eyebrow text-ink-subtle">{eyebrow}</p>
          <h1 className="text-heading">{title}</h1>
          {intro ? <p className="text-lead text-ink-muted">{intro}</p> : null}
        </header>

        {children}

        {footer ? (
          <div className="hairline flex flex-col items-center gap-3 pt-6 text-center text-body-sm text-ink-muted">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
