import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/game/AppShell";
import { AtmosphereBackdrop } from "@/components/game/AtmosphereBackdrop";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { getMyProfile, listAwakeningEvents } from "@/lib/game/supabase-api";
import { buildHeatmap, listDailyLogs, type HeatmapCell } from "@/lib/game/codex-client";

export const Route = createFileRoute("/_authenticated/codex")({
  component: CodexPage,
});

const MOOD_EMOJI = ["😞", "😐", "🙂", "😄", "🤩"];

function CodexPage() {
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const heatQ = useQuery({ queryKey: ["heatmap"], queryFn: () => buildHeatmap(91) });
  const logsQ = useQuery({ queryKey: ["daily-logs"], queryFn: () => listDailyLogs(91) });
  const eventsQ = useQuery({
    queryKey: ["awakening-events"],
    queryFn: () => listAwakeningEvents(100),
  });

  const [tab, setTab] = useState<"heatmap" | "journal" | "awakening" | "ex-tier">("heatmap");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  if (profileQ.isLoading) {
    return (
      <div
        className="min-h-screen grid place-items-center"
        style={{ color: "var(--ink-secondary)" }}
      >
        Opening the Codex…
      </div>
    );
  }
  if (!profileQ.data) return null;

  const selectedLog = selectedDate
    ? logsQ.data?.logs.find((l) => l.log_date === selectedDate)
    : null;

  return (
    <AppShell profile={profileQ.data.profile}>
      <AtmosphereBackdrop realm="vaults" />
      <div className="p-6 md:p-10 max-w-6xl mx-auto min-h-screen relative z-10">
        <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "var(--ss-font-pixel)", color: "var(--gold-bright)", letterSpacing: "0.08em" }}>
          CODEX
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--ink-secondary)" }}>
          What you did, what you felt, what you forged. The mirror.
        </p>

        <div className="flex gap-6 mb-6 border-b" style={{ borderColor: "rgba(61,46,31,0.08)" }}>
          {[
            { key: "heatmap" as const, label: "Heatmap" },
            { key: "journal" as const, label: "Journal" },
            { key: "awakening" as const, label: "Awakening Log" },
            { key: "ex-tier" as const, label: "EX Tier" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`ss-tab-d pb-2 text-sm font-semibold ${tab === t.key ? "active" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "heatmap" && <Heatmap cells={heatQ.data ?? []} onClick={setSelectedDate} />}
        {tab === "journal" && <Journal logs={logsQ.data?.logs ?? []} />}
        {tab === "awakening" && <AwakeningLog events={eventsQ.data?.events ?? []} />}
        {tab === "ex-tier" && <ExTierCodex />}
      </div>

      {/* Day detail modal */}
      {selectedDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 ss-modal-backdrop"
          onClick={() => setSelectedDate(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="ss-modal">
            <h2 className="text-lg font-bold mb-1" style={{ color: "var(--gold-bright)" }}>
              {new Date(selectedDate).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h2>
            {selectedLog ? (
              <div className="space-y-3 mt-4 text-sm">
                {selectedLog.pm_mood && (
                  <div className="flex gap-3">
                    <Stat
                      label="Mood"
                      value={`${MOOD_EMOJI[selectedLog.pm_mood - 1]} ${selectedLog.pm_mood}/5`}
                    />
                    {selectedLog.pm_energy && (
                      <Stat label="Energy" value={`⚡ ${selectedLog.pm_energy}/5`} />
                    )}
                  </div>
                )}
                {selectedLog.pm_went_well && (
                  <Block label="What went well" body={selectedLog.pm_went_well} />
                )}
                {selectedLog.pm_didnt_go && (
                  <Block label="What didn't" body={selectedLog.pm_didnt_go} />
                )}
                {(selectedLog.am_intent_task_ids ?? []).length > 0 && (
                  <p className="text-xs" style={{ color: "var(--ink-secondary)" }}>
                    ⭐ {selectedLog.am_intent_task_ids.length} Sacred Directive
                    {selectedLog.am_intent_task_ids.length === 1 ? "" : "s"} set
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm mt-4 italic" style={{ color: "var(--ink-secondary)" }}>
                The page is blank that day.
              </p>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}

// ─── Heatmap ────────────────────────────────────────────────────────────────

function Heatmap({ cells, onClick }: { cells: HeatmapCell[]; onClick: (date: string) => void }) {
  // Group into weeks: first cell's day-of-week determines offset
  const weeks = useMemo(() => {
    if (cells.length === 0) return [] as HeatmapCell[][];
    const out: HeatmapCell[][] = [];
    const firstDay = new Date(cells[0].date).getDay(); // 0..6
    let week: (HeatmapCell | null)[] = Array(firstDay).fill(null);
    for (const c of cells) {
      week.push(c);
      if (week.length === 7) {
        out.push(week as HeatmapCell[]);
        week = [];
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      out.push(week as HeatmapCell[]);
    }
    return out;
  }, [cells]);

  // Total stats
  const totalDays = cells.length;
  const activeDays = cells.filter((c) => c.ritualScore > 0).length;
  const totalAwakenings = cells.filter((c) => c.hasAwakening).length;

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-4 text-xs" style={{ color: "var(--ink-secondary)" }}>
        <span>
          <b className="font-serif" style={{ color: "var(--gold-bright)" }}>
            {activeDays}
          </b>{" "}
          active days
        </span>
        <span>
          <b className="font-serif" style={{ color: "var(--gold-bright)" }}>
            {totalDays}
          </b>{" "}
          days tracked
        </span>
        <span>
          <Icon name="stamina" size={12} color="var(--gold-bright)" />{" "}
          <b className="font-serif" style={{ color: "var(--gold-bright)" }}>
            {totalAwakenings}
          </b>{" "}
          awakening days
        </span>
      </div>

      <div className="ss-card overflow-x-auto">
        <div className="flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((cell, ci) => (
                <button
                  key={ci}
                  onClick={() => cell && onClick(cell.date)}
                  disabled={!cell}
                  className="w-3 h-3 transition-all hover:scale-150 disabled:cursor-default"
                  style={{
                    background: cell ? cellColor(cell) : "transparent",
                    boxShadow: cell?.hasAwakening ? "0 0 6px var(--gold-bright)" : undefined,
                    border: cell?.hasAwakening ? "1px solid var(--gold-bright)" : "none",
                  }}
                  title={
                    cell
                      ? `${cell.date}${cell.mood ? ` · mood ${cell.mood}/5` : ""}${cell.hasAwakening ? " · ⚡ awakening" : ""}`
                      : ""
                  }
                />
              ))}
            </div>
          ))}
        </div>

        <div
          className="flex items-center gap-2 mt-4 text-[11px]"
          style={{ color: "var(--ink-secondary)" }}
        >
          <span>Less</span>
          {[0, 0.5, 1].map((a) => (
            <div
              key={a}
              className="w-3 h-3"
              style={{
                background: cellColor({
                  activity: a,
                  ritualScore: a * 2,
                  mood: null,
                  hasJournal: false,
                  hasAwakening: false,
                  date: "",
                }),
              }}
            />
          ))}
          <span>More</span>
          <span className="mx-2">·</span>
          <span>⚡ glow = awakening that day</span>
        </div>
      </div>
    </div>
  );
}

function cellColor(c: HeatmapCell): string {
  if (c.ritualScore === 0) return "rgba(61,46,31,0.06)";
  if (c.ritualScore === 1) return "rgba(255,217,92,0.35)";
  return "linear-gradient(135deg, var(--gold-bright), var(--gold-bright))";
}

// ─── Journal ────────────────────────────────────────────────────────────────

function Journal({
  logs,
}: {
  logs: Array<{
    log_date: string;
    pm_went_well: string | null;
    pm_didnt_go: string | null;
    pm_mood: number | null;
    pm_energy: number | null;
  }>;
}) {
  const withReflection = logs.filter((l) => l.pm_went_well || l.pm_didnt_go);
  if (withReflection.length === 0) {
    return (
      <EmptyState
        icon="evening"
        title="The page hasn't seen ink."
        body="An evening reflection takes ninety seconds. The first one matters most."
      />
    );
  }
  return (
    <div className="space-y-3">
      {withReflection.map((l) => (
        <div key={l.log_date} className="ss-card">
          <div className="flex items-center justify-between mb-2">
            <p
              className="text-xs uppercase tracking-widest"
              style={{ color: "var(--ink-secondary)" }}
            >
              {new Date(l.log_date).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            {l.pm_mood && (
              <span className="text-xs">
                {MOOD_EMOJI[l.pm_mood - 1]}{" "}
                <span style={{ color: "var(--gold-bright)" }}>{l.pm_mood}/5</span>
              </span>
            )}
          </div>
          {l.pm_went_well && (
            <p
              className="text-sm mb-1 flex items-center gap-1.5"
              style={{ color: "var(--success)" }}
            >
              <Icon name="check" size={13} color="var(--success)" />
              <span>{l.pm_went_well}</span>
            </p>
          )}
          {l.pm_didnt_go && (
            <p className="text-sm flex items-center gap-1.5" style={{ color: "var(--danger)" }}>
              <Icon name="close" size={13} color="var(--danger)" />
              <span>{l.pm_didnt_go}</span>
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Awakening Log ──────────────────────────────────────────────────────────

function AwakeningLog({
  events,
}: {
  events: Array<{
    id: string;
    skill_name: string;
    trigger_text: string;
    created_at: string;
    user_monster?: { monster?: { name: string; role: string } };
  }>;
}) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon="sparkle"
        title="Nothing has awakened in your company."
        body="Discipline triggers awakenings. Your monsters are listening."
      />
    );
  }
  return (
    <div className="space-y-2">
      {events.map((e) => (
        <div
          key={e.id}
          className="ss-card flex items-start gap-3"
          style={{ borderColor: "var(--ss-hairline-active)" }}
        >
          <div className="mt-0.5">
            <Icon name="stamina" size={18} color="var(--gold-bright)" className="lucide-glow" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: "var(--gold-bright)" }}>
              {e.skill_name}
            </p>
            <p className="text-xs" style={{ color: "var(--ink-secondary)" }}>
              {e.user_monster?.monster?.name ?? "Unknown"}
            </p>
            <p className="text-[11px] italic mt-1" style={{ color: "var(--ink-secondary)" }}>
              {e.trigger_text}
            </p>
            <p className="text-[11px] mt-1" style={{ color: "var(--ink-secondary)" }}>
              {new Date(e.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="ss-pane flex-1">
      <div className="text-[11px] uppercase" style={{ color: "var(--ink-secondary)" }}>
        {label}
      </div>
      <div className="text-sm font-bold mt-0.5" style={{ color: "var(--gold-bright)" }}>
        {value}
      </div>
    </div>
  );
}

function Block({ label, body }: { label: string; body: string }) {
  return (
    <div className="ss-pane">
      <div
        className="text-[11px] uppercase tracking-wider mb-1"
        style={{ color: "var(--ink-secondary)" }}
      >
        {label}
      </div>
      <p className="text-sm" style={{ color: "var(--ink-primary)" }}>
        {body}
      </p>
    </div>
  );
}

const EX_TIER_ENTRIES = [
  { realm: "Verdant", color: "#3ed97a", trait: "Evergreen Veil", desc: "Passive HP regen scales with team plant count. At full team, grants immunity to Burn.", aura: "Leaves orbit the soul in battle" },
  { realm: "Infernal", color: "#e85d3a", trait: "Hellfire Core", desc: "Fire skills ignore 25% DEF. On kill, explode for AoE damage equal to 10% of the fallen enemy's max HP.", aura: "Embers trail every movement" },
  { realm: "Abyssal", color: "#9b6dff", trait: "Void Resonance", desc: "Dark skills have 15% chance to inflict Silence. Immune to Charm and Fear.", aura: "Shadow tendrils writhe beneath" },
  { realm: "Celestial", color: "#ffe066", trait: "Divine Mandate", desc: "Healing skills also cleanse 1 debuff. Upon reaching 100% HP, gain a shield equal to 15% max HP.", aura: "Golden halos pulse gently" },
  { realm: "Tidal", color: "#38b8f5", trait: "Abyssal Current", desc: "Water skills slow enemy speed by 10% (stacks 3×). In rain weather, all stats +8%.", aura: "Water droplets orbit in rings" },
  { realm: "Elder", color: "#c44f6f", trait: "Ancestral Echo", desc: "On death, bestow a random stat boost (+20%) to the lowest-HP ally. Revive passives trigger twice.", aura: "Ghostly runes circle the soul" },
  { realm: "Blight", color: "#6dc4c4", trait: "Miasma Shroud", desc: "Poison ticks deal 50% more damage. Immune to poison. Enemies attacking this soul have 10% chance to be poisoned.", aura: "Toxic mist clings to the ground" },
  { realm: "Myth", color: "#d4a030", trait: "Fable Weaver", desc: "Support skills have doubled duration. Buffs cast by this soul cannot be dispelled for the first 2 turns.", aura: "Storybook pages flutter around" },
  { realm: "Stellar", color: "#6db8e8", trait: "Cosmic Drift", desc: "Evade rate +12%. After dodging, next attack deals 30% bonus damage. Immune to Gravity.", aura: "Stardust sparkles in wake" },
  { realm: "Primal", color: "#d4843a", trait: "Earthen Roots", desc: "Cannot be knocked back or displaced. DEF +15% when HP is above 50%. Taunt duration +1 turn.", aura: "Stone plates orbit defensively" },
  { realm: "Digital", color: "#38b8f5", trait: "Code Override", desc: "Debuffs have 20% chance to be reflected. Construct allies gain +10% ATK. Immune to Glitch.", aura: "Binary streams cascade down" },
  { realm: "Void", color: "#9b6dff", trait: "Null Field", desc: "Negate the first buff applied to each enemy per battle. Skills cost 15% less. Immune to Seal.", aura: "Reality fractures around the soul" },
];

function ExTierCodex() {
  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase font-bold mb-4" style={{ fontFamily: "var(--ss-font-pixel)", color: "var(--gold-bright)" }}>
        ★8 EX TIER HERITAGE TRAITS BY REALM — REQUIRES REALM KEY + ★7→★8 PROMOTION
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {EX_TIER_ENTRIES.map((entry) => (
          <div
            key={entry.realm}
            className="p-3 border"
            style={{
              borderRadius: 0,
              borderColor: `${entry.color}30`,
              background: `${entry.color}08`,
              boxShadow: `3px 3px 0 ${entry.color}20`,
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className="w-3 h-3"
                style={{ borderRadius: 0, background: entry.color }}
              />
              <span
                className="text-[11px] font-bold uppercase"
                style={{ fontFamily: "var(--ss-font-pixel)", color: entry.color }}
              >
                {entry.realm} — {entry.trait}
              </span>
            </div>
            <p className="text-[11px] mb-1.5" style={{ color: "var(--ink-secondary)" }}>
              {entry.desc}
            </p>
            <p className="text-[9px] italic" style={{ color: `${entry.color}90` }}>
              Aura: {entry.aura}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
