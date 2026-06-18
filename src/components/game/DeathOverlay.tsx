import { useEffect, useState } from "react";

export function DeathOverlay({ trigger }: { trigger: number }) {
  const [show, setShow] = useState(false);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    setShow(true);
    // Fade in
    requestAnimationFrame(() => setOpacity(1));
    const t = setTimeout(() => {
      setOpacity(0);
      setTimeout(() => setShow(false), 300);
    }, 3200);
    return () => clearTimeout(t);
  }, [trigger]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center transition-opacity duration-300"
      style={{ background: "rgba(61,46,31,0.88)", opacity }}
    >
      <div className="text-center">
        <div
          className="t-display text-5xl md:text-6xl font-bold mb-4"
          style={{
            color: "var(--danger)",
            textShadow: "0 0 32px rgba(224,82,82,0.7), 0 0 64px rgba(224,82,82,0.3)",
          }}
        >
          SOUL DISSIPATED
        </div>
        <div className="text-sm md:text-base mb-2" style={{ color: "var(--ink-secondary)" }}>
          Lost 1 minor realm and all Spirit Stones.
        </div>
        <div className="t-h3 text-lg" style={{ color: "var(--gold-bright)" }}>
          Reincarnation triggered - cultivate harder.
        </div>
      </div>
    </div>
  );
}
