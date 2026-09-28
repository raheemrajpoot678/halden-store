const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatPrice(cents: number) {
  return currency.format(cents / 100);
}

// Exact amounts (with cents) for admin figures, refunds and payouts.
const exactFormats = new Map<string, Intl.NumberFormat>();

export function formatMoney(cents: number, currencyCode = "usd") {
  const code = currencyCode.toUpperCase();
  let format = exactFormats.get(code);
  if (!format) {
    format = new Intl.NumberFormat("en-US", { style: "currency", currency: code });
    exactFormats.set(code, format);
  }
  return format.format(cents / 100);
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });
const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDate(value: Date | string | number) {
  return dateFormat.format(new Date(value));
}

export function formatDateTime(value: Date | string | number) {
  return dateTimeFormat.format(new Date(value));
}
