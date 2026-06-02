"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

/**
 * Sets the signed-in user's password. Reached from the /auth/confirm link, which
 * has already established a (recovery) session, so updateUser can set a password
 * without the old one. On success we route by role: families → portal, staff →
 * dashboard.
 */
export function UpdatePasswordForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirm = (form.elements.namedItem("confirm") as HTMLInputElement).value;
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Those passwords don't match.");

    setPending(true);
    const supabase = createClient();
    const { error: updErr } = await supabase.auth.updateUser({ password });
    if (updErr) {
      setPending(false);
      setError("Your link may have expired. Ask your school to resend it.");
      return;
    }

    const { data } = await supabase.auth.getUser();
    const roles = ((data.user?.app_metadata as { roles?: string[] })?.roles) ?? [];
    const consumerOnly = roles.length > 0 && roles.every((r) => r === "student" || r === "parent");
    router.replace(consumerOnly ? "/portal" : "/dashboard");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm password</Label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" minLength={8} required />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Set password & continue"}
      </Button>
    </form>
  );
}
