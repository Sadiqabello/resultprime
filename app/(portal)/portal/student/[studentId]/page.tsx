import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ChevronRight, Lock } from "lucide-react";
import { getAuthContext } from "@/modules/auth/service";
import { portalService } from "@/modules/portal/service";
import { ordinal } from "@/lib/utils";

export const metadata: Metadata = { title: "Results" };

export default async function StudentResultsPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  const res = await portalService.getStudentResults(ctx, studentId);
  if (!res.ok) {
    return (
      <div className="space-y-3">
        <BackLink />
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          We couldn&apos;t find results for this student.
        </p>
      </div>
    );
  }
  const { studentName, results } = res.data;

  return (
    <div className="space-y-5">
      <BackLink />
      <h1 className="text-2xl font-semibold tracking-tight">{studentName}</h1>

      {results.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No published results yet. They&apos;ll appear here once the school releases them.
        </p>
      ) : (
        <div className="divide-y rounded-lg border bg-card">
          {results.map((r) =>
            r.withheld ? (
              <div key={r.enrollmentId} className="flex items-center justify-between px-4 py-3">
                <span>
                  <span className="font-medium">{r.sessionName} · {r.termName} Term</span>
                  <span className="block text-xs text-muted-foreground">{r.className}</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                  <Lock className="size-3.5" /> Withheld — fees not cleared
                </span>
              </div>
            ) : (
              <Link
                key={r.enrollmentId}
                href={`/portal/report/${r.enrollmentId}`}
                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-accent"
              >
                <span>
                  <span className="font-medium text-brand-950">{r.sessionName} · {r.termName} Term</span>
                  <span className="block text-xs text-muted-foreground">{r.className}</span>
                </span>
                <span className="flex items-center gap-4">
                  <span className="text-right text-sm">
                    <span className="font-medium tabular-nums">{r.average == null ? "—" : `${r.average}%`}</span>
                    {r.position ? (
                      <span className="block text-xs text-muted-foreground">
                        {ordinal(r.position)}{r.classSize ? ` of ${r.classSize}` : ""}
                      </span>
                    ) : null}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </span>
              </Link>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/portal" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-700">
      <ArrowLeft className="size-4" /> All students
    </Link>
  );
}
