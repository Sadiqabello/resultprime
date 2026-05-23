import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { reportsService } from "@/modules/reports/service";
import { ordinal } from "@/lib/utils";

export const metadata: Metadata = { title: "Verify result", robots: { index: false } };

/**
 * Public QR verification (§11.6). No login. Looks up the PUBLISHED term result
 * by code (service-role, summary-only) and confirms authenticity. Genuine cards
 * show the authoritative summary; anything else shows "could not verify".
 */
export default async function VerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const result = await reportsService.verifyByCode(code);
  const summary = result.ok ? result.data : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
      <Link href="/" className="flex items-center gap-2.5 font-display text-lg tracking-tight text-brand-950" aria-label="Result Prime">
        <LogoMark className="h-8 w-auto" />
        <span><span className="font-normal">Result</span> <span className="font-semibold">Prime</span></span>
      </Link>

      {summary ? (
        <div className="rounded-2xl border border-brand-200 bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-brand-700">
            <CheckCircle2 className="size-5" />
            <span className="font-medium">Verified — genuine result</span>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <Row label="School" value={summary.schoolName} />
            <Row label="Student" value={summary.studentName} />
            <Row label="Class" value={summary.className} />
            <Row label="Term" value={`${summary.termName} Term`} />
            <Row label="Average" value={summary.average == null ? "—" : `${summary.average}%`} />
            <Row
              label="Position"
              value={
                summary.position == null
                  ? "—"
                  : `${ordinal(summary.position)}${summary.classSize ? ` of ${summary.classSize}` : ""}`
              }
            />
            {summary.issuedAt ? (
              <Row label="Issued" value={new Date(summary.issuedAt).toLocaleDateString()} />
            ) : null}
          </dl>
          <p className="mt-5 border-t pt-4 text-xs text-muted-foreground">
            This confirms the result was published by the school and has not been altered.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-destructive/30 bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="size-5" />
            <span className="font-medium">Could not verify</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            No published result matches this code. The card may be unofficial, a draft, or the code
            may be mistyped.
          </p>
          <p className="mt-4 break-all text-xs text-muted-foreground">Code: {code}</p>
        </div>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-brand-950">{value}</dd>
    </div>
  );
}
