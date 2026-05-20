import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Receipt, ScrollText, GraduationCap } from "lucide-react";
import { getAuthContext } from "@/modules/auth/service";
import { signOut } from "@/modules/auth/actions";
import { isSuperAdmin } from "@/lib/authz";

/**
 * Platform console layout. Cross-tenant by design — only platform super admins
 * reach it. All actions here use the service-role client (RLS-bypassing) and are
 * gated again in each service method on isSuperAdmin.
 */
export default async function SuperAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (!isSuperAdmin(ctx)) redirect("/dashboard");

  const nav = [
    { href: "/schools", label: "Schools", icon: Building2 },
    { href: "/billing", label: "Billing", icon: Receipt },
    { href: "/audit", label: "Audit", icon: ScrollText },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 font-semibold">
              <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-700 to-brand-500 text-white">
                <GraduationCap className="size-4" />
              </span>
              Platform Console
            </span>
            <nav className="hidden items-center gap-1 sm:flex">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <n.icon className="size-4" />
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <form action={signOut}>
            <button type="submit" className="text-sm text-muted-foreground hover:text-brand-700">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
