// Client-side Supabase API — replaces all server functions
// Uses the anon key with RLS for user-scoped data
// Admin operations use Supabase Database Functions (RPC)

import { supabase } from "@/integrations/supabase/client";
import {
  DIFFICULTY_MULT,
  nextValuePlus,
  nextValueMinus,
  rewardGold,
  rewardXp,
  rewardGems,
  damageFromMiss,
  driftValue,
  xpToNextLevel,
  todayISO,
  dayDiff,
  dowFromISO,
  type Difficulty,
  type TaskType,
  CURRENT_RELEASED_MAX,
} from "./constants";

// ─── Profile ────────────────────────────────────────────────────────────────

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

  // Run cron if needed
  const cron = await runCronIfNeeded(user.id, profile);

  // Re-fetch profile after cron
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

// ─── Cron (client-side, runs on login) ──────────────────────────────────────

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

// ─── Tasks ──────────────────────────────────────────────────────────────────

export async function listTasks() {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("archived", false)
    .order("type")
    .order("sort_order")
    .order("created_at");
  if (error) throw error;
  return { tasks: data ?? [] };
}

export async function createTask(input: {
  type: TaskType;
  title: string;
  notes?: string;
  category?: string;
  difficulty?: Difficulty;
  positive_enabled?: boolean;
  negative_enabled?: boolean;
  schedule_days?: number[];
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...input, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return { task: data };
}

export async function updateTask(id: string, patch: Record<string, unknown>) {
  const { error } = await supabase.from("tasks").update(patch).eq("id", id);
  if (error) throw error;
  return { ok: true };
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("tasks").update({ archived: true }).eq("id", id);
  if (error) throw error;
  return { ok: true };
}

export async function scoreTask(
  id: string,
  direction: "plus" | "minus" | "complete" | "uncomplete",
) {
  const { data, error } = await supabase.rpc("score_task", {
    p_task_id: id,
    p_direction: direction,
  });
  if (error) throw error;

  // The RPC returns a JSON object matching ScoreTaskResult
  const res = data as any;
  if (!res.success) throw new Error(res.message);

  // Re-run client side effects (awakenings, goals) if needed,
  // but strictly keep the math server-side.
  let awakenings: Array<{ monsterName: string; skillName: string; flavor: string }> = [];
  if (res.isPositive) {
    try {
      const { evaluateAwakenings } = await import("./awakening-client");
      awakenings = await evaluateAwakenings();
    } catch (e) {
      console.warn("Awakening evaluation skipped:", e);
    }
  }

  let goalDamage: any = null;
  if (res.isPositive && res.xp_gained > 0) {
    try {
      const { damageGoalsForTask } = await import("./quests-client");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        goalDamage = await damageGoalsForTask(user.id, id, res.xp_gained);
      }
    } catch (e) {
      console.warn("Goal damage skipped:", e);
    }
  }

  return {
    ok: true,
    reward: {
      gold: res.gold_gained,
      xp: res.xp_gained,
      crystals: res.crystal_gained ? 1 : 0,
      hp: -res.hp_lost,
    },
    isPositive: direction === "plus" || direction === "complete",
    died: res.died,
    drop: res.drops?.[0] ?? null,
    leveledUp: false, // Server handles level up, we can just let UI refresh
    growthTicks: res.bond_ticks ?? [],
    awakenings,
    goalDamage,
  };
}

// Pure helper that mirrors the DB role_to_stat() function.
function roleToStat(role: string): "str" | "int" | "con" | "per" {
  switch (role) {
    case "attacker":
      return "str";
    case "tank":
      return "con";
    case "healer":
      return "con";
    case "support":
      return "int";
    case "debuffer":
      return "per";
    default:
      return "str";
  }
}

// ─── Expeditions ────────────────────────────────────────────────────────────

export {
  runExpedition,
  expeditionForDay,
  EXPEDITIONS,
  computeCurrentStamina,
  nextRegenIn,
} from "./expeditions-client";
export type { Drop as ExpeditionDrop, ExpeditionType } from "./expeditions-client";

// ─── Promotion Chamber ──────────────────────────────────────────────────────

export {
  checkPromotionEligibility,
  promoteMonster,
  requirementForPromotion,
  stoneForRole,
} from "./promotion-client";
export type { PromotionRequirement, PromotionCheck } from "./promotion-client";

// ─── Daily Ritual ───────────────────────────────────────────────────────────

export {
  getTodayLog,
  setMorningIntents,
  submitEveningReflection,
  consumeReflectionPull,
  isMorningWindow,
  isEveningWindow,
} from "./rituals-client";
export type { DailyLog, EveningReflection } from "./rituals-client";

// ─── Onboarding ─────────────────────────────────────────────────────────────

export { completeOnboarding, hasCompletedOnboarding } from "./onboarding-client";

// ─── Skill Awakening by Deeds ──────────────────────────────────────────────

export { evaluateAwakenings, listAwakeningEvents, awakeningsForRole } from "./awakening-client";
export type { AwakeningDef } from "./awakening-client";

