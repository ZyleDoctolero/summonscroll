import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock, Zap, Sparkles } from "lucide-react";
import { dur, ease } from "@/lib/ui/motion-tokens";

interface FodderNode {
  id: string;
  name: string;
  isAvailable: boolean;
  element: string;
}

interface AkashicRecordsProps {
  targetId: string;
  targetName: string;
  targetStar: number;
  maxStarLevel: number;
  requiredFodder: FodderNode[];
  onSynthesize: (fodderIds: string[]) => Promise<void>;
  isLocked: boolean;
}

export function AkashicRecords({
  targetId,
  targetName,
  targetStar,
  maxStarLevel,
  requiredFodder,
  onSynthesize,
  isLocked,
}: AkashicRecordsProps) {
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisComplete, setSynthesisComplete] = useState(false);

  const allFodderReady = requiredFodder.length > 0 && requiredFodder.every((f) => f.isAvailable);
  const atMaxStar = targetStar >= maxStarLevel;
  const canSynthesize = allFodderReady && !isLocked && !atMaxStar;

  const handleSynthesize = async () => {
    if (!canSynthesize) return;

    setIsSynthesizing(true);
    try {
      const fodderIds = requiredFodder.map((f) => f.id);
      await onSynthesize(fodderIds);
      setSynthesisComplete(true);
      toast.success(`SYNTHESIS SUCCESSFUL: ${targetName} has ascended to ${targetStar + 1}★!`);
      setTimeout(() => setSynthesisComplete(false), 2000);
    } catch (error) {
      toast.error(
        `SYNTHESIS FAILED: ${(error as Error).message || "The Void rejected your offering."}`,
      );
    } finally {
      setIsSynthesizing(false);
    }
  };

  const radius = 120;
  const centerX = 200;
  const centerY = 200;
  const fodderCount = requiredFodder.length || 1;

  const getStatusMessage = () => {
    if (isLocked) return "Unlock this monster before synthesizing";
    if (atMaxStar) return `Already at max star level (${maxStarLevel}★)`;
    if (!allFodderReady) {
      const missing = requiredFodder.filter((f) => !f.isAvailable).length;
      return `Need ${missing} more fodder monster${missing > 1 ? "s" : ""} at ${targetStar}★`;
    }
    return "All conditions met — ready to synthesize";
  };

  return (
    <div
      className="relative w-full max-w-md mx-auto aspect-square rounded-full border border-cyan-500/20 overflow-hidden"
      style={{
        background: "radial-gradient(circle, rgba(0,240,255,0.03) 0%, rgba(10,15,30,0.5) 70%)",
        boxShadow: canSynthesize
          ? "inset 0 0 80px rgba(0,240,255,0.08), 0 0 40px rgba(0,240,255,0.05)"
          : "inset 0 0 50px rgba(0,240,255,0.03)",
      }}
    >
      <div className="absolute inset-0 scanlines opacity-10 pointer-events-none" />

      <svg width="400" height="400" className="absolute inset-0 w-full h-full">
        {requiredFodder.map((fodder, index) => {
          const angle = (index / fodderCount) * 2 * Math.PI - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);

          return (
            <motion.line
              key={`edge-${index}`}
              x1={x}
              y1={y}
              x2={centerX}
              y2={centerY}
              // eslint-disable-next-line no-restricted-syntax
              stroke={fodder.isAvailable ? "#00f0ff" : "#1e293b"}
              strokeWidth={fodder.isAvailable ? 2 : 1}
              strokeDasharray={fodder.isAvailable ? "none" : "4 4"}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                duration: 1,
                delay: index * 0.15,
                ease: "easeOut",
              }}
              style={{
                filter: fodder.isAvailable ? "drop-shadow(0 0 6px #00f0ff)" : "none",
              }}
            />
          );
        })}
      </svg>

      {/* Target Node (Center) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <motion.div
          animate={
            isSynthesizing
              ? {
                  scale: [1, 1.3, 1],
                  boxShadow: ["0 0 20px #00f0ff", "0 0 80px #fff", "0 0 20px #00f0ff"],
                }
              : canSynthesize
                ? {
                    scale: [1, 1.08, 1],
                    boxShadow: ["0 0 20px #00f0ff", "0 0 40px #00f0ff", "0 0 20px #00f0ff"],
                  }
                : {}
          }
          transition={{ duration: isSynthesizing ? 0.8 : 2, repeat: isSynthesizing ? 2 : Infinity }}
          className={`w-24 h-24 rounded-full border-2 flex items-center justify-center bg-black/80 z-10 ${
            canSynthesize ? "border-cyan-400" : isLocked ? "border-red-500/50" : "border-slate-700"
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={synthesisComplete ? "complete" : "default"}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="text-center"
            >
              {synthesisComplete ? (
                <Sparkles className="w-8 h-8 text-yellow-400 mx-auto" />
              ) : (
                <>
                  <div className="text-xs font-mono text-cyan-400">{targetStar}★</div>
                  <div className="text-sm font-bold text-white truncate max-w-[80px]">
                    {targetName}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Fodder Nodes (Orbiting) */}
      {requiredFodder.map((fodder, index) => {
        const angle = (index / fodderCount) * 2 * Math.PI - Math.PI / 2;
        const x = 50 + 38 * Math.cos(angle);
        const y = 50 + 38 * Math.sin(angle);

        return (
          <motion.div
            key={`node-${index}`}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ top: `${y}%`, left: `${x}%` }}
            initial={{ scale: 0, opacity: 0 }}
            animate={
              isSynthesizing && fodder.isAvailable
                ? { scale: [1, 0], opacity: [1, 0], x: "0%", y: "0%" }
                : { scale: 1, opacity: 1 }
            }
            transition={
              isSynthesizing
                ? { duration: 0.6, delay: index * 0.15 }
                : { duration: 0.4, delay: 0.3 + index * 0.1 }
            }
          >
            <div
              className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center bg-black/90 z-10 transition-colors ${
                fodder.isAvailable
                  ? "border-cyan-500 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                  : "border-slate-800 border-dashed"
              }`}
            >
              <span
                className={`text-[9px] font-mono font-bold ${fodder.isAvailable ? "text-cyan-400" : "text-slate-600"}`}
              >
                {fodder.isAvailable ? "READY" : "EMPTY"}
              </span>
              {fodder.isAvailable && (
                <span className="text-[8px] text-cyan-300/60 truncate max-w-[40px]">
                  {fodder.name}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Controls */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center justify-center space-y-2 px-4">
        {/* Status message */}
        <p
          className={`text-[10px] font-mono tracking-wider text-center ${
            canSynthesize ? "text-cyan-400" : isLocked ? "text-red-400" : "text-slate-500"
          }`}
        >
          {isLocked && <Lock className="w-3 h-3 inline mr-1 -mt-0.5" />}
          {getStatusMessage()}
        </p>

        <Button
          onClick={handleSynthesize}
          disabled={!canSynthesize || isSynthesizing}
          className={`font-mono tracking-widest uppercase transition-all duration-300 ${
            canSynthesize
              ? "bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(0,240,255,0.5)]"
              : "bg-slate-900/80 border border-slate-800 text-slate-600 cursor-not-allowed opacity-60"
          }`}
        >
          {isSynthesizing ? (
            <span className="animate-pulse">SYNTHESIZING...</span>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              {atMaxStar ? "MAX LEVEL" : "INITIATE SYNTHESIS"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
