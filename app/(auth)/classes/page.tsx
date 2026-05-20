import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/modules/auth/service";
import { academicsService } from "@/modules/academics/service";
import { deleteClass } from "@/modules/academics/actions";
import { CreateClassForm } from "@/modules/academics/components/create-class-form";
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

export const metadata: Metadata = { title: "Classes" };

const LEVEL_LABEL: Record<string, string> = {
  primary: "Primary",
  junior_secondary: "Junior Secondary",
  senior_secondary: "Senior Secondary",
};

export default async function ClassesPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  if (!can(ctx, "academics.manage")) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>No access</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You don&apos;t have permission to manage classes.
        </CardContent>
      </Card>
    );
  }

  const result = await academicsService.listClasses(ctx);
  const classes = result.ok ? result.data : [];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Classes</h1>
        <p className="text-sm text-muted-foreground">
          Each class is a grade and arm (e.g. JSS 1 A). Order controls promotion
          sequence and how classes sort.
        </p>
      </div>

      <CreateClassForm />

      {classes.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No classes yet. Add your first class above.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Arm</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{LEVEL_LABEL[c.level] ?? c.level}</Badge>
                  </TableCell>
                  <TableCell>{c.arm ?? "—"}</TableCell>
                  <TableCell className="tabular-nums">{c.gradeOrder}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/classes/${c.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Subjects
                      </Link>
                      <form action={deleteClass}>
                        <input type="hidden" name="id" value={c.id} />
                        <button
                          type="submit"
                          className="text-sm font-medium text-destructive hover:underline"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
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
