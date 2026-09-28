"use client";

import { useState, useTransition } from "react";
import {
  banUser,
  setUserRole,
  unbanUser,
  type AdminActionResult,
} from "@/app/admin/customers/actions";

export function UserActions({
  userId,
  name,
  role,
  banned,
}: {
  userId: string;
  name: string;
  role: string;
  banned: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const perform = (action: () => Promise<AdminActionResult>) =>
    startTransition(async () => {
      const result = await action();
      setError(result.error);
    });

  const isAdminRole = role === "admin";

  return (
    <div className="flex flex-col gap-2 md:items-end">
      <div className="flex flex-wrap gap-2 md:justify-end">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={pending}
          aria-label={`${isAdminRole ? "Make customer" : "Make admin"}: ${name}`}
          onClick={() =>
            perform(() => setUserRole(userId, isAdminRole ? "user" : "admin"))
          }
        >
          {isAdminRole ? "Make customer" : "Make admin"}
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={pending}
          aria-label={`${banned ? "Unban" : "Ban"} ${name}`}
          onClick={() => perform(() => (banned ? unbanUser(userId) : banUser(userId)))}
        >
          {banned ? "Unban" : "Ban"}
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-body-sm text-sale">
          {error}
        </p>
      ) : null}
    </div>
  );
}
