import Link from "next/link";
import { AlertTriangle } from "lucide-react";

/**
 * Read-only grace warning shown across the app when a trial/subscription has
 * just lapsed but is still within the grace window. Reads still work; writes are
 * blocked server-side. Links to the renew flow.
 */
export function GraceBanner({ reason, until }: { reason: string; until: string | null }) {
  const by = until ? new Date(until).toLocaleDateString("en-NG", { day: "numeric", month: "short" }) : null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-amber-300 bg-amber-50 px-6 py-2.5 text-center text-sm text-amber-900">
      <span className="inline-flex items-center gap-2 font-medium">
        <AlertTriangle className="size-4" />
        {reason}
      </span>
      {by ? <span className="text-amber-800/80">Read-only access until {by}.</span> : null}
      <Link href="/subscription" className="font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-950">
        Renew now →
      </Link>
    </div>
  );
}
