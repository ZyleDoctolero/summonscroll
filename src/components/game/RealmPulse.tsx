import { useEffect, useState } from "react";
import { DURATION, EASING } from "@/lib/motion";

interface RealmPulseProps {
  realmId: number | null;
  onComplete?: () => void;
}

const REALM_SLUG_MAP: Record<number, string> = {
  1: "vaults",
  2: "chaos",
  3: "dark",
  4: "blight",
  5: "wild",
  6: "divine",
  7: "veil",
  8: "digital",
  9: "elder",
  10: "void",
  11: "myth",
  12: "iron",
};

export function RealmPulse({ realmId, onComplete }: RealmPulseProps) {
  const [visible, setVisible] = useState(true);
  const slug = realmId ? REALM_SLUG_MAP[realmId] : null;

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, DURATION.slow);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible || !slug) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50"
      style={{
        background: `radial-gradient(ellipse at center, transparent 40%, var(--realm-${slug}-accent) 100%)`,
        opacity: 0.18,
        animation: `realmPulse ${DURATION.slow}ms ${EASING.decel} forwards`,
      }}
    />
  );
}
