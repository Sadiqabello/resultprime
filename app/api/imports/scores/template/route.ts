import { type NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/modules/auth/service";
import { importsService } from "@/modules/imports/service";

/**
 * Download the class-subject-specific score template (.xlsx) with the roster
 * pre-filled. A Route Handler (not a Server Action) because this streams a file
 * (§7.7). Node runtime: SheetJS needs Buffer.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return new NextResponse("Unauthorized", { status: 401 });

  const classSubjectId = req.nextUrl.searchParams.get("classSubjectId") ?? "";
  const res = await importsService.buildTemplate(ctx, classSubjectId);
  if (!res.ok) {
    const status = res.error.code === "FORBIDDEN" ? 403 : res.error.code === "NOT_FOUND" ? 404 : 400;
    return new NextResponse(res.error.message, { status });
  }

  return new NextResponse(new Uint8Array(res.data.buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${res.data.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
