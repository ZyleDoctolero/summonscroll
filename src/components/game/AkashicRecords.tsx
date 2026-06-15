import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock, Unlock, Zap } from "lucide-react";

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

  const canSynthesize =
    requiredFodder.every((f) => f.isAvailable) && !isLocked && targetStar < maxStarLevel;

  const handleSynthesize = async () => {
    if (!canSynthesize) return;

    setIsSynthesizing(true);
    try {
      const fodderIds = requiredFodder.map((f) => f.id);
      await onSynthesize(fodderIds);
      toast.success(`SYNTHESIS SUCCESSFUL: ${targetName} has ascended to ${targetStar + 1}★!`);
    } catch (error: any) {
      toast.error(`SYNTHESIS FAILED: ${error.message || "The Void rejected your offering."}`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Calculate coordinates for nodes in a circle around the target
  const radius = 120;
  const centerX = 200;
  const centerY = 200;

  return (
    <div className="relative w-full max-w-md mx-auto aspect-square bg-[#0a0f1e]/50 rounded-full border border-cyan-500/20 shadow-[inset_0_0_50px_rgba(0,240,255,0.05)] overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 scanlines opacity-20 pointer-events-none" />

      <svg width="400" height="400" className="absolute inset-0 w-full h-full">
        {/* Draw edges */}
        {requiredFodder.map((fodder, index) => {
          const angle = (index / requiredFodder.length) * 2 * Math.PI - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);

          return (
            <motion.line
              key={`edge-${index}`}
              x1={x}
              y1={y}
              x2={centerX}
              y2={centerY}
              stroke={fodder.isAvailable ? "#00f0ff" : "#1e293b"}
              strokeWidth={fodder.isAvailable ? 3 : 1}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 1.5,
                delay: index * 0.2,
                repeat: fodder.isAvailable ? Infinity : 0,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
              style={{
                filter: fodder.isAvailable ? "drop-shadow(0 0 8px #00f0ff)" : "none",
              }}
            />
          );
        })}
      </svg>

      {/* Target Node (Center) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <motion.div
          animate={
            canSynthesize
              ? {
                  scale: [1, 1.1, 1],
                  boxShadow: ["0 0 20px #00f0ff", "0 0 40px #00f0ff", "0 0 20px #00f0ff"],
                }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity }}
          className={`w-24 h-24 rounded-full border-2 flex items-center justify-center bg-black/80 z-10 ${
            canSynthesize ? "border-cyan-400" : "border-slate-700"
          }`}
        >
          <div className="text-center">
            <div className="text-xs font-mono text-cyan-400">{targetStar}★</div>
            <div className="text-sm font-bold text-white truncate max-w-[80px]">{targetName}</div>
          </div>
        </motion.div>
      </div>

      {/* Fodder Nodes (Orbiting) */}
      {requiredFodder.map((fodder, index) => {
        const angle = (index / requiredFodder.length) * 2 * Math.PI - Math.PI / 2;
        const x = 50 + 50 * Math.cos(angle); // Percentage
        const y = 50 + 50 * Math.sin(angle);

        return (
          <div
            key={`node-${index}`}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ top: `${y}%`, left: `${x}%`, padding: "10%" }}
          >
            <div
              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center bg-black/90 z-10 transition-colors ${
                fodder.isAvailable
                  ? "border-cyan-500 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                  : "border-slate-800"
              }`}
            >
              <span className="text-[10px] font-mono text-slate-400">
                {fodder.isAvailable ? "READY" : "EMPTY"}
              </span>
            </div>
          </div>
        );
      })}

      {/* Synthesis Controls */}
      <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center justify-center space-y-2">
        {isLocked && (
          <div className="flex items-center text-xs text-red-400 font-mono">
            <Lock className="w-3 h-3 mr-1" /> ENTITY LOCKED
          </div>
        )}
        <Button
          onClick={handleSynthesize}
          disabled={!canSynthesize || isSynthesizing}
          className={`font-mono tracking-widest uppercase transition-all duration-300 ${
            canSynthesize
              ? "bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(0,240,255,0.5)]"
              : "bg-slate-900 border border-slate-800 text-slate-600"
          }`}
        >
          {isSynthesizing ? (
            <span className="animate-pulse">SYNTHESIZING...</span>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" /> INITIATE SYNTHESIS
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
