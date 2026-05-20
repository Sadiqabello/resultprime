import type { Metadata } from "next";

export const metadata: Metadata = { title: "Approvals" };

export default function ApprovalsPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">Approvals</h1>
      <p className="text-sm text-muted-foreground">
        The result approval workflow (submit → approve → publish). State machine
        in <code>modules/approvals</code>.
      </p>
    </section>
  );
}
