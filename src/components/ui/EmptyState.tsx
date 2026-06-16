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
    <div className="flex flex-col items-center gap-4 py-16 px-6 text-center rounded-xl border border-[#b8973c]/50 bg-[#f4ecd8] shadow-inner">
      <div className="text-[#8b0000] drop-shadow-md">
        <Icon name={icon} size={48} />
      </div>
      <h3 className="font-heading text-xl font-bold tracking-wider text-[#1a1a1a] drop-shadow-sm">
        {title}
      </h3>
      {body && <p className="font-lore text-sm max-w-xs text-[#3d2e1f]">{body}</p>}
      {cta && (
        <button
          onClick={cta.onClick}
          className="mt-2 px-6 py-2 bg-[#2a1e12] text-[#f4ecd8] border border-[#b8973c]/50 shadow-lg shadow-black/40 hover:shadow-xl hover:bg-[#3d2e1f] transition-all rounded-md font-medium tracking-wide uppercase text-sm"
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}
