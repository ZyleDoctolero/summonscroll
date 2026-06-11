import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { toast } from "sonner";
import { AppShell } from "@/components/game/AppShell";
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

  if (profileQ.isLoading) return <div className="min-h-screen grid place-items-center" style={{ background: "#0C0E14", color: "#A09D96" }}>Loading…</div>;
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
            className="rounded-2xl p-6 border"
            style={{
              background: "linear-gradient(180deg, #1B1F2A 0%, #15181F 100%)",
              borderColor: result.won ? "rgba(255,213,79,0.32)" : "rgba(224,82,82,0.32)",
              boxShadow: `0 24px 64px rgba(0,0,0,0.55), 0 0 32px ${result.won ? "rgba(255,213,79,0.12)" : "rgba(224,82,82,0.12)"}`,
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
                className="text-4xl font-bold mb-1"
                style={{
                  color: result.won ? "#FFD54F" : "#E05252",
                  fontFamily: "'Cinzel',serif",
                  letterSpacing: "0.05em",
                }}
              >
                {result.won ? "⚔ VICTORY" : "💀 DEFEAT"}
              </motion.p>
              <p className="text-sm" style={{ color: "#A09D96" }}>
                vs {result.enemyName} — <NumberFlow value={result.rounds} /> rounds
              </p>
            </motion.div>

            {/* HP bars */}
            <div className="space-y-3 mb-4">
              <AnimatedHpBar label="Your Team" current={result.playerHp} max={result.playerMaxHp} color="#5FAD41" delay={0.15} />
              <AnimatedHpBar label={result.enemyName} current={result.enemyHp} max={result.enemyMaxHp} color="#E05252" delay={0.22} />
            </div>

            {/* Battle log */}
            <div className="rounded-lg p-3 mb-4 max-h-48 overflow-y-auto space-y-1" style={{ background: "#0C0E14" }}>
              {visibleLog.map((entry, i) => (
                <motion.div
                  key={`${i}-${entry.round}`}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: dur.fast, ease: ease.out, delay: logDelays[i] }}
                  className="text-xs flex items-center gap-2"
                  style={{ color: entry.actor === "player" ? "#F0EDE6" : "#E05252" }}
                >
                  <span className="font-mono w-8 flex-shrink-0" style={{ color: "#6B6864" }}>R{entry.round}</span>
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
                className="w-full py-2.5 rounded-lg text-sm"
                style={{ background: "rgba(255,255,255,0.05)", color: "#A09D96" }}
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
                    className="rounded-lg p-4 mb-4"
                    style={{ background: "rgba(255,213,79,0.05)", border: "1px solid rgba(255,213,79,0.22)" }}
                  >
                    <p className="text-xs uppercase tracking-[0.18em] font-semibold mb-2" style={{ color: "#A09D96", fontFamily: "'Cinzel',serif" }}>
                      Rewards
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm font-bold" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                      {result.rewards.crystals > 0 && (
                        <RewardChip>
                          <span style={{ color: "#7FD4FF" }}>💎 +<NumberFlow value={result.rewards.crystals} /></span>
                        </RewardChip>
                      )}
                      {result.rewards.shards > 0 && (
                        <RewardChip>
                          <span style={{ color: "#7FD4FF" }}>🔷 +<NumberFlow value={result.rewards.shards} /></span>
                        </RewardChip>
                      )}
                      <RewardChip>
                        <span style={{ color: "#A09D96" }}>✦ +<NumberFlow value={result.rewards.xp} /> XP</span>
                      </RewardChip>
                      {milestoneDrops.map((d, i) => (
                        <RewardChip key={i} delay={0.06 + i * 0.05}>
                          <span style={{ color: "#FFD54F" }}>+<NumberFlow value={d.qty} /> {d.name}</span>
                        </RewardChip>
                      ))}
                    </div>
                    {badges.wailingWall && (
                      <motion.p
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: dur.measured, ease: ease.weighty, delay: 0.25 }}
                        className="mt-3 text-sm text-center"
                        style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif", letterSpacing: "0.04em" }}
                      >
                        🏛 The Wailing Wall crumbles before you.{" "}
                        <span style={{ color: "#F0EDE6" }}>Badge earned.</span>
                      </motion.p>
                    )}
                    {badges.apex && (
                      <motion.p
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: dur.measured, ease: ease.weighty, delay: 0.3 }}
                        className="mt-3 text-sm text-center"
                        style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif", letterSpacing: "0.04em" }}
                      >
                        👑 You are the Apex.{" "}
                        <span style={{ color: "#F0EDE6" }}>Crown bestowed.</span>
                      </motion.p>
                    )}
                  </motion.div>
                )}
                <motion.button
                  onClick={() => setResult(null)}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ y: -1 }}
                  transition={trans.springy}
                  className="w-full py-3 rounded-lg font-bold text-sm uppercase tracking-[0.18em]"
                  style={{ background: "linear-gradient(135deg,#C89A3E,#FFD54F)", color: "#0C0E14", boxShadow: "0 4px 20px rgba(255,213,79,0.28)" }}
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
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-1" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>Battle Arena</h1>
        <p className="text-sm mb-6" style={{ color: "#A09D96" }}>
          {canBattle ? `Team of ${team.length} monsters ready.` : "Build a team of 3+ monsters on your Island first."}
        </p>

        {!canBattle && (
          <div className="rounded-xl p-8 text-center border-2 border-dashed mb-6" style={{ borderColor: "rgba(255,255,255,0.08)", color: "#A09D96" }}>
            <p className="text-4xl mb-2">⚔</p>
            <p className="mb-4">Build a team of 3+ to enter battle.</p>
            <a href="/island" className="px-4 py-2 rounded-md text-xs uppercase tracking-widest font-bold"
              style={{ background: "linear-gradient(135deg,#C89A3E,#FFD54F)", color: "#0C0E14" }}>
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
        {(historyQ.data?.battles ?? []).length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#F0EDE6", fontFamily: "'Cinzel',serif" }}>Recent Battles</h2>
            <div className="space-y-2">
              {(historyQ.data?.battles ?? []).slice(0, 10).map((b: { id: string; mode: string; floor: number; player_won: boolean; enemy_name: string; rounds: number; reward_crystals: number; created_at: string }) => (
                <div key={b.id} className="rounded-md p-3 flex items-center justify-between text-sm"
                  style={{ background: "#13161F", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div>
                    <span className="font-bold" style={{ color: b.player_won ? "#5FAD41" : "#E05252" }}>
                      {b.player_won ? "✓" : "✗"}
                    </span>
                    <span className="ml-2" style={{ color: "#F0EDE6" }}>{b.enemy_name}</span>
                    <span className="ml-2 text-xs" style={{ color: "#6B6864" }}>Floor {b.floor} · {b.rounds}R</span>
                  </div>
                  <span className="text-xs font-mono" style={{ color: "#7FD4FF" }}>+{b.reward_crystals}💎</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ModeCard({ title, icon, desc, sub, progress, disabled, loading, onClick }: {
  title: string; icon: string; desc: string; sub?: string; progress?: number;
  disabled: boolean; loading: boolean; onClick: () => void;
}) {
  return (
    <div className="rounded-xl p-6 border" style={{ background: "#13161F", borderColor: "rgba(255,255,255,0.07)" }}>
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold mb-1" style={{ color: "#F0EDE6", fontFamily: "'Cinzel',serif" }}>{title}</h3>
      <p className="text-sm mb-1" style={{ color: "#A09D96" }}>{desc}</p>
      {sub && <p className="text-xs mb-3" style={{ color: "#6B6864" }}>{sub}</p>}
      {progress !== undefined && (
        <div className="h-1.5 rounded-full mb-4 overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full" style={{ width: `${progress}%`, background: "linear-gradient(90deg,#C89A3E,#FFD54F)" }} />
        </div>
      )}
      <button onClick={onClick} disabled={disabled}
        className="w-full py-2.5 rounded-md font-bold text-xs uppercase tracking-widest disabled:opacity-30"
        style={{ background: "linear-gradient(135deg,#C89A3E,#FFD54F)", color: "#0C0E14" }}>
        {loading ? "Fighting…" : "Enter →"}
      </button>
    </div>
  );
}

function AnimatedHpBar({ label, current, max, color, delay = 0 }: { label: string; current: number; max: number; color: string; delay?: number }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: "#A09D96" }}>
        <span>{label}</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>
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
