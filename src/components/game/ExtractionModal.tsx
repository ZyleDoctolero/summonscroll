import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RARITY_COLOR, type Rarity } from "@/lib/game/gacha.constants";

interface ExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  monsterName: string;
  monsterRarity: "epic" | "legendary" | "mythic" | "ex";
  onExtractSuccess: () => void;
}

const ACCEPTED_COMMANDS = ["ARISE", "SUBMIT", "CLAIM", "BIND"];

/* eslint-disable no-restricted-syntax */
const RARITY_THEME: Record<string, { glow: string; border: string; accent: string }> = {
  ex: { glow: "rgba(255,0,60,0.6)", border: "rgba(255,0,60,0.8)", accent: "#ff003c" },
  mythic: { glow: "rgba(255,138,101,0.5)", border: "rgba(255,138,101,0.7)", accent: "#ff8a65" },
  legendary: { glow: "rgba(255,213,79,0.5)", border: "rgba(255,213,79,0.7)", accent: "#ffd54f" },
  epic: { glow: "rgba(206,147,216,0.4)", border: "rgba(206,147,216,0.6)", accent: "#ce93d8" },
};
/* eslint-enable no-restricted-syntax */

export function ExtractionModal({
  isOpen,
  onClose,
  monsterName,
  monsterRarity,
  onExtractSuccess,
}: ExtractionModalProps) {
  const [command, setCommand] = useState("");
  const [isError, setIsError] = useState(false);
  const theme = RARITY_THEME[monsterRarity] || RARITY_THEME.epic;

  useEffect(() => {
    if (!isOpen) {
      setCommand("");
      setIsError(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = command.trim().toUpperCase();
    if (ACCEPTED_COMMANDS.includes(cmd)) {
      onExtractSuccess();
    } else {
      setIsError(true);
      setTimeout(() => setIsError(false), 500);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(61,46,31,0.7)", backdropFilter: "blur(4px)" }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-md p-8 system-panel"
            style={{
              borderColor: theme.border,
              boxShadow: `0 0 40px ${theme.glow}, inset 0 0 20px ${theme.glow}`,
            }}
          >
            <div className="absolute inset-0 scanlines opacity-15 pointer-events-none rounded-lg" />

            <div className="relative z-10 text-center space-y-6">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Swords className="w-12 h-12 mx-auto" style={{ color: theme.accent }} />
              </motion.div>

              <div className="space-y-2">
                <h2
                  className="text-2xl font-black tracking-widest font-display"
                  style={{ color: theme.accent }}
                >
                  SOUL CAPTURED
                </h2>
                <p className="text-sm font-mono" style={{ color: "var(--ink-secondary)" }}>
                  <span style={{ color: theme.accent }}>[{monsterRarity.toUpperCase()}]</span>{" "}
                  {monsterName} awaits your command.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <motion.div
                    animate={isError ? { x: [-8, 8, -8, 8, 0] } : {}}
                    transition={{ duration: 0.35 }}
                  >
                    <Input
                      value={command}
                      onChange={(e) => {
                        setCommand(e.target.value);
                        setIsError(false);
                      }}
                      placeholder="Type your command..."
                      className={`text-center font-mono text-xl tracking-widest bg-white/50 text-[var(--ink-primary)] placeholder:text-[#8b7355]/40 border-[#c89a3e]/30 ${
                        isError
                          ? "border-red-500 text-red-400 focus-visible:ring-red-500"
                          : "focus-visible:ring-cyan-500"
                      }`}
                      style={{ borderColor: isError ? undefined : `${theme.accent}40` }}
                      autoFocus
                    />
                  </motion.div>
                  <p
                    className="mt-2 text-[11px] font-mono"
                    style={{ color: "var(--ink-tertiary)" }}
                  >
                    Try: {ACCEPTED_COMMANDS.join(" · ")}
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full font-mono font-bold tracking-widest text-black"
                  style={{
                    background: theme.accent,
                    boxShadow: `0 0 15px ${theme.glow}`,
                  }}
                >
                  ESTABLISH DOMINANCE
                </Button>
              </form>
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 transition-colors"
              style={{ color: "var(--ink-tertiary)" }}
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
