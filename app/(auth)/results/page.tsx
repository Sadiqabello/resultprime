import type { Metadata } from "next";

export const metadata: Metadata = { title: "Results" };

export default function ResultsPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">Results</h1>
      <p className="text-sm text-muted-foreground">
        Compute, review, and view broadsheets. Orchestrated by{" "}
        <code>modules/results</code> over <code>lib/result-engine</code>.
      </p>
    </section>
  );
}
