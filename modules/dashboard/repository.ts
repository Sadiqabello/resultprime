import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Dashboard reads. One client, queries fanned out with Promise.all. All counts
 * use `head: true` (no rows returned, index-only) and are RLS-scoped to the
 * tenant. For very large deployments this can later collapse into a single
 * Postgres RPC; parallel head-counts are plenty at this scale (§15).
 */
export interface DashboardRaw {
  schoolName: string;
  userFullName: string;
  session: string | null;
  term: string | null;
  termId: string | null;
  counts: {
    students: number;
    classes: number;
    subjects: number;
    staff: number;
    grading: number;
  };
  termCounts: {
    publishedResults: number;
    enrolled: number;
    pendingApprovals: number;
    myClassSubjects: number;
  };
}

const n = (r: { count: number | null }) => r.count ?? 0;

export async function getDashboardRaw(
  schoolId: string,
  userId: string,
): Promise<DashboardRaw> {
  const sb = await createClient();
  const head = (table: string) =>
    sb.from(table).select("*", { count: "exact", head: true }).eq("school_id", schoolId);

  // Header + current academic context.
  const [school, user, session, term] = await Promise.all([
    sb.from("schools").select("name").eq("id", schoolId).maybeSingle(),
    sb.from("users").select("full_name").eq("id", userId).maybeSingle(),
    sb
      .from("sessions")
      .select("name")
      .eq("school_id", schoolId)
      .eq("is_current", true)
      .is("deleted_at", null)
      .maybeSingle(),
    sb
      .from("terms")
      .select("id, name")
      .eq("school_id", schoolId)
      .eq("is_current", true)
      .is("deleted_at", null)
      .maybeSingle(),
  ]);

  const termId = (term.data?.id as string | undefined) ?? null;

  // Tenant-wide counts.
  const [students, classes, subjects, staff, grading] = await Promise.all([
    head("students").is("deleted_at", null),
    head("classes").is("deleted_at", null),
    head("subjects").is("deleted_at", null),
    head("staff").is("deleted_at", null),
    head("grading_systems").is("deleted_at", null),
  ]);

  // Term-scoped counts (only meaningful once a current term exists).
  let publishedResults = 0;
  let enrolled = 0;
  let pendingApprovals = 0;
  let myClassSubjects = 0;
  if (termId) {
    const [pub, enr, pend, mine] = await Promise.all([
      head("term_results").eq("term_id", termId).eq("status", "published"),
      head("enrollments").eq("term_id", termId).is("deleted_at", null),
      head("approvals").eq("term_id", termId).in("state", ["submitted", "l1_approved"]),
      head("class_subjects")
        .eq("term_id", termId)
        .eq("teacher_id", userId)
        .is("deleted_at", null),
    ]);
    publishedResults = n(pub);
    enrolled = n(enr);
    pendingApprovals = n(pend);
    myClassSubjects = n(mine);
  }

  return {
    schoolName: (school.data?.name as string | undefined) ?? "Your school",
    userFullName: (user.data?.full_name as string | undefined) ?? "",
    session: (session.data?.name as string | undefined) ?? null,
    term: (term.data?.name as string | undefined) ?? null,
    termId,
    counts: {
      students: n(students),
      classes: n(classes),
      subjects: n(subjects),
      staff: n(staff),
      grading: n(grading),
    },
    termCounts: { publishedResults, enrolled, pendingApprovals, myClassSubjects },
  };
}
