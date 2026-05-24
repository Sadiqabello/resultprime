import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getAuthContext } from "@/modules/auth/service";
import { reportsService } from "@/modules/reports/service";
import { renderHtmlToPdf } from "@/lib/pdf";
import { can } from "@/lib/authz";
import { rateLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

/**
 * Stream a report-card PDF for a student's term result (§11). A Route Handler
 * (not a Server Action) because it returns a binary stream. We render the
 * existing print-styled page (/print/report/[id]) with headless Chromium,
 * forwarding the caller's session cookies so it authorizes as them. The page
 * itself draws the draft watermark for unpublished results (§11.7).
 *
 * Node runtime: puppeteer-core needs it. For whole-class batches, do this in a
 * background job and serve from Storage via a signed URL instead.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return new NextResponse("Bad request", { status: 400 });

  const ctx = await getAuthContext();
  if (!ctx) return new NextResponse("Unauthorized", { status: 401 });
  if (!can(ctx, "results.read")) return new NextResponse("Forbidden", { status: 403 });

  // Each PDF spins up headless Chromium — cap per-user bursts to protect memory.
  const rl = await rateLimit(`pdf:report:${ctx.userId}`, { max: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return new NextResponse("Too many requests. Please wait a moment.", {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfter) },
    });
  }

  // Authorize against the tenant + get name/term for the filename.
  const res = await reportsService.getReportCard(ctx, id);
  if (!res.ok) {
    const status = res.error.code === "NOT_FOUND" ? 404 : res.error.code === "FORBIDDEN" ? 403 : 500;
    return new NextResponse(res.error.message, { status });
  }
  const view = res.data;

  // The page path is fixed and `id` is a validated UUID — no open redirect/SSRF.
  const base = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const url = `${base}/print/report/${id}`;
  const cookieList = (await cookies()).getAll().map((c) => ({ name: c.name, value: c.value }));

  try {
    const pdf = await renderHtmlToPdf({ url, cookies: cookieList });
    const safe = `${view.student.name}-${view.termName}-term`.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const tag = view.published ? "" : "-draft";
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="report-${safe}${tag}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    logger.error("reports.pdf_failed", { schoolId: ctx.schoolId, enrollmentId: id, error: (e as Error).message });
    return new NextResponse("Could not generate the PDF. Please try again.", { status: 500 });
  }
}
