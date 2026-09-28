"use client";

import type { DemoAccount } from "@/lib/demo-accounts";

// Test-only helper on /sign-in: lists the seeded accounts and fills the form.
export function DemoCredentials({
  accounts,
  onUse,
}: {
  accounts: DemoAccount[];
  onUse: (account: DemoAccount) => void;
}) {
  return (
    <section
      aria-labelledby="demo-accounts-heading"
      className="flex flex-col gap-4 bg-surface p-5"
    >
      <div className="flex flex-col gap-1">
        <h2 id="demo-accounts-heading" className="eyebrow">
          Test accounts
        </h2>
        <p className="text-body-sm text-ink-muted">
          Created by <code>npm run db:seed</code>. Hidden in production.
        </p>
      </div>

      <ul className="flex flex-col divide-y">
        {accounts.map((account) => (
          <li
            key={account.email}
            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <dl className="flex min-w-0 flex-col gap-0.5 text-body-sm">
              <dt className="eyebrow text-ink-subtle">{account.label}</dt>
              <dd className="truncate">{account.email}</dd>
              <dt className="sr-only">Password</dt>
              <dd className="font-mono text-ink-muted">{account.password}</dd>
            </dl>
            <button
              type="button"
              className="btn btn-secondary btn-sm shrink-0"
              onClick={() => onUse(account)}
              aria-label={`Use ${account.label.toLowerCase()} account`}
            >
              Use
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
