/**
 * PDF rendering pipeline (§11). Strategy: render a print-styled HTML route to
 * PDF with headless Chromium in a background worker — reuses the component
 * system and supports branding / QR / watermark.
 *
 * This is a stub. Implementation options:
 *   - puppeteer-core + @sparticuz/chromium  (serverless-friendly)
 *   - a dedicated container running full Chromium for batch jobs
 *
 * Keep generation OUT of request handlers for batches; enqueue a job and serve
 * the result from Supabase Storage via a short-lived signed URL.
 */
export interface RenderPdfOptions {
  /** Absolute URL of the print-styled page to render. */
  url: string;
  /** Watermark text for drafts, e.g. "DRAFT — NOT APPROVED". Omit for published. */
  watermark?: string;
  format?: "A4" | "Letter";
  landscape?: boolean;
}

export async function renderHtmlToPdf(_opts: RenderPdfOptions): Promise<Buffer> {
  // TODO: launch headless Chromium, navigate, page.pdf(...)
  throw new Error("renderHtmlToPdf not implemented — see §11 of the plan");
}
