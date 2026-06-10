import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/game/AppShell";
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
  str: "#E05252",
  int: "#7FD4FF",
  con: "#5FAD41",
  all: "#FFD54F",
};

const DROP_ICONS: Record<string, string> = {
  gold: "💰",
  stone: "🪨",
  material: "✨",
  tome_shard: "📕",
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
        toast.success(`⚡ ${a.monsterName} has awakened: ${a.skillName}`, { duration: 6000, description: a.flavor });
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
    return <div className="min-h-screen grid place-items-center" style={{ background: "#0C0E14", color: "#A09D96" }}>Loading expeditions…</div>;
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
      <div className="p-6 md:p-10 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-1" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>
          Expeditions
        </h1>
        <p className="text-sm mb-6" style={{ color: "#A09D96" }}>
          Send your team across the realms. Different lands open different days.
        </p>

        {/* Stamina */}
        <div className="mb-6 rounded-xl p-4 border" style={{ background: "#13161F", borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs uppercase tracking-wider" style={{ color: "#A09D96" }}>Stamina</span>
            <span className="text-sm font-bold font-mono" style={{ color: "#FFD54F" }}>
              {stamina} / {profile.stamina_max ?? 60}
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full transition-all"
              style={{
                width: `${Math.min(100, (stamina / (profile.stamina_max ?? 60)) * 100)}%`,
                background: "linear-gradient(90deg, #C89A3E, #FFD54F)",
              }}
            />
          </div>
          {regenInMs > 0 && (
            <div className="text-[11px] mt-2" style={{ color: "#6B6864" }}>
              Next +1 stamina in {regenMin}m {regenSec.toString().padStart(2, "0")}s
            </div>
          )}
        </div>

        {/* Today's Expedition */}
        <div
          className="rounded-xl p-6 border"
          style={{
            background: "linear-gradient(160deg, rgba(255,213,79,0.06), #13161F)",
            borderColor: ELEMENT_COLORS[def.element],
            boxShadow: `0 0 24px ${ELEMENT_COLORS[def.element]}25`,
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "#A09D96" }}>
                Today's Expedition · {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][today]}
              </p>
              <h2 className="text-2xl font-bold" style={{ color: ELEMENT_COLORS[def.element], fontFamily: "'Cinzel',serif" }}>
                {def.name}
              </h2>
            </div>
            <span
              className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: `${ELEMENT_COLORS[def.element]}20`,
                color: ELEMENT_COLORS[def.element],
                border: `1px solid ${ELEMENT_COLORS[def.element]}60`,
              }}
            >
              {def.element === "all" ? "All Elements" : def.element.toUpperCase()}
            </span>
          </div>
          <p className="text-sm italic mb-4" style={{ color: "#A09D96" }}>{def.flavor}</p>

          <div className="grid grid-cols-2 gap-2 text-xs mb-4" style={{ color: "#A09D96" }}>
            <div className="rounded-md p-2" style={{ background: "rgba(0,0,0,0.3)" }}>
              <div className="text-[10px] uppercase" style={{ color: "#6B6864" }}>Primary drop</div>
              <div className="font-bold mt-0.5" style={{ color: "#F0EDE6" }}>🪨 {def.primaryStone}</div>
            </div>
            <div className="rounded-md p-2" style={{ background: "rgba(0,0,0,0.3)" }}>
              <div className="text-[10px] uppercase" style={{ color: "#6B6864" }}>Elite chance</div>
              <div className="font-bold mt-0.5" style={{ color: "#F0EDE6" }}>~5% per run</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => runMut.mutate(1)}
              disabled={!canRun1}
              className="flex-1 py-3 rounded-lg font-bold text-sm uppercase tracking-widest disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.05)", color: "#F0EDE6", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {runMut.isPending ? "Running…" : "Run ×1 — 5⚡"}
            </button>
            <button
              onClick={() => runMut.mutate(5)}
              disabled={!canRun5}
              className="flex-[2] py-3 rounded-lg font-bold text-sm uppercase tracking-widest disabled:opacity-40"
              style={{
                background: canRun5 ? "linear-gradient(135deg,#C89A3E,#FFD54F)" : "rgba(255,255,255,0.05)",
                color: canRun5 ? "#0C0E14" : "#6B6864",
                boxShadow: canRun5 ? "0 0 24px rgba(255,213,79,0.3)" : "none",
              }}
            >
              {runMut.isPending ? "Running…" : "★ Run ×5 — 25⚡ ★"}
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
                className="rounded-md py-2 px-1"
                style={{
                  background: isToday ? "rgba(255,213,79,0.1)" : "rgba(0,0,0,0.2)",
                  border: `1px solid ${isToday ? "#FFD54F" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                <div className="text-[10px] uppercase tracking-wider" style={{ color: isToday ? "#FFD54F" : "#6B6864" }}>{label}</div>
                <div className="text-[9px] mt-1" style={{ color: isToday ? "#F0EDE6" : "#6B6864" }}>{EXPEDITIONS[t].name.split(" ")[0]}</div>
              </div>
            );
          })}
        </div>

        {/* Results modal */}
        {results && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.85)" }}
            onClick={() => setResults(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl p-6 border"
              style={{ background: "#1A1E2A", borderColor: "rgba(255,213,79,0.3)" }}
            >
              <h2 className="text-xl font-bold mb-1 text-center" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>
                Returned from {def.name}
              </h2>
              <p className="text-xs text-center mb-4" style={{ color: "#A09D96" }}>
                {results.runsCompleted} run{results.runsCompleted > 1 ? "s" : ""}
                {results.eliteCount > 0 && ` · ${results.eliteCount} elite encounter${results.eliteCount > 1 ? "s" : ""}`}
              </p>

              <div className="rounded-lg p-4 mb-4" style={{ background: "rgba(0,0,0,0.3)" }}>
                <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#A09D96" }}>Loot</p>
                {results.drops.length === 0 ? (
                  <p className="text-xs" style={{ color: "#6B6864" }}>The realm yielded nothing this time.</p>
                ) : (
                  <ul className="space-y-1">
                    {results.drops.map((d, i) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span>
                          <span className="mr-1">{DROP_ICONS[d.type] ?? "📦"}</span>
                          <span style={{ color: "#F0EDE6" }}>{d.name}</span>
                        </span>
                        <span className="font-mono font-bold" style={{ color: "#FFD54F" }}>×{d.qty}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                onClick={() => setResults(null)}
                className="w-full py-3 rounded-lg font-bold text-sm uppercase tracking-widest"
                style={{ background: "linear-gradient(135deg,#C89A3E,#FFD54F)", color: "#0C0E14" }}
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
