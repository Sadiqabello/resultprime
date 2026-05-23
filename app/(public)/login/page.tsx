import type { Metadata } from "next";
import { headers } from "next/headers";
import { AuthShell } from "@/modules/auth/components/auth-shell";
import { SignInForm } from "@/modules/auth/components/sign-in-form";
import { tenancyService } from "@/modules/tenancy/service";
import { TENANT_SLUG_HEADER } from "@/config/constants";

export const metadata: Metadata = { title: "Sign in" };

const NOTICES: Record<string, string> = {
  link_invalid:
    "That sign-in link has expired or was already used. Ask your school to send a new one, or sign in below if you've already set a password.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const { redirect, error } = await searchParams;
  const notice = error ? NOTICES[error] : undefined;

  // Theme to the school when on its subdomain (middleware set the header).
  const slug = (await headers()).get(TENANT_SLUG_HEADER);
  const brand = slug ? await tenancyService.resolvePublicBranding(slug) : null;

  return (
    <AuthShell
      title="Welcome back"
      subtitle={brand ? `Sign in to ${brand.name}.` : "Sign in to your school's result portal."}
      brand={brand}
    >
      {notice ? (
        <p
          role="alert"
          className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        >
          {notice}
        </p>
      ) : null}
      <SignInForm redirectTo={redirect} />
    </AuthShell>
  );
}
