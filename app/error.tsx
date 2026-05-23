"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

/**
 * Runtime error boundary (≈ 500). Catches uncaught errors in any page/segment
 * below the root layout. `reset()` retries the failed render.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaces in the browser console + (in prod) wherever client logs are shipped.
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      code="500"
      title="Something went wrong"
      message="An unexpected error occurred on our end. You can try again, or head back home — your data is safe."
    >
      <Button onClick={reset}>Try again</Button>
      <Button asChild variant="outline">
        <Link href="/">Back to home</Link>
      </Button>
    </ErrorState>
  );
}
