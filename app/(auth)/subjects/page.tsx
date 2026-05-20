import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/modules/auth/service";
import { academicsService } from "@/modules/academics/service";
import { deleteSubject } from "@/modules/academics/actions";
import { CreateSubjectForm } from "@/modules/academics/components/create-subject-form";
import { can } from "@/lib/authz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Subjects" };

export default async function SubjectsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  if (!can(ctx, "academics.manage")) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>No access</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You don&apos;t have permission to manage subjects.
        </CardContent>
      </Card>
    );
  }

  const result = await academicsService.listSubjects(ctx);
  const subjects = result.ok ? result.data : [];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Subjects</h1>
        <p className="text-sm text-muted-foreground">
          The subjects taught across your school. Assign them to classes and
          teachers per term when entering scores.
        </p>
      </div>

      <CreateSubjectForm />

      {subjects.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No subjects yet. Add your first subject above.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="font-mono text-xs uppercase text-muted-foreground">
                    {s.code}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.category === "core" ? "secondary" : "outline"}>
                      {s.category === "core" ? "Core" : "Elective"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <form action={deleteSubject}>
                      <input type="hidden" name="id" value={s.id} />
                      <button
                        type="submit"
                        className="text-sm font-medium text-destructive hover:underline"
                      >
                        Delete
                      </button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
