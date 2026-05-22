import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, GraduationCap } from "lucide-react";
import { getAuthContext } from "@/modules/auth/service";
import { portalService } from "@/modules/portal/service";

export const metadata: Metadata = { title: "My results" };

export default async function PortalHomePage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  const res = await portalService.ownedStudents(ctx);
  const students = res.ok ? res.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Results</h1>
        <p className="text-sm text-muted-foreground">
          {students.length > 1 ? "Choose a student to see their published results." : "Your published results."}
        </p>
      </div>

      {students.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          <GraduationCap className="mx-auto mb-3 size-6 text-muted-foreground/60" />
          No results are linked to your account yet. Please contact your school.
        </div>
      ) : (
        <div className="divide-y rounded-lg border bg-card">
          {students.map((s) => (
            <Link
              key={s.id}
              href={`/portal/student/${s.id}`}
              className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-accent"
            >
              <span>
                <span className="font-medium text-brand-950">{s.name}</span>
                {s.admissionNo ? <span className="ml-2 font-mono text-xs text-muted-foreground">{s.admissionNo}</span> : null}
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
