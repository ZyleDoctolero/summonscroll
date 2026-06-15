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

export function EmptyState({ icon, title, body, cta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 px-6 text-center">
      <div className="text-muted-foreground opacity-60">
        <Icon name={icon as any} size={40} />
      </div>
      <h3 className="font-heading text-lg" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      {body && (
        <p className="font-lore text-sm max-w-xs" style={{ color: "var(--text-secondary)" }}>
          {body}
        </p>
      )}
      {cta && (
        <button onClick={cta.onClick} className="ss-btn ss-btn-primary">
          {cta.label}
        </button>
      )}
    </div>
  );
}
