import { useEffect, useState } from "react";

export function DeathOverlay({ trigger }: { trigger: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!trigger) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 3500);
    return () => clearTimeout(t);
  }, [trigger]);
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center"
      style={{ background: "rgba(0,0,0,0.85)", animation: "ss-fade 300ms ease" }}
    >
      <div className="text-center">
        <div
          className="text-6xl font-bold mb-4"
          style={{ color: "#E05252", fontFamily: "'Cinzel',serif", textShadow: "0 0 32px rgba(224,82,82,0.7)" }}
        >
          💀 YOU HAVE FALLEN
        </div>
        <div className="text-lg" style={{ color: "#A09D96" }}>
          Revived — fight harder.
        </div>
      </div>
      <style>{`@keyframes ss-fade { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
}
