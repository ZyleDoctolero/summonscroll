import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { toast } from "sonner";
import { AppShell } from "@/components/game/AppShell";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { whisper } from "@/components/game/WhisperFeed";
import { trans, ease, dur, reducedMotion, stagger } from "@/lib/ui/motion-tokens";
import { getMyProfile, getTeam, getTowerProgress, startArenaBattle, getBattleHistory } from "@/lib/game/supabase-api";

export const Route = createFileRoute("/_authenticated/battle")({
  component: BattlePage,
});

type BattleResult = Awaited<ReturnType<typeof startArenaBattle>>;

function BattlePage() {
  const qc = useQueryClient();

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const teamQ = useQuery({ queryKey: ["team"], queryFn: getTeam });
  const towerQ = useQuery({ queryKey: ["tower"], queryFn: getTowerProgress });
  const historyQ = useQuery({ queryKey: ["battle-history"], queryFn: getBattleHistory });

  const [result, setResult] = useState<BattleResult | null>(null);
  const [logIndex, setLogIndex] = useState(0);

  const battleMut = useMutation({
    mutationFn: async (v: { mode: "chaos_tower" | "event" | "boss_rush"; floor: number }) => startArenaBattle(v.mode, v.floor),
    onSuccess: (res) => {
      const r = res as BattleResult & { badges?: { wailingWall?: boolean; apex?: boolean }; floorType?: string };
      setResult(r);
      setLogIndex(0);
      if (r.badges?.wailingWall) {
        whisper({ monsterName: "Wailing Wall", line: "The wall remembers your name now.", tone: "grave" });
      }
      if (r.badges?.apex) {
        whisper({ monsterName: "The Apex", line: "All hundred floors climbed. The crown is yours.", tone: "grave" });
      }
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["tower"] });
      qc.invalidateQueries({ queryKey: ["battle-history"] });
      qc.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (profileQ.isLoading) return <div className="min-h-screen grid place-items-center" style={{ background: "var(--bg-deep)", color: "var(--ink-secondary)" }}>Loading…</div>;
  if (!profileQ.data) return null;

  const profile = profileQ.data.profile;
  const team = teamQ.data?.team ?? [];
  const highestFloor = towerQ.data?.progress?.highest_floor ?? 0;
  const nextFloor = highestFloor + 1;
  const canBattle = team.length >= 3;

  // Battle result view
  if (result) {
    const visibleLog = result.log.slice(0, logIndex + 5);
    const allShown = logIndex + 5 >= result.log.length;
    const milestoneDrops = (result as { milestoneDrops?: Array<{ name: string; qty: number }> }).milestoneDrops ?? [];
    const badges = (result as { badges?: { wailingWall?: boolean; apex?: boolean } }).badges ?? {};
    const rm = reducedMotion();
    const logDelays = stagger(visibleLog.length, 0.035);
    return (
      <AppShell profile={profile}>
        <div className="p-6 md:p-10 max-w-2xl mx-auto">
          <motion.div
            initial={rm ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.985 }}
            animate={rm ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: dur.measured, ease: ease.weighty }}
            className="ss-modal"
            style={{
              borderColor: result.won ? "rgba(255,213,79,0.32)" : "rgba(224,82,82,0.32)",
              boxShadow: `var(--ss-shadow-high), 0 0 32px ${result.won ? "rgba(255,213,79,0.12)" : "rgba(224,82,82,0.12)"}`,
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: dur.measured, ease: ease.weighty, delay: 0.04 }}
              className="text-center mb-6"
            >
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: dur.measured, ease: ease.weighty, delay: 0.08 }}
                className="t-display text-4xl font-bold mb-1"
                style={{
                  color: result.won ? "var(--gold-bright)" : "var(--danger)",
                  letterSpacing: "0.05em",
                }}
              >
                {result.won ? <span className="flex items-center justify-center gap-2"><Icon name="battle" size={28} color="var(--gold-bright)" /> VICTORY</span> : <span className="flex items-center justify-center gap-2"><Icon name="death" size={28} color="var(--danger)" /> DEFEAT</span>}
              </motion.p>
              <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
                vs {result.enemyName} — <NumberFlow value={result.rounds} /> rounds
              </p>
            </motion.div>

            {/* HP bars */}
            <div className="space-y-3 mb-4">
              <AnimatedHpBar label="Your Team" current={result.playerHp} max={result.playerMaxHp} color="#5FAD41" delay={0.15} />
              <AnimatedHpBar label={result.enemyName} current={result.enemyHp} max={result.enemyMaxHp} color="#E05252" delay={0.22} />
            </div>

            {/* Battle log */}
            <div className="ss-pane mb-4 max-h-48 overflow-y-auto space-y-1">
              {visibleLog.map((entry, i) => (
                <motion.div
                  key={`${i}-${entry.round}`}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: dur.fast, ease: ease.out, delay: logDelays[i] }}
                  className="text-xs flex items-center gap-2"
                  style={{ color: entry.actor === "player" ? "var(--ink-primary)" : "var(--danger)" }}
                >
                  <span className="font-mono w-8 flex-shrink-0" style={{ color: "var(--ink-tertiary)" }}>R{entry.round}</span>
                  <span className="flex-1">{entry.action}</span>
                  <span className="font-mono font-bold">-{entry.damage}</span>
                </motion.div>
              ))}
            </div>

            {!allShown ? (
              <motion.button
                onClick={() => setLogIndex((i) => i + 5)}
                whileTap={{ scale: 0.97 }}
                whileHover={{ y: -1 }}
                transition={trans.springy}
                className="ss-btn ss-btn-secondary w-full"
              >
                Next →
              </motion.button>
            ) : (
              <>
                {result.won && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: dur.measured, ease: ease.weighty }}
                  className="ss-card ss-burst mb-4"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] font-semibold mb-2" style={{ color: "var(--ink-secondary)" }}>
                      Rewards
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm font-bold t-mono">
                      {result.rewards.crystals > 0 && (
                        <RewardChip>
                          <span style={{ color: "var(--cyan)" }}><Icon name="crystal" size={12} color="var(--cyan)" /> +<NumberFlow value={result.rewards.crystals} /></span>
                        </RewardChip>
                      )}
                      {result.rewards.shards > 0 && (
                        <RewardChip>
                          <span style={{ color: "var(--cyan)" }}>🔷 +<NumberFlow value={result.rewards.shards} /></span>
                        </RewardChip>
                      )}
                      <RewardChip>
                        <span style={{ color: "var(--ink-secondary)" }}>✦ +<NumberFlow value={result.rewards.xp} /> XP</span>
                      </RewardChip>
                      {milestoneDrops.map((d, i) => (
                        <RewardChip key={i} delay={0.06 + i * 0.05}>
                          <span style={{ color: "var(--gold-bright)" }}>+<NumberFlow value={d.qty} /> {d.name}</span>
                        </RewardChip>
                      ))}
                    </div>
                    {badges.wailingWall && (
                      <motion.p
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: dur.measured, ease: ease.weighty, delay: 0.25 }}
                        className="mt-3 text-sm text-center"
                        style={{ color: "var(--gold-bright)", letterSpacing: "0.04em" }}
                      >
                        🏛 The Wailing Wall crumbles before you.{" "}
                        <span style={{ color: "var(--ink-primary)" }}>Badge earned.</span>
                      </motion.p>
                    )}
                    {badges.apex && (
                      <motion.p
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: dur.measured, ease: ease.weighty, delay: 0.3 }}
                        className="mt-3 text-sm text-center"
                        style={{ color: "var(--gold-bright)", letterSpacing: "0.04em" }}
                      >
                        <Icon name="crown" size={18} color="var(--gold-bright)" className="inline mr-1" /> You are the Apex.{" "}
                        <span style={{ color: "var(--ink-primary)" }}>Crown bestowed.</span>
                      </motion.p>
                    )}
                  </motion.div>
                )}
                <motion.button
                  onClick={() => setResult(null)}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ y: -1 }}
                  transition={trans.springy}
                  className="w-full py-3 rounded-lg font-bold text-sm uppercase tracking-[0.18em] ss-btn ss-btn-primary"
                >
                  Continue
                </motion.button>
              </>
            )}
          </motion.div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell profile={profile}>
      <div className="bg-atmos bg-atmos-battle p-6 md:p-10 max-w-4xl mx-auto min-h-screen">
        <h1 className="t-h1 text-3xl font-bold mb-1" style={{ color: "var(--gold-bright)" }}>Battle Arena</h1>
        <p className="text-sm mb-6" style={{ color: "var(--ink-secondary)" }}>
          {canBattle ? `Team of ${team.length} monsters ready.` : "Build a team of 3+ monsters on your Island first."}
        </p>

        {!canBattle && (
          <div className="rounded-xl p-8 text-center border-2 border-dashed mb-6 ss-card" style={{ borderColor: "rgba(255,255,255,0.08)", color: "var(--ink-secondary)" }}>
            <Icon name="battle" size={48} color="var(--ink-tertiary)" className="mb-2 mx-auto" />
            <p className="mb-4">Build a team of 3+ to enter battle.</p>
            <a href="/island" className="ss-btn ss-btn-primary">
              Go to Island →
            </a>
          </div>
        )}

        {/* Battle modes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <ModeCard title="Chaos Tower" icon="🗼" desc={`Floor ${nextFloor} — Endless progression`}
            sub={`Highest: Floor ${highestFloor}`} progress={Math.min(100, highestFloor)}
            disabled={!canBattle || battleMut.isPending}
            loading={battleMut.isPending}
            onClick={() => battleMut.mutate({ mode: "chaos_tower", floor: nextFloor })} />
          <ModeCard title="Boss Rush" icon="⚔" desc="5 bosses in sequence" sub="High risk, high reward"
            disabled={!canBattle || battleMut.isPending || (profile.level < 20)}
            loading={battleMut.isPending}
            onClick={() => battleMut.mutate({ mode: "boss_rush", floor: 1 })} />
        </div>

        {/* Battle history */}
        <div>
          <h2 className="text-lg font-bold mb-3" style={{ color: "var(--ink-primary)" }}>Recent Battles</h2>
          {(historyQ.data?.battles ?? []).length === 0 ? (
            <EmptyState
              icon="battle"
              title="No battles fought."
              body="When you climb the Tower, every fight goes in the ledger here."
            />
          ) : (
            <div className="space-y-2">
              {(historyQ.data?.battles ?? []).slice(0, 10).map((b: { id: string; mode: string; floor: number; player_won: boolean; enemy_name: string; rounds: number; reward_crystals: number; created_at: string }) => (
                <div key={b.id} className="ss-card rounded-md p-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-bold" style={{ color: b.player_won ? "var(--success)" : "var(--danger)" }}>
                      {b.player_won ? <Icon name="check" size={14} color="var(--success)" /> : <Icon name="close" size={14} color="var(--danger)" />}
                    </span>
                    <span className="ml-2" style={{ color: "var(--ink-primary)" }}>{b.enemy_name}</span>
                    <span className="ml-2 text-xs" style={{ color: "var(--ink-tertiary)" }}>Floor {b.floor} · {b.rounds}R</span>
                  </div>
                  <span className="text-xs font-mono flex items-center gap-0.5" style={{ color: "var(--cyan)" }}><Icon name="crystal" size={10} color="var(--cyan)" />+{b.reward_crystals}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function ModeCard({ title, icon, desc, sub, progress, disabled, loading, onClick }: {
  title: string; icon: string; desc: string; sub?: string; progress?: number;
  disabled: boolean; loading: boolean; onClick: () => void;
}) {
  return (
    <div className="ss-card rounded-xl p-6">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold mb-1" style={{ color: "var(--ink-primary)" }}>{title}</h3>
      <p className="text-sm mb-1" style={{ color: "var(--ink-secondary)" }}>{desc}</p>
      {sub && <p className="text-xs mb-3" style={{ color: "var(--ink-tertiary)" }}>{sub}</p>}
      {progress !== undefined && (
        <div className="h-1.5 rounded-full mb-4 overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full" style={{ width: `${progress}%`, background: "linear-gradient(90deg,var(--gold-glow),var(--gold-bright))" }} />
        </div>
      )}
      <button onClick={onClick} disabled={disabled}
        className="ss-btn ss-btn-primary w-full py-2.5 rounded-md font-bold text-xs uppercase tracking-widest disabled:opacity-30">
        {loading ? "Fighting…" : "Enter →"}
      </button>
    </div>
  );
}

function AnimatedHpBar({ label, current, max, color, delay = 0 }: { label: string; current: number; max: number; color: string; delay?: number }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: "var(--ink-secondary)" }}>
        <span>{label}</span>
        <span className="t-mono">
          <NumberFlow value={Math.max(0, current)} /> / {max.toLocaleString()}
        </span>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: dur.weighty, ease: ease.weighty, delay }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 10px ${color}80` }}
        />
      </div>
    </div>
  );
}

function RewardChip({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 4, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: dur.fast, ease: ease.weighty, delay }}
      className="inline-flex items-center"
    >
      {children}
    </motion.span>
  );
}
