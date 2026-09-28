// Guard for admin Server Actions: they are public POST endpoints, so each one
// checks the session itself rather than relying on the page that renders it.
import { getAdminSession } from "@/lib/session";

export type FormState = { error: string | null; message?: string | null };

export const initialFormState: FormState = { error: null, message: null };

export const NOT_ALLOWED = "You need to be an admin to do that.";

export async function requireAdminAction() {
  const session = await getAdminSession();
  return session ? { session, error: null } : { session: null, error: NOT_ALLOWED };
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
