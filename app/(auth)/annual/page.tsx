import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/modules/auth/service";
import { resultsService } from "@/modules/results/service";
import { cumulativeService, type AnnualView } from "@/modules/cumulative/service";
import { ComputeCumulativeButton } from "@/modules/cumulative/components/compute-cumulative-button";
import { promotionService, type PromotionPlan } from "@/modules/promotion/service";
import { PromotePanel } from "@/modules/promotion/components/promote-panel";
import { can } from "@/lib/authz";
import { cn, ordinal } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Annual Results" };

const PROMO: Record<string, { label: string; cls: string }> = {
  promoted: { label: "Promoted", cls: "bg-brand-100 text-brand-900" },
  repeat: { label: "Repeat", cls: "bg-destructive/10 text-destructive" },
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-900" },
  na: { label: "—", cls: "text-muted-foreground" },
};

export default async function AnnualPage({
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

  let view: AnnualView | null = null;
  let plan: PromotionPlan | null = null;
  if (classId) {
    const r = await cumulativeService.getAnnualBroadsheet(ctx, classId);
    view = r.ok ? r.data : null;
    if (view?.computed && can(ctx, "academics.manage")) {
      const p = await promotionService.getPlan(ctx, classId);
      plan = p.ok ? p.data : null;
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Annual Results</h1>
          <p className="text-sm text-muted-foreground">
            Combine the session&apos;s terms into a cumulative average, annual position, and a
            promotion decision.
          </p>
        </div>
        {view?.sessionName ? <Badge variant="secondary" className="h-7 px-3">{view.sessionName}</Badge> : null}
      </div>

      {classes.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No classes yet.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/annual?class=${c.id}`}
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
          Select a class above to view its annual results.
        </p>
      ) : !view ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Couldn&apos;t load that class.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-brand-950">
              {view.classLabel}
              {view.nextClassLabel ? (
                <span className="ml-2 text-sm font-normal text-muted-foreground">→ promotes to {view.nextClassLabel}</span>
              ) : null}
            </h2>
            {canCompute ? <ComputeCumulativeButton classId={classId} /> : null}
          </div>

          {view.rows.length === 0 ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No term results for this class this session yet. Compute term results first.
            </p>
          ) : (
            <>
              {!view.computed ? (
                <p className="rounded-md border border-brand-200 bg-brand-50/60 px-4 py-3 text-sm text-brand-800">
                  Term averages shown below.{" "}
                  {canCompute ? "Click “Compute annual results” to roll them up and decide promotion." : "Ask an exam officer to compute annual results."}
                </p>
              ) : null}
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      {view.terms.map((t) => (
                        <TableHead key={t.id} className="text-right">{t.name}</TableHead>
                      ))}
                      <TableHead className="text-right">Cumulative</TableHead>
                      <TableHead className="text-right">Position</TableHead>
                      <TableHead className="text-right">Promotion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {view.rows.map((r) => {
                      const promo = PROMO[r.promotionStatus] ?? PROMO.na!;
                      return (
                        <TableRow key={r.studentId}>
                          <TableCell>
                            <span className="font-medium">{r.name}</span>
                            <span className="ml-2 font-mono text-xs text-muted-foreground">{r.admissionNo}</span>
                          </TableCell>
                          {r.termAverages.map((a, i) => (
                            <TableCell key={i} className="text-right tabular-nums text-muted-foreground">
                              {a == null ? "—" : `${a}%`}
                            </TableCell>
                          ))}
                          <TableCell className="text-right font-medium tabular-nums">
                            {r.cumulativeAverage == null ? "—" : `${r.cumulativeAverage}%`}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {r.annualPosition == null ? "—" : ordinal(r.annualPosition)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", promo.cls)}>
                              {promo.label}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
          {plan && classId ? <PromotePanel classId={classId} plan={plan} /> : null}
        </div>
      )}
    </div>
  );
}
