import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  applyXp,
  nextValueMinus,
  nextValuePlus,
  rewardGems,
  rewardGold,
  rewardXp,
  damageFromMiss,
  todayISO,
  type Difficulty,
} from "./constants";
import { applyDeath, type ProfileRow } from "./engine.server";

const TaskInput = z.object({
  type: z.enum(["habit", "daily", "todo"]),
  title: z.string().trim().min(1).max(120),
  notes: z.string().max(2000).optional().nullable(),
  category: z.string().max(40).optional().nullable(),
  difficulty: z.enum(["trivial", "easy", "medium", "hard"]).default("easy"),
  positive_enabled: z.boolean().default(true),
  negative_enabled: z.boolean().default(false),
  schedule_days: z.array(z.number().int().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
  due_date: z.string().nullable().optional(),
});

export const listTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("tasks")
      .select("*")
      .eq("archived", false)
      .order("type")
      .order("sort_order")
      .order("created_at");
    if (error) throw error;
    return { tasks: data ?? [] };
  });

export const createTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TaskInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("tasks")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw error;
    return { task: row };
  });

export const updateTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        patch: TaskInput.partial().extend({
          archived: z.boolean().optional(),
          completed: z.boolean().optional(),
        }),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("tasks")
      .update(data.patch)
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("tasks")
      .update({ archived: true })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/**
 * Score a task: +/- on a habit, complete/uncomplete on a daily or todo.
 */
export const scoreTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        direction: z.enum(["plus", "minus", "complete", "uncomplete"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    // Load task + profile in parallel
    const [taskRes, profileRes] = await Promise.all([
      supabaseAdmin.from("tasks").select("*").eq("id", data.id).eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("profiles").select("*").eq("id", userId).maybeSingle(),
    ]);
    if (taskRes.error) throw taskRes.error;
    if (profileRes.error) throw profileRes.error;
    const task = taskRes.data;
    const profile = profileRes.data as ProfileRow | null;
    if (!task || !profile) throw new Error("Task or profile not found");
    if (task.archived) throw new Error("Task archived");

    const diff = task.difficulty as Difficulty;
    const today = todayISO();
    let newVal = Number(task.value);
    let goldGain = 0;
    let xpGain = 0;
    let gemGain = 0;
    let hpChange = 0;
    let newStreak = task.streak as number;
    let completed = task.completed as boolean;
    let lastCompletedDate = task.last_completed_date as string | null;
    let lastCompletedAt = task.last_completed_at as string | null;
    const isPositive = data.direction === "plus" || data.direction === "complete";

    if (data.direction === "plus") {
      if (!task.positive_enabled) throw new Error("Positive disabled");
      newVal = nextValuePlus(newVal);
      goldGain = rewardGold(Number(task.value), diff);
      xpGain = rewardXp(Number(task.value), diff);
      gemGain = Math.random() < 0.25 ? rewardGems(Number(task.value), diff) : 0;
      newStreak = newStreak + 1;
      lastCompletedAt = new Date().toISOString();
    } else if (data.direction === "minus") {
      if (!task.negative_enabled) throw new Error("Negative disabled");
      newVal = nextValueMinus(newVal);
      hpChange = -damageFromMiss(Number(task.value), diff, profile.con_stat);
      newStreak = 0;
    } else if (data.direction === "complete") {
      if (completed) return { ok: true, noop: true };
      newVal = nextValuePlus(newVal);
      goldGain = rewardGold(Number(task.value), diff);
      xpGain = rewardXp(Number(task.value), diff);
      gemGain = Math.random() < 0.3 ? rewardGems(Number(task.value), diff) : 0;
      completed = true;
      lastCompletedDate = today;
      lastCompletedAt = new Date().toISOString();
      newStreak = task.type === "daily" ? newStreak + 1 : newStreak;
    } else if (data.direction === "uncomplete") {
      if (!completed) return { ok: true, noop: true };
      newVal = nextValueMinus(newVal);
      goldGain = -rewardGold(Number(task.value), diff);
      xpGain = -Math.min(profile.xp, rewardXp(Number(task.value), diff));
      completed = false;
      lastCompletedDate = null;
      newStreak = Math.max(0, newStreak - 1);
    }

    // Update task
    await supabaseAdmin
      .from("tasks")
      .update({
        value: newVal,
        streak: newStreak,
        completed,
        last_completed_date: lastCompletedDate,
        last_completed_at: lastCompletedAt,
      })
      .eq("id", task.id);

    // Update profile: gold/xp/hp; level up; death
    let next = { ...profile };
    next.gold = Math.max(0, next.gold + goldGain);
    next.gems = Math.max(0, next.gems + gemGain);
    next.hp = Math.max(0, Math.min(next.max_hp, next.hp + hpChange));
    const lvl = applyXp(next, xpGain);
    next.level = lvl.level;
    next.xp = Math.max(0, lvl.xp);
    next.hp = lvl.hp;

    const death = applyDeath(next as ProfileRow);
    next = death.profile;

    await supabaseAdmin
      .from("profiles")
      .update({
        gold: next.gold,
        gems: next.gems,
        hp: next.hp,
        xp: next.xp,
        level: next.level,
        deaths: next.deaths,
      })
      .eq("id", userId);

    await supabaseAdmin.from("task_events").insert({
      user_id: userId,
      task_id: task.id,
      kind: data.direction,
      delta_value: newVal - Number(task.value),
      reward_gold: goldGain,
      reward_xp: xpGain,
      reward_gems: gemGain,
      hp_change: hpChange,
    });

    return {
      ok: true,
      reward: { gold: goldGain, xp: xpGain, gems: gemGain, hp: hpChange },
      newValue: newVal,
      died: death.died,
      isPositive,
    };
  });
