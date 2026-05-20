import type { Metadata } from "next";

export const metadata: Metadata = { title: "Billing" };

export default function BillingPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">Billing</h1>
      <p className="text-sm text-muted-foreground">
        Subscriptions, trials, and invoices (Phase 6).
      </p>
    </section>
  );
}
