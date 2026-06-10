import { supabase } from "@/integrations/supabase/client";

// ─── Types ──────────────────────────────────────────────────────────────────

export type GoalType = "quarterly" | "monthly" | "weekly";
export type GoalStatus = "active" | "slain" | "expired";

export type Goal = {
  id: string;
  user_id: string;
  title: string;
  identity: string | null;
  type: GoalType;
  status: GoalStatus;
  hp_total: number;
  hp_remaining: number;
  starts_at: string;
  deadline: string;
  slain_at: string | null;
  created_at: string;
};

// ─── Defaults per goal type ────────────────────────────────────────────────

const GOAL_DEFAULTS: Record<GoalType, { hp: number; days: number }> = {
  quarterly: { hp: 10000, days: 90 },
  monthly:   { hp: 3500,  days: 30 },
  weekly:    { hp: 800,   days: 7 },
};

// ─── CRUD ──────────────────────────────────────────────────────────────────

export async function listGoals(status?: GoalStatus) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { goals: [] };

  let q = supabase.from("goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return { goals: (data ?? []) as Goal[] };
}

export async function createGoal(input: { title: string; type: GoalType; identity?: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const def = GOAL_DEFAULTS[input.type];
  const now = new Date();
  const deadline = new Date(now.getTime() + def.days * 86400 * 1000);

  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      identity: input.identity?.trim() || null,
      type: input.type,
      hp_total: def.hp,
      hp_remaining: def.hp,
      starts_at: now.toISOString(),
      deadline: deadline.toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return { goal: data as Goal };
}

export async function deleteGoal(goalId: string) {
  // Unlink any tasks first
  await supabase.from("tasks").update({ goal_id: null }).eq("goal_id", goalId);
  const { error } = await supabase.from("goals").delete().eq("id", goalId);
  if (error) throw error;
  return { ok: true };
}

export async function linkTaskToGoal(taskId: string, goalId: string | null) {
  const { error } = await supabase.from("tasks").update({ goal_id: goalId }).eq("id", taskId);
  if (error) throw error;
  return { ok: true };
}

// ─── Damage application (called from scoreTask) ─────────────────────────────

export async function damageGoalsForTask(
  userId: string,
  taskId: string,
  damageBase: number
): Promise<{ slain: Goal[]; damaged: Array<{ goal: Goal; damage: number }>; tomeMinted: boolean }> {
  const { data: task } = await supabase
    .from("tasks")
    .select("goal_id, value, difficulty")
    .eq("id", taskId)
    .single();
  if (!task || !task.goal_id) return { slain: [], damaged: [], tomeMinted: false };

  const { data: goal } = await supabase
    .from("goals")
    .select("*")
    .eq("id", task.goal_id)
    .eq("status", "active")
    .maybeSingle();
  if (!goal) return { slain: [], damaged: [], tomeMinted: false };

  const newHp = Math.max(0, goal.hp_remaining - damageBase);
  const slainNow = newHp === 0;

  const updates: Record<string, unknown> = { hp_remaining: newHp };
  if (slainNow) {
    updates.status = "slain";
    updates.slain_at = new Date().toISOString();
  }

  const { data: updated } = await supabase
    .from("goals")
    .update(updates)
    .eq("id", goal.id)
    .select()
    .single();

  let tomeMinted = false;
  if (slainNow) {
    // Mint Tome of Reverse Heaven into inventory
    const { data: existing } = await supabase
      .from("inventory")
      .select("id, quantity")
      .eq("user_id", userId)
      .eq("item_type", "tome")
      .eq("item_name", "Tome of Reverse Heaven")
      .maybeSingle();
    if (existing) {
      await supabase.from("inventory").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
    } else {
      await supabase.from("inventory").insert({
        user_id: userId,
        item_type: "tome",
        item_name: "Tome of Reverse Heaven",
        quantity: 1,
      });
    }
    tomeMinted = true;
  }

  return {
    slain: slainNow ? [updated as Goal] : [],
    damaged: !slainNow ? [{ goal: updated as Goal, damage: damageBase }] : [],
    tomeMinted,
  };
}
