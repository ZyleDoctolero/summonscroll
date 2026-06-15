import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "./constants";

// ─── Types ──────────────────────────────────────────────────────────────────

export type DailyLog = {
  id: string;
  user_id: string;
  log_date: string;
  am_intent_task_ids: string[];
  am_completed_at: string | null;
  pm_went_well: string | null;
  pm_didnt_go: string | null;
  pm_mood: number | null;
  pm_energy: number | null;
  pm_tomorrow_anchor_task_id: string | null;
  pm_completed_at: string | null;
  reflection_pull_granted: boolean;
  reflection_pull_used: boolean;
  tome_shard_granted: boolean;
};

// ─── Get today's log (creating empty one if missing) ────────────────────────

export async function getTodayLog(): Promise<DailyLog> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const today = todayISO();
  const { data: existing } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("log_date", today)
    .maybeSingle();

  if (existing) return existing as DailyLog;

  const { data: created, error } = await supabase
    .from("daily_logs")
    .insert({ user_id: user.id, log_date: today })
    .select()
    .single();
  if (error) throw error;
  return created as DailyLog;
}

// ─── Morning Ritual ─────────────────────────────────────────────────────────

export async function setMorningIntents(taskIds: string[]): Promise<DailyLog> {
  if (taskIds.length === 0 || taskIds.length > 3) {
    throw new Error("Pick 1–3 Sacred Directives.");
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const today = todayISO();
  const now = new Date().toISOString();

  // Clear any prior starred marks today, then star the selected
  await supabase
    .from("tasks")
    .update({ is_starred: false })
    .eq("user_id", user.id)
    .eq("is_starred", true);
  await supabase.from("tasks").update({ is_starred: true }).in("id", taskIds);

  // Upsert daily log
  const { data: existing } = await supabase
    .from("daily_logs")
    .select("id")
    .eq("user_id", user.id)
    .eq("log_date", today)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("daily_logs")
      .update({ am_intent_task_ids: taskIds, am_completed_at: now })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as DailyLog;
  } else {
    const { data, error } = await supabase
      .from("daily_logs")
      .insert({
        user_id: user.id,
        log_date: today,
        am_intent_task_ids: taskIds,
        am_completed_at: now,
      })
      .select()
      .single();
    if (error) throw error;
    return data as DailyLog;
  }
}

// ─── Evening Reflection ─────────────────────────────────────────────────────

export type EveningReflection = {
  went_well: string;
  didnt_go: string;
  mood: number; // 1..5
  energy: number; // 1..5
  tomorrow_anchor_task_id?: string | null;
};

export async function submitEveningReflection(r: EveningReflection): Promise<{
  log: DailyLog;
  rewards: { tomeShard: boolean; reflectionPull: boolean; ritualStreak: number };
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const today = todayISO();
  const now = new Date().toISOString();

  // Get current log + check if all morning ⭐ were completed
  const { data: log } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("log_date", today)
    .maybeSingle();
  if (!log) throw new Error("Complete the Morning Ritual first.");

  const starredIds: string[] = log.am_intent_task_ids ?? [];
  let allStarredDone = false;
  if (starredIds.length > 0) {
    const { data: starredTasks } = await supabase
      .from("tasks")
      .select("id, completed, type, last_completed_date")
      .in("id", starredIds);
    allStarredDone = (starredTasks ?? []).every((t) => {
      // Habits: count as done if last_completed_date is today
      if (t.type === "habit") return t.last_completed_date === today;
      return Boolean(t.completed);
    });
  }

  // Reflection Pull when full ⭐ completion
  const grantReflectionPull = allStarredDone && !log.reflection_pull_granted;

  // Tome Shard: 1% per evening reflection regardless of completion (anchor reward)
  const grantTomeShard = !log.tome_shard_granted && Math.random() < 0.01;

  const update: Record<string, unknown> = {
    pm_went_well: r.went_well,
    pm_didnt_go: r.didnt_go,
    pm_mood: r.mood,
    pm_energy: r.energy,
    pm_tomorrow_anchor_task_id: r.tomorrow_anchor_task_id ?? null,
    pm_completed_at: now,
  };
  if (grantReflectionPull) update.reflection_pull_granted = true;
  if (grantTomeShard) update.tome_shard_granted = true;

  const { data: updated, error } = await supabase
    .from("daily_logs")
    .update(update)
    .eq("id", log.id)
    .select()
    .single();
  if (error) throw error;

  // Apply Tomb Shard to inventory
  if (grantTomeShard) {
    const { data: existing } = await supabase
      .from("inventory")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("item_type", "tome_shard")
      .eq("item_name", "Tome Shard")
      .maybeSingle();
    if (existing) {
      await supabase
        .from("inventory")
        .update({ quantity: existing.quantity + 1 })
        .eq("id", existing.id);
    } else {
      await supabase.from("inventory").insert({
        user_id: user.id,
        item_type: "tome_shard",
        item_name: "Tome Shard",
        quantity: 1,
      });
    }
  }

  // Pre-star tomorrow's anchor task if specified
  if (r.tomorrow_anchor_task_id) {
    await supabase.from("tasks").update({ is_starred: true }).eq("id", r.tomorrow_anchor_task_id);
  }

  // Meta-streak update: full both-ritual day increments streak
  const { data: profile } = await supabase
    .from("profiles")
    .select("ritual_streak")
    .eq("id", user.id)
    .single();
  const newStreak = (profile?.ritual_streak ?? 0) + 1;
  await supabase.from("profiles").update({ ritual_streak: newStreak }).eq("id", user.id);

  return {
    log: updated as DailyLog,
    rewards: {
      tomeShard: grantTomeShard,
      reflectionPull: grantReflectionPull,
      ritualStreak: newStreak,
    },
  };
}

// ─── Time helpers ───────────────────────────────────────────────────────────

export function isMorningWindow(): boolean {
  const h = new Date().getHours();
  return h >= 4 && h < 12;
}

export function isEveningWindow(windDownHour: number): boolean {
  const h = new Date().getHours();
  return h >= windDownHour && h < 24;
}

// ─── Consume Reflection Pull (called from the Altar) ────────────────────────

export async function consumeReflectionPull(): Promise<{ ok: boolean }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const today = todayISO();
  const { data: log } = await supabase
    .from("daily_logs")
    .select("id, reflection_pull_granted, reflection_pull_used")
    .eq("user_id", user.id)
    .eq("log_date", today)
    .maybeSingle();
  if (!log || !log.reflection_pull_granted || log.reflection_pull_used) {
    throw new Error("No Reflection Pull available.");
  }

  await supabase.from("daily_logs").update({ reflection_pull_used: true }).eq("id", log.id);
  return { ok: true };
}
