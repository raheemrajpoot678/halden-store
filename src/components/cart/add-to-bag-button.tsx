"use client";

import { useState } from "react";
import type { CartProduct } from "@/lib/cart-config";
import { useCart } from "@/components/cart/cart-provider";

// Adds optimistically: the mini bag opens with the piece straight away and
// the server result replaces it when it arrives.
export function AddToBagButton({ product }: { product: CartProduct }) {
  const { add } = useCart();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        className="btn btn-primary w-full"
        onClick={async () => {
          setError(null);
          const result = await add(product);
          setError(result.error);
        }}
      >
        Add to bag
      </button>
      {error ? (
        <p role="alert" className="text-body-sm text-sale">
          {error}
        </p>
      ) : null}
    </div>
  );
}
