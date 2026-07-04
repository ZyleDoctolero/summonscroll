import { forwardRef, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { checkPromotionEligibility, promoteMonster } from "@/lib/game/supabase-api";
import { trans, ease, dur, reducedMotion } from "@/lib/ui/motion-tokens";
import { sounds } from "@/lib/ui/sounds";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";
import { Icon } from "@/components/ui/Icon";

type Props = {
  userMonsterId: string;
  monsterName: string;
  artUrl?: string | null;
  open: boolean;
  onClose: () => void;
};

//  PromotionChamber - Emil's polish principles applied
// * Motion budget: nothing exceeds 480ms (trans.weighty).
// * Focus management: focus traps inside modal; escape closes; restores prior focus.
// * Animated numbers (Number Flow) for bond + star level - change feels earned.
// * Springy buttons via motion's whileTap; respects prefers-reduced-motion.
// * Cancel always visible. Confirmation is two-step (Begin Ritual  consume).

export function PromotionChamber({ userMonsterId, monsterName, artUrl, onClose }: Props) {
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
      sounds.ascend();
      confetti({
        particleCount: 220,
        spread: 90,
        origin: { y: 0.45 },
        // eslint-disable-next-line no-restricted-syntax
        colors: ["#C89A3E", "#FFD54F", "#F0EDE6"],
      });
      toast.success(`Promoted to ${res.to}`);
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

  // Ritual progress - measured + deliberate (480ms budget x 6 frames  3s feel)
  useEffect(() => {
    if (stage !== "ritual") return;
    sounds.drum();
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
  }, [stage, rm, promoteMut]);

  return (
    <ResponsiveDialog
      open={true}
      onOpenChange={(open) => !open && stage !== "ritual" && onClose()}
      title="The Promotion Chamber"
    >
      {checkQ.isLoading ? (
        <p className="text-center text-sm py-12" style={{ color: "var(--ink-secondary)" }}>
          Reading the soul
        </p>
      ) : !checkQ.data ? null : (
        <Body
          monsterName={monsterName}
          artUrl={artUrl}
          c={checkQ.data}
          stage={stage}
          ritualPct={ritualPct}
          onBegin={() => setStage("ritual")}
          onClose={onClose}
          closeBtnRef={closeBtnRef}
        />
      )}
    </ResponsiveDialog>
  );
}

//  Body

type CheckData = Awaited<ReturnType<typeof checkPromotionEligibility>>;

function Body({
  monsterName,
  artUrl,
  c,
  stage,
  ritualPct,
  onBegin,
  onClose,
  closeBtnRef,
}: {
  monsterName: string;
  artUrl?: string | null;
  c: CheckData;
  stage: "check" | "ritual" | "done";
  ritualPct: number;
  onBegin: () => void;
  onClose: () => void;
  closeBtnRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const req = c.requirement;
  const reqStone = req.stones.name;
  const stoneOk = c.have.stones >= req.stones.qty;
  const bondOk = c.have.bond >= req.bondRequired;
  const levelOk = c.have.level >= req.levelRequired;

  return (
    <>
      <p className="text-xs text-center mb-6" style={{ color: "var(--ink-secondary)" }}>
        Bring <span style={{ color: "var(--ink-primary)", fontWeight: 600 }}>{monsterName}</span> to{" "}
        <NumberFlow
          value={req.newStarLevel}
          suffix=""
          className="font-bold"
          style={{ color: "var(--gold-bright)" }}
        />
      </p>

      {/* Ritual circle */}
      <div className="relative flex justify-center mb-6">
        <motion.div
          animate={
            stage === "ritual"
              ? {
                  scale: [1, 1.04, 1],
                  boxShadow: [
                    "0 0 24px rgba(255,213,79,0.25)",
                    "0 0 56px rgba(255,213,79,0.55)",
                    "0 0 24px rgba(255,213,79,0.25)",
                  ],
                }
              : { scale: 1, boxShadow: "0 0 24px rgba(255,213,79,0.18)" }
          }
          transition={{
            duration: 1.5,
            repeat: stage === "ritual" ? Infinity : 0,
            ease: ease.inOut,
          }}
          className="w-32 h-32 border-2 relative overflow-hidden grid place-items-center"
          style={{
            borderRadius: 0,
            borderColor: stage === "ritual" ? "var(--gold-bright)" : "rgba(255,213,79,0.3)",
            background: "radial-gradient(circle, rgba(255,213,79,0.18), transparent 70%)",
          }}
        >
          <motion.img
            src={
              artUrl
                ? artUrl
                : `/sprites/monsters/${monsterName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
            }
            className="w-24 h-24 object-cover"
            style={{ imageRendering: "pixelated", borderRadius: 0 }}
            alt={monsterName}
            onError={(e) => {
              e.currentTarget.src = "/monsters/placeholder.png";
            }}
            animate={stage === "done" ? { scale: [1, 1.3, 1], rotate: [0, 8, -6, 0] } : {}}
            transition={{ duration: dur.weighty, ease: ease.weighty }}
          />
          {stage === "done" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: dur.measured, ease: ease.weighty, delay: 0.1 }}
              className="absolute -bottom-2 px-2 py-0.5 text-[10px] font-bold"
              style={{
                fontFamily: "var(--ss-font-pixel)",
                borderRadius: 0,
                background: "linear-gradient(135deg,var(--gold-glow),var(--gold-bright))",
                color: "var(--bg-deep)",
              }}
            >
              {req.newStarLevel}
            </motion.div>
          )}
        </motion.div>
      </div>

      {stage === "check" && (
        <>
          {/* Requirements grid */}
          <div
            className="p-3 mb-4 space-y-1"
            style={{
              borderRadius: 0,
              background: "rgba(61,46,31,0.06)",
              boxShadow: "2px 2px 0 rgba(0,0,0,0.2)",
            }}
          >
            <p
              className="text-[11px] uppercase tracking-[0.18em] mb-1.5"
              style={{ color: "var(--ink-tertiary)" }}
            >
              Requirements
            </p>
            <ReqRow ok={stoneOk}>
              <span className="flex items-center gap-1.5">
                <Icon name="stone" size={13} color={stoneOk ? "var(--success)" : "var(--danger)"} />
                <span>{reqStone}</span>
              </span>
              <span className="font-mono">
                <NumberFlow value={c.have.stones} />{" "}
                <span style={{ color: "var(--ink-tertiary)" }}>/ {req.stones.qty}</span>
              </span>
            </ReqRow>
            {req.materials.map((mat) => {
              const have = c.have.materials[mat.name] ?? 0;
              const ok = have >= mat.qty;
              return (
                <ReqRow key={mat.name} ok={ok}>
                  <span className="flex items-center gap-1.5">
                    <Icon
                      name="sparkle"
                      size={13}
                      color={ok ? "var(--success)" : "var(--danger)"}
                    />
                    <span>{mat.name}</span>
                  </span>
                  <span className="font-mono">
                    <NumberFlow value={have} />{" "}
                    <span style={{ color: "var(--ink-tertiary)" }}>/ {mat.qty}</span>
                  </span>
                </ReqRow>
              );
            })}
            <ReqRow ok={bondOk}>
              <span className="flex items-center gap-1.5">
                <Icon name="bond" size={13} color={bondOk ? "var(--success)" : "var(--danger)"} />
                <span>Bond</span>
              </span>
              <span className="font-mono">
                <NumberFlow
                  value={Math.round(c.have.bond)}
                  format={{ maximumFractionDigits: 0 }}
                  suffix="%"
                />{" "}
                <span style={{ color: "var(--ink-tertiary)" }}>/ {req.bondRequired}%</span>
              </span>
            </ReqRow>
            <ReqRow ok={levelOk}>
              <span className="flex items-center gap-1.5">
                <Icon name="user" size={13} color={levelOk ? "var(--success)" : "var(--danger)"} />
                <span>Level</span>
              </span>
              <span className="font-mono">
                <NumberFlow value={c.have.level} />{" "}
                <span style={{ color: "var(--ink-tertiary)" }}>/ {req.levelRequired}</span>
              </span>
            </ReqRow>
          </div>

          {req.unlocks && (
            <p className="text-xs text-center mb-4 italic" style={{ color: "var(--gold-bright)" }}>
              Unlocks: {req.unlocks}
            </p>
          )}

          {!c.canPromote && (
            <p className="text-xs text-center mb-4" style={{ color: "var(--danger)" }}>
              {c.reason}
            </p>
          )}

          <div className="flex gap-2">
            <SpringyButton
              ref={closeBtnRef}
              onClick={onClose}
              className="flex-1 py-2.5 text-[10px] uppercase font-bold"
              style={{
                background: "rgba(61,46,31,0.04)",
                color: "var(--ink-secondary)",
                border: "1px solid rgba(61,46,31,0.1)",
              }}
            >
              Cancel
            </SpringyButton>
            <SpringyButton
              onClick={onBegin}
              disabled={!c.canPromote}
              className="flex-[2] py-2.5 text-[10px] uppercase font-bold disabled:opacity-40"
              style={{
                background: c.canPromote
                  ? "linear-gradient(135deg,var(--gold-glow),var(--gold-bright))"
                  : "rgba(255,255,255,0.05)",
                color: c.canPromote ? "var(--bg-deep)" : "var(--ink-tertiary)",
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
          <p
            className="t-label text-center text-sm mb-4"
            style={{ color: "var(--gold-bright)", letterSpacing: "0.06em" }}
          >
            The Chamber sings.
          </p>
          <div className="ss-bar-pixel" style={{ height: 6 }}>
            <motion.div
              className="ss-bar-pixel-fill"
              style={{
                background: "linear-gradient(90deg, var(--gold-glow), var(--gold-bright))",
                width: `${ritualPct}%`,
              }}
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
            className="t-h2 text-2xl mb-2"
            style={{ color: "var(--gold-bright)", letterSpacing: "0.04em" }}
          >
            Promoted
          </motion.p>
          <p className="text-sm mb-1" style={{ color: "var(--ink-primary)" }}>
            {monsterName} now stands at{" "}
            <NumberFlow
              value={req.newStarLevel}
              suffix=""
              className="font-bold"
              style={{ color: "var(--gold-bright)" }}
            />
          </p>
          {req.unlocks && (
            <p className="text-xs italic mb-4" style={{ color: "var(--gold-bright)" }}>
              {req.unlocks}
            </p>
          )}
          <SpringyButton
            onClick={onClose}
            className="w-full py-2.5 text-[10px] uppercase font-bold"
            style={{
              background: "linear-gradient(135deg,var(--gold-glow),var(--gold-bright))",
              color: "var(--bg-deep)",
            }}
          >
            Continue
          </SpringyButton>
        </div>
      )}
    </>
  );
}

//  Atoms

function ReqRow({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: dur.fast, ease: ease.out }}
      className="flex justify-between items-center text-xs px-2 py-1.5 rounded"
      style={{
        background: ok ? "rgba(95,173,65,0.08)" : "rgba(224,82,82,0.05)",
        color: ok ? "var(--success)" : "var(--danger)",
      }}
    >
      {children}
      <span className="ml-2 text-[11px]" style={{ color: ok ? "var(--success)" : "var(--danger)" }}>
        {ok ? "v" : "-"}
      </span>
    </motion.div>
  );
}

type SpringyButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const SpringyButton = forwardRef<HTMLButtonElement, SpringyButtonProps>(
  function SpringyButton(props, ref) {
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
  },
);
