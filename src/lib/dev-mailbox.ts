// Stand-in for an email provider. Outside production, reset links are logged
// to the server console and kept in memory so /forgot-password can show them
// on screen. Stored on globalThis so the outbox survives dev-server HMR.

type DevMail = { url: string; sentAt: Date };

const globalForMailbox = globalThis as unknown as {
  devMailbox?: Map<string, DevMail>;
};

const outbox = (globalForMailbox.devMailbox ??= new Map());

const isProduction = process.env.NODE_ENV === "production";

export function deliverResetPasswordEmail(to: string, url: string) {
  if (isProduction) {
    console.warn(
      `[dev-mailbox] No email provider configured; password reset for ${to} was not sent.`,
    );
    return;
  }

  console.info(`[dev-mailbox] Password reset for ${to}: ${url}`);
  outbox.set(to.toLowerCase(), { url, sentAt: new Date() });
}

export function takeDevResetLink(email: string): string | null {
  if (isProduction) return null;

  const key = email.toLowerCase();
  const mail = outbox.get(key);
  outbox.delete(key);
  return mail?.url ?? null;
}
