# Halden

**A full-stack luxury fashion store with Stripe payments and a complete admin back office.**

Halden sells bags, shoes, jewellery and ready-to-wear. Shoppers can browse the catalogue, fill a bag, pay through Stripe and follow their orders. Store staff run everything from an admin dashboard: listings, stock, orders, shipping, refunds, revenue and payouts.

It is built as a real store would need to work. Payments are processed by Stripe and stock is reserved during checkout, so two shoppers can never buy the last item. Every order change is safe against network retries, and the dashboard's money figures (fees, refunds, net earnings) reconcile with Stripe.

> Built with **Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · PostgreSQL (Neon) · Drizzle ORM · Better Auth · Stripe**

---

## Contents

- [Tech stack](#tech-stack)
- [The storefront](#the-storefront)
- [The admin dashboard](#the-admin-dashboard)
- [Engineering highlights](#engineering-highlights)
- [Architecture](#architecture)
- [Running it locally](#running-it-locally)
- [Project structure](#project-structure)

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) | Server Components for fast pages, Server Actions for changes, ISR for a catalogue that is fast and stays fresh |
| UI | **React 19**, **TypeScript** | `useOptimistic` and `useActionState` give instant, type-safe interactions |
| Styling | **Tailwind CSS v4** | A custom design system of tokens and utilities; the default palette is removed so only brand colours exist |
| Database | **PostgreSQL** on **Neon** (serverless) | Relational data with constraints; the HTTP driver suits serverless hosting |
| ORM | **Drizzle ORM** + drizzle-kit | Type-safe SQL, plus versioned, reviewable migrations |
| Auth | **Better Auth** (+ admin plugin) | Email and password, sessions, password reset, roles and bans |
| Payments | **Stripe** Checkout, Refunds, Balance and Payouts APIs, webhooks | Hosted, PCI-compliant checkout; refunds and payouts driven from the dashboard |
| Tooling | ESLint, `tsc`, tsx | Linting, strict type checks, and TypeScript scripts for seeding |

---

## The storefront

**Shopping**

- **Pages:** an editorial homepage, collection and category pages, product pages with image galleries, related products and live stock labels ("Only 2 left", "Sold out").
- **Search:** matches product name, category and colour.
- **Speed:** pages are prerendered and refreshed in the background every minute, so they load instantly and new products still appear on demand.

**The bag**

- **Guests and members:** works for guests (a secure cookie) and signed-in users (stored in the database). A guest's bag is merged into their account when they sign in.
- **Instant updates:** the bag changes on screen immediately, then the server's answer replaces it. If the server rejects a change, the bag rolls back.
- **Always correct:** prices and stock are always read live, never cached in the bag, and quantities are capped by stock and a per-item limit.

**Checkout**

- Stripe-hosted Checkout, with a shipping address and 17 supported countries.
- Stock is **reserved** when checkout starts and returned automatically if the customer abandons it or the payment fails.
- A confirmation page shows the paid order straight away, without waiting for the webhook.

**Accounts**

- Sign up, sign in, and password reset through a secure link.
- **My account** shows order history: payment status, shipping progress, the carrier's tracking number and any refunds.

**Content**

- About, sustainability, craftsmanship story, careers, help (contact, shipping, returns), and legal pages (terms, privacy, cookies, accessibility).

---

## The admin dashboard

Available at `/admin` to users with the **admin** role. Other signed-in users get a 404, and signed-out visitors are sent to sign in. The dashboard has its own layout: a sidebar that becomes a drawer on mobile, and a header with a live notification bell.

| Section | What an admin can do |
|---|---|
| **Overview** | Today's sales, 30-day net earnings, orders waiting to ship, low-stock alerts, a 30-day sales chart, recent orders and the latest notifications |
| **Orders** | Search by order number, email or name; filter by payment and shipping status. Each order shows items, customer, address, Stripe fee, net amount and a timeline |
| **Fulfilment** | Mark an order shipped with a carrier and tracking number, then delivered. The customer sees it on their account |
| **Refunds** | Issue a full or partial refund through Stripe, choose which items return to stock, and see who issued each refund. Refunds made in the Stripe Dashboard sync in automatically |
| **Products** | Create and edit listings: photos with live preview, description, details, price, colour, badge and category. Publish, save as a draft or archive, and adjust stock |
| **Categories** | Create and edit categories with an optional homepage tile image. A category still in use can't be deleted |
| **Customers** | Every account with order count, lifetime spend (net of refunds) and order history. Promote to admin, ban or unban |
| **Revenue** | Gross sales, refunds, Stripe fees and **net earnings** for 7 days, 30 days, 90 days or 12 months, with change against the previous period, a bar chart (with a table view) and top products |
| **Payouts** | Live Stripe balance (available and pending), payout history, and a breakdown of each payout with links back to orders |
| **Notifications** | A feed of new orders, payments still processing, failed payments, refunds and low stock, with unread counts and mark-as-read. The header bell updates every 30 seconds |

---

## Engineering highlights

These are the problems that make a store hard to get right, and how Halden solves them.

**No overselling, without database transactions.**
The serverless Postgres driver can't hold a transaction open across several statements. So every stock and order change is a **single conditional SQL statement**. For example, `UPDATE … SET stock = stock - n WHERE stock >= n`, run across every line of the order at once. If any item is short, the stock already taken is put back.

**Webhooks can be retried safely.**
Stripe may deliver the same event more than once, or out of order. Every order change only applies if the order is still in the expected state, so running it twice changes nothing. A refund's total is always **recalculated from the refund records** rather than added to. As a result, a refund made in the dashboard, its webhook, and a retry of that webhook all end with the same numbers. Restocking after a refund can only happen once per refund.

**Correct money.**
- Every amount is stored in integer cents, never as a floating-point number.
- Stripe reports its fee in the account's settlement currency (for example AED). The fee is converted to the order's currency before it's stored, so net earnings stay accurate.
- Double-submitting the refund form can't create a second refund: each refund request carries a unique idempotency key.

**Fast pages that stay fresh.**
Catalogue pages are prerendered and refreshed in the background (ISR). Any edit made in the admin immediately refreshes the affected product and collection pages. The bag loads separately in the browser, so every shopper gets the same cached page.

**Secure by default.**
- Every admin page *and* every Server Action checks the admin role itself, because Server Actions are public endpoints.
- All form input is validated on the server, and IDs are checked against the database rather than trusted.
- Product photos are restricted to an approved image host.
- Stripe webhooks are signature-verified.

**Forms that respond instantly.**
- The bag shows changes immediately and rolls back if the server rejects them.
- Admin forms keep what was typed when validation fails.
- The layout works down to phone width, with keyboard focus styles, labelled controls and a table alternative for the chart.

**Maintainable data layer.**
- One schema file with database-level checks (valid statuses, stock that can't go negative, refunds that can't exceed the order total).
- Versioned SQL migrations, and a seed script that can be re-run safely.
- UI components never touch the database: all reads and writes go through a small set of query modules.

---

## Architecture

```
 Browser ──► Next.js App Router
             ├── (store) pages ── ISR ──► lib/products ──┐
             ├── /admin pages (dynamic, admin-only) ─────┤
             ├── Server Actions (bag, checkout, admin) ──┼──► Drizzle ORM ──► Neon Postgres
             ├── /api/cart, /api/admin/notifications ────┘
             └── /api/stripe/webhook ◄── Stripe events

 Checkout:  bag ──► reserve stock + pending order ──► Stripe Checkout
                                                        │
            webhook ◄── completed / failed / expired ───┘
              ├── paid → clear bag, notify admins, record fee
              └── failed/expired → return stock

 Refunds:   admin ──► Stripe Refund API ──► refunds table ──► order total recalculated
                                   ▲
                        webhook ───┘ (also syncs Dashboard refunds)
```

---

## Running it locally

**Requirements:**
- Node.js 20+
- A free [Neon](https://neon.tech) Postgres database
- A [Stripe](https://stripe.com) account in test mode, plus the [Stripe CLI](https://docs.stripe.com/stripe-cli)

```bash
git clone https://github.com/raheemrajpoot678/halden-store.git
cd halden-store
npm install

cp .env.example .env.local     # fill in the values below
npm run db:migrate             # create the tables
npm run db:seed                # sample catalogue, demo accounts and sample orders
npm run dev                    # http://localhost:3000
```

In a second terminal, forward Stripe events to the app. Copy the `whsec_…` secret it prints into `.env.local`:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Environment variables:**

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `BETTER_AUTH_SECRET` | Session secret: `openssl rand -base64 32` |
| `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL` | The app's URL, e.g. `http://localhost:3000` |
| `STRIPE_SECRET_KEY` | Stripe test key. A restricted key needs **write** access to Checkout Sessions and Refunds, and **read** access to PaymentIntents, Charges, Balance, Balance transactions and Payouts |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |

**Try it:**

| Account | Email | Password |
|---|---|---|
| Customer | `demo@halden.test` | `Halden-demo-1` |
| Admin | `admin@halden.test` | `Halden-admin-1` |

1. Sign in as the customer and pay with Stripe's test card `4242 4242 4242 4242` (any future expiry date, any CVC).
2. Sign in as the admin and open `/admin`. The new order appears in the notification bell. Ship it, refund it, and watch the revenue figures update.

**Scripts:**

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` · `npx tsc --noEmit` | Lint and type check |
| `npm run db:generate` · `npm run db:migrate` | Create and apply SQL migrations |
| `npm run db:seed` | Load sample data (safe to re-run) |
| `npm run db:studio` | Browse the database in Drizzle Studio |

In production, create a Stripe webhook endpoint for these events:
- `checkout.session.completed`, `.async_payment_succeeded`, `.async_payment_failed`, `.expired`
- `refund.created`, `refund.updated`, `charge.refunded`
- `charge.succeeded`, `charge.updated`

---

## Project structure

```
src/
├── app/
│   ├── (store)/          storefront pages: home, collections, products, bag, checkout, account, auth, content
│   ├── admin/            dashboard: overview, orders, products, categories, customers,
│   │                     revenue, refunds, payouts, notifications (each with its own actions.ts)
│   └── api/              auth, cart, admin notification count, Stripe webhook
├── components/
│   ├── admin/            dashboard shell, navigation, forms, chart, shared building blocks
│   ├── cart/             bag provider (optimistic state), drawer, bag lines
│   └── home/ auth/ …     storefront sections and forms
├── db/                   Drizzle schema, client, seed
└── lib/                  data access and business logic
    ├── admin/            admin queries, analytics, validation
    ├── cart.ts  checkout.ts  orders.ts  refunds.ts  notifications.ts
    └── products.ts  stock.ts  session.ts  stripe.ts
drizzle/                  versioned SQL migrations
```
