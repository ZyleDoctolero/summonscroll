import { motion } from "motion/react";
import { trans } from "@/lib/ui/motion-tokens";
import { Icon } from "@/components/ui/Icon";

interface EmptyStateProps {
  icon: string;
  title: string;
  body?: string;
  cta?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * EmptyState - Evocative empty state component
 *
 * Displays a diegetic, inviting empty state with Proposal D voice.
 * Includes icon, title, optional body text, and optional CTA button.
 *
 * Uses dashed border and motion entrance for polish.
 */
export function EmptyState({ icon, title, body, cta }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={trans.itemIn}
      className="ss-card flex flex-col items-center text-center py-12 px-6"
      style={{ borderStyle: "dashed", borderColor: "rgba(255,255,255,0.08)" }}
    >
      <div className="mb-3 opacity-60">
        <Icon name={icon as any} size={40} />
      </div>
      <h3 className="t-h3 mb-2" style={{ color: "var(--ink-primary)" }}>
        {title}
      </h3>
      {body && (
        <p className="t-lore max-w-sm" style={{ color: "var(--ink-secondary)" }}>
          {body}
        </p>
      )}
      {cta && (
        <button onClick={cta.onClick} className="ss-btn ss-btn-primary mt-5">
          {cta.label}
        </button>
      )}
    </motion.div>
  );
}
