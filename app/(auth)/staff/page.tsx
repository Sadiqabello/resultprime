import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/modules/auth/service";
import { staffService } from "@/modules/staff/service";
import Link from "next/link";
import { deleteStaff } from "@/modules/staff/actions";
import { AddStaffForm } from "@/modules/staff/components/add-staff-form";
import { can } from "@/lib/authz";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Staff" };

export default async function StaffPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  if (!can(ctx, "staff.read")) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>No access</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You don&apos;t have permission to view staff.
        </CardContent>
      </Card>
    );
  }

  const canManage = can(ctx, "staff.write");
  const result = await staffService.list(ctx);
  const staff = result.ok ? result.data : [];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
        <p className="text-sm text-muted-foreground">
          Teachers and administrators. Add an email to send a login invite with a
          role — invited teachers can then be assigned to subjects.
        </p>
      </div>

      {canManage ? <AddStaffForm /> : null}

      {staff.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No staff yet{canManage ? " — add your first staff member above." : "."}
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Staff No.</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Login</TableHead>
                {canManage ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <span className="font-medium">{s.fullName}</span>
                    {s.isTeaching ? (
                      <Badge variant="secondary" className="ml-2">
                        Teaching
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{s.staffNo}</TableCell>
                  <TableCell>
                    {s.roleLabels.length ? (
                      <span className="flex flex-wrap gap-1">
                        {s.roleLabels.map((r) => (
                          <Badge key={r} variant="outline">
                            {r}
                          </Badge>
                        ))}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {s.hasLogin ? (
                      <Badge variant="success">Invited</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">No login</span>
                    )}
                  </TableCell>
                  {canManage ? (
                    <TableCell className="text-right">
                      <span className="flex items-center justify-end gap-3">
                        <Link href={`/staff/${s.id}`} className="text-sm font-medium text-primary hover:underline">Edit</Link>
                        <form action={deleteStaff}>
                          <input type="hidden" name="id" value={s.id} />
                          <button type="submit" className="text-sm font-medium text-destructive hover:underline">Remove</button>
                        </form>
                      </span>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
