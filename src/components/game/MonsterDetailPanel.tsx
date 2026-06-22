import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { Icon } from "@/components/ui/Icon";
import { RARITY_COLOR, RARITY_GLOW, type Rarity } from "@/lib/game/gacha.constants";

type Skill = {
  name: string;
  dmg: number;
  mp: number;
  desc: string;
};

type Monster = {
  id: string;
  bestiary_id: number;
  name: string;
  rarity: string;
  role: string;
  element: string;
  art_url?: string | null;
  base_hp: number;
  base_atk: number;
  base_def: number;
  base_spd: number;
  lore?: string | null;
  origin?: string | null;
  realm_skill?: string | null;
  skill_1?: string | null;
  skill_2?: string | null;
  skill_3?: string | null;
  realms?: { name: string; icon: string } | null;
};

type UserMonster = {
  id: string;
  level: number;
  bond_percent: number;
  current_star?: number;
  star_level?: number;
  current_class?: string;
  title?: string;
  corruption_level?: number;
};

const ELEMENT_COLORS: Record<string, string> = {
  arcane: "#d4a030",
  chaos: "#e85d3a",
  void: "#9b6dff",
  death: "#c44f6f",
  nature: "#3ed97a",
  divine: "#e8b830",
  dread: "#6dc4c4",
  digital: "#38b8f5",
  primal: "#d4843a",
  stellar: "#6db8e8",
};

const ROLE_ICONS: Record<string, string> = {
  attacker: "swords",
  tank: "shield",
  healer: "heart",
  support: "sparkle",
  debuffer: "target",
};

function getElementColor(el: string) {
  return ELEMENT_COLORS[el?.toLowerCase()] ?? "#c9a84c";
}

