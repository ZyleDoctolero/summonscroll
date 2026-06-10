import { supabase } from "@/integrations/supabase/client";
import { xpToNextLevel } from "./constants";

export async function startArenaBattle(mode: "chaos_tower" | "event" | "boss_rush", floor: number) {
  const WEAKNESSES: Record<string, string> = { "Fire": "Water", "Water": "Nature", "Nature": "Fire", "Earth": "Air", "Air": "Earth", "Shadow": "Light", "Light": "Shadow", "Arcane": "Arcane" };
  const ENEMY_ELEMENTS: Record<string, string> = { "Shadow": "Shadow", "Flame": "Fire", "Frost": "Water", "Void": "Shadow", "Chaos": "Arcane", "Iron": "Earth", "Blood": "Water", "Storm": "Air" };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: team } = await supabase.from("user_monsters").select("*, monster:monsters(*)").eq("is_on_team", true);
  if (!team || team.length < 3) throw new Error("Need at least 3 monsters on your team.");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) throw new Error("Profile not found");

  const basePower = team.reduce((sum, um) => {
    const m = um.monster;
    const power = (m.base_atk + m.base_def + m.base_hp / 10) * (1 + um.level * 0.05);
    return sum + Math.round(power * (um.bond_percent < 10 ? 0.7 : 1));
  }, 0);

  const realmCounts = Object.values(team.reduce((acc: Record<string, number>, t) => { acc[t.monster.realm_id] = (acc[t.monster.realm_id] || 0) + 1; return acc; }, {}));
  const elementCounts = Object.values(team.reduce((acc: Record<string, number>, t) => { acc[t.monster.element] = (acc[t.monster.element] || 0) + 1; return acc; }, {}));
  
  const realmSynergy = realmCounts.some(c => (c as number) >= 3);
  const elementSynergy = elementCounts.some(c => (c as number) >= 2);
  
  let synergyMult = 1.0;
  if (realmSynergy) synergyMult += 0.15;
  if (elementSynergy) synergyMult += 0.05;

  const teamPower = Math.round(basePower * synergyMult);
  const teamHp = team.reduce((sum, um) => sum + Math.round(um.monster.base_hp * (1 + um.level * 0.05)), 0);

  if (mode === "boss_rush") {
    let playerHp = teamHp;
    let totalRounds = 0;
    const log: Array<{ round: number; actor: string; action: string; damage: number }> = [];
    let wonAll = true;
    
    for (let encounter = 1; encounter <= 5; encounter++) {
      const eScale = 1 + (encounter * 5) * 0.15;
      const prefixes = ["Shadow", "Flame", "Frost", "Void", "Chaos", "Iron", "Blood", "Storm"];
      const creatures = ["Drake", "Golem", "Wraith", "Behemoth", "Sentinel", "Hydra", "Chimera", "Titan"];
      const prefix = prefixes[encounter % 8];
      const enemyName = `Boss ${encounter}: ${prefix} ${creatures[encounter % 8]}`;
      const enemy = { name: enemyName, hp: Math.round(500 * eScale), atk: Math.round(30 * eScale), def: Math.round(15 * eScale), element: ENEMY_ELEMENTS[prefix] };
      let enemyHp = enemy.hp;

      let teamElementalAdvantage = 0;
      for (const um of team) {
        if (WEAKNESSES[enemy.element] === um.monster.element) teamElementalAdvantage += 1;
        if (WEAKNESSES[um.monster.element] === enemy.element) teamElementalAdvantage -= 1;
      }
      const effectiveTeamPower = Math.round(teamPower * (1 + (teamElementalAdvantage * 0.1)));

      log.push({ round: totalRounds, actor: "system", action: `--- Encounter ${encounter}: ${enemy.name} (${enemy.element}) ---`, damage: 0 });
      if (teamElementalAdvantage !== 0) {
        log.push({ round: totalRounds, actor: "system", action: `Elemental advantage: ${teamElementalAdvantage > 0 ? "+" : ""}${teamElementalAdvantage * 10}% Power`, damage: 0 });
      }

      while (playerHp > 0 && enemyHp > 0 && totalRounds < 150) {
        totalRounds++;
        const pDmg = Math.max(1, Math.round(effectiveTeamPower / team.length - enemy.def * 0.3 + Math.random() * 20));
        enemyHp = Math.max(0, enemyHp - pDmg);
        log.push({ round: totalRounds, actor: "player", action: "Team Attack", damage: pDmg });
        if (enemyHp <= 0) break;
        const eDmg = Math.max(1, Math.round(enemy.atk - effectiveTeamPower * 0.01 + Math.random() * 10));
        playerHp = Math.max(0, playerHp - eDmg);
        log.push({ round: totalRounds, actor: "enemy", action: `${enemy.name} attacks`, damage: eDmg });
      }

      if (playerHp <= 0) {
        wonAll = false;
        break;
      }
    }

    const rewardCrystals = wonAll ? 150 : 20;
    const rewardXp = wonAll ? 300 : 50;
    const rewardShards = wonAll ? 5 : 0;

    await supabase.from("arena_battles").insert({
      user_id: user.id, mode, floor: 1, team_ids: team.map((t) => t.id), team_power: teamPower,
      enemy_name: "Boss Rush Gauntlet", enemy_hp: 5000, player_won: wonAll, rounds: totalRounds,
      battle_log: log, reward_crystals: rewardCrystals, reward_xp: rewardXp, reward_shards: rewardShards,
    });

    let newCrystals = profile.crystals + rewardCrystals, newSeals = profile.pact_seals + rewardShards;
    let newLevel = profile.level, newXp = profile.xp + rewardXp, newHp = profile.hp;
    while (newXp >= xpToNextLevel(newLevel)) { newXp -= xpToNextLevel(newLevel); newLevel++; newHp = profile.max_hp; }
    await supabase.from("profiles").update({ crystals: newCrystals, pact_seals: newSeals, level: newLevel, xp: newXp, hp: newHp }).eq("id", user.id);

    return { won: wonAll, rounds: totalRounds, playerHp, playerMaxHp: teamHp, enemyHp: 0, enemyMaxHp: 5000, enemyName: "Boss Rush Gauntlet", log, rewards: { crystals: rewardCrystals, xp: rewardXp, shards: rewardShards } };
  }

  // --- Normal Battle (Chaos Tower) ---
  const enemyScale = 1 + floor * 0.15;
  const prefixes = ["Shadow", "Flame", "Frost", "Void", "Chaos", "Iron", "Blood", "Storm"];
  const creatures = ["Drake", "Golem", "Wraith", "Behemoth", "Sentinel", "Hydra", "Chimera", "Titan"];
  const prefix = prefixes[floor % 8];
  const enemyName = `${prefix} ${creatures[Math.floor(floor / 8) % 8]}`;
  const enemy = { name: enemyName, hp: Math.round(500 * enemyScale), atk: Math.round(30 * enemyScale), def: Math.round(15 * enemyScale), element: ENEMY_ELEMENTS[prefix] };

  let teamElementalAdvantage = 0;
  for (const um of team) {
    if (WEAKNESSES[enemy.element] === um.monster.element) teamElementalAdvantage += 1;
    if (WEAKNESSES[um.monster.element] === enemy.element) teamElementalAdvantage -= 1;
  }
  const effectiveTeamPower = Math.round(teamPower * (1 + (teamElementalAdvantage * 0.1)));

  let playerHp = teamHp, enemyHp = enemy.hp, round = 0;
  const log: Array<{ round: number; actor: string; action: string; damage: number }> = [];

  log.push({ round: 0, actor: "system", action: `Enemy element: ${enemy.element}`, damage: 0 });
  if (teamElementalAdvantage !== 0) {
    log.push({ round: 0, actor: "system", action: `Elemental advantage: ${teamElementalAdvantage > 0 ? "+" : ""}${teamElementalAdvantage * 10}% Power`, damage: 0 });
  }

  while (playerHp > 0 && enemyHp > 0 && round < 50) {
    round++;
    const pDmg = Math.max(1, Math.round(effectiveTeamPower / team.length - enemy.def * 0.3 + Math.random() * 20));
    enemyHp = Math.max(0, enemyHp - pDmg);
    log.push({ round, actor: "player", action: "Team Attack", damage: pDmg });
    if (enemyHp <= 0) break;
    const eDmg = Math.max(1, Math.round(enemy.atk - effectiveTeamPower * 0.01 + Math.random() * 10));
    playerHp = Math.max(0, playerHp - eDmg);
    log.push({ round, actor: "enemy", action: `${enemy.name} attacks`, damage: eDmg });
  }

  const won = enemyHp <= 0;
  const base = Math.floor(floor / 5) + 1;
  const rewardCrystals = won ? base * 15 : 5;
  const rewardXp = won ? base * 30 : 10;
  const rewardShards = won && floor % 10 === 0 ? 1 : 0;

  await supabase.from("arena_battles").insert({
    user_id: user.id, mode, floor, team_ids: team.map((t) => t.id), team_power: teamPower,
    enemy_name: enemy.name, enemy_hp: enemy.hp, player_won: won, rounds: round,
    battle_log: log, reward_crystals: rewardCrystals, reward_xp: rewardXp, reward_shards: rewardShards,
  });

  let newCrystals = profile.crystals + rewardCrystals, newSeals = profile.pact_seals + rewardShards;
  let newLevel = profile.level, newXp = profile.xp + rewardXp, newHp = profile.hp;
  while (newXp >= xpToNextLevel(newLevel)) { newXp -= xpToNextLevel(newLevel); newLevel++; newHp = profile.max_hp; }

  await supabase.from("profiles").update({ crystals: newCrystals, pact_seals: newSeals, level: newLevel, xp: newXp, hp: newHp }).eq("id", user.id);

  if (won && mode === "chaos_tower") {
    await supabase.from("tower_progress").upsert({ user_id: user.id, highest_floor: Math.max(floor, 0) }, { onConflict: "user_id" });
    const bondGain = 1 + Math.floor(floor / 10);
    for (const um of team) {
      await supabase.from("user_monsters").update({ bond_percent: Math.min(100, Number(um.bond_percent) + bondGain) }).eq("id", um.id);
    }
  }

  return { won, rounds: round, playerHp, playerMaxHp: teamHp, enemyHp, enemyMaxHp: enemy.hp, enemyName: enemy.name, log, rewards: { crystals: rewardCrystals, xp: rewardXp, shards: rewardShards } };
}
