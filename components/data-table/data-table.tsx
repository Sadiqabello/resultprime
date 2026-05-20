/**
 * Reusable DataTable (§10.2) — the single table powering students, staff,
 * scores, broadsheet, etc. Stub. Recommended implementation: @tanstack/react-table
 * with server-side sort/filter and KEYSET pagination (never load full rosters
 * client-side, §10.4). Build column defs per feature and pass rows in.
 */
export interface DataTableProps<TRow> {
  rows: TRow[];
  // columns, pagination, onSort, onFilter, selection, bulk actions...
}

export function DataTable<TRow>({ rows }: DataTableProps<TRow>) {
  return (
    <div className="rounded-md border p-4 text-sm text-muted-foreground">
      DataTable stub — {rows.length} row(s). Wire up @tanstack/react-table with
      server-side pagination.
    </div>
  );
}
