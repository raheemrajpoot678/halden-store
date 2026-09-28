import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="My account"
      title="Forgot your password?"
      intro="Enter your email and we’ll send you a link to choose a new one."
      footer={
        <p>
          Remembered it?{" "}
          <Link href="/sign-in" className="link text-ink">
            Back to sign in
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
