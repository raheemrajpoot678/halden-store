// Stripe Checkout settings. Prices are USD cents everywhere (see formatPrice).
import type Stripe from "stripe";

export const CHECKOUT_CURRENCY = "usd";

// How long a Checkout Session (and the stock it reserves) stays open. 30
// minutes is the shortest expiry Stripe allows.
export const CHECKOUT_TTL_MINUTES = 30;

// Countries Checkout accepts shipping addresses for.
export const SHIPPING_COUNTRIES: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] =
  ["US", "CA", "GB", "IE", "FR", "DE", "IT", "ES", "NL", "BE", "AT", "DK", "SE", "FI", "PT", "AU", "NZ"];

export const SHIPPING_RATE = {
  displayName: "Complimentary express shipping",
  amountCents: 0,
  minBusinessDays: 2,
  maxBusinessDays: 5,
};

// Tags our sessions in the Stripe Dashboard so this flow can be tracked.
export const CHECKOUT_INTEGRATION_ID = "halden-hosted-checkout-qvmtrkzp";
