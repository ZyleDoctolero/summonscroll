import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { Icon } from "@/components/ui/Icon";
import { RARITY_COLOR, RARITY_GLOW, RARITY_ORDER, type Rarity } from "@/lib/game/gacha.constants";
import { dur, ease, reducedMotion } from "@/lib/ui/motion-tokens";
import { ExtractionModal } from "./ExtractionModal";

const CEREMONY_CONFIG: Record<
  Rarity,
  {
    duration: number;
    particles: boolean;
    fullscreen: boolean;
    color?: string;
    goldRain?: boolean;
    voidRift?: boolean;
  }
> = {
  common: { duration: dur.normal, particles: false, fullscreen: false },
  uncommon: { duration: dur.normal, particles: false, fullscreen: false },
  rare: { duration: dur.normal, particles: true, fullscreen: false, color: "--rarity-rare" },
  elite: { duration: dur.measured, particles: true, fullscreen: true, color: "--rarity-elite" },
  epic: { duration: dur.measured, particles: true, fullscreen: true, color: "--rarity-epic" },
  legendary: {
    duration: dur.weighty,
    particles: true,
    fullscreen: true,
    color: "--rarity-legendary",
    goldRain: true,
  },
  mythic: { duration: dur.weighty, particles: true, fullscreen: true, color: "--rarity-mythic" },
  ex: {
    duration: dur.weighty,
    particles: true,
    fullscreen: true,
    color: "--rarity-ex",
    voidRift: true,
  },
};

export type PullResultData = {
  monster: {
    id: string;
    name: string;
    rarity: Rarity;
    role: string;
    element: string;
    artUrl: string | null;
    realmSkill: string | null;
  };
  isNew: boolean;
  transcendenceStone: boolean;
};

