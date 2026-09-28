"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type ComponentType, type SVGProps } from "react";
import {
  BankIcon,
  BellIcon,
  BoxIcon,
  ChartIcon,
  CloseIcon,
  GridIcon,
  MenuIcon,
  ReceiptIcon,
  RefundIcon,
  TagIcon,
  UsersIcon,
} from "@/components/icons";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const sections: { label: string; items: NavItem[] }[] = [
  {
    label: "Store",
    items: [
      { href: "/admin", label: "Overview", icon: GridIcon },
      { href: "/admin/orders", label: "Orders", icon: ReceiptIcon },
      { href: "/admin/customers", label: "Customers", icon: UsersIcon },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", icon: BoxIcon },
      { href: "/admin/categories", label: "Categories", icon: TagIcon },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/admin/revenue", label: "Revenue", icon: ChartIcon },
      { href: "/admin/refunds", label: "Refunds", icon: RefundIcon },
      { href: "/admin/payouts", label: "Payouts", icon: BankIcon },
    ],
  },
  {
    label: "Inbox",
    items: [{ href: "/admin/notifications", label: "Notifications", icon: BellIcon }],
  },
];

function isCurrent(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => (
        <div key={section.label} className="flex flex-col gap-2">
          <p className="eyebrow px-3 text-ink-subtle">{section.label}</p>
          <ul className="flex flex-col">
            {section.items.map(({ href, label, icon: Icon }) => {
              const current = isCurrent(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={current ? "page" : undefined}
                    className="flex items-center gap-3 border-l-2 border-transparent px-3 py-2.5 text-body-sm text-ink-muted transition-colors hover:bg-surface hover:text-ink aria-[current=page]:border-ink aria-[current=page]:bg-surface aria-[current=page]:text-ink"
                  >
                    <Icon width={18} height={18} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function AdminSidebar() {
  return (
    <nav aria-label="Admin" className="py-8 pr-4">
      <NavLinks />
    </nav>
  );
}

// Below lg the sidebar becomes a drawer (same <dialog> pattern as MobileMenu).
export function AdminMobileNav() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        className="icon-btn -ml-3 lg:hidden"
        aria-label="Open admin menu"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        <MenuIcon />
      </button>
      <dialog
        ref={dialogRef}
        aria-label="Admin menu"
        className="m-0 h-dvh max-h-none w-full max-w-xs bg-canvas text-ink backdrop:bg-black/40 open:flex open:flex-col"
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
      >
        <div className="flex h-header items-center justify-between border-b px-gutter">
          <span className="ui-label">Admin</span>
          <button type="button" className="icon-btn -mr-3" aria-label="Close menu" onClick={close}>
            <CloseIcon />
          </button>
        </div>
        <nav aria-label="Admin" className="flex-1 overflow-y-auto px-gutter py-6">
          <NavLinks onNavigate={close} />
        </nav>
      </dialog>
    </>
  );
}
