import "server-only";
import { can, type AuthContext } from "@/lib/authz";
import { err, ok, type Result } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { auditService } from "@/modules/audit/service";
import { promotionRepository } from "./repository";

export type PromotionAction = "promote" | "repeat" | "graduate" | "pending";

export interface PlanStudent {
  studentId: string;
  name: string;
  admissionNo: string;
  action: PromotionAction;
  targetClassLabel: string | null;
}
export interface PromotionPlan {
  classLabel: string;
  sourceSessionName: string | null;
  hasCumulative: boolean;
  summary: { promote: number; repeat: number; graduate: number; pending: number };
  students: PlanStudent[];
  targetOptions: { termId: string; label: string }[];
}
export interface PromotionResult {
  promoted: number;
  repeated: number;
  graduated: number;
  skipped: number;
}

const classLabel = (c?: { name: string; arm: string | null } | null) =>
  c ? (c.arm ? `${c.name} ${c.arm}` : c.name) : "—";
const fullName = (s?: { first_name: string; last_name: string; other_names: string | null }) =>
  s ? [s.last_name, s.first_name, s.other_names].filter(Boolean).join(" ") : "—";

/** Decide what happens to a student from their cumulative promotion status. */
function classify(
  status: string,
  nextClassId: string | null,
  sourceClassId: string,
): { action: PromotionAction; targetClassId: string | null } {
  if (status === "promoted") {
    return nextClassId ? { action: "promote", targetClassId: nextClassId } : { action: "graduate", targetClassId: null };
  }
  if (status === "repeat") return { action: "repeat", targetClassId: sourceClassId };
  return { action: "pending", targetClassId: null };
}

