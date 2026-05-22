import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAuthContext } from "@/modules/auth/service";
import { studentsService } from "@/modules/students/service";
import { guardiansService } from "@/modules/guardians/service";
import { StudentManager } from "@/modules/students/components/student-manager";
import { GuardianManager } from "@/modules/guardians/components/guardian-manager";
import { can } from "@/lib/authz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Student" };

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (!can(ctx, "students.read")) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader><CardTitle>No access</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">You don&apos;t have permission to view students.</CardContent>
      </Card>
    );
  }

  const [detailRes, classesRes, guardiansRes] = await Promise.all([
    studentsService.get(ctx, id),
    studentsService.listClasses(ctx),
    guardiansService.listForStudent(ctx, id),
  ]);

  if (!detailRes.ok) {
    return (
      <div className="max-w-3xl space-y-4">
        <Back />
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Student not found.</p>
      </div>
    );
  }

  const canManage = can(ctx, "academics.manage");

  return (
    <div className="max-w-3xl space-y-8">
      <Back />
      <StudentManager detail={detailRes.data} classes={classesRes.ok ? classesRes.data : []} canManage={canManage} />
      <section className="border-t pt-6">
        <GuardianManager studentId={id} guardians={guardiansRes.ok ? guardiansRes.data : []} canManage={canManage} />
      </section>
    </div>
  );
}

function Back() {
  return (
    <Link href="/students" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-700">
      <ArrowLeft className="size-4" /> Students
    </Link>
  );
}
