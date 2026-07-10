import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { AppShell } from "@/components/game/AppShell";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { getMyProfile, listRealms, listAllMonsters, listMyMonsters } from "@/lib/game/supabase-api";
import { RARITY_COLOR, RARITY_ORDER, type Rarity } from "@/lib/game/gacha.constants";
import { MonsterDetailPanel } from "@/components/game/MonsterDetailPanel";

type CompendiumMonster = {
  id: string;
  monster_id: string;
  level: number;
  current_star?: number;
  star_level?: number;
  bond_percent: number;
  current_class?: string;
  title?: string;
  corruption_level?: number;
  monster: {
    name: string;
    rarity: string;
    role: string;
    element: string;
    art_url?: string;
    base_hp: number;
    base_atk: number;
    base_def: number;
  };
};

type RealmData = {
  id: number;
  icon: string;
  name: string;
};

const ElementSigil = ({
  color,
  glyph,
  accent,
}: {
  color: string;
  glyph: string;
  accent: string;
}) => (
  <svg width="100%" height="100%" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id={`sg-${color.replace("#", "")}`} cx="50%" cy="45%" r="45%">
        <stop offset="0%" stopColor={color} stopOpacity="0.15" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </radialGradient>
      <filter id={`gl-${color.replace("#", "")}`}>
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <circle cx="48" cy="48" r="38" fill={`url(#sg-${color.replace("#", "")})`} />
    <circle cx="48" cy="48" r="30" fill="none" stroke={color} strokeWidth="1" opacity="0.15" />
    <circle
      cx="48"
      cy="48"
      r="22"
      fill="none"
      stroke={color}
      strokeWidth="0.7"
      opacity="0.1"
      strokeDasharray="3 4"
    />
    <line x1="48" y1="14" x2="48" y2="82" stroke={color} strokeWidth="0.5" opacity="0.08" />
    <line x1="14" y1="48" x2="82" y2="48" stroke={color} strokeWidth="0.5" opacity="0.08" />
    <text
      x="48"
      y="56"
      textAnchor="middle"
      fill={color}
      fontSize="28"
      opacity="0.8"
      fontFamily="serif"
      filter={`url(#gl-${color.replace("#", "")})`}
    >
      {glyph}
    </text>
    <circle
      cx="48"
      cy="48"
      r="26"
      fill="none"
      stroke={accent}
      strokeWidth="1.5"
      opacity="0.2"
      strokeDasharray="2 6"
    />
    <circle cx="48" cy="20" r="2" fill={color} opacity="0.4" />
    <circle cx="48" cy="76" r="2" fill={color} opacity="0.4" />
    <circle cx="20" cy="48" r="2" fill={color} opacity="0.4" />
    <circle cx="76" cy="48" r="2" fill={color} opacity="0.4" />
  </svg>
);

const ELEMENT_SIGILS: Record<string, { color: string; glyph: string; accent: string }> = {
  fire: { color: "#ff5e2a", glyph: "🜂", accent: "#ffe066" },
  chaos: { color: "#e85d3a", glyph: "⛧", accent: "#ff9040" },
  water: { color: "#38b8f5", glyph: "🜄", accent: "#80d4ff" },
  digital: { color: "#38b8f5", glyph: "⎔", accent: "#60e0ff" },
  stellar: { color: "#6db8e8", glyph: "✦", accent: "#a0d8ff" },
  nature: { color: "#3ed97a", glyph: "🜃", accent: "#80ffb0" },
  primal: { color: "#d4843a", glyph: "◭", accent: "#e8a060" },
  light: { color: "#ffe066", glyph: "☉", accent: "#fff4b0" },
  divine: { color: "#e8b830", glyph: "✝", accent: "#ffe880" },
  arcane: { color: "#d4a030", glyph: "⊛", accent: "#f0d070" },
  dark: { color: "#9b6dff", glyph: "☽", accent: "#c4a0ff" },
  void: { color: "#9b6dff", glyph: "◎", accent: "#b080ff" },
  death: { color: "#c44f6f", glyph: "☠", accent: "#e87090" },
  dread: { color: "#6dc4c4", glyph: "⛥", accent: "#90e0e0" },
};

const getElementSprite = (el: string) => {
  const sig = ELEMENT_SIGILS[el?.toLowerCase()] ?? {
    color: "#c9a84c",
    glyph: "◆",
    accent: "#e0c870",
  };
  return <ElementSigil color={sig.color} glyph={sig.glyph} accent={sig.accent} />;
};

