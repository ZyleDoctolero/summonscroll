import { RARITY_COLOR, RARITY_GLOW, type Rarity } from "@/lib/game/gacha.constants";
import { Icon } from "@/components/ui/Icon";

export function MonsterCard({ 
  monster, 
  compact = false, 
  onRemove,
  onClick
}: { 
  monster: any; 
  compact?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
}) {
  const r = monster.monster.rarity as Rarity;
  const fatigued = monster.bond_percent < 10;
  const ascensionLevel = monster.ascension_level ?? 0;

  return (
    <div
      className={`ss-card text-center relative w-full ${compact ? 'p-2' : ''}`}
      style={{
        borderColor: RARITY_COLOR[r],
        boxShadow: r !== "common" ? RARITY_GLOW[r] : undefined,
        opacity: fatigued ? 0.5 : 1,
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      {ascensionLevel > 0 && (
        <div
          className="absolute -top-2 -right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{
            background: "linear-gradient(135deg,var(--realm-void),var(--realm-chaos),var(--realm-iron))",
            color: "var(--ink-primary)",
            zIndex: 10
          }}
        >
          +{ascensionLevel}
        </div>
      )}
      <div className="w-full aspect-square rounded mb-2 flex items-center justify-center overflow-hidden ss-pane relative">
        <img
          src={
            monster.monster.art_url
              ? monster.monster.art_url
              : `/sprites/monsters/${monster.monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
          }
          className="w-full h-full object-cover"
          style={{
            filter: monster.bond_percent >= 100 ? "drop-shadow(0 0 8px var(--gold-bright))" : 
                    monster.bond_percent >= 75 ? "drop-shadow(0 0 6px var(--cyan))" : 
                    monster.bond_percent >= 50 ? "drop-shadow(0 0 4px rgba(255, 213, 79, 0.4))" : 
                    fatigued ? "grayscale(80%)" : "none",
            transition: "filter 0.3s ease"
          }}
          alt={monster.monster.name}
          onError={(e) => {
            e.currentTarget.src = "/monsters/placeholder.png";
          }}
        />
      </div>
      <p className={`${compact ? 'text-[10px]' : 't-label'} truncate font-bold`} style={{ color: "var(--ink-primary)" }}>
        {monster.monster.name}
      </p>
      <p className="text-[9px]" style={{ color: "var(--ink-secondary)" }}>
        Lvl {monster.level} . Bond {Math.round(monster.bond_percent)}%
      </p>
      {fatigued && (
        <div
          className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 z-10"
          style={{ background: "var(--danger)", color: "var(--ink-primary)" }}
        >
          <Icon name="stamina" size={10} color="var(--ink-primary)" />
          {!compact && <span>FATIGUE</span>}
        </div>
      )}
      {monster.bond_percent >= 100 && (
        <div
          className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 z-10 animate-pulse"
          style={{ background: "rgba(255,213,79,0.2)", color: "var(--gold-bright)" }}
        >
          <Icon name="sparkle" size={10} color="var(--gold-bright)" />
          {!compact && <span>AWAKENED</span>}
        </div>
      )}
      {monster.bond_percent >= 75 && monster.bond_percent < 100 && (
        <div
          className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 z-10"
          style={{ background: "rgba(90, 224, 255, 0.15)", color: "var(--cyan)" }}
        >
          <Icon name="heart" size={10} color="var(--cyan)" />
          {!compact && <span>DEVOTED</span>}
        </div>
      )}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="mt-1 text-[9px] px-2 py-0.5 rounded font-semibold w-full"
          style={{ color: "var(--danger)", background: "rgba(255,94,94,0.1)" }}
        >
          Remove
        </button>
      )}
    </div>
  );
}
