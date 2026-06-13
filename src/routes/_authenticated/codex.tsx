import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/game/AppShell";
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

  const [tab, setTab] = useState<"heatmap" | "journal" | "awakening">("heatmap");
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
      <div className="bg-atmos bg-atmos-codex p-6 md:p-10 max-w-4xl mx-auto min-h-screen">
        <h1 className="t-h1 text-3xl font-bold mb-1" style={{ color: "var(--gold-bright)" }}>
          Codex
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--ink-secondary)" }}>
          What you did, what you felt, what you forged. The mirror.
        </p>

        <div className="flex gap-6 mb-6 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {[
            { key: "heatmap" as const, label: "Heatmap" },
            { key: "journal" as const, label: "Journal" },
            { key: "awakening" as const, label: "Awakening Log" },
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
              <p className="text-sm mt-4 italic" style={{ color: "var(--ink-tertiary)" }}>
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
          <b className="t-mono" style={{ color: "var(--gold-bright)" }}>
            {activeDays}
          </b>{" "}
          active days
        </span>
        <span>
          <b className="t-mono" style={{ color: "var(--gold-bright)" }}>
            {totalDays}
          </b>{" "}
          days tracked
        </span>
        <span>
          <Icon name="stamina" size={12} color="var(--gold-bright)" />{" "}
          <b className="t-mono" style={{ color: "var(--gold-bright)" }}>
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
                  className="w-3 h-3 rounded-sm transition-all hover:scale-150 disabled:cursor-default"
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
          className="flex items-center gap-2 mt-4 text-[10px]"
          style={{ color: "var(--ink-tertiary)" }}
        >
          <span>Less</span>
          {[0, 0.5, 1].map((a) => (
            <div
              key={a}
              className="w-3 h-3 rounded-sm"
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
  if (c.ritualScore === 0) return "rgba(255,255,255,0.06)";
  if (c.ritualScore === 1) return "rgba(255,217,92,0.35)";
  return "linear-gradient(135deg, var(--gold-glow), var(--gold-bright))";
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
            <p className="text-xs" style={{ color: "var(--ink-primary)" }}>
              {e.user_monster?.monster?.name ?? "Unknown"}
            </p>
            <p className="text-[10px] italic mt-1" style={{ color: "var(--ink-secondary)" }}>
              {e.trigger_text}
            </p>
            <p className="text-[10px] mt-1" style={{ color: "var(--ink-tertiary)" }}>
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
      <div className="text-[10px] uppercase" style={{ color: "var(--ink-tertiary)" }}>
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
        className="text-[10px] uppercase tracking-wider mb-1"
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
