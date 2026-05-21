import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/modules/auth/service";
import { resultsService } from "@/modules/results/service";
import { feesService, type ClassFeesView } from "@/modules/fees/service";
import { FeesEditor } from "@/modules/fees/components/fees-editor";
import { can } from "@/lib/authz";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Fees & Clearance" };

export default async function FeesPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  if (!can(ctx, "fees.manage")) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>No access</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You don&apos;t have permission to manage fees.
        </CardContent>
      </Card>
    );
  }

  const { class: classId } = await searchParams;
  const classesResult = await resultsService.listClasses(ctx);
  const classes = classesResult.ok ? classesResult.data : [];

  let view: ClassFeesView | null = null;
  if (classId) {
    const r = await feesService.getClassFees(ctx, classId);
    view = r.ok ? r.data : null;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fees &amp; Clearance</h1>
          <p className="text-sm text-muted-foreground">
            Mark each student cleared, owing, or partial. When fee gating is on, only cleared students
            can view their published results.
          </p>
        </div>
        {view?.termName ? <Badge variant="secondary" className="h-7 px-3">{view.termName} Term</Badge> : null}
      </div>

      {classes.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No classes yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/fees?class=${c.id}`}
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
          Select a class above to set fee clearance.
        </p>
      ) : view ? (
        <FeesEditor classId={classId} view={view} />
      ) : (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Couldn&apos;t load that class.
        </p>
      )}
    </div>
  );
}
