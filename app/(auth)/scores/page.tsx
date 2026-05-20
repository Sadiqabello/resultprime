import type { Metadata } from "next";

export const metadata: Metadata = { title: "Score Entry" };

export default function ScoresPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">Score Entry</h1>
      <p className="text-sm text-muted-foreground">
        The editable score sheet (autosave, paste-from-Excel, lock-aware).
        Mutations via <code>modules/scores</code>.
      </p>
    </section>
  );
}
