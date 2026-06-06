import { xpToNextLevel } from "@/lib/game/constants";

type Profile = {
  display_name: string;
  level: number;
  xp: number;
  hp: number;
  max_hp: number;
  gold: number;
  gems: number;
  pact_seals: number;
  streak: number;
};

export function PlayerHeader({ profile }: { profile: Profile }) {
  const xpReq = xpToNextLevel(profile.level);
  const xpPct = Math.min(100, (profile.xp / xpReq) * 100);
  const hpPct = Math.min(100, (profile.hp / profile.max_hp) * 100);
  const hpColor =
    profile.hp <= 10 ? "#E05252" : profile.hp <= 25 ? "#FFB74D" : "#5FAD41";
  return (
    <header
      className="hidden md:flex items-center gap-4 fixed top-0 right-0 z-40 h-14 px-6 border-b backdrop-blur-md"
      style={{
        left: 260,
        background: "rgba(15,18,26,0.85)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      <Stat label="LVL" value={profile.level} mono />
      <div className="flex-1 max-w-[180px]">
        <div className="flex justify-between text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "#A09D96" }}>
          <span>HP</span>
          <span style={{ color: hpColor, fontFamily: "'JetBrains Mono',monospace" }}>
            {profile.hp}/{profile.max_hp}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-full transition-all"
            style={{
              width: `${hpPct}%`,
              background: hpColor,
              boxShadow: profile.hp <= 10 ? `0 0 12px ${hpColor}` : undefined,
            }}
          />
        </div>
      </div>
      <div className="flex-1 max-w-[180px]">
        <div className="flex justify-between text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "#A09D96" }}>
          <span>XP</span>
          <span style={{ color: "#FFD54F", fontFamily: "'JetBrains Mono',monospace" }}>
            {profile.xp}/{xpReq}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full" style={{ width: `${xpPct}%`, background: "linear-gradient(90deg,#C89A3E,#FFD54F)" }} />
        </div>
      </div>
      <Currency icon="diamond" value={profile.gems} color="#7FD4FF" />
      <Currency icon="paid" value={profile.gold} color="#FFD54F" />
      <Currency icon="key" value={profile.pact_seals} color="#CE93D8" />
      <Currency
        icon={profile.streak > 0 ? "local_fire_department" : "ac_unit"}
        value={profile.streak}
        color={profile.streak > 0 ? "#FF8A65" : "#6B6864"}
      />
    </header>
  );
}

function Stat({ label, value, mono }: { label: string; value: number | string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider" style={{ color: "#A09D96" }}>
        {label}
      </span>
      <span
        className="text-sm font-bold"
        style={{ color: "#FFD54F", fontFamily: mono ? "'JetBrains Mono',monospace" : undefined }}
      >
        {value}
      </span>
    </div>
  );
}

function Currency({ icon, value, color }: { icon: string; value: number; color: string }) {
  return (
    <div
      className="flex items-center gap-1 px-2 py-1 rounded border"
      style={{ background: "rgba(0,0,0,0.3)", borderColor: "rgba(255,255,255,0.06)" }}
    >
      <span className="material-symbols-outlined text-[16px]" style={{ color }}>
        {icon}
      </span>
      <span className="text-sm font-bold" style={{ color: "#F0EDE6", fontFamily: "'JetBrains Mono',monospace" }}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}
