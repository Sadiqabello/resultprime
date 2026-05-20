import type { Metadata } from "next";

export const metadata: Metadata = { title: "Verify result" };

/**
 * Public QR verification page (§11.6). The `code` maps to a published
 * term_result version. Renders the authoritative summary (student, class, term,
 * average, position, status, issue date) so a printed report card can be
 * confirmed genuine — no login required, read-only, only published data.
 */
export default async function VerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  // TODO: const result = await reportsService.verifyByCode(code)
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6">
      <h1 className="text-xl font-semibold">Result verification</h1>
      <p className="text-sm text-muted-foreground">
        Verification code: <code>{code}</code>
      </p>
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        Verification view placeholder — look up the published result by code via
        <code> modules/reports</code> and render its authoritative summary.
      </div>
    </main>
  );
}
