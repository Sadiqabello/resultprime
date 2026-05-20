import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/modules/auth/service";
import { resultsService, type BroadsheetView } from "@/modules/results/service";
import { Broadsheet } from "@/modules/results/components/broadsheet";
import { ComputeButton } from "@/modules/results/components/compute-button";
import { can } from "@/lib/authz";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Results" };

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  if (!can(ctx, "results.read")) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>No access</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You don&apos;t have permission to view results.
        </CardContent>
      </Card>
    );
  }

  const { class: classId } = await searchParams;
  const canCompute = can(ctx, "results.compute");

  const classesResult = await resultsService.listClasses(ctx);
  const classes = classesResult.ok ? classesResult.data : [];

  let view: BroadsheetView | null = null;
  if (classId) {
    const r = await resultsService.getBroadsheet(ctx, classId);
    view = r.ok ? r.data : null;
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Results &amp; Broadsheet</h1>
          <p className="text-sm text-muted-foreground">
            Compute a class&apos;s results and review the broadsheet for the term.
          </p>
        </div>
        {view?.termName ? <Badge variant="secondary" className="h-7 px-3">{view.termName} Term</Badge> : null}
      </div>

      {classes.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No classes yet. Add classes and enrol students first.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/results?class=${c.id}`}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                classId === c.id
                  ? "border-brand-500 bg-brand-50 font-medium text-brand-800"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              {c.label}
            </Link>
          ))}
        </div>
      )}

      {!classId ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Select a class above to view its broadsheet.
        </p>
      ) : !view ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Couldn&apos;t load that class.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-brand-950">{view.classLabel}</h2>
            {canCompute && view.subjects.length > 0 ? <ComputeButton classId={classId} /> : null}
          </div>

          {view.subjects.length === 0 ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No subjects assigned to this class for the term.
            </p>
          ) : view.rows.length === 0 ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No students enrolled in this class for the term.
            </p>
          ) : (
            <>
              {!view.computed ? (
                <p className="rounded-md border border-brand-200 bg-brand-50/60 px-4 py-3 text-sm text-brand-800">
                  Not computed yet.{" "}
                  {canCompute
                    ? "Click “Compute results” to calculate totals, grades and positions."
                    : "Ask an exam officer to compute results."}
                </p>
              ) : null}
              <Broadsheet view={view} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
