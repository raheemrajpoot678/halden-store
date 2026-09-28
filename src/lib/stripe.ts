// Server-side Stripe client. Created lazily so modules that import it (bag
// actions, the webhook) don't need Stripe keys at build time. Client code must
// never import this file.
import Stripe from "stripe";

let client: Stripe | undefined;

export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key, {
      apiVersion: "2026-08-26.dahlia",
      appInfo: { name: "halden-store" },
    });
  }
  return client;
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  return secret;
}

// Link to an object in the Stripe Dashboard, in test mode when using test keys.
export function stripeDashboardUrl(path: string) {
  const test = /^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY ?? "") ? "/test" : "";
  return `https://dashboard.stripe.com${test}/${path}`;
}
