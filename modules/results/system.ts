import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import type { Json } from "@/types/database.types";
import {
  computeClassSubjectResults,
  aggregateTerm,
  rank,
  type EngineConfig,
  type StudentScores,
} from "@/lib/result-engine";

/**
 * System (no-user) recompute for background jobs / cron (§6.8, §14.6). Mirrors
 * the user-flow ResultService.computeClass but uses the SERVICE-ROLE client and
 * the PURE engine, so it runs without an AuthContext. Idempotent upsert; only
 * refreshes classes that already have computed term_results (a recompute, not a
 * first compute). Tenant is always passed explicitly (no RLS here — be careful).
 */

type Admin = ReturnType<typeof createAdminClient>;

async function buildConfig(admin: Admin, schoolId: string) {
  const [{ data: sys }, { data: scheme }] = await Promise.all([
    admin.from("grading_systems").select("*, grade_bands(*)").eq("school_id", schoolId).eq("is_active", true).is("deleted_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("assessment_schemes").select("*, assessment_components(*)").eq("school_id", schoolId).eq("is_active", true).is("deleted_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!sys || !scheme) return null;

  interface Comp { id: string; key: string; label: string; maxScore: number; isExam: boolean }
  const components: Comp[] = ((scheme.assessment_components ?? []) as Array<Record<string, unknown>>)
    .slice()
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
    .map((c) => ({ id: String(c.id), key: String(c.key), label: String(c.label), maxScore: Number(c.max_score), isExam: Boolean(c.is_exam) }));
  if (components.length === 0) return null;

  const gradeBands = ((sys.grade_bands ?? []) as Array<Record<string, unknown>>)
    .slice()
    .sort((a, b) => Number(b.min_score) - Number(a.min_score))
    .map((b) => ({ min: Number(b.min_score), max: Number(b.max_score), grade: String(b.grade), remark: String(b.remark ?? ""), gradePoint: b.grade_point == null ? undefined : Number(b.grade_point) }));

  const config: EngineConfig = {
    components: components.map((c) => ({ key: c.key, label: c.label, maxScore: c.maxScore, isExam: c.isExam })),
    gradeBands,
    rounding: { dp: (Number(sys.rounding_dp) || 2) as 0 | 1 | 2, mode: "half_up" },
    tieStrategy: (sys.tie_strategy as "dense" | "standard") ?? "standard",
    excludeAbsentFromRank: sys.exclude_absent_from_rank == null ? true : Boolean(sys.exclude_absent_from_rank),
  };
  const idToKey = new Map(components.map((c) => [c.id, c.key]));
  const obtainablePerSubject = components.reduce((s, c) => s + c.maxScore, 0);
  return { config, idToKey, obtainablePerSubject, configSnapshot: config };
}

async function recomputeClass(admin: Admin, schoolId: string, classId: string, termId: string, cfg: NonNullable<Awaited<ReturnType<typeof buildConfig>>>) {
  const { data: csRows } = await admin.from("class_subjects").select("id, subject_id").eq("school_id", schoolId).eq("class_id", classId).eq("term_id", termId).eq("is_active", true).is("deleted_at", null);
  const { data: enr } = await admin.from("enrollments").select("id").eq("school_id", schoolId).eq("class_id", classId).eq("term_id", termId).eq("status", "active").is("deleted_at", null);
  const enrollmentIds = (enr ?? []).map((e) => e.id as string);
  if (!csRows || csRows.length === 0 || enrollmentIds.length === 0) return 0;

  const termAcc = new Map<string, { subjectId: string; total: number; obtainable: number; isExempt: boolean }[]>();
  for (const id of enrollmentIds) termAcc.set(id, []);
  const now = new Date().toISOString();

  for (const cs of csRows) {
    const { data: scoreRows } = await admin.from("scores").select("enrollment_id, assessment_component_id, score, is_absent, is_exempt").eq("school_id", schoolId).eq("class_subject_id", cs.id).eq("term_id", termId).is("deleted_at", null);
    const byStudent = new Map<string, StudentScores>();
    for (const id of enrollmentIds) byStudent.set(id, { studentRef: id, scores: [] });
    for (const row of scoreRows ?? []) {
      const key = cfg.idToKey.get(row.assessment_component_id);
      const entry = byStudent.get(row.enrollment_id);
      if (!entry || !key) continue;
      entry.scores.push({ studentRef: row.enrollment_id, componentKey: key, value: row.score, isAbsent: row.is_absent, isExempt: row.is_exempt });
    }
    const results = computeClassSubjectResults([...byStudent.values()], cfg.config);
    await admin.from("results").upsert(
      results.map((r) => ({
        school_id: schoolId, enrollment_id: r.studentRef, class_subject_id: cs.id, subject_id: cs.subject_id, term_id: termId,
        ca_total: r.caTotal, exam_score: r.examScore, total: r.total, grade: r.grade, grade_point: r.gradePoint, remark: r.remark,
        subject_position: r.subjectPosition, subject_count: results.length, is_absent: r.isAbsent, config_snapshot: cfg.configSnapshot as unknown as Json, computed_at: now, status: "computed" as const,
      })),
      { onConflict: "school_id,enrollment_id,class_subject_id,term_id" },
    );
    for (const r of results) termAcc.get(r.studentRef)?.push({ subjectId: cs.subject_id, total: r.total, obtainable: cfg.obtainablePerSubject, isExempt: r.isExempt });
  }

  const aggs = enrollmentIds.map((id) => ({ id, ...aggregateTerm(termAcc.get(id) ?? [], cfg.config.rounding.dp) }));
  const positions = rank(aggs.map((a) => ({ ref: a.id, score: a.average, excluded: a.average === null })), cfg.config.tieStrategy);
  const classSize = aggs.filter((a) => a.average !== null).length;
  await admin.from("term_results").upsert(
    aggs.map((a) => ({
      school_id: schoolId, enrollment_id: a.id, class_id: classId, term_id: termId,
      subjects_count: a.subjectsCount, total_obtainable: a.totalObtainable, total_obtained: a.totalObtained,
      average: a.average, class_position: positions.get(a.id) ?? null, class_size: classSize,
      config_snapshot: cfg.configSnapshot as unknown as Json, computed_at: now, status: "computed" as const,
    })),
    { onConflict: "school_id,enrollment_id,term_id" },
  );
  return enrollmentIds.length;
}

/** Recompute every already-computed class for a school's current term. */
export async function recomputeSchool(schoolId: string): Promise<{ classes: number; students: number }> {
  const admin = createAdminClient();
  const { data: term } = await admin.from("terms").select("id").eq("school_id", schoolId).eq("is_current", true).is("deleted_at", null).maybeSingle();
  if (!term) return { classes: 0, students: 0 };
  const termId = term.id as string;

  const cfg = await buildConfig(admin, schoolId);
  if (!cfg) return { classes: 0, students: 0 };

  // Only refresh classes that already have computed term_results this term.
  const { data: computed } = await admin.from("term_results").select("class_id").eq("school_id", schoolId).eq("term_id", termId).is("deleted_at", null);
  const classIds = [...new Set((computed ?? []).map((r) => r.class_id as string))];

  let students = 0;
  for (const classId of classIds) students += await recomputeClass(admin, schoolId, classId, termId, cfg);
  logger.info("results.recompute_school", { schoolId, classes: classIds.length, students });
  return { classes: classIds.length, students };
}

/** Recompute all active schools (or a single one). Used by the cron endpoint. */
export async function recomputeActive(schoolId?: string): Promise<{ schools: number; classes: number; students: number }> {
  const admin = createAdminClient();
  let schoolIds: string[];
  if (schoolId) schoolIds = [schoolId];
  else {
    const { data } = await admin.from("schools").select("id").eq("status", "active");
    schoolIds = (data ?? []).map((s) => s.id as string);
  }
  let classes = 0;
  let students = 0;
  for (const sid of schoolIds) {
    const r = await recomputeSchool(sid);
    classes += r.classes;
    students += r.students;
  }
  return { schools: schoolIds.length, classes, students };
}