export const promotionService = {
  async getPlan(ctx: AuthContext, classId: string): Promise<Result<PromotionPlan>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "academics.manage")) return err("FORBIDDEN", "Not allowed.");
    const schoolId = ctx.schoolId;

    const { data: term } = await promotionRepository.getCurrentTerm(schoolId);
    const { data: classes } = await promotionRepository.listClassesLite(schoolId);
    const klass = (classes ?? []).find((c) => c.id === classId);
    const label = classLabel(klass);
    const classById = new Map((classes ?? []).map((c) => [c.id, c]));

    if (!term?.session_id) {
      return ok({ classLabel: label, sourceSessionName: null, hasCumulative: false, summary: { promote: 0, repeat: 0, graduate: 0, pending: 0 }, students: [], targetOptions: [] });
    }
    const sourceSessionId = term.session_id as string;
    const { data: sourceSession } = await promotionRepository.getSession(schoolId, sourceSessionId);

    const { data: cum } = await promotionRepository.listCumulative(schoolId, classId, sourceSessionId);
    const { data: studs } = await promotionRepository.loadStudents(schoolId, (cum ?? []).map((c) => c.student_id));
    const studMap = new Map((studs ?? []).map((s) => [s.id, s]));

    const summary = { promote: 0, repeat: 0, graduate: 0, pending: 0 };
    const students: (PlanStudent & { sortKey: string })[] = (cum ?? []).map((c) => {
      const { action, targetClassId } = classify(c.promotion_status, c.next_class_id, classId);
      summary[action]++;
      const s = studMap.get(c.student_id);
      return {
        studentId: c.student_id,
        name: fullName(s),
        admissionNo: (s?.admission_no as string) ?? "",
        sortKey: (s?.last_name as string) ?? "",
        action,
        targetClassLabel: targetClassId ? classLabel(classById.get(targetClassId)) : null,
      };
    });
    students.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // target terms = terms in a session OTHER than the source (i.e. the next year)
    const [{ data: sessions }, { data: terms }] = await Promise.all([
      promotionRepository.listSessions(schoolId),
      promotionRepository.listTerms(schoolId),
    ]);
    const sessionName = new Map((sessions ?? []).map((s) => [s.id, s.name as string]));
    const targetOptions = (terms ?? [])
      .filter((t) => t.session_id !== sourceSessionId)
      .map((t) => ({ termId: t.id as string, label: `${sessionName.get(t.session_id) ?? "Session"} · ${t.name} term` }));

    return ok({
      classLabel: label,
      sourceSessionName: (sourceSession?.name as string) ?? null,
      hasCumulative: (cum ?? []).length > 0,
      summary,
      students: students.map(({ sortKey: _s, ...r }) => r),
      targetOptions,
    });
  },

  /**
   * Enrol the class's students into the target (next) session: promoted students
   * into their next class, repeats back into the same class, graduates marked
   * graduated. Idempotent — re-running updates existing target-term enrolments
   * rather than duplicating them.
   */
  async promoteClass(ctx: AuthContext, classId: string, targetTermId: string): Promise<Result<PromotionResult>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "academics.manage")) return err("FORBIDDEN", "Not allowed.");
    const schoolId = ctx.schoolId;

    const { data: term } = await promotionRepository.getCurrentTerm(schoolId);
    if (!term?.session_id) return err("CONFLICT", "No active term/session.");
    const sourceSessionId = term.session_id as string;

    const { data: target } = await promotionRepository.getTerm(schoolId, targetTermId);
    if (!target) return err("NOT_FOUND", "Target term not found.");
    const targetSessionId = target.session_id as string;
    if (targetSessionId === sourceSessionId) {
      return err("CONFLICT", "Pick a term in the next session, not the current one.");
    }

    const { data: cum } = await promotionRepository.listCumulative(schoolId, classId, sourceSessionId);
    if (!cum || cum.length === 0) return err("CONFLICT", "Compute annual results for this class first.");

    const studentIds = cum.map((c) => c.student_id as string);
    const { data: existing } = await promotionRepository.listEnrollmentsForTerm(schoolId, targetTermId, studentIds);
    const existingByStudent = new Map((existing ?? []).map((e) => [e.student_id, e]));

    const result: PromotionResult = { promoted: 0, repeated: 0, graduated: 0, skipped: 0 };
    const inserts: Record<string, unknown>[] = [];

    for (const c of cum) {
      const { action, targetClassId } = classify(c.promotion_status as string, c.next_class_id as string | null, classId);
      if (action === "pending") {
        result.skipped++;
        continue;
      }
      if (action === "graduate") {
        const { error } = await promotionRepository.setStudentGraduated(schoolId, c.student_id as string);
        if (error) return err("INTERNAL", error.message);
        result.graduated++;
        continue;
      }
      // promote or repeat → ensure a target-term enrolment in targetClassId
      const tc = targetClassId as string;
      const ex = existingByStudent.get(c.student_id);
      if (ex) {
        if (ex.class_id !== tc) {
          const { error } = await promotionRepository.updateEnrollmentClass(schoolId, ex.id as string, tc);
          if (error) return err("INTERNAL", error.message);
        }
      } else {
        inserts.push({
          school_id: schoolId,
          student_id: c.student_id,
          class_id: tc,
          session_id: targetSessionId,
          term_id: targetTermId,
          status: "active",
        });
      }
      const { error: upd } = await promotionRepository.updateStudentClass(schoolId, c.student_id as string, tc);
      if (upd) return err("INTERNAL", upd.message);
      if (action === "promote") result.promoted++;
      else result.repeated++;
    }

    const { error: insErr } = await promotionRepository.insertEnrollments(inserts);
    if (insErr) return err("INTERNAL", insErr.message);

    await auditService.record({
      schoolId,
      actorId: ctx.userId,
      action: "students.promote",
      entityType: "class",
      entityId: classId,
      metadata: { fromSession: sourceSessionId, targetTermId, ...result },
    });
    logger.info("promotion.executed", { schoolId, userId: ctx.userId, classId, targetTermId, ...result });
    return ok(result);
  },
};
