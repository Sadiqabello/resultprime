import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAuthContext } from "@/modules/auth/service";
import { tenancyService } from "@/modules/tenancy/service";
import { PortalShell } from "@/components/layout/portal-shell";
import { WrongSchoolScreen } from "@/components/layout/wrong-school-screen";
import { TENANT_SLUG_HEADER } from "@/config/constants";

// Private parent/student portal — never index.
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Parent/student portal shell. Authenticated consumers only see their own
 * published results (ownership + fee gate enforced in the portal service). Staff
 * can visit but have no linked students. Super admins have no tenant → out.
 */
export default async function PortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (!ctx.schoolId) redirect("/dashboard");

  const schoolRes = await tenancyService.getCurrentSchool(ctx);
  const schoolName = schoolRes.ok && schoolRes.data ? schoolRes.data.name : "Results";

  const slug = (await headers()).get(TENANT_SLUG_HEADER);
  if (slug && schoolRes.ok && schoolRes.data?.slug && slug !== schoolRes.data.slug) {
    return <WrongSchoolScreen userSchoolName={schoolName} subdomain={slug} />;
  }

  return <PortalShell schoolName={schoolName}>{children}</PortalShell>;
}
