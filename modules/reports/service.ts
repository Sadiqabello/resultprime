import "server-only";
import { can, type AuthContext } from "@/lib/authz";
import { err, ok, type Result } from "@/lib/errors";
import { renderHtmlToPdf } from "@/lib/pdf";

/**
 * Report cards & broadsheets (§11). Single cards may render on demand; batches
 * (a whole class) should run as a background job and be served from Storage via
 * a signed URL. Only PUBLISHED results are renderable to students/parents.
 */
export const reportsService = {
  async generateReportCard(
    ctx: AuthContext,
    args: { enrollmentId: string; termId: string; draft?: boolean },
  ): Promise<Result<Buffer>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "results.export")) return err("FORBIDDEN", "Not allowed.");

    // TODO: load published term_result + subject results + branding, build the
    // print URL, then render. Draft renders carry a watermark (§11.7).
    try {
      const pdf = await renderHtmlToPdf({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/print/report/${args.enrollmentId}?term=${args.termId}`,
        watermark: args.draft ? "DRAFT — NOT APPROVED" : undefined,
      });
      return ok(pdf);
    } catch (e) {
      return err("INTERNAL", (e as Error).message);
    }
  },

  async verifyByCode(_code: string): Promise<Result<null>> {
    // Public QR verification (§11.6) — look up the published term_result version.
    // TODO: implement; returns the authoritative summary, never draft data.
    return ok(null);
  },
};
