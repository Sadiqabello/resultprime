import type { Metadata } from "next";
import { headers } from "next/headers";
import { AuthShell } from "@/modules/auth/components/auth-shell";
import { UpdatePasswordForm } from "@/modules/auth/components/update-password-form";
import { tenancyService } from "@/modules/tenancy/service";
import { TENANT_SLUG_HEADER } from "@/config/constants";

export const metadata: Metadata = { title: "Set your password" };

export default async function UpdatePasswordPage() {
  // Theme to the school when on its subdomain (middleware set the header).
  const slug = (await headers()).get(TENANT_SLUG_HEADER);
  const brand = slug ? await tenancyService.resolvePublicBranding(slug) : null;

  return (
    <AuthShell
      title="Set your password"
      subtitle="Choose a password to finish setting up your portal access."
      brand={brand}
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
