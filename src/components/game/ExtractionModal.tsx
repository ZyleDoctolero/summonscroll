import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  monsterName: string;
  monsterRarity: "epic" | "legendary" | "mythic" | "ex";
  onExtractSuccess: () => void;
}

export function ExtractionModal({
  isOpen,
  onClose,
  monsterName,
  monsterRarity,
  onExtractSuccess,
}: ExtractionModalProps) {
  const [command, setCommand] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCommand("");
      setIsError(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = command.trim().toUpperCase();
    if (cmd === "ARISE" || cmd === "SUBMIT") {
      onExtractSuccess();
    } else {
      setIsError(true);
      setTimeout(() => setIsError(false), 500); // Shaker reset
    }
  };

  const getRarityGlow = () => {
    switch (monsterRarity) {
      case "ex":
        return "shadow-[0_0_40px_rgba(255,0,60,0.8)] border-red-500";
      case "mythic":
        return "shadow-[0_0_30px_rgba(255,215,0,0.6)] border-yellow-400";
      case "legendary":
        return "shadow-[0_0_20px_rgba(255,165,0,0.5)] border-orange-400";
      default:
        return "shadow-[0_0_15px_rgba(168,85,247,0.5)] border-purple-500";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className={`relative w-full max-w-md p-8 bg-[#0a0f1e]/90 border rounded-lg system-panel ${getRarityGlow()}`}
          >
            <div className="absolute inset-0 scanlines opacity-30 mix-blend-overlay pointer-events-none rounded-lg" />

            <div className="relative z-10 text-center space-y-6">
              <Lock className="w-12 h-12 mx-auto text-cyan-400 animate-pulse" />

              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                  SOUL CAPTURED
                </h2>
                <p className="text-sm font-mono text-cyan-200/70">
                  [{monsterRarity.toUpperCase()}] {monsterName} awaits your command.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <motion.div
                    animate={isError ? { x: [-10, 10, -10, 10, 0] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <Input
                      value={command}
                      onChange={(e) => {
                        setCommand(e.target.value);
                        setIsError(false);
                      }}
                      placeholder="Type ARISE or SUBMIT..."
                      className={`text-center font-mono text-xl tracking-widest bg-black/50 border-cyan-500/50 text-cyan-100 placeholder:text-cyan-800/50 ${
                        isError
                          ? "border-red-500 text-red-400 focus-visible:ring-red-500"
                          : "focus-visible:ring-cyan-500"
                      }`}
                      autoFocus
                    />
                  </motion.div>
                </div>

                <Button
                  type="submit"
                  className="w-full font-mono font-bold tracking-widest text-black bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                >
                  ESTABLISH DOMINANCE
                </Button>
              </form>
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 text-cyan-500/50 hover:text-cyan-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
