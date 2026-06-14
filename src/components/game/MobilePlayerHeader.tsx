import { Icon } from "@/components/ui/Icon";

type Profile = {
  display_name: string;
  level: number;
  hp: number;
  max_hp: number;
  gold: number;
  crystals: number;
  class?: string;
};

export function MobilePlayerHeader({ profile }: { profile: Profile }) {
  return (
    <header
      className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b backdrop-blur-md"
      style={{
        background: "rgba(15,18,26,0.92)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full grid place-items-center font-bold text-xs"
          style={{
            background: "linear-gradient(135deg, var(--gold-glow), var(--gold-bright))",
            color: "var(--bg-deep)",
          }}
        >
          {profile.display_name.slice(0, 1).toUpperCase()}
        </div>
        <div className="flex items-center gap-2">
          <span className="t-mono text-sm" style={{ color: "var(--gold-bright)" }}>
            Lv.{profile.level}
          </span>
          <span className="text-xs" style={{ color: "var(--ink-secondary)" }}>
            {profile.hp}/{profile.max_hp}
          </span>
          {/* HP bar */}
          <div
            className="w-12 h-1.5 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (profile.hp / Math.max(1, profile.max_hp)) * 100)}%`,
                background:
                  profile.hp / profile.max_hp > 0.5
                    ? "var(--success)"
                    : profile.hp / profile.max_hp > 0.25
                      ? "var(--ss-warning, var(--warning))"
                      : "var(--danger)",
              }}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 t-mono text-xs">
        <span className="flex items-center gap-1" style={{ color: "var(--gold-bright)" }}>
          <Icon name="gold" size={14} />
          {profile.gold?.toLocaleString() ?? 0}
        </span>
        <span className="flex items-center gap-1" style={{ color: "var(--cyan)" }}>
          <Icon name="crystal" size={14} />
          {profile.crystals?.toLocaleString() ?? 0}
        </span>
      </div>
    </header>
  );
}
