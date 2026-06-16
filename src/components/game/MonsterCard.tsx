import { RARITY_COLOR, RARITY_GLOW, type Rarity } from "@/lib/game/gacha.constants";
import { Icon } from "@/components/ui/Icon";

import type { UserMonster } from "@/lib/game/supabase-api";

export function MonsterCard({
  monster,
  compact = false,
  onRemove,
  onClick,
}: {
  monster: UserMonster;
  compact?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
}) {
  const r = monster.monster.rarity as Rarity;
  const fatigued = monster.bond_percent < 10;
  const ascensionLevel = monster.ascension_level ?? 0;

  // Element colors for Manhwa UI

  const getElementColor = (el: string) => {
    if (!el) return "var(--cyan)";
    switch (el.toLowerCase()) {
      case "fire":
        // eslint-disable-next-line no-restricted-syntax
        return "#ff5252";
      case "water":
        // eslint-disable-next-line no-restricted-syntax
        return "#448aff";
      case "nature":
        // eslint-disable-next-line no-restricted-syntax
        return "#69f0ae";
      case "light":
        // eslint-disable-next-line no-restricted-syntax
        return "#ffff00";
      case "dark":
        // eslint-disable-next-line no-restricted-syntax
        return "#aa00ff";
      default:
        return "var(--cyan)";
    }
  };

  const elColor = getElementColor(monster.monster.element);

  return (
    <div
      className={`relative w-full overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${compact ? "p-1.5" : "p-3"} group`}
      style={{
        background: `#f4ecd8`,
        border: `1px solid ${RARITY_COLOR[r]}80`,
        boxShadow: `0 4px 10px rgba(0,0,0,0.2)`,
        opacity: fatigued ? 0.6 : 1,
        cursor: onClick ? "pointer" : "default",
        borderRadius: "8px",
      }}
      onClick={onClick}
    >
      {/* Hover glow effect with shine */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none z-20"
        style={{
          boxShadow: `inset 0 0 40px ${RARITY_COLOR[r]}30`,
          background: `linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 25%, transparent 30%)`,
        }}
      ></div>

      {/* Rarity Stars & Element Header */}
      <div className="absolute top-1.5 left-2 right-2 flex justify-between items-start z-10 pointer-events-none">
        <div className="flex flex-col gap-0.5">
          <span
            className="text-[9px] font-bold uppercase tracking-widest"
            style={{ color: "#1a1a1a", opacity: 0.8 }}
          >
            [{r.toUpperCase()}-CLASS] {monster.monster.element || "VOID"}
          </span>
          <div className="flex mt-0.5">
            {Array.from({
              length:
                r === "ex"
                  ? 6
                  : r === "mythic"
                    ? 5
                    : r === "legendary"
                      ? 4
                      : r === "epic"
                        ? 3
                        : r === "rare"
                          ? 2
                          : 1,
            }).map((_, i) => (
              <Icon
                key={i}
                name="star"
                size={compact ? 8 : 10}
                color={RARITY_COLOR[r]}
                className="fill-current"
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span
            className="font-['VT323'] text-[16px] leading-none"
            style={{ color: "#1a1a1a", textShadow: "none" }}
          >
            Lv.{monster.level}
          </span>
          {ascensionLevel > 0 && (
            <span
              className="font-['VT323'] text-sm leading-none mt-0.5 text-fuchsia-800"
            >
              +{ascensionLevel}
            </span>
          )}
        </div>
      </div>

      <div className="w-full aspect-square rounded mb-2 flex items-center justify-center overflow-hidden relative mt-5 bg-transparent">
        <img
          src={
            monster.monster.art_url
              ? monster.monster.art_url
              : `/sprites/monsters/${monster.monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
          }
          className="w-[120%] h-[120%] object-cover transition-transform duration-500 group-hover:scale-110"
          style={{
            mixBlendMode: "multiply",
            maskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 70%)",
            WebkitMaskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 70%)",
            filter:
              monster.bond_percent >= 100
                ? `drop-shadow(0 2px 4px rgba(0,0,0,0.5)) contrast(1.15)`
                : fatigued
                  ? "grayscale(100%) opacity(50%)"
                  : "drop-shadow(0 2px 4px rgba(0,0,0,0.2)) contrast(1.05)",
          }}
          alt={monster.monster.name}
          onError={(e) => {
            e.currentTarget.src = "/monsters/placeholder.png";
          }}
        />

        {/* Paper texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.02) 50%)",
            backgroundSize: "100% 4px",
          }}
        ></div>
      </div>

      <div className="flex flex-col gap-1 relative z-10 bg-[#f4ecd8]/80 p-1.5 rounded border border-black/10 backdrop-blur-sm">
        <p
          className={`${compact ? "text-[10px]" : "text-xs"} truncate font-bold tracking-wider`}
          style={{ color: "#1a1a1a", textShadow: "none" }}
        >
          {monster.monster.name}
        </p>
        <div className="w-full bg-black/10 h-1.5 rounded-full overflow-hidden mt-0.5 border border-black/20 shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]">
          <div
            className="h-full transition-all duration-500 ease-out relative"
            style={{
              width: `${Math.min(100, monster.bond_percent)}%`,
              // eslint-disable-next-line no-restricted-syntax
              background: `#1a1a1a`,
              // eslint-disable-next-line no-restricted-syntax
              boxShadow: `none`,
            }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] -translate-x-full animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
        <div className="flex justify-between items-center mt-0.5">
          <p
            className="text-[8px] uppercase tracking-widest flex items-center gap-1"
            style={{ color: "#1a1a1a", opacity: 0.7 }}
          >
            {}
            BOND <span className="text-[6px] opacity-70">[SOUL CONTRACT]</span>
          </p>
          <p
            className="text-[9px] font-bold font-['VT323'] tracking-widest"
            style={{ color: "#1a1a1a" }}
          >
            {Math.round(monster.bond_percent)}%
          </p>
        </div>
      </div>

      {fatigued && (
        <div
          className="absolute bottom-1 left-1 text-[8px] px-1.5 py-0.5 rounded font-bold tracking-widest z-10 border border-red-800/50"
          style={{
            background: "rgba(255,0,0,0.1)",
            // eslint-disable-next-line no-restricted-syntax
            color: "#b91c1c",
          }}
        >
          FATIGUE
        </div>
      )}

      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="mt-2 text-[10px] px-2 py-1.5 rounded font-bold w-full uppercase tracking-widest border border-red-800/30 hover:bg-red-800/10 transition-colors"
          // eslint-disable-next-line no-restricted-syntax
          style={{ color: "#b91c1c" }}
        >
          DISMISS
        </button>
      )}
    </div>
  );
}
