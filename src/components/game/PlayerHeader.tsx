import { xpToNextLevel } from "@/lib/game/constants";

type Profile = {
  display_name: string;
  level: number;
  xp: number;
  hp: number;
  max_hp: number;
  mp?: number;
  max_mp?: number;
  gold: number;
  crystals: number;
  pact_seals: number;
  streak: number;
  streak_freeze_charges?: number;
  class?: string;
  str_stat?: number;
  int_stat?: number;
  con_stat?: number;
  per_stat?: number;
  stamina?: number;
  stamina_max?: number;
  stamina_last_tick?: string;
};

const CLASS_ICONS: Record<string, string> = {
  warrior: "⚔",
  mage: "🔮",
  healer: "💚",
  rogue: "🗡",
  none: "👤",
};

export function PlayerHeader({ profile }: { profile: Profile }) {
  const xpReq = xpToNextLevel(profile.level);
  const xpPct = Math.min(100, (profile.xp / xpReq) * 100);
  const hpPct = Math.min(100, (profile.hp / profile.max_hp) * 100);
  const mpPct = Math.min(100, ((profile.mp ?? 30) / (profile.max_mp ?? 30)) * 100);
  const hpColor =
    profile.hp <= 10 ? "#E05252" : profile.hp <= 25 ? "#FFB74D" : "#5FAD41";
  const classIcon = CLASS_ICONS[profile.class ?? "none"] ?? "👤";
  const comboCount = profile.combo_count ?? 0;
  const lastTaskTime = profile.last_task_time ? new Date(profile.last_task_time).getTime() : 0;
  const isComboActive = comboCount > 1 && (Date.now() - lastTaskTime) < 60 * 60 * 1000;

  return (
    <header
      className="hidden md:flex items-center gap-4 fixed top-0 right-0 z-40 h-14 px-6 border-b backdrop-blur-md"
      style={{
        left: 260,
        background: "rgba(15,18,26,0.85)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      {/* Level + Class */}
      <div className="flex items-center gap-1.5 relative">
        <span className="text-sm" title={profile.class ?? "none"}>{classIcon}</span>
        <span className="text-[10px] uppercase tracking-wider" style={{ color: "#A09D96" }}>LVL</span>
        <span className="text-sm font-bold" style={{ color: "#FFD54F", fontFamily: "'JetBrains Mono',monospace" }}>
          {profile.level}
        </span>
        {isComboActive && (
          <div className="absolute -bottom-6 -left-1 bg-[#E05252] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg border border-[#0C0E14] animate-pulse whitespace-nowrap">
            {comboCount}x COMBO
          </div>
        )}
      </div>

      {/* HP bar */}
      <MiniBar label="HP" current={profile.hp} max={profile.max_hp} pct={hpPct} color={hpColor}
        glow={profile.hp <= 10} />

      {/* XP bar */}
      <MiniBar label="XP" current={profile.xp} max={xpReq} pct={xpPct} color="#FFD54F" gradient />

      {/* MP bar */}
      <MiniBar label="MP" current={profile.mp ?? 30} max={profile.max_mp ?? 30} pct={mpPct} color="#7F77DD" />

      {/* Stamina */}
      {profile.stamina_max !== undefined && (
        <Currency icon="bolt" label="⚡" value={profile.stamina ?? 0} color="#FFB74D" />
      )}

      {/* Currencies */}
      <Currency icon="paid" label="💰" value={profile.gold} color="#FFD54F" />
      <Currency icon="diamond" label="💎" value={profile.crystals} color="#7FD4FF" />
      <Currency icon="key" label="🔑" value={profile.pact_seals} color="#CE93D8" />

      {/* Streak */}
      <div className="flex gap-2">
        <div
          className="flex items-center gap-1 px-2 py-1 rounded border"
          style={{
            background: "rgba(0,0,0,0.3)",
            borderColor: profile.streak > 0 ? "rgba(255,138,101,0.3)" : "rgba(255,255,255,0.06)",
            animation: profile.streak > 0 ? "pulse 2s ease-in-out infinite" : undefined,
          }}
        >
          <span className="text-sm">{profile.streak > 0 ? "🔥" : "❄"}</span>
          <span className="text-sm font-bold" style={{
            color: profile.streak > 0 ? "#FF8A65" : "#6B6864",
            fontFamily: "'JetBrains Mono',monospace",
          }}>
            {profile.streak}
          </span>
        </div>
        {(profile.streak_freeze_charges ?? 0) > 0 && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded border"
            style={{ background: "rgba(0,0,0,0.3)", borderColor: "rgba(79,195,247,0.3)" }}
            title="Freeze Charms (Protects streak)"
          >
            <span className="text-sm">🧊</span>
            <span className="text-sm font-bold" style={{ color: "#4FC3F7", fontFamily: "'JetBrains Mono',monospace" }}>
              ×{profile.streak_freeze_charges}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

function MiniBar({ label, current, max, pct, color, glow, gradient }: {
  label: string; current: number; max: number; pct: number; color: string; glow?: boolean; gradient?: boolean;
}) {
  return (
    <div className="flex-1 max-w-[140px]">
      <div className="flex justify-between text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "#A09D96" }}>
        <span>{label}</span>
        <span style={{ color, fontFamily: "'JetBrains Mono',monospace" }}>
          {current}/{max}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: gradient ? "linear-gradient(90deg,#C89A3E,#FFD54F)" : color,
            boxShadow: glow ? `0 0 12px ${color}` : undefined,
          }}
        />
      </div>
    </div>
  );
}

function Currency({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div
      className="flex items-center gap-1 px-2 py-1 rounded border"
      style={{ background: "rgba(0,0,0,0.3)", borderColor: "rgba(255,255,255,0.06)" }}
    >
      <span className="text-xs">{label}</span>
      <span className="text-sm font-bold" style={{ color: "#F0EDE6", fontFamily: "'JetBrains Mono',monospace" }}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}
