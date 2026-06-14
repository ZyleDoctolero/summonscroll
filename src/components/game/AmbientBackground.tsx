import { useMemo } from "react";
import { reducedMotion } from "@/lib/ui/motion-tokens";

// ─── Ambient Background ─────────────────────────────────────────────────────
// A fixed, full-viewport, pointer-events-none layer that sits BEHIND all
// content. It gives the whole app a "living world" feel instead of a flat page:
//   • slow-drifting glowing motes (the summoning dust)
//   • a faint arcane grid
//   • a vignette that focuses the eye toward center
//
// Pure CSS animation — no canvas, cheap. Respects prefers-reduced-motion.

const MOTE_COUNT = 26;

export function AmbientBackground() {
  const rm = reducedMotion();

  const motes = useMemo(
    () =>
      Array.from({ length: MOTE_COUNT }, (_, i) => {
        const left = Math.random() * 100;
        const size = 1.5 + Math.random() * 3.5;
        const duration = 14 + Math.random() * 22;
        const delay = -Math.random() * duration;
        const drift = (Math.random() - 0.5) * 60;
        // tint: mostly gold, some violet/cyan
        const tints = [
          "var(--gold-glow)",
          "var(--gold-glow)",
          "var(--violet)",
          "var(--cyan)",
        ];
        const color = tints[i % tints.length];
        return { left, size, duration, delay, drift, color, key: i };
      }),
    []
  );

  return (
    <div className="ambient-bg" aria-hidden>
      {/* arcane grid */}
      <div className="ambient-grid" />

      {/* drifting motes */}
      {!rm && (
        <div className="ambient-motes">
          {motes.map((m) => (
            <span
              key={m.key}
              className="ambient-mote"
              style={
                {
                  left: `${m.left}%`,
                  width: `${m.size}px`,
                  height: `${m.size}px`,
                  background: m.color,
                  boxShadow: `0 0 ${m.size * 3}px ${m.color}`,
                  animationDuration: `${m.duration}s`,
                  animationDelay: `${m.delay}s`,
                  ["--drift" as string]: `${m.drift}px`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      {/* vignette */}
      <div className="ambient-vignette" />
    </div>
  );
}
