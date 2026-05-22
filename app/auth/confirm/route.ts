import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Email-link verification endpoint (password recovery / account setup). We mint
 * these links with admin.generateLink and deliver them through our own email
 * transport (see modules/auth/service sendAccountSetupEmail), so this flow works
 * whether or not Supabase Auth SMTP is configured.
 *
 * On a valid token we verify the OTP — which sets the session cookies — and
 * redirect into the app (default /update-password). Must be a PUBLIC path in
 * middleware: the visitor is unauthenticated until this handler runs.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Open-redirect guard: only same-site relative paths are honoured.
  const requested = searchParams.get("next") ?? "/update-password";
  const next =
    requested.startsWith("/") && !requested.startsWith("//") ? requested : "/update-password";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(new URL("/login?error=link_invalid", origin));
}
