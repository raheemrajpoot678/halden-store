"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart/cart-provider";

// Reloads the shared cart once, e.g. after checkout emptied the bag on the
// server, so the header badge and mini bag catch up.
export function CartRefresh() {
  const { refresh } = useCart();
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return null;
}
