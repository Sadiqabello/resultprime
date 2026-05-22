import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAuthContext } from "@/modules/auth/service";
import { tenancyService } from "@/modules/tenancy/service";
import { notificationsService } from "@/modules/notifications/service";
import { AppShell } from "@/components/layout/app-shell";
import { SuspendedScreen } from "@/components/layout/suspended-screen";
import { WrongSchoolScreen } from "@/components/layout/wrong-school-screen";
import { TENANT_SLUG_HEADER } from "@/config/constants";

/**
 * Authenticated app shell. Guards every route under (auth): no valid session →
 * /login; suspended/cancelled tenant → blocked; a subdomain that isn't the
 * user's tenant → rejected (§4.4). The AuthContext (tenant + roles) flows from
 * the JWT and drives role-aware navigation.
 */
export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  const schoolRes = await tenancyService.getCurrentSchool(ctx);

  // Block staff of a suspended/cancelled school (super admins have no tenant).
  if (schoolRes.ok && schoolRes.data && !schoolRes.data.accessible) {
    return <SuspendedScreen schoolName={schoolRes.data.name} status={schoolRes.data.status} />;
  }

  // The subdomain only suggests the tenant; reject a mismatch with the JWT.
  const slug = (await headers()).get(TENANT_SLUG_HEADER);
  if (slug && schoolRes.ok && schoolRes.data?.slug && slug !== schoolRes.data.slug) {
    return <WrongSchoolScreen userSchoolName={schoolRes.data.name} subdomain={slug} />;
  }

  const unread = await notificationsService.unreadCount(ctx);

  return <AppShell ctx={ctx} unread={unread}>{children}</AppShell>;
}
