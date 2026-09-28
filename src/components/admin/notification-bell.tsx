"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BellIcon } from "@/components/icons";

const POLL_MS = 30_000;

// Unread count from the server render, refreshed every 30 seconds and on each
// navigation so new orders show up without a reload.
export function NotificationBell({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch("/api/admin/notifications/count", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { unread: number };
        if (!cancelled) setCount(data.unread);
      } catch {
        // Offline or signed out: keep the last count.
      }
    };
    load();
    const timer = setInterval(load, POLL_MS);
    document.addEventListener("visibilitychange", load);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, [pathname]);

  const label = count === 0 ? "Notifications" : `Notifications, ${count} unread`;

  return (
    <Link href="/admin/notifications" className="icon-btn relative" aria-label={label}>
      <BellIcon />
      {count > 0 ? (
        <span
          aria-hidden="true"
          className="absolute top-1.5 right-1 flex h-4 min-w-4 items-center justify-center bg-accent px-1 text-[0.625rem] leading-none font-medium text-white"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
