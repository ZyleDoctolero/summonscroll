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
    <div className="flex flex-col items-center gap-4 py-16 px-6 text-center rounded-xl border border-[var(--gold-glow)]/50 bg-[var(--bg-stage)] shadow-inner">
      <div className="text-[var(--danger)] drop-shadow-md">
        <Icon name={icon} size={48} />
      </div>
      <h3 className="font-heading text-xl font-bold tracking-wider text-[var(--ink-primary)] drop-shadow-sm">
        {title}
      </h3>
      {body && <p className="font-lore text-sm max-w-xs text-[var(--ink-secondary)]">{body}</p>}
      {cta && (
        <button
          onClick={cta.onClick}
          className="mt-2 px-6 py-2 bg-[var(--bg-panel)] text-[var(--bg-stage)] border border-[var(--gold-glow)]/50 shadow-lg shadow-black/40 hover:shadow-xl hover:bg-[var(--ink-secondary)] transition-all rounded-md font-medium tracking-wide uppercase text-sm"
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}
