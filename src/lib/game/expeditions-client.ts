import { supabase } from "@/integrations/supabase/client";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ExpeditionType = "iron_pits" | "sage_wood" | "stone_heights" | "crossroads";
export type DropType = "stone" | "material" | "gold" | "tome_shard";
export type Drop = { type: DropType; name: string; qty: number };

export type ExpeditionDefinition = {
  type: ExpeditionType;
  name: string;
  flavor: string;
  element: "str" | "int" | "con" | "all";
  primaryStone: string;
};

// ─── Static config ──────────────────────────────────────────────────────────

const STAMINA_PER_RUN = 5;
const STAMINA_REGEN_MINUTES = 10;
const ELITE_CHANCE = 0.05;

export const EXPEDITIONS: Record<ExpeditionType, ExpeditionDefinition> = {
  iron_pits: {
    type: "iron_pits",
    name: "Iron Pits",
    flavor: "Cracked tunnels echo with the clang of unseen hammers.",
    element: "str",
    primaryStone: "Strength Stone",
  },
  sage_wood: {
    type: "sage_wood",
    name: "Sage Wood",
    flavor: "Old letters drift on the wind. Pages, not leaves.",
    element: "int",
    primaryStone: "Sage Stone",
  },
  stone_heights: {
    type: "stone_heights",
    name: "Stone Heights",
    flavor: "Winds carve the cliffs; only the steady reach the summit.",
    element: "con",
    primaryStone: "Hearth Stone",
  },
  crossroads: {
    type: "crossroads",
    name: "The Crossroads",
    flavor: "Three paths meet here. The sky listens.",
    element: "all",
    primaryStone: "Wayfarer Stone",
  },
};

const RARE_MATERIALS: Record<ExpeditionType, string> = {
  iron_pits: "Iron Shard",
  sage_wood: "Vellum Page",
  stone_heights: "Granite Core",
  crossroads: "Tome Shard",
};

// 0=Sun → Crossroads; 1/2 Iron Pits; 3/4 Sage Wood; 5/6 Stone Heights
export function expeditionForDay(day: number): ExpeditionType {
  if (day === 0) return "crossroads";
  if (day <= 2) return "iron_pits";
  if (day <= 4) return "sage_wood";
  return "stone_heights";
}

// ─── Stamina (pure helpers; mirror state without writing) ───────────────────

export function computeCurrentStamina(stored: number, max: number, lastTickISO: string): number {
  const last = Date.parse(lastTickISO);
  const elapsedMin = (Date.now() - last) / 60000;
  const regen = Math.floor(elapsedMin / STAMINA_REGEN_MINUTES);
  return Math.min(max, stored + regen);
}

export function nextRegenIn(stored: number, max: number, lastTickISO: string): number {
  if (computeCurrentStamina(stored, max, lastTickISO) >= max) return 0;
  const last = Date.parse(lastTickISO);
  const elapsedMs = Date.now() - last;
  const cycleMs = STAMINA_REGEN_MINUTES * 60000;
  return cycleMs - (elapsedMs % cycleMs);
}

// ─── Run logic ──────────────────────────────────────────────────────────────

export async function runExpedition(runs: 1 | 5): Promise<{
  totalDrops: Drop[];
  runsCompleted: number;
  eliteCount: number;
  staminaAfter: number;
  staminaMax: number;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Load profile + team
  const [profileRes, teamRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("gold, stamina, stamina_max, stamina_last_tick, per_stat")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_monsters")
      .select("id, level, bond_percent, monster:monsters(role, base_atk, base_def, base_hp)")
      .eq("user_id", user.id)
      .eq("is_on_team", true),
  ]);
  if (profileRes.error) throw profileRes.error;

  const profile = profileRes.data;
  const team = (teamRes.data ?? []) as Array<{
    id: string;
    level: number;
    bond_percent: number;
    monster: { role: string; base_atk: number; base_def: number; base_hp: number } | null;
  }>;
  if (team.length < 1) throw new Error("Build a team on your Island first.");

  // Determine expedition
  const day = new Date().getDay();
  const expType = expeditionForDay(day);
  const def = EXPEDITIONS[expType];

  // Resolve each run via Server RPC
  const totalDrops: Drop[] = [];
  let eliteCount = 0;
  let runsCompleted = 0;
  let currentStamina = profile.stamina;

  for (let i = 0; i < runs; i++) {
    const { data: runData, error } = await supabase.rpc("run_expedition", { p_exp_type: expType });
    if (error) {
      // Stop running if there's an error (like insufficient stamina)
      if (i === 0) throw error;
      break;
    }
    runsCompleted += 1;
    currentStamina = runData.newStamina;

    const drops = runData.drops as Drop[];
    for (const d of drops) {
      totalDrops.push(d);
      if (d.type === "material" || d.name === def.primaryStone) {
        eliteCount += 0.5; // Roughly estimate elites based on drops
      }
    }
  }

  // Merge totalDrops by name
  const merged = new Map<string, Drop>();
  for (const d of totalDrops) {
    const key = `${d.type}:${d.name}`;
    const prev = merged.get(key);
    if (prev) prev.qty += d.qty;
    else merged.set(key, { ...d });
  }
  const finalDrops = [...merged.values()];

  // Bond ticks for team — running expeditions builds bond like quests do
  if (runsCompleted > 0) {
    for (const um of team) {
      const m = um.monster;
      if (!m) continue;
      const expElement = def.element;
      if (expElement === "all" || roleToStat(m.role) === expElement) {
        const bondGain = 0.5 * runsCompleted;
        await supabase
          .from("user_monsters")
          .update({ bond_percent: Math.min(100, Number(um.bond_percent) + bondGain) })
          .eq("id", um.id);
      }
    }
  }

  // Run awakening evaluation after expedition
  let awakenings: Array<{ monsterName: string; skillName: string; flavor: string }> = [];
  try {
    const { evaluateAwakenings } = await import("./awakening-client");
    awakenings = await evaluateAwakenings();
  } catch (e) {
    console.warn("Awakening evaluation skipped:", e);
  }

  return {
    totalDrops: finalDrops,
    runsCompleted,
    eliteCount: Math.floor(eliteCount),
    staminaAfter: currentStamina,
    staminaMax: profile.stamina_max,
    awakenings,
  };
}

function rollDrops(expType: ExpeditionType, isElite: boolean, perStat: number): Drop[] {
  const drops: Drop[] = [];
  const def = EXPEDITIONS[expType];
  const perBonus = 1 + perStat * 0.005;

  // Always: a few gold
  drops.push({ type: "gold", name: "Gold", qty: 30 + Math.floor(Math.random() * 40) });

  // Primary stone: ~70% chance for 1, +1 more on elite
  if (Math.random() < 0.7 * perBonus) {
    drops.push({ type: "stone", name: def.primaryStone, qty: 1 + (isElite ? 1 : 0) });
  }

  // Rare material: 10% normally, guaranteed on elite
  if (isElite || Math.random() < 0.1 * perBonus) {
    drops.push({ type: "material", name: RARE_MATERIALS[expType], qty: 1 });
  }

  // Crossroads bonus: tiny chance for a Tome Shard (only path outside quarterly/wailing)
  if (expType === "crossroads" && Math.random() < 0.02) {
    drops.push({ type: "tome_shard", name: "Tome Shard", qty: 1 });
  }

  return drops;
}

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
