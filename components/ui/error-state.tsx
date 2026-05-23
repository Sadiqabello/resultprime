import { LogoMark } from "@/components/brand/logo";

/**
 * Full-page error/empty state shared by app/not-found.tsx and app/error.tsx.
 * Presentational only (no client hooks), so it renders in both server and
 * client error boundaries. Action buttons are passed as children.
 */
export function ErrorState({
  code,
  title,
  message,
  children,
}: {
  code?: string;
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-center">
      <LogoMark className="h-9 w-auto" />
      {code ? (
        <p className="mt-10 font-display text-7xl font-semibold leading-none tracking-tight text-brand-200 sm:text-8xl">
          {code}
        </p>
      ) : null}
      <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
        {title}
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">{message}</p>
      {children ? (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>
      ) : null}
    </main>
  );
}
