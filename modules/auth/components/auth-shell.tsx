import Link from "next/link";
import { GraduationCap, CheckCircle2 } from "lucide-react";

export interface AuthBrand {
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
}

/**
 * Split-screen auth layout. On a school subdomain it themes to that school's
 * name/logo/colour (resolved from the host); on the apex it shows generic RPS.
 */
export function AuthShell({
  title,
  subtitle,
  brand,
  children,
}: {
  title: string;
  subtitle: string;
  brand?: AuthBrand | null;
  children: React.ReactNode;
}) {
  const accent = brand?.primaryColor && /^#[0-9a-f]{6}$/i.test(brand.primaryColor) ? brand.primaryColor : null;
  const name = brand?.name ?? "RPS";
  const panelStyle = accent ? { backgroundImage: `linear-gradient(135deg, ${accent}, ${accent}cc)` } : undefined;

  const Logo = ({ className }: { className?: string }) =>
    brand?.logoUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={brand.logoUrl} alt="" className={className ?? "size-6 rounded object-contain"} />
    ) : (
      <GraduationCap className={className ?? "size-6"} />
    );

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div
        className={`relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex ${accent ? "" : "bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500"}`}
        style={panelStyle}
      >
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Logo />
          {name}
        </Link>
        <div className="space-y-6">
          <h2 className="max-w-sm text-3xl font-semibold leading-tight">
            {brand ? `Welcome to ${name}'s results portal.` : "From raw scores to approved report cards."}
          </h2>
          <ul className="space-y-3 text-white/90">
            {[
              "Configurable grading & weighting",
              "Audited results with approval workflow",
              "Branded, printable report cards",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-white/70" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-white/70">
          {brand ? "Result processing for your school." : "Multi-tenant result processing for primary & secondary schools."}
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <Link href="/" className="inline-flex items-center gap-2 font-semibold lg:hidden">
              <Logo className="size-5 text-primary" />
              {name}
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
