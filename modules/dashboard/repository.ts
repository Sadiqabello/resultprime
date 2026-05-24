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
  // Generic over the (school-scoped) table name so each call site keeps a
  // concrete row type and its follow-on .eq("term_id"/"status"/...) stay typed.
  const head = <
    T extends
      | "students"
      | "classes"
      | "subjects"
      | "staff"
      | "grading_systems"
      | "term_results"
      | "enrollments"
      | "approvals"
      | "class_subjects",
  >(
    table: T,
  ) => sb.from(table).select("*", { count: "exact", head: true });

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
    head("students").eq("school_id", schoolId).is("deleted_at", null),
    head("classes").eq("school_id", schoolId).is("deleted_at", null),
    head("subjects").eq("school_id", schoolId).is("deleted_at", null),
    head("staff").eq("school_id", schoolId).is("deleted_at", null),
    head("grading_systems").eq("school_id", schoolId).is("deleted_at", null),
  ]);

  // Term-scoped counts (only meaningful once a current term exists).
  let publishedResults = 0;
  let enrolled = 0;
  let pendingApprovals = 0;
  let myClassSubjects = 0;
  if (termId) {
    const [pub, enr, pend, mine] = await Promise.all([
      head("term_results").eq("school_id", schoolId).eq("term_id", termId).eq("status", "published"),
      head("enrollments").eq("school_id", schoolId).eq("term_id", termId).is("deleted_at", null),
      head("approvals").eq("school_id", schoolId).eq("term_id", termId).in("state", ["submitted", "l1_approved"]),
      head("class_subjects")
        .eq("school_id", schoolId)
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
