import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getAuthContext } from "@/modules/auth/service";
import { reportsService } from "@/modules/reports/service";
import { renderHtmlToPdf } from "@/lib/pdf";
import { can } from "@/lib/authz";
import { rateLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

/**
 * Merged PDF of every computed report card in a class (§11.3). Renders the
 * stacked print route /print/class/[classId] (page-break per student) with
 * headless Chromium in one navigation. For very large classes this should move
 * to a background job + Storage signed URL.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  if (!UUID_RE.test(classId)) return new NextResponse("Bad request", { status: 400 });

  const ctx = await getAuthContext();
  if (!ctx) return new NextResponse("Unauthorized", { status: 401 });
  if (!can(ctx, "results.read")) return new NextResponse("Forbidden", { status: 403 });

  // A whole-class merge renders many cards in one Chromium run — keep it scarce.
  const rl = await rateLimit(`pdf:class:${ctx.userId}`, { max: 6, windowMs: 60_000 });
  if (!rl.ok) {
    return new NextResponse("Too many requests. Please wait a moment.", {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfter) },
    });
  }

  const res = await reportsService.getClassReportCards(ctx, classId);
  if (!res.ok) return new NextResponse(res.error.message, { status: 500 });
  if (res.data.cards.length === 0) return new NextResponse("No computed report cards for this class.", { status: 404 });

  const base = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const url = `${base}/print/class/${classId}`;
  const cookieList = (await cookies()).getAll().map((c) => ({ name: c.name, value: c.value }));

  try {
    const pdf = await renderHtmlToPdf({ url, cookies: cookieList });
    const safe = res.data.classLabel.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="report-cards-${safe}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    logger.error("reports.class_pdf_failed", { schoolId: ctx.schoolId, classId, error: (e as Error).message });
    return new NextResponse("Could not generate the PDF. Please try again.", { status: 500 });
  }
}
