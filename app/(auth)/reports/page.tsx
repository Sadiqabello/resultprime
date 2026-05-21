import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, FileText } from "lucide-react";
import { getAuthContext } from "@/modules/auth/service";
import { resultsService, type BroadsheetView } from "@/modules/results/service";
import { can } from "@/lib/authz";
import { ordinal } from "@/lib/utils";
import { cn } from "@/lib/utils";
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

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage({
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
          You don&apos;t have permission to view reports.
        </CardContent>
      </Card>
    );
  }

  const { class: classId } = await searchParams;
  const classesResult = await resultsService.listClasses(ctx);
  const classes = classesResult.ok ? classesResult.data : [];

  let view: BroadsheetView | null = null;
  if (classId) {
    const r = await resultsService.getBroadsheet(ctx, classId);
    view = r.ok ? r.data : null;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Report Cards</h1>
          <p className="text-sm text-muted-foreground">
            Pick a class, then preview or download a student&apos;s term report card as PDF.
          </p>
        </div>
        {view?.termName ? <Badge variant="secondary" className="h-7 px-3">{view.termName} Term</Badge> : null}
      </div>

      {classes.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No classes yet. Add classes and compute results first.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/reports?class=${c.id}`}
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
          Select a class above to list its report cards.
        </p>
      ) : !view ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Couldn&apos;t load that class.
        </p>
      ) : !view.computed ? (
        <p className="rounded-md border border-brand-200 bg-brand-50/60 px-4 py-3 text-sm text-brand-800">
          Results aren&apos;t computed for {view.classLabel} yet. Compute them on the{" "}
          <Link href={`/results?class=${classId}`} className="font-medium hover:underline">Results</Link> page first.
        </p>
      ) : view.rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No students enrolled in {view.classLabel} for the term.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-brand-950">{view.classLabel}</h2>
            <div className="flex items-center gap-3">
              <Link
                href={`/print/class/${classId}`}
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <FileText className="size-4" /> Print all
              </Link>
              <a
                href={`/api/reports/class/${classId}/pdf`}
                className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
              >
                <Download className="size-4" /> Download all PDF
              </a>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-right">Average</TableHead>
                  <TableHead className="text-right">Position</TableHead>
                  <TableHead className="text-right">Report card</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {view.rows.map((r) => (
                  <TableRow key={r.enrollmentId}>
                    <TableCell>
                      <span className="font-medium">{r.name}</span>
                      <span className="ml-2 font-mono text-xs text-muted-foreground">{r.admissionNo}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.average == null ? "—" : `${r.average}%`}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.position == null ? "—" : ordinal(r.position)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center justify-end gap-3">
                        <Link
                          href={`/print/report/${r.enrollmentId}`}
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <FileText className="size-4" /> View
                        </Link>
                        <a
                          href={`/api/reports/${r.enrollmentId}/pdf`}
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <Download className="size-4" /> PDF
                        </a>
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
