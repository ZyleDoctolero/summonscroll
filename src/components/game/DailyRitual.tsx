import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { getTodayLog, setMorningIntents, submitEveningReflection, isMorningWindow, isEveningWindow } from "@/lib/game/rituals-client";
import type { Task } from "./TaskCard";

// ─── Morning Ritual Modal ────────────────────────────────────────────────────

export function MorningRitual({ tasks, onClose }: { tasks: Task[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [picked, setPicked] = useState<string[]>([]);

  const saveMut = useMutation({
    mutationFn: () => setMorningIntents(picked),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["today-log"] });
      toast.success("Sacred Directives set.");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = (id: string) => {
    setPicked((p) => {
      if (p.includes(id)) return p.filter((x) => x !== id);
      if (p.length >= 3) return p;
      return [...p, id];
    });
  };

  // Show habits, dailies, and to-dos. Filter archived.
  const candidates = tasks.filter((t) => !t.completed || t.type === "habit");

  return (
    <RitualModal onClose={onClose}>
      <div className="text-4xl text-center mb-2">☀</div>
      <h2 className="text-xl font-bold mb-1 text-center" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>
        Morning Ritual
      </h2>
      <p className="text-xs text-center mb-4" style={{ color: "#A09D96" }}>
        Pick today's <span style={{ color: "#FFD54F" }}>3 Sacred Directives</span>.
        They earn 1.5× rewards and unlock a Reflection Pull tonight if all three are completed.
      </p>

      <div className="max-h-[300px] overflow-y-auto rounded-lg p-2 mb-4 space-y-1" style={{ background: "rgba(0,0,0,0.3)" }}>
        {candidates.length === 0 ? (
          <p className="text-center py-8 text-xs" style={{ color: "#6B6864" }}>
            Forge a directive first, then return.
          </p>
        ) : (
          candidates.map((t) => {
            const isPicked = picked.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => toggle(t.id)}
                disabled={!isPicked && picked.length >= 3}
                className="w-full text-left px-3 py-2 rounded text-sm transition-all disabled:opacity-40"
                style={{
                  background: isPicked ? "rgba(255,213,79,0.15)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isPicked ? "#FFD54F" : "rgba(255,255,255,0.06)"}`,
                  color: "#F0EDE6",
                }}
              >
                <span className="mr-2">{isPicked ? "⭐" : "○"}</span>
                <span>{t.title}</span>
                <span className="text-[10px] ml-2" style={{ color: "#6B6864" }}>{t.type}</span>
              </button>
            );
          })
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-md text-xs uppercase tracking-widest font-bold"
          style={{ background: "rgba(255,255,255,0.05)", color: "#A09D96" }}
        >
          Skip Today
        </button>
        <button
          onClick={() => saveMut.mutate()}
          disabled={picked.length === 0 || saveMut.isPending}
          className="flex-[2] py-2.5 rounded-md text-xs uppercase tracking-widest font-bold disabled:opacity-40"
          style={{
            background: picked.length > 0 ? "linear-gradient(135deg,#C89A3E,#FFD54F)" : "rgba(255,255,255,0.05)",
            color: picked.length > 0 ? "#0C0E14" : "#6B6864",
          }}
        >
          {saveMut.isPending ? "Setting…" : `Set ${picked.length}/3`}
        </button>
      </div>
    </RitualModal>
  );
}

// ─── Evening Reflection Modal ────────────────────────────────────────────────

export function EveningRitual({ tasks, onClose }: { tasks: Task[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [wentWell, setWentWell] = useState("");
  const [didntGo, setDidntGo] = useState("");
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [anchor, setAnchor] = useState<string>("");

  const submitMut = useMutation({
    mutationFn: () => submitEveningReflection({
      went_well: wentWell.trim(),
      didnt_go: didntGo.trim(),
      mood,
      energy,
      tomorrow_anchor_task_id: anchor || null,
    }),
    onSuccess: (res) => {
      if (res.rewards.reflectionPull) {
        confetti({ particleCount: 180, spread: 90, origin: { y: 0.5 } });
        toast.success("🌀 Reflection Pull granted — claim at the Altar.");
      }
      if (res.rewards.tomeShard) {
        toast.success("📕 A Tome Shard fell from the sky.");
      }
      toast(`🌙 Ritual streak: ${res.rewards.ritualStreak}`);
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["today-log"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <RitualModal onClose={onClose}>
      <div className="text-4xl text-center mb-2">🌙</div>
      <h2 className="text-xl font-bold mb-1 text-center" style={{ color: "#7F77DD", fontFamily: "'Cinzel',serif" }}>
        Evening Reflection
      </h2>
      <p className="text-xs text-center mb-4" style={{ color: "#A09D96" }}>
        Two lines, two sliders, one anchor. Ninety seconds.
      </p>

      <Field label="What went well?">
        <textarea
          value={wentWell}
          onChange={(e) => setWentWell(e.target.value)}
          placeholder="One sentence."
          rows={2}
          maxLength={200}
          className="ss-input resize-none"
        />
      </Field>

      <Field label="What didn't go well?">
        <textarea
          value={didntGo}
          onChange={(e) => setDidntGo(e.target.value)}
          placeholder="One sentence."
          rows={2}
          maxLength={200}
          className="ss-input resize-none"
        />
      </Field>

      <Slider label="Mood" emoji={["😞", "😐", "🙂", "😄", "🤩"]} value={mood} onChange={setMood} />
      <Slider label="Energy" emoji={["🔋", "🔋", "🔋", "⚡", "⚡"]} value={energy} onChange={setEnergy} />

      <Field label="Tomorrow's anchor (optional)">
        <select
          value={anchor}
          onChange={(e) => setAnchor(e.target.value)}
          className="ss-input"
        >
          <option value="">— none —</option>
          {tasks.filter((t) => !t.completed || t.type === "habit").map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
      </Field>

      <div className="flex gap-2 mt-4">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-md text-xs uppercase tracking-widest font-bold"
          style={{ background: "rgba(255,255,255,0.05)", color: "#A09D96" }}
        >
          Later
        </button>
        <button
          onClick={() => submitMut.mutate()}
          disabled={submitMut.isPending}
          className="flex-[2] py-2.5 rounded-md text-xs uppercase tracking-widest font-bold disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#7F77DD,#A99DFF)", color: "#0C0E14" }}
        >
          {submitMut.isPending ? "Reflecting…" : "Sleep Well"}
        </button>
      </div>
    </RitualModal>
  );
}

// ─── Ritual Status Pill (banner shown on Hub) ───────────────────────────────

export function RitualStatusPill({
  onClickMorning,
  onClickEvening,
}: {
  onClickMorning: () => void;
  onClickEvening: () => void;
}) {
  const logQ = useQuery({ queryKey: ["today-log"], queryFn: getTodayLog, refetchOnWindowFocus: false });
  const log = logQ.data;

  const morningDone = Boolean(log?.am_completed_at);
  const eveningDone = Boolean(log?.pm_completed_at);
  const inMorning = isMorningWindow();
  const inEvening = isEveningWindow(21);

  // Only nudge if action available
  const nudgeMorning = !morningDone && inMorning;
  const nudgeEvening = !eveningDone && inEvening && morningDone;

  return (
    <div className="flex items-center gap-2 mb-4 text-xs">
      <button
        onClick={onClickMorning}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
        style={{
          background: morningDone ? "rgba(95,173,65,0.15)" : nudgeMorning ? "rgba(255,213,79,0.15)" : "rgba(255,255,255,0.04)",
          color: morningDone ? "#5FAD41" : nudgeMorning ? "#FFD54F" : "#6B6864",
          border: `1px solid ${morningDone ? "rgba(95,173,65,0.3)" : nudgeMorning ? "rgba(255,213,79,0.3)" : "rgba(255,255,255,0.06)"}`,
          animation: nudgeMorning ? "pulse 2s ease-in-out infinite" : undefined,
        }}
      >
        <span>☀</span>
        <span>{morningDone ? "Morning set" : "Set Morning Directives"}</span>
      </button>

      <button
        onClick={onClickEvening}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
        style={{
          background: eveningDone ? "rgba(127,119,221,0.15)" : nudgeEvening ? "rgba(127,119,221,0.15)" : "rgba(255,255,255,0.04)",
          color: eveningDone ? "#A99DFF" : nudgeEvening ? "#A99DFF" : "#6B6864",
          border: `1px solid ${eveningDone ? "rgba(127,119,221,0.3)" : nudgeEvening ? "rgba(127,119,221,0.3)" : "rgba(255,255,255,0.06)"}`,
          animation: nudgeEvening ? "pulse 2s ease-in-out infinite" : undefined,
        }}
      >
        <span>🌙</span>
        <span>{eveningDone ? "Reflection done" : inEvening ? "Reflect on the day" : "Reflection awaits dusk"}</span>
      </button>

      {log?.reflection_pull_granted && !log?.reflection_pull_used && (
        <span
          className="px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold"
          style={{ background: "linear-gradient(135deg,#C89A3E,#FFD54F)", color: "#0C0E14" }}
        >
          🌀 Reflection Pull Ready
        </span>
      )}
    </div>
  );
}

// ─── Shared helpers ─────────────────────────────────────────────────────────

function RitualModal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.88)" }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl p-6 border"
        style={{ background: "#1A1E2A", borderColor: "rgba(255,213,79,0.2)" }}
      >
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <div className="text-[10px] uppercase tracking-widest mb-1 font-semibold" style={{ color: "#A09D96" }}>
        {label}
      </div>
      {children}
    </label>
  );
}

function Slider({ label, emoji, value, onChange }: { label: string; emoji: string[]; value: number; onChange: (v: number) => void }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-end mb-1">
        <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#A09D96" }}>{label}</span>
        <span className="text-lg">{emoji[value - 1]}</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className="flex-1 h-8 rounded transition-all"
            style={{
              background: v <= value ? "linear-gradient(135deg,#C89A3E,#FFD54F)" : "rgba(255,255,255,0.05)",
              color: v <= value ? "#0C0E14" : "#6B6864",
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
