import "server-only";
import puppeteer, { type Browser } from "puppeteer-core";

/**
 * PDF rendering pipeline (§11). Strategy: drive headless Chromium to a
 * print-styled Next.js route (e.g. /print/report/[id]) and capture page.pdf() —
 * this reuses the app's component system + Tailwind, so branding, the draft
 * watermark, and the QR all render exactly as on screen.
 *
 * Browser binary resolution (in order):
 *   1. serverless (Vercel/Lambda)             — bundled `@sparticuz/chromium`
 *   2. PUPPETEER_EXECUTABLE_PATH               — explicit override (CI / containers)
 *   3. platform default Chrome path            — local dev / a container with Chrome
 *
 * On Vercel/Lambda the function runtime has no system Chrome, so we lazy-load
 * `@sparticuz/chromium` (an optionalDependency) and use its binary + args. The
 * import is dynamic and guarded by an env check, so local/container builds never
 * need the package present. Chromium is heavy; for whole-class batches, run this
 * in a background job and serve the result from Storage via a signed URL rather
 * than rendering inside a request (§11.1 / §16.1).
 */
export interface RenderPdfOptions {
  /** Absolute URL of the print-styled page to render. */
  url: string;
  /** Session cookies to forward so an authenticated page renders for the user. */
  cookies?: { name: string; value: string }[];
  format?: "A4" | "Letter";
  landscape?: boolean;
}

function resolveExecutablePath(): string {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  switch (process.platform) {
    case "darwin":
      return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    case "win32":
      return "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    default:
      return "/usr/bin/google-chrome"; // most Linux containers / self-hosted
  }
}

/** True on Vercel functions or AWS Lambda, where there is no system Chrome. */
function isServerless(): boolean {
  return Boolean(
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_EXECUTION_ENV,
  );
}

async function launchBrowser(): Promise<Browser> {
  if (isServerless()) {
    // Lazy, guarded import: the package is only resolved/needed in serverless.
    // `webpackIgnore` keeps the bundler from resolving it at build time, so a
    // build never requires this optionalDependency to be installed (it only is
    // on the serverless target). Keep its version in step with puppeteer-core's
    // bundled Chrome.
    const chromium = (await import(/* webpackIgnore: true */ "@sparticuz/chromium")).default;
    return puppeteer.launch({
      executablePath: await chromium.executablePath(),
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      headless: true,
    });
  }
  return puppeteer.launch({
    executablePath: resolveExecutablePath(),
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
}

export async function renderHtmlToPdf(opts: RenderPdfOptions): Promise<Buffer> {
  const browser: Browser = await launchBrowser();

  try {
    const page = await browser.newPage();

    if (opts.cookies?.length) {
      const origin = new URL(opts.url).origin;
      await page.setCookie(
        ...opts.cookies.map((c) => ({ name: c.name, value: c.value, url: origin })),
      );
    }

    await page.goto(opts.url, { waitUntil: "networkidle0", timeout: 30_000 });

    // page.pdf() emulates `print` media, so the template's print: classes apply.
    const bytes = await page.pdf({
      format: opts.format ?? "A4",
      landscape: opts.landscape ?? false,
      printBackground: true,
      margin: { top: "12mm", bottom: "12mm", left: "10mm", right: "10mm" },
    });

    return Buffer.from(bytes);
  } finally {
    await browser.close();
  }
}
