import { RARITY_COLOR, RARITY_GLOW, type Rarity } from "@/lib/game/gacha.constants";
import { Icon } from "@/components/ui/Icon";
import type { UserMonster } from "@/lib/game/supabase-api";
import { useState } from "react";

const FireSprite = () => (
  <svg width="100%" height="100%" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="48" cy="62" rx="28" ry="20" fill="#2a1a0a"/>
    <rect x="28" y="74" width="10" height="12" rx="4" fill="#1e1206"/>
    <rect x="58" y="74" width="10" height="12" rx="4" fill="#1e1206"/>
    <ellipse cx="48" cy="42" rx="22" ry="18" fill="#2a1a0a"/>
    <polygon points="30,28 24,14 38,26" fill="#1e1206"/>
    <polygon points="66,28 72,14 58,26" fill="#1e1206"/>
    <polygon points="31,26 27,18 36,26" fill="#ff5e2a" opacity="0.6"/>
    <polygon points="65,26 69,18 60,26" fill="#ff5e2a" opacity="0.6"/>
    <ellipse cx="40" cy="40" rx="5" ry="5.5" fill="#ff5e2a"/>
    <ellipse cx="56" cy="40" rx="5" ry="5.5" fill="#ff5e2a"/>
    <ellipse cx="40" cy="40" rx="2.5" ry="3" fill="#ff1a00"/>
    <ellipse cx="56" cy="40" rx="2.5" ry="3" fill="#ff1a00"/>
    <ellipse cx="48" cy="56" rx="6" ry="8" fill="#ff5e2a" opacity="0.7"/>
    <ellipse cx="48" cy="50" rx="4" ry="6" fill="#ffe066" opacity="0.6"/>
    <ellipse cx="48" cy="49" rx="4" ry="2.5" fill="#0e0906"/>
    <path d="M76,62 Q90,48 84,38 Q80,30 72,36" stroke="#ff5e2a" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.8"/>
    <path d="M76,62 Q88,50 83,40" stroke="#ffe066" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"/>
  </svg>
);

const WaterSprite = () => (
  <svg width="100%" height="100%" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="48" cy="68" rx="24" ry="18" fill="#0a1e30"/>
    <path d="M32,72 Q24,82 28,88" stroke="#38b8f5" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7"/>
    <path d="M64,72 Q72,82 68,88" stroke="#38b8f5" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7"/>
    <path d="M48,78 Q48,88 50,92" stroke="#38b8f5" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5"/>
    <ellipse cx="48" cy="60" rx="16" ry="14" fill="#0e2840"/>
    <ellipse cx="30" cy="58" rx="10" ry="5" fill="#0a1e30" transform="rotate(-20,30,58)"/>
    <ellipse cx="66" cy="58" rx="10" ry="5" fill="#0a1e30" transform="rotate(20,66,58)"/>
    <rect x="43" y="44" width="10" height="10" rx="4" fill="#0a1e30"/>
    <ellipse cx="48" cy="36" rx="18" ry="16" fill="#0e2840"/>
    <ellipse cx="41" cy="34" rx="6" ry="6" fill="#001c30"/>
    <ellipse cx="55" cy="34" rx="6" ry="6" fill="#001c30"/>
    <ellipse cx="41" cy="34" rx="4" ry="4" fill="#38b8f5"/>
    <ellipse cx="55" cy="34" rx="4" ry="4" fill="#38b8f5"/>
    <ellipse cx="41" cy="33" rx="1.5" ry="2" fill="#fff" opacity="0.8"/>
    <ellipse cx="55" cy="33" rx="1.5" ry="2" fill="#fff" opacity="0.8"/>
    <polygon points="30,28 22,14 36,26" fill="#38b8f5" opacity="0.7"/>
    <polygon points="66,28 74,14 60,26" fill="#38b8f5" opacity="0.7"/>
    <circle cx="20" cy="50" r="4" fill="#38b8f5" opacity="0.6"/>
    <circle cx="76" cy="44" r="3" fill="#38b8f5" opacity="0.5"/>
    <circle cx="22" cy="38" r="2.5" fill="#38b8f5" opacity="0.4"/>
  </svg>
);

