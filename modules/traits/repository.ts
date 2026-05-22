import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SaveTraitsInput } from "./schema";

/** Trait-definition data access. Writes RLS-gated to can_manage_academics. */
export const traitsRepository = {
  async listActive(schoolId: string) {
    const sb = await createClient();
    return sb
      .from("trait_definitions")
      .select("id, name, category, sort_order, is_active")
      .eq("school_id", schoolId)
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });
  },

  /** Replace the school's trait set wholesale (small, edited as a unit). */
  async replace(schoolId: string, traits: SaveTraitsInput["traits"]) {
    const sb = await createClient();
    await sb.from("trait_definitions").delete().eq("school_id", schoolId);
    if (traits.length === 0) return { error: null };
    return sb.from("trait_definitions").insert(
      traits.map((t, i) => ({ school_id: schoolId, name: t.name, category: t.category, sort_order: i, is_active: true })),
    );
  },
};
