"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getAdminSession } from "@/lib/session";

export type AdminActionResult = { error: string | null };

// Better Auth's admin endpoints check permissions too; this adds the
// "not on yourself" rule and gives the UI readable errors.
async function authorize(targetUserId: string): Promise<string | null> {
  const session = await getAdminSession();
  if (!session) return "You need to be an admin to do that.";
  if (session.user.id === targetUserId) return "You can’t change your own account here.";
  return null;
}

async function run(
  targetUserId: string,
  call: (requestHeaders: Headers) => Promise<unknown>,
): Promise<AdminActionResult> {
  const denied = await authorize(targetUserId);
  if (denied) return { error: denied };

  try {
    await call(await headers());
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Something went wrong.",
    };
  }

  revalidatePath("/admin/customers", "layout");
  return { error: null };
}

export async function setUserRole(userId: string, role: "user" | "admin") {
  return run(userId, (requestHeaders) =>
    auth.api.setRole({ body: { userId, role }, headers: requestHeaders }),
  );
}

export async function banUser(userId: string) {
  return run(userId, (requestHeaders) =>
    auth.api.banUser({
      body: { userId, banReason: "Suspended by an administrator" },
      headers: requestHeaders,
    }),
  );
}

export async function unbanUser(userId: string) {
  return run(userId, (requestHeaders) =>
    auth.api.unbanUser({ body: { userId }, headers: requestHeaders }),
  );
}
