import { supabase } from "@/integrations/supabase/client";

// Exporting refactored domain clients
export * from "./tasks-client";
export * from "./profile-client";
export * from "./monsters-client";

// Re-exports from existing clients
export { startArenaBattle, classifyFloor } from "./battle-client";
export type { FloorType } from "./battle-client";

export { purchaseItem, equipItem } from "./shop-client";

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

export {
  runExpedition,
  expeditionForDay,
  EXPEDITIONS,
  computeCurrentStamina,
  nextRegenIn,
} from "./expeditions-client";
export type { Drop as ExpeditionDrop, ExpeditionType } from "./expeditions-client";

export {
  checkPromotionEligibility,
  promoteMonster,
  requirementForPromotion,
  stoneForRole,
} from "./promotion-client";
export type { PromotionRequirement, PromotionCheck } from "./promotion-client";

export {
  getTodayLog,
  setMorningIntents,
  submitEveningReflection,
  consumeReflectionPull,
  isMorningWindow,
  isEveningWindow,
} from "./rituals-client";
export type { DailyLog, EveningReflection } from "./rituals-client";

export { completeOnboarding, hasCompletedOnboarding } from "./onboarding-client";

export { evaluateAwakenings, listAwakeningEvents, awakeningsForRole } from "./awakening-client";
export type { AwakeningDef } from "./awakening-client";

export { listGoals, createGoal, deleteGoal, linkTaskToGoal } from "./quests-client";
export type { Goal, GoalType, GoalStatus } from "./quests-client";

export { buildHeatmap, listDailyLogs } from "./codex-client";
export type { HeatmapCell } from "./codex-client";

export { listRecipes, craft } from "./forge-client";
export type { Recipe, CraftQuality } from "./forge-client";

export { moodForBond, MOOD_META, getDevotedCommentary } from "./companion-client";
export type { Mood } from "./companion-client";

export * from "./trial-client";
export * from "./gacha-client";

// Remaining un-extracted functions

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

export async function listShopItems() {
  const { data, error } = await supabase
    .from("shop_items")
    .select("*, equipment(*)")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return { items: data ?? [] };
}

export async function listIdleExpeditions() {
  const { data, error } = await supabase
    .from("idle_expeditions")
    .select("*")
    .order("start_time", { ascending: false });
  return { expeditions: data ?? [] };
}

export async function dispatchIdleExpedition(
  monsterId: string,
  realmName: string,
  durationMinutes: number,
  staminaCost: number = 10,
) {
  const { error } = await supabase.rpc("dispatch_expedition", {
    p_monster_id: monsterId,
    p_realm_name: realmName,
    p_duration_minutes: durationMinutes,
    p_stamina_cost: staminaCost,
  });
  if (error) throw error;
  return { ok: true };
}

export async function claimIdleExpedition(expeditionId: string) {
  const { data, error } = await supabase.rpc("claim_expedition", {
    p_expedition_id: expeditionId,
  });
  if (error) throw error;
  const reward = data as { crystals: number; gold: number };
  return { ok: true, reward: `${reward.crystals} Crystals & ${reward.gold} Gold` };
}

export async function ascendMonster(baseId: string, materialId: string) {
  const { data, error } = await supabase.rpc("ascend_monster", {
    p_base_id: baseId,
    p_material_id: materialId,
  });
  if (error) throw error;
  return data;
}

export async function evolveMonster(
  baseId: string,
  recipeId: string,
  catalystName: string,
  resultName: string,
) {
  const { data, error } = await supabase.rpc("evolve_monster", {
    p_base_id: baseId,
    p_recipe_id: recipeId,
    p_catalyst_name: catalystName,
    p_result_name: resultName,
  });
  if (error) throw error;
  return data;
}

export async function bindCompanion(slot: "weapon" | "armor" | "mount", monsterId: string | null) {
  const { data, error } = await supabase.rpc("bind_companion", {
    p_slot: slot,
    p_monster_id: monsterId,
  });
  if (error) throw error;
  return data;
}
export * from "./artifacts-client";
