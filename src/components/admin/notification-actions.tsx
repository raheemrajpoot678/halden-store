"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { FormState } from "@/lib/admin/authorize";

// Opens the notification's target, marking it read on the way.
export function NotificationLink({
  href,
  unread,
  markRead,
  children,
}: {
  href: string | null;
  unread: boolean;
  markRead: () => Promise<FormState>;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  if (!href) return <div className="flex-1">{children}</div>;
  return (
    <a
      href={href}
      className="block flex-1 hover:opacity-70"
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        startTransition(async () => {
          if (unread) await markRead();
          router.push(href);
        });
      }}
    >
      {children}
    </a>
  );
}

export function MarkButton({
  label,
  action,
  className = "btn btn-secondary btn-sm",
}: {
  label: string;
  action: () => Promise<FormState>;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() => startTransition(async () => void (await action()))}
    >
      {label}
    </button>
  );
}
