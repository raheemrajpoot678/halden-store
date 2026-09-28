# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Next.js dev server (Turbopack) on http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint (flat config, eslint-config-next)
npx tsc --noEmit     # Typecheck

npm run db:generate  # drizzle-kit: generate SQL migrations into ./drizzle
npm run db:migrate   # drizzle-kit: apply migrations
npm run db:push      # drizzle-kit: push schema directly (no migration files) — don't use; see Database conventions
npm run db:studio    # drizzle-kit: Drizzle Studio
npm run db:seed      # tsx: upsert the sample catalogue (src/db/seed.ts), safe to re-run

npx @better-auth/cli generate   # Write Better Auth tables into src/db/schema.ts
```

No test runner is configured yet.

## Stack

Next.js 16 (App Router, `src/` dir, `@/*` → `src/*`), React 19, TypeScript, Tailwind CSS v4 (configured via `@tailwindcss/postcss` and `src/app/globals.css`, no `tailwind.config`), Better Auth, Drizzle ORM, Neon Postgres.

## Architecture

- **Database** — `src/db/index.ts` exports a single `db` built with `drizzle-orm/neon-http` over `@neondatabase/serverless` (HTTP driver, stateless, no pooled connections or interactive transactions). It throws at import time if `DATABASE_URL` is unset, so any module that imports `@/db` (including `@/lib/auth`) needs the env var present, even during `next build`.
- **Schema** — `src/db/schema.ts` is the single schema file. It is passed both to the Drizzle client (for the relational query API) and to Better Auth's Drizzle adapter, and `drizzle.config.ts` points drizzle-kit at it. Better Auth's tables still have to be generated into it and migrated before any `/api/auth/*` request will succeed.
- **Auth** — `src/lib/auth.ts` is the server-side Better Auth instance (Drizzle adapter, `provider: "pg"`, `nextCookies()` plugin so Server Actions can set cookies). It is mounted by the catch-all route `src/app/api/auth/[...all]/route.ts` via `toNextJsHandler`. `src/lib/auth-client.ts` is the React client (`authClient`) for client components, pointed at `NEXT_PUBLIC_APP_URL`. Server code should import `auth` from `@/lib/auth`; client code must only import `@/lib/auth-client`.
- **Design system** — everything lives in `src/app/globals.css` (Tailwind v4 `@theme` tokens plus `@utility` primitives; there is no `tailwind.config`). The default Tailwind color palette is removed (`--color-*: initial`), so use the semantic colors (`canvas`, `surface`, `ink`, `ink-muted`, `ink-subtle`, `line`, `accent`, `sale`, `success`), the type scale (`text-caption` … `text-display`), and the primitives (`container-page/content/prose`, `section`, `grid-products`, `rail`, `media-frame`, `btn` + `btn-primary/secondary/light/sm/block`, `link`, `link-quiet`, `link-cta`, `eyebrow`, `ui-label`, `hairline`, `theme-inverse`) instead of ad-hoc values. Corners are square; there is no automatic dark mode — dark sections use `theme-inverse`.
- **Storefront** — the root layout renders `SiteHeader` / `SiteFooter` around every page; homepage sections live in `src/components/home/`. Stock state (in stock / low stock ≤ 3 / sold out) comes from `getStockStatus` in `src/lib/stock.ts` and is shared by the PDP and `ProductCard`. Sample photos must not show readable brand names or logos — check them at full size, not thumbnails. Unsplash photos must be rendered with `UnsplashImage` (`src/components/unsplash-image.tsx`), which resizes via Unsplash's CDN; plain `next/image` with Unsplash URLs is not allowed by `next.config.ts` and would time out in the built-in optimizer anyway.
- **Database conventions**
  - Schema changes go through versioned migrations: `db:generate`, review the SQL, commit `./drizzle`, then `db:migrate`. Never `db:push`.
  - Money is stored as integer cents (`*_cents` columns); `formatPrice` takes cents. Never store or pass prices as floats.
  - Until product variants exist, stock is the single `products.stock` integer (≥ 0). Decrement it with one conditional `UPDATE … SET stock = stock - n WHERE stock >= n`, since the neon-http driver has no interactive transactions.
  - Data that is only ever read with its parent row (product `details`, `images`) lives in `text[]`/jsonb columns, not child tables, until something needs to query it independently.
  - Components never import `@/db`. Storefront reads go through `src/lib/products.ts`, with each query wrapped in React `cache`. Homepage curation stays as slug lists in `src/lib/catalog.ts` until collections are modelled.
  - DB-backed pages use ISR (`export const revalidate = 60`) and keep the default `dynamicParams`, so new products render on demand. `next build` therefore needs a migrated and seeded database.
  - `src/db/seed.ts` must stay idempotent: upsert on slug, never plain insert.
- **Env** — see `.env.example`: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`. `drizzle.config.ts` and `src/db/seed.ts` load `.env.local` then `.env` via `src/db/load-env.ts` (import it first in any new script that touches `@/db`); Next.js loads them itself.
