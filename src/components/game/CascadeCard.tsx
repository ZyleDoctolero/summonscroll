import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { trans, stagger, reducedMotion } from "@/lib/ui/motion-tokens";
import { sounds } from "@/lib/ui/sounds";

// ─── Types ──────────────────────────────────────────────────────────────────
// The CascadeCard receives the *full* result envelope from a system action
// (scoreTask, runExpedition, runTrial) and surfaces the chain of consequences
// in a single rhythmic reveal. The reason: every action in this game touches
// 3-6 systems at once. Surfacing only one breaks the player's mental model.

export type CascadeEvent =
  | { kind: "reward"; gold?: number; xp?: number; crystals?: number; hp?: number }
  | { kind: "bond"; monsterName: string; from: number; to: number }
  | { kind: "boss"; title: string; damage: number; hpRemaining: number; hpTotal: number }
  | { kind: "awakening"; monsterName: string; skillName: string; flavor: string }
  | { kind: "streak"; days: number }
  | { kind: "drop"; itemType: string; itemName: string; quantity: number }
  | { kind: "leveledUp"; level: number }
  | { kind: "tomeMint" }
  | { kind: "died" };

// ─── Public hook ────────────────────────────────────────────────────────────
// Imperative API: call `show(events)` from anywhere. The card stacks (if a
// new envelope arrives before the previous one dismissed, the previous one
// fades and the new one takes over — no overlap).

let publish: null | ((events: CascadeEvent[]) => void) = null;

export function showCascade(events: CascadeEvent[]) {
  if (!events || events.length === 0) return;
  if (publish) publish(events);
}

// ─── Provider ───────────────────────────────────────────────────────────────
// Mount once near the app root. Lives above the content so it doesn't
// re-render with route changes.

