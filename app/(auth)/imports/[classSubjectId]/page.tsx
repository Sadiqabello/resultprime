import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAuthContext } from "@/modules/auth/service";
import { scoresService } from "@/modules/scores/service";
import { ScoreImport } from "@/modules/imports/components/score-import";
import { can } from "@/lib/authz";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Import scores" };

export default async function ImportScoresPage({
  params,
}: {
  params: Promise<{ classSubjectId: string }>;
}) {
  const { classSubjectId } = await params;
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  if (!can(ctx, "scores.write")) {
    return notAllowed("You don't have permission to import scores.");
  }

  const result = await scoresService.getSheet(ctx, classSubjectId);
  if (!result.ok) {
    return notAllowed(
      result.error.code === "FORBIDDEN"
        ? "This subject isn't assigned to you."
        : "We couldn't load that class-subject.",
    );
  }
  const sheet = result.data;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link
          href="/imports"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-700"
        >
          <ArrowLeft className="size-4" /> Bulk import
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{sheet.subjectName}</h1>
            <p className="text-sm text-muted-foreground">{sheet.classLabel} · import from Excel</p>
          </div>
          <Badge variant="secondary" className="h-7 px-3">{sheet.termName} Term</Badge>
        </div>
      </div>

      {sheet.components.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No assessment components yet. Set up your grading system in{" "}
          <Link href="/settings" className="text-primary hover:underline">Settings</Link> first.
        </p>
      ) : sheet.students.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No students enrolled in this class for the term. Enrol students on the{" "}
          <Link href="/students" className="text-primary hover:underline">Students</Link> page.
        </p>
      ) : (
        <ScoreImport classSubjectId={classSubjectId} />
      )}
    </div>
  );
}

function notAllowed(message: string) {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Unavailable</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>{message}</p>
        <Link href="/imports" className="text-primary hover:underline">
          Back to bulk import
        </Link>
      </CardContent>
    </Card>
  );
}