const NatureSprite = () => (
  <svg width="100%" height="100%" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
    <path d="M36,78 Q28,86 24,92" stroke="#3ed97a" strokeWidth="3" fill="none" opacity="0.5"/>
    <path d="M60,78 Q68,86 72,92" stroke="#3ed97a" strokeWidth="3" fill="none" opacity="0.5"/>
    <path d="M48,80 Q42,88 40,92" stroke="#3ed97a" strokeWidth="2.5" fill="none" opacity="0.4"/>
    <ellipse cx="48" cy="62" rx="20" ry="16" fill="#0a1e0c"/>
    <path d="M36,54 Q42,60 36,68" stroke="#3ed97a" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M60,54 Q54,60 60,68" stroke="#3ed97a" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <ellipse cx="28" cy="56" rx="12" ry="6" fill="#0f2812" transform="rotate(-25,28,56)"/>
    <ellipse cx="68" cy="56" rx="12" ry="6" fill="#0f2812" transform="rotate(25,68,56)"/>
    <ellipse cx="28" cy="54" rx="7" ry="3.5" fill="#3ed97a" opacity="0.5" transform="rotate(-25,28,54)"/>
    <ellipse cx="68" cy="54" rx="7" ry="3.5" fill="#3ed97a" opacity="0.5" transform="rotate(25,68,54)"/>
    <rect x="43" y="46" width="10" height="10" rx="4" fill="#0a1e0c"/>
    <ellipse cx="48" cy="36" rx="19" ry="17" fill="#0a1e0c"/>
    <path d="M36,24 Q32,10 40,12 Q44,20 40,24" fill="#3ed97a" opacity="0.8"/>
    <path d="M48,20 Q46,6 52,8 Q52,14 50,22" fill="#3ed97a" opacity="0.7"/>
    <path d="M60,24 Q64,10 56,12 Q52,20 56,24" fill="#3ed97a" opacity="0.8"/>
    <ellipse cx="41" cy="36" rx="6" ry="6" fill="#06100a"/>
    <ellipse cx="55" cy="36" rx="6" ry="6" fill="#06100a"/>
    <ellipse cx="41" cy="36" rx="4" ry="4" fill="#3ed97a"/>
    <ellipse cx="55" cy="36" rx="4" ry="4" fill="#3ed97a"/>
    <ellipse cx="41" cy="35" rx="2" ry="2" fill="#d0ffe0" opacity="0.9"/>
    <ellipse cx="55" cy="35" rx="2" ry="2" fill="#d0ffe0" opacity="0.9"/>
    <circle cx="48" cy="26" r="4" fill="#3ed97a" opacity="0.6"/>
    <circle cx="48" cy="26" r="2" fill="#ffe066" opacity="0.8"/>
  </svg>
);

