"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Triggers the browser's native print dialog (→ Save as PDF). */
export function PrintButton() {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()}>
      <Printer className="size-4" /> Print / Save as PDF
    </Button>
  );
}