const getElementColor = (el: string) => {
  switch (el?.toLowerCase()) {
    case "fire":
    case "chaos":
      return "#e85d3a";
    case "water":
    case "digital":
      return "#38b8f5";
    case "nature":
    case "primal":
      return "#3ed97a";
    case "light":
    case "divine":
      return "#e8b830";
    case "dark":
    case "void":
      return "#9b6dff";
    case "death":
    case "dread":
      return "#c44f6f";
    case "arcane":
      return "#d4a030";
    case "stellar":
      return "#6db8e8";
    default:
      return "#c9a84c";
  }
};

export const Route = createFileRoute("/_authenticated/compendium")({
  component: CompendiumPage,
});

function CardFrame({ color, rarity, owned }: { color: string; rarity: string; owned: boolean }) {
  const isEpic = ["legendary", "mythic", "ex"].includes(rarity.toLowerCase());
  const B = 20; // bracket arm length in SVG units
  const opacity = owned ? 0.85 : 0.55;

  return (
    <svg
      viewBox="0 0 75 100"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 20 }}
    >
      {isEpic && (
        <defs>
          <filter id={`fg-${rarity}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}

      {/* Outer border */}
      <rect
        x="1.5"
        y="1.5"
        width="72"
        height="97"
        rx="0"
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity={opacity * 0.5}
      />

      {/* Inner inset line */}
      <rect
        x="4"
        y="4"
        width="67"
        height="92"
        rx="0"
        fill="none"
        stroke={color}
        strokeWidth="0.4"
        opacity={opacity * 0.3}
      />

      {/* Top-left bracket */}
      <path
        d={`M 1.5 ${B + 2} L 1.5 1.5 L ${B + 2} 1.5`}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="square"
        opacity={opacity}
        filter={isEpic ? `url(#fg-${rarity})` : undefined}
      />

      {/* Top-right bracket */}
      <path
        d={`M ${73 - B} 1.5 L 73.5 1.5 L 73.5 ${B + 2}`}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="square"
        opacity={opacity}
        filter={isEpic ? `url(#fg-${rarity})` : undefined}
      />

      {/* Bottom-left bracket */}
      <path
        d={`M 1.5 ${98 - B} L 1.5 98.5 L ${B + 2} 98.5`}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="square"
        opacity={opacity}
        filter={isEpic ? `url(#fg-${rarity})` : undefined}
      />

      {/* Bottom-right bracket */}
      <path
        d={`M ${73 - B} 98.5 L 73.5 98.5 L 73.5 ${98 - B}`}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="square"
        opacity={opacity}
        filter={isEpic ? `url(#fg-${rarity})` : undefined}
      />

      {/* Top-center diamond */}
      <polygon points="37.5,1 41,5.5 37.5,10 34,5.5" fill={color} opacity={opacity} />

      {/* Bracket endpoint dots */}
      {[
        [1.5, B + 2],
        [B + 2, 1.5],
        [73 - B, 1.5],
        [73.5, B + 2],
        [1.5, 98 - B],
        [B + 2, 98.5],
        [73 - B, 98.5],
        [73.5, 98 - B],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.5" fill={color} opacity={opacity * 0.7} />
      ))}
    </svg>
  );
}

function PillBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center min-h-[44px] px-3 text-[10px] font-bold transition-all border whitespace-nowrap ${
        active
          ? "bg-[rgba(200,154,62,0.12)] border-[#c89a3e]/50 text-[var(--ink-primary)] shadow-[0_0_10px_rgba(200,154,62,0.15)]"
          : "bg-transparent border-[#b5a28a]/30 text-[var(--ink-tertiary)] hover:text-[var(--ink-primary)] hover:border-[#b5a28a]/50"
      }`}
    >
      {children}
    </button>
  );
}

function ImageOrSprite({
  url,
  name,
  element,
  owned,
  color,
}: {
  url?: string | null;
  name: string;
  element: string;
  owned: boolean;
  color: string;
}) {
  const [error, setError] = useState(false);
  const elColor = getElementColor(element);

  if (!error && url) {
    return (
      <div className="w-full h-full relative flex items-center justify-center p-2">
        <img
          src={url}
          alt={owned ? name : element}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-contain"
          style={{
            filter: owned
              ? `drop-shadow(0 0 6px ${color}80) drop-shadow(0 2px 4px rgba(61,46,31,0.2))`
              : `grayscale(1) brightness(0.38) contrast(1.2)`,
          }}
          onError={() => setError(true)}
        />
        {!owned && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 90% 45% at 50% 105%, ${elColor}60 0%, ${elColor}18 50%, transparent 75%)`,
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className="w-full h-full flex items-center justify-center p-2"
      style={{
        filter: owned ? `drop-shadow(0 0 6px ${color}80)` : `grayscale(1) brightness(0.4)`,
      }}
    >
      {getElementSprite(element)}
    </div>
  );
}

