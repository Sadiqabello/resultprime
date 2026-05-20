import type { AuthContext } from "@/lib/authz";
import { Sidebar } from "./sidebar";

/**
 * Authenticated app shell: role-aware sidebar + top bar + content area. The
 * topbar is where the term/session selector and user menu will live (§10.1).
 * Server component — receives the AuthContext resolved by the (auth) layout.
 */
export function AppShell({
  ctx,
  children,
}: {
  ctx: AuthContext;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar ctx={ctx} />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-6">
          <span className="text-sm font-medium">RPS</span>
          {/* TODO: term/session selector · theme toggle · user menu */}
          <span className="text-xs text-muted-foreground">{ctx.userId.slice(0, 8)}</span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