function parseSkill(json: string | null | undefined): Skill | null {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function StatBar({
  label,
  value,
  max,
  color,
  icon,
  delay,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  icon: string;
  delay: number;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 flex justify-center">
        <Icon name={icon as React.ComponentProps<typeof Icon>["name"]} size={14} color={color} />
      </div>
      <span className="w-8 text-[11px] uppercase tracking-wider font-bold" style={{ color: "var(--ink-tertiary)" }}>
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(180,150,100,0.12)" }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 20, delay }}
          style={{ background: color }}
        />
      </div>
      <span className="w-12 text-right t-mono text-xs font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function SkillCard({ skill, index, color, locked }: { skill: Skill; index: number; color: string; locked: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.3 + index * 0.08 }}
      className="p-3 rounded-xl border"
      style={{
        borderColor: locked ? "rgba(180,150,100,0.1)" : `${color}30`,
        background: locked ? "rgba(0,0,0,0.15)" : `linear-gradient(135deg, ${color}08, transparent)`,
      }}
    >
      {locked ? (
        <div className="flex items-center gap-2 opacity-40">
          <Icon name="lock" size={14} color="var(--ink-tertiary)" />
          <span className="text-xs font-serif italic" style={{ color: "var(--ink-tertiary)" }}>
            Bond to unlock
          </span>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold font-serif" style={{ color: "#f0e8d8" }}>
              {skill.name}
            </span>
            <div className="flex items-center gap-2">
              {skill.dmg > 0 && (
                <span className="text-[11px] t-mono font-bold px-1.5 py-0.5 rounded bg-[var(--danger)]/15 border border-[var(--danger)]/25" style={{ color: "var(--danger)" }}>
                  {skill.dmg} DMG
                </span>
              )}
              <span className="text-[11px] t-mono font-bold px-1.5 py-0.5 rounded bg-[var(--violet)]/15 border border-[var(--violet)]/25" style={{ color: "var(--violet)" }}>
                {skill.mp} MP
              </span>
            </div>
          </div>
          <p className="text-xs font-serif" style={{ color: "var(--ink-secondary)" }}>
            {skill.desc}
          </p>
        </>
      )}
    </motion.div>
  );
}

export function MonsterDetailPanel({
  monster,
  userMonster,
  artElement,
  onClose,
}: {
  monster: Monster;
  userMonster?: UserMonster | null;
  artElement: React.ReactNode;
  onClose: () => void;
}) {
  const owned = !!userMonster;
  const color = RARITY_COLOR[monster.rarity as Rarity] || "#c9a84c";
  const glow = RARITY_GLOW[monster.rarity as Rarity] || "none";
  const elColor = getElementColor(monster.element);
  const roleIcon = ROLE_ICONS[monster.role] ?? "sparkle";

  const level = userMonster?.level ?? 1;
  const hp = monster.base_hp + level * 10;
  const atk = monster.base_atk + level * 2;
  const def = monster.base_def + level * 1;
  const spd = monster.base_spd + level * 1;
  const maxStat = Math.max(hp, 1000);

  const skills = [
    parseSkill(monster.skill_1),
    parseSkill(monster.skill_2),
    parseSkill(monster.skill_3),
  ].filter(Boolean) as Skill[];

  const realmSkillParts = monster.realm_skill?.split(":") ?? [];
  const realmSkillName = realmSkillParts[0]?.trim();
  const realmSkillDesc = realmSkillParts.slice(1).join(":").trim();

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border relative"
        style={{
          borderColor: `${elColor}40`,
          background: "linear-gradient(180deg, rgba(22,18,14,0.98), rgba(16,13,10,0.99))",
          boxShadow: `0 20px 60px rgba(0,0,0,0.6), ${glow}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center z-50 transition-all border"
          style={{
            background: "rgba(0,0,0,0.5)",
            borderColor: "rgba(200,154,62,0.2)",
            color: "#a09080",
          }}
          onClick={onClose}
        >
          ×
        </button>

        {/* Hero Section */}
        <div
          className="relative p-6 pb-4 overflow-hidden"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, ${elColor}15, transparent 70%)`,
          }}
        >
          {/* Bestiary number */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.06 }}
            className="absolute top-2 left-4 text-[80px] font-serif font-bold leading-none select-none pointer-events-none"
            style={{ color: elColor }}
          >
            #{monster.bestiary_id}
          </motion.div>

          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Monster Art */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="w-44 h-44 md:w-52 md:h-52 rounded-2xl border-2 flex items-center justify-center relative overflow-hidden shrink-0"
              style={{
                borderColor: owned ? `${color}80` : `${elColor}30`,
                background: `linear-gradient(145deg, ${elColor}12, rgba(10,8,6,0.9))`,
                boxShadow: owned ? `inset 0 0 30px ${color}20, 0 8px 32px rgba(0,0,0,0.4)` : `inset 0 0 20px ${elColor}10`,
              }}
            >
              {artElement}
              {!owned && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Icon name="lock" size={32} color="rgba(180,150,100,0.3)" />
                </div>
              )}
            </motion.div>

            {/* Name & Meta */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                <span
                  className="text-[11px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border"
                  style={{ color, borderColor: `${color}50`, background: `${color}15` }}
                >
                  {monster.rarity}
                </span>
                <span
                  className="text-[11px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border flex items-center gap-1"
                  style={{ color: elColor, borderColor: `${elColor}40`, background: `${elColor}10` }}
                >
                  <Icon name={roleIcon as React.ComponentProps<typeof Icon>["name"]} size={11} color={elColor} />
                  {monster.role}
                </span>
                <span
                  className="text-[11px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border"
                  style={{ color: elColor, borderColor: `${elColor}30`, background: `${elColor}08` }}
                >
                  {monster.element}
                </span>
              </div>

              <h2
                className="text-2xl md:text-3xl font-serif font-bold tracking-tight mb-1"
                style={{ color: "#f0e8d8", textShadow: `0 0 20px ${elColor}30` }}
              >
                {monster.name}
              </h2>

              {monster.realms && (
                <p className="text-xs font-serif" style={{ color: "var(--ink-tertiary)" }}>
                  {monster.realms.icon} {monster.realms.name}
                </p>
              )}

              {owned && userMonster && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                  <span className="text-sm t-mono font-bold px-2 py-0.5 rounded border border-[var(--gold-bright)]/30 bg-[var(--gold-bright)]/10" style={{ color: "var(--gold-bright)" }}>
                    Lv. {userMonster.level}
                  </span>
                  <span className="text-sm t-mono font-bold" style={{ color: "var(--gold-bright)" }}>
                    {userMonster.current_star ?? userMonster.star_level ?? 1}★
                  </span>
                  <span className="text-xs font-serif" style={{ color: "var(--ink-tertiary)" }}>
                    Bond: {userMonster.bond_percent}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="px-6 pb-6 space-y-4">
          {/* Lore */}
          {monster.lore && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="p-4 rounded-xl border"
              style={{
                borderColor: "rgba(200,154,62,0.12)",
                background: "linear-gradient(135deg, rgba(200,154,62,0.04), transparent)",
              }}
            >
              <p className="text-sm font-serif italic leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
                "{monster.lore}"
              </p>
              {monster.origin && (
                <p className="text-[11px] mt-2 font-serif" style={{ color: "var(--ink-tertiary)" }}>
                  — {monster.origin}
                </p>
              )}
            </motion.div>
          )}

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.15 }}
            className="p-4 rounded-xl border"
            style={{ borderColor: "rgba(200,154,62,0.12)", background: "rgba(0,0,0,0.2)" }}
          >
            <p className="text-[11px] uppercase tracking-widest font-bold mb-3" style={{ color: "var(--gold-bright)" }}>
              Combat Stats {owned ? `(Lv. ${level})` : "(Base)"}
            </p>
            <div className="space-y-2">
              <StatBar label="HP" value={owned ? hp : monster.base_hp} max={maxStat} color="var(--success)" icon="heart" delay={0.2} />
              <StatBar label="ATK" value={owned ? atk : monster.base_atk} max={maxStat * 0.5} color="var(--danger)" icon="swords" delay={0.25} />
              <StatBar label="DEF" value={owned ? def : monster.base_def} max={maxStat * 0.3} color="var(--cyan)" icon="shield" delay={0.3} />
              <StatBar label="SPD" value={owned ? spd : monster.base_spd} max={maxStat * 0.2} color="var(--gold-bright)" icon="zap" delay={0.35} />
            </div>
          </motion.div>

          {/* Realm Skill */}
          {realmSkillName && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.2 }}
              className="p-4 rounded-xl border"
              style={{
                borderColor: `${elColor}20`,
                background: `linear-gradient(135deg, ${elColor}06, transparent)`,
              }}
            >
              <p className="text-[11px] uppercase tracking-widest font-bold mb-1" style={{ color: elColor }}>
                Realm Passive
              </p>
              <p className="text-sm font-bold font-serif" style={{ color: "#f0e8d8" }}>
                {realmSkillName}
              </p>
              {realmSkillDesc && (
                <p className="text-xs font-serif mt-0.5" style={{ color: "var(--ink-secondary)" }}>
                  {realmSkillDesc}
                </p>
              )}
            </motion.div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-widest font-bold mb-2 px-1" style={{ color: "var(--gold-bright)" }}>
                Abilities
              </p>
              <div className="space-y-2">
                {skills.map((skill, i) => (
                  <SkillCard key={i} skill={skill} index={i} color={elColor} locked={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
