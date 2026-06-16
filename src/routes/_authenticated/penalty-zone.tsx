import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ShieldAlert, Terminal, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/penalty-zone")({
  component: PenaltyZone,
});

function PenaltyZone() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isChecked, setIsChecked] = useState(false);
  const audioRef = useRef<{ osc: OscillatorNode; ctx: AudioContext } | null>(null);
  const [audioActive, setAudioActive] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile-penalty"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("in_penalty_zone, penalty_zone_task")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile && !profile.in_penalty_zone) {
      navigate({ to: "/" });
    }
  }, [profile, navigate]);

  const startAudio = () => {
    if (audioRef.current) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(40, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      audioRef.current = { osc, ctx };
      setAudioActive(true);
    } catch {
      // Audio not available — continue without it
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.osc.stop();
          audioRef.current.ctx.close();
        } catch (e) {
          console.warn("Audio cleanup error", e);
        }
        audioRef.current = null;
      }
    };
  }, []);

  const escapeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("escape_penalty_zone");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Demonic Backlash suppressed. Your cultivation stabilizes.");
      navigate({ to: "/" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleEscape = () => {
    if (!isChecked) {
      toast.error("You must complete the tribulation task first.");
      return;
    }
    escapeMutation.mutate();
  };

  const hasTask = profile?.penalty_zone_task && profile.penalty_zone_task.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col items-center justify-center p-4"
      onClick={!audioActive ? startAudio : undefined}
    >
      {/* Ambient red pulse */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(139,0,0,0.15) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Scanlines — heavier here for the oppressive feel */}
      <div className="absolute inset-0 scanlines opacity-30 mix-blend-overlay pointer-events-none" />

      <motion.div
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-lg"
      >
        <div
          className="system-panel p-8"
          style={{
            borderColor: "rgba(139,0,0,0.6)",
            boxShadow: "0 0 60px rgba(139,0,0,0.2), inset 0 0 30px rgba(139,0,0,0.1)",
          }}
        >
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Icon */}
            <motion.div
              animate={{ rotate: [-1, 1, -1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <ShieldAlert
                className="w-16 h-16"
                style={{
                  color: "var(--manhwa-penalty-red)",
                  filter: "drop-shadow(0 0 20px rgba(139,0,0,0.8))",
                }}
              />
            </motion.div>

            {/* Title */}
            <div className="space-y-2">
              <h1
                className="text-3xl font-black tracking-widest uppercase font-display"
                style={{ color: "var(--manhwa-penalty-red)" }}
              >
                Demonic Backlash
              </h1>
              <p
                className="font-mono text-sm tracking-widest"
                style={{ color: "rgba(139,0,0,0.7)" }}
              >
                CULTIVATION FAILED — DEMONIC QI INVADING
              </p>
            </div>

            {/* Task Panel */}
            <div
              className="w-full p-5 text-left space-y-4 rounded-lg"
              style={{
                background: "rgba(139,0,0,0.08)",
                border: "1px solid rgba(139,0,0,0.25)",
              }}
            >
              <div
                className="flex items-center gap-2 font-mono text-sm"
                style={{ color: "var(--manhwa-penalty-red)" }}
              >
                <Terminal className="w-4 h-4" />
                <span>HEAVENLY_TRIBULATION.EXE</span>
              </div>

              {hasTask ? (
                <div
                  className="text-lg font-bold font-heading"
                  style={{ color: "var(--ink-primary)" }}
                >
                  {profile.penalty_zone_task}
                </div>
              ) : (
                <div
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "var(--ink-tertiary)" }}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-mono">
                    No task assigned. Check back or contact support.
                  </span>
                </div>
              )}

              <div
                className="pt-3 flex items-start gap-3 border-t"
                style={{ borderColor: "rgba(139,0,0,0.2)" }}
              >
                <input
                  type="checkbox"
                  id="task-complete"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="w-5 h-5 mt-0.5 accent-red-600 bg-black border-red-500 rounded-none cursor-pointer flex-shrink-0"
                />
                <label
                  htmlFor="task-complete"
                  className="font-mono text-sm cursor-pointer select-none leading-tight"
                  style={{ color: "rgba(200,100,100,0.8)" }}
                >
                  I have completed this task in real life.
                </label>
              </div>
            </div>

            {/* Escape Button */}
            <Button
              onClick={handleEscape}
              disabled={!isChecked || escapeMutation.isPending}
              className={`w-full font-mono font-bold tracking-widest uppercase transition-all duration-300 ${
                isChecked
                  ? "bg-red-700 hover:bg-red-600 text-white shadow-[0_0_25px_rgba(139,0,0,0.5)]"
                  : "bg-black/50 border border-red-900/30 text-red-900/50 cursor-not-allowed"
              }`}
            >
              {escapeMutation.isPending ? "PROCESSING..." : "SUPPRESS DEMONIC QI"}
            </Button>

            {!audioActive && (
              <p className="text-[10px] font-mono" style={{ color: "var(--ink-tertiary)" }}>
                Tap anywhere to enable ambient audio
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
