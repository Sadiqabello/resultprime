import type { Metadata } from "next";

export const metadata: Metadata = { title: "Platform Audit" };

export default function PlatformAuditPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">Platform Audit</h1>
      <p className="text-sm text-muted-foreground">
        Cross-tenant activity, including super-admin and impersonation events.
      </p>
    </section>
  );
}
