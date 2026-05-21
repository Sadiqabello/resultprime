import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, FileSpreadsheet } from "lucide-react";
import { getAuthContext } from "@/modules/auth/service";
import { scoresService } from "@/modules/scores/service";
import { can } from "@/lib/authz";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Bulk Import" };

export default async function ImportsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  if (!can(ctx, "scores.write")) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>No access</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You don&apos;t have permission to import scores.
        </CardContent>
      </Card>
    );
  }

  const result = await scoresService.listEntrySheets(ctx);
  const { termName, items } = result.ok ? result.data : { termName: null, items: [] };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bulk Score Import</h1>
          <p className="text-sm text-muted-foreground">
            Download a class-subject template, fill it in Excel offline, then upload to preview and
            import — no row is saved until you confirm.
          </p>
        </div>
        {termName ? <Badge variant="secondary" className="h-7 px-3">{termName} Term</Badge> : null}
      </div>

      {!termName ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No active term. Set a current term in{" "}
          <Link href="/settings" className="text-primary hover:underline">Settings</Link>.
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No subjects to import for yet. Assign subjects to classes (and to you) on the{" "}
          <Link href="/classes" className="text-primary hover:underline">Classes</Link> page.
        </p>
      ) : (
        <div className="divide-y rounded-lg border">
          {items.map((it) => (
            <Link
              key={it.classSubjectId}
              href={`/imports/${it.classSubjectId}`}
              className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-accent"
            >
              <span className="flex items-center gap-3">
                <FileSpreadsheet className="size-4 text-muted-foreground" />
                <span>
                  <span className="font-medium text-brand-950">{it.classLabel}</span>
                  <span className="mx-2 text-muted-foreground">·</span>
                  <span>{it.subjectName}</span>
                  {it.teacherName ? (
                    <span className="ml-2 text-xs text-muted-foreground">({it.teacherName})</span>
                  ) : null}
                </span>
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
