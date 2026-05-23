import Link from "next/link";
import type { Metadata } from "next";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

/** 404 — shown for unmatched routes and explicit notFound() calls. */
export default function NotFound() {
  return (
    <ErrorState
      code="404"
      title="Page not found"
      message="The page you're looking for doesn't exist, or may have moved."
    >
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    </ErrorState>
  );
}
