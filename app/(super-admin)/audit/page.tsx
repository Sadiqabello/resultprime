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

export const metadata: Metadata = { title: "Platform Audit" };

export default async function PlatformAuditPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  const result = await platformService.listAudit(ctx, 100);
  const rows = result.ok ? result.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform Audit</h1>
        <p className="text-sm text-muted-foreground">
          Cross-tenant activity — sensitive actions across every school.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No audit activity recorded yet.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{r.schoolName}</TableCell>
                  <TableCell className="font-mono text-xs">{r.action}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.entityType ?? "—"}</TableCell>
                  <TableCell>{r.actorRole ? <Badge variant="outline">{r.actorRole}</Badge> : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
