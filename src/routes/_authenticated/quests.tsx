import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { AppShell } from "@/components/game/AppShell";
import { getMyProfile, listGoals, createGoal, deleteGoal, type GoalType, type Goal } from "@/lib/game/supabase-api";

export const Route = createFileRoute("/_authenticated/quests")({
  component: QuestsPage,
});

const TYPE_LABELS: Record<GoalType, { label: string; days: number; hp: number; color: string }> = {
  quarterly: { label: "Quarterly Boss", days: 90, hp: 10000, color: "#E05252" },
  monthly:   { label: "Monthly Quest", days: 30, hp: 3500, color: "#FFD54F" },
  weekly:    { label: "Weekly Trial", days: 7, hp: 800, color: "#7FD4FF" },
};

function QuestsPage() {
  const qc = useQueryClient();
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const activeQ = useQuery({ queryKey: ["goals-active"], queryFn: () => listGoals("active") });
  const slainQ = useQuery({ queryKey: ["goals-slain"], queryFn: () => listGoals("slain") });

  const [tab, setTab] = useState<"active" | "slain" | "forge">("active");
  const [title, setTitle] = useState("");
  const [identity, setIdentity] = useState("");
  const [type, setType] = useState<GoalType>("quarterly");

  const createMut = useMutation({
    mutationFn: () => createGoal({ title, type, identity: identity || undefined }),
    onSuccess: () => {
      confetti({ particleCount: 100, spread: 60 });
      toast.success(`${TYPE_LABELS[type].label} forged.`);
      setTitle(""); setIdentity("");
      qc.invalidateQueries({ queryKey: ["goals-active"] });
      setTab("active");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals-active"] });
      toast("Quest abandoned.");
    },
  });

  if (profileQ.isLoading) {
    return <div className="min-h-screen grid place-items-center" style={{ background: "#0C0E14", color: "#A09D96" }}>Loading the war room…</div>;
  }
  if (!profileQ.data) return null;

  return (
    <AppShell profile={profileQ.data.profile}>
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-1" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>Quests</h1>
        <p className="text-sm mb-6" style={{ color: "#A09D96" }}>
          A goal is a boss. Each task you finish drains its HP. Slay one → mint a Tome of Reverse Heaven.
        </p>

        {/* Tabs */}
        <div className="flex gap-6 mb-6 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {[
            { key: "active" as const, label: "Active" },
            { key: "slain" as const, label: "Slain" },
            { key: "forge" as const, label: "Forge New" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="pb-2 text-sm font-semibold transition-colors"
              style={{
                color: tab === t.key ? "#FFD54F" : "#A09D96",
                borderBottom: `2px solid ${tab === t.key ? "#FFD54F" : "transparent"}`,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Active */}
        {tab === "active" && (
          <div className="space-y-3">
            {(activeQ.data?.goals ?? []).length === 0 ? (
              <div className="text-center py-16 rounded-xl border-2 border-dashed" style={{ borderColor: "rgba(255,255,255,0.08)", color: "#A09D96" }}>
                <p className="text-3xl mb-2">⚔</p>
                <p className="mb-3">No active quests.</p>
                <button
                  onClick={() => setTab("forge")}
                  className="px-4 py-2 rounded text-xs uppercase tracking-widest font-bold"
                  style={{ background: "linear-gradient(135deg,#C89A3E,#FFD54F)", color: "#0C0E14" }}
                >
                  Forge a Quest
                </button>
              </div>
            ) : (
              (activeQ.data?.goals ?? []).map((g) => <GoalCard key={g.id} goal={g} onDelete={() => delMut.mutate(g.id)} />)
            )}
          </div>
        )}

        {/* Slain */}
        {tab === "slain" && (
          <div className="space-y-3">
            {(slainQ.data?.goals ?? []).length === 0 ? (
              <p className="text-center py-16 text-sm" style={{ color: "#6B6864" }}>
                No quests slain yet. Forge one and grind it to zero.
              </p>
            ) : (
              (slainQ.data?.goals ?? []).map((g) => (
                <div key={g.id} className="p-4 rounded-lg border" style={{ background: "#13161F", borderColor: "rgba(255,213,79,0.3)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>👑 {g.title}</p>
                      <p className="text-xs mt-1" style={{ color: "#6B6864" }}>
                        {TYPE_LABELS[g.type].label} · slain {g.slain_at ? new Date(g.slain_at).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full" style={{ background: "rgba(255,213,79,0.15)", color: "#FFD54F" }}>📕 +1 Tome</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Forge */}
        {tab === "forge" && (
          <div className="rounded-xl p-6 border max-w-lg" style={{ background: "#13161F", borderColor: "rgba(255,213,79,0.15)" }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>
              Forge a Quest
            </h2>
            <div className="space-y-4">
              <Field label="Title">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Publish my novel"
                  maxLength={120}
                  className="ss-input"
                />
              </Field>

              <Field label="Identity (optional)">
                <input
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  placeholder="Writer, Athlete, Polyglot…"
                  maxLength={40}
                  className="ss-input"
                />
              </Field>

              <div>
                <p className="text-[10px] uppercase tracking-widest mb-2 font-semibold" style={{ color: "#A09D96" }}>Cadence</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["quarterly", "monthly", "weekly"] as GoalType[]).map((k) => {
                    const def = TYPE_LABELS[k];
                    return (
                      <button
                        key={k}
                        onClick={() => setType(k)}
                        className="rounded p-3 text-left transition-all"
                        style={{
                          background: type === k ? `${def.color}20` : "rgba(255,255,255,0.03)",
                          border: `1px solid ${type === k ? def.color : "rgba(255,255,255,0.06)"}`,
                        }}
                      >
                        <p className="text-xs font-bold" style={{ color: type === k ? def.color : "#F0EDE6" }}>
                          {def.label}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: "#6B6864" }}>
                          {def.hp.toLocaleString()} HP · {def.days}d
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => createMut.mutate()}
                disabled={!title.trim() || createMut.isPending}
                className="w-full py-3 rounded-md text-xs uppercase tracking-widest font-bold disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#C89A3E,#FFD54F)", color: "#0C0E14" }}
              >
                {createMut.isPending ? "Forging…" : "Forge Quest"}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function GoalCard({ goal, onDelete }: { goal: Goal; onDelete: () => void }) {
  const def = TYPE_LABELS[goal.type];
  const pct = (goal.hp_remaining / goal.hp_total) * 100;
  const daysLeft = Math.max(0, Math.ceil((Date.parse(goal.deadline) - Date.now()) / 86400000));

  return (
    <div
      className="rounded-xl p-5 border"
      style={{ background: "#13161F", borderColor: `${def.color}40` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${def.color}20`, color: def.color }}>
              {def.label}
            </span>
            {goal.identity && (
              <span className="text-[10px] uppercase tracking-widest" style={{ color: "#A09D96" }}>
                · {goal.identity}
              </span>
            )}
          </div>
          <h3 className="text-base font-bold" style={{ color: "#F0EDE6", fontFamily: "'Cinzel',serif" }}>{goal.title}</h3>
        </div>
        <button onClick={onDelete} className="text-[10px] px-2 py-1 rounded" style={{ color: "#6B6864", background: "rgba(255,255,255,0.03)" }}>
          Abandon
        </button>
      </div>

      <div className="flex justify-between text-xs mb-1" style={{ color: "#A09D96" }}>
        <span>Boss HP</span>
        <span className="font-mono" style={{ color: def.color }}>
          {goal.hp_remaining.toLocaleString()} / {goal.hp_total.toLocaleString()}
        </span>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full transition-all"
          style={{
            width: `${pct}%`,
            background: def.color,
            boxShadow: `0 0 12px ${def.color}80`,
          }}
        />
      </div>
      <p className="text-[10px] mt-2" style={{ color: "#6B6864" }}>
        {daysLeft} day{daysLeft === 1 ? "" : "s"} left · Link tasks via Task Edit dialog to drain HP.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-widest mb-1 font-semibold" style={{ color: "#A09D96" }}>
        {label}
      </div>
      {children}
    </label>
  );
}