export function SummonReveal({
  current,
  currentIndex,
  total,
  onNext,
}: {
  current: PullResultData;
  currentIndex: number;
  total: number;
  onNext: () => void;
}) {
  const r = current.monster.rarity;
  const config = CEREMONY_CONFIG[r];
  const rm = reducedMotion();
  const [showExtraction, setShowExtraction] = useState(false);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);

  const handleNextClick = () => {
    if (["epic", "legendary", "mythic", "ex"].includes(r)) {
      setShowExtraction(true);
    } else {
      onNext();
    }
  };

  useEffect(() => {
    if (!rm) {
      const isHighRarity = ["epic", "legendary", "mythic", "ex"].includes(r);
      if (isHighRarity) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
      setFlash(true);
      setTimeout(() => setFlash(false), 800);
    }
  }, [currentIndex, rm, r]);

  useEffect(() => {
    if (config.goldRain && !rm) {
      const d = config.duration;
      const end = Date.now() + d;
      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          // eslint-disable-next-line no-restricted-syntax
          colors: ["#C89A3E", "#F0EDE6"],
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          // eslint-disable-next-line no-restricted-syntax
          colors: ["#C89A3E", "#F0EDE6"],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    } else if (config.particles && !rm) {
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.6 },
        colors: [RARITY_COLOR[r]],
      });
    }
  }, [r, rm, config]);

  return (
    <motion.div 
      className="pull-stage cursor-pointer flex-col overflow-hidden" 
      onClick={handleNextClick}
      animate={shake ? { x: [-10, 10, -8, 8, -5, 5, -2, 2, 0], y: [-8, 8, -6, 6, -4, 4, -1, 1, 0] } : { x: 0, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {flash && (
        <motion.div 
          className="absolute inset-0 z-50 pointer-events-none mix-blend-screen"
          style={{ backgroundColor: RARITY_COLOR[r] || "white" }}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )}
      <div className="pull-rays" />
      <div
        key={`burst-${currentIndex}`}
        className="pull-burst"
        style={{ background: `radial-gradient(circle, ${RARITY_COLOR[r]}cc, transparent 65%)` }}
      />

      {config.voidRift && (
        <div className="absolute inset-0 z-0 bg-[#3d2e1e] mix-blend-multiply opacity-30 animate-pulse" />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={`card-${currentIndex}`}
          initial={
            rm ? { opacity: 0 } : { opacity: 0, scale: 0.3, rotateY: -60, rotateX: 20, y: 100 }
          }
          animate={rm ? { opacity: 1 } : { opacity: 1, scale: 1, rotateY: 0, rotateX: 0, y: 0 }}
          exit={rm ? { opacity: 0 } : { opacity: 0, scale: 1.15, filter: "blur(12px)", y: -20 }}
          transition={{ type: "spring", stiffness: 250, damping: 20, mass: 1.2 }}
          className={`ss-modal text-center max-w-xs relative z-10 aura-${r}`}
          style={{
            border: `3px solid ${RARITY_COLOR[r]}`,
            borderRadius: "16px",
            boxShadow: RARITY_GLOW[r],
          }}
        >
          {/* Monster Art */}
          <div className="w-40 h-40 mx-auto rounded-lg mb-4 flex items-center justify-center overflow-hidden ss-pane relative">
            <img
              src={
                current.monster.artUrl
                  ? current.monster.artUrl
                  : `/sprites/monsters/${current.monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
              }
              className="w-full h-full object-cover relative z-10"
              alt={current.monster.name}
              onError={(e) => {
                e.currentTarget.src = "/monsters/placeholder.png";
              }}
            />
            {config.fullscreen && (
              <motion.div
                className="absolute inset-0 z-0"
                style={{ background: RARITY_COLOR[r], opacity: 0.2 }}
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>

          {/* Name */}
          <h2
            className="text-2xl font-bold mb-1 font-display truncate"
            title={current.monster.name}
            style={{ color: RARITY_COLOR[r] }}
          >
            {current.monster.name}
          </h2>

          {/* Rarity Chip */}
          <span
            className="ss-chip"
            style={{
              background: `${RARITY_COLOR[r]}20`,
              color: RARITY_COLOR[r],
              border: `1px solid ${RARITY_COLOR[r]}60`,
            }}
          >
            {r}
          </span>

          {/* Element & Role */}
          <p className="text-xs mt-2" style={{ color: "var(--ink-secondary)" }}>
            {current.monster.element} · {current.monster.role}
          </p>

          {/* Realm Skill */}
          {current.monster.realmSkill && (
            <p className="text-[11px] mt-1 font-mono" style={{ color: "var(--ink-tertiary)" }}>
              Skill: {current.monster.realmSkill}
            </p>
          )}

          {/* Badges */}
          <div className="flex flex-col items-center gap-1 mt-3">
            {current.isNew && (
              <p
                className="text-sm font-medium flex items-center gap-1 justify-center"
                style={{ color: "var(--success)" }}
              >
                <Icon name="sparkle" size={14} color="var(--success)" /> New!
              </p>
            )}
            {current.transcendenceStone && (
              <p
                className="text-sm flex items-center gap-1 justify-center"
                style={{ color: "var(--cyan)" }}
              >
                <Icon name="summon" size={14} /> Transcendence Stone
              </p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Multi-pull progress dots */}
      {total > 1 && (
        <div className="flex gap-1.5 mt-6 relative z-10">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                background:
                  i < currentIndex
                    ? RARITY_COLOR[r]
                    : i === currentIndex
                      ? "var(--ink-primary)"
                      : "rgba(255,255,255,0.1)",
                boxShadow: i === currentIndex ? `0 0 6px ${RARITY_COLOR[r]}` : "none",
                transform: i === currentIndex ? "scale(1.3)" : "scale(1)",
              }}
            />
          ))}
        </div>
      )}

      <p className="mt-4 text-xs animate-pulse" style={{ color: "var(--ink-tertiary)" }}>
        Tap to continue
      </p>

      <ExtractionModal
        isOpen={showExtraction}
        onClose={() => setShowExtraction(false)}
        monsterName={current.monster.name}
        monsterRarity={r as "epic" | "legendary" | "mythic" | "ex"}
        onExtractSuccess={() => {
          setShowExtraction(false);
          onNext();
        }}
      />
    </motion.div>
  );
}

export function SummonResults({
  results,
  onFinish,
}: {
  results: PullResultData[];
  onFinish: () => void;
}) {
  const sorted = [...results].sort(
    (a, b) => RARITY_ORDER[b.monster.rarity] - RARITY_ORDER[a.monster.rarity],
  );

  const newCount = results.filter((r) => r.isNew).length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col ss-modal-backdrop">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center">
        <h2
          className="text-3xl font-display text-center mb-2"
          // eslint-disable-next-line no-restricted-syntax
          style={{ color: "#fcd34d", textShadow: "0 2px 10px rgba(212,175,63,0.5)" }}
        >
          Summon Results
        </h2>
        {newCount > 0 && (
          <p className="text-center text-sm mb-6" style={{ color: "var(--success)" }}>
            {newCount} new monster{newCount > 1 ? "s" : ""} discovered!
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-3xl mx-auto">
          {sorted.map((res, i) => {
            const r = res.monster.rarity;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: dur.normal, ease: ease.out }}
                className={`ss-card text-center aura-${r}`}
                style={{
                  border: `2px solid ${RARITY_COLOR[r]}60`,
                  borderRadius: "12px",
                  boxShadow:
                    r !== "common" && r !== "uncommon"
                      ? `0 0 12px ${RARITY_COLOR[r]}20`
                      : undefined,
                }}
              >
                <div className="w-16 h-16 mx-auto rounded mb-3 flex items-center justify-center overflow-hidden ss-pane">
                  <img
                    src={
                      res.monster.artUrl
                        ? res.monster.artUrl
                        : `/sprites/monsters/${res.monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
                    }
                    className="w-full h-full object-cover"
                    alt={res.monster.name}
                    onError={(e) => {
                      e.currentTarget.src = "/monsters/placeholder.png";
                    }}
                  />
                </div>
                <p
                  className="text-xs font-bold truncate"
                  title={res.monster.name}
                  style={{ color: "var(--ink-primary)" }}
                >
                  {res.monster.name}
                </p>
                <span
                  className="ss-chip mt-1.5"
                  style={{
                    background: `${RARITY_COLOR[r]}20`,
                    color: RARITY_COLOR[r],
                    fontSize: "9px",
                  }}
                >
                  {r}
                </span>
                {res.isNew && (
                  <p className="text-[11px] mt-1" style={{ color: "var(--success)" }}>
                    New!
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
      <div className="p-6 max-w-md mx-auto w-full">
        <button onClick={onFinish} className="ss-btn ss-btn-d-primary w-full shadow-lg">
          Accept Summons
        </button>
      </div>
    </div>
  );
}
