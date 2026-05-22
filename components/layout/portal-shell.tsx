import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { signOut } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";

/**
 * Minimal shell for the parent/student portal — no staff sidebar. Just the
 * school identity and a way out. Consumers only ever see their own data.
 */
export function PortalShell({ schoolName, children }: { schoolName: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="flex h-14 items-center justify-between border-b bg-white px-6">
        <Link href="/portal" className="flex items-center gap-2 font-display font-semibold text-brand-950">
          <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-400 text-white">
            <GraduationCap className="size-4" />
          </span>
          {schoolName}
        </Link>
        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm">Sign out</Button>
        </form>
      </header>
      <main className="mx-auto max-w-3xl p-6">{children}</main>
    </div>
  );
}
