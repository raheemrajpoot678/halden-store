# Halden

An online store for bags, shoes, jewellery and ready-to-wear, with Stripe checkout and an admin dashboard for running it: listings, orders, fulfilment, refunds, revenue, payouts and order notifications.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Better Auth, Drizzle ORM on Neon Postgres, and Stripe Checkout.

## Features

**Storefront**

- Homepage, collection and category pages, product pages and search, all backed by Postgres and served with incremental static regeneration (ISR).
- A bag for guests and signed-in shoppers. Changes show instantly and are checked against live stock. A guest's bag merges into their account when they sign in.
- Stripe-hosted Checkout. Stock is reserved when checkout starts and released if the session expires or payment fails.
- Accounts: sign up, sign in, password reset, and order history with shipping status and tracking.

**Admin dashboard** (`/admin`, admin role only)

| Section | What it does |
|---|---|
| Overview | Today's sales, 30-day net earnings, orders to fulfil, low stock, a sales chart, recent orders and alerts |
| Orders | Filter and search; order detail with items, customer, address, fee and timeline; mark shipped (carrier and tracking), mark delivered |
| Refunds | Full or partial refunds through Stripe, with optional restocking; refunds made in the Stripe Dashboard sync in by webhook |
| Products | Create and edit listings (photos, details, price, category), publish as draft/active/archived, adjust stock safely |
| Categories | Create, rename and describe categories, with homepage tile images; empty categories can be deleted |
| Customers | Lifetime spend and order history; promote to admin, ban and unban |
| Revenue | Gross sales, refunds, Stripe fees and net earnings for 7 days, 30 days, 90 days or 12 months, compared with the previous period; top products |
| Payouts | Live Stripe balance, payout history, and the transactions in each payout |
| Notifications | Feed and header bell for new orders, processing and failed payments, refunds and low stock |

## Getting started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) Postgres database
- A [Stripe](https://stripe.com) account in test mode, plus the [Stripe CLI](https://docs.stripe.com/stripe-cli) for local webhooks

### Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run db:migrate           # create the tables
npm run db:seed              # sample catalogue, demo accounts and sample orders
npm run dev                  # http://localhost:3000
```

In a second terminal, forward Stripe webhooks and copy the `whsec_…` secret it prints into `STRIPE_WEBHOOK_SECRET`:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string (also needed by `next build`) |
| `BETTER_AUTH_SECRET` | Session signing secret: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | App URL for Better Auth, e.g. `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | App URL used by the auth client |
| `STRIPE_SECRET_KEY` | Test-mode key. A restricted key (`rk_test_…`) needs **write** access to Checkout Sessions and Refunds, and **read** access to PaymentIntents, Charges, Balance, Balance transactions and Payouts |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for `/api/stripe/webhook` |
| `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS` | Optional: `true` lists the demo accounts on `/sign-in` in production builds |

### Demo accounts

`npm run db:seed` creates these accounts. They are listed on `/sign-in` in development.

| Role | Email | Password |
|---|---|---|
| Customer | `demo@halden.test` | `Halden-demo-1` |
| Admin | `admin@halden.test` | `Halden-admin-1` |

To test checkout, use Stripe's test card `4242 4242 4242 4242` with any future expiry date and any CVC.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` / `npm start` | Production build and server. The build needs a migrated, seeded database |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check |
| `npm run db:generate` | Generate a SQL migration from `src/db/schema.ts` into `./drizzle` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Upsert the sample catalogue, demo accounts and sample orders. Safe to re-run |
| `npm run db:studio` | Drizzle Studio |

Schema changes always go through versioned migrations: run `db:generate`, review the SQL, commit it, then run `db:migrate`. Don't use `db:push`.

## Stripe webhooks

`/api/stripe/webhook` verifies each event's signature and handles:

| Events | Effect |
|---|---|
| `checkout.session.completed`, `checkout.session.async_payment_succeeded` | Mark the order paid (or processing) and notify admins |
| `checkout.session.async_payment_failed`, `checkout.session.expired` | Release the order and return its stock |
| `refund.created`, `refund.updated`, `charge.refunded` | Record the refund and update the order's refunded total |
| `charge.succeeded`, `charge.updated` | Store Stripe's fee on the order, converted to the order currency |

In production, create a webhook endpoint subscribed to these events. Every handler can safely run more than once, so Stripe's retries are harmless.

## Project structure

```
src/
  app/
    (store)/         storefront routes; the layout adds the header, footer and bag drawer
    admin/           admin dashboard: pages plus a colocated actions.ts per section
    api/             auth, cart, admin notification count, Stripe webhook
  components/        storefront UI; admin/ holds the dashboard shell, forms and building blocks
  db/                Drizzle schema, client and seed
  lib/               data access and domain logic (products, cart, checkout, orders, refunds,
                     notifications); admin/ holds admin queries, validation and analytics
drizzle/             SQL migrations
```

A few conventions to follow:

- Money is always stored as integer cents.
- Components never import the database directly.
- All order and stock changes are single conditional SQL statements, because the Neon HTTP driver has no transactions.
- The design system lives entirely in `src/app/globals.css`.

`CLAUDE.md` has the full architecture notes.
