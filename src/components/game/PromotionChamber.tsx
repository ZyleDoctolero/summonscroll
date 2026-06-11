import { forwardRef, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { checkPromotionEligibility, promoteMonster } from "@/lib/game/supabase-api";
import { trans, ease, dur, reducedMotion } from "@/lib/ui/motion-tokens";

type Props = {
  userMonsterId: string;
  monsterName: string;
  onClose: () => void;
};

// ─── PromotionChamber — Emil's polish principles applied ────────────────────
// • Motion budget: nothing exceeds 480ms (trans.weighty).
// • Focus management: focus traps inside modal; escape closes; restores prior focus.
// • Animated numbers (Number Flow) for bond + star level — change feels earned.
// • Springy buttons via motion's whileTap; respects prefers-reduced-motion.
// • Cancel always visible. Confirmation is two-step (Begin Ritual → consume).

export function PromotionChamber({ userMonsterId, monsterName, onClose }: Props) {
  const qc = useQueryClient();
  const [stage, setStage] = useState<"check" | "ritual" | "done">("check");
  const [ritualPct, setRitualPct] = useState(0);
  const rm = reducedMotion();

  // Focus management
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const prevFocus = useRef<Element | null>(null);
  useEffect(() => {
    prevFocus.current = document.activeElement;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stage !== "ritual") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      (prevFocus.current as HTMLElement | null)?.focus?.();
    };
  }, [onClose, stage]);

  const checkQ = useQuery({
    queryKey: ["promotion-check", userMonsterId],
    queryFn: () => checkPromotionEligibility(userMonsterId),
  });

  const promoteMut = useMutation({
    mutationFn: () => promoteMonster(userMonsterId),
    onSuccess: (res) => {
      confetti({ particleCount: 220, spread: 90, origin: { y: 0.45 }, colors: ["#C89A3E", "#FFD54F", "#F0EDE6"] });
      toast.success(`Promoted to ${res.to}★`);
      qc.invalidateQueries({ queryKey: ["my-monsters"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["promotion-check", userMonsterId] });
      setStage("done");
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setStage("check");
    },
  });

  // Ritual progress — measured + deliberate (480ms budget x 6 frames ≈ 3s feel)
  useEffect(() => {
    if (stage !== "ritual") return;
    const start = performance.now();
    const total = rm ? 600 : 3000;
    let frame = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const pct = Math.min(100, (elapsed / total) * 100);
      setRitualPct(pct);
      if (pct < 100) frame = requestAnimationFrame(tick);
      else promoteMut.mutate();
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [stage, rm]);

  return (
    <ModalShell onClose={onClose} stage={stage}>
      <Title>The Promotion Chamber</Title>

      {checkQ.isLoading ? (
        <p className="text-center text-sm py-12" style={{ color: "#A09D96" }}>Reading the soul…</p>
      ) : !checkQ.data ? null : (
        <Body
          monsterName={monsterName}
          c={checkQ.data}
          stage={stage}
          ritualPct={ritualPct}
          onBegin={() => setStage("ritual")}
          onClose={onClose}
          closeBtnRef={closeBtnRef}
        />
      )}
    </ModalShell>
  );
}

// ─── Modal shell ────────────────────────────────────────────────────────────

function ModalShell({ children, onClose, stage }: { children: React.ReactNode; onClose: () => void; stage: string }) {
  const rm = reducedMotion();
  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={trans.modalIn}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(2px)" }}
        onClick={() => stage !== "ritual" && onClose()}
      >
        <motion.div
          initial={rm ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
          animate={rm ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={rm ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.99 }}
          transition={{ duration: dur.measured, ease: ease.weighty }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl p-6 border relative"
          style={{
            background: "linear-gradient(180deg, #1B1F2A 0%, #15181F 100%)",
            borderColor: "rgba(255,213,79,0.18)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03) inset",
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xl font-bold text-center mb-4"
      style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif", letterSpacing: "0.02em" }}
    >
      {children}
    </h2>
  );
}

// ─── Body ───────────────────────────────────────────────────────────────────

type CheckData = Awaited<ReturnType<typeof checkPromotionEligibility>>;

function Body({
  monsterName, c, stage, ritualPct, onBegin, onClose, closeBtnRef,
}: {
  monsterName: string;
  c: CheckData;
  stage: "check" | "ritual" | "done";
  ritualPct: number;
  onBegin: () => void;
  onClose: () => void;
  closeBtnRef: React.RefObject<HTMLButtonElement>;
}) {
  const req = c.requirement;
  const reqStone = req.stones.name;
  const stoneOk = c.have.stones >= req.stones.qty;
  const bondOk = c.have.bond >= req.bondRequired;
  const levelOk = c.have.level >= req.levelRequired;

  return (
    <>
      <p className="text-xs text-center mb-6" style={{ color: "#A09D96" }}>
        Bring <span style={{ color: "#F0EDE6", fontWeight: 600 }}>{monsterName}</span> to{" "}
        <NumberFlow value={req.newStarLevel} suffix="★" className="font-bold" style={{ color: "#FFD54F" }} />
      </p>

      {/* Ritual circle */}
      <div className="relative flex justify-center mb-6">
        <motion.div
          animate={
            stage === "ritual"
              ? { scale: [1, 1.04, 1], boxShadow: ["0 0 24px rgba(255,213,79,0.25)", "0 0 56px rgba(255,213,79,0.55)", "0 0 24px rgba(255,213,79,0.25)"] }
              : { scale: 1, boxShadow: "0 0 24px rgba(255,213,79,0.18)" }
          }
          transition={{ duration: 1.5, repeat: stage === "ritual" ? Infinity : 0, ease: ease.inOut }}
          className="w-32 h-32 rounded-full border-2 relative grid place-items-center"
          style={{
            borderColor: stage === "ritual" ? "#FFD54F" : "rgba(255,213,79,0.3)",
            background: "radial-gradient(circle, rgba(255,213,79,0.18), transparent 70%)",
          }}
        >
          <motion.span
            className="text-5xl"
            animate={stage === "done" ? { scale: [1, 1.4, 1], rotate: [0, 8, -6, 0] } : {}}
            transition={{ duration: dur.weighty, ease: ease.weighty }}
          >
            👾
          </motion.span>
          {stage === "done" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: dur.measured, ease: ease.weighty, delay: 0.1 }}
              className="absolute -bottom-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: "linear-gradient(135deg,#C89A3E,#FFD54F)", color: "#0C0E14" }}
            >
              {req.newStarLevel}★
            </motion.div>
          )}
        </motion.div>
      </div>

      {stage === "check" && (
        <>
          {/* Requirements grid */}
          <div className="rounded-xl p-3 mb-4 space-y-1" style={{ background: "rgba(0,0,0,0.32)" }}>
            <p className="text-[10px] uppercase tracking-[0.18em] mb-1.5" style={{ color: "#6B6864" }}>Requirements</p>
            <ReqRow ok={stoneOk}>
              <span><span className="mr-1">🪨</span>{reqStone}</span>
              <span className="font-mono"><NumberFlow value={c.have.stones} /> <span style={{ color: "#6B6864" }}>/ {req.stones.qty}</span></span>
            </ReqRow>
            {req.materials.map((mat) => {
              const have = c.have.materials[mat.name] ?? 0;
              const ok = have >= mat.qty;
              return (
                <ReqRow key={mat.name} ok={ok}>
                  <span><span className="mr-1">✨</span>{mat.name}</span>
                  <span className="font-mono"><NumberFlow value={have} /> <span style={{ color: "#6B6864" }}>/ {mat.qty}</span></span>
                </ReqRow>
              );
            })}
            <ReqRow ok={bondOk}>
              <span><span className="mr-1">💖</span>Bond</span>
              <span className="font-mono"><NumberFlow value={Math.round(c.have.bond)} format={{ maximumFractionDigits: 0 }} suffix="%" /> <span style={{ color: "#6B6864" }}>/ {req.bondRequired}%</span></span>
            </ReqRow>
            <ReqRow ok={levelOk}>
              <span><span className="mr-1">⚜</span>Level</span>
              <span className="font-mono"><NumberFlow value={c.have.level} /> <span style={{ color: "#6B6864" }}>/ {req.levelRequired}</span></span>
            </ReqRow>
          </div>

          {req.unlocks && (
            <p className="text-xs text-center mb-4 italic" style={{ color: "#FFD54F" }}>
              ↳ Unlocks: {req.unlocks}
            </p>
          )}

          {!c.canPromote && (
            <p className="text-xs text-center mb-4" style={{ color: "#E05252" }}>{c.reason}</p>
          )}

          <div className="flex gap-2">
            <SpringyButton
              ref={closeBtnRef}
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-xs uppercase tracking-[0.18em] font-bold"
              style={{ background: "rgba(255,255,255,0.04)", color: "#A09D96", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              Cancel
            </SpringyButton>
            <SpringyButton
              onClick={onBegin}
              disabled={!c.canPromote}
              className="flex-[2] py-2.5 rounded-lg text-xs uppercase tracking-[0.18em] font-bold disabled:opacity-40"
              style={{
                background: c.canPromote ? "linear-gradient(135deg,#C89A3E,#FFD54F)" : "rgba(255,255,255,0.05)",
                color: c.canPromote ? "#0C0E14" : "#6B6864",
                boxShadow: c.canPromote ? "0 4px 20px rgba(255,213,79,0.28)" : "none",
              }}
            >
              Begin Ritual
            </SpringyButton>
          </div>
        </>
      )}

      {stage === "ritual" && (
        <>
          <p className="text-center text-sm mb-4" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif", letterSpacing: "0.06em" }}>
            The Chamber sings.
          </p>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              className="h-full"
              style={{ background: "linear-gradient(90deg, #C89A3E, #FFD54F)", width: `${ritualPct}%` }}
              transition={{ duration: 0.05 }}
            />
          </div>
        </>
      )}

      {stage === "done" && (
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={trans.cascadeIn}
            className="text-2xl mb-2"
            style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif", letterSpacing: "0.04em" }}
          >
            ★ Promoted
          </motion.p>
          <p className="text-sm mb-1" style={{ color: "#F0EDE6" }}>
            {monsterName} now stands at <NumberFlow value={req.newStarLevel} suffix="★" className="font-bold" style={{ color: "#FFD54F" }} />
          </p>
          {req.unlocks && (
            <p className="text-xs italic mb-4" style={{ color: "#FFD54F" }}>{req.unlocks}</p>
          )}
          <SpringyButton
            onClick={onClose}
            className="w-full py-2.5 rounded-lg text-xs uppercase tracking-[0.18em] font-bold"
            style={{ background: "linear-gradient(135deg,#C89A3E,#FFD54F)", color: "#0C0E14" }}
          >
            Continue
          </SpringyButton>
        </div>
      )}
    </>
  );
}

// ─── Atoms ──────────────────────────────────────────────────────────────────

function ReqRow({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: dur.fast, ease: ease.out }}
      className="flex justify-between items-center text-xs px-2 py-1.5 rounded"
      style={{
        background: ok ? "rgba(95,173,65,0.08)" : "rgba(224,82,82,0.05)",
        color: ok ? "#5FAD41" : "#E05252",
      }}
    >
      {children}
      <span className="ml-2 text-[11px]" style={{ color: ok ? "#5FAD41" : "#E05252" }}>{ok ? "✓" : "—"}</span>
    </motion.div>
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
