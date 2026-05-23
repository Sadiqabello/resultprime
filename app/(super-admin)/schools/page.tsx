import type { Metadata } from "next";
import { getAuthContext } from "@/modules/auth/service";
import { redirect } from "next/navigation";
import { platformService } from "@/modules/platform/service";
import { setSchoolStatus } from "@/modules/platform/actions";
import { CreateSchoolForm } from "@/modules/platform/components/create-school-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Schools" };

const STATUS_VARIANT: Record<string, "secondary" | "success" | "warning" | "outline"> = {
  trial: "warning",
  active: "success",
  suspended: "outline",
  cancelled: "outline",
};

export default async function SchoolsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  const result = await platformService.listSchools(ctx);
  const schools = result.ok ? result.data : [];

  const counts = schools.reduce(
    (acc, s) => ({ ...acc, [s.status]: (acc[s.status] ?? 0) + 1 }),
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Schools</h1>
        <p className="text-sm text-muted-foreground">Onboard, suspend, and monitor every tenant.</p>
      </div>

      {/* Platform stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total" value={schools.length} />
        <Stat label="Active" value={counts.active ?? 0} />
        <Stat label="Trial" value={counts.trial ?? 0} />
        <Stat label="Suspended" value={counts.suspended ?? 0} />
      </div>

      <CreateSchoolForm />

      {schools.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No schools yet. Create the first one above.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schools.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{s.slug}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[s.status] ?? "secondary"} className="capitalize">
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <ConfirmSubmit
                      action={setSchoolStatus}
                      fields={{ id: s.id, status: s.status === "suspended" ? "active" : "suspended" }}
                      title={s.status === "suspended" ? "Reactivate this school?" : "Suspend this school?"}
                      description={
                        s.status === "suspended" ? (
                          <>This restores sign-in access for <strong>{s.name}</strong>.</>
                        ) : (
                          <>This blocks <strong>{s.name}</strong>&apos;s staff, students and parents from signing in until you reactivate it.</>
                        )
                      }
                      confirmLabel={s.status === "suspended" ? "Reactivate" : "Suspend school"}
                      successMessage={s.status === "suspended" ? "School reactivated" : "School suspended"}
                      destructive={s.status !== "suspended"}
                      triggerClassName={buttonVariants({ variant: "outline", size: "sm" })}
                      triggerAriaLabel={`${s.status === "suspended" ? "Reactivate" : "Suspend"} ${s.name}`}
                    >
                      {s.status === "suspended" ? "Reactivate" : "Suspend"}
                    </ConfirmSubmit>
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
