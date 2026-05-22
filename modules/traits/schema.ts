import { z } from "zod";
import { nonEmptyString } from "@/lib/validation";

export const TRAIT_CATEGORIES = ["affective", "psychomotor"] as const;
export type TraitCategory = (typeof TRAIT_CATEGORIES)[number];

export const traitSchema = z.object({
  name: nonEmptyString.max(60),
  category: z.enum(TRAIT_CATEGORIES),
});
export const saveTraitsSchema = z.object({
  traits: z.array(traitSchema).max(40),
});
export type SaveTraitsInput = z.infer<typeof saveTraitsSchema>;
