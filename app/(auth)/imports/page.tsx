import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bulk Import" };

export default function ImportsPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">Bulk Import</h1>
      <p className="text-sm text-muted-foreground">
        Excel upload → validate → preview → confirm, with rollback. Pipeline in{" "}
        <code>modules/imports</code>.
      </p>
    </section>
  );
}
