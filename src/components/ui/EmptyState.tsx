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
    <div className="flex flex-col items-center gap-4 py-16 px-6 text-center rounded-xl border border-cyan-900/30 bg-black/80 shadow-[inset_0_0_20px_rgba(0,255,255,0.05)]">
      <div className="text-cyan-500/60 drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">
        <Icon name={icon} size={48} />
      </div>
      <h3 className="font-heading text-xl font-bold tracking-wider text-cyan-100 drop-shadow-[0_0_5px_rgba(0,255,255,0.3)]">
        {title}
      </h3>
      {body && <p className="font-lore text-sm max-w-xs text-cyan-200/70">{body}</p>}
      {cta && (
        <button
          onClick={cta.onClick}
          className="mt-2 px-6 py-2 bg-black text-cyan-400 border border-cyan-500/50 shadow-[0_0_10px_rgba(0,255,255,0.2)] hover:shadow-[0_0_20px_rgba(0,255,255,0.6)] hover:bg-cyan-950/30 transition-all rounded-md font-medium tracking-wide uppercase text-sm"
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}
