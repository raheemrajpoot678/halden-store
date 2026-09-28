"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction, type FormState } from "@/lib/admin/authorize";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/notifications";

export async function markRead(id: number): Promise<FormState> {
  const { error } = await requireAdminAction();
  if (error) return { error };
  if (!Number.isInteger(id) || id <= 0) return { error: "Notification not found." };
  await markNotificationRead(id);
  revalidatePath("/admin", "layout");
  return { error: null };
}

export async function markAllRead(): Promise<FormState> {
  const { error } = await requireAdminAction();
  if (error) return { error };
  await markAllNotificationsRead();
  revalidatePath("/admin", "layout");
  return { error: null };
}
