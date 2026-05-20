import type { Metadata } from "next";

export const metadata: Metadata = { title: "Schools" };

export default function SchoolsPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">Schools</h1>
      <p className="text-sm text-muted-foreground">
        Onboard, suspend, and monitor tenants.
      </p>
    </section>
  );
}
