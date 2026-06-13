import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/game/AppShell";
import { Icon } from "@/components/ui/Icon";
import {
  getMyProfile,
  runExpedition,
  expeditionForDay,
  EXPEDITIONS,
  computeCurrentStamina,
  nextRegenIn,
  type ExpeditionDrop,
} from "@/lib/game/supabase-api";

export const Route = createFileRoute("/_authenticated/expeditions")({
  component: ExpeditionsPage,
});

const ELEMENT_COLORS: Record<string, string> = {
  str: "var(--ss-stat-str)",
  int: "var(--ss-stat-int)",
  con: "var(--ss-stat-con)",
  all: "var(--ss-gold-bright)",
};

const DROP_ICONS: Record<string, string> = {
  gold: "gold",
  stone: "stone",
  material: "sparkle",
  tome_shard: "tome",
};

function ExpeditionsPage() {
  const qc = useQueryClient();
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const [results, setResults] = useState<null | {
    drops: ExpeditionDrop[];
    runsCompleted: number;
    eliteCount: number;
    staminaAfter: number;
    staminaMax: number;
  }>(null);

  // Live tick for stamina regen counter
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const runMut = useMutation({
    mutationFn: async (runs: 1 | 5) => runExpedition(runs),
    onSuccess: (res) => {
      setResults({
        drops: res.totalDrops,
        runsCompleted: res.runsCompleted,
        eliteCount: res.eliteCount,
        staminaAfter: res.staminaAfter,
        staminaMax: res.staminaMax,
      });
      for (const a of res.awakenings ?? []) {
        toast.success(`Awakening! ${a.monsterName} has awakened: ${a.skillName}`, {
          duration: 6000,
          description: a.flavor,
        });
      }
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["my-monsters"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const today = useMemo(() => new Date().getDay(), []);
  const expType = expeditionForDay(today);
  const def = EXPEDITIONS[expType];

  if (profileQ.isLoading) {
    return (
      <div
        className="min-h-screen grid place-items-center"
        style={{ color: "var(--ink-secondary)" }}
      >
        Loading expeditions…
      </div>
    );
  }
  if (!profileQ.data) return null;
  const profile = profileQ.data.profile;

  const stamina = computeCurrentStamina(
    profile.stamina ?? 60,
    profile.stamina_max ?? 60,
    profile.stamina_last_tick ?? new Date().toISOString(),
  );
  const regenInMs = nextRegenIn(
    profile.stamina ?? 60,
    profile.stamina_max ?? 60,
    profile.stamina_last_tick ?? new Date().toISOString(),
  );
  const regenMin = Math.floor(regenInMs / 60000);
  const regenSec = Math.floor((regenInMs % 60000) / 1000);

  const canRun1 = stamina >= 5 && !runMut.isPending;
  const canRun5 = stamina >= 25 && !runMut.isPending;

  return (
    <AppShell profile={profile}>
      <div className="bg-atmos bg-atmos-expedition p-6 md:p-10 max-w-3xl mx-auto min-h-screen">
        <h1 className="t-h1 text-3xl font-bold mb-1" style={{ color: "var(--gold-bright)" }}>
          Expeditions
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--ink-secondary)" }}>
          Send your team across the realms. Different lands open different days.
        </p>

        {/* Stamina */}
        <div className="ss-card mb-6">
          <div className="flex justify-between items-center mb-2">
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: "var(--ink-secondary)" }}
            >
              Stamina
            </span>
            <span className="text-sm font-bold font-mono" style={{ color: "var(--gold-bright)" }}>
              {stamina} / {profile.stamina_max ?? 60}
            </span>
          </div>
          <div
            className="h-3 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <div
              className="h-full transition-all"
              style={{
                width: `${Math.min(100, (stamina / (profile.stamina_max ?? 60)) * 100)}%`,
                background: "linear-gradient(90deg, var(--gold-glow), var(--gold-bright))",
              }}
            />
          </div>
          {regenInMs > 0 && (
            <div className="text-[11px] mt-2" style={{ color: "var(--ink-tertiary)" }}>
              Next +1 stamina in {regenMin}m {regenSec.toString().padStart(2, "0")}s
            </div>
          )}
        </div>

        {/* Today's Expedition */}
        <div
          className="ss-card-hero"
          style={{
            background: "linear-gradient(160deg, rgba(255,213,79,0.06), var(--bg-pane))",
            borderColor: ELEMENT_COLORS[def.element],
            boxShadow: `var(--ss-shadow-mid), 0 0 24px ${ELEMENT_COLORS[def.element]}25`,
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <p
                className="text-[10px] uppercase tracking-widest mb-1"
                style={{ color: "var(--ink-secondary)" }}
              >
                Today's Expedition · {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][today]}
              </p>
              <h2 className="text-2xl font-bold" style={{ color: ELEMENT_COLORS[def.element] }}>
                {def.name}
              </h2>
            </div>
            {def.element === "all" ? (
              <span className="ss-chip-gold">All Elements</span>
            ) : (
              <span className="ss-stat-chip" data-stat={def.element}>
                {def.element.toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-sm italic mb-4" style={{ color: "var(--ink-secondary)" }}>
            {def.flavor}
          </p>

          <div
            className="grid grid-cols-2 gap-2 text-xs mb-4"
            style={{ color: "var(--ink-secondary)" }}
          >
            <div className="ss-pane">
              <div className="text-[10px] uppercase" style={{ color: "var(--ink-tertiary)" }}>
                Primary drop
              </div>
              <div
                className="font-bold mt-0.5 flex items-center gap-1"
                style={{ color: "var(--ink-primary)" }}
              >
                <Icon name="stone" size={12} color="var(--ink-secondary)" /> {def.primaryStone}
              </div>
            </div>
            <div className="ss-pane">
              <div className="text-[10px] uppercase" style={{ color: "var(--ink-tertiary)" }}>
                Elite chance
              </div>
              <div className="font-bold mt-0.5" style={{ color: "var(--ink-primary)" }}>
                ~5% per run
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => runMut.mutate(1)}
              disabled={!canRun1}
              className="ss-btn ss-btn-secondary flex-1"
            >
              {runMut.isPending ? (
                "Running…"
              ) : (
                <span className="flex items-center gap-1">
                  Run ×1 — 5<Icon name="stamina" size={12} />
                </span>
              )}
            </button>
            <button
              onClick={() => runMut.mutate(5)}
              disabled={!canRun5}
              className="ss-btn ss-btn-d-primary flex-[2]"
              style={{
                boxShadow: canRun5 ? "0 0 24px rgba(255,213,79,0.3)" : "none",
              }}
            >
              {runMut.isPending ? (
                "Running…"
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <Icon name="star" size={12} color="var(--gold-bright)" className="fill-current" />
                  <span>Run ×5 — 25</span>
                  <Icon name="stamina" size={12} />
                  <Icon name="star" size={12} color="var(--gold-bright)" className="fill-current" />
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Weekly rotation hint */}
        <div className="mt-6 grid grid-cols-7 gap-2 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, i) => {
            const t = expeditionForDay(i);
            const isToday = i === today;
            return (
              <div
                key={label}
                className={`ss-card rounded-md py-2 px-1 ${isToday ? "ss-card-hero" : ""}`}
                style={
                  isToday
                    ? { background: "rgba(255,213,79,0.1)", borderColor: "var(--gold-bright)" }
                    : undefined
                }
              >
                <div
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: isToday ? "var(--gold-bright)" : "var(--ink-tertiary)" }}
                >
                  {label}
                </div>
                <div
                  className="text-[9px] mt-1"
                  style={{ color: isToday ? "var(--ink-primary)" : "var(--ink-tertiary)" }}
                >
                  {EXPEDITIONS[t].name.split(" ")[0]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Results modal */}
        {results && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 ss-modal-backdrop"
            onClick={() => setResults(null)}
          >
            <div onClick={(e) => e.stopPropagation()} className="ss-modal">
              <h2
                className="text-xl font-bold mb-1 text-center"
                style={{ color: "var(--gold-bright)" }}
              >
                Returned from {def.name}
              </h2>
              <p className="text-xs text-center mb-4" style={{ color: "var(--ink-secondary)" }}>
                {results.runsCompleted} run{results.runsCompleted > 1 ? "s" : ""}
                {results.eliteCount > 0 &&
                  ` · ${results.eliteCount} elite encounter${results.eliteCount > 1 ? "s" : ""}`}
              </p>

              <div className="ss-pane mb-4">
                <p
                  className="text-[10px] uppercase tracking-wider mb-2"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  Loot
                </p>
                {results.drops.length === 0 ? (
                  <p className="text-xs" style={{ color: "var(--ink-tertiary)" }}>
                    The realm yielded nothing this time.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {results.drops.map((d, i) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span className="flex items-center gap-1.5">
                          <Icon
                            name={(DROP_ICONS[d.type] ?? "sparkle") as any}
                            size={14}
                            color="var(--gold-glow)"
                          />
                          <span style={{ color: "var(--ink-primary)" }}>{d.name}</span>
                        </span>
                        <span
                          className="font-mono font-bold"
                          style={{ color: "var(--gold-bright)" }}
                        >
                          ×{d.qty}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button onClick={() => setResults(null)} className="ss-btn ss-btn-primary w-full">
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
