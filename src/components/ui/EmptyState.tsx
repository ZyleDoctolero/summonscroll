import { Icon, type IconName } from "@/components/ui/Icon";

interface EmptyStateProps {
  icon: IconName;
  title: string;
  body?: string;
  cta?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, body, cta }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center gap-4 py-14 px-8 text-center rounded-xl border shadow-inner"
      style={{
        background: "linear-gradient(180deg, rgba(250,246,240,0.6), rgba(245,239,230,0.8))",
        borderColor: "rgba(200,154,62,0.2)",
        boxShadow: "inset 0 2px 12px rgba(120,90,50,0.04), 0 4px 20px rgba(120,90,50,0.06)",
      }}
    >
      <div
        className="w-16 h-16 rounded-full grid place-items-center"
        style={{
          background: "rgba(200,154,62,0.08)",
          border: "1.5px solid rgba(200,154,62,0.15)",
        }}
      >
        <Icon name={icon} size={32} color="var(--gold-bright)" />
      </div>
      <h3
        className="font-heading text-lg font-bold tracking-wider"
        style={{ color: "var(--ink-primary)" }}
      >
        {title}
      </h3>
      {body && (
        <p
          className="font-lore text-sm max-w-xs leading-relaxed"
          style={{ color: "var(--ink-secondary)" }}
        >
          {body}
        </p>
      )}
      {cta && (
        <button
          onClick={cta.onClick}
          className="mt-2 px-6 py-2.5 rounded-lg font-semibold tracking-wide uppercase text-sm transition-all hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(135deg, rgba(200,154,62,0.12), rgba(200,154,62,0.06))",
            color: "var(--ink-primary)",
            border: "1.5px solid rgba(200,154,62,0.3)",
            boxShadow: "0 4px 16px rgba(120,90,50,0.08)",
          }}
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}
