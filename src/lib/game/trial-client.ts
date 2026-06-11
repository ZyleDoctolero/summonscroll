import { supabase } from "@/integrations/supabase/client";

// ─── Types ──────────────────────────────────────────────────────────────────

export type TrialResult = {
  floorsCleared: number;
  fullClear: boolean;
  fallen: Array<{ name: string; role: string; rarity: string; star_level: number; bond_percent: number }>;
  rewards: Array<{ type: string; name: string; qty: number }>;
  echoTouched: boolean;
};

const TRIAL_FLOORS = 20;
const COOLDOWN_DAYS = 7;

// ─── Cooldown check ─────────────────────────────────────────────────────────

export async function getTrialCooldown(): Promise<{ canStart: boolean; daysRemaining: number }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { canStart: false, daysRemaining: 0 };

  const { data: profile } = await supabase
    .from("profiles")
    .select("last_trial_at")
    .eq("id", user.id)
    .single();
  if (!profile?.last_trial_at) return { canStart: true, daysRemaining: 0 };

  const elapsed = (Date.now() - Date.parse(profile.last_trial_at)) / (1000 * 86400);
  const remaining = Math.max(0, COOLDOWN_DAYS - elapsed);
  return { canStart: remaining === 0, daysRemaining: Math.ceil(remaining) };
}

// ─── Run the trial ──────────────────────────────────────────────────────────

export async function runTrial(teamUserMonsterIds: string[]): Promise<TrialResult> {
  if (teamUserMonsterIds.length !== 5) {
    throw new Error("Trial of Echoes requires exactly 5 monsters.");
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Cooldown check
  const cd = await getTrialCooldown();
  if (!cd.canStart) {
    throw new Error(`Trial on cooldown for ${cd.daysRemaining} more day${cd.daysRemaining === 1 ? "" : "s"}.`);
  }

  // Load team
  const { data: team } = await supabase
    .from("user_monsters")
    .select("id, level, bond_percent, star_level, awakened_skills, monster:monsters(name, role, rarity, base_atk, base_def, base_hp)")
    .in("id", teamUserMonsterIds);
  if (!team || team.length !== 5) throw new Error("Could not load full team.");

  // Per-monster simulated state
  type SimMon = {
    id: string;
    name: string;
    role: string;
    rarity: string;
    star_level: number;
    bond_percent: number;
    hp: number;
    maxHp: number;
    atk: number;
    def: number;
    alive: boolean;
  };
  const sim: SimMon[] = team.map((um) => {
    const m = um.monster as unknown as { name: string; role: string; rarity: string; base_atk: number; base_def: number; base_hp: number };
    const levelMult = 1 + um.level * 0.05;
    const starMult = 1 + (um.star_level - 1) * 0.15;
    return {
      id: um.id,
      name: m.name,
      role: m.role,
      rarity: m.rarity,
      star_level: um.star_level,
      bond_percent: um.bond_percent,
      maxHp: Math.round(m.base_hp * levelMult * starMult),
      hp: Math.round(m.base_hp * levelMult * starMult),
      atk: Math.round(m.base_atk * levelMult * starMult),
      def: Math.round(m.base_def * levelMult * starMult),
      alive: true,
    };
  });

  let floorsCleared = 0;

  for (let floor = 1; floor <= TRIAL_FLOORS; floor++) {
    const aliveTeam = sim.filter((s) => s.alive);
    if (aliveTeam.length === 0) break;

    // Procedural enemy: scales with floor
    const enemyMaxHp = Math.round(500 + floor * 80);
    let enemyHp = enemyMaxHp;
    const enemyAtk = Math.round(40 + floor * 6);
    const enemyDef = Math.round(20 + floor * 3);

    let round = 0;
    while (enemyHp > 0 && aliveTeam.some((s) => s.alive) && round < 30) {
      round++;
      // Team attack: sum of atk - enemy def, split contribution
      const teamAtk = aliveTeam.filter((s) => s.alive).reduce((sum, s) => sum + s.atk, 0);
      const dmg = Math.max(1, Math.round(teamAtk - enemyDef * 0.5 + Math.random() * 20));
      enemyHp = Math.max(0, enemyHp - dmg);
      if (enemyHp <= 0) break;

      // Enemy attack: targets a random alive monster
      const livingIdx = aliveTeam.map((_, i) => i).filter((i) => aliveTeam[i].alive);
      if (livingIdx.length === 0) break;
      const targetIdx = livingIdx[Math.floor(Math.random() * livingIdx.length)];
      const target = aliveTeam[targetIdx];
      const incoming = Math.max(1, Math.round(enemyAtk - target.def * 0.4 + Math.random() * 15));
      target.hp = Math.max(0, target.hp - incoming);
      if (target.hp === 0) target.alive = false;
    }

    if (enemyHp > 0) break; // wipe
    floorsCleared++;
  }

  // Apply permadeath: delete fallen user_monsters
  const fallen: TrialResult["fallen"] = sim.filter((s) => !s.alive).map((s) => ({
    name: s.name, role: s.role, rarity: s.rarity,
    star_level: s.star_level, bond_percent: s.bond_percent,
  }));

  const fallenIds = sim.filter((s) => !s.alive).map((s) => s.id);
  if (fallenIds.length > 0) {
    await supabase.from("user_monsters").delete().in("id", fallenIds);
  }

  const fullClear = floorsCleared === TRIAL_FLOORS && fallen.length === 0;

  // Rewards
  const rewards: TrialResult["rewards"] = [];
  if (fullClear) {
    rewards.push({ type: "tome", name: "Tome of Reverse Heaven", qty: 2 });
  } else if (floorsCleared >= 10) {
    rewards.push({ type: "tome_shard", name: "Tome Shard", qty: 3 });
  } else if (floorsCleared >= 5) {
    rewards.push({ type: "material", name: "Granite Core", qty: 2 });
  }

  // Apply rewards to inventory
  for (const r of rewards) {
    const { data: existing } = await supabase
      .from("inventory")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("item_type", r.type)
      .eq("item_name", r.name)
      .maybeSingle();
    if (existing) {
      await supabase.from("inventory").update({ quantity: existing.quantity + r.qty }).eq("id", existing.id);
    } else {
      await supabase.from("inventory").insert({ user_id: user.id, item_type: r.type, item_name: r.name, quantity: r.qty });
    }
  }

  // Update profile: cooldown + echo_touched flag
  const updates: Record<string, unknown> = { last_trial_at: new Date().toISOString() };
  let echoTouched = false;
  if (fullClear) {
    const { data: profile } = await supabase.from("profiles").select("echo_touched").eq("id", user.id).single();
    if (profile && !profile.echo_touched) {
      updates.echo_touched = true;
      echoTouched = true;
    }
  }
  await supabase.from("profiles").update(updates).eq("id", user.id);

  // Log the run
  await supabase.from("trial_runs").insert({
    user_id: user.id,
    team_user_monster_ids: teamUserMonsterIds,
    floors_cleared: floorsCleared,
    fallen,
    full_clear: fullClear,
    rewards,
  });

  return { floorsCleared, fullClear, fallen, rewards, echoTouched };
}

// ─── Memorial: list fallen across all trials ────────────────────────────────

export async function listMemorial() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { memorials: [] };

  const { data, error } = await supabase
    .from("trial_runs")
    .select("id, fallen, floors_cleared, full_clear, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return { memorials: data ?? [] };
}
