// Pure game math constants & helpers — safe in both client and server bundles.
// Habitica-tuned formulas for SummonScroll's task-value system.

export type Difficulty = "trivial" | "easy" | "medium" | "hard";
export type TaskType = "habit" | "daily" | "todo";

export const DIFFICULTY_MULT: Record<Difficulty, number> = {
  trivial: 0.1,
  easy: 1,
  medium: 1.5,
  hard: 2,
};

export const MAX_HP_BASE = 50;

export function xpToNextLevel(level: number): number {
  // Gentle curve. Level 1->2 = 25 xp, scales roughly linearly with a bump.
  return Math.round(25 + (level - 1) * 12);
}

export function valueColor(value: number): "blue" | "green" | "yellow" | "orange" | "red" {
  if (value >= 5) return "blue";
  if (value >= 1) return "green";
  if (value >= -1) return "yellow";
  if (value >= -5) return "orange";
  return "red";
}

export const VALUE_COLOR_HEX: Record<ReturnType<typeof valueColor>, string> = {
  blue: "var(--cyan)",
  green: "var(--success)",
  yellow: "var(--warning)",
  orange: "var(--warning)",
  red: "var(--danger)",
};

export function rewardGold(value: number, diff: Difficulty): number {
  const m = DIFFICULTY_MULT[diff];
  return Math.max(1, Math.round((3 + (10 - value) * 0.7) * m));
}
export function rewardXp(value: number, diff: Difficulty): number {
  const m = DIFFICULTY_MULT[diff];
  return Math.max(1, Math.round((5 + (10 - value) * 0.5) * m));
}
export function rewardGems(value: number, diff: Difficulty): number {
  // small chance / small amount
  const m = DIFFICULTY_MULT[diff];
  const base = Math.round((1 + (10 - value) * 0.15) * m);
  return Math.max(0, base);
}

export function damageFromMiss(value: number, diff: Difficulty, con: number): number {
  const m = DIFFICULTY_MULT[diff];
  const conRed = Math.min(0.4, con * 0.01);
  return Math.max(1, Math.round((1 - value / 20) * m * 2 * (1 - conRed)));
}

export function nextValuePlus(v: number): number {
  return Math.min(20, v + Math.max(0.2, 1 - Math.max(0, v) * 0.05));
}
export function nextValueMinus(v: number): number {
  return Math.max(-20, v - Math.max(0.2, 1 + Math.max(0, -v) * 0.05));
}

// daily drift toward red while neglected
export function driftValue(v: number, diff: Difficulty): number {
  const m = DIFFICULTY_MULT[diff];
  return Math.max(-20, v - 0.4 * m);
}

export function todayISO(): string {
  // server-side day key (UTC) — simpler & consistent across timezones
  return new Date().toISOString().slice(0, 10);
}

export function dayDiff(fromISO: string, toISO: string): number {
  const a = Date.parse(fromISO + "T00:00:00Z");
  const b = Date.parse(toISO + "T00:00:00Z");
  return Math.round((b - a) / 86400000);
}

export function dowFromISO(iso: string): number {
  // 0..6 Sun..Sat
  return new Date(iso + "T00:00:00Z").getUTCDay();
}

export function localTodayISO(): string {
  // The user's wall-clock day — due dates and daily schedules are picked and
  // read in local time, so comparisons must not use the UTC day key.
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type DueInfo = { label: string; tone: "overdue" | "today" | "future" };

export function dueInfoFor(
  dueDate: string | null | undefined,
  dueTime: string | null | undefined,
): DueInfo | null {
  if (!dueDate) {
    if (!dueTime) return null;
    // time-only (e.g. a daily at 07:00) — always "today"
    return { label: `at ${dueTime.slice(0, 5)}`, tone: "today" };
  }
  const today = localTodayISO();
  const time = dueTime ? ` · ${dueTime.slice(0, 5)}` : "";
  const diff = dayDiff(today, dueDate);
  if (diff < 0) {
    return { label: `Overdue ${-diff}d${time}`, tone: "overdue" };
  }
  if (diff === 0) {
    return { label: `Due today${time}`, tone: "today" };
  }
  if (diff === 1) return { label: `Due tomorrow${time}`, tone: "future" };
  const d = new Date(dueDate + "T00:00:00");
  const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return { label: `Due ${label}${time}`, tone: "future" };
}

export const CURRENT_RELEASED_MAX = 150;
