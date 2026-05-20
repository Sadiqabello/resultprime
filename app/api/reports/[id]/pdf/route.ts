import { NextResponse, type NextRequest } from "next/server";

/**
 * Stream a report-card PDF for a published term_result (§11). A Route Handler
 * (not a Server Action) because it returns a binary stream to the browser.
 *
 * Authorization: the request runs with the user's session, so RLS + an explicit
 * check ensure only authorized viewers (school staff, or the student/parent for
 * their own published result) can fetch it. For batches, generate via a
 * background job and serve from Storage with a signed URL instead.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // TODO: authorize → load published result → renderHtmlToPdf → stream bytes.
  return NextResponse.json(
    { error: "not_implemented", reportId: id },
    { status: 501 },
  );
}
