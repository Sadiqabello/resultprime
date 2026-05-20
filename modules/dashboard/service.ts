import "server-only";
import type { AuthContext } from "@/lib/authz";
import { getDashboardRaw } from "./repository";

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
};
