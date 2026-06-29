import { MonsterCard } from "@/components/game/MonsterCard";

type SlimMonster = {
  team_slot: number | null;
  bond_percent: number;
  level: number;
  ascension_level?: number | null;
  grimoire_dormant?: boolean | null;
  fallen_covenant?: boolean | null;
  monster: {
    name: string;
    element: string;
    role: string;
    rarity: string;
    art_url?: string | null;
  };
};

const ZONE_NAMES = ["Vanguard", "Skirmisher", "Sentinel", "Arcanist", "Anchor"] as const;

function computeTeamSynergy(monsters: SlimMonster[]): {
  type: "harmony" | "focus" | "none";
  label: string;
  bonus: string;
} {
  const active = monsters.filter((m) => m.team_slot !== null && m.team_slot >= 1 && m.team_slot <= 3);
  if (active.length < 3) return { type: "none", label: "", bonus: "" };

  const elements = active.map((m) => m.monster.element.toLowerCase());
  const unique = new Set(elements);

  if (unique.size === 3) {
    return { type: "harmony", label: "Planar Harmony", bonus: "+10% All Stats" };
  }
  if (unique.size === 1) {
    return { type: "focus", label: "Realm Focus", bonus: "+15% Elemental DMG" };
  }
  return { type: "none", label: "", bonus: "" };
}

export function IslandZones({
  monsters,
  onEmptyClick,
}: {
  monsters: SlimMonster[];
  onEmptyClick?: (zoneIndex: number) => void;
}) {
  const synergy = computeTeamSynergy(monsters);

  return (
    <div>
      {/* Team Synergy badge */}
      {synergy.type !== "none" && (
        <div className="flex items-center gap-2 mb-3">
          <span className={synergy.type === "harmony" ? "ss-badge-synergy-harmony" : "ss-badge-synergy-focus"}>
            {synergy.type === "harmony" ? "⬟" : "◆"} {synergy.label}
          </span>
          <span
            style={{ fontFamily: "var(--ss-font-pixel)", fontSize: 9, color: synergy.type === "harmony" ? "#3ed97a" : "var(--gold-bright)" }}
          >
            {synergy.bonus}
          </span>
        </div>
      )}

      <div className="island-grid overflow-x-auto pb-4">
        {ZONE_NAMES.map((zone, i) => {
          const slot = i + 1;
          const monster = monsters.find((m) => m.team_slot === slot);
          return (
            <div key={zone} className="island-zone min-w-[80px]">
              <span
                className="text-[9px] mb-2 block text-center uppercase"
                style={{ fontFamily: "var(--ss-font-pixel)", color: "var(--ink-tertiary)", letterSpacing: "0.04em" }}
              >
                {zone}
              </span>
              {monster ? (
                <MonsterCard monster={monster as Parameters<typeof MonsterCard>[0]["monster"]} compact={true} onRemove={() => onEmptyClick?.(slot)} />
              ) : (
                <EmptyZoneSlot zoneIndex={slot} onClick={() => onEmptyClick?.(slot)} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyZoneSlot({ zoneIndex: _zoneIndex, onClick }: { zoneIndex: number; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full h-24 flex items-center justify-center opacity-40 hover:opacity-80 transition-opacity"
      style={{
        border: "2px dashed rgba(200,154,62,0.3)",
        borderRadius: 0,
        background: "rgba(200,154,62,0.03)",
      }}
    >
      <span className="text-2xl" style={{ color: "var(--ink-tertiary)" }}>+</span>
    </button>
  );
}
