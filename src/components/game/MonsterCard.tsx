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
  
  // Element colors for Manhwa UI
  const getElementColor = (el: string) => {
    if (!el) return 'var(--cyan)';
    switch (el.toLowerCase()) {
      case 'fire': return '#ff5252';
      case 'water': return '#448aff';
      case 'nature': return '#69f0ae';
      case 'light': return '#ffff00';
      case 'dark': return '#aa00ff';
      default: return 'var(--cyan)';
    }
  };
  
  const elColor = getElementColor(monster.monster.element);

  return (
    <div
      className={`relative w-full overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${compact ? 'p-1.5' : 'p-3'} group aura-${r.toLowerCase()}`}
      style={{
        background: `linear-gradient(145deg, rgba(10, 15, 30, 0.9), rgba(5, 10, 20, 0.95))`,
        border: `1px solid ${RARITY_COLOR[r]}80`,
        boxShadow: r !== "common" ? `0 0 10px ${RARITY_COLOR[r]}30, inset 0 0 20px ${RARITY_COLOR[r]}10` : undefined,
        opacity: fatigued ? 0.6 : 1,
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: '8px'
      }}
      onClick={onClick}
    >
      {/* Hover glow effect with shine */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none z-20" 
           style={{ 
             boxShadow: `inset 0 0 40px ${RARITY_COLOR[r]}50`,
             background: `linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.1) 25%, transparent 30%)`
           }}></div>

      {/* Rarity Stars & Element Header */}
      <div className="absolute top-1.5 left-2 right-2 flex justify-between items-start z-10 pointer-events-none">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: elColor, textShadow: `0 0 4px ${elColor}` }}>
            {monster.monster.element || 'VOID'}
          </span>
          <div className="flex mt-0.5">
            {Array.from({ length: r === 'EX' ? 6 : r === 'Mythic' ? 5 : r === 'Legendary' ? 4 : r === 'Epic' ? 3 : r === 'Rare' ? 2 : 1 }).map((_, i) => (
              <Icon key={i} name="star" size={compact ? 8 : 10} color={RARITY_COLOR[r]} className="fill-current" style={{ filter: `drop-shadow(0 0 2px ${RARITY_COLOR[r]})` }} />
            ))}
          </div>
        </div>
        
        <div className="flex flex-col items-end">
           <span className="font-['VT323'] text-[16px] leading-none" style={{ color: "var(--ink-primary)", textShadow: "0 0 4px var(--cyan)" }}>
             Lv.{monster.level}
           </span>
           {ascensionLevel > 0 && (
             <span className="font-['VT323'] text-sm leading-none mt-0.5 text-fuchsia-400" style={{ textShadow: "0 0 4px #d500f9" }}>
               +{ascensionLevel}
             </span>
           )}
        </div>
      </div>

      <div className="w-full aspect-square rounded mb-2 flex items-center justify-center overflow-hidden relative mt-5 bg-black/40 border border-white/5">
        <img
          src={
            monster.monster.art_url
              ? monster.monster.art_url
              : `/sprites/monsters/${monster.monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
          }
          className="w-full h-full object-cover mix-blend-screen transition-transform duration-500 group-hover:scale-105"
          style={{
            filter: monster.bond_percent >= 100 ? `drop-shadow(0 0 8px ${RARITY_COLOR[r]}) contrast(1.15)` : 
                    fatigued ? "grayscale(100%) opacity(50%)" : "drop-shadow(0 0 4px rgba(255,255,255,0.1)) contrast(1.05)",
          }}
          alt={monster.monster.name}
          onError={(e) => {
            e.currentTarget.src = "/monsters/placeholder.png";
          }}
        />
        
        {/* Holographic Scanline overlay on image */}
        <div className="absolute inset-0 pointer-events-none" style={{ 
          background: 'linear-gradient(rgba(0,229,255,0) 50%, rgba(0,229,255,0.05) 50%)', 
          backgroundSize: '100% 4px' 
        }}></div>
      </div>
      
      <div className="flex flex-col gap-1 relative z-10 bg-[#050a14]/80 p-1.5 rounded border border-white/5 backdrop-blur-sm">
        <p className={`${compact ? 'text-[10px]' : 'text-xs'} truncate font-bold tracking-wider`} style={{ color: "var(--ink-primary)", textShadow: "0 0 3px var(--cyan)" }}>
          {monster.monster.name}
        </p>
        <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden mt-0.5 border border-white/10 shadow-[inset_0_0_4px_rgba(0,0,0,0.8)]">
          <div className="h-full transition-all duration-500 ease-out relative" style={{ 
            width: `${Math.min(100, monster.bond_percent)}%`,
            background: `linear-gradient(90deg, rgba(0, 191, 255, 0.5), #00e5ff)`,
            boxShadow: `0 0 8px #00e5ff, inset 0 0 4px rgba(255,255,255,0.8)`
          }}>
             <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] -translate-x-full animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
        <div className="flex justify-between items-center mt-0.5">
          <p className="text-[8px] uppercase tracking-widest" style={{ color: "var(--ink-secondary)" }}>
            BOND
          </p>
          <p className="text-[9px] font-bold font-['VT323'] tracking-widest" style={{ color: "var(--cyan)" }}>
            {Math.round(monster.bond_percent)}%
          </p>
        </div>
      </div>

      {fatigued && (
        <div
          className="absolute bottom-1 left-1 text-[8px] px-1.5 py-0.5 rounded font-bold tracking-widest z-10 border border-red-500/50"
          style={{ background: "rgba(255,0,0,0.2)", color: "#ff1744", textShadow: "0 0 4px #ff1744" }}
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
          className="mt-2 text-[10px] px-2 py-1.5 rounded font-bold w-full uppercase tracking-widest border border-red-500/30 hover:bg-red-500/20 transition-colors"
          style={{ color: "#ff1744", textShadow: "0 0 4px #ff1744" }}
        >
          DISMISS
        </button>
      )}
    </div>
  );
}
