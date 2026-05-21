import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/modules/auth/service";
import { resultsService } from "@/modules/results/service";
import { reportsService, type ClassExtrasView } from "@/modules/reports/service";
import { ExtrasEditor } from "@/modules/reports/components/extras-editor";
import { can } from "@/lib/authz";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Remarks & Attendance" };

export default async function RemarksPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  if (!can(ctx, "class.remarks.write")) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>No access</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You don&apos;t have permission to write remarks.
        </CardContent>
      </Card>
    );
  }

  const { class: classId } = await searchParams;
  const classesResult = await resultsService.listClasses(ctx);
  const classes = classesResult.ok ? classesResult.data : [];

  let view: ClassExtrasView | null = null;
  let denied = false;
  if (classId) {
    const r = await reportsService.getClassExtras(ctx, classId);
    if (r.ok) view = r.data;
    else if (r.error.code === "FORBIDDEN") denied = true;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Remarks &amp; Attendance</h1>
          <p className="text-sm text-muted-foreground">
            Add the class-teacher&apos;s and principal&apos;s remarks and each student&apos;s attendance —
            these appear on the report card.
          </p>
        </div>
        {view?.termName ? <Badge variant="secondary" className="h-7 px-3">{view.termName} Term</Badge> : null}
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
              href={`/reports/remarks?class=${c.id}`}
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

      {denied ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You can only edit remarks for the class you are the form teacher of.
        </p>
      ) : !classId ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Select a class above to enter remarks and attendance.
        </p>
      ) : view ? (
        <ExtrasEditor classId={classId} view={view} />
      ) : (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Couldn&apos;t load that class.
        </p>
      )}
    </div>
  );
}
