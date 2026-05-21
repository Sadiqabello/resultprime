import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import QRCode from "qrcode";
import { getAuthContext } from "@/modules/auth/service";
import { reportsService } from "@/modules/reports/service";
import { ReportCard } from "@/modules/reports/components/report-card";
import { PrintButton } from "@/modules/reports/components/print-button";
import { can } from "@/lib/authz";

export const metadata: Metadata = { title: "Class report cards" };

/**
 * Every computed report card for a class, stacked with a page break between
 * each — one navigation for headless Chromium to capture as a single merged PDF
 * (§11.3). Reuses the same ReportCard component as the single-card view.
 */
export default async function ClassReportCardsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (!can(ctx, "results.read")) {
    return <p className="p-10 text-center text-sm text-muted-foreground">You don&apos;t have access.</p>;
  }

  const res = await reportsService.getClassReportCards(ctx, classId);
  if (!res.ok) {
    return <p className="p-10 text-center text-sm text-muted-foreground">Report cards unavailable.</p>;
  }
  const { classLabel, termName, cards } = res.data;

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const withQr = await Promise.all(
    cards.map(async (view) => {
      if (view.published && view.verifyCode) {
        const verifyUrl = `${base}/verify/${view.verifyCode}`;
        const qrSvg = await QRCode.toString(verifyUrl, { type: "svg", margin: 1, width: 110 });
        return { view, qrSvg, verifyUrl };
      }
      return { view, qrSvg: null, verifyUrl: null };
    }),
  );

  return (
    <div className="min-h-screen bg-neutral-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[820px] items-center justify-between px-4 print:hidden">
        <Link href={`/reports?class=${classId}`} className="text-sm text-muted-foreground hover:underline">
          ← Back to reports
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {classLabel} · {termName} Term · {cards.length} card{cards.length === 1 ? "" : "s"}
          </span>
          <a
            href={`/api/reports/class/${classId}/pdf`}
            className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
          >
            <Download className="size-4" /> Download all PDF
          </a>
          <PrintButton />
        </div>
      </div>

      {cards.length === 0 ? (
        <p className="mx-auto max-w-[820px] rounded-lg border border-dashed bg-white p-10 text-center text-sm text-muted-foreground print:hidden">
          No computed report cards for this class yet.
        </p>
      ) : (
        withQr.map(({ view, qrSvg, verifyUrl }, i) => (
          <div
            key={i}
            className="mx-auto mb-8 max-w-[820px] break-after-page bg-white shadow-sm last:mb-0 last:break-after-auto print:mb-0 print:max-w-none print:shadow-none"
          >
            <ReportCard view={view} qrSvg={qrSvg} verifyUrl={verifyUrl} />
          </div>
        ))
      )}
    </div>
  );
}
