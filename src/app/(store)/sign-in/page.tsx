import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { demoAccounts, showDemoAccounts } from "@/lib/demo-accounts";
import { getSession, safeRedirectPath } from "@/lib/session";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

export default async function SignInPage(props: PageProps<"/sign-in">) {
  const { redirect: redirectParam } = await props.searchParams;
  const redirectTo =
    typeof redirectParam === "string" ? safeRedirectPath(redirectParam) : null;

  if (await getSession()) redirect(redirectTo ?? "/account");

  return (
    <AuthShell
      eyebrow="My account"
      title="Sign in"
      intro="Access your orders, saved pieces and details."
      footer={
        <p>
          New to Halden?{" "}
          <Link href="/sign-up" className="link text-ink">
            Create an account
          </Link>
        </p>
      }
    >
      <SignInForm
        redirectTo={redirectTo}
        demoAccounts={showDemoAccounts ? demoAccounts : null}
      />
    </AuthShell>
  );
}
