import { redirect } from "next/navigation";
import { getAuthContext } from "@/modules/auth/service";
import { AppShell } from "@/components/layout/app-shell";

/**
 * Authenticated app shell. Guards every route under (auth): no valid session →
 * /login. The AuthContext (tenant + roles) flows from the JWT and drives
 * role-aware navigation. Per-tenant branding (§4.5) would be injected here from
 * school_settings.
 */
export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  return <AppShell ctx={ctx}>{children}</AppShell>;
}
