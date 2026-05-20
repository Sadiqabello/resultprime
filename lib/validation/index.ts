import { z } from "zod";

/** Shared Zod primitives reused across module schemas. */

export const uuid = z.string().uuid();

export const scoreValue = z
  .number({ invalid_type_error: "Score must be a number" })
  .min(0, "Score cannot be negative");

/** A score bounded by a component max (use `.refine` per component at call site). */
export const boundedScore = (max: number) =>
  scoreValue.max(max, `Score cannot exceed ${max}`);

export const nonEmptyString = z.string().trim().min(1, "Required");

export const optionalString = z
  .string()
  .trim()
  .optional()
  .or(z.literal("").transform(() => undefined));

export const paginationInput = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(25),
});

/** Parse helper returning the typed Result instead of throwing. */
export function safeParse<T extends z.ZodTypeAny>(schema: T, input: unknown) {
  const r = schema.safeParse(input);
  return r.success
    ? ({ ok: true as const, data: r.data as z.infer<T> })
    : ({ ok: false as const, issues: r.error.issues });
}
