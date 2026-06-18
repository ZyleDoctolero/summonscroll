import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { trans, ease, dur, reducedMotion } from "@/lib/ui/motion-tokens";
import { Icon } from "@/components/ui/Icon";

//  Whisper Feed
// Bottom-right scroll of recent diegetic monster commentary. Each whisper:
//   * Fades in from the right at 240ms
//   * Sits for 12 seconds (8s if the user is active)
//   * Slides out to the right
//
// The feed maintains last 5 in memory. Older fall off the top.
//
// Source of whispers is imperative via the published API. Whispers can come
// from anywhere in the app:
//   - Devoted monster commentary (cron-style, once per session)
//   - State-transition reactions (streak milestone, awakening, boss slain)
//   - Manual diegetic flavor on specific user actions

export type Whisper = {
  id: string;
  monsterName: string;
  line: string;
  tone?: "calm" | "urgent" | "playful" | "grave";
  createdAt: number;
};

//  Imperative API

let publish: null | ((w: Omit<Whisper, "id" | "createdAt">) => void) = null;

// eslint-disable-next-line react-refresh/only-export-components
export function whisper(input: Omit<Whisper, "id" | "createdAt">) {
  if (publish) publish(input);
}

//  Provider

export function WhisperProvider() {
  const [items, setItems] = useState<Whisper[]>([]);
  const rm = reducedMotion();

  useEffect(() => {
    publish = (input) => {
      const next: Whisper = {
        ...input,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: Date.now(),
      };
      setItems((prev) => {
        const cleaned = prev.slice(-4); // last 4 + new = 5 max
        return [...cleaned, next];
      });
    };
    return () => {
      publish = null;
    };
  }, []);

  // Sweep: drop whispers older than 12s
  useEffect(() => {
    if (items.length === 0) return;
    const t = setInterval(() => {
      const cutoff = Date.now() - 12000;
      setItems((prev) => prev.filter((w) => w.createdAt > cutoff));
    }, 1000);
    return () => clearInterval(t);
  }, [items.length]);

  const dismiss = (id: string) => setItems((prev) => prev.filter((w) => w.id !== id));

  return (
    <div className="fixed bottom-4 right-4 z-[70] flex flex-col-reverse gap-2 pointer-events-none w-[min(320px,calc(100%-2rem))]">
      <AnimatePresence>
        {items.map((w) => (
          <motion.div
            key={w.id}
            initial={rm ? { opacity: 0 } : { opacity: 0, x: 32, scale: 0.96 }}
            animate={rm ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
            exit={rm ? { opacity: 0 } : { opacity: 0, x: 32, scale: 0.97 }}
            transition={{ duration: dur.normal, ease: ease.out }}
            layout
            onClick={() => dismiss(w.id)}
            className="pointer-events-auto cursor-pointer ss-card"
            style={whisperStyle(w.tone)}
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5">{toneIcon(w.tone)}</div>
              <div className="flex-1 min-w-0">
                <p className="t-label truncate" style={{ color: "var(--gold-bright)" }}>
                  {w.monsterName}
                </p>
                <p className="t-lore mt-0.5">
                  "<Typewriter text={w.line} />"
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

//  Style per tone

function whisperStyle(tone?: Whisper["tone"]): React.CSSProperties {
  switch (tone) {
    case "urgent":
      return {
        background: "rgba(224,82,82,0.10)",
        borderColor: "rgba(224,82,82,0.32)",
        boxShadow: "0 8px 24px rgba(120,90,50,0.12), 0 0 12px rgba(224,82,82,0.15)",
      };
    case "playful":
      return {
        background: "rgba(95,173,65,0.08)",
        borderColor: "rgba(95,173,65,0.28)",
        boxShadow: "0 8px 24px rgba(120,90,50,0.12)",
      };
    case "grave":
      return {
        background: "rgba(127,119,221,0.08)",
        borderColor: "rgba(127,119,221,0.28)",
        boxShadow: "0 8px 24px rgba(120,90,50,0.15)",
      };
    case "calm":
    default:
      return {
        background: "var(--bg-stage)",
        borderColor: "rgba(255,213,79,0.18)",
        boxShadow: "0 8px 24px rgba(120,90,50,0.12)",
      };
  }
}

function toneIcon(tone?: Whisper["tone"]): React.ReactNode {
  switch (tone) {
    case "urgent":
      return <Icon name="battle" size={14} color="var(--danger)" />;
    case "playful":
      return <Icon name="sparkle" size={14} color="var(--success)" />;
    case "grave":
      return <Icon name="evening" size={14} color="var(--violet)" />;
    case "calm":
    default:
      return <Icon name="star" size={14} color="var(--gold-bright)" />;
  }
}

function Typewriter({ text, speed = 25 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const rm = reducedMotion();
  useEffect(() => {
    if (rm) {
      setDisplayed(text);
      return;
    }
    setDisplayed("");
    let i = 0;
    const t = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text, speed, rm]);
  return <span>{displayed}</span>;
}
