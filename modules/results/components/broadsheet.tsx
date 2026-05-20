import Link from "next/link";
import type { BroadsheetView } from "../service";
import { ordinal } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Read-only class × subjects matrix. Server component. */
export function Broadsheet({ view }: { view: BroadsheetView }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 min-w-44 bg-card">Student</TableHead>
            {view.subjects.map((s) => (
              <TableHead key={s.subjectId} className="text-right">
                {s.name}
              </TableHead>
            ))}
            <TableHead className="text-right">Avg</TableHead>
            <TableHead className="text-right">Pos</TableHead>
            <TableHead className="text-right">Card</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {view.rows.map((r) => (
            <TableRow key={r.enrollmentId}>
              <TableCell className="sticky left-0 z-10 bg-card">
                <span className="font-medium">{r.name}</span>
                <span className="ml-2 font-mono text-xs text-muted-foreground">{r.admissionNo}</span>
              </TableCell>
              {view.subjects.map((s) => {
                const cell = r.totals[s.subjectId];
                return (
                  <TableCell key={s.subjectId} className="text-right tabular-nums">
                    {cell ? (
                      <span>
                        {cell.total}
                        {cell.grade ? (
                          <span className="ml-1 text-xs font-medium text-brand-600">{cell.grade}</span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </TableCell>
                );
              })}
              <TableCell className="text-right font-medium tabular-nums">
                {r.average == null ? "–" : r.average}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {r.position == null ? "–" : ordinal(r.position)}
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/print/report/${r.enrollmentId}`}
                  target="_blank"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Report
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
