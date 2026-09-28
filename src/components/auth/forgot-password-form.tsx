"use client";

import { useActionState } from "react";
import {
  requestPasswordReset,
  type ForgotPasswordState,
} from "@/app/(store)/forgot-password/actions";
import { FormError, FormNotice, TextField } from "@/components/auth/form-controls";

const initialState: ForgotPasswordState = { status: "idle" };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  if (state.status === "sent") {
    return (
      <div className="flex flex-col gap-5">
        <FormNotice>
          If an account exists for <strong className="font-medium">{state.email}</strong>,
          we’ve sent a link to reset your password. It expires in one hour.
        </FormNotice>

        {state.devLink ? (
          <section
            aria-labelledby="dev-mailbox-heading"
            className="flex flex-col gap-3 bg-surface p-5"
          >
            <h2 id="dev-mailbox-heading" className="eyebrow">
              Dev mailbox
            </h2>
            <p className="text-body-sm text-ink-muted">
              No email provider is configured, so the link is shown here and in
              the server log. Hidden in production.
            </p>
            <a href={state.devLink} className="btn btn-primary w-full">
              Open reset link
            </a>
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <TextField
        label="Email"
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        aria-invalid={state.status === "error" ? true : undefined}
      />

      <FormError message={state.status === "error" ? state.message : null} />

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
