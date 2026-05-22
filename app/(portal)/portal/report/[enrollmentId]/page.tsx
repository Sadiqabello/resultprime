import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import QRCode from "qrcode";
import { getAuthContext } from "@/modules/auth/service";
import { portalService } from "@/modules/portal/service";
import { ReportCard } from "@/modules/reports/components/report-card";
import { PrintButton } from "@/modules/reports/components/print-button";

export const metadata: Metadata = { title: "Report card" };

export default async function PortalReportPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  const res = await portalService.getReportCard(ctx, enrollmentId);

  if (!res.ok) {
    return (
      <div className="space-y-4">
        <Back />
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          This result isn&apos;t available.
        </p>
      </div>
    );
  }

  if (res.data.withheld) {
    return (
      <div className="space-y-4">
        <Back />
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6">
          <div className="flex items-center gap-2 text-amber-800">
            <Lock className="size-5" />
            <span className="font-medium">Result withheld</span>
          </div>
          <p className="mt-2 text-sm text-amber-900">
            {res.data.studentName}&apos;s result is ready but withheld pending fee clearance. Please
            contact the school&apos;s bursary to clear outstanding fees.
          </p>
        </div>
      </div>
    );
  }

  const view = res.data.view!;
  let qrSvg: string | null = null;
  let verifyUrl: string | null = null;
  if (view.verifyCode) {
    verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/verify/${view.verifyCode}`;
    qrSvg = await QRCode.toString(verifyUrl, { type: "svg", margin: 1, width: 110 });
  }

  return (
    <div className="space-y-4 print:space-y-0">
      <div className="flex items-center justify-between print:hidden">
        <Back />
        <PrintButton />
      </div>
      <div className="bg-white shadow-sm print:shadow-none">
        <ReportCard view={view} qrSvg={qrSvg} verifyUrl={verifyUrl} />
      </div>
    </div>
  );
}

function Back() {
  return (
    <Link href="/portal" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-700">
      <ArrowLeft className="size-4" /> Back
    </Link>
  );
}
