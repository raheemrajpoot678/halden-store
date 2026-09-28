"use server";

import { auth } from "@/lib/auth";
import { takeDevResetLink } from "@/lib/dev-mailbox";

export type ForgotPasswordState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "sent"; email: string; devLink: string | null };

export async function requestPasswordReset(
  _previous: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  try {
    // Resolves the same way whether or not the account exists.
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: "/reset-password" },
    });
  } catch {
    return {
      status: "error",
      message: "We couldn’t send a reset link right now. Please try again.",
    };
  }

  return { status: "sent", email, devLink: takeDevResetLink(email) };
}
