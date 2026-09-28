import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false },
};

export default async function SignUpPage() {
  if (await getSession()) redirect("/account");

  return (
    <AuthShell
      eyebrow="My account"
      title="Create an account"
      intro="Check out faster and keep track of your orders."
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/sign-in" className="link text-ink">
            Sign in
          </Link>
        </p>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
