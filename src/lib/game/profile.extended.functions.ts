import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getFullProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const [profileRes, monstersRes, achievementsRes, equipmentRes, inventoryRes, petsRes, battlesRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", userId).single(),
      supabaseAdmin.from("user_monsters").select("id").eq("user_id", userId),
      supabaseAdmin.from("user_achievements").select("*, achievement:achievements(*)").eq("user_id", userId),
      supabaseAdmin.from("user_equipment").select("*, equipment(*)").eq("user_id", userId).eq("is_equipped", true),
      supabaseAdmin.from("inventory").select("*").eq("user_id", userId).order("item_type"),
      supabaseAdmin.from("user_pets").select("*").eq("user_id", userId),
      supabaseAdmin.from("arena_battles").select("id").eq("user_id", userId).eq("player_won", true),
    ]);

    return {
      profile: profileRes.data,
      stats: {
        monstersCollected: monstersRes.data?.length ?? 0,
        battlesWon: battlesRes.data?.length ?? 0,
        petsOwned: petsRes.data?.length ?? 0,
      },
      achievements: achievementsRes.data ?? [],
      equippedGear: equipmentRes.data ?? [],
      inventory: inventoryRes.data ?? [],
      pets: petsRes.data ?? [],
    };
  });

export const changeClass = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ newClass: z.enum(["warrior", "mage", "rogue", "healer"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: profile } = await supabaseAdmin.from("profiles").select("level, gems").eq("id", userId).single();
    if (!profile) throw new Error("Profile not found");
    if (profile.level < 10) throw new Error("Must be Level 10+ to change class.");
    if (profile.gems < 3) throw new Error("Need 3 Void Shards to change class.");

    await supabaseAdmin.from("profiles").update({ class: data.newClass }).eq("id", userId);
    return { ok: true };
  });

export const getInventory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("inventory")
      .select("*")
      .order("item_type")
      .order("item_name");
    if (error) throw error;
    return { inventory: data ?? [] };
  });

export const hatchPet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ eggName: z.string(), potionName: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    // Check egg
    const { data: egg } = await supabaseAdmin.from("inventory")
      .select("*").eq("user_id", userId).eq("item_type", "egg").eq("item_name", data.eggName).maybeSingle();
    if (!egg || egg.quantity < 1) throw new Error("No egg of that type.");

    // Check potion
    const { data: potion } = await supabaseAdmin.from("inventory")
      .select("*").eq("user_id", userId).eq("item_type", "realm_potion").eq("item_name", data.potionName).maybeSingle();
    if (!potion || potion.quantity < 1) throw new Error("No potion of that type.");

    // Consume items
    if (egg.quantity === 1) await supabaseAdmin.from("inventory").delete().eq("id", egg.id);
    else await supabaseAdmin.from("inventory").update({ quantity: egg.quantity - 1 }).eq("id", egg.id);

    if (potion.quantity === 1) await supabaseAdmin.from("inventory").delete().eq("id", potion.id);
    else await supabaseAdmin.from("inventory").update({ quantity: potion.quantity - 1 }).eq("id", potion.id);

    // Create pet
    const petName = `${data.potionName} ${data.eggName}`;
    await supabaseAdmin.from("user_pets").upsert({
      user_id: userId,
      pet_name: petName,
      egg_type: data.eggName,
      potion_type: data.potionName,
    }, { onConflict: "user_id,egg_type,potion_type" });

    return { ok: true, petName };
  });

export const getAllAchievements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const [allRes, unlockedRes] = await Promise.all([
      supabaseAdmin.from("achievements").select("*").order("condition_value"),
      supabaseAdmin.from("user_achievements").select("achievement_id").eq("user_id", userId),
    ]);

    const unlockedIds = new Set((unlockedRes.data ?? []).map((u) => u.achievement_id));
    const achievements = (allRes.data ?? []).map((a) => ({
      ...a,
      unlocked: unlockedIds.has(a.id),
    }));

    return { achievements };
  });
