import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/game/AppShell";
import { getMyProfile } from "@/lib/game/profile.functions";
import { getTeam, getTowerProgress, startArenaBattle, getBattleHistory } from "@/lib/game/battle.functions";

export const Route = createFileRoute("/_authenticated/battle")({
  head: () => ({ meta: [{ title: "Battle — SummonScroll" }] }),
  component: BattlePage,
});

type BattleResult = Awaited<ReturnType<typeof startArenaBattle>>;

function BattlePage() {
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const fetchTeam = useServerFn(getTeam);
  const fetchTower = useServerFn(getTowerProgress);
  const fetchHistory = useServerFn(getBattleHistory);
  const doBattle = useServerFn(startArenaBattle);

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const teamQ = useQuery({ queryKey: ["team"], queryFn: () => fetchTeam() });
  const towerQ = useQuery({ queryKey: ["tower"], queryFn: () => fetchTower() });
  const historyQ = useQuery({ queryKey: ["battle-history"], queryFn: () => fetchHistory() });

  const [result, setResult] = useState<BattleResult | null>(null);
  const [logIndex, setLogIndex] = useState(0);

  const battleMut = useMutation({
    mutationFn: async (v: any) => doBattle({ data: v }),
    onSuccess: (res) => {
      setResult(res as BattleResult);
      setLogIndex(0);
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
    return (
      <AppShell profile={profile}>
        <div className="p-6 md:p-10 max-w-2xl mx-auto">
          <div className="rounded-xl p-6 border" style={{ background: "#13161F", borderColor: "rgba(255,255,255,0.07)" }}>
            <div className="text-center mb-6">
              <p className="text-4xl font-bold mb-1" style={{ color: result.won ? "#FFD54F" : "#E05252", fontFamily: "'Cinzel',serif" }}>
                {result.won ? "⚔ VICTORY" : "💀 DEFEAT"}
              </p>
              <p className="text-sm" style={{ color: "#A09D96" }}>vs {result.enemyName} — {result.rounds} rounds</p>
            </div>

            {/* HP bars */}
            <div className="space-y-3 mb-4">
              <HpBar label="Your Team" current={result.playerHp} max={result.playerMaxHp} color="#5FAD41" />
              <HpBar label={result.enemyName} current={result.enemyHp} max={result.enemyMaxHp} color="#E05252" />
            </div>

            {/* Battle log */}
            <div className="rounded-lg p-3 mb-4 max-h-48 overflow-y-auto space-y-1" style={{ background: "#0C0E14" }}>
              {visibleLog.map((entry, i) => (
                <div key={i} className="text-xs flex items-center gap-2"
                  style={{ color: entry.actor === "player" ? "#F0EDE6" : "#E05252" }}>
                  <span className="font-mono w-8 flex-shrink-0" style={{ color: "#6B6864" }}>R{entry.round}</span>
                  <span className="flex-1">{entry.action}</span>
                  <span className="font-mono font-bold">-{entry.damage}</span>
                </div>
              ))}
            </div>

            {!allShown ? (
              <button onClick={() => setLogIndex((i) => i + 5)} className="w-full py-2 rounded-lg text-sm" style={{ background: "rgba(255,255,255,0.05)", color: "#A09D96" }}>
                Next →
              </button>
            ) : (
              <>
                {result.won && (
                  <div className="rounded-lg p-4 mb-4" style={{ background: "rgba(255,213,79,0.05)", border: "1px solid rgba(255,213,79,0.2)" }}>
                    <p className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: "#A09D96", fontFamily: "'Cinzel',serif" }}>Rewards</p>
                    <div className="flex gap-4 text-sm font-bold" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                      {result.rewards.gems > 0 && <span style={{ color: "#FFD54F" }}>+{result.rewards.gems} 💎</span>}
                      {result.rewards.shards > 0 && <span style={{ color: "#7FD4FF" }}>+{result.rewards.shards} 🔷</span>}
                      <span style={{ color: "#A09D96" }}>+{result.rewards.xp} XP</span>
                    </div>
                  </div>
                )}
                <button onClick={() => setResult(null)} className="w-full py-3 rounded-lg font-bold text-sm uppercase tracking-widest"
                  style={{ background: "linear-gradient(135deg,#C89A3E,#FFD54F)", color: "#0C0E14" }}>
                  Continue
                </button>
              </>
            )}
          </div>
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
              {(historyQ.data?.battles ?? []).slice(0, 10).map((b: any) => (
                <div key={b.id} className="rounded-md p-3 flex items-center justify-between text-sm"
                  style={{ background: "#13161F", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div>
                    <span className="font-bold" style={{ color: b.player_won ? "#5FAD41" : "#E05252" }}>
                      {b.player_won ? "✓" : "✗"}
                    </span>
                    <span className="ml-2" style={{ color: "#F0EDE6" }}>{b.enemy_name}</span>
                    <span className="ml-2 text-xs" style={{ color: "#6B6864" }}>Floor {b.floor} · {b.rounds}R</span>
                  </div>
                  <span className="text-xs font-mono" style={{ color: "#FFD54F" }}>+{b.reward_gems}💎</span>
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

function HpBar({ label, current, max, color }: { label: string; current: number; max: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: "#A09D96" }}>
        <span>{label}</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>{Math.max(0, current).toLocaleString()} / {max.toLocaleString()}</span>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(0, (current / max) * 100)}%`, background: color }} />
      </div>
    </div>
  );
}
