import { supabase } from "@/integrations/supabase/client";
import type { DailyLog } from "./rituals-client";

// ─── Daily log feed (last N days) ───────────────────────────────────────────

export async function listDailyLogs(days = 91): Promise<{ logs: DailyLog[] }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { logs: [] };

  const start = new Date();
  start.setDate(start.getDate() - days);
  const startStr = start.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .gte("log_date", startStr)
    .order("log_date", { ascending: false });
  if (error) throw error;
  return { logs: (data ?? []) as DailyLog[] };
}

// ─── Activity heatmap ───────────────────────────────────────────────────────

export type HeatmapCell = {
  date: string;
  activity: number;          // 0..1 normalized
  ritualScore: number;       // 0..2 (am + pm)
  mood: number | null;
  hasJournal: boolean;
  hasAwakening: boolean;
};

export async function buildHeatmap(days = 91): Promise<HeatmapCell[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days);

  // Pull logs in range
  const { data: logs } = await supabase
    .from("daily_logs")
    .select("log_date, am_completed_at, pm_completed_at, pm_mood, pm_went_well, pm_didnt_go")
    .eq("user_id", user.id)
    .gte("log_date", start.toISOString().slice(0, 10));

  // Pull awakening events in range to mark cells
  const { data: events } = await supabase
    .from("awakening_events")
    .select("created_at")
    .eq("user_id", user.id)
    .gte("created_at", start.toISOString());

  const logsByDate = new Map<string, { am: boolean; pm: boolean; mood: number | null; hasJournal: boolean }>();
  for (const l of logs ?? []) {
    const date = l.log_date;
    logsByDate.set(date, {
      am: Boolean(l.am_completed_at),
      pm: Boolean(l.pm_completed_at),
      mood: l.pm_mood,
      hasJournal: Boolean(l.pm_went_well || l.pm_didnt_go),
    });
  }
  const awakeningDates = new Set((events ?? []).map((e) => e.created_at.slice(0, 10)));

  // Build cell array
  const cells: HeatmapCell[] = [];
  for (let i = 0; i <= days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const log = logsByDate.get(iso);
    const am = log?.am ? 1 : 0;
    const pm = log?.pm ? 1 : 0;
    const ritualScore = am + pm;
    const activity = ritualScore / 2; // 0..1 baseline
    cells.push({
      date: iso,
      activity,
      ritualScore,
      mood: log?.mood ?? null,
      hasJournal: Boolean(log?.hasJournal),
      hasAwakening: awakeningDates.has(iso),
    });
  }
  return cells;
}
