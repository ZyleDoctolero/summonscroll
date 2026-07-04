import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
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
        <div
          className="w-16 h-16 flex items-center justify-center mb-3"
          style={{
            border: "2px solid rgba(232,93,58,0.3)",
            borderRadius: 0,
            background: "rgba(232,93,58,0.06)",
            boxShadow: "3px 3px 0 rgba(0,0,0,0.4)",
          }}
        >
          <Icon name="target" size={28} color="var(--danger)" />
        </div>
        <h1
          className="text-3xl font-bold mb-1"
          style={{
            fontFamily: "var(--ss-font-pixel)",
            color: "var(--gold-bright)",
            letterSpacing: "0.08em",
          }}
        >
          BOUNTIES
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
              (activeQ.data?.goals ?? []).map((g, i) => (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                >
                  <GoalCard goal={g} onDelete={() => delMut.mutate(g.id)} />
                </motion.div>
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
              (slainQ.data?.goals ?? []).map((g, i) => (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
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
                </motion.div>
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
                  className="text-[11px] uppercase tracking-widest mb-2 font-semibold"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  Cadence
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                          style={{ color: type === k ? def.color : "var(--ink-secondary)" }}
                        >
                          {def.label}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-secondary)" }}>
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
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className="ss-chip whitespace-nowrap"
              style={{ background: `${def.color}20`, color: def.color }}
            >
              {def.label}
            </span>
            {goal.identity && (
              <span
                className="text-[11px] uppercase tracking-widest truncate"
                style={{ color: "var(--ink-secondary)" }}
                title={goal.identity}
              >
                · {goal.identity}
              </span>
            )}
          </div>
          <h3 className="text-base font-bold break-words" style={{ color: "var(--ink-primary)" }}>
            {goal.title}
          </h3>
        </div>
        <button
          onClick={onDelete}
          className="ss-btn ss-btn-ghost text-[11px] h-8 px-3 shrink-0 self-start sm:self-auto"
        >
          Abandon
        </button>
      </div>

      <div className="flex justify-between text-xs mb-1" style={{ color: "var(--ink-secondary)" }}>
        <span>Boss HP</span>
        <span className="font-serif" style={{ color: def.color }}>
          {goal.hp_remaining.toLocaleString()} / {goal.hp_total.toLocaleString()}
        </span>
      </div>
      <div className="ss-bar-pixel" style={{ height: 10 }}>
        <div
          className="ss-bar-pixel-fill transition-all"
          style={{
            width: `${pct}%`,
            background: def.color,
            boxShadow: `0 0 12px ${def.color}80`,
          }}
        />
      </div>
      <p className="text-[11px] mt-2" style={{ color: "var(--ink-secondary)" }}>
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
        className="text-[11px] uppercase tracking-widest mb-1 font-semibold"
        style={{ color: "var(--ink-secondary)" }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}
