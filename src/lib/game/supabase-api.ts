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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: p } = await supabase.from("profiles").select("level, class, crystals, last_class_change").eq("id", user.id).single();
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

  await supabase.from("profiles").update({
    class: newClass,
    crystals: p!.crystals - cost,
    last_class_change: now.toISOString()
  }).eq("id", user.id);
  
  return { ok: true };
}

export async function getMyProfile() {
  const { data: { user } } = await supabase.auth.getUser();
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
    const { data: updated } = await supabase.from("profiles").select("*").eq("id", user.id).single();
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

  // Build days to process
  const days: string[] = [];
  if (profile.last_cron_date) {
    const diff = Math.min(14, dayDiff(profile.last_cron_date as string, today));
    for (let i = 1; i < diff; i++) {
      const d = new Date((profile.last_cron_date as string) + "T00:00:00Z");
      d.setUTCDate(d.getUTCDate() + i);
      days.push(d.toISOString().slice(0, 10));
    }
  }

  let hpLost = 0;
  let missedCount = 0;
  let hp = profile.hp as number;
  let streak = profile.streak as number;
  let freezes = (profile.streak_freeze_charges as number) ?? 0;
  let freezeUsedCount = 0;

  if (days.length > 0) {
    // Archive old side quests
    await supabase.from("tasks").update({ archived: true })
      .eq("user_id", userId).eq("category", "side_quest").eq("archived", false);

    const { data: tasks } = await supabase
      .from("tasks")
      .select("id,type,difficulty,value,streak,schedule_days,last_completed_date,completed")
      .eq("archived", false);

    for (const day of days) {
      const dow = dowFromISO(day);
      let dayMissedCount = 0;
      let dayDmg = 0;
      const tasksToDrift = [];

      for (const t of tasks ?? []) {
        if (t.type !== "daily") continue;
        if (!(t.schedule_days as number[]).includes(dow)) continue;
        if (t.last_completed_date === day) continue;

        dayMissedCount += 1;
        dayDmg += damageFromMiss(Number(t.value), t.difficulty as Difficulty, (profile.con_stat as number) ?? 0);
        tasksToDrift.push(t);
      }

      if (dayMissedCount > 0) {
        if (freezes > 0) {
          freezes -= 1;
          freezeUsedCount += 1;
          for (const t of tasksToDrift) {
            const newVal = driftValue(Number(t.value), t.difficulty as Difficulty);
            await supabase.from("tasks").update({ value: newVal }).eq("id", t.id); // Streak intact
          }
        } else {
          hp = Math.max(0, hp - dayDmg);
          hpLost += dayDmg;
          missedCount += dayMissedCount;
          for (const t of tasksToDrift) {
            const newVal = driftValue(Number(t.value), t.difficulty as Difficulty);
            await supabase.from("tasks").update({ value: newVal, streak: 0 }).eq("id", t.id); // Break streak
          }
        }
      }
    }
  }

  // Reset today's dailies
  const todayDow = dowFromISO(today);
  await supabase
    .from("tasks")
    .update({ completed: false })
    .eq("type", "daily")
    .eq("archived", false)
    .contains("schedule_days", [todayDow]);

  // Update streak
  if (days.length > 0) {
    streak = missedCount === 0 ? streak + days.length : 0;
  }

  // Generate daily side-quests if none exist
  const { data: activeSQ } = await supabase.from("tasks")
    .select("id").eq("user_id", userId).eq("category", "side_quest").eq("archived", false);

  if (!activeSQ || activeSQ.length === 0) {
    const sqTemplates = [
      { title: "Complete 5 habits today", difficulty: "medium" },
      { title: "Win 2 Arena Battles", difficulty: "medium" },
      { title: "Score 3 Dailies", difficulty: "easy" },
      { title: "Level up a monster's bond", difficulty: "medium" },
      { title: "Pull from the Altar", difficulty: "easy" }
    ];
    const shuffled = sqTemplates.sort(() => 0.5 - Math.random()).slice(0, 3);
    for (let i = 0; i < shuffled.length; i++) {
      await supabase.from("tasks").insert({
        user_id: userId, type: "todo", category: "side_quest",
        title: shuffled[i].title, difficulty: shuffled[i].difficulty as Difficulty, value: 0, sort_order: i
      });
    }
  }

  // Death check
  let died = false;
  let level = profile.level as number;
  let xp = profile.xp as number;
  let gold = profile.gold as number;
  let deaths = profile.deaths as number;

  if (hp <= 0) {
    died = true;
    level = Math.max(1, level - 1);
    xp = 0;
    gold = 0;
    hp = profile.max_hp as number;
    deaths += 1;
  }

  await supabase.from("profiles").update({
    hp, level, xp, gold, deaths, streak,
    streak_freeze_charges: freezes,
    last_cron_date: today,
    last_login_date: today,
  }).eq("id", userId);

  return { ran: true, died, missedDailies: missedCount, hpLost, freezesUsed: freezeUsedCount };
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
  type: TaskType; title: string; notes?: string; category?: string;
  difficulty?: Difficulty; positive_enabled?: boolean; negative_enabled?: boolean;
  schedule_days?: number[];
}) {
  const { data: { user } } = await supabase.auth.getUser();
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

export async function scoreTask(id: string, direction: "plus" | "minus" | "complete" | "uncomplete") {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const [taskRes, profileRes] = await Promise.all([
    supabase.from("tasks").select("*").eq("id", id).single(),
    supabase.from("profiles").select("*").eq("id", user.id).single(),
  ]);
  if (taskRes.error) throw taskRes.error;
  if (profileRes.error) throw profileRes.error;
  const task = taskRes.data;
  const profile = profileRes.data;

  const diff = task.difficulty as Difficulty;
  const today = todayISO();
  let newVal = Number(task.value);
  let goldGain = 0, xpGain = 0, gemGain = 0, hpChange = 0;
  let newStreak = task.streak as number;
  let completed = task.completed as boolean;
  let lastCompletedDate = task.last_completed_date as string | null;
  const isPositive = direction === "plus" || direction === "complete";
  const talents = profile.talents as Record<string, number> ?? {};
  const greedMult = 1 + (talents.greed ?? 0) * 0.05;
  const scholarMult = 1 + (talents.scholar ?? 0) * 0.05;
  const resilienceMult = 1 - (talents.resilience ?? 0) * 0.10;
  const collectorMult = 1 + (talents.collector ?? 0) * 0.05;

  if (direction === "plus") {
    if (!task.positive_enabled) throw new Error("Positive disabled");
    newVal = nextValuePlus(newVal);
    goldGain = Math.round(rewardGold(Number(task.value), diff) * greedMult);
    xpGain = Math.round(rewardXp(Number(task.value), diff) * scholarMult);
    gemGain = Math.random() < 0.25 ? rewardGems(Number(task.value), diff) : 0;
    newStreak += 1;
  } else if (direction === "minus") {
    if (!task.negative_enabled) throw new Error("Negative disabled");
    newVal = nextValueMinus(newVal);
    hpChange = -Math.round(damageFromMiss(Number(task.value), diff, profile.con_stat ?? 0) * resilienceMult);
    newStreak = 0;
  } else if (direction === "complete") {
    if (completed) return { ok: true, noop: true, reward: null, isPositive: true, died: false };
    newVal = nextValuePlus(newVal);
    goldGain = Math.round(rewardGold(Number(task.value), diff) * greedMult);
    xpGain = Math.round(rewardXp(Number(task.value), diff) * scholarMult);
    gemGain = Math.random() < 0.3 ? rewardGems(Number(task.value), diff) : 0;
    completed = true;
    lastCompletedDate = today;
    newStreak = task.type === "daily" ? newStreak + 1 : newStreak;
  } else if (direction === "uncomplete") {
    if (!completed) return { ok: true, noop: true, reward: null, isPositive: false, died: false };
    newVal = nextValueMinus(newVal);
    goldGain = -rewardGold(Number(task.value), diff);
    xpGain = -Math.min(profile.xp, rewardXp(Number(task.value), diff));
    completed = false;
    lastCompletedDate = null;
    newStreak = Math.max(0, newStreak - 1);
  }

  // Combo logic
  let newComboCount = (profile.combo_count as number) ?? 0;
  let newLastTaskTime = profile.last_task_time as string | null;

  if (isPositive) {
    const now = new Date();
    if (newLastTaskTime) {
      const lastTime = new Date(newLastTaskTime);
      if ((now.getTime() - lastTime.getTime()) < 60 * 60 * 1000) {
        newComboCount += 1;
      } else {
        newComboCount = 1;
      }
    } else {
      newComboCount = 1;
    }
    newLastTaskTime = now.toISOString();

    const comboMult = 1 + Math.min(0.5, newComboCount * 0.05);
    goldGain = Math.round(goldGain * comboMult);
    xpGain = Math.round(xpGain * comboMult);

    // ⭐ Sacred Directive multiplier: 1.5× when this task is one of today's morning intents.
    if (task.is_starred) {
      goldGain = Math.round(goldGain * 1.5);
      xpGain = Math.round(xpGain * 1.5);
    }
  }

  // Update task
  await supabase.from("tasks").update({
    value: newVal, streak: newStreak, completed,
    last_completed_date: lastCompletedDate,
    last_completed_at: isPositive ? new Date().toISOString() : task.last_completed_at,
  }).eq("id", id);

  // Update profile
  let newGold = Math.max(0, profile.gold + goldGain);
  let newCrystals = Math.max(0, profile.crystals + gemGain);
  let newHp = Math.max(0, Math.min(profile.max_hp, profile.hp + hpChange));
  let newLevel = profile.level;
  let newXp = Math.max(0, profile.xp + xpGain);
  let deaths = profile.deaths;

  // Level up
  let leveledUp = false;
  while (newXp >= xpToNextLevel(newLevel)) {
    newXp -= xpToNextLevel(newLevel);
    newLevel += 1;
    newHp = profile.max_hp; // full heal on level up
    leveledUp = true;
  }

  // Death
  let died = false;
  if (newHp <= 0) {
    died = true;
    newLevel = Math.max(1, newLevel - 1);
    newXp = 0;
    newGold = 0;
    newHp = profile.max_hp;
    deaths += 1;
  }

  await supabase.from("profiles").update({
    gold: newGold, crystals: newCrystals, hp: newHp,
    xp: newXp, level: newLevel, deaths,
    combo_count: newComboCount, last_task_time: newLastTaskTime,
  }).eq("id", user.id);

  // Random drop
  let drop: { type: string; name: string } | null = null;
  if (isPositive) {
    const perBonus = 1 + ((profile.per_stat ?? 0) * 0.005);
    const dropRoll = Math.random() / (perBonus * collectorMult);
    if (dropRoll < 0.03) {
      const eggs = ["Wolf", "Dragon", "Phoenix", "Serpent", "Griffin", "Owl", "Bear", "Fox"];
      drop = { type: "egg", name: `${eggs[Math.floor(Math.random() * eggs.length)]} Egg` };
    } else if (dropRoll < 0.06) {
      const realms = ["Arcane", "Chaos", "Void", "Death", "Nature", "Divine", "Dread", "Digital"];
      drop = { type: "realm_potion", name: `${realms[Math.floor(Math.random() * realms.length)]} Potion` };
    } else if (dropRoll < 0.10) {
      drop = { type: "food", name: ["Meat", "Fish", "Fruit", "Cheese", "Honey"][Math.floor(Math.random() * 5)] };
    } else if (dropRoll < 0.15) {
      const mats = ["Iron Ore", "Shadow Essence", "Void Core", "Light Crystal"];
      drop = { type: "material", name: mats[Math.floor(Math.random() * mats.length)] };
    }
    if (drop) {
      const { data: existing } = await supabase.from("inventory")
        .select("id, quantity").eq("item_type", drop.type).eq("item_name", drop.name).maybeSingle();
      if (existing) {
        await supabase.from("inventory").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
      } else {
        await supabase.from("inventory").insert({ user_id: user.id, item_type: drop.type, item_name: drop.name, quantity: 1 });
      }
    }
  }

  // ─── Monster bond ticks (Step 2 — Pillar 3 input) ─────────────────────
  // If this task carries a stat tag (str/int/con/per) AND was scored positive,
  // every user_monster whose role maps to that stat gains +1 growth_xp and
  // +0.5 bond. This is the channel that habits build monster affinity.
  const taskTags = (task.tags as string[] | null) ?? [];
  const statTags = ["str", "int", "con", "per"] as const;
  const targetStats = taskTags.filter((t) => (statTags as readonly string[]).includes(t.toLowerCase())).map((t) => t.toLowerCase());

  const growthTicks: Array<{ user_monster_id: string; monster_name: string; stat: string }> = [];

  if (isPositive && targetStats.length > 0) {
    const { data: roster } = await supabase
      .from("user_monsters")
      .select("id, bond_percent, growth_xp, monster:monsters(name, role)")
      .eq("user_id", user.id);

    for (const um of roster ?? []) {
      const m = um.monster as unknown as { name: string; role: string } | null;
      if (!m) continue;
      const stat = roleToStat(m.role);
      if (!targetStats.includes(stat)) continue;

      const newBond = Math.min(100, Number(um.bond_percent) + 0.5);
      const newGrowthXp = Number(um.growth_xp) + 1;
      await supabase
        .from("user_monsters")
        .update({ bond_percent: newBond, growth_xp: newGrowthXp })
        .eq("id", um.id);

      growthTicks.push({ user_monster_id: um.id, monster_name: m.name, stat });
    }
  }

  // ─── Skill Awakening evaluation ──────────────────────────────────────
  let awakenings: Array<{ monsterName: string; skillName: string; flavor: string }> = [];
  if (isPositive) {
    try {
      const { evaluateAwakenings } = await import("./awakening-client");
      awakenings = await evaluateAwakenings();
    } catch (e) {
      console.warn("Awakening evaluation skipped:", e);
    }
  }

  // ─── Goal HP drain (quest engine) ───────────────────────────────────
  let goalDamage: Awaited<ReturnType<typeof import("./quests-client").damageGoalsForTask>> | null = null;
  if (isPositive && xpGain > 0) {
    try {
      const { damageGoalsForTask } = await import("./quests-client");
      goalDamage = await damageGoalsForTask(user.id, id, xpGain);
    } catch (e) {
      console.warn("Goal damage skipped:", e);
    }
  }

  return {
    ok: true,
    reward: { gold: goldGain, xp: xpGain, crystals: gemGain, hp: hpChange },
    isPositive, died, drop, leveledUp,
    growthTicks,
    awakenings,
    goalDamage,
  };
}

// Pure helper that mirrors the DB role_to_stat() function.
function roleToStat(role: string): "str" | "int" | "con" | "per" {
  switch (role) {
    case "attacker": return "str";
    case "tank":     return "con";
    case "healer":   return "con";
    case "support":  return "int";
    case "debuffer": return "per";
    default:         return "str";
  }
}

// ─── Expeditions ────────────────────────────────────────────────────────────

export { runExpedition, expeditionForDay, EXPEDITIONS, computeCurrentStamina, nextRegenIn } from "./expeditions-client";
export type { Drop as ExpeditionDrop, ExpeditionType } from "./expeditions-client";

// ─── Promotion Chamber ──────────────────────────────────────────────────────

export { checkPromotionEligibility, promoteMonster, requirementForPromotion, stoneForRole } from "./promotion-client";
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

// ─── Skill Awakening by Deeds ──────────────────────────────────────────────

export { evaluateAwakenings, listAwakeningEvents, awakeningsForRole } from "./awakening-client";
export type { AwakeningDef } from "./awakening-client";

// ─── Quest Engine ───────────────────────────────────────────────────────────

export { listGoals, createGoal, deleteGoal, linkTaskToGoal } from "./quests-client";
export type { Goal, GoalType, GoalStatus } from "./quests-client";

// ─── Gacha ──────────────────────────────────────────────────────────────────

export { listBanners, pullBanner } from "./gacha-client";

// ─── Compendium ─────────────────────────────────────────────────────────────

export async function listRealms() {
  const { data, error } = await supabase.from("realms").select("*").order("sort_order");
  if (error) throw error;
  return { realms: data ?? [] };
}

export async function listAllMonsters() {
  const { data, error } = await supabase.from("monsters").select("*, realms(name, icon)").lte("bestiary_id", CURRENT_RELEASED_MAX).order("realm_id").order("rarity");
  if (error) throw error;
  return { monsters: data ?? [] };
}

export async function listMyMonsters() {
  const { data, error } = await supabase.from("user_monsters").select("*, monster:monsters(*, realms(name, icon))").order("obtained_at", { ascending: false });
  if (error) throw error;
  return { userMonsters: data ?? [] };
}

export async function updateTeamSlot(userMonsterId: string, slot: number | null) {
  if (slot !== null) {
    await supabase.from("user_monsters").update({ is_on_team: false, team_slot: null }).eq("team_slot", slot);
  }
  await supabase.from("user_monsters").update({ is_on_team: slot !== null, team_slot: slot }).eq("id", userMonsterId);
  return { ok: true };
}

// ─── Battle ─────────────────────────────────────────────────────────────────

export async function getTeam() {
  const { data, error } = await supabase.from("user_monsters").select("*, monster:monsters(*)").eq("is_on_team", true).order("team_slot");
  if (error) throw error;
  return { team: data ?? [] };
}

export async function getTowerProgress() {
  const { data } = await supabase.from("tower_progress").select("*").maybeSingle();
  return { progress: data ?? { highest_floor: 0 } };
}

export async function getBattleHistory() {
  const { data, error } = await supabase.from("arena_battles").select("*").order("created_at", { ascending: false }).limit(20);
  if (error) throw error;
  return { battles: data ?? [] };
}

export { startArenaBattle } from "./battle-client";

// ─── Shop ───────────────────────────────────────────────────────────────────

export async function listShopItems() {
  const { data, error } = await supabase.from("shop_items").select("*, equipment(*)").eq("is_active", true).order("sort_order");
  if (error) throw error;
  return { items: data ?? [] };
}

export { purchaseItem, equipItem } from "./shop-client";

// ─── Guild ──────────────────────────────────────────────────────────────────

export { getMyGuild, listGuilds, createGuild, joinGuild, leaveGuild, listQuestTemplates, startQuest, getAvailableScrolls } from "./guild-client";

// ─── Profile Extended ───────────────────────────────────────────────────────

export async function getFullProfile() {
  const { data: { user } } = await supabase.auth.getUser();
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
    stats: { monstersCollected: monstersRes.data?.length ?? 0, battlesWon: battlesRes.data?.length ?? 0, petsOwned: petsRes.data?.length ?? 0 },
    equippedGear: equipRes.data ?? [],
    inventory: inventoryRes.data ?? [],
    pets: petsRes.data ?? [],
  };
}

export async function getAllAchievements() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const [allRes, unlockedRes] = await Promise.all([
    supabase.from("achievements").select("*").order("condition_value"),
    supabase.from("user_achievements").select("achievement_id"),
  ]);
  const unlockedIds = new Set((unlockedRes.data ?? []).map((u) => u.achievement_id));
  return { achievements: (allRes.data ?? []).map((a) => ({ ...a, unlocked: unlockedIds.has(a.id) })) };
}

export async function listEquipment() {
  const { data, error } = await supabase.from("user_equipment").select("*, equipment(*)").order("obtained_at", { ascending: false });
  if (error) throw error;
  return { equipment: data ?? [] };
}


