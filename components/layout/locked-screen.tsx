import { signOut } from "@/modules/auth/actions";
import { startCheckout } from "@/modules/billing/actions";
import { PLANS } from "@/config/plans";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

/**
 * Shown by the (auth) layout when a tenant's trial/subscription has lapsed past
 * the grace window. The renew flow lives here (so a locked admin can still pay
 * without needing the rest of the app); non-admins are told to ask their admin.
 */
export function LockedScreen({
  schoolName,
  reason,
  canRenew,
  trialExpired,
}: {
  schoolName: string;
  reason: string;
  canRenew: boolean;
  trialExpired: boolean;
}) {
  const ngn = (n: number) => `₦${n.toLocaleString("en-NG")}`;
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <LogoMark className="h-9 w-auto" />
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
          {trialExpired ? "Your free trial has ended" : "Your subscription has lapsed"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          <span className="font-medium text-brand-900">{schoolName}</span> — {reason} Your data is safe and
          will be restored the moment you subscribe.
        </p>
      </div>

      {canRenew ? (
        <div className="grid w-full gap-4 sm:grid-cols-2">
          {PLANS.map((p) => (
            <form key={p.key} action={startCheckout} className="rounded-2xl border border-border bg-card p-6 text-left">
              <input type="hidden" name="plan" value={p.key} />
              <p className="font-display text-lg font-semibold text-brand-950">{p.name}</p>
              <p className="mt-1 font-display text-2xl font-semibold text-brand-700">
                {ngn(p.amount)} <span className="text-sm font-normal text-muted-foreground">/ year</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Up to {p.maxStudents.toLocaleString()} students.</p>
              <Button type="submit" className="mt-4 w-full">Subscribe</Button>
            </form>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border px-5 py-4 text-sm text-muted-foreground">
          Please ask your school administrator to renew the subscription to restore access.
        </p>
      )}

      <form action={signOut}>
        <button type="submit" className="text-sm font-medium text-muted-foreground hover:text-brand-700">
          Sign out
        </button>
      </form>
    </main>
  );
}
