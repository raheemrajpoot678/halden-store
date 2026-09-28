"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { FormError, FormNotice, TextField } from "@/components/auth/form-controls";

const MIN_PASSWORD_LENGTH = 8;

export function ResetPasswordForm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("password") ?? "");
    const confirm = String(form.get("confirmPassword") ?? "");

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirm) {
      setError("The passwords don’t match.");
      return;
    }

    setError(null);
    setPending(true);

    const { error } = await authClient.resetPassword({ newPassword, token });

    if (error) {
      setError(
        error.code === "INVALID_TOKEN"
          ? "This reset link is invalid or has expired. Please request a new one."
          : (error.message ?? "We couldn’t reset your password. Please try again."),
      );
      setPending(false);
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col gap-5">
        <FormNotice>
          Your password has been updated and you’ve been signed out everywhere.
        </FormNotice>
        <Link href="/sign-in" className="btn btn-primary w-full">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <TextField
        label="New password"
        id="password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        required
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
      />
      <TextField
        label="Confirm new password"
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
      />

      <FormError message={error} />

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
