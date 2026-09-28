// Admin notification feed. Rows are written by order transitions (called only
// when the guarded update actually changed the order, so webhook retries don't
// duplicate them) and read by the admin dashboard.
import { and, count, desc, eq, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications, orders, type NotificationType } from "@/db/schema";
import { formatMoney } from "@/lib/format";
import { LOW_STOCK_THRESHOLD } from "@/lib/stock";

export type Notification = typeof notifications.$inferSelect;

const orderTitles: Record<Exclude<NotificationType, "refund" | "low_stock">, string> = {
  order_paid: "New order",
  order_processing: "Payment processing",
  payment_failed: "Payment failed",
};

export function orderReference(orderId: string) {
  return orderId.slice(0, 8).toUpperCase();
}

// Never lets a notification failure break the order flow it reports on.
async function safely(label: string, write: () => Promise<unknown>) {
  try {
    await write();
  } catch (error) {
    console.error(`[notifications] Failed to record ${label}`, error);
  }
}

export async function notifyOrder(
  type: keyof typeof orderTitles,
  orderId: string,
) {
  await safely(type, async () => {
    const [order] = await db
      .select({
        totalCents: orders.totalCents,
        currency: orders.currency,
        email: orders.email,
        items: orders.items,
      })
      .from(orders)
      .where(eq(orders.id, orderId));
    if (!order) return;
    const pieces = order.items.reduce((sum, item) => sum + item.quantity, 0);
    await db.insert(notifications).values({
      type,
      orderId,
      title: `${orderTitles[type]} · ${orderReference(orderId)}`,
      body: [
        formatMoney(order.totalCents, order.currency),
        `${pieces} ${pieces === 1 ? "piece" : "pieces"}`,
        order.email,
      ]
        .filter(Boolean)
        .join(" · "),
    });
  });
}

export async function notifyRefund(orderId: string, amountCents: number, currency: string) {
  await safely("refund", () =>
    db.insert(notifications).values({
      type: "refund",
      orderId,
      title: `Refund · ${orderReference(orderId)}`,
      body: `${formatMoney(amountCents, currency)} refunded`,
    }),
  );
}

// After an order is paid: flags its products that are now at or below the
// low-stock threshold, unless an unread alert for that product already exists.
export async function notifyLowStock(orderId: string) {
  await safely("low_stock", () =>
    db.execute(sql`
      insert into notifications (type, title, body, product_id)
      select 'low_stock',
        'Low stock · ' || p.name,
        case when p.stock = 0 then 'Sold out' else p.stock || ' left' end,
        p.id
      from orders o,
        jsonb_to_recordset(o.items) as x("productId" int),
        products p
      where o.id = ${orderId}
        and p.id = x."productId"
        and p.stock <= ${LOW_STOCK_THRESHOLD}
        and not exists (
          select 1 from notifications n
          where n.type = 'low_stock' and n.product_id = p.id and n.read_at is null
        )
    `),
  );
}

export async function getUnreadNotificationCount() {
  const [row] = await db
    .select({ value: count() })
    .from(notifications)
    .where(isNull(notifications.readAt));
  return row?.value ?? 0;
}

export const NOTIFICATIONS_PAGE_SIZE = 30;

// Newest first; `before` is the id of the last row of the previous page.
export async function listNotifications({
  unreadOnly = false,
  before,
  limit = NOTIFICATIONS_PAGE_SIZE,
}: { unreadOnly?: boolean; before?: number; limit?: number } = {}) {
  return db
    .select()
    .from(notifications)
    .where(
      and(
        unreadOnly ? isNull(notifications.readAt) : undefined,
        before ? lt(notifications.id, before) : undefined,
      ),
    )
    .orderBy(desc(notifications.id))
    .limit(limit);
}

export async function markNotificationRead(id: number) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), isNull(notifications.readAt)));
}

export async function markAllNotificationsRead() {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(isNull(notifications.readAt));
}