function CompendiumPage() {
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const realmsQ = useQuery({ queryKey: ["realms"], queryFn: listRealms });
  const monstersQ = useQuery({ queryKey: ["monsters"], queryFn: listAllMonsters });
  const myMonstersQ = useQuery({ queryKey: ["my-monsters"], queryFn: listMyMonsters });
  const [realmFilter, setRealmFilter] = useState<number | null>(null);
  const [rarityFilter, setRarityFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const [selectedUM, setSelectedUM] = useState<CompendiumMonster | null>(null);
  const [selectedMonster, setSelectedMonster] = useState<any | null>(null);
  const [sortBy, setSortBy] = useState<"bestiary" | "rarity" | "element" | "name">("bestiary");

  const myMonstersMap = useMemo(() => {
    const map = new Map();
    for (const um of myMonstersQ.data?.userMonsters ?? []) {
      if (!map.has(um.monster_id)) map.set(um.monster_id, []);
      map.get(um.monster_id).push(um);
    }
    return map;
  }, [myMonstersQ.data]);

  const filtered = useMemo(() => {
    let list = monstersQ.data?.monsters ?? [];
    if (realmFilter !== null)
      list = list.filter((m: { realm_id: number }) => m.realm_id === realmFilter);
    if (rarityFilter) list = list.filter((m: { rarity: string }) => m.rarity === rarityFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m: { name: string }) => m.name.toLowerCase().includes(q));
    }
    if (sortBy === "rarity") {
      list = [...list].sort(
        (a: { rarity: string }, b: { rarity: string }) =>
          (RARITY_ORDER[b.rarity as Rarity] ?? 0) - (RARITY_ORDER[a.rarity as Rarity] ?? 0),
      );
    } else if (sortBy === "name") {
      list = [...list].sort((a: { name: string }, b: { name: string }) =>
        a.name.localeCompare(b.name),
      );
    } else if (sortBy === "element") {
      list = [...list].sort((a: { element: string }, b: { element: string }) =>
        a.element.localeCompare(b.element),
      );
    }
    return list;
  }, [monstersQ.data, realmFilter, rarityFilter, search, sortBy]);

  const realmStats = useMemo(() => {
    const stats: Record<number, { total: number; owned: number }> = {};
    for (const m of monstersQ.data?.monsters ?? []) {
      if (!stats[m.realm_id]) stats[m.realm_id] = { total: 0, owned: 0 };
      stats[m.realm_id].total++;
      if (myMonstersMap.has(m.id)) stats[m.realm_id].owned++;
    }
    return stats;
  }, [monstersQ.data, myMonstersMap]);

  if (profileQ.isLoading || monstersQ.isLoading) {
    return (
      <div
        className="min-h-screen grid place-items-center font-serif text-xl"
        style={{ color: "var(--ink-primary)", textShadow: "0 0 10px rgba(200,154,62,0.3)" }}
      >
        Loading the Codex…
      </div>
    );
  }

  return (
    <AppShell profile={profileQ.data?.profile as React.ComponentProps<typeof AppShell>["profile"]}>
      <div className="w-full flex flex-col relative z-10">
        <header className="mb-4 relative z-20">
          <div
            className="w-16 h-16 flex items-center justify-center mb-3"
            style={{
              border: "2px solid rgba(200,154,62,0.3)",
              borderRadius: 0,
              background: "rgba(200,154,62,0.06)",
              boxShadow: "3px 3px 0 rgba(0,0,0,0.4)",
            }}
          >
            <Icon name="sparkle" size={28} color="#c89a3e" />
          </div>
          <h1
            className="text-3xl font-bold uppercase mb-1"
            style={{
              fontFamily: "var(--ss-font-pixel)",
              color: "var(--gold-ink)",
              letterSpacing: "0.08em",
            }}
          >
            COMPENDIUM
          </h1>
          <p className="text-sm max-w-xl font-serif" style={{ color: "var(--ink-secondary)" }}>
            Explore the Codex of all known entities. Click any monster to view its lore, stats, and
            abilities.
          </p>
        </header>

        {/* Collection Progress Bar */}
        {(() => {
          const total = monstersQ.data?.monsters?.length ?? 0;
          const owned = myMonstersMap.size;
          const pct = total > 0 ? (owned / total) * 100 : 0;
          const rank =
            pct >= 100
              ? { label: "Arch-Collector", color: "#ff9d00" }
              : pct >= 75
                ? { label: "Sage", color: "#9b6dff" }
                : pct >= 50
                  ? { label: "Scholar", color: "#38b8f5" }
                  : pct >= 25
                    ? { label: "Explorer", color: "#3ed97a" }
                    : { label: "Wanderer", color: "#8b7355" };
          return (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="relative z-20 mb-5 p-4 border"
              style={{
                borderColor: "rgba(200,154,62,0.25)",
                borderRadius: 0,
                background: "linear-gradient(135deg, rgba(200,154,62,0.08), rgba(180,140,80,0.04))",
                boxShadow: "3px 3px 0 rgba(0,0,0,0.3)",
              }}
            >
              <div className="flex items-end justify-between mb-2">
                <div>
                  <span
                    className="text-3xl font-bold font-serif"
                    style={{ color: "var(--ink-primary)" }}
                  >
                    {owned}
                  </span>
                  <span
                    className="text-sm font-serif ml-1.5"
                    style={{ color: "var(--ink-secondary)" }}
                  >
                    / {total} discovered
                  </span>
                </div>
                <span
                  className="text-[9px] uppercase font-bold px-2.5 py-1 border"
                  style={{
                    fontFamily: "var(--ss-font-pixel)",
                    // rank color decorates the frame; text stays readable ink
                    color: "var(--ink-primary)",
                    borderColor: `${rank.color}70`,
                    background: `${rank.color}18`,
                    borderRadius: 0,
                    letterSpacing: "0.04em",
                  }}
                >
                  {rank.label}
                </span>
              </div>
              <div className="ss-bar-pixel" style={{ height: 10 }}>
                <motion.div
                  className="ss-bar-pixel-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, type: "spring", stiffness: 60, damping: 20 }}
                  style={{ background: `linear-gradient(90deg, #c89a3e, ${rank.color})` }}
                />
              </div>
            </motion.div>
          );
        })()}

        {/* Compact filter bar */}
        <div className="relative z-20 mb-6">
          <div className="flex flex-col gap-3">
            {/* Search row */}
            <div className="flex items-center gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search monsters…"
                className="flex-1 px-3 py-2 bg-white border border-[rgba(200,154,62,0.25)] text-[var(--ink-primary)] placeholder-[#8b7355]/50 focus:outline-none focus:border-[#c89a3e] transition-all text-sm"
                style={{
                  borderRadius: 0,
                  fontFamily: "var(--ss-font-pixel)",
                  boxShadow: "2px 2px 0 rgba(0,0,0,0.2)",
                }}
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-2 py-2 bg-white border border-[rgba(200,154,62,0.25)] text-[var(--ink-primary)] focus:outline-none focus:border-[#c89a3e] transition-all text-xs"
                style={{
                  borderRadius: 0,
                  fontFamily: "var(--ss-font-pixel)",
                  boxShadow: "2px 2px 0 rgba(0,0,0,0.2)",
                }}
              >
                <option value="bestiary">Bestiary #</option>
                <option value="rarity">Rarity ↓</option>
                <option value="element">Element</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>

            {/* Filter pills row */}
            <div className="flex flex-wrap gap-1.5">
              <PillBtn active={rarityFilter === ""} onClick={() => setRarityFilter("")}>
                All
              </PillBtn>
              <PillBtn active={rarityFilter === "common"} onClick={() => setRarityFilter("common")}>
                Common
              </PillBtn>
              <PillBtn active={rarityFilter === "rare"} onClick={() => setRarityFilter("rare")}>
                Rare
              </PillBtn>
              <PillBtn active={rarityFilter === "epic"} onClick={() => setRarityFilter("epic")}>
                Epic
              </PillBtn>
              <PillBtn
                active={rarityFilter === "legendary"}
                onClick={() => setRarityFilter("legendary")}
              >
                Legend
              </PillBtn>
              <PillBtn active={rarityFilter === "mythic"} onClick={() => setRarityFilter("mythic")}>
                Mythic
              </PillBtn>
              <span className="w-px bg-[#b5a28a]/30 mx-1 self-stretch" />
              <PillBtn active={realmFilter === null} onClick={() => setRealmFilter(null)}>
                All Realms
              </PillBtn>
              {(realmsQ.data?.realms ?? []).map((r: RealmData) => (
                <PillBtn
                  key={r.id}
                  active={realmFilter === r.id}
                  onClick={() => setRealmFilter(r.id)}
                >
                  {r.icon} {r.name}
                  <span className="opacity-50 text-[11px] ml-1">
                    {realmStats[r.id]?.owned || 0}/{realmStats[r.id]?.total || 0}
                  </span>
                </PillBtn>
              ))}
            </div>
          </div>
        </div>

        {/* Monster Grid */}
        <div className="relative z-20">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
            {filtered.map(
              (
                m: {
                  id: string;
                  art_url?: string | null;
                  name: string;
                  rarity: string;
                  element: string;
                },
                i: number,
              ) => {
                const ownsList = myMonstersMap.get(m.id) || [];
                const owned = ownsList.length > 0;
                const color = RARITY_COLOR[m.rarity as keyof typeof RARITY_COLOR] || "#c9a84c";
                const elColor = getElementColor(m.element);
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                    onClick={() => {
                      setSelectedMonster(m);
                      if (owned) {
                        const highest = [...ownsList].sort(
                          (a: any, b: any) => b.level - a.level,
                        )[0];
                        setSelectedUM(highest);
                      } else {
                        setSelectedUM(null);
                      }
                    }}
                    className="relative overflow-hidden group transition-all duration-150 cursor-pointer"
                    style={{
                      borderRadius: 0,
                      aspectRatio: "3/4",
                      background: owned
                        ? `linear-gradient(170deg, ${elColor}22, ${elColor}10, #131008)`
                        : `linear-gradient(170deg, #1c1610, #100d08)`,
                      boxShadow: owned
                        ? `0 4px 24px ${color}30, 0 0 12px ${color}15`
                        : `0 4px 16px rgba(0,0,0,0.6), 0 0 10px ${elColor}15`,
                    }}
                  >
                    {/* SVG card frame */}
                    <CardFrame color={owned ? color : elColor} rarity={m.rarity} owned={owned} />

                    {/* Monster art area */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-1.5">
                      <div className="flex-1 w-full flex items-center justify-center">
                        <ImageOrSprite
                          url={m.art_url}
                          name={m.name}
                          element={m.element}
                          owned={owned}
                          color={color}
                        />
                      </div>
                      <span
                        className="text-[11px] font-bold text-center w-full truncate px-1 pb-1 relative z-10 uppercase tracking-wider"
                        style={{ color: owned ? "#f0e8d8" : `${elColor}cc` }}
                      >
                        {owned ? m.name : m.element}
                      </span>
                    </div>

                    {/* Rarity badge */}
                    {owned && (
                      <div
                        className="absolute top-1 left-1 text-[9px] uppercase font-bold px-1 py-0.5 border z-10 leading-none"
                        style={{
                          fontFamily: "var(--ss-font-pixel)",
                          borderRadius: 0,
                          color,
                          borderColor: `${color}50`,
                          background: `rgba(0,0,0,0.5)`,
                        }}
                      >
                        {m.rarity}
                      </div>
                    )}
                    {ownsList.length > 1 && (
                      <div
                        className="absolute bottom-6 right-1 text-[9px] bg-black/60 border border-[#c89a3e]/30 text-[#f0e8d8] px-1 font-bold z-10"
                        style={{ fontFamily: "var(--ss-font-pixel)", borderRadius: 0 }}
                      >
                        x{ownsList.length}
                      </div>
                    )}

                    {/* Unowned overlay pattern */}
                    {!owned && (
                      <div
                        className="absolute inset-0"
                        style={{
                          borderRadius: 0,
                          background: `radial-gradient(circle at 50% 40%, transparent 20%, ${elColor}12 100%)`,
                        }}
                      />
                    )}
                  </motion.div>
                );
              },
            )}
            {filtered.length === 0 && (
              <div className="col-span-full py-10">
                <EmptyState
                  icon="search"
                  title="No monsters found"
                  body="Try adjusting your filters."
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monster Detail Panel */}
      {selectedMonster && (
        <MonsterDetailPanel
          monster={selectedMonster}
          userMonster={selectedUM}
          artElement={
            <ImageOrSprite
              url={selectedMonster.art_url}
              name={selectedMonster.name}
              element={selectedMonster.element}
              owned={!!selectedUM}
              color={RARITY_COLOR[selectedMonster.rarity as Rarity] || "#c9a84c"}
            />
          }
          onClose={() => {
            setSelectedMonster(null);
            setSelectedUM(null);
          }}
        />
      )}
    </AppShell>
  );
}
