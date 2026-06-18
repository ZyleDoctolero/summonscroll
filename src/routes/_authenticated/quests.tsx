import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { AppShell } from "@/components/game/AppShell";
import { AtmosphereBackdrop } from "@/components/game/AtmosphereBackdrop";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  getMyProfile,
  listGoals,
  createGoal,
  deleteGoal,
  type GoalType,
  type Goal,
} from "@/lib/game/supabase-api";
import { Icon } from "@/components/ui/Icon";
import { LoadingScreen } from "@/components/game/LoadingScreen";

export const Route = createFileRoute("/_authenticated/quests")({
  component: QuestsPage,
});

const TYPE_LABELS: Record<GoalType, { label: string; days: number; hp: number; color: string }> = {
  quarterly: { label: "Quarterly Boss", days: 90, hp: 10000, color: "var(--danger)" },
  monthly: { label: "Monthly Quest", days: 30, hp: 3500, color: "var(--gold-bright)" },
  weekly: { label: "Weekly Trial", days: 7, hp: 800, color: "var(--gold-bright)" },
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
      setTitle("");
      setIdentity("");
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
    return <LoadingScreen realmSlug="whispering-woods" />;
  }
  if (!profileQ.data) return null;

  return (
    <AppShell profile={profileQ.data.profile}>
      <AtmosphereBackdrop realm="wild" />
      <div className="p-6 md:p-10 max-w-6xl">
        <h1 className="t-h1 text-3xl font-bold mb-1" style={{ color: "var(--gold-bright)" }}>
          Quests
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--ink-secondary)" }}>
          A goal is a boss. Each task you finish drains its HP. Slay one → mint a Tome of Reverse
          Heaven.
        </p>

        {/* Tabs */}
        <div className="flex gap-6 mb-6 border-b" style={{ borderColor: "rgba(61,46,31,0.08)" }}>
          {[
            { key: "active" as const, label: "Active" },
            { key: "slain" as const, label: "Slain" },
            { key: "forge" as const, label: "Forge New" },
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

        {/* Active */}
        {tab === "active" && (
          <div className="space-y-3">
            {(activeQ.data?.goals ?? []).length === 0 ? (
              <EmptyState
                icon="crown"
                title="The Page Has Been Written Today"
                body="Return when the dawn resets. The creatures rest with you."
                cta={{
                  label: "Name the Boss",
                  onClick: () => setTab("forge"),
                }}
              />
            ) : (
              (activeQ.data?.goals ?? []).map((g) => (
                <GoalCard key={g.id} goal={g} onDelete={() => delMut.mutate(g.id)} />
              ))
            )}
          </div>
        )}

        {/* Slain */}
        {tab === "slain" && (
          <div className="space-y-3">
            {(slainQ.data?.goals ?? []).length === 0 ? (
              <EmptyState
                icon="crown"
                title="The wall is bare."
                body="When you slay your first quarterly boss, the head hangs here."
              />
            ) : (
              (slainQ.data?.goals ?? []).map((g) => (
                <div
                  key={g.id}
                  className="game-panel p-5"
                  style={{ borderColor: "var(--ss-hairline-active)" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="font-bold flex items-center gap-1.5"
                        style={{ color: "var(--gold-bright)" }}
                      >
                        <Icon name="crown" size={14} color="var(--gold-bright)" />
                        <span>{g.title}</span>
                      </p>
                      <p className="text-xs mt-1" style={{ color: "var(--ink-secondary)" }}>
                        {TYPE_LABELS[g.type].label} · slain{" "}
                        {g.slain_at ? new Date(g.slain_at).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <span className="ss-chip ss-chip-gold flex items-center gap-1">
                      <Icon name="tome" size={11} color="var(--gold-bright)" />
                      <span>+1 Tome</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Forge */}
        {tab === "forge" && (
          <div className="game-panel p-5 max-w-lg">
            <h2 className="text-lg font-bold mb-4" style={{ color: "var(--gold-bright)" }}>
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
                <p
                  className="text-[10px] uppercase tracking-widest mb-2 font-semibold"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  Cadence
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(["quarterly", "monthly", "weekly"] as GoalType[]).map((k) => {
                    const def = TYPE_LABELS[k];
                    return (
                      <button
                        key={k}
                        onClick={() => setType(k)}
                        className="ss-card rounded p-3 text-left transition-all"
                        style={{
                          background: type === k ? `${def.color}20` : undefined,
                          borderColor: type === k ? def.color : undefined,
                        }}
                      >
                        <p
                          className="text-xs font-bold"
                          style={{ color: type === k ? def.color : "var(--bg-panel)" }}
                        >
                          {def.label}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--ink-secondary)" }}>
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
                className="ss-btn ss-btn-d-primary w-full disabled:opacity-40"
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
    <div className="ss-card" style={{ borderColor: `${def.color}40` }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="ss-chip" style={{ background: `${def.color}20`, color: def.color }}>
              {def.label}
            </span>
            {goal.identity && (
              <span
                className="text-[10px] uppercase tracking-widest"
                style={{ color: "var(--ink-secondary)" }}
              >
                · {goal.identity}
              </span>
            )}
          </div>
          <h3 className="text-base font-bold" style={{ color: "var(--bg-panel)" }}>
            {goal.title}
          </h3>
        </div>
        <button onClick={onDelete} className="ss-btn ss-btn-ghost text-[10px] min-h-[32px] px-3">
          Abandon
        </button>
      </div>

      <div className="flex justify-between text-xs mb-1" style={{ color: "var(--ink-secondary)" }}>
        <span>Boss HP</span>
        <span className="font-serif" style={{ color: def.color }}>
          {goal.hp_remaining.toLocaleString()} / {goal.hp_total.toLocaleString()}
        </span>
      </div>
      <div
        className="h-3 rounded-full overflow-hidden"
        style={{ background: "rgba(61,46,31,0.06)" }}
      >
        <div
          className="h-full transition-all"
          style={{
            width: `${pct}%`,
            background: def.color,
            boxShadow: `0 0 12px ${def.color}80`,
          }}
        />
      </div>
      <p className="text-[10px] mt-2" style={{ color: "var(--ink-secondary)" }}>
        {daysLeft} day{daysLeft === 1 ? "" : "s"} left · Link tasks via Task Edit dialog to drain
        HP.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div
        className="text-[10px] uppercase tracking-widest mb-1 font-semibold"
        style={{ color: "var(--ink-secondary)" }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}
