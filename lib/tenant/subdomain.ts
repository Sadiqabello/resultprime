/**
 * Resolve a tenant slug from the request Host (§4.4). Pure + framework-agnostic
 * so it's trivially unit-testable. The slug only *suggests* the tenant — the
 * authoritative tenant is always the JWT claim, and a mismatch is rejected
 * upstream. Works for both `greenfield.rps.com` and dev `greenfield.localhost:3000`.
 */

/** Subdomains that are never tenants (platform/infra). */
const RESERVED = new Set(["www", "app", "api", "admin", "mail", "static", "cdn"]);

const stripPort = (h: string) => h.split(":")[0]!.toLowerCase().trim();

export function parseSubdomain(host: string | null | undefined, rootDomain: string): string | null {
  if (!host || !rootDomain) return null;
  const h = stripPort(host);
  const root = stripPort(rootDomain);
  if (!h || !root) return null;

  // Apex or www → no tenant.
  if (h === root || h === `www.${root}`) return null;

  const suffix = `.${root}`;
  if (!h.endsWith(suffix)) return null;

  // Take the left-most label (ignore any deeper nesting).
  const label = h.slice(0, -suffix.length).split(".")[0]!;
  if (!label || RESERVED.has(label)) return null;

  // School slugs are lowercase alphanumerics + hyphens (see schools.slug).
  return /^[a-z0-9-]+$/.test(label) ? label : null;
}
