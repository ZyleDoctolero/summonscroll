import { supabase } from "@/integrations/supabase/client";

// ─── Awakening definitions per role ─────────────────────────────────────────
// Each monster's role determines 2 dormant skills. They unlock when the
// player satisfies a real-world condition.

type TriggerType = "streak" | "level" | "bond" | "ritual_streak" | "deaths_recovered" | "expedition_count" | "tower_floor";

export type AwakeningDef = {
  name: string;
  flavor: string;
  triggerType: TriggerType;
  threshold: number;
  triggerText: string;  // human-readable
};

const AWAKENINGS_BY_ROLE: Record<string, AwakeningDef[]> = {
  attacker: [
    {
      name: "Berserker's Fury",
      flavor: "+30% damage on the next battle after a tough day.",
      triggerType: "bond",
      threshold: 75,
      triggerText: "Reach 75% bond with this monster.",
    },
    {
      name: "Unbroken Will",
      flavor: "Once per battle, survive a lethal blow at 1 HP.",
      triggerType: "streak",
      threshold: 30,
      triggerText: "Hold a 30-day daily streak.",
    },
  ],
  tank: [
    {
      name: "Iron Wall",
      flavor: "Absorbs 50% party damage for the first 3 rounds.",
      triggerType: "streak",
      threshold: 14,
      triggerText: "Hold a 14-day daily streak.",
    },
    {
      name: "Stalwart Oath",
      flavor: "Block one expedition-defeat per week.",
      triggerType: "ritual_streak",
      threshold: 7,
      triggerText: "Complete the Evening Reflection 7 days in a row.",
    },
  ],
  healer: [
    {
      name: "Healing Light",
      flavor: "Restores 15% party HP at the start of each round.",
      triggerType: "level",
      threshold: 20,
      triggerText: "Reach Level 20.",
    },
    {
      name: "Rebirth",
      flavor: "Once per battle, revive the team at 50% HP.",
      triggerType: "deaths_recovered",
      threshold: 1,
      triggerText: "Recover from a death by completing 7 clean dailies.",
    },
  ],
  support: [
    {
      name: "Word of the Sage",
      flavor: "+30% INT skill damage for the party.",
      triggerType: "level",
      threshold: 25,
      triggerText: "Reach Level 25.",
    },
    {
      name: "Twilight Pact",
      flavor: "Reflection Pull rewards include a guaranteed 4★+ monster.",
      triggerType: "ritual_streak",
      threshold: 14,
      triggerText: "Complete Evening Reflection 14 days in a row.",
    },
  ],
  debuffer: [
    {
      name: "Hex of Shadow",
      flavor: "Enemies inflicted with -25% accuracy for 3 rounds.",
      triggerType: "expedition_count",
      threshold: 20,
      triggerText: "Run 20 expeditions.",
    },
    {
      name: "Cursebreaker",
      flavor: "Cleanses all debuffs from the party once per battle.",
      triggerType: "tower_floor",
      threshold: 25,
      triggerText: "Clear Tower Floor 25.",
    },
  ],
};

// ─── Trigger evaluation context ─────────────────────────────────────────────

export type AwakeningContext = {
  profile: {
    level: number;
    streak: number;
    ritual_streak: number;
    deaths: number;
  };
  expeditionsRun: number;
  towerFloor: number;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export function awakeningsForRole(role: string): AwakeningDef[] {
  return AWAKENINGS_BY_ROLE[role] ?? AWAKENINGS_BY_ROLE.attacker;
}

function evalTrigger(def: AwakeningDef, ctx: AwakeningContext, bondPercent: number): boolean {
  switch (def.triggerType) {
    case "streak":           return ctx.profile.streak >= def.threshold;
    case "level":            return ctx.profile.level >= def.threshold;
    case "bond":             return bondPercent >= def.threshold;
    case "ritual_streak":    return ctx.profile.ritual_streak >= def.threshold;
    case "deaths_recovered": return ctx.profile.deaths >= def.threshold && ctx.profile.streak >= 7;
    case "expedition_count": return ctx.expeditionsRun >= def.threshold;
    case "tower_floor":      return ctx.towerFloor >= def.threshold;
    default:                 return false;
  }
}

// ─── Evaluate (writes events + updates awakened_skills) ─────────────────────

export async function evaluateAwakenings(): Promise<Array<{
  monsterName: string;
  skillName: string;
  flavor: string;
}>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Load context
  const [profileRes, expCountRes, towerRes, rosterRes] = await Promise.all([
    supabase.from("profiles").select("level, streak, ritual_streak, deaths").eq("id", user.id).single(),
    supabase.from("expeditions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("tower_progress").select("highest_floor").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("user_monsters")
      .select("id, bond_percent, awakened_skills, monster:monsters(name, role)")
      .eq("user_id", user.id),
  ]);
  if (!profileRes.data) return [];

  const ctx: AwakeningContext = {
    profile: {
      level: profileRes.data.level,
      streak: profileRes.data.streak,
      ritual_streak: profileRes.data.ritual_streak ?? 0,
      deaths: profileRes.data.deaths ?? 0,
    },
    expeditionsRun: expCountRes.count ?? 0,
    towerFloor: towerRes.data?.highest_floor ?? 0,
  };

  const unlocked: Array<{ monsterName: string; skillName: string; flavor: string }> = [];

  for (const um of rosterRes.data ?? []) {
    const m = um.monster as unknown as { name: string; role: string } | null;
    if (!m) continue;

    const defs = awakeningsForRole(m.role);
    const already = um.awakened_skills as string[];
    const newlyUnlocked: string[] = [];

    for (const def of defs) {
      if (already.includes(def.name)) continue;
      if (!evalTrigger(def, ctx, um.bond_percent)) continue;

      newlyUnlocked.push(def.name);
      unlocked.push({ monsterName: m.name, skillName: def.name, flavor: def.flavor });

      await supabase.from("awakening_events").insert({
        user_id: user.id,
        user_monster_id: um.id,
        skill_name: def.name,
        trigger_text: def.triggerText,
      });
    }

    if (newlyUnlocked.length > 0) {
      const next = [...already, ...newlyUnlocked];
      await supabase
        .from("user_monsters")
        .update({ awakened_skills: next })
        .eq("id", um.id);
    }
  }

  return unlocked;
}

// ─── Awakening Log feed (for Codex) ─────────────────────────────────────────

export async function listAwakeningEvents(limit = 50) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { events: [] };

  const { data, error } = await supabase
    .from("awakening_events")
    .select("*, user_monster:user_monsters(monster:monsters(name, role))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return { events: data ?? [] };
}
