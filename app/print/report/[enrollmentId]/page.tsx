import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { getAuthContext } from "@/modules/auth/service";
import { reportsService } from "@/modules/reports/service";
import { ReportCard } from "@/modules/reports/components/report-card";
import { PrintButton } from "@/modules/reports/components/print-button";
import { can } from "@/lib/authz";

export const metadata: Metadata = { title: "Report card" };

export default async function PrintReportPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (!can(ctx, "results.read")) {
    return <p className="p-10 text-center text-sm text-muted-foreground">You don&apos;t have access.</p>;
  }

  const res = await reportsService.getReportCard(ctx, enrollmentId);
  if (!res.ok) {
    return <p className="p-10 text-center text-sm text-muted-foreground">Report card unavailable.</p>;
  }
  const view = res.data;

  let qrSvg: string | null = null;
  let verifyUrl: string | null = null;
  if (view.published && view.verifyCode) {
    verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/verify/${view.verifyCode}`;
    qrSvg = await QRCode.toString(verifyUrl, { type: "svg", margin: 1, width: 110 });
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[820px] items-center justify-between px-4 print:hidden">
        <Link href="/results" className="text-sm text-muted-foreground hover:underline">
          ← Back to results
        </Link>
        <PrintButton />
      </div>
      <div className="mx-auto max-w-[820px] bg-white shadow-sm print:max-w-none print:shadow-none">
        <ReportCard view={view} qrSvg={qrSvg} verifyUrl={verifyUrl} />
      </div>
    </div>
  );
}
