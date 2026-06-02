import { signOut } from "@/modules/auth/actions";
import { PRICE_PER_STUDENT } from "@/config/plans";
import { SubscribeForm } from "@/components/billing/subscribe-form";
import { LogoMark } from "@/components/brand/logo";

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
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-left">
          <SubscribeForm pricePerStudent={PRICE_PER_STUDENT} cta="Subscribe" />
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
