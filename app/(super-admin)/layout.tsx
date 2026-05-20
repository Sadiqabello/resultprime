import { redirect } from "next/navigation";
import { getAuthContext } from "@/modules/auth/service";
import { isSuperAdmin } from "@/lib/authz";

/**
 * Platform console layout. Cross-tenant by design — only platform super admins
 * reach it. All actions here use the service-role client and MUST be audited
 * (especially impersonation).
 */
export default async function SuperAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (!isSuperAdmin(ctx)) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-6 border-b pb-4">
        <h2 className="text-lg font-semibold">Platform Console</h2>
        <p className="text-xs text-muted-foreground">Super Admin · cross-tenant</p>
      </header>
      {children}
    </div>
  );
}
