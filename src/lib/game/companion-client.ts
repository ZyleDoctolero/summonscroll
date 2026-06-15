import { supabase } from "@/integrations/supabase/client";

// ─── Mood ──────────────────────────────────────────────────────────────────

export type Mood = "devoted" | "loyal" | "despondent" | "fading";

export function moodForBond(bondPercent: number): Mood {
  if (bondPercent < 10) return "fading";
  if (bondPercent < 25) return "despondent";
  if (bondPercent < 75) return "loyal";
  return "devoted";
}

export const MOOD_META: Record<
  Mood,
  { label: string; color: string; icon: string; effect: string }
> = {
  devoted: {
    label: "Devoted",
    color: "var(--gold-bright)",
    icon: "💖",
    effect: "+5% battle effectiveness",
  },
  loyal: { label: "Loyal", color: "var(--success)", icon: "💚", effect: "Steady performance" },
  despondent: {
    label: "Despondent",
    color: "var(--warning)",
    icon: "🥀",
    effect: "−15% battle effectiveness",
  },
  fading: {
    label: "Fading",
    color: "var(--danger)",
    icon: "💔",
    effect: "Refuses all activity until bond ≥ 25%",
  },
};

// ─── Hub commentary ────────────────────────────────────────────────────────
// Returns a single dialogue line from a Devoted monster (if any).
// Lightweight: pulls top-bond monster + flavors a line by role.

const COMMENTARY_BY_ROLE: Record<string, string[]> = {
  attacker: [
    "The strike comes from stillness, master.",
    "Today’s blade will be sharper than yesterday’s.",
    "Lead. I follow at full force.",
  ],
  tank: [
    "I will hold the line. Move freely.",
    "Lean on me when the storm comes.",
    "Walls were built by patient hands.",
  ],
  healer: [
    "Breathe. The page can wait a moment.",
    "Your hands shake — rest, then write.",
    "Drink water. It is the smallest discipline.",
  ],
  support: [
    "The page calls for ink. I'll mind the lamp.",
    "Order before motion, master.",
    "Pen first. Sword later.",
  ],
  debuffer: [
    "I see weaknesses in their guard, master.",
    "Patience is a blade we sharpen quietly.",
    "Strike when they look away.",
  ],
};

export async function getDevotedCommentary(): Promise<null | {
  monsterName: string;
  monsterRole: string;
  line: string;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roster } = await supabase
    .from("user_monsters")
    .select("bond_percent, monster:monsters(name, role)")
    .eq("user_id", user.id)
    .gte("bond_percent", 75)
    .order("bond_percent", { ascending: false })
    .limit(8);

  const list = roster ?? [];
  if (list.length === 0) return null;
  const pick = list[Math.floor(Math.random() * list.length)];
  const m = pick.monster as unknown as { name: string; role: string } | null;
  if (!m) return null;

  const pool = COMMENTARY_BY_ROLE[m.role] ?? COMMENTARY_BY_ROLE.support;
  const line = pool[Math.floor(Math.random() * pool.length)];

  return { monsterName: m.name, monsterRole: m.role, line };
}
