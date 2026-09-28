import type { Metadata } from "next";
import Link from "next/link";
import { AdminMobileNav, AdminSidebar } from "@/components/admin/admin-nav";
import { NotificationBell } from "@/components/admin/notification-bell";
import { StorefrontIcon } from "@/components/icons";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin | Halden" },
  robots: { index: false },
};

// Layouts don't re-run on every navigation, so each admin page and action also
// checks for itself (requireAdmin / getAdminSession).
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { user } = await requireAdmin("/admin");
  const unread = await getUnreadNotificationCount();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-canvas/95 backdrop-blur-sm">
        <div className="flex h-header items-center justify-between gap-4 px-gutter">
          <div className="flex items-center gap-2">
            <AdminMobileNav />
            <Link href="/admin" className="flex items-baseline gap-3">
              <span className="text-title uppercase tracking-wordmark">Halden</span>
              <span className="eyebrow text-ink-subtle">Admin</span>
            </Link>
          </div>
          <div className="-mr-3 flex items-center">
            <p className="mr-3 hidden text-body-sm text-ink-muted md:block">{user.name}</p>
            <Link href="/" className="icon-btn" aria-label="View store">
              <StorefrontIcon />
            </Link>
            <NotificationBell initialCount={unread} />
          </div>
        </div>
      </header>

      <div className="flex flex-1 px-gutter">
        <aside className="sticky top-header hidden h-[calc(100dvh-var(--spacing-header))] w-56 shrink-0 overflow-y-auto border-r lg:block">
          <AdminSidebar />
        </aside>
        <main className="min-w-0 flex-1 py-8 lg:pl-10">{children}</main>
      </div>
    </div>
  );
}
