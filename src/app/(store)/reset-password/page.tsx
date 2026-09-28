import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormNotice } from "@/components/auth/form-controls";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false },
};

export default async function ResetPasswordPage(
  props: PageProps<"/reset-password">,
) {
  const { token, error } = await props.searchParams;
  const valid = typeof token === "string" && token.length > 0 && !error;

  return (
    <AuthShell
      eyebrow="My account"
      title={valid ? "Choose a new password" : "Link expired"}
      intro={
        valid
          ? "Your new password must be at least 8 characters."
          : undefined
      }
      footer={
        <p>
          <Link href="/sign-in" className="link text-ink">
            Back to sign in
          </Link>
        </p>
      }
    >
      {valid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="flex flex-col gap-5">
          <FormNotice>
            This password reset link is invalid or has expired. Links can only
            be used once and last one hour.
          </FormNotice>
          <Link href="/forgot-password" className="btn btn-primary w-full">
            Request a new link
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
