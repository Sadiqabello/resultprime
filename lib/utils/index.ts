import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names, resolving conflicts. Used by all shadcn/ui components. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a person's full name from parts, skipping empty segments. */
export function formatName(
  parts: { firstName?: string | null; lastName?: string | null; otherNames?: string | null },
): string {
  return [parts.lastName, parts.firstName, parts.otherNames]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(" ");
}

/** Convert a class size + position into an ordinal string, e.g. 1 -> "1st". */
export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]!);
}

/** Make a URL/subdomain-safe slug from arbitrary text, e.g. "St. Mary's" -> "st-marys". */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
