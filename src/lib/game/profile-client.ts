import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "./constants";

export async function changeClass(newClass: "warrior" | "mage" | "rogue" | "healer") {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: p } = await supabase
    .from("profiles")
    .select("level, class, crystals, last_class_change")
    .eq("id", user.id)
    .single();
  if (p!.level < 10) throw new Error("Must be Level 10 to choose a class.");
  if (p!.class === newClass) throw new Error("Already that class.");

  const now = new Date();
  if (p!.last_class_change) {
    const lastChange = new Date(p!.last_class_change);
    const diffDays = (now.getTime() - lastChange.getTime()) / (1000 * 3600 * 24);
    if (diffDays < 7) {
      throw new Error(`Class change is on cooldown. Try again in ${Math.ceil(7 - diffDays)} days.`);
    }
  }

  let cost = 0;
  if (p!.class !== "none") {
    cost = 500;
  }

  if (p!.crystals < cost) {
    throw new Error(`Changing class costs ${cost} Crystals.`);
  }

  await supabase
    .from("profiles")
    .update({
      class: newClass,
      crystals: p!.crystals - cost,
      last_class_change: now.toISOString(),
    })
    .eq("id", user.id);

  return { ok: true };
}

export async function getMyProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!profile) throw new Error("Profile not found");

  const cron = await runCronIfNeeded(user.id, profile);

  if (cron.ran) {
    const { data: updated } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    return { profile: updated!, cron };
  }

  return { profile, cron };
}

async function runCronIfNeeded(userId: string, profile: Record<string, unknown>) {
  const today = todayISO();
  if (profile.last_cron_date === today) {
    return { ran: false, died: false, missedDailies: 0, hpLost: 0 };
  }

  const { data, error } = await supabase.functions.invoke("daily-cron");

  if (error) {
    console.error("Cron Error:", error);
    return { ran: false, died: false, missedDailies: 0, hpLost: 0 };
  }

  return data;
}

export async function getFullProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const [profileRes, monstersRes, equipRes, inventoryRes, petsRes, battlesRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("user_monsters").select("id"),
    supabase.from("user_equipment").select("*, equipment(*)").eq("is_equipped", true),
    supabase.from("inventory").select("*").order("item_type"),
    supabase.from("user_pets").select("*"),
    supabase.from("arena_battles").select("id").eq("player_won", true),
  ]);

  return {
    profile: profileRes.data,
    stats: {
      monstersCollected: monstersRes.data?.length ?? 0,
      battlesWon: battlesRes.data?.length ?? 0,
      petsOwned: petsRes.data?.length ?? 0,
    },
    equippedGear: equipRes.data ?? [],
    inventory: inventoryRes.data ?? [],
    pets: petsRes.data ?? [],
  };
}

export async function getAllAchievements() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const [allRes, unlockedRes] = await Promise.all([
    supabase.from("achievements").select("*").order("condition_value"),
    supabase.from("user_achievements").select("achievement_id"),
  ]);
  const unlockedIds = new Set((unlockedRes.data ?? []).map((u) => u.achievement_id));
  return {
    achievements: (allRes.data ?? []).map((a) => ({ ...a, unlocked: unlockedIds.has(a.id) })),
  };
}

export async function listEquipment() {
  const { data, error } = await supabase
    .from("user_equipment")
    .select("*, equipment(*)")
    .order("obtained_at", { ascending: false });
  if (error) throw error;
  return { equipment: data ?? [] };
}
