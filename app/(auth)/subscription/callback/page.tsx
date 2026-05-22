import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { getAuthContext } from "@/modules/auth/service";
import { billingService } from "@/modules/billing/service";

export const metadata: Metadata = { title: "Payment", robots: { index: false } };

/** Paystack redirects here after checkout with ?reference=…; we verify + apply. */
export default async function BillingCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  const { reference, trxref } = await searchParams;
  const ref = reference ?? trxref;
  const res = ref ? await billingService.verifyAndApply(ctx, ref) : null;

  const ok = res?.ok && res.data.status === "success";
  const pending = res?.ok && res.data.status !== "success";

  return (
    <div className="mx-auto max-w-md pt-10 text-center">
      <span
        className={`mx-auto mb-4 flex size-14 items-center justify-center rounded-full ${
          ok ? "bg-brand-100 text-brand-700" : pending ? "bg-amber-100 text-amber-700" : "bg-destructive/10 text-destructive"
        }`}
      >
        {ok ? <CheckCircle2 className="size-7" /> : pending ? <Clock className="size-7" /> : <XCircle className="size-7" />}
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">
        {ok ? "Payment received" : pending ? "Payment pending" : "Payment not confirmed"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {ok
          ? "Your subscription is now active. Thank you!"
          : pending
            ? "We haven't confirmed this payment yet. It may take a moment — check back shortly."
            : "We couldn't confirm this payment. If you were charged, contact support."}
      </p>
      <Link href="/subscription" className="mt-5 inline-block text-sm font-medium text-primary hover:underline">
        Back to subscription
      </Link>
    </div>
  );
}
