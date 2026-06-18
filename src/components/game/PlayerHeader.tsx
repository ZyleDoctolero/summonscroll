import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { xpToNextLevel } from "@/lib/game/constants";
import { Icon } from "@/components/ui/Icon";
import { Link } from "@tanstack/react-router";

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
  combo_count?: number;
  last_task_time?: string | null;
};

const CLASS_ICONS: Record<string, React.ReactNode> = {
  warrior: <Icon name="sword" size={16} />,
  mage: <Icon name="sparkle" size={16} />,
  healer: <Icon name="heart" size={16} />,
  rogue: <Icon name="target" size={16} />,
  none: <Icon name="user" size={16} />,
};

export function PlayerHeader({ profile }: { profile: Profile }) {
  const xpReq = xpToNextLevel(profile.level);
  const xpPct = Math.min(100, (profile.xp / xpReq) * 100);
  const hpPct = Math.min(100, (profile.hp / profile.max_hp) * 100);
  const mpPct = Math.min(100, ((profile.mp ?? 30) / (profile.max_mp ?? 30)) * 100);
  const hpColor =
    profile.hp <= 10 ? "var(--danger)" : profile.hp <= 25 ? "var(--gold-glow)" : "var(--success)";
  const classIcon = CLASS_ICONS[profile.class ?? "none"] ?? <Icon name="user" size={16} />;
  const comboCount = profile.combo_count ?? 0;
  const lastTaskTime = profile.last_task_time ? new Date(profile.last_task_time).getTime() : 0;
  const isComboActive = comboCount > 1 && Date.now() - lastTaskTime < 60 * 60 * 1000;

  return (
    <>
      {/* MOBILE HEADER */}
      <header
        className="md:hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 py-3 border-b backdrop-blur-md"
        style={{
          background: "var(--bg-panel)",
          borderColor: "var(--ss-hairline)",
        }}
      >
        <Link to="/profile" className="flex items-center gap-3 active:scale-95 transition-transform">
          <div
            className="w-8 h-8 rounded-full grid place-items-center font-bold text-xs shadow-[0_0_10px_rgba(212,175,63,0.3)] relative"
            style={{
              background: "linear-gradient(135deg, var(--gold-glow), var(--gold-bright))",
              color: "var(--bg-deep)",
            }}
          >
            {classIcon}
            {isComboActive && (
              <div className="absolute -bottom-2 -right-4 bg-[var(--danger)] text-white text-[8px] font-bold px-1 rounded shadow-lg border border-[var(--bg-deep)] animate-pulse">
                {comboCount}x
              </div>
            )}
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
        </Link>
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

      {/* DESKTOP HEADER */}
      <header
        className="hidden md:flex items-center justify-between fixed top-0 inset-x-0 z-40 h-14 px-6 border-b backdrop-blur-md"
        style={{
          background: "var(--bg-stage)",
          borderColor: "var(--ss-hairline)",
        }}
      >
        <div className="flex items-center gap-4">
          {/* Level + Class + Link to Profile */}
          <Link
            to="/profile"
            className="flex items-center gap-1.5 relative group hover:scale-105 transition-all"
          >
            <span
              className="text-sm group-hover:drop-shadow-[0_0_8px_var(--gold-bright)] transition-all flex items-center justify-center text-[var(--gold-bright)]"
              title={profile.class ?? "none"}
            >
              {classIcon}
            </span>
            <span
              className="text-[10px] uppercase tracking-wider group-hover:text-white transition-colors"
              style={{ color: "var(--ink-tertiary)" }}
            >
              LVL
            </span>
            <span
              className="t-mono font-bold group-hover:drop-shadow-[0_0_8px_var(--gold-bright)] transition-all"
              style={{ color: "var(--gold-bright)" }}
            >
              {profile.level}
            </span>
            {isComboActive && (
              <div className="absolute -bottom-6 -left-1 bg-[var(--danger)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg border border-[var(--bg-deep)] animate-pulse whitespace-nowrap">
                {comboCount}x COMBO
              </div>
            )}
          </Link>

          {/* HP bar */}
          <MiniBar
            label="HP"
            current={profile.hp}
            max={profile.max_hp}
            pct={hpPct}
            color={hpColor}
            glow={profile.hp <= 10}
          />

          {/* XP bar */}
          <MiniBar
            label="XP"
            current={profile.xp}
            max={xpReq}
            pct={xpPct}
            color="var(--gold-bright)"
            gradient
          />

          {/* MP bar */}
          <MiniBar
            label="MP"
            current={profile.mp ?? 30}
            max={profile.max_mp ?? 30}
            pct={mpPct}
            color="var(--violet)"
          />

          {/* divider: vitals | resources */}
          <div
            className="w-px h-6 self-center shrink-0"
            style={{ background: "var(--ss-hairline)" }}
          />

          {/* Stamina */}
          {profile.stamina_max !== undefined && (
            <Currency
              icon="stamina"
              label={<Icon name="stamina" size={14} color="var(--gold-glow)" />}
              value={profile.stamina ?? 0}
              color="var(--ember)"
            />
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Currencies */}
          <Currency
            icon="gold"
            label={<Icon name="gold" size={14} color="var(--gold-bright)" />}
            value={profile.gold}
            color="var(--gold-bright)"
          />
          <Currency
            icon="crystal"
            label={<Icon name="crystal" size={14} color="var(--cyan)" />}
            value={profile.crystals}
            color="var(--cyan)"
          />
          <Currency
            icon="seal"
            label={<Icon name="seal" size={14} color="var(--violet)" />}
            value={profile.pact_seals}
            color="var(--violet)"
          />

          {/* divider: resources | streak */}
          <div
            className="w-px h-6 self-center shrink-0"
            style={{ background: "var(--ss-hairline)" }}
          />

          {/* Streak */}
          <div className="flex gap-2">
            <div
              className="ss-chip ss-chip-muted"
              style={{
                borderColor: profile.streak > 0 ? "rgba(255,138,101,0.3)" : "var(--ss-hairline)",
                animation: profile.streak > 0 ? "pulse 2s ease-in-out infinite" : undefined,
              }}
            >
              <Icon
                name={profile.streak > 0 ? "streak" : "cold"}
                size={14}
                color={profile.streak > 0 ? "var(--ember)" : "var(--ink-tertiary)"}
              />
              <span
                className="t-mono font-bold"
                style={{
                  color: profile.streak > 0 ? "var(--ember)" : "var(--ink-tertiary)",
                }}
              >
                {profile.streak}
              </span>
            </div>
            {(profile.streak_freeze_charges ?? 0) > 0 && (
              <div
                className="ss-chip ss-chip-muted"
                style={{ borderColor: "rgba(79,195,247,0.3)" }}
                title="Freeze Charms (Protects streak)"
              >
                <Icon name="cold" size={14} color="var(--cyan)" />
                <span className="t-mono font-bold" style={{ color: "var(--cyan)" }}>
                  x{profile.streak_freeze_charges}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

function MiniBar({
  label,
  current,
  max,
  pct,
  color,
  glow,
  gradient,
}: {
  label: string;
  current: number;
  max: number;
  pct: number;
  color: string;
  glow?: boolean;
  gradient?: boolean;
}) {
  return (
    <div className="flex-1 max-w-[140px]">
      <div
        className="flex justify-between text-[10px] uppercase tracking-wider mb-0.5"
        style={{ color: "var(--ink-tertiary)" }}
      >
        <span>{label}</span>
        <span style={{ color }} className="t-mono">
          <NumberFlow value={current} />/{max}
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden relative"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <motion.div
          className="h-full rounded-full relative overflow-hidden"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          style={{
            background: gradient
              ? "linear-gradient(90deg, var(--gold-glow), var(--gold-bright))"
              : color,
            boxShadow: glow ? `0 0 12px ${color}` : undefined,
          }}
        >
          {/* shimmer sweep */}
          <span
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(100deg, transparent 20%, rgba(255,255,255,0.35) 50%, transparent 80%)",
              animation: "hud-shimmer 3s ease-in-out infinite",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

function Currency({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: React.ReactNode;
  value: number;
  color: string;
}) {
  return (
    <div className="ss-chip ss-chip-muted">
      <span className="flex items-center">{label}</span>
      <span className="t-mono font-bold" style={{ color: "var(--ink-primary)" }}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}
