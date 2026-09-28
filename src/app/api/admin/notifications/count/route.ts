import { getUnreadNotificationCount } from "@/lib/notifications";
import { getAdminSession } from "@/lib/session";

// Polled by the admin notification bell.
export async function GET() {
  if (!(await getAdminSession())) return new Response("Not found", { status: 404 });
  return Response.json(
    { unread: await getUnreadNotificationCount() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
