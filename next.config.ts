import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Security headers applied to every route. CSP is intentionally conservative;
  // tighten/loosen as you add third-party scripts (analytics, payment widgets).
  async headers() {
    // Content-Security-Policy (§9.4). Next.js injects inline styles/scripts, so
    // 'unsafe-inline' is required; 'unsafe-eval' only in dev (HMR). Allow Supabase
    // (REST + realtime ws) and arbitrary https images (school logos/signatures).
    const dev = process.env.NODE_ENV !== "production";
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  images: {
    // Supabase Storage public bucket host — replace <project-ref> or set via env.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
