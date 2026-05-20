import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">Reports</h1>
      <p className="text-sm text-muted-foreground">
        Report cards and broadsheet export (PDF / Excel). Rendering via{" "}
        <code>modules/reports</code> + <code>lib/pdf</code>.
      </p>
    </section>
  );
}
