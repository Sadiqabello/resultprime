import { ShieldAlert } from "lucide-react";
import { signOut } from "@/modules/auth/actions";

/**
 * Shown when a user opens a school subdomain that isn't theirs (§4.4). The data
 * is safe regardless — RLS only ever returns the user's own tenant — but we
 * reject the mismatch early with a clear message instead of an empty app.
 */
export function WrongSchoolScreen({ userSchoolName, subdomain }: { userSchoolName: string; subdomain: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <ShieldAlert className="size-7" />
      </span>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Wrong school address</h1>
        <p className="text-sm text-muted-foreground">
          You opened the <span className="font-medium">{subdomain}</span> portal, but your account
          belongs to <span className="font-medium">{userSchoolName}</span>. Use your own school&apos;s
          address to continue.
        </p>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
