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
      className="flex flex-col items-center gap-4 py-14 px-8 text-center border-2"
      style={{
        borderRadius: 0,
        background: "linear-gradient(180deg, rgba(250,246,240,0.6), rgba(245,239,230,0.8))",
        borderColor: "rgba(200,154,62,0.2)",
        boxShadow: "4px 4px 0 rgba(0,0,0,0.3)",
      }}
    >
      <div
        className="w-16 h-16 grid place-items-center"
        style={{
          borderRadius: 0,
          background: "rgba(200,154,62,0.08)",
          border: "2px solid rgba(200,154,62,0.2)",
          boxShadow: "3px 3px 0 rgba(0,0,0,0.3)",
        }}
      >
        <Icon name={icon} size={32} color="var(--gold-bright)" />
      </div>
      <h3
        className="text-lg font-bold uppercase"
        style={{
          fontFamily: "var(--ss-font-pixel)",
          color: "var(--ink-primary)",
          letterSpacing: "0.06em",
        }}
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
          className="mt-2 px-6 py-2.5 font-bold uppercase text-[11px] transition-all"
          style={{
            fontFamily: "var(--ss-font-pixel)",
            borderRadius: 0,
            background: "linear-gradient(135deg, rgba(200,154,62,0.12), rgba(200,154,62,0.06))",
            color: "var(--ink-primary)",
            border: "2px solid rgba(200,154,62,0.3)",
            boxShadow: "3px 3px 0 rgba(0,0,0,0.3)",
          }}
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}
