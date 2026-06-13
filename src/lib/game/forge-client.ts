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

  // Profile gold check
  const { data: profile } = await supabase
    .from("profiles")
    .select("gold, level")
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("Profile missing.");
  const condLevel = (recipe.unlock_condition as { level?: number }).level ?? 0;
  if (profile.level < condLevel) throw new Error(`Recipe unlocks at Level ${condLevel}.`);

  const goldCost = recipe.base_gold_cost * QUALITY_GOLD_MULT[quality];
  if (profile.gold < goldCost) throw new Error(`Need ${goldCost} Gold, have ${profile.gold}.`);

  // Inventory check + consume
  const ingredients = recipe.ingredients as RecipeIngredient[];
  for (const ing of ingredients) {
    const { data: inv } = await supabase
      .from("inventory")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("item_name", ing.name)
      .maybeSingle();
    if (!inv || inv.quantity < ing.qty) {
      throw new Error(`Need ${ing.qty} ${ing.name} — have ${inv?.quantity ?? 0}.`);
    }
  }
  // All good: consume
  for (const ing of ingredients) {
    const { data: inv } = await supabase
      .from("inventory")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("item_name", ing.name)
      .maybeSingle();
    if (!inv) continue;
    const remaining = inv.quantity - ing.qty;
    if (remaining <= 0) await supabase.from("inventory").delete().eq("id", inv.id);
    else await supabase.from("inventory").update({ quantity: remaining }).eq("id", inv.id);
  }
  // Pay gold
  await supabase
    .from("profiles")
    .update({ gold: profile.gold - goldCost })
    .eq("id", user.id);

  // Masterwork affix roll
  const affix =
    quality === "masterwork"
      ? MASTERWORK_AFFIXES[Math.floor(Math.random() * MASTERWORK_AFFIXES.length)]
      : null;

  // Create user_equipment row
  const { data: ue, error: ueErr } = await supabase
    .from("user_equipment")
    .insert({
      user_id: user.id,
      equipment_id: recipe.equipment_id,
      quality,
      affix: affix ? affix : null,
    })
    .select()
    .single();
  if (ueErr) throw ueErr;

  // Log craft
  await supabase.from("crafts").insert({
    user_id: user.id,
    recipe_id: recipeId,
    quality,
    affix,
    user_equipment_id: ue.id,
  });

  return {
    newEquipmentId: ue.id,
    quality,
    affix,
    itemName: (recipe.equipment as { name: string } | null)?.name ?? "Mystery Gear",
  };
}
