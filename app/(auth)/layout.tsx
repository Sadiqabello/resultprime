import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAuthContext } from "@/modules/auth/service";
import { can } from "@/lib/authz";
import { tenancyService } from "@/modules/tenancy/service";
import { notificationsService } from "@/modules/notifications/service";
import { AppShell } from "@/components/layout/app-shell";
import { SuspendedScreen } from "@/components/layout/suspended-screen";
import { LockedScreen } from "@/components/layout/locked-screen";
import { GraceBanner } from "@/components/layout/grace-banner";
import { WrongSchoolScreen } from "@/components/layout/wrong-school-screen";
import { TENANT_SLUG_HEADER } from "@/config/constants";

/**
 * Authenticated app shell. Guards every route under (auth): no valid session →
 * /login; manually suspended/cancelled tenant → blocked; trial/subscription
 * lapsed → read-only banner (grace) then locked (renew); a subdomain that isn't
 * the user's tenant → rejected (§4.4). The AuthContext (tenant + roles) flows
 * from the JWT and drives role-aware navigation.
 */
export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  const schoolRes = await tenancyService.getCurrentSchool(ctx);
  const school = schoolRes.ok ? schoolRes.data : null;

  // Billing/access gate — live entitlement (trial/subscription + grace).
  if (school && school.entitlement.access === "locked") {
    const { state, reason } = school.entitlement;
    if (state === "suspended" || state === "cancelled") {
      return <SuspendedScreen schoolName={school.name} status={school.status} />;
    }
    return (
      <LockedScreen
        schoolName={school.name}
        reason={reason}
        canRenew={can(ctx, "school.configure")}
        trialExpired={state === "trial_expired"}
      />
    );
  }

  // The subdomain only suggests the tenant; reject a mismatch with the JWT.
  const slug = (await headers()).get(TENANT_SLUG_HEADER);
  if (slug && school?.slug && slug !== school.slug) {
    return <WrongSchoolScreen userSchoolName={school.name} subdomain={slug} />;
  }

  const unread = await notificationsService.unreadCount(ctx);
  const banner =
    school && school.entitlement.access === "read_only" ? (
      <GraceBanner reason={school.entitlement.reason} until={school.entitlement.until} />
    ) : null;

  return (
    <AppShell ctx={ctx} unread={unread} banner={banner}>
      {children}
    </AppShell>
  );
}
