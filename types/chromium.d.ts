/**
 * Minimal ambient declaration for the optional `@sparticuz/chromium` dependency.
 *
 * The package is only installed in the serverless deploy target (Vercel/Lambda)
 * and is loaded via a guarded dynamic import in `lib/pdf/index.ts`. This stub
 * lets `tsc` type-check locally where the package isn't present; when it IS
 * installed, its own bundled types take precedence.
 */
declare module "@sparticuz/chromium" {
  interface Viewport {
    width: number;
    height: number;
    deviceScaleFactor?: number;
  }
  const chromium: {
    readonly args: string[];
    readonly defaultViewport: Viewport | null;
    executablePath(input?: string): Promise<string>;
    readonly headless: boolean;
  };
  export default chromium;
}
