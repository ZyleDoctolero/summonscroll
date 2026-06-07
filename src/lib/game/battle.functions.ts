import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { applyXp, applyDeath, type ProfileRow } from "./engine.server";

export const getTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_monsters")
      .select("*, monster:monsters(*)")
      .eq("is_on_team", true)
      .order("team_slot");
    if (error) throw error;
    return { team: data ?? [] };
  });

export const getTowerProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("tower_progress")
      .select("*")
      .maybeSingle();
    return { progress: data ?? { highest_floor: 0 } };
  });

export const startArenaBattle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      mode: z.enum(["chaos_tower", "event", "boss_rush"]),
      floor: z.number().int().min(1).default(1),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    // Load team
    const { data: team } = await supabaseAdmin
      .from("user_monsters")
      .select("*, monster:monsters(*)")
      .eq("user_id", userId)
      .eq("is_on_team", true);

    if (!team || team.length < 3) throw new Error("Need at least 3 monsters on your team.");

    // Load profile
    const { data: profile } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).single();
    if (!profile) throw new Error("Profile not found");

    // Calculate team power
    const teamPower = team.reduce((sum, um) => {
      const m = um.monster;
      const power = (m.base_atk + m.base_def + m.base_hp / 10) * (1 + um.level * 0.05);
      // FATIGUED penalty: if bond < 10, reduce power by 30%
      const fatiguePenalty = um.bond_percent < 10 ? 0.7 : 1;
      return sum + Math.round(power * fatiguePenalty);
    }, 0);

    const teamHp = team.reduce((sum, um) => sum + Math.round(um.monster.base_hp * (1 + um.level * 0.05)), 0);

    // Generate enemy
    const enemyScale = 1 + data.floor * 0.15;
    const enemy = {
      name: generateEnemyName(data.floor),
      hp: Math.round(500 * enemyScale),
      atk: Math.round(30 * enemyScale),
      def: Math.round(15 * enemyScale),
    };

    // Simulate battle
    let playerHp = teamHp;
    let enemyHp = enemy.hp;
    const log: Array<{ round: number; actor: string; action: string; damage: number }> = [];
    let round = 0;

    while (playerHp > 0 && enemyHp > 0 && round < 50) {
      round++;
      // Player attacks
      const playerDmg = Math.max(1, Math.round(teamPower / team.length - enemy.def * 0.3 + Math.random() * 20));
      enemyHp = Math.max(0, enemyHp - playerDmg);
      log.push({ round, actor: "player", action: "Team Attack", damage: playerDmg });
      if (enemyHp <= 0) break;

      // Enemy attacks
      const enemyDmg = Math.max(1, Math.round(enemy.atk - teamPower * 0.01 + Math.random() * 10));
      playerHp = Math.max(0, playerHp - enemyDmg);
      log.push({ round, actor: "enemy", action: `${enemy.name} attacks`, damage: enemyDmg });
    }

    const won = enemyHp <= 0;
    const base = Math.floor(data.floor / 5) + 1;
    const rewardGems = won ? base * 15 : 5;
    const rewardXp = won ? base * 30 : 10;
    const rewardShards = won && data.floor % 10 === 0 ? 1 : 0;

    // Save battle
    await supabaseAdmin.from("arena_battles").insert({
      user_id: userId,
      mode: data.mode,
      floor: data.floor,
      team_ids: team.map((t) => t.id),
      team_power: teamPower,
      enemy_name: enemy.name,
      enemy_hp: enemy.hp,
      player_won: won,
      rounds: round,
      battle_log: log,
      reward_gems: rewardGems,
      reward_xp: rewardXp,
      reward_shards: rewardShards,
    });

    // Apply rewards
    let next = { ...profile } as ProfileRow;
    next.gems = next.gems + rewardGems;
    next.pact_seals = next.pact_seals + rewardShards;
    const lvl = applyXp(next, rewardXp);
    next.level = lvl.level;
    next.xp = lvl.xp;
    next.hp = lvl.hp;

    await supabaseAdmin.from("profiles").update({
      gems: next.gems, pact_seals: next.pact_seals,
      level: next.level, xp: next.xp, hp: next.hp,
    }).eq("id", userId);

    // Update tower progress
    if (won && data.mode === "chaos_tower") {
      await supabaseAdmin.from("tower_progress").upsert(
        { user_id: userId, highest_floor: Math.max(data.floor, 0) },
        { onConflict: "user_id" },
      );
    }

    // Add bond XP to team monsters — victories grant meaningful bond progress
    if (won) {
      const bondPerMonster = 1 + Math.floor(data.floor / 10); // higher floors = more bond
      for (const um of team) {
        const newBond = Math.min(100, Number(um.bond_percent) + bondPerMonster);
        const newXp = um.xp + rewardXp;
        const newLevel = um.level + (newXp >= um.level * 50 ? 1 : 0);
        await supabaseAdmin.from("user_monsters").update({
          bond_percent: newBond,
          xp: newXp >= um.level * 50 ? 0 : newXp,
          level: Math.min(100, newLevel),
        }).eq("id", um.id);
      }
    }

    return {
      won,
      rounds: round,
      playerHp, playerMaxHp: teamHp,
      enemyHp, enemyMaxHp: enemy.hp,
      enemyName: enemy.name,
      log,
      rewards: { gems: rewardGems, xp: rewardXp, shards: rewardShards },
    };
  });

export const getBattleHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("arena_battles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return { battles: data ?? [] };
  });

function generateEnemyName(floor: number): string {
  const prefixes = ["Shadow", "Flame", "Frost", "Void", "Chaos", "Iron", "Blood", "Storm"];
  const creatures = ["Drake", "Golem", "Wraith", "Behemoth", "Sentinel", "Hydra", "Chimera", "Titan"];
  const p = prefixes[floor % prefixes.length];
  const c = creatures[Math.floor(floor / prefixes.length) % creatures.length];
  return `${p} ${c}`;
}
