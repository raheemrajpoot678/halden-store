import Link from "next/link";
import { UserActions } from "@/components/admin/user-actions";
import { Badge, EmptyState, FilterBar, PageHeader, Pagination, table } from "@/components/admin/ui";
import { listCustomers } from "@/lib/admin/customers";
import { oneOf, pageParam, param, withParams } from "@/lib/admin/params";
import { formatDate, formatMoney } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const session = await requireAdmin("/admin/customers");
  const params = await searchParams;
  const query = param(params, "q") ?? "";
  const role = oneOf(param(params, "role"), ["user", "admin"] as const);
  const { rows, total, page, pageCount } = await listCustomers({
    query,
    role,
    page: pageParam(params),
  });

  return (
    <>
      <PageHeader
        eyebrow="Store"
        title="Customers"
        description="Accounts, what they’ve spent, and who has admin access."
      />

      <FilterBar action="/admin/customers" hasFilters={Boolean(query || role)}>
        <div className="md:w-72">
          <label htmlFor="q" className="field-label">Search</label>
          <input id="q" name="q" type="search" defaultValue={query} placeholder="Name or email" className="field" />
        </div>
        <div className="md:w-48">
          <label htmlFor="role" className="field-label">Role</label>
          <select id="role" name="role" defaultValue={role ?? ""} className="field">
            <option value="">All</option>
            <option value="user">Customers</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState title="No accounts match">Try a different search.</EmptyState>
      ) : (
        <table className={table.root}>
          <thead className={table.head}>
            <tr className={table.headRow}>
              <th scope="col" className={table.th}>Customer</th>
              <th scope="col" className={table.th}>Status</th>
              <th scope="col" className={table.th}>Joined</th>
              <th scope="col" className={table.thEnd}>Orders</th>
              <th scope="col" className={`${table.thEnd} md:pr-4`}>Spent</th>
              <th scope="col" className="py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((customer) => {
              const isSelf = customer.id === session.user.id;
              return (
                <tr key={customer.id} className={table.row}>
                  <td className={`col-span-2 ${table.td}`}>
                    <Link href={`/admin/customers/${customer.id}`} className="link-quiet text-body">
                      {customer.name}
                    </Link>
                    {isSelf ? <span className="text-ink-subtle"> (you)</span> : null}
                    <p className="break-all text-ink-muted">{customer.email}</p>
                  </td>
                  <td className={table.td}>
                    <span className="flex flex-wrap gap-1">
                      {customer.role === "admin" ? <Badge>Admin</Badge> : null}
                      {customer.banned ? <Badge tone="sale">Banned</Badge> : <Badge tone="success">Active</Badge>}
                    </span>
                  </td>
                  <td className={`text-ink-muted ${table.td}`}>
                    <span className="md:hidden">Joined </span>
                    {formatDate(customer.createdAt)}
                  </td>
                  <td className={`max-md:text-left ${table.tdEnd} md:pr-4`}>
                    {customer.orderCount} <span className="md:hidden">orders</span>
                  </td>
                  <td className={`max-md:text-left ${table.tdEnd} md:pr-4`}>{formatMoney(customer.spentCents)}</td>
                  <td className={`col-span-2 md:py-4`}>
                    {isSelf ? null : (
                      <UserActions
                        userId={customer.id}
                        name={customer.name}
                        role={customer.role}
                        banned={customer.banned}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <Pagination
        page={page}
        pageCount={pageCount}
        total={total}
        href={(p) => withParams("/admin/customers", params, { page: p })}
      />
    </>
  );
}
