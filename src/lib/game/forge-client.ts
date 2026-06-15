import { supabase } from "@/integrations/supabase/client";

export type RecipeIngredient = { name: string; qty: number };
export type Recipe = {
  id: string;
  name: string;
  equipment_id: string;
  ingredients: RecipeIngredient[];
  unlock_condition: { level?: number; floor?: number };
  base_gold_cost: number;
  sort_order: number;
  equipment?: {
    name: string;
    slot: string;
    str_bonus: number;
    int_bonus: number;
    con_bonus: number;
    per_bonus: number;
    rarity: string;
  };
};
export type CraftQuality = "standard" | "refined" | "masterwork";

const QUALITY_GOLD_MULT: Record<CraftQuality, number> = {
  standard: 1,
  refined: 3,
  masterwork: 9,
};

const MASTERWORK_AFFIXES = [
  { key: "gold_str_bonus", text: "+5% gold from STR tasks" },
  { key: "xp_int_bonus", text: "+5% XP from INT tasks" },
  { key: "hp_recover", text: "Restores 5 HP on streak day" },
  { key: "stamina_regen", text: "Stamina regen 1 per 9 min" },
];

export async function listRecipes(): Promise<{ recipes: Recipe[] }> {
  const { data, error } = await supabase
    .from("recipes")
    .select("*, equipment(name, slot, str_bonus, int_bonus, con_bonus, per_bonus, rarity)")
    .order("sort_order");
  if (error) throw error;
  return { recipes: (data ?? []) as Recipe[] };
}

export async function craft(
  recipeId: string,
  quality: CraftQuality,
): Promise<{
  newEquipmentId: string;
  quality: CraftQuality;
  affix: { key: string; text: string } | null;
  itemName: string;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: recipe } = await supabase
    .from("recipes")
    .select("*, equipment(name)")
    .eq("id", recipeId)
    .single();
  if (!recipe) throw new Error("Recipe not found.");

  // Call the server authoritative RPC to perform the craft and get results
  const { data: result, error } = await supabase.rpc("craft_recipe", { p_recipe_id: recipeId });
  if (error) throw error;

  // Find the matching affix text
  let affixData = null;
  if (result.affix) {
    const found = MASTERWORK_AFFIXES.find((a) => a.key === result.affix);
    if (found) {
      affixData = found;
    } else {
      affixData = { key: result.affix, text: `Enhancement: ${result.affix}` };
    }
  }

  // The RPC should have already inserted into crafts and user_equipment, and decremented resources.

  return {
    newEquipmentId: result.id,
    quality: result.quality as CraftQuality,
    affix: affixData,
    itemName: (recipe.equipment as { name: string } | null)?.name ?? "Mystery Gear",
  };
}
