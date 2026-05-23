"use client";

import { useState, useTransition } from "react";
import { useActionToast } from "@/components/ui/use-action-toast";

import { saveClassAssignment } from "../actions";
import type { AssignmentSubject, TeacherOption } from "../service";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SELECT =
  "h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50";

export function AssignmentEditor({
  classId,
  subjects,
  teachers,
}: {
  classId: string;
  subjects: AssignmentSubject[];
  teachers: TeacherOption[];
}) {
  const [rows, setRows] = useState(subjects.map((s) => ({ ...s })));
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ ok: true } | { error: string } | null>(null);
  useActionToast(status, "Assignments saved");

  const set = (subjectId: string, patch: Partial<AssignmentSubject>) =>
    setRows((rs) => rs.map((r) => (r.subjectId === subjectId ? { ...r, ...patch } : r)));

  const offeredCount = rows.filter((r) => r.offered).length;

  function save() {
    setStatus(null);
    startTransition(async () => {
      const res = await saveClassAssignment({
        classId,
        items: rows.map((r) => ({
          subjectId: r.subjectId,
          offered: r.offered,
          teacherId: r.offered ? r.teacherId : null,
        })),
      });
      setStatus(res.ok ? { ok: true } : { error: res.error });
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Offer</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="w-64">Teacher</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.subjectId} className={r.offered ? "" : "opacity-60"}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={r.offered}
                    onChange={(e) => set(r.subjectId, { offered: e.target.checked })}
                    className="size-4 accent-brand-600"
                    aria-label={`Offer ${r.name}`}
                  />
                </TableCell>
                <TableCell>
                  <span className="font-medium">{r.name}</span>{" "}
                  <span className="font-mono text-xs text-muted-foreground">{r.code}</span>
                </TableCell>
                <TableCell>
                  <select
                    className={SELECT}
                    value={r.teacherId ?? ""}
                    disabled={!r.offered}
                    onChange={(e) => set(r.subjectId, { teacherId: e.target.value || null })}
                  >
                    <option value="">— Unassigned —</option>
                    {teachers.map((t) => (
                      <option key={t.userId} value={t.userId}>
                        {t.fullName}
                      </option>
                    ))}
                  </select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save assignment"}
        </Button>
        <span className="text-sm text-muted-foreground">{offeredCount} subject(s) offered</span>
        {status && "error" in status ? (
          <span className="text-sm text-destructive">{status.error}</span>
        ) : null}
      </div>

      {teachers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No teachers with a login yet — you can offer subjects now and assign teachers
          once they&apos;re invited on the Staff page.
        </p>
      ) : null}
    </div>
  );
}