const LightSprite = () => (
  <svg width="100%" height="100%" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
    <path d="M30,52 Q8,30 12,14 Q22,28 30,40" fill="#ffe066" opacity="0.35"/>
    <path d="M66,52 Q88,30 84,14 Q74,28 66,40" fill="#ffe066" opacity="0.35"/>
    <ellipse cx="48" cy="62" rx="18" ry="14" fill="#1a1404"/>
    <ellipse cx="48" cy="56" rx="10" ry="8" fill="#ffe066" opacity="0.3"/>
    <circle cx="48" cy="58" r="6" fill="#ffe066" opacity="0.5"/>
    <circle cx="48" cy="58" r="3" fill="#fff" opacity="0.8"/>
    <rect x="36" y="72" width="9" height="14" rx="4" fill="#141004"/>
    <rect x="51" y="72" width="9" height="14" rx="4" fill="#141004"/>
    <ellipse cx="48" cy="36" rx="19" ry="18" fill="#1a1404"/>
    <ellipse cx="48" cy="24" rx="16" ry="4" fill="none" stroke="#ffe066" strokeWidth="3" opacity="0.8"/>
    <polygon points="48,14 44,22 52,22" fill="#ffe066" opacity="0.9"/>
    <polygon points="40,16 36,24 44,23" fill="#ffe066" opacity="0.6"/>
    <polygon points="56,16 60,24 52,23" fill="#ffe066" opacity="0.6"/>
    <ellipse cx="41" cy="36" rx="6" ry="6" fill="#0a0800"/>
    <ellipse cx="55" cy="36" rx="6" ry="6" fill="#0a0800"/>
    <ellipse cx="41" cy="36" rx="4" ry="4" fill="#ffe066"/>
    <ellipse cx="55" cy="36" rx="4" ry="4" fill="#ffe066"/>
    <ellipse cx="41" cy="35" rx="2" ry="2" fill="#fff"/>
    <ellipse cx="55" cy="35" rx="2" ry="2" fill="#fff"/>
    <line x1="48" y1="10" x2="48" y2="4" stroke="#ffe066" strokeWidth="2" opacity="0.5"/>
    <line x1="60" y1="14" x2="64" y2="8" stroke="#ffe066" strokeWidth="2" opacity="0.4"/>
    <line x1="36" y1="14" x2="32" y2="8" stroke="#ffe066" strokeWidth="2" opacity="0.4"/>
  </svg>
);

const DarkSprite = () => (
  <svg width="100%" height="100%" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="48" cy="72" rx="22" ry="14" fill="#0e061a"/>
    <path d="M26,56 Q16,70 20,82" stroke="#c47fff" strokeWidth="2" fill="none" opacity="0.5"/>
    <path d="M70,56 Q80,70 76,82" stroke="#c47fff" strokeWidth="2" fill="none" opacity="0.5"/>
    <ellipse cx="48" cy="58" rx="18" ry="16" fill="#100820"/>
    <ellipse cx="30" cy="52" rx="11" ry="7" fill="#0c0618" transform="rotate(-15,30,52)"/>
    <ellipse cx="66" cy="52" rx="11" ry="7" fill="#0c0618" transform="rotate(15,66,52)"/>
    <ellipse cx="30" cy="50" rx="6" ry="4" fill="#c47fff" opacity="0.3" transform="rotate(-15,30,50)"/>
    <ellipse cx="66" cy="50" rx="6" ry="4" fill="#c47fff" opacity="0.3" transform="rotate(15,66,50)"/>
    <ellipse cx="48" cy="36" rx="18" ry="18" fill="#100820"/>
    <polygon points="38,20 34,8 44,18" fill="#c47fff" opacity="0.7"/>
    <polygon points="58,20 62,8 52,18" fill="#c47fff" opacity="0.7"/>
    <polygon points="48,18 48,6 52,16" fill="#c47fff" opacity="0.5"/>
    <ellipse cx="41" cy="36" rx="7" ry="5" fill="#050210"/>
    <ellipse cx="55" cy="36" rx="7" ry="5" fill="#050210"/>
    <ellipse cx="41" cy="36" rx="5" ry="3.5" fill="#c47fff"/>
    <ellipse cx="55" cy="36" rx="5" ry="3.5" fill="#c47fff"/>
    <ellipse cx="41" cy="35" rx="2" ry="2" fill="#fff" opacity="0.6"/>
    <ellipse cx="55" cy="35" rx="2" ry="2" fill="#fff" opacity="0.6"/>
    <text x="48" y="58" textAnchor="middle" fill="#c47fff" fontSize="10" opacity="0.5" fontFamily="serif">ᛜ</text>
    <circle cx="18" cy="40" r="5" fill="#c47fff" opacity="0.3"/>
    <circle cx="78" cy="36" r="4" fill="#c47fff" opacity="0.25"/>
  </svg>
);

const getElementSprite = (el: string) => {
  switch (el?.toLowerCase()) {
    case "fire": return <FireSprite />;
    case "water": return <WaterSprite />;
    case "nature": return <NatureSprite />;
    case "light": return <LightSprite />;
    case "dark": return <DarkSprite />;
    default: return <DarkSprite />; // Void/fallback
  }
};