export function CascadeProvider() {
  const [events, setEvents] = useState<CascadeEvent[] | null>(null);
  const [seed, setSeed] = useState(0); // forces re-mount when same array re-shows

  useEffect(() => {
    publish = (e) => {
      setEvents(e);
      setSeed((s) => s + 1);
      // Tier the audio by the heaviest event in the cascade.
      const hasAwakening = e.some((x) => x.kind === "awakening");
      const hasLevel = e.some((x) => x.kind === "leveledUp");
      const hasTome = e.some((x) => x.kind === "tomeMint");
      const hasDeath = e.some((x) => x.kind === "died");
      if (hasDeath) sounds.toll();
      else if (hasTome || hasAwakening) sounds.bell();
      else if (hasLevel) sounds.ascend();
      else sounds.chime();
    };
    return () => {
      publish = null;
    };
  }, []);

  // Auto-dismiss
  useEffect(() => {
    if (!events) return;
    const t = setTimeout(() => setEvents(null), 4200);
    return () => clearTimeout(t);
  }, [seed]);

  const rm = reducedMotion();

  return (
    <AnimatePresence>
      {events && events.length > 0 && (
        <motion.div
          key={seed}
          initial={rm ? { opacity: 0 } : { y: 40, opacity: 0 }}
          animate={rm ? { opacity: 1 } : { y: 0, opacity: 1 }}
          exit={rm ? { opacity: 0 } : { y: 20, opacity: 0 }}
          transition={trans.cascadeIn}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] w-[min(420px,calc(100%-2rem))]"
          onClick={() => setEvents(null)}
        >
          <CascadeBody events={events} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Visual body ────────────────────────────────────────────────────────────

function CascadeBody({ events }: { events: CascadeEvent[] }) {
  const delays = stagger(events.length, 0.05, 0.04);

  return (
    <div className="ss-modal backdrop-blur-md">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="t-label" style={{ color: "var(--gold-bright)" }}>
            Cascade
          </span>
          <span className="text-[10px]" style={{ color: "var(--ink-tertiary)" }}>
            {events.length} effect{events.length === 1 ? "" : "s"}
          </span>
        </div>
        <span className="text-[10px]" style={{ color: "var(--ink-tertiary)" }}>
          tap to dismiss
        </span>
      </div>

      <div className="px-4 pb-4 space-y-1.5">
        {events.map((e, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...trans.itemIn, delay: delays[i] }}
          >
            <EventRow event={e} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Event renderer (one row per consequence) ───────────────────────────────

function EventRow({ event }: { event: CascadeEvent }) {
  switch (event.kind) {
    case "reward":
      return (
        <div className="flex items-center gap-3 text-sm">
          {event.gold && event.gold > 0 ? (
            <span style={{ color: "var(--gold-bright)" }}>
              💰 <NumberFlow value={event.gold} prefix="+" />
            </span>
          ) : null}
          {event.xp && event.xp > 0 ? (
            <span style={{ color: "var(--ink-secondary)" }}>
              ✦ <NumberFlow value={event.xp} prefix="+" /> XP
            </span>
          ) : null}
          {event.crystals && event.crystals > 0 ? (
            <span style={{ color: "var(--cyan)" }}>
              💎 <NumberFlow value={event.crystals} prefix="+" />
            </span>
          ) : null}
          {event.hp && event.hp !== 0 ? (
            <span style={{ color: event.hp < 0 ? "var(--danger)" : "var(--success)" }}>
              ❤ <NumberFlow value={event.hp} prefix={event.hp > 0 ? "+" : ""} />
            </span>
          ) : null}
        </div>
      );

    case "bond":
      return (
        <div className="text-sm">
          <span style={{ color: "var(--gold-bright)" }}>💖</span>{" "}
          <span style={{ color: "var(--ink-primary)" }}>{event.monsterName}</span>{" "}
          <span style={{ color: "var(--ink-secondary)" }}>bond</span>{" "}
          <NumberFlow
            value={event.to}
            format={{ maximumFractionDigits: 1 }}
            suffix="%"
            className="font-mono"
            style={{ color: "var(--gold-bright)" }}
          />
        </div>
      );

    case "boss":
      return (
        <div className="text-sm">
          <span style={{ color: "var(--danger)" }}>👑</span>{" "}
          <span style={{ color: "var(--ink-primary)" }}>{event.title}</span>{" "}
          <span style={{ color: "var(--ink-secondary)" }}>−</span>
          <NumberFlow value={event.damage} style={{ color: "var(--danger)" }} />
          <span style={{ color: "var(--ink-tertiary)" }} className="text-xs ml-2">
            ({event.hpRemaining.toLocaleString()} / {event.hpTotal.toLocaleString()})
          </span>
        </div>
      );

    case "awakening":
      return (
        <div
          className="text-sm rounded-md p-2"
          style={{ background: "rgba(255,213,79,0.08)", border: "1px solid rgba(255,213,79,0.2)" }}
        >
          <span style={{ color: "var(--gold-bright)" }}>⚡</span>{" "}
          <span style={{ color: "var(--gold-bright)", fontWeight: 600 }}>{event.monsterName}</span>
          <span style={{ color: "var(--ink-secondary)" }}> awakened </span>
          <span style={{ color: "var(--gold-bright)", fontStyle: "italic" }}>
            {event.skillName}
          </span>
          <p className="text-[11px] mt-1 italic" style={{ color: "var(--ink-secondary)" }}>
            {event.flavor}
          </p>
        </div>
      );

    case "streak":
      return (
        <div className="text-sm">
          <span>🔥</span>{" "}
          <span style={{ color: "var(--ember)" }}>
            <NumberFlow value={event.days} /> day streak
          </span>
        </div>
      );

    case "drop":
      return (
        <div className="text-sm">
          <span>
            {event.itemType === "egg"
              ? "🥚"
              : event.itemType === "realm_potion"
                ? "🧪"
                : event.itemType === "food"
                  ? "🍖"
                  : "📦"}
          </span>{" "}
          <span style={{ color: "var(--ink-primary)" }}>{event.itemName}</span>{" "}
          <span style={{ color: "var(--ink-secondary)" }}>×{event.quantity}</span>
        </div>
      );

    case "leveledUp":
      return (
        <div
          className="text-sm rounded-md p-2"
          style={{ background: "rgba(255,213,79,0.08)", border: "1px solid rgba(255,213,79,0.2)" }}
        >
          <span style={{ color: "var(--gold-bright)", fontWeight: 700 }}>
            ✦ Level <NumberFlow value={event.level} />
          </span>
          <span style={{ color: "var(--ink-secondary)" }} className="ml-2 text-xs">
            HP restored
          </span>
        </div>
      );

    case "tomeMint":
      return (
        <div
          className="text-sm rounded-md p-2"
          style={{ background: "rgba(255,213,79,0.08)", border: "1px solid rgba(255,213,79,0.3)" }}
        >
          <span style={{ color: "var(--gold-bright)", fontWeight: 700 }}>
            📕 Tome of Reverse Heaven minted
          </span>
        </div>
      );

    case "died":
      return (
        <div
          className="text-sm rounded-md p-2"
          style={{ background: "rgba(224,82,82,0.1)", border: "1px solid rgba(224,82,82,0.3)" }}
        >
          <span style={{ color: "var(--danger)", fontWeight: 700 }}>
            💀 You fell — Gold lost, level −1
          </span>
        </div>
      );

    default:
      return null;
  }
}
