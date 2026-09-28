"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useCart } from "@/components/cart/cart-provider";

export function SignOutButton({ className = "btn btn-secondary btn-block" }) {
  const router = useRouter();
  const { refresh: refreshCart } = useCart();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        await refreshCart();
        router.push("/");
        router.refresh();
      }}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
