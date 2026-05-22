import "server-only";
import { can, type AuthContext } from "@/lib/authz";
import { err, ok, type Result } from "@/lib/errors";
import { saveTraitsSchema, type SaveTraitsInput, type TraitCategory } from "./schema";
import { traitsRepository } from "./repository";

export interface TraitItem {
  name: string;
  category: TraitCategory;
}

const DEFAULTS: TraitItem[] = [
  { name: "Punctuality", category: "affective" },
  { name: "Neatness", category: "affective" },
  { name: "Politeness", category: "affective" },
  { name: "Handwriting", category: "psychomotor" },
  { name: "Sports", category: "psychomotor" },
];

export const traitsService = {
  /** Active traits, or sensible defaults a school can adopt. */
  async getConfig(ctx: AuthContext): Promise<Result<{ configured: boolean; traits: TraitItem[] }>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    const { data } = await traitsRepository.listActive(ctx.schoolId);
    const traits = (data ?? []).map((t) => ({ name: t.name as string, category: t.category as TraitCategory }));
    return ok(traits.length > 0 ? { configured: true, traits } : { configured: false, traits: DEFAULTS });
  },

  async save(ctx: AuthContext, input: SaveTraitsInput): Promise<Result<null>> {
    if (!ctx.schoolId) return err("FORBIDDEN", "No school context.");
    if (!can(ctx, "academics.manage")) return err("FORBIDDEN", "Not allowed.");
    const parsed = saveTraitsSchema.safeParse(input);
    if (!parsed.success) return err("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid traits.");
    // Reject duplicate names (case-insensitive) to match the unique index.
    const names = parsed.data.traits.map((t) => t.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) return err("VALIDATION", "Trait names must be unique.");
    const { error } = await traitsRepository.replace(ctx.schoolId, parsed.data.traits);
    if (error) return err("INTERNAL", error.message);
    return ok(null);
  },
};
