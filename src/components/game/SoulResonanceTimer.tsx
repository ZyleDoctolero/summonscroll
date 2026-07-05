import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Play, Square, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SoulResonanceTimerProps {
  monsterId: string | null;
  monsterName?: string;
  durationMinutes?: number;
  onComplete: () => void;
  onFail: () => void;
}

export function SoulResonanceTimer({
  monsterId,
  monsterName = "Unknown Entity",
  durationMinutes = 25,
  onComplete,
  onFail,
}: SoulResonanceTimerProps) {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [isFailed, setIsFailed] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (isActive && document.hidden) {
        // The Master has broken focus
        setIsFailed(true);
        setIsActive(false);
        if (timerRef.current) clearInterval(timerRef.current);

        toast.error("RESONANCE SHATTERED: Your focus wavered. The soul connection has broken.");

        onFail();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, onFail]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);

      toast.success(
        `RESONANCE COMPLETE: You have perfectly synchronized with ${monsterName}. Buff activated.`,
      );

      onComplete();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, monsterName, onComplete]);

  const toggleTimer = () => {
    if (!monsterId) {
      toast.error("No Soul Selected: You must tether a soul before initiating Resonance.");
      return;
    }

    if (isFailed) {
      // Reset after a failure
      setTimeLeft(durationMinutes * 60);
      setIsFailed(false);
    }

    setIsActive(!isActive);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progress = 1 - timeLeft / (durationMinutes * 60);

  return (
    <div
      className={`p-4 relative overflow-hidden transition-colors border-2 bg-[var(--bg-panel)] ${
        isFailed
          ? "border-[var(--danger)]"
          : isActive
            ? "border-[var(--gold-bright)]"
            : "border-[rgba(200,154,62,0.25)]"
      }`}
      style={{ borderRadius: 0, boxShadow: "3px 3px 0 rgba(44,31,20,0.3)" }}
    >
      {/* Background Progress Bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#b8860b] to-[#c89a3e]"
        initial={{ width: "0%" }}
        animate={{ width: `${progress * 100}%` }}
        transition={{ duration: 1, ease: "linear" }}
      />

      <div className="flex flex-col items-center justify-center space-y-2">
        <h3
          className="text-[10px] tracking-widest uppercase"
          style={{ fontFamily: "var(--ss-font-pixel)", color: "var(--ink-secondary)" }}
        >
          Soul Resonance
        </h3>

        <div
          className={`text-3xl font-black font-mono tracking-wider ${
            isFailed
              ? "text-[var(--danger)]"
              : isActive
                ? "text-[var(--gold-glow)]"
                : "text-[var(--ink-secondary)]"
          }`}
        >
          {formatTime(timeLeft)}
        </div>

        <div className="text-[10px] font-mono text-[var(--ink-tertiary)] h-4">
          {monsterId ? `Tethered: [${monsterName}]` : "Awaiting Soul Tether..."}
        </div>

        <Button
          onClick={toggleTimer}
          variant={isActive ? "destructive" : "default"}
          className={`w-full font-mono tracking-widest ${
            !isActive && !isFailed
              ? "bg-[var(--gold-bright)] text-[var(--ink-primary)] hover:bg-[#b8860b] border border-[var(--gold-glow)]"
              : ""
          }`}
        >
          {isActive ? (
            <>
              <Square className="w-4 h-4 mr-2" /> SEVER CONNECTION
            </>
          ) : isFailed ? (
            <>
              <AlertTriangle className="w-4 h-4 mr-2" /> PURGE CORRUPTION (RESET)
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" /> INITIATE RESONANCE
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
