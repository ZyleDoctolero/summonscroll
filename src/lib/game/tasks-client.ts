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

// The remote database can lag behind local migrations (columns like realm_id,
// element, due_time may not exist yet). PostgREST rejects the whole row when a
// payload key has no matching column, which used to make task creation fail
// outright. Detect that error, drop the offending key, and retry so the task
// still saves; report what was dropped so the UI can warn the user.
const MISSING_COLUMN_CODES = new Set(["PGRST204", "42703"]);

function missingColumnFromError(error: { code?: string; message?: string }): string | null {
  if (!error?.code || !MISSING_COLUMN_CODES.has(error.code)) return null;
  const m =
    /'([^']+)' column/.exec(error.message ?? "") ??
    /column (?:tasks\.)?"?([a-zA-Z0-9_]+)"?/.exec(error.message ?? "");
  return m?.[1] ?? null;
}

async function withColumnFallback<T>(
  payload: Record<string, unknown>,
  run: (payload: Record<string, unknown>) => Promise<{ data: T; error: unknown }>,
): Promise<{ data: T; droppedFields: string[] }> {
  const attempt = { ...payload };
  const droppedFields: string[] = [];
  // At most one retry per payload key, so this always terminates.
  for (let i = 0; i <= Object.keys(payload).length; i++) {
    const { data, error } = await run(attempt);
    if (!error) return { data, droppedFields };
    const missing = missingColumnFromError(error as { code?: string; message?: string });
    if (!missing || !(missing in attempt)) throw error;
    delete attempt[missing];
    droppedFields.push(missing);
  }
  throw new Error("Failed to save task");
}

export type TaskInput = {
  type: TaskType;
  title: string;
  notes?: string;
  category?: string;
  difficulty?: Difficulty;
  positive_enabled?: boolean;
  negative_enabled?: boolean;
  schedule_days?: number[];
  tags?: string[];
  realm_id?: number | null;
  element?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  is_starred?: boolean;
};

export async function createTask(input: TaskInput) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, droppedFields } = await withColumnFallback(
    { ...input, user_id: user.id },
    async (payload) => {
      // payload keys are pruned at runtime, so the generated row type can't apply
      const res = await supabase
        .from("tasks")
        .insert(payload as never)
        .select()
        .single();
      return { data: res.data, error: res.error };
    },
  );
  return { task: data, droppedFields };
}

export async function updateTask(id: string, patch: Record<string, unknown>) {
  const { droppedFields } = await withColumnFallback(patch, async (payload) => {
    const res = await supabase
      .from("tasks")
      .update(payload as never)
      .eq("id", id);
    return { data: null, error: res.error };
  });
  return { ok: true, droppedFields };
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
