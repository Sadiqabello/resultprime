import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAuthContext } from "@/modules/auth/service";
import { academicsService } from "@/modules/academics/service";
import { AssignmentEditor } from "@/modules/academics/components/assignment-editor";
import { can } from "@/lib/authz";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Class subjects" };

const LEVEL_LABEL: Record<string, string> = {
  primary: "Primary",
  junior_secondary: "Junior Secondary",
  senior_secondary: "Senior Secondary",
};

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  if (!can(ctx, "academics.manage")) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>No access</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You don&apos;t have permission to assign subjects.
        </CardContent>
      </Card>
    );
  }

  const result = await academicsService.getClassAssignment(ctx, id);
  if (!result.ok) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Class not found</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <Link href="/classes" className="text-primary hover:underline">
            Back to classes
          </Link>
        </CardContent>
      </Card>
    );
  }

  const { klass, term, subjects, teachers } = result.data;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href="/classes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-700"
        >
          <ArrowLeft className="size-4" /> Classes
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {klass.name}
              {klass.arm ? ` ${klass.arm}` : ""}
            </h1>
            <p className="text-sm text-muted-foreground">{LEVEL_LABEL[klass.level] ?? klass.level}</p>
          </div>
          {term ? (
            <Badge variant="secondary" className="h-7 px-3">
              {term.name} Term
            </Badge>
          ) : (
            <Badge variant="warning" className="h-7 px-3">
              No active term
            </Badge>
          )}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Choose which subjects this class offers this term and who teaches each. A
          teacher only sees the subjects assigned to them when entering scores.
        </p>
      </div>

      {!term ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Set a current term in{" "}
          <Link href="/settings" className="text-primary hover:underline">
            Settings
          </Link>{" "}
          before assigning subjects.
        </p>
      ) : subjects.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No subjects yet. Add subjects on the{" "}
          <Link href="/subjects" className="text-primary hover:underline">
            Subjects
          </Link>{" "}
          page first.
        </p>
      ) : (
        <AssignmentEditor classId={klass.id} subjects={subjects} teachers={teachers} />
      )}
    </div>
  );
}
