import Link from "next/link";
import { MarkButton, NotificationLink } from "@/components/admin/notification-actions";
import { EmptyState, PageHeader } from "@/components/admin/ui";
import type { NotificationType } from "@/db/schema";
import { param } from "@/lib/admin/params";
import { formatDateTime } from "@/lib/format";
import {
  getUnreadNotificationCount,
  listNotifications,
  NOTIFICATIONS_PAGE_SIZE,
  type Notification,
} from "@/lib/notifications";
import { requireAdmin } from "@/lib/session";
import { markAllRead, markRead } from "./actions";

export const metadata = { title: "Notifications" };

const TYPE_LABELS: Record<NotificationType, string> = {
  order_paid: "Order",
  order_processing: "Payment",
  payment_failed: "Payment",
  refund: "Refund",
  low_stock: "Stock",
};

function targetOf(item: Notification) {
  if (item.orderId) return `/admin/orders/${item.orderId}`;
  if (item.productId) return `/admin/products/${item.productId}`;
  return null;
}

export default async function NotificationsPage({ searchParams }: PageProps<"/admin/notifications">) {
  await requireAdmin("/admin/notifications");
  const params = await searchParams;
  const unreadOnly = param(params, "show") === "unread";
  const before = Number(param(params, "before")) || undefined;

  const [items, unread] = await Promise.all([
    listNotifications({ unreadOnly, before }),
    getUnreadNotificationCount(),
  ]);
  const base = unreadOnly ? "/admin/notifications?show=unread" : "/admin/notifications";

  return (
    <>
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description={unread === 0 ? "You’re all caught up." : `${unread} unread`}
        actions={unread > 0 ? <MarkButton label="Mark all as read" action={markAllRead} /> : null}
      />

      <nav aria-label="Filter" className="mb-6 flex gap-2">
        <Link href="/admin/notifications" aria-current={!unreadOnly ? "page" : undefined} className={`btn btn-sm ${!unreadOnly ? "btn-primary" : "btn-secondary"}`}>
          All
        </Link>
        <Link href="/admin/notifications?show=unread" aria-current={unreadOnly ? "page" : undefined} className={`btn btn-sm ${unreadOnly ? "btn-primary" : "btn-secondary"}`}>
          Unread
        </Link>
      </nav>

      {items.length === 0 ? (
        <EmptyState title={unreadOnly ? "No unread notifications" : "No notifications yet"}>
          New orders, failed payments, refunds and low stock show up here.
        </EmptyState>
      ) : (
        <ul className="hairline-strong divide-y">
          {items.map((item) => {
            const isUnread = item.readAt === null;
            return (
              <li key={item.id} className="flex items-start gap-4 py-4">
                <span
                  className={`mt-2 size-2 shrink-0 ${isUnread ? "bg-accent" : "bg-transparent"}`}
                  aria-label={isUnread ? "Unread" : undefined}
                />
                <NotificationLink href={targetOf(item)} unread={isUnread} markRead={markRead.bind(null, item.id)}>
                  <p className="eyebrow text-ink-subtle">{TYPE_LABELS[item.type]}</p>
                  <p className={isUnread ? "font-medium" : ""}>{item.title}</p>
                  {item.body ? <p className="text-body-sm text-ink-muted">{item.body}</p> : null}
                </NotificationLink>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <time className="text-body-sm text-ink-muted" dateTime={item.createdAt.toISOString()}>
                    {formatDateTime(item.createdAt)}
                  </time>
                  {isUnread ? (
                    <MarkButton label="Mark read" action={markRead.bind(null, item.id)} className="link-quiet ui-label text-ink-muted" />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {items.length === NOTIFICATIONS_PAGE_SIZE ? (
        <div className="mt-6 flex justify-end">
          <Link
            href={`${base}${base.includes("?") ? "&" : "?"}before=${items[items.length - 1].id}`}
            className="btn btn-secondary btn-sm"
          >
            Older
          </Link>
        </div>
      ) : null}
    </>
  );
}
