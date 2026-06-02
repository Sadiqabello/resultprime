import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * Public, indexable URLs only. Authenticated, per-tenant and ID-gated routes are
 * intentionally excluded (they're also blocked in robots.ts and marked noindex).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const entries: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/signup", priority: 0.8, changeFrequency: "monthly" },
    { path: "/login", priority: 0.5, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  ];
  return entries.map(({ path, priority, changeFrequency }) => ({
    url: `${siteConfig.url}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
