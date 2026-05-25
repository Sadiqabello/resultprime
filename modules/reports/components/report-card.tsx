import type { ReportCardView } from "../service";
import { ordinal } from "@/lib/utils";

/**
 * Print-styled term report card. Brand-tinted, A4-friendly. Renders a diagonal
 * "DRAFT" watermark when the result isn't published, and a QR + issue date when
 * it is (§11.6, §11.7). `qrSvg` is server-generated SVG markup.
 */
export function ReportCard({ view, qrSvg, verifyUrl }: { view: ReportCardView; qrSvg: string | null; verifyUrl: string | null }) {
  const accent = view.school.primaryColor || "#606c38";
  const initials = view.school.name.slice(0, 2).toUpperCase();

  return (
    <div className="relative mx-auto max-w-[820px] bg-white p-8 text-[13px] text-neutral-900 print:p-0">
      {!view.published ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <span className="rotate-[-28deg] select-none text-6xl font-extrabold uppercase tracking-widest text-red-500/10">
            Draft — Not Approved
          </span>
        </div>
      ) : null}

      {/* Header */}
      <header className="flex items-center gap-4 border-b-2 pb-4" style={{ borderColor: accent }}>
        {view.school.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={view.school.logoUrl} alt="" className="size-16 rounded object-contain" />
        ) : (
          <span
            className="flex size-16 items-center justify-center rounded text-xl font-bold text-white"
            style={{ backgroundColor: accent }}
          >
            {initials}
          </span>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold leading-tight" style={{ color: accent }}>
            {view.school.name}
          </h1>
          <p className="text-sm uppercase tracking-wide text-neutral-500">Terminal Report Card</p>
        </div>
        <div className="text-right text-xs text-neutral-600">
          <p>{view.sessionName}</p>
          <p className="font-medium">{view.termName} Term</p>
        </div>
      </header>

      {/* Student info */}
      <section className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1 text-sm sm:grid-cols-4">
        <Field label="Student" value={view.student.name} className="col-span-2" />
        <Field label="Admission No." value={view.student.admissionNo || "—"} />
        <Field label="Class" value={view.className} />
        <Field
          label="Average"
          value={view.summary.average == null ? "—" : `${view.summary.average}%`}
        />
        <Field
          label="Position"
          value={
            view.summary.classPosition == null
              ? "—"
              : `${ordinal(view.summary.classPosition)}${view.summary.classSize ? ` of ${view.summary.classSize}` : ""}`
          }
        />
        <Field label="Subjects" value={String(view.subjects.length)} />
        <Field
          label="Overall"
          value={view.summary.gradeOverall ?? (view.summary.average == null ? "—" : "")}
        />
        {view.attendance.total != null ? (
          <Field
            label="Attendance"
            value={`${view.attendance.present ?? 0} / ${view.attendance.total} days`}
          />
        ) : null}
      </section>

      {/* Subjects */}
      <table className="mt-5 w-full border-collapse text-[12px]">
        <thead>
          <tr className="text-left text-white" style={{ backgroundColor: accent }}>
            <th className="px-2 py-1.5 font-medium">Subject</th>
            <th className="px-2 py-1.5 text-right font-medium">CA</th>
            <th className="px-2 py-1.5 text-right font-medium">Exam</th>
            <th className="px-2 py-1.5 text-right font-medium">Total</th>
            <th className="px-2 py-1.5 text-center font-medium">Grade</th>
            <th className="px-2 py-1.5 text-center font-medium">Pos.</th>
            <th className="px-2 py-1.5 font-medium">Remark</th>
          </tr>
        </thead>
        <tbody>
          {view.subjects.length === 0 ? (
            <tr>
              <td colSpan={7} className="border px-2 py-6 text-center text-neutral-400">
                No results computed for this student.
              </td>
            </tr>
          ) : (
            view.subjects.map((s, i) => (
              <tr key={s.name + i} className="even:bg-neutral-50">
                <td className="border px-2 py-1.5">{s.name}</td>
                <td className="border px-2 py-1.5 text-right tabular-nums">{s.ca}</td>
                <td className="border px-2 py-1.5 text-right tabular-nums">{s.exam}</td>
                <td className="border px-2 py-1.5 text-right font-medium tabular-nums">{s.total}</td>
                <td className="border px-2 py-1.5 text-center font-semibold">{s.grade ?? "—"}</td>
                <td className="border px-2 py-1.5 text-center tabular-nums">
                  {s.position == null ? "—" : ordinal(s.position)}
                </td>
                <td className="border px-2 py-1.5 text-neutral-600">{s.remark ?? ""}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Traits / behaviour */}
      {view.traits.length > 0 ? (
        <section className="mt-5">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Behaviour &amp; skills</p>
          <div className="grid grid-cols-2 gap-x-8 text-[12px] sm:grid-cols-3">
            {view.traits.map((t) => (
              <div key={t.name} className="flex items-center justify-between border-b border-dotted border-neutral-200 py-0.5">
                <span className="capitalize">{t.name}</span>
                <span className="font-medium tabular-nums">{t.rating}/5</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Remarks */}
      <section className="mt-5 space-y-2 text-sm">
        <Remark label="Class teacher's remark" value={view.remarks.classTeacher} />
        <Remark label="Principal's remark" value={view.remarks.principal} />
      </section>

      {/* Footer */}
      <footer className="mt-8 flex items-end justify-between gap-6 border-t pt-4">
        <div className="flex items-end gap-8 text-xs text-neutral-500">
          <SignatureLine label="Class teacher" />
          <SignatureLine label="Principal" imageUrl={view.signatureUrl} />
        </div>
        {view.published && qrSvg ? (
          <div className="text-center text-[10px] text-neutral-500">
            <div
              className="mx-auto size-24"
              // QR is server-generated SVG, not user content.
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <p className="mt-1">Scan to verify</p>
            {verifyUrl ? <p className="break-all">{verifyUrl}</p> : null}
            {view.publishedAt ? <p>Issued {new Date(view.publishedAt).toLocaleDateString()}</p> : null}
          </div>
        ) : (
          <p className="text-[10px] text-neutral-400">Not yet published — not valid until released.</p>
        )}
      </footer>
    </div>
  );
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <span className="block text-[10px] uppercase tracking-wide text-neutral-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Remark({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex gap-2">
      <span className="shrink-0 font-medium text-neutral-500">{label}:</span>
      <span className="min-h-[1.2em] flex-1 border-b border-dotted border-neutral-300">{value ?? ""}</span>
    </div>
  );
}

function SignatureLine({ label, imageUrl }: { label: string; imageUrl?: string | null }) {
  return (
    <div>
      <div className="flex h-8 w-32 items-end justify-center border-b border-neutral-400">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="max-h-8 object-contain" />
        ) : null}
      </div>
      <span className="text-[10px]">{label}</span>
    </div>
  );
}
