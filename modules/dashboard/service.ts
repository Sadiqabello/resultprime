import "server-only";
import { can, type AuthContext } from "@/lib/authz";
import { getDashboardRaw, getAnalyticsRaw } from "./repository";

export interface SetupState {
  hasTerm: boolean;
  hasClasses: boolean;
  hasSubjects: boolean;
  hasGrading: boolean;
  hasStudents: boolean;
  hasStaff: boolean;
}

export interface DashboardOverview {
  schoolName: string;
  firstName: string;
  session: string | null;
  term: string | null;
  termId: string | null;
  setup: SetupState;
  setupComplete: boolean;
  stats: { students: number; classes: number; subjects: number; staff: number };
  results: { published: number; enrolled: number; percent: number } | null;
  pendingApprovals: number;
  myClassSubjects: number;
}

/**
 * Assemble the role-agnostic view model. The page decides which sections to
 * show per role (counts are cheap, so we compute them all and let the UI gate).
 */
export const dashboardService = {
  async getOverview(ctx: AuthContext): Promise<DashboardOverview> {
    if (!ctx.schoolId) throw new Error("No school context");
    const raw = await getDashboardRaw(ctx.schoolId, ctx.userId);

    const setup: SetupState = {
      hasTerm: raw.termId !== null,
      hasClasses: raw.counts.classes > 0,
      hasSubjects: raw.counts.subjects > 0,
      hasGrading: raw.counts.grading > 0,
      hasStudents: raw.counts.students > 0,
      hasStaff: raw.counts.staff > 0,
    };
    const setupComplete = Object.values(setup).every(Boolean);

    const results =
      raw.termId === null
        ? null
        : {
            published: raw.termCounts.publishedResults,
            enrolled: raw.termCounts.enrolled,
            percent:
              raw.termCounts.enrolled === 0
                ? 0
                : Math.round(
                    (raw.termCounts.publishedResults / raw.termCounts.enrolled) * 100,
                  ),
          };

    return {
      schoolName: raw.schoolName,
      firstName: raw.userFullName.trim().split(/\s+/)[0] || "there",
      session: raw.session,
      term: raw.term,
      termId: raw.termId,
      setup,
      setupComplete,
      stats: {
        students: raw.counts.students,
        classes: raw.counts.classes,
        subjects: raw.counts.subjects,
        staff: raw.counts.staff,
      },
      results,
      pendingApprovals: raw.termCounts.pendingApprovals,
      myClassSubjects: raw.termCounts.myClassSubjects,
    };
  },

  /**
   * Analytics view model for the admin dashboard — computed from bounded,
   * RLS-scoped reads (term_results + roster + approvals + fees + audit). Gated on
   * `results.read`; returns null when the caller can't read results or there's no
   * current term yet (the page then shows onboarding instead).
   */
  async getAnalytics(ctx: AuthContext, termId: string | null): Promise<DashboardAnalytics | null> {
    if (!ctx.schoolId || !termId || !can(ctx, "results.read")) return null;
    const raw = await getAnalyticsRaw(ctx.schoolId, termId);

    const round = (x: number) => Math.round(x * 10) / 10;
    const classLabel = (c?: { name: string; arm: string | null }) =>
      !c ? "—" : c.arm ? `${c.name} ${c.arm}` : c.name;

    const classMap = new Map(raw.classes.map((c) => [c.id, classLabel(c)]));
    const studentName = new Map(
      raw.students.map((s) => [s.id, [s.last_name, s.first_name].filter(Boolean).join(" ")]),
    );
    const enrollMap = new Map(raw.enrollments.map((e) => [e.id, e]));

    const enrolled = raw.enrollments.length;
    const computed = raw.termResults.length;
    const published = raw.termResults.filter((r) => r.status === "published").length;
    const graded = raw.termResults.filter((r): r is typeof r & { average: number } => r.average !== null);

    const avgScore = graded.length ? round(graded.reduce((s, r) => s + r.average, 0) / graded.length) : null;
    const passRate = graded.length
      ? Math.round((graded.filter((r) => r.average >= raw.passMark).length / graded.length) * 100)
      : null;

    // Performance bands (recognisable A–F tiers); pass rate is computed separately
    // against the school's real pass mark above.
    const BANDS: { label: string; min: number; tone: Tier["tone"] }[] = [
      { label: "A · 75+", min: 75, tone: "excellent" },
      { label: "B · 60–74", min: 60, tone: "good" },
      { label: "C · 50–59", min: 50, tone: "fair" },
      { label: "D · 40–49", min: 40, tone: "weak" },
      { label: "F · <40", min: 0, tone: "fail" },
    ];
    const tiers: Tier[] = BANDS.map((b, i) => {
      const upper = i === 0 ? Infinity : BANDS[i - 1]!.min;
      return { label: b.label, tone: b.tone, count: graded.filter((r) => r.average >= b.min && r.average < upper).length };
    });

    // Per-class averages + sizes.
    const sizeByClass = new Map<string, number>();
    for (const e of raw.enrollments) sizeByClass.set(e.class_id, (sizeByClass.get(e.class_id) ?? 0) + 1);
    const byClass = new Map<string, number[]>();
    for (const r of graded) {
      const arr = byClass.get(r.class_id) ?? [];
      arr.push(r.average);
      byClass.set(r.class_id, arr);
    }
    const classes: ClassPerf[] = [...byClass.entries()]
      .map(([classId, avgs]) => ({
        classId,
        label: classMap.get(classId) ?? "—",
        average: round(avgs.reduce((s, a) => s + a, 0) / avgs.length),
        size: sizeByClass.get(classId) ?? avgs.length,
      }))
      .sort((a, b) => (b.average ?? 0) - (a.average ?? 0));

    const rank = (r: { enrollment_id: string; average: number }): RankedStudent => {
      const enr = enrollMap.get(r.enrollment_id);
      return {
        name: (enr && studentName.get(enr.student_id)) || "Student",
        classLabel: (enr && classMap.get(enr.class_id)) || "—",
        average: r.average,
      };
    };
    const topPerformers = [...graded].sort((a, b) => b.average - a.average).slice(0, 5).map(rank);
    const atRisk = graded
      .filter((r) => r.average < raw.passMark)
      .sort((a, b) => a.average - b.average)
      .slice(0, 5)
      .map(rank);

    // Results pipeline across all classes (a class with no approval row is a draft).
    const stateByClass = new Map(raw.approvals.map((a) => [a.subject_id, a.state]));
    const totalClasses = raw.classes.length;
    let draft = 0,
      inReview = 0,
      approved = 0,
      pub = 0;
    for (const c of raw.classes) {
      const st = stateByClass.get(c.id) ?? "draft";
      if (st === "published") pub++;
      else if (st === "approved") approved++;
      else if (st === "submitted" || st === "l1_approved") inReview++;
      else draft++;
    }
    const pipeline: PipelineStage[] = [
      { label: "Draft", count: draft, tone: "weak" },
      { label: "In review", count: inReview, tone: "fair" },
      { label: "Approved", count: approved, tone: "good" },
      { label: "Published", count: pub, tone: "excellent" },
    ];
    const computedClasses = byClass.size;

    const fees = raw.feeGatingEnabled
      ? (() => {
          const cleared = raw.fees.filter((f) => f.status === "cleared").length;
          const owing = raw.fees.filter((f) => f.status === "owing").length;
          const partial = raw.fees.filter((f) => f.status === "partial").length;
          const total = raw.fees.length;
          return { enabled: true, cleared, owing, partial, total, clearedPct: total ? Math.round((cleared / total) * 100) : 0 };
        })()
      : null;

    const gender = {
      male: raw.students.filter((s) => s.gender === "male").length,
      female: raw.students.filter((s) => s.gender === "female").length,
      unknown: raw.students.filter((s) => !s.gender).length,
    };

    const activity: ActivityItem[] = raw.activity.map((a) => ({
      action: a.action,
      entity: a.entity_type,
      actor: (a.actor_id && raw.actorNames[a.actor_id]) || "System",
      at: a.created_at,
    }));

    return {
      enrolled,
      computed,
      published,
      completionPct: enrolled ? Math.round((computed / enrolled) * 100) : 0,
      publishedPct: enrolled ? Math.round((published / enrolled) * 100) : 0,
      passMark: raw.passMark,
      passRate,
      avgScore,
      tiers,
      classes,
      topPerformers,
      atRisk,
      pipeline,
      totalClasses,
      computedClasses,
      notComputedClasses: Math.max(0, totalClasses - computedClasses),
      fees,
      gender,
      activity,
    };
  },
};

export type Tone = "excellent" | "good" | "fair" | "weak" | "fail";
export interface Tier {
  label: string;
  count: number;
  tone: Tone;
}
export interface ClassPerf {
  classId: string;
  label: string;
  average: number | null;
  size: number;
}
export interface RankedStudent {
  name: string;
  classLabel: string;
  average: number;
}
export interface PipelineStage {
  label: string;
  count: number;
  tone: Tone;
}
export interface ActivityItem {
  action: string;
  entity: string | null;
  actor: string;
  at: string;
}
export interface DashboardAnalytics {
  enrolled: number;
  computed: number;
  published: number;
  completionPct: number;
  publishedPct: number;
  passMark: number;
  passRate: number | null;
  avgScore: number | null;
  tiers: Tier[];
  classes: ClassPerf[];
  topPerformers: RankedStudent[];
  atRisk: RankedStudent[];
  pipeline: PipelineStage[];
  totalClasses: number;
  computedClasses: number;
  notComputedClasses: number;
  fees: { enabled: boolean; cleared: number; owing: number; partial: number; total: number; clearedPct: number } | null;
  gender: { male: number; female: number; unknown: number };
  activity: ActivityItem[];
}
