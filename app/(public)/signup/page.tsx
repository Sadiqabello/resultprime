import type { Metadata } from "next";
import { AuthShell } from "@/modules/auth/components/auth-shell";
import { SignUpForm } from "@/modules/auth/components/sign-up-form";

export const metadata: Metadata = {
  title: "Create your school",
  description: "Start a free 14-day trial of Result Prime — set up your school and print a sample report card in a day. No card required.",
  alternates: { canonical: "/signup" },
};

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
