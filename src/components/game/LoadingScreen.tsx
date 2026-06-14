import { useEffect, useState } from "react";

// ─── Branded loading screen ─────────────────────────────────────────────────
// A summoning-circle spinner + a rotating realm lore line. Replaces the bare
// "Loading…" text divs so even the wait feels like part of the world.

const LORE_LINES = [
  "The Page listens for your name…",
  "Twelve realms stir in the dark…",
  "Ink gathers at the nib…",
  "The Vaults remember being read…",
  "A flame thinks, in the Wastes…",
  "Something patient opens one eye…",
  "The candle has not yet guttered…",
  "Stones drift in lightless cold…",
  "The catalog is never complete…",
  "Discipline reaches back to the beginning…",
];

export function LoadingScreen({ message }: { message?: string }) {
  const [line, setLine] = useState(() => LORE_LINES[Math.floor(Math.random() * LORE_LINES.length)]);

  useEffect(() => {
    const id = setInterval(() => {
      setLine(LORE_LINES[Math.floor(Math.random() * LORE_LINES.length)]);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen grid place-items-center" style={{ background: "var(--bg-deep)" }}>
      <div className="flex flex-col items-center gap-6">
        <div className="summon-loader">
          <div className="ring ring-1" />
          <div className="ring ring-2" />
          <div className="ring ring-3" />
          <div className="core" />
        </div>
        <p
          className="t-lore text-center max-w-xs transition-opacity"
          style={{ color: "var(--ink-secondary)" }}
        >
          {message ?? line}
        </p>
      </div>
    </div>
  );
}
