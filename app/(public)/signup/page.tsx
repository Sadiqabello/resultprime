import type { Metadata } from "next";
import { AuthShell } from "@/modules/auth/components/auth-shell";
import { SignUpForm } from "@/modules/auth/components/sign-up-form";

export const metadata: Metadata = { title: "Create your school" };

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your school"
      subtitle="Set up your school and your admin account. You can invite staff next."
    >
      <SignUpForm />
    </AuthShell>
  );
}
