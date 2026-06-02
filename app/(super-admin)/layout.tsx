import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/modules/auth/service";
import { isSuperAdmin } from "@/lib/authz";
import { PlatformShell } from "@/components/layout/platform-shell";

// Private platform console — never index.
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Platform console layout. Cross-tenant by design — only platform super admins
 * reach it. All actions here use the service-role client (RLS-bypassing) and are
 * gated again in each service method on isSuperAdmin. Navigation is a left
 * sidebar (PlatformShell), matching the school app.
 */
export default async function SuperAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (!isSuperAdmin(ctx)) redirect("/dashboard");

  return <PlatformShell>{children}</PlatformShell>;
}
