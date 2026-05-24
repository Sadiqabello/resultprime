import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Result Prime",
  description: "The terms governing use of the Result Prime result-processing platform.",
};

const UPDATED = "24 May 2026";

/**
 * TEMPLATE terms of service. Review and adapt with legal counsel (governing law,
 * liability caps, refund terms, SLA) before launch.
 */
export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-primary hover:underline">← Back home</Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-1 text-sm text-muted-foreground">Last updated: {UPDATED}</p>

      <div className="prose prose-sm mt-8 max-w-none space-y-6 text-foreground/90 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:leading-relaxed">
        <h2>1. Agreement</h2>
        <p>
          These terms govern use of Result Prime (&ldquo;the service&rdquo;) by schools and their authorised
          users. By creating an account or using the service, the school agrees to these terms.
        </p>

        <h2>2. Accounts &amp; access</h2>
        <p>
          The school is responsible for its users (administrators, staff, students, guardians), for keeping
          credentials secure, and for ensuring it has the right and parental consent to upload student data.
          Roles and permissions are managed by the school.
        </p>

        <h2>3. Acceptable use</h2>
        <p>
          Do not misuse the service: no unlawful content, no attempts to breach tenant isolation or access
          other schools&rsquo; data, no interference with availability, and no uploading of data you are not
          authorised to process.
        </p>

        <h2>4. Subscriptions &amp; payment</h2>
        <p>
          Paid plans are billed per the selected plan via our payment processor (Paystack). Access may move to
          read-only and then locked after a trial or subscription lapses, subject to the grace period shown in
          the app. Set out your refund and cancellation terms here.
        </p>

        <h2>5. Data &amp; privacy</h2>
        <p>
          Our handling of personal data is described in the{" "}
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. The school is
          the controller of its student and staff records; Result Prime processes them to provide the service.
        </p>

        <h2>6. Availability</h2>
        <p>
          We aim for high availability but do not guarantee uninterrupted service. Maintenance and incidents
          may cause downtime. Define any SLA commitments here.
        </p>

        <h2>7. Intellectual property</h2>
        <p>
          The platform, its software and branding are owned by Result Prime. The school retains ownership of
          its own data; we are granted the limited rights needed to operate the service.
        </p>

        <h2>8. Liability</h2>
        <p>
          The service is provided &ldquo;as is&rdquo;. To the extent permitted by law, our liability is
          limited as set out here (insert liability cap and exclusions reviewed by counsel).
        </p>

        <h2>9. Termination</h2>
        <p>
          Either party may terminate per the school agreement. On termination, the school&rsquo;s data is
          deleted or returned as described in the Privacy Policy.
        </p>

        <h2>10. Governing law &amp; contact</h2>
        <p>
          These terms are governed by the laws of [your jurisdiction]. Contact:{" "}
          <strong>legal@yourdomain.com</strong>. Update governing law and contact before launch.
        </p>

        <p className="rounded-md border border-dashed border-border bg-muted/40 p-4 text-xs text-muted-foreground">
          Template only — have these terms reviewed and completed by legal counsel (governing law, liability,
          refunds, SLA) before going live.
        </p>
      </div>
    </main>
  );
}
