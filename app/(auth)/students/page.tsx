import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/modules/auth/service";
import { studentsService } from "@/modules/students/service";
import { deleteStudent } from "@/modules/students/actions";
import { AddStudentForm } from "@/modules/students/components/add-student-form";
import { can } from "@/lib/authz";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Students" };

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  if (!can(ctx, "students.read")) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>No access</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You don&apos;t have permission to view students.
        </CardContent>
      </Card>
    );
  }

  const { class: classFilter } = await searchParams;
  const canManage = can(ctx, "students.write");

  const classesResult = await studentsService.listClasses(ctx);
  const classes = classesResult.ok ? classesResult.data : [];
  const studentsResult = await studentsService.list(ctx, { classId: classFilter });
  const students = studentsResult.ok ? studentsResult.data : [];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
        <p className="text-sm text-muted-foreground">
          Adding a student enrols them into the chosen class for the current term.
        </p>
      </div>

      {canManage ? (
        classes.length > 0 ? (
          <AddStudentForm classes={classes} />
        ) : (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Add at least one class on the{" "}
            <Link href="/classes" className="text-primary hover:underline">
              Classes
            </Link>{" "}
            page before enrolling students.
          </p>
        )
      ) : null}

      {/* Class filter */}
      {classes.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <FilterChip href="/students" active={!classFilter} label="All" />
          {classes.map((c) => (
            <FilterChip
              key={c.id}
              href={`/students?class=${c.id}`}
              active={classFilter === c.id}
              label={c.label}
            />
          ))}
        </div>
      ) : null}

      {students.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No students{classFilter ? " in this class" : " yet"}.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admission</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Class</TableHead>
                {canManage ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{s.admissionNo}</TableCell>
                  <TableCell className="font-medium">{s.fullName}</TableCell>
                  <TableCell className="capitalize">{s.gender ?? "—"}</TableCell>
                  <TableCell>{s.classLabel ?? "—"}</TableCell>
                  {canManage ? (
                    <TableCell className="text-right">
                      <form action={deleteStudent}>
                        <input type="hidden" name="id" value={s.id} />
                        <button
                          type="submit"
                          className="text-sm font-medium text-destructive hover:underline"
                        >
                          Remove
                        </button>
                      </form>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-brand-500 bg-brand-50 font-medium text-brand-800"
          : "text-muted-foreground hover:bg-accent",
      )}
    >
      {label}
    </Link>
  );
}
