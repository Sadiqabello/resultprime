import { Ban } from "lucide-react";
import { signOut } from "@/modules/auth/actions";

/** Full-screen block shown when a tenant's access is suspended/cancelled. */
export function SuspendedScreen({ schoolName, status }: { schoolName: string; status: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <Ban className="size-7" />
      </span>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Access {status}</h1>
        <p className="text-sm text-muted-foreground">
          {schoolName}&apos;s access to Result Prime is currently {status}. Please contact your
          administrator or Result Prime support to restore it.
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
