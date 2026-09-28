import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

// Server-side session helpers. Pages that call these read request headers,
// so they render dynamically; keep them out of the ISR storefront pages.

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

export async function requireSession(returnTo: string) {
  const session = await getSession();
  if (!session) {
    redirect(`/sign-in?redirect=${encodeURIComponent(returnTo)}`);
  }
  return session;
}

export function isAdmin(user: { role?: string | null }) {
  return user.role === "admin";
}

// For admin pages: signed-out visitors go to sign-in, everyone else who isn't
// an admin gets a 404 so the dashboard's existence isn't advertised.
export async function requireAdmin(returnTo: string) {
  const session = await requireSession(returnTo);
  if (!isAdmin(session.user)) notFound();
  return session;
}

// For admin Server Actions and route handlers, which can be called without
// going through a page. Returns the admin's session, or null.
export async function getAdminSession() {
  const session = await getSession();
  return session && isAdmin(session.user) ? session : null;
}

// Only follow same-origin paths from ?redirect= to avoid open redirects.
export function safeRedirectPath(value: unknown, fallback = "/account") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
