import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Result Prime",
  description: "How Result Prime collects, uses, and protects personal data, including students' data.",
};

const UPDATED = "24 May 2026";

/**
 * TEMPLATE privacy policy — covers the actual data flows (multi-tenant school
 * data, minors' records, payments via Paystack, email/SMS delivery). Review and
 * adapt with legal counsel for your jurisdiction (Nigeria: NDPR) before launch.
 */
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-primary hover:underline">← Back home</Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-1 text-sm text-muted-foreground">Last updated: {UPDATED}</p>

      <div className="prose prose-sm mt-8 max-w-none space-y-6 text-foreground/90 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:leading-relaxed">
        <p>
          Result Prime (&ldquo;we&rdquo;, &ldquo;the platform&rdquo;) provides result-processing software to
          schools (&ldquo;the school&rdquo;). This policy explains what personal data we process and why. For
          student and staff records, <strong>the school is the data controller</strong> and Result Prime is a
          data processor acting on the school&rsquo;s instructions.
        </p>

        <h2>Data we process</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Account data:</strong> name, email, phone, role, and authentication identifiers.</li>
          <li><strong>Student records:</strong> admission number, name, class/enrolment, scores, results, attendance, and behavioural traits — including data about minors, provided by the school.</li>
          <li><strong>Guardian data:</strong> name and contact details, linked to their children.</li>
          <li><strong>Billing data:</strong> subscription status and payment references. Card details are handled by our payment processor (Paystack); we never store card numbers.</li>
          <li><strong>Operational data:</strong> audit logs, security/access logs, and limited diagnostics.</li>
        </ul>

        <h2>How we use it</h2>
        <p>
          To operate the service: authentication, computing and publishing results, generating report cards,
          sending result/billing notifications (email, SMS, WhatsApp), processing subscription payments, and
          maintaining security and audit trails. We do not sell personal data or use it for advertising.
        </p>

        <h2>Legal basis &amp; minors</h2>
        <p>
          Student data is processed to deliver the educational service the school has contracted, under the
          school&rsquo;s authority and consent obtained from parents/guardians by the school. Where the NDPR (or
          your local law) applies, the school is responsible for the lawful basis and parental consent for
          processing children&rsquo;s data; we act on the school&rsquo;s documented instructions.
        </p>

        <h2>Sharing &amp; sub-processors</h2>
        <p>We share data only with infrastructure providers needed to run the service:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Supabase</strong> — database, authentication, and file storage.</li>
          <li><strong>Paystack</strong> — payment processing.</li>
          <li><strong>Resend</strong> — transactional email; <strong>Twilio</strong> — SMS/WhatsApp (if enabled).</li>
          <li>Hosting and error-monitoring providers for the application.</li>
        </ul>

        <h2>Tenant isolation &amp; security</h2>
        <p>
          Each school&rsquo;s data is isolated at the database level (row-level security keyed to the school).
          Access is role-based; sensitive actions are audited; data is encrypted in transit. Consumers
          (students/parents) can only see their own published results.
        </p>

        <h2>Retention</h2>
        <p>
          We retain school and student records for as long as the school&rsquo;s account is active and as needed
          to provide the service or meet legal/record-keeping obligations. On account termination, data is
          deleted or returned per the school agreement.
        </p>

        <h2>Your rights</h2>
        <p>
          Students, guardians, and staff may exercise access, correction, and deletion rights through their
          school, which manages the records. Contact your school&rsquo;s administrator, or us at the address
          below, and we will assist the controller in responding.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy or data handling: <strong>privacy@yourdomain.com</strong>. Update this
          address before launch.
        </p>

        <p className="rounded-md border border-dashed border-border bg-muted/40 p-4 text-xs text-muted-foreground">
          This is a starting template reflecting the platform&rsquo;s actual data flows. Have it reviewed by
          legal counsel and tailored to your jurisdiction (e.g. Nigeria&rsquo;s NDPR) before going live.
        </p>
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        See also our <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>.
      </p>
    </main>
  );
}
