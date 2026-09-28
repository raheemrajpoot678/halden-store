// Customer accounts with their order history. Role and ban changes go through
// Better Auth's admin API (src/app/admin/customers/actions.ts), not this file.
import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, PAID_ORDER_STATUSES, user } from "@/db/schema";
import { likePattern, paged, PAGE_SIZE } from "@/lib/admin/shared";

const paidOrders = sql`${orders.status} in ('paid', 'partially_refunded', 'refunded')`;

const customerStats = {
  orderCount: sql<number>`count(${orders.id}) filter (where ${paidOrders})`.mapWith(Number),
  // Net of refunds.
  spentCents:
    sql<number>`coalesce(sum(${orders.totalCents} - ${orders.refundedCents}) filter (where ${paidOrders}), 0)`.mapWith(
      Number,
    ),
  lastOrderAt: sql<Date | null>`max(${orders.paidAt})`.mapWith((value) =>
    value ? new Date(value) : null,
  ),
};

export async function listCustomers({
  query = "",
  role,
  page = 1,
}: {
  query?: string;
  role?: "user" | "admin";
  page?: number;
}) {
  const term = query.trim();
  const where = and(
    term ? or(ilike(user.name, likePattern(term)), ilike(user.email, likePattern(term))) : undefined,
    role ? eq(user.role, role) : undefined,
  );
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        banned: user.banned,
        createdAt: user.createdAt,
        ...customerStats,
      })
      .from(user)
      .leftJoin(orders, eq(orders.userId, user.id))
      .where(where)
      .groupBy(user.id)
      .orderBy(desc(user.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(user).where(where),
  ]);
  return paged(rows, total, page);
}

export async function getCustomer(id: string) {
  const [customer] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      ...customerStats,
    })
    .from(user)
    .leftJoin(orders, eq(orders.userId, user.id))
    .where(eq(user.id, id))
    .groupBy(user.id);
  if (!customer) return null;

  const customerOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.userId, id),
        inArray(orders.status, ["processing", ...PAID_ORDER_STATUSES, "failed"]),
      ),
    )
    .orderBy(desc(orders.createdAt));
  return { ...customer, orders: customerOrders };
}

export async function countNewCustomers(since: Date) {
  const [row] = await db
    .select({ value: count() })
    .from(user)
    .where(sql`${user.createdAt} >= ${since.toISOString()}`);
  return row?.value ?? 0;
}
