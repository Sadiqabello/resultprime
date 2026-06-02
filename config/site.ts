/**
 * Single source of truth for site-level SEO metadata — consumed by the root
 * layout, robots.ts, sitemap.ts, manifest.ts and the landing-page JSON-LD.
 *
 * `url` is the canonical production origin. It comes from NEXT_PUBLIC_APP_URL
 * (validated in config/env.ts) so social-card, canonical and sitemap URLs are
 * absolute; the localhost fallback only applies in a misconfigured/local build.
 */
const rawUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const siteConfig = {
  name: "Result Prime",
  shortName: "Result Prime",
  slogan: "Results, at their prime.",
  /** Canonical origin, no trailing slash. */
  url: rawUrl.replace(/\/+$/, ""),
  title: "Result Prime — Results, at their prime",
  description:
    "Result Prime turns raw scores into audited, ranked, branded and QR-verified report cards for primary & secondary schools — computed the same way every time, and locked on approval.",
  /** Open Graph locale (English, Nigeria). */
  locale: "en_NG",
  email: "hello@resultprime.com",
  keywords: [
    "result processing software",
    "school report card software",
    "report card generator",
    "broadsheet",
    "student results",
    "exam results management",
    "school management software",
    "primary school software",
    "secondary school software",
    "Nigeria schools",
    "African schools",
    "QR-verified report cards",
    "NDPR compliant",
  ],
} as const;

export type SiteConfig = typeof siteConfig;
