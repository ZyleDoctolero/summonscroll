import React from "react";
import { motion } from "motion/react";
import { Sparkles, Star, Shield, Zap, Skull } from "lucide-react";
import { RARITY_COLOR, type Rarity } from "@/lib/game/gacha.constants";

interface AscensionTreeProps {
  currentStar: number;
  currentClass: string;
  title: string | null;
  secondaryElement: string | null;
  corruptionLevel: number;
  rarity: Rarity;
}

export function AscensionTree({
  currentStar,
  currentClass,
  title,
  secondaryElement,
  corruptionLevel,
  rarity,
}: AscensionTreeProps) {
  const color = RARITY_COLOR[rarity] || "var(--cyan)";

  // Milestones
  const milestones = [
    { star: 3, label: "Class Branching", active: currentStar >= 3, icon: Shield },
    {
      star: 5,
      label: "Title Awakening",
      active: currentStar >= 5,
      icon: Star,
      value: title || "Locked",
    },
    {
      star: 7,
      label: "Element Convergence",
      active: currentStar >= 7,
      icon: Zap,
      value: secondaryElement || "Locked",
    },
    {
      star: 10,
      label: "Abyssal Limit Break",
      active: currentStar >= 10,
      icon: Skull,
      value: `Corruption: ${corruptionLevel}%`,
    },
  ];

  return (
    <div className="relative w-full max-w-lg mx-auto py-12 flex flex-col items-center">
      <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gradient-to-b from-transparent via-slate-800 to-transparent -translate-x-1/2 z-0" />

      {/* Origin Node */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 ss-card p-4 rounded-full border-2 text-center mb-12 shadow-[0_4px_16px_rgba(120,90,50,0.1)]"
        style={{ borderColor: color, backgroundColor: "var(--bg-card)" }}
      >
        <p className="text-[11px] font-mono tracking-widest text-[var(--ink-tertiary)]">ORIGIN</p>
        <p className="font-bold tracking-widest" style={{ color }}>
          {currentClass.toUpperCase()}
        </p>
      </motion.div>

      {/* Nodes */}
      {milestones.map((m, i) => (
        <motion.div
          key={m.star}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.15 + 0.2 }}
          className="relative z-10 w-full flex items-center justify-center mb-12"
        >
          {/* Connector Line glow if active */}
          {m.active && (
            <div
              className="absolute top-[-3rem] bottom-[100%] left-1/2 w-0.5 bg-[#c89a3e] -translate-x-1/2 -z-10 shadow-[0_0_10px_rgba(200,154,62,0.5)]"
              style={{ height: "3rem" }}
            />
          )}

          <div
            className={`ss-card w-64 p-4 border-l-4 transition-all ${m.active ? "" : "opacity-40 grayscale"}`}
            style={{ borderLeftColor: m.active ? "#c89a3e" : "var(--ink-tertiary)" }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${m.active ? "bg-[#c89a3e]/15 text-[#c89a3e]" : "bg-[rgba(180,150,100,0.1)] text-[#b5a28a]"}`}
              >
                <m.icon size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--ink-primary)]">{m.label}</p>
                <p className="text-[11px] font-mono text-[#c89a3e]">REQUIRES {m.star}★</p>
              </div>
            </div>
            {m.value && (
              <div className="mt-2 p-2 bg-[rgba(240,230,210,0.4)] rounded text-center">
                <span
                  className="text-xs font-bold tracking-widest"
                  style={{ color: m.active ? "var(--gold-bright)" : "var(--ink-tertiary)" }}
                >
                  {m.active ? m.value : "???"}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      ))}

      {/* Future feature: Path Selection */}
      {currentStar >= 3 && currentStar < 10 && (
        <p className="text-[11px] text-center mt-4 text-[#8b7355]/60 font-mono">
          Ascension Path verified. <br /> Continue Synthesis to breach mortal limits.
        </p>
      )}
    </div>
  );
}
