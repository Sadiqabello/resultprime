import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { getAuthContext } from "@/modules/auth/service";
import { notificationsService } from "@/modules/notifications/service";
import { markAllNotificationsRead, markNotificationRead } from "@/modules/notifications/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  const res = await notificationsService.inbox(ctx);
  const items = res.ok ? res.data : [];
  const hasUnread = items.some((i) => !i.readAt);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">Updates about results and your school.</p>
        </div>
        {hasUnread ? (
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="outline" size="sm">Mark all read</Button>
          </form>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          <Bell className="mx-auto mb-3 size-6 text-muted-foreground/60" />
          You&apos;re all caught up — no notifications yet.
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {items.map((n) => {
            const Inner = (
              <div className="flex items-start gap-3 px-4 py-3">
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-brand-500")} />
                <div className="flex-1">
                  <p className={cn("text-sm", n.readAt ? "font-normal" : "font-medium")}>{n.title}</p>
                  {n.body ? <p className="text-sm text-muted-foreground">{n.body}</p> : null}
                  <p className="mt-0.5 text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              </div>
            );
            return (
              <li key={n.id} className={cn(!n.readAt && "bg-brand-50/40")}>
                <form action={markNotificationRead.bind(null, n.id)}>
                  {n.href ? (
                    <Link href={n.href} className="block transition-colors hover:bg-accent">{Inner}</Link>
                  ) : (
                    <button type="submit" className="block w-full text-left transition-colors hover:bg-accent">
                      {Inner}
                    </button>
                  )}
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
