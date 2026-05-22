import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { getAuthContext } from "@/modules/auth/service";
import { billingService, type BillingView } from "@/modules/billing/service";
import { startCheckout } from "@/modules/billing/actions";
import { can } from "@/lib/authz";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Subscription" };

const STATUS: Record<string, { label: string; variant: "success" | "warning" | "secondary" }> = {
  active: { label: "Active", variant: "success" },
  trialing: { label: "Trial", variant: "secondary" },
  past_due: { label: "Past due", variant: "warning" },
  canceled: { label: "Canceled", variant: "warning" },
};

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (!can(ctx, "school.configure")) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader><CardTitle>No access</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Only a school admin can manage billing.</CardContent>
      </Card>
    );
  }

  const { error } = await searchParams;
  const res = await billingService.getBilling(ctx);
  const view: BillingView | null = res.ok ? res.data : null;
  const sub = view?.subscription;
  const status = sub ? STATUS[sub.status] ?? STATUS.trialing! : null;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Subscription</h1>
        <p className="text-sm text-muted-foreground">Manage {view?.schoolName ?? "your school"}&apos;s plan and billing.</p>
      </div>

      {error ? (
        <p className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4" /> {error}
        </p>
      ) : null}

      {!view?.paymentsConfigured ? (
        <p className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="size-4" /> Online payments aren&apos;t configured yet. Set <code>PAYSTACK_SECRET_KEY</code> to enable checkout.
        </p>
      ) : null}

      {/* Current status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            Current plan
            {status ? <Badge variant={status.variant}>{status.label}</Badge> : <Badge variant="secondary">Trial</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {sub ? (
            <p className="text-muted-foreground">
              <span className="font-medium capitalize text-foreground">{sub.plan}</span>
              {sub.amount ? ` · ${sub.currency} ${sub.amount.toLocaleString()}` : ""}
              {sub.currentPeriodEnd ? ` · renews ${new Date(sub.currentPeriodEnd).toLocaleDateString()}` : ""}
            </p>
          ) : (
            <p className="text-muted-foreground">
              You&apos;re on a trial{view?.trialEndsAt ? ` until ${new Date(view.trialEndsAt).toLocaleDateString()}` : ""}. Choose a plan below to subscribe.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="grid gap-4 sm:grid-cols-2">
        {(view?.plans ?? []).map((p) => (
          <Card key={p.key} className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{p.name}</CardTitle>
              <p className="text-2xl font-semibold">
                {p.currency} {p.amount.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground"> / {p.interval === "annually" ? "year" : "term"}</span>
              </p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-4">
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-brand-600" /> {f}
                  </li>
                ))}
              </ul>
              <form action={startCheckout}>
                <input type="hidden" name="plan" value={p.key} />
                <Button type="submit" className="w-full" disabled={!view?.paymentsConfigured}>
                  {sub?.plan === p.key && sub.status === "active" ? "Renew" : "Subscribe"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
