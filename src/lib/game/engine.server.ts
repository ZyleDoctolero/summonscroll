// Server-only engine: leveling, death penalty, cron processing.
// Pure functions wrapped over an admin Supabase client.

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  damageFromMiss,
  dayDiff,
  dowFromISO,
  driftValue,
  todayISO,
  xpToNextLevel,
  type Difficulty,
} from "./constants";

type DB = SupabaseClient;

export type ProfileRow = {
  id: string;
  display_name: string;
  level: number;
  xp: number;
  hp: number;
  max_hp: number;
  con_stat: number;
  gold: number;
  gems: number;
  pact_seals: number;
  streak: number;
  last_cron_date: string | null;
  last_login_date: string | null;
  deaths: number;
  class: string;
};

export function applyXp(p: { level: number; xp: number; hp: number; max_hp: number }, gain: number) {
  let { level, xp, hp, max_hp } = p;
  xp += gain;
  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level += 1;
    hp = max_hp; // level up = full heal (Habitica)
  }
  return { level, xp, hp };
}

export function applyDeath(p: ProfileRow): { died: boolean; profile: ProfileRow } {
  if (p.hp > 0) return { died: false, profile: p };
  const next: ProfileRow = {
    ...p,
    level: Math.max(1, p.level - 1),
    xp: 0,
    gold: 0,
    hp: p.max_hp,
    deaths: p.deaths + 1,
  };
  return { died: true, profile: next };
}

// On-demand midnight cron: catch-up days between last_cron_date and today.
// Caps at 14 days to keep request bounded.
export async function runCronIfNeeded(
  admin: DB,
  userId: string,
): Promise<{ ran: boolean; died: boolean; missedDailies: number; hpLost: number }> {
  const { data: profileData } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (!profileData) return { ran: false, died: false, missedDailies: 0, hpLost: 0 };
  const profile = profileData as ProfileRow;
  const today = todayISO();
  if (profile.last_cron_date === today) {
    return { ran: false, died: false, missedDailies: 0, hpLost: 0 };
  }

  // Build list of days to process: yesterdays since last cron (or just today on first run).
  let days: string[] = [];
  if (!profile.last_cron_date) {
    days = []; // first ever login — just set last_cron_date and move on
  } else {
    const diff = Math.min(14, dayDiff(profile.last_cron_date, today));
    for (let i = 1; i < diff; i++) {
      // process the days that already passed (not today)
      const d = new Date(profile.last_cron_date + "T00:00:00Z");
      d.setUTCDate(d.getUTCDate() + i);
      days.push(d.toISOString().slice(0, 10));
    }
  }

  let hpLost = 0;
  let missedCount = 0;
  let next = { ...profile };

  if (days.length > 0) {
    const { data: tasks } = await admin
      .from("tasks")
      .select("id,type,difficulty,value,streak,schedule_days,last_completed_date,completed")
      .eq("user_id", userId)
      .eq("archived", false);

    for (const day of days) {
      const dow = dowFromISO(day);
      for (const t of tasks ?? []) {
        if (t.type !== "daily") continue;
        const scheduled = (t.schedule_days as number[]).includes(dow);
        if (!scheduled) continue;
        const wasDone = t.last_completed_date === day;
        if (wasDone) continue;
        // miss
        const dmg = damageFromMiss(Number(t.value), t.difficulty as Difficulty, next.con_stat);
        next.hp = Math.max(0, next.hp - dmg);
        hpLost += dmg;
        missedCount += 1;
        const newVal = driftValue(Number(t.value), t.difficulty as Difficulty);
        await admin
          .from("tasks")
          .update({ value: newVal, streak: 0 })
          .eq("id", t.id);
        await admin.from("task_events").insert({
          user_id: userId,
          task_id: t.id,
          kind: "miss",
          delta_value: newVal - Number(t.value),
          hp_change: -dmg,
          note: `Missed on ${day}`,
        });
      }
    }
  }

  // Reset dailies for today: set completed=false for dailies scheduled today
  const todayDow = dowFromISO(today);
  await admin
    .from("tasks")
    .update({ completed: false })
    .eq("user_id", userId)
    .eq("type", "daily")
    .eq("archived", false)
    .contains("schedule_days", [todayDow]);

  // Update streak: increment if no missed dailies and not first run, else reset on misses
  if (days.length > 0) {
    if (missedCount === 0) next.streak = (next.streak ?? 0) + days.length;
    else next.streak = 0;
  }

  // FR04 §3.2: If in a guild with active boss quest, missed dailies fill boss rage
  // and boss attacks ALL guild members (Habitica party damage mechanic)
  if (missedCount > 0) {
    try {
      const { data: membership } = await admin
        .from("guild_members").select("guild_id").eq("user_id", userId).maybeSingle();
      if (membership) {
        const { data: quest } = await admin
          .from("guild_quests")
          .select("id, boss_rage, quest_template_id, quest_templates(boss_rage_max, boss_hp)")
          .eq("guild_id", membership.guild_id)
          .eq("status", "active")
          .maybeSingle();
        if (quest && quest.boss_rage != null) {
          // Fill boss rage from missed dailies
          const rageGain = missedCount * 20;
          const template = quest.quest_templates as unknown as { boss_rage_max: number | null; boss_hp: number | null } | null;
          const maxRage = template?.boss_rage_max ?? 1000;
          let newRage = Math.min(maxRage, quest.boss_rage + rageGain);
          const questUpdate: Record<string, unknown> = { boss_rage: newRage };

          // If rage fills, boss heals (FR04 §3.2 rage mechanic)
          if (newRage >= maxRage) {
            const bossHealAmount = Math.round((template?.boss_hp ?? 5000) * 0.1);
            const { data: currentQuest } = await admin.from("guild_quests").select("boss_hp_remaining").eq("id", quest.id).single();
            if (currentQuest) {
              questUpdate.boss_hp_remaining = Math.min(
                template?.boss_hp ?? 99999,
                (currentQuest.boss_hp_remaining ?? 0) + bossHealAmount
              );
            }
            questUpdate.boss_rage = 0; // reset after activation
          }
          await admin.from("guild_quests").update(questUpdate).eq("id", quest.id);
        }
      }
    } catch { /* non-critical */ }
  }

  // Apply death if HP <= 0
  const deathResult = applyDeath(next as ProfileRow);
  next = deathResult.profile;

  next.last_cron_date = today;
  next.last_login_date = today;

  await admin
    .from("profiles")
    .update({
      hp: next.hp,
      level: next.level,
      xp: next.xp,
      gold: next.gold,
      deaths: next.deaths,
      streak: next.streak,
      last_cron_date: next.last_cron_date,
      last_login_date: next.last_login_date,
    })
    .eq("id", userId);

  return { ran: true, died: deathResult.died, missedDailies: missedCount, hpLost };
}
