import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/modules/auth/service";
import { academicsService } from "@/modules/academics/service";
import { setCurrentSession, setCurrentTerm } from "@/modules/academics/actions";
import { CreateSessionForm } from "@/modules/academics/components/create-session-form";
import { gradingService } from "@/modules/grading/service";
import { GradingEditor } from "@/modules/grading/components/grading-editor";
import { can } from "@/lib/authz";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Academic Settings" };

export default async function SettingsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  if (!can(ctx, "academics.manage")) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>No access</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You don&apos;t have permission to manage academic settings.
        </CardContent>
      </Card>
    );
  }

  const result = await academicsService.listSessions(ctx);
  const sessions = result.ok ? result.data : [];
  const gradingResult = await gradingService.getConfig(ctx);
  const grading = gradingResult.ok ? gradingResult.data : null;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sessions &amp; Terms</h1>
        <p className="text-sm text-muted-foreground">
          The academic calendar everything else is scoped to. The active term drives
          score entry, results, and report cards.
        </p>
      </div>

      <CreateSessionForm />

      {sessions.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No sessions yet. Create your first session above to begin.
        </p>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {session.name}
                    {session.isCurrent ? <Badge variant="success">Current</Badge> : null}
                  </CardTitle>
                  {session.startsOn ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {session.startsOn} → {session.endsOn ?? "—"}
                    </p>
                  ) : null}
                </div>
                {!session.isCurrent ? (
                  <form action={setCurrentSession}>
                    <input type="hidden" name="id" value={session.id} />
                    <Button type="submit" variant="outline" size="sm">
                      Set current
                    </Button>
                  </form>
                ) : null}
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {session.terms.map((term) => (
                  <div
                    key={term.id}
                    className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
                  >
                    <span className={term.isCurrent ? "font-medium" : ""}>{term.name} Term</span>
                    {term.isCurrent ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <form action={setCurrentTerm}>
                        <input type="hidden" name="id" value={term.id} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Set active
                        </button>
                      </form>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <section id="grading" className="scroll-mt-20 space-y-4 border-t pt-8">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Grading system</h2>
          <p className="text-sm text-muted-foreground">
            The grade scale and assessment structure the result engine uses.
            {grading && !grading.configured
              ? " Start from this common default and tailor it to your school."
              : ""}
          </p>
        </div>
        {grading ? <GradingEditor initial={grading} /> : null}
      </section>
    </div>
  );
}
