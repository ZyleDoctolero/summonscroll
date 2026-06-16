import { supabase } from "@/integrations/supabase/client";
import { type Difficulty, type TaskType } from "./constants";

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
  type: TaskType;
  title: string;
  notes?: string;
  category?: string;
  difficulty?: Difficulty;
  positive_enabled?: boolean;
  negative_enabled?: boolean;
  schedule_days?: number[];
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  const { error } = await supabase
    .from("tasks")
    .update(patch as any)
    .eq("id", id);
  if (error) throw error;
  return { ok: true };
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("tasks").update({ archived: true }).eq("id", id);
  if (error) throw error;
  return { ok: true };
}

export async function scoreTask(
  id: string,
  direction: "plus" | "minus" | "complete" | "uncomplete",
) {
  const { data, error } = await supabase.rpc("score_task", {
    p_task_id: id,
    p_direction: direction,
  });
  if (error) throw error;

  const res = data as any;
  if (!res.success) throw new Error(res.message);

  let awakenings: Array<{ monsterName: string; skillName: string; flavor: string }> = [];
  if (res.isPositive) {
    try {
      const { evaluateAwakenings } = await import("./awakening-client");
      awakenings = await evaluateAwakenings();
    } catch (e) {
      console.warn("Awakening evaluation skipped:", e);
    }
  }

  let goalDamage: any = null;
  if (res.isPositive && res.xp_gained > 0) {
    try {
      const { damageGoalsForTask } = await import("./quests-client");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        goalDamage = await damageGoalsForTask(user.id, id, res.xp_gained);
      }
    } catch (e) {
      console.warn("Goal damage skipped:", e);
    }
  }

  return {
    ok: true,
    reward: {
      gold: res.gold_gained,
      xp: res.xp_gained,
      crystals: res.crystal_gained ? 1 : 0,
      hp: -res.hp_lost,
    },
    isPositive: direction === "plus" || direction === "complete",
    died: res.died,
    drop: res.drops?.[0] ?? null,
    leveledUp: false,
    growthTicks: res.bond_ticks ?? [],
    awakenings,
    goalDamage,
  };
}
