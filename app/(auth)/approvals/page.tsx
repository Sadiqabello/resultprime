import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/modules/auth/service";
import { approvalsService } from "@/modules/approvals/service";
import { submitClass, approveClass, publishClass, returnClass } from "@/modules/approvals/actions";
import { can } from "@/lib/authz";
import type { ApprovalState } from "@/config/constants";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Approvals" };

const STATE_META: Record<ApprovalState, { label: string; variant: "outline" | "secondary" | "success" | "warning" }> = {
  draft: { label: "Draft", variant: "outline" },
  returned: { label: "Returned", variant: "warning" },
  submitted: { label: "Submitted", variant: "secondary" },
  l1_approved: { label: "L1 approved", variant: "secondary" },
  approved: { label: "Approved", variant: "secondary" },
  published: { label: "Published", variant: "success" },
};

function ActionButton({
  action,
  classId,
  label,
  variant = "default",
  confirm,
}: {
  action: (formData: FormData) => void | Promise<void>;
  classId: string;
  label: string;
  variant?: "default" | "outline";
  /** When set, the action runs only after an "are you sure?" confirmation. */
  confirm?: { title: string; description: React.ReactNode; confirmLabel: string; destructive?: boolean; successMessage?: string };
}) {
  if (confirm) {
    return (
      <ConfirmSubmit
        action={action}
        fields={{ classId }}
        title={confirm.title}
        description={confirm.description}
        confirmLabel={confirm.confirmLabel}
        destructive={confirm.destructive ?? false}
        successMessage={confirm.successMessage}
        triggerClassName={buttonVariants({ variant, size: "sm" })}
        triggerAriaLabel={label}
      >
        {label}
      </ConfirmSubmit>
    );
  }
  return (
    <form action={action}>
      <input type="hidden" name="classId" value={classId} />
      <Button type="submit" size="sm" variant={variant}>
        {label}
      </Button>
    </form>
  );
}

export default async function ApprovalsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  if (!can(ctx, "results.read")) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>No access</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You don&apos;t have permission to view approvals.
        </CardContent>
      </Card>
    );
  }

  const canSubmit = can(ctx, "results.submit");
  const canApprove = can(ctx, "results.approve");
  const canPublish = can(ctx, "results.publish");

  const result = await approvalsService.getClassApprovals(ctx);
  const { termName, classes } = result.ok ? result.data : { termName: null, classes: [] };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
          <p className="text-sm text-muted-foreground">
            Submit → approve → publish. Submitting locks the class&apos;s score sheets;
            publishing releases results to parents.
          </p>
        </div>
        {termName ? <Badge variant="secondary" className="h-7 px-3">{termName} Term</Badge> : null}
      </div>

      {!termName ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No active term. Set a current term in{" "}
          <Link href="/settings" className="text-primary hover:underline">Settings</Link>.
        </p>
      ) : classes.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No classes yet.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c) => {
                const meta = STATE_META[c.state];
                return (
                  <TableRow key={c.classId}>
                    <TableCell className="font-medium">{c.label}</TableCell>
                    <TableCell>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      {!c.computed ? (
                        <span className="ml-2 text-xs text-muted-foreground">not computed</span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {(c.state === "draft" || c.state === "returned") && canSubmit ? (
                          c.computed ? (
                            <ActionButton action={submitClass} classId={c.classId} label="Submit" />
                          ) : (
                            <Button size="sm" disabled title="Compute results first">
                              Submit
                            </Button>
                          )
                        ) : null}

                        {(c.state === "submitted" || c.state === "l1_approved") && canApprove ? (
                          <>
                            <ActionButton action={approveClass} classId={c.classId} label="Approve" />
                            <ActionButton
                              action={returnClass}
                              classId={c.classId}
                              label="Return"
                              variant="outline"
                              confirm={{
                                title: "Return for edits?",
                                description: <>This sends <strong>{c.label}</strong> back to the teacher. Scores unlock for editing, and it must be re-submitted and re-approved before publishing.</>,
                                confirmLabel: "Return",
                                destructive: true,
                                successMessage: "Returned for edits",
                              }}
                            />
                          </>
                        ) : null}

                        {c.state === "approved" ? (
                          <>
                            {canPublish ? (
                              <ActionButton
                                action={publishClass}
                                classId={c.classId}
                                label="Publish"
                                confirm={{
                                  title: "Publish results?",
                                  description: <>This releases <strong>{c.label}</strong>&apos;s results to parents and students and locks them. Parents are notified, and report cards become QR-verifiable. Re-opening afterwards is recorded.</>,
                                  confirmLabel: "Publish results",
                                  successMessage: "Results published",
                                }}
                              />
                            ) : null}
                            {canApprove ? (
                              <ActionButton
                                action={returnClass}
                                classId={c.classId}
                                label="Return"
                                variant="outline"
                                confirm={{
                                  title: "Return for edits?",
                                  description: <>This reverses the approval of <strong>{c.label}</strong> and reopens scores for editing. It must be re-approved before it can be published.</>,
                                  confirmLabel: "Return",
                                  destructive: true,
                                  successMessage: "Returned for edits",
                                }}
                              />
                            ) : null}
                          </>
                        ) : null}

                        {c.state === "published" ? (
                          <span className="text-sm text-brand-600">Released to parents</span>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
