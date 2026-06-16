import { MonsterCard } from "@/components/game/MonsterCard";
import type { UserMonster } from "@/lib/game/supabase-api";

const ZONE_NAMES = ["Vanguard", "Skirmisher", "Sentinel", "Arcanist", "Anchor"] as const;

export function IslandZones({
  monsters,
  onEmptyClick,
}: {
  monsters: UserMonster[];
  onEmptyClick?: (zoneIndex: number) => void;
}) {
  return (
    <div className="island-grid overflow-x-auto pb-4">
      {ZONE_NAMES.map((zone, i) => {
        const slot = i + 1;
        const monster = monsters.find((m) => m.team_slot === slot);
        return (
          <div key={zone} className="island-zone min-w-[80px]">
            <span className="font-lore text-xs mb-2" style={{ color: "var(--ink-secondary)" }}>
              {zone}
            </span>
            {monster ? (
              <MonsterCard monster={monster} compact={true} onRemove={() => onEmptyClick?.(slot)} />
            ) : (
              <EmptyZoneSlot zoneIndex={slot} onClick={() => onEmptyClick?.(slot)} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function EmptyZoneSlot({ zoneIndex, onClick }: { zoneIndex: number; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full h-24 border border-dashed rounded-lg flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
      style={{ borderColor: "var(--ink-secondary)", background: "rgba(255,255,255,0.03)" }}
    >
      <span className="text-2xl" style={{ color: "var(--ink-secondary)" }}>
        +
      </span>
    </button>
  );
}
