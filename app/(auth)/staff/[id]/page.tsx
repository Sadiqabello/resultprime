import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAuthContext } from "@/modules/auth/service";
import { staffService } from "@/modules/staff/service";
import { EditStaffForm } from "@/modules/staff/components/edit-staff-form";
import { can } from "@/lib/authz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Staff member" };

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (!can(ctx, "staff.write")) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader><CardTitle>No access</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Only a school admin can edit staff.</CardContent>
      </Card>
    );
  }

  const res = await staffService.get(ctx, id);

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/staff" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-700">
        <ArrowLeft className="size-4" /> Staff
      </Link>
      {res.ok ? (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">{res.data.fullName}</h1>
          <EditStaffForm staff={res.data} />
        </>
      ) : (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Staff member not found.</p>
      )}
    </div>
  );
}
