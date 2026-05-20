import { redirect } from "next/navigation";
import { getAuthContext } from "@/modules/auth/service";
import { tenancyService } from "@/modules/tenancy/service";
import { AppShell } from "@/components/layout/app-shell";
import { SuspendedScreen } from "@/components/layout/suspended-screen";

/**
 * Authenticated app shell. Guards every route under (auth): no valid session →
 * /login; suspended/cancelled tenant → blocked. The AuthContext (tenant + roles)
 * flows from the JWT and drives role-aware navigation.
 */
export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  // Block staff of a suspended/cancelled school (super admins have no tenant).
  const schoolRes = await tenancyService.getCurrentSchool(ctx);
  if (schoolRes.ok && schoolRes.data && !schoolRes.data.accessible) {
    return <SuspendedScreen schoolName={schoolRes.data.name} status={schoolRes.data.status} />;
  }

  return <AppShell ctx={ctx}>{children}</AppShell>;
}
