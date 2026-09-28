"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useCart } from "@/components/cart/cart-provider";
import type { DemoAccount } from "@/lib/demo-accounts";
import { DemoCredentials } from "@/components/auth/demo-credentials";
import { FormError, TextField } from "@/components/auth/form-controls";

export function SignInForm({
  redirectTo,
  demoAccounts,
}: {
  redirectTo: string | null;
  demoAccounts: DemoAccount[] | null;
}) {
  const router = useRouter();
  const { refresh: refreshCart } = useCart();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const { data, error } = await authClient.signIn.email({ email, password });

    if (error) {
      setError(error.message ?? "We couldn’t sign you in. Please try again.");
      setPending(false);
      return;
    }

    // The guest bag was merged into the account during sign-in.
    await refreshCart();
    const isAdmin = data.user.role === "admin";
    router.push(redirectTo ?? (isAdmin ? "/admin" : "/account"));
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-block">
      {demoAccounts ? (
        <DemoCredentials
          accounts={demoAccounts}
          onUse={(account) => {
            setEmail(account.email);
            setPassword(account.password);
            setError(null);
          }}
        />
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <TextField
          label="Email"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={error ? true : undefined}
        />
        <div className="flex flex-col gap-2">
          <TextField
            label="Password"
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={error ? true : undefined}
          />
          <Link
            href="/forgot-password"
            className="link self-end text-body-sm text-ink-muted"
          >
            Forgot your password?
          </Link>
        </div>

        <FormError message={error} />

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={pending || !email || !password}
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