// ─── Quest Engine ───────────────────────────────────────────────────────────

export { listGoals, createGoal, deleteGoal, linkTaskToGoal } from "./quests-client";
export type { Goal, GoalType, GoalStatus } from "./quests-client";

// ─── Codex ──────────────────────────────────────────────────────────────────

export { buildHeatmap, listDailyLogs } from "./codex-client";
export type { HeatmapCell } from "./codex-client";

// ─── Blacksmith Forge ───────────────────────────────────────────────────────

export { listRecipes, craft } from "./forge-client";
export type { Recipe, CraftQuality } from "./forge-client";

// ─── Sentient Companions ───────────────────────────────────────────────────

export { moodForBond, MOOD_META, getDevotedCommentary } from "./companion-client";
export type { Mood } from "./companion-client";

// ─── Trial of Echoes ────────────────────────────────────────────────────────

export { runTrial, getTrialCooldown, listMemorial } from "./trial-client";
export type { TrialResult } from "./trial-client";

// ─── Gacha ──────────────────────────────────────────────────────────────────

export { listBanners, pullBanner } from "./gacha-client";

// ─── Compendium ─────────────────────────────────────────────────────────────

export async function listRealms() {
  const { data, error } = await supabase.from("realms").select("*").order("sort_order");
  if (error) throw error;
  return { realms: data ?? [] };
}

export async function listAllMonsters() {
  const { data, error } = await supabase
    .from("monsters")
    .select("*, realms(name, icon)")
    .lte("bestiary_id", CURRENT_RELEASED_MAX)
    .order("realm_id")
    .order("rarity");
  if (error) throw error;
  return { monsters: data ?? [] };
}

export async function listMyMonsters() {
  const { data, error } = await supabase
    .from("user_monsters")
    .select("*, monster:monsters(*, realms(name, icon))")
    .order("obtained_at", { ascending: false });
  if (error) throw error;
  return { userMonsters: data ?? [] };
}

export async function updateTeamSlot(userMonsterId: string, slot: number | null) {
  if (slot !== null) {
    await supabase
      .from("user_monsters")
      .update({ is_on_team: false, team_slot: null })
      .eq("team_slot", slot);
  }
  await supabase
    .from("user_monsters")
    .update({ is_on_team: slot !== null, team_slot: slot })
    .eq("id", userMonsterId);
  return { ok: true };
}

// ─── Battle ─────────────────────────────────────────────────────────────────

export async function getTeam() {
  const { data, error } = await supabase
    .from("user_monsters")
    .select("*, monster:monsters(*)")
    .eq("is_on_team", true)
    .order("team_slot");
  if (error) throw error;
  return { team: data ?? [] };
}

export async function getTowerProgress() {
  const { data } = await supabase.from("tower_progress").select("*").maybeSingle();
  return { progress: data ?? { highest_floor: 0 } };
}

export async function getBattleHistory() {
  const { data, error } = await supabase
    .from("arena_battles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return { battles: data ?? [] };
}

export { startArenaBattle, classifyFloor } from "./battle-client";
export type { FloorType } from "./battle-client";

export async function harvestIsland(): Promise<{ harvested: number; whisperName: string | null }> {
  const { data, error } = await supabase.rpc("harvest_island");
  if (error) throw error;
  return data as any;
}

export async function startManualBattle(
  mode: string,
  floor: number,
  playerHp: number,
  enemyHp: number,
  enemyName: string,
  enemyAtk: number,
  enemyDef: number,
  enemyElement: string,
  teamPower: number,
  teamIds: string[],
): Promise<{ battleId: string }> {
  const { data, error } = await supabase.rpc("start_manual_battle", {
    p_mode: mode,
    p_floor: floor,
    p_player_hp: playerHp,
    p_enemy_hp: enemyHp,
    p_enemy_name: enemyName,
    p_enemy_atk: enemyAtk,
    p_enemy_def: enemyDef,
    p_enemy_element: enemyElement,
    p_team_power: teamPower,
    p_team_ids: teamIds,
  });
  if (error) throw error;
  return data as any;
}

export async function resolveBattleTurn(battleId: string, choice: string) {
  const { data, error } = await supabase.rpc("resolve_battle_turn", {
    p_battle_id: battleId,
    p_choice: choice,
  });
  if (error) throw error;
  return data as any;
}

// ─── Shop ───────────────────────────────────────────────────────────────────

export async function listShopItems() {
  const { data, error } = await supabase
    .from("shop_items")
    .select("*, equipment(*)")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return { items: data ?? [] };
}

export { purchaseItem, equipItem } from "./shop-client";

// ─── Guild ──────────────────────────────────────────────────────────────────

export {
  getMyGuild,
  listGuilds,
  createGuild,
  joinGuild,
  leaveGuild,
  listQuestTemplates,
  startQuest,
  getAvailableScrolls,
} from "./guild-client";

// ─── Profile Extended ───────────────────────────────────────────────────────

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
