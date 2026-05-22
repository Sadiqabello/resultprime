import type { Metadata } from "next";
import { headers } from "next/headers";
import { AuthShell } from "@/modules/auth/components/auth-shell";
import { SignInForm } from "@/modules/auth/components/sign-in-form";
import { tenancyService } from "@/modules/tenancy/service";
import { TENANT_SLUG_HEADER } from "@/config/constants";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  // Theme to the school when on its subdomain (middleware set the header).
  const slug = (await headers()).get(TENANT_SLUG_HEADER);
  const brand = slug ? await tenancyService.resolvePublicBranding(slug) : null;

  return (
    <AuthShell
      title="Welcome back"
      subtitle={brand ? `Sign in to ${brand.name}.` : "Sign in to your school's result portal."}
      brand={brand}
    >
      <SignInForm redirectTo={redirect} />
    </AuthShell>
  );
}
