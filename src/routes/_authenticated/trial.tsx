import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { forwardRef, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { AppShell } from "@/components/game/AppShell";
import { whisper } from "@/components/game/WhisperFeed";
import { trans, ease, dur, reducedMotion, stagger } from "@/lib/ui/motion-tokens";
import {
  getMyProfile,
  listMyMonsters,
  runTrial,
  getTrialCooldown,
  listMemorial,
} from "@/lib/game/supabase-api";

export const Route = createFileRoute("/_authenticated/trial")({
  component: TrialPage,
});

function TrialPage() {
  const qc = useQueryClient();
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const monstersQ = useQuery({ queryKey: ["my-monsters"], queryFn: listMyMonsters });
  const cooldownQ = useQuery({ queryKey: ["trial-cooldown"], queryFn: getTrialCooldown });
  const memorialQ = useQuery({ queryKey: ["memorial"], queryFn: listMemorial });

  const [picked, setPicked] = useState<string[]>([]);
  const [tab, setTab] = useState<"trial" | "memorial">("trial");
  const [confirming, setConfirming] = useState(false);
  const [results, setResults] = useState<Awaited<ReturnType<typeof runTrial>> | null>(null);

  const runMut = useMutation({
    mutationFn: () => runTrial(picked),
    onSuccess: (res) => {
      if (res.fullClear) {
        confetti({ particleCount: 300, spread: 100, colors: ["#C89A3E", "#FFD54F", "#F0EDE6"] });
        whisper({ monsterName: "Trial Keeper", line: "All five returned. The Echo is touched.", tone: "grave" });
      }
      for (const f of res.fallen) {
        whisper({ monsterName: f.name, line: "I will remember the road.", tone: "grave" });
      }
      setResults(res);
      setConfirming(false);
      setPicked([]);
      qc.invalidateQueries({ queryKey: ["my-monsters"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["trial-cooldown"] });
      qc.invalidateQueries({ queryKey: ["memorial"] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setConfirming(false);
    },
  });

  if (profileQ.isLoading || monstersQ.isLoading) {
    return <div className="min-h-screen grid place-items-center" style={{ background: "#0C0E14", color: "#A09D96" }}>Echoes gather…</div>;
  }
  if (!profileQ.data) return null;

  const roster = (monstersQ.data?.userMonsters ?? []) as Array<{ id: string; monster: { name: string; role: string; rarity: string }; level: number; bond_percent: number; star_level: number }>;

  return (
    <AppShell profile={profileQ.data.profile}>
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-1" style={{ color: "#E05252", fontFamily: "'Cinzel',serif" }}>
          ☠ Trial of Echoes
        </h1>
        <p className="text-sm mb-6" style={{ color: "#A09D96" }}>
          20 procedural floors. <b style={{ color: "#E05252" }}>Permadeath</b>. Pick 5 souls. Bring them home or honor them in the Memorial.
        </p>

        <div className="flex gap-6 mb-6 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {[
            { key: "trial" as const, label: "Enter Trial" },
            { key: "memorial" as const, label: "Memorial" },
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

        {tab === "trial" && (
          <>
            {/* Cooldown banner */}
            {cooldownQ.data && !cooldownQ.data.canStart && (
              <div className="rounded-lg p-4 mb-4 border" style={{ background: "rgba(224,82,82,0.08)", borderColor: "rgba(224,82,82,0.3)" }}>
                <p className="text-sm" style={{ color: "#E05252" }}>
                  ⏳ Cooldown: {cooldownQ.data.daysRemaining} day{cooldownQ.data.daysRemaining === 1 ? "" : "s"} until next trial.
                </p>
              </div>
            )}

            {/* Picked slots */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Array.from({ length: 5 }, (_, i) => {
                const id = picked[i];
                const um = id ? roster.find((r) => r.id === id) : null;
                if (um) {
                  return (
                    <div key={i} className="rounded-md p-2 text-center" style={{ background: "#13161F", border: "1px solid #E05252" }}>
                      <div className="aspect-square mb-1 grid place-items-center text-xl" style={{ background: "#0C0E14", borderRadius: 4 }}>👾</div>
                      <p className="text-[10px] font-bold truncate" style={{ color: "#F0EDE6" }}>{um.monster.name}</p>
                      <p className="text-[9px]" style={{ color: "#E05252" }}>{um.star_level}★</p>
                    </div>
                  );
                }
                return (
                  <div key={i} className="rounded-md p-2 text-center border-2 border-dashed" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    <div className="aspect-square grid place-items-center text-xl" style={{ color: "#6B6864" }}>?</div>
                    <p className="text-[9px] mt-1" style={{ color: "#6B6864" }}>Slot {i + 1}</p>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setConfirming(true)}
              disabled={picked.length !== 5 || !cooldownQ.data?.canStart || runMut.isPending}
              className="w-full py-3 rounded-lg font-bold text-sm uppercase tracking-widest disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#8B1A1A,#E05252)", color: "#F0EDE6", boxShadow: "0 0 24px rgba(224,82,82,0.4)" }}
            >
              ☠ Enter the Trial ({picked.length}/5)
            </button>

            {/* Roster */}
            <h2 className="text-sm font-bold mt-8 mb-3" style={{ color: "#A09D96", fontFamily: "'Cinzel',serif" }}>
              Choose your 5
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {roster.map((um) => {
                const isPicked = picked.includes(um.id);
                return (
                  <button
                    key={um.id}
                    onClick={() => {
                      if (isPicked) setPicked(picked.filter((p) => p !== um.id));
                      else if (picked.length < 5) setPicked([...picked, um.id]);
                    }}
                    className="rounded p-2 text-center transition-all"
                    style={{
                      background: isPicked ? "rgba(224,82,82,0.1)" : "#13161F",
                      border: `1px solid ${isPicked ? "#E05252" : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    <div className="aspect-square grid place-items-center text-xl mb-1" style={{ background: "rgba(0,0,0,0.3)", borderRadius: 4 }}>👾</div>
                    <p className="text-[10px] font-bold truncate" style={{ color: "#F0EDE6" }}>{um.monster.name}</p>
                    <p className="text-[9px]" style={{ color: "#A09D96" }}>{um.star_level}★ · {Math.round(um.bond_percent)}%</p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {tab === "memorial" && (
          <Memorial memorials={memorialQ.data?.memorials ?? []} />
        )}

        {/* Confirm modal */}
        {confirming && (
          <Modal onClose={() => setConfirming(false)}>
            <motion.h2
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: dur.measured, ease: ease.weighty }}
              className="text-xl font-bold mb-3 text-center"
              style={{ color: "#E05252", fontFamily: "'Cinzel',serif", letterSpacing: "0.04em" }}
            >
              The Trial is Final
            </motion.h2>
            <p className="text-sm text-center mb-5" style={{ color: "#A09D96" }}>
              Once you enter, any monster that falls is <b style={{ color: "#E05252" }}>gone forever</b>. They will be honored in the Memorial. Continue?
            </p>
            <div className="flex gap-2">
              <SpringyButton
                onClick={() => setConfirming(false)}
                className="flex-1 py-2.5 rounded-lg text-xs uppercase tracking-[0.18em] font-bold"
                style={{ background: "rgba(255,255,255,0.04)", color: "#A09D96", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                Stay Home
              </SpringyButton>
              <SpringyButton
                onClick={() => runMut.mutate()}
                disabled={runMut.isPending}
                className="flex-[2] py-2.5 rounded-lg text-xs uppercase tracking-[0.18em] font-bold disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#8B1A1A,#E05252)", color: "#F0EDE6", boxShadow: "0 4px 20px rgba(224,82,82,0.35)" }}
              >
                {runMut.isPending ? "Echoes…" : "We Walk Together"}
              </SpringyButton>
            </div>
          </Modal>
        )}

        {/* Results modal */}
        {results && (
          <Modal onClose={() => setResults(null)}>
            <motion.h2
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: dur.measured, ease: ease.weighty }}
              className="text-2xl font-bold mb-1 text-center"
              style={{
                color: results.fullClear ? "#FFD54F" : results.fallen.length === 0 ? "#5FAD41" : "#E05252",
                fontFamily: "'Cinzel',serif",
                letterSpacing: "0.04em",
              }}
            >
              {results.fullClear ? "👑 Full Clear" : results.fallen.length === 0 ? "✓ Returned Intact" : "Floor "}
              {!results.fullClear && results.fallen.length > 0 && (
                <NumberFlow value={results.floorsCleared} />
              )}
              {!results.fullClear && results.fallen.length > 0 && " reached"}
            </motion.h2>
            {results.echoTouched && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...trans.cascadeIn, delay: 0.2 }}
                className="text-center text-xs mb-4"
                style={{ color: "#FFD54F" }}
              >
                ✨ Echo-Touched bestowed.
              </motion.p>
            )}

            {results.fallen.length > 0 && (
              <div className="rounded-lg p-3 my-4 border" style={{ background: "rgba(224,82,82,0.05)", borderColor: "rgba(224,82,82,0.32)" }}>
                <p className="text-[10px] uppercase tracking-[0.18em] mb-2" style={{ color: "#A09D96" }}>Fallen</p>
                {results.fallen.map((f, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: dur.fast, ease: ease.out, delay: stagger(results.fallen.length, 0.12, 0.1)[i] }}
                    className="text-sm"
                    style={{ color: "#F0EDE6" }}
                  >
                    🪦 <b style={{ color: "#E05252" }}>{f.name}</b> — {f.star_level}★ · bond {Math.round(f.bond_percent)}%
                  </motion.p>
                ))}
              </div>
            )}

            {results.rewards.length > 0 && (
              <div className="rounded-lg p-3 mb-4" style={{ background: "rgba(255,213,79,0.06)", border: "1px solid rgba(255,213,79,0.22)" }}>
                <p className="text-[10px] uppercase tracking-[0.18em] mb-2" style={{ color: "#A09D96" }}>Rewards</p>
                {results.rewards.map((r, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: dur.fast, ease: ease.out, delay: 0.25 + i * 0.08 }}
                    className="text-sm"
                    style={{ color: "#FFD54F" }}
                  >
                    +<NumberFlow value={r.qty} /> {r.name}
                  </motion.p>
                ))}
              </div>
            )}

            <SpringyButton
              onClick={() => setResults(null)}
              className="w-full py-2.5 rounded-lg text-xs uppercase tracking-[0.18em] font-bold"
              style={{ background: "linear-gradient(135deg,#C89A3E,#FFD54F)", color: "#0C0E14", boxShadow: "0 4px 20px rgba(255,213,79,0.28)" }}
            >
              Continue
            </SpringyButton>
          </Modal>
        )}
      </div>
    </AppShell>
  );
}

function Memorial({ memorials }: { memorials: Array<{ id: string; fallen: Array<{ name: string; star_level: number; bond_percent: number }>; floors_cleared: number; full_clear: boolean; created_at: string }> }) {
  const allFallen = memorials.flatMap((m) => m.fallen.map((f) => ({ ...f, when: m.created_at, floor: m.floors_cleared })));
  if (allFallen.length === 0) {
    return <p className="text-center py-16 text-sm italic" style={{ color: "#6B6864" }}>No fallen yet. May it stay that way.</p>;
  }
  return (
    <div>
      <p className="text-xs mb-4" style={{ color: "#A09D96" }}>
        {allFallen.length} souls honored across {memorials.length} trial{memorials.length === 1 ? "" : "s"}.
      </p>
      <div className="space-y-2">
        {allFallen.map((f, i) => (
          <div key={i} className="rounded-lg p-3 border flex items-start gap-3" style={{ background: "#13161F", borderColor: "rgba(224,82,82,0.2)" }}>
            <div className="text-2xl">🪦</div>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: "#E05252", fontFamily: "'Cinzel',serif" }}>{f.name}</p>
              <p className="text-[10px]" style={{ color: "#A09D96" }}>
                Fell on floor {f.floor + 1} · {f.star_level}★ · bond {Math.round(f.bond_percent)}%
              </p>
              <p className="text-[10px] mt-1" style={{ color: "#6B6864" }}>{new Date(f.when).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const rm = reducedMotion();
  const prevFocus = useRef<Element | null>(null);
  useEffect(() => {
    prevFocus.current = document.activeElement;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      (prevFocus.current as HTMLElement | null)?.focus?.();
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={trans.modalIn}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(3px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={rm ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
          animate={rm ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={rm ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.99 }}
          transition={{ duration: dur.measured, ease: ease.weighty }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl p-6 border relative"
          style={{
            background: "linear-gradient(180deg, #1B1F2A 0%, #15181F 100%)",
            borderColor: "rgba(224,82,82,0.32)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.03) inset",
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

type SpringyButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
const SpringyButton = forwardRef<HTMLButtonElement, SpringyButtonProps>(function SpringyButton(props, ref) {
  const rm = reducedMotion();
  return (
    <motion.button
      ref={ref}
      whileTap={rm ? undefined : { scale: 0.97 }}
      whileHover={rm ? undefined : { y: -1 }}
      transition={trans.springy}
      {...(props as React.ComponentProps<typeof motion.button>)}
    />
  );
});
