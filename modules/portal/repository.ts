import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Portal data access for students/parents. Consumers can't read most tables
 * under RLS (classes/terms/subjects are staff-only), so — exactly like the
 * public verify page — we use the service-role client and authorize by matching
 * the caller's auth uid in code. EVERY method here must be called only after the
 * service has confirmed the caller owns the student/enrolment.
 */
export const portalRepository = {
  /** Students this auth user may view: their own record + any they guardian. */
  async ownedStudents(userId: string) {
    const admin = createAdminClient();
    const [{ data: own }, { data: guardians }] = await Promise.all([
      admin.from("students").select("id, school_id, first_name, last_name, other_names, admission_no, current_class_id").eq("user_id", userId).is("deleted_at", null),
      admin.from("guardians").select("id").eq("user_id", userId).is("deleted_at", null),
    ]);
    const guardianIds = (guardians ?? []).map((g) => g.id as string);
    let warded: typeof own = [];
    if (guardianIds.length) {
      const { data: links } = await admin.from("student_guardians").select("student_id").in("guardian_id", guardianIds);
      const studentIds = [...new Set((links ?? []).map((l) => l.student_id as string))];
      if (studentIds.length) {
        const { data } = await admin
          .from("students")
          .select("id, school_id, first_name, last_name, other_names, admission_no, current_class_id")
          .in("id", studentIds)
          .is("deleted_at", null);
        warded = data ?? [];
      }
    }
    const byId = new Map<string, NonNullable<typeof own>[number]>();
    for (const s of [...(own ?? []), ...(warded ?? [])]) byId.set(s.id as string, s);
    return [...byId.values()];
  },

  /** Published term results for a student, with class/term/session names + fee gate. */
  async publishedResults(studentId: string) {
    const admin = createAdminClient();
    const { data: enr } = await admin
      .from("enrollments")
      .select("id, class_id, term_id, session_id, school_id")
      .eq("student_id", studentId)
      .is("deleted_at", null);
    const enrollments = enr ?? [];
    if (enrollments.length === 0) return [];

    const enrollmentIds = enrollments.map((e) => e.id as string);
    const schoolId = enrollments[0]!.school_id as string;
    const [{ data: trs }, { data: classes }, { data: terms }, { data: sessions }, { data: fees }, { data: settings }] = await Promise.all([
      admin.from("term_results").select("enrollment_id, average, class_position, class_size, status, published_at").in("enrollment_id", enrollmentIds).eq("status", "published").is("deleted_at", null),
      admin.from("classes").select("id, name, arm").eq("school_id", schoolId),
      admin.from("terms").select("id, name, session_id, sequence").eq("school_id", schoolId),
      admin.from("sessions").select("id, name").eq("school_id", schoolId),
      admin.from("fee_status").select("enrollment_id, status").in("enrollment_id", enrollmentIds),
      admin.from("school_settings").select("fee_gating_enabled").eq("school_id", schoolId).maybeSingle(),
    ]);

    const enrById = new Map(enrollments.map((e) => [e.id, e]));
    const classById = new Map((classes ?? []).map((c) => [c.id, c]));
    const termById = new Map((terms ?? []).map((t) => [t.id, t]));
    const sessionById = new Map((sessions ?? []).map((s) => [s.id, s.name as string]));
    const feeByEnrollment = new Map((fees ?? []).map((f) => [f.enrollment_id, f.status as string]));
    const gating = Boolean(settings?.fee_gating_enabled);

    return (trs ?? [])
      .map((tr) => {
        const e = enrById.get(tr.enrollment_id);
        const cls = e ? classById.get(e.class_id) : undefined;
        const term = e ? termById.get(e.term_id) : undefined;
        const feeCleared = !gating || feeByEnrollment.get(tr.enrollment_id as string) === "cleared";
        return {
          enrollmentId: tr.enrollment_id as string,
          sessionName: e ? sessionById.get(e.session_id) ?? "" : "",
          termName: (term?.name as string) ?? "",
          sequence: (term?.sequence as number) ?? 0,
          className: cls ? (cls.arm ? `${cls.name} ${cls.arm}` : (cls.name as string)) : "—",
          average: (tr.average as number | null) ?? null,
          position: (tr.class_position as number | null) ?? null,
          classSize: (tr.class_size as number | null) ?? null,
          publishedAt: (tr.published_at as string | null) ?? null,
          withheld: !feeCleared,
        };
      })
      .sort((a, b) => a.sessionName.localeCompare(b.sessionName) || a.sequence - b.sequence);
  },

  /** Owner + gate context for one enrolment (no content). */
  async enrollmentContext(enrollmentId: string) {
    const admin = createAdminClient();
    const { data: enr } = await admin
      .from("enrollments")
      .select("id, student_id, school_id")
      .eq("id", enrollmentId)
      .maybeSingle();
    if (!enr) return null;
    const [{ data: tr }, { data: fee }, { data: settings }] = await Promise.all([
      admin.from("term_results").select("status").eq("enrollment_id", enrollmentId).is("deleted_at", null).maybeSingle(),
      admin.from("fee_status").select("status").eq("enrollment_id", enrollmentId).maybeSingle(),
      admin.from("school_settings").select("fee_gating_enabled").eq("school_id", enr.school_id).maybeSingle(),
    ]);
    const gating = Boolean(settings?.fee_gating_enabled);
    return {
      studentId: enr.student_id as string,
      published: tr?.status === "published",
      feeCleared: !gating || fee?.status === "cleared",
    };
  },

  /** Full published report card (service-role assembly). */
  async assembleReportCard(enrollmentId: string) {
    const admin = createAdminClient();
    const { data: enr } = await admin
      .from("enrollments")
      .select("id, student_id, class_id, term_id, school_id")
      .eq("id", enrollmentId)
      .maybeSingle();
    if (!enr) return null;
    const schoolId = enr.school_id as string;

    const [{ data: tr }, { data: results }, { data: student }, { data: cls }, { data: term }, { data: school }, { data: settings }, { data: subjects }] = await Promise.all([
      admin.from("term_results").select("id, average, class_position, class_size, subjects_count, total_obtained, total_obtainable, grade_overall, class_teacher_remark, principal_remark, attendance_present, attendance_total, traits, status, published_at").eq("enrollment_id", enrollmentId).maybeSingle(),
      admin.from("results").select("subject_id, ca_total, exam_score, total, grade, remark, subject_position").eq("enrollment_id", enrollmentId).is("deleted_at", null),
      admin.from("students").select("first_name, last_name, other_names, admission_no").eq("id", enr.student_id).maybeSingle(),
      admin.from("classes").select("name, arm").eq("id", enr.class_id).maybeSingle(),
      admin.from("terms").select("name, session_id").eq("id", enr.term_id).maybeSingle(),
      admin.from("schools").select("name").eq("id", schoolId).maybeSingle(),
      admin.from("school_settings").select("logo_url, primary_color, principal_signature_url").eq("school_id", schoolId).maybeSingle(),
      admin.from("subjects").select("id, name").eq("school_id", schoolId),
    ]);
    const { data: session } = term?.session_id
      ? await admin.from("sessions").select("name").eq("id", term.session_id).maybeSingle()
      : { data: null };

    return { enr, tr, results: results ?? [], student, cls, term, session, school, settings, subjects: subjects ?? [] };
  },
};
