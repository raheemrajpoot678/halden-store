"use client";

import Link from "next/link";
import { useRef } from "react";
import type { NavItem } from "@/lib/catalog";
import { CloseIcon, MenuIcon } from "@/components/icons";

export function MobileMenu({ items }: { items: NavItem[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        className="icon-btn -ml-3 lg:hidden"
        aria-label="Open menu"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        <MenuIcon />
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Menu"
        className="m-0 h-dvh max-h-none w-full max-w-md bg-canvas text-ink backdrop:bg-black/40 open:flex open:flex-col"
        onClick={(event) => {
          // Clicking the backdrop lands on the dialog element itself.
          if (event.target === dialogRef.current) close();
        }}
      >
        <div className="flex h-header items-center justify-between border-b px-gutter">
          <span className="ui-label">Menu</span>
          <button
            type="button"
            className="icon-btn -mr-3"
            aria-label="Close menu"
            onClick={close}
          >
            <CloseIcon />
          </button>
        </div>

        <nav aria-label="Primary" className="flex-1 overflow-y-auto px-gutter">
          <ul>
            {items.map((item) => (
              <li key={item.href} className="border-b">
                <Link
                  href={item.href}
                  onClick={close}
                  className="flex items-center py-5 text-title"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-4 border-t px-gutter py-6">
          <Link href="/account" onClick={close} className="link-quiet ui-label">
            Sign in
          </Link>
          <Link href="/help/contact" onClick={close} className="link-quiet ui-label">
            Client services
          </Link>
        </div>
      </dialog>
    </>
  );
}
