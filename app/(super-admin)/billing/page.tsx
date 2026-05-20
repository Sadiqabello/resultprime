import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/modules/auth/service";
import { platformService } from "@/modules/platform/service";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  const result = await platformService.listSchools(ctx);
  const schools = result.ok ? result.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Subscription overview per tenant. Payment integration (Paystack/Stripe) is Phase 6 —
          for now, tier and trial state are tracked on each school.
        </p>
      </div>

      {schools.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No schools yet.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trial ends</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schools.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="capitalize">{s.tier ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === "active" ? "success" : "secondary"} className="capitalize">
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.trialEndsAt ? new Date(s.trialEndsAt).toLocaleDateString() : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
