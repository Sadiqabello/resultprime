import Link from "next/link";
import { Bell } from "lucide-react";
import type { AuthContext } from "@/lib/authz";
import { Logo } from "@/components/brand/logo";
import { Sidebar } from "./sidebar";

/**
 * Authenticated app shell: role-aware sidebar + top bar + content area. The
 * topbar is where the term/session selector and user menu will live (§10.1).
 * Server component — receives the AuthContext resolved by the (auth) layout.
 */
export function AppShell({
  ctx,
  unread = 0,
  children,
}: {
  ctx: AuthContext;
  unread?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar ctx={ctx} unread={unread} />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-6">
          <Link href="/dashboard" aria-label="Result Prime">
            <Logo markClassName="h-7 w-auto" wordmarkClassName="text-base" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/notifications" className="relative text-muted-foreground hover:text-foreground" aria-label="Notifications">
              <Bell className="size-5" />
              {unread > 0 ? (
                <span className="absolute -right-2 -top-2 flex min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-medium text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </Link>
            <span className="text-xs text-muted-foreground">{ctx.userId.slice(0, 8)}</span>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
