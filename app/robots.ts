import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * Crawl rules. The public marketing/auth-entry pages are crawlable; the entire
 * authenticated app, parent/student portal, super-admin, print views and API are
 * blocked (they're private, per-tenant, or behind opaque IDs). Private areas are
 * ALSO marked `noindex` via metadata as a second layer — robots.txt only asks
 * crawlers not to fetch, it doesn't guarantee de-indexing.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/students",
        "/staff",
        "/classes",
        "/subjects",
        "/scores",
        "/results",
        "/annual",
        "/reports",
        "/approvals",
        "/notifications",
        "/settings",
        "/imports",
        "/fees",
        "/subscription",
        "/audit",
        "/billing",
        "/schools",
        "/portal",
        "/print",
        "/auth/",
        "/update-password",
        "/verify/",
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