const getRarityBackground = (r: Rarity) => {
  switch (r) {
    case "common": return "linear-gradient(155deg,#f5efe6,#ede5d8)";
    case "uncommon": return "linear-gradient(155deg,#eef5ec,#e4eddf)";
    case "rare": return "linear-gradient(155deg,#e8eef5,#dce6f0)";
    case "elite": return "linear-gradient(155deg,#f5f0e6,#ede4d2)";
    case "epic": return "linear-gradient(155deg,#efe8f5,#e6dcf0)";
    case "legendary": return "linear-gradient(155deg,#f5efe2,#ede5cc)";
    case "mythic": return "linear-gradient(155deg,#f5e8e2,#f0dcd4)";
    default: return "linear-gradient(155deg,#f5efe6,rgba(240,230,215,0.8))";
  }
};

const getRarityBorder = (r: Rarity, rColor: string) => {
  switch (r) {
    case "common": return { width: "1.5px", style: `1.5px solid ${rColor}40`, shadow: `0 4px 16px ${rColor}15` };
    case "uncommon": return { width: "1.5px", style: `1.5px solid ${rColor}55`, shadow: `0 4px 20px ${rColor}20` };
    case "rare": return { width: "2px", style: `2px solid ${rColor}70`, shadow: `0 4px 24px ${rColor}30, inset 0 0 20px ${rColor}08` };
    case "elite": return { width: "2px", style: `2px solid ${rColor}80`, shadow: `0 6px 28px ${rColor}35, inset 0 0 24px ${rColor}10` };
    case "epic": return { width: "2.5px", style: `2.5px solid ${rColor}90`, shadow: `0 6px 32px ${rColor}40, 0 0 16px ${rColor}25, inset 0 0 28px ${rColor}12` };
    case "legendary": return { width: "3px", style: `3px solid ${rColor}`, shadow: `0 8px 36px ${rColor}50, 0 0 24px ${rColor}35, inset 0 0 32px ${rColor}15` };
    case "mythic": return { width: "3px", style: `3px solid ${rColor}`, shadow: `0 8px 40px ${rColor}60, 0 0 32px ${rColor}40, inset 0 0 40px ${rColor}18` };
    default: return { width: "1.5px", style: `1.5px solid ${rColor}40`, shadow: `0 4px 16px ${rColor}15` };
  }
};

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
  const [imageError, setImageError] = useState(false);

  const getMood = (bond: number) => {
    if (bond >= 90) return "🖤";
    if (bond >= 50) return "😊";
    return "😐";
  };
  
  const getElementColor = (el: string) => {
    switch (el?.toLowerCase()) {
      case "fire": return "#ff5e2a";
      case "water": return "#38b8f5";
      case "nature": return "#3ed97a";
      case "light": return "#ffe066";
      case "dark": return "#c47fff";
      default: return "#c9a84c";
    }
  };
  
  const elColor = getElementColor(monster.monster.element);
  const rColor = RARITY_COLOR[r] || "#ffffff";
  const rarityBorder = getRarityBorder(r, rColor);

  return (
    <>
      <style>{`
        @keyframes mon-idle {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-7px) rotate(1deg); }
        }
        @keyframes shadow-pulse {
          0%, 100% { transform: scaleX(1); opacity: 0.5; }
          50% { transform: scaleX(0.7); opacity: 0.3; }
        }
        .mon-sprite-container > svg {
          animation: mon-idle 3.2s ease-in-out infinite;
          filter: drop-shadow(0 6px 12px rgba(61,46,31,0.2));
        }
        .mon-shadow {
          width: 60%; height: 8px;
          background: rgba(61,46,31,0.15);
          border-radius: 50%;
          margin: 0 auto;
          filter: blur(4px);
          animation: shadow-pulse 3.2s ease-in-out infinite;
        }
      `}</style>
      <div
        className={`relative w-full overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${compact ? "p-3" : "p-4"} group rounded-xl hover:scale-[1.03]`}
        style={{
          background: getRarityBackground(r),
          border: rarityBorder.style,
          boxShadow: rarityBorder.shadow,
          opacity: fatigued ? 0.6 : 1,
          cursor: onClick ? "pointer" : "default",
        }}
        onClick={onClick}
      >
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none z-20"
          style={{
            background: `linear-gradient(105deg, transparent 35%, ${elColor}08 45%, rgba(255,255,255,0.06) 50%, ${elColor}08 55%, transparent 65%)`,
          }}
        />
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none z-0"
          style={{
            boxShadow: `0 0 20px ${elColor}30, inset 0 0 20px ${elColor}08`,
          }}
        />

        <div className="absolute top-2 left-3 right-3 flex justify-between items-start z-10 pointer-events-none">
          <div className="flex flex-col gap-0.5">
            <span
              className="text-[11px] font-bold uppercase tracking-widest font-['Rajdhani'] flex items-center gap-1.5"
              style={{ color: rColor }}
            >
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: elColor, boxShadow: `0 0 6px ${elColor}80` }} />
              {r.toUpperCase()}
            </span>
          </div>

          <div className="flex flex-col items-end">
            <span title={`Mood: ${getMood(monster.bond_percent)}`} className="text-sm">
              {getMood(monster.bond_percent)}
            </span>
            <span className="font-['VT323'] text-[16px] leading-none text-[var(--ink-primary)] drop-shadow-md mt-1">
              Lv.{monster.level}
            </span>
            {ascensionLevel > 0 && (
              <span className="font-['VT323'] text-sm leading-none mt-0.5" style={{color: RARITY_COLOR["epic"]}}>
                +{ascensionLevel}
              </span>
            )}
          </div>
        </div>

        <div className="w-full aspect-square flex flex-col items-center justify-center relative mt-4 bg-transparent z-10">
          {!imageError && monster.monster.art_url ? (
            <img
              src={monster.monster.art_url}
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
              style={{
                filter: monster.bond_percent >= 100
                  ? `drop-shadow(0 0 10px ${rColor}) contrast(1.1)`
                  : fatigued
                    ? "grayscale(100%) opacity(50%)"
                    : "drop-shadow(0 8px 16px rgba(61,46,31,0.3))",
              }}
              alt={monster.monster.name}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center mon-sprite-container">
              {getElementSprite(monster.monster.element)}
            </div>
          )}
          {(!monster.monster.art_url || imageError) && <div className="mon-shadow mt-[-10px]"></div>}
        </div>

        <div className="flex flex-col gap-1 relative z-10 text-center mt-2">
          <p
            className={`${compact ? "text-xs" : "text-sm"} font-bold tracking-wider font-['Cinzel'] text-[var(--ink-primary)] truncate`}
            style={{ textShadow: "0 1px 2px rgba(200,154,62,0.15)" }}
          >
            {monster.monster.name}
          </p>
          
          <div className="w-full mt-2 relative h-1 rounded-sm overflow-hidden" style={{ background: "rgba(180,150,100,0.12)" }}>
            <div
              className="h-full transition-all duration-500 rounded-sm"
              style={{
                width: `${Math.min(100, monster.bond_percent)}%`,
                background: `linear-gradient(90deg, ${elColor}4d, ${elColor})`,
              }}
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-[11px] uppercase tracking-widest font-['Rajdhani'] font-bold text-[#8b7355]/60">
              Bond
            </span>
            <span className="text-[11px] uppercase tracking-widest font-['Rajdhani'] font-bold" style={{ color: elColor }}>
              {Math.round(monster.bond_percent)}%
            </span>
          </div>
        </div>

        {fatigued && (
          <div className="absolute bottom-2 left-2 text-[11px] px-2 py-0.5 rounded font-bold tracking-widest z-10 bg-red-100 text-red-600 border border-red-200">
            FATIGUE
          </div>
        )}

        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="mt-2 text-[11px] px-2 py-2 rounded-lg font-bold w-full uppercase tracking-widest border border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors text-red-500"
          >
            DISMISS
          </button>
        )}
      </div>
    </>
  );
}
