import Link from "next/link";
import { GraduationCap, CheckCircle2 } from "lucide-react";

/**
 * Split-screen auth layout: a branded panel (palette gradient) beside the form.
 * Presentational server component shared by the login and signup pages.
 */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 p-10 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <GraduationCap className="size-6" />
          RPS
        </Link>
        <div className="space-y-6">
          <h2 className="max-w-sm text-3xl font-semibold leading-tight">
            From raw scores to approved report cards.
          </h2>
          <ul className="space-y-3 text-brand-50/90">
            {[
              "Configurable grading & weighting",
              "Audited results with approval workflow",
              "Branded, printable report cards",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-brand-200" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-brand-100/70">
          Multi-tenant result processing for primary &amp; secondary schools.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-semibold lg:hidden"
            >
              <GraduationCap className="size-5 text-primary" />
              RPS
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
