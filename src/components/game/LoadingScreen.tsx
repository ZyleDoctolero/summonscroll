import { Icon } from "@/components/ui/Icon";
import { AtmosphereBackdrop } from "./AtmosphereBackdrop";

export function LoadingScreen({ realmSlug }: { realmSlug?: string }) {
  return (
    <div
      className="min-h-screen grid place-items-center relative"
      style={{ background: 'var(--bg-deep)' }}
    >
      {realmSlug && <AtmosphereBackdrop realm={realmSlug} intensity="subtle" />}
      <div className="flex flex-col items-center gap-3 relative z-10">
        <Icon name="tome" className="animate-pulse" style={{ color: 'var(--gold-bright)' }} size={32} />
        <p className="font-lore text-sm" style={{ color: 'var(--ink-tertiary)' }}>
          The Page turns
        </p>
      </div>
    </div>
  );
}
