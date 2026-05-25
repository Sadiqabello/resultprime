"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Menu, X, LogOut } from "lucide-react";
import type { AuthContext } from "@/lib/authz";
import { signOut } from "@/modules/auth/actions";
import { Logo } from "@/components/brand/logo";
import { SidebarNav } from "./sidebar";

/**
 * Authenticated app shell: role-aware sidebar + top bar + content area.
 *
 * Responsive: the sidebar is fixed on desktop (lg+); on smaller screens it
 * collapses behind a hamburger in the top bar and opens as a slide-out drawer
 * (backdrop, Esc to close, scroll-locked, closes on navigation). Client
 * component so it can own the drawer state and call the sign-out server action.
 */
function SignOutButton() {
  return (
    <form action={signOut} className="mt-1 border-t pt-2">
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <LogOut className="size-4 shrink-0" />
        Sign out
      </button>
    </form>
  );
}

function NotificationsBell({ unread }: { unread: number }) {
  return (
    <Link href="/notifications" className="relative text-muted-foreground hover:text-foreground" aria-label="Notifications">
      <Bell className="size-5" />
      {unread > 0 ? (
        <span className="absolute -right-2 -top-2 flex min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-medium text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}

export function AppShell({
  ctx,
  unread = 0,
  banner,
  children,
}: {
  ctx: AuthContext;
  unread?: number;
  /** Optional notice rendered above the content (e.g. the read-only grace banner). */
  banner?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // Close the drawer on Escape and lock body scroll while it's open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r p-3 lg:flex">
        <Link href="/dashboard" aria-label="Result Prime" className="mb-2 px-2 py-1.5">
          <Logo markClassName="h-7 w-auto" wordmarkClassName="text-base" />
        </Link>
        <SidebarNav ctx={ctx} unread={unread} />
        <SignOutButton />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {banner}
        <header className="flex h-14 items-center justify-between gap-3 border-b px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            {/* Brand shows in the topbar on mobile (the sidebar carries it on desktop). */}
            <Link href="/dashboard" aria-label="Result Prime" className="lg:hidden">
              <Logo markClassName="h-6 w-auto" wordmarkClassName="text-sm" />
            </Link>
          </div>
          <NotificationsBell unread={unread} />
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-[1px]" aria-hidden onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 max-w-[82%] flex-col border-r bg-background p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <Link href="/dashboard" aria-label="Result Prime" className="px-1" onClick={() => setOpen(false)}>
                <Logo markClassName="h-6 w-auto" wordmarkClassName="text-sm" />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <SidebarNav ctx={ctx} unread={unread} onNavigate={() => setOpen(false)} />
            <SignOutButton />
          </aside>
        </div>
      ) : null}
    </div>
  );
}
