import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { AppShell } from "@/components/game/AppShell";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";
import { PromotionChamber } from "@/components/game/PromotionChamber";
import {
  getMyProfile,
  listRealms,
  listAllMonsters,
  listMyMonsters,
  awakeningsForRole,
  moodForBond,
  MOOD_META,
} from "@/lib/game/supabase-api";
import { RARITY_COLOR, RARITY_GLOW, type Rarity } from "@/lib/game/gacha.constants";
import { trans, ease, dur, reducedMotion, stagger } from "@/lib/ui/motion-tokens";

export const Route = createFileRoute("/_authenticated/compendium")({
  component: CompendiumPage,
});

function getRealmClass(realmName: string): string {
  switch (realmName) {
    case "Ancient Vaults": return "vaults";
    case "Chaos Wastes": return "chaos";
    case "The Outer Dark": return "dark";
    case "Blighted Expanse": return "blight";
    case "Wild Frontier": return "wild";
    case "Divine Threshold": return "divine";
    case "Haunted Veil": return "veil";
    case "Digital Nexus": return "digital";
    case "Elder Realm": return "elder";
    case "Void Frontier": return "void";
    case "Myth Eternal": return "myth";
    case "Iron Dominion": return "iron";
    default: return "";
  }
}

function CompendiumPage() {
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const realmsQ = useQuery({ queryKey: ["realms"], queryFn: listRealms });
  const monstersQ = useQuery({ queryKey: ["monsters"], queryFn: listAllMonsters });
  const myMonstersQ = useQuery({ queryKey: ["my-monsters"], queryFn: listMyMonsters });

  const [realmFilter, setRealmFilter] = useState<number | null>(null);
  const [rarityFilter, setRarityFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chamberFor, setChamberFor] = useState<{ id: string; name: string; artUrl?: string | null } | null>(null);

  const ownedIds = useMemo(
    () => new Set((myMonstersQ.data?.userMonsters ?? []).map((um: any) => um.monster_id)),
    [myMonstersQ.data],
  );

  const filtered = useMemo(() => {
    let list = monstersQ.data?.monsters ?? [];
    if (realmFilter !== null) list = list.filter((m: any) => m.realm_id === realmFilter);
    if (rarityFilter) list = list.filter((m: any) => m.rarity === rarityFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m: any) => m.name.toLowerCase().includes(q));
    }
    return list;
  }, [monstersQ.data, realmFilter, rarityFilter, search]);

  const realmStats = useMemo(() => {
    const stats: Record<number, { total: number; owned: number }> = {};
    for (const m of monstersQ.data?.monsters ?? []) {
      if (!stats[m.realm_id]) stats[m.realm_id] = { total: 0, owned: 0 };
      stats[m.realm_id].total++;
      if (ownedIds.has(m.id)) stats[m.realm_id].owned++;
    }
    return stats;
  }, [monstersQ.data, ownedIds]);

  if (profileQ.isLoading)
    return (
      <div
        className="min-h-screen grid place-items-center"
        style={{ color: "var(--ink-secondary)" }}
      >
        Loading…
      </div>
    );
  if (!profileQ.data) return null;

  const sel = selectedId
    ? (monstersQ.data?.monsters ?? []).find((m: any) => m.id === selectedId)
    : null;
  const selOwned = selectedId ? ownedIds.has(selectedId) : false;
  const selUm = selectedId
    ? (myMonstersQ.data?.userMonsters ?? []).find((um: any) => um.monster_id === selectedId)
    : null;

  return (
    <AppShell profile={profileQ.data.profile}>
      <div className="bg-atmos bg-atmos-compendium p-6 md:p-10 max-w-6xl mx-auto min-h-screen">
        <h1 className="t-h1 text-3xl font-bold mb-1" style={{ color: "var(--gold-bright)" }}>
          Compendium
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--ink-secondary)" }}>
          {ownedIds.size} / {monstersQ.data?.monsters?.length ?? 0} discovered
        </p>

        {/* Realm tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <PillBtn active={realmFilter === null} onClick={() => setRealmFilter(null)}>
            All
          </PillBtn>
          {(realmsQ.data?.realms ?? []).map((r: any) => (
            <PillBtn key={r.id} active={realmFilter === r.id} onClick={() => setRealmFilter(r.id)}>
              {r.icon} {r.name}{" "}
              {realmStats[r.id] ? `${realmStats[r.id].owned}/${realmStats[r.id].total}` : ""}
            </PillBtn>
          ))}
        </div>

        {/* Selected Realm tagline + lore */}
        {realmFilter !== null && (() => {
          const selectedRealm = (realmsQ.data?.realms ?? []).find((r: any) => r.id === realmFilter);
          if (!selectedRealm) return null;
          const realmClass = getRealmClass(selectedRealm.name);
          return (
            <div 
              className="ss-card mb-6 p-4 border-l-4" 
              style={{ 
                borderColor: `var(--realm-${realmClass}-accent)`,
                background: `linear-gradient(180deg, var(--realm-${realmClass}-base) 0%, var(--bg-pane) 100%)`,
              }}
            >
              <h2 className="text-sm font-bold mb-1 flex items-center gap-1.5" style={{ color: `var(--realm-${realmClass}-accent)` }}>
                <span>{selectedRealm.icon}</span>
                <span>{selectedRealm.name}</span>
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: "var(--ink-primary)" }}>
                {selectedRealm.description}
              </p>
            </div>
          );
        })()}

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="ss-input flex-1 min-w-[180px]"
          />
          <select
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value)}
            className="ss-input w-auto"
          >
            <option value="">All Rarities</option>
            {["common", "uncommon", "rare", "elite", "epic", "legendary", "mythic", "ex"].map(
              (r) => (
                <option key={r} value={r}>
                  {r[0].toUpperCase() + r.slice(1)}
                </option>
              ),
            )}
          </select>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((m: any) => {
            const owned = ownedIds.has(m.id);
            const r = m.rarity as Rarity;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className="ss-card rounded-lg p-3 text-center transition-all hover:scale-[1.03]"
                style={{
                  opacity: owned ? 1 : 0.5,
                  borderColor: m.realms?.name ? `var(--realm-${getRealmClass(m.realms.name)}-accent)` : undefined,
                  boxShadow: owned && r !== "common" ? RARITY_GLOW[r] : undefined,
                }}
              >
                <div
                  className="w-full aspect-square rounded mb-2 flex items-center justify-center text-3xl overflow-hidden ss-pane"
                  style={{
                    border: owned
                      ? `2px solid ${RARITY_COLOR[r]}`
                      : "2px dashed rgba(255,255,255,0.1)",
                    boxShadow:
                      owned && r !== "common" ? `0 0 10px ${RARITY_COLOR[r]}40 inset` : undefined,
                  }}
                >
                  {owned ? (
                    <img
                      src={
                        m.art_url
                          ? m.art_url
                          : `/sprites/monsters/${m.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
                      }
                      className="w-full h-full object-cover"
                      alt={m.name}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.src = "/monsters/placeholder.png";
                      }}
                    />
                  ) : (
                    "?"
                  )}
                </div>
                <p
                  className="text-xs font-bold truncate"
                  style={{ color: owned ? "var(--ink-primary)" : "var(--ink-tertiary)" }}
                >
                  {owned ? m.name : "???"}
                </p>
                <span
                  className="ss-chip mt-1"
                  style={{ background: `${RARITY_COLOR[r]}20`, color: RARITY_COLOR[r] }}
                >
                  {r}
                </span>
              </button>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <EmptyState
            icon="tome"
            title="The bestiary is silent on this query."
            body="Loosen your filters, or summon a kind of monster you haven't met."
          />
        )}
      </div>

      {/* Detail modal */}
      <ResponsiveDialog
        open={!!sel}
        onOpenChange={(open) => !open && setSelectedId(null)}
        title={sel?.name || ""}
      >
        {sel && (
          <DetailModalContent
            sel={sel}
            selOwned={selOwned}
            selUm={selUm}
            onPromote={(id, name, artUrl) => setChamberFor({ id, name, artUrl })}
          />
        )}
      </ResponsiveDialog>

      {chamberFor && (
        <PromotionChamber
          userMonsterId={chamberFor.id}
          monsterName={chamberFor.name}
          artUrl={chamberFor.artUrl}
          onClose={() => setChamberFor(null)}
        />
      )}
    </AppShell>
  );
}

// ─── Detail Modal Content ──────────────────────────────────────────────────

function DetailModalContent({
  sel,
  selOwned,
  selUm,
  onPromote,
}: {
  sel: any;
  selOwned: boolean;
  selUm: any;
  onPromote: (userMonsterId: string, name: string, artUrl?: string | null) => void;
}) {
  const roleToStat: Record<string, string> = {
    attacker: "str",
    tank: "con",
    healer: "con",
    support: "int",
    debuffer: "per",
  };
  const stat = roleToStat[sel.role] ?? "str";

  const skills = [sel.skill_1, sel.skill_2, sel.skill_3].filter(Boolean);
  const skillDelays = stagger(skills.length, 0.06, 0.15);
  const dormant = selUm ? awakeningsForRole(sel.role) : [];
  const dormantDelays = stagger(dormant.length, 0.06, 0.25);

  return (
    <div className="relative">
      <div className="flex justify-between items-start mb-4">
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...trans.itemIn, delay: 0.1 }}
            className="flex gap-2 mt-1 items-center flex-wrap"
          >
            <RarityBadge rarity={sel.rarity as Rarity} />
            <span className="ss-stat-chip" data-stat={stat}>
              {sel.role}
            </span>
            <span className="text-xs" style={{ color: "var(--ink-secondary)" }}>
              {sel.element}
            </span>
          </motion.div>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...trans.itemIn, delay: 0.06 }}
        className="grid grid-cols-4 gap-2 mb-4 text-center"
      >
        {(
          [
            ["HP", sel.base_hp],
            ["ATK", sel.base_atk],
            ["DEF", sel.base_def],
            ["SPD", sel.base_spd],
          ] as const
        ).map(([l, v]) => (
          <div key={l} className="ss-pane rounded-md p-2">
            <div
              className="text-[10px] uppercase tracking-[0.18em]"
              style={{ color: "var(--ink-tertiary)" }}
            >
              {l}
            </div>
            <div className="t-mono-lg font-bold mt-0.5" style={{ color: "var(--gold-bright)" }}>
              <NumberFlow value={v} />
            </div>
          </div>
        ))}
      </motion.div>

      <div className="space-y-1 mb-4">
        <div
          className="text-[10px] uppercase tracking-[0.18em] font-semibold"
          style={{ color: "var(--ink-secondary)" }}
        >
          Skills
        </div>
        {skills.map((s: any, i: number) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: dur.fast, ease: ease.out, delay: skillDelays[i] }}
            className="text-sm"
            style={{ color: selOwned ? "var(--ink-primary)" : "var(--ink-tertiary)" }}
          >
            <span style={{ color: selOwned ? "var(--success)" : "var(--ink-tertiary)" }}>●</span>{" "}
            {selOwned ? s : "???"}
          </motion.div>
        ))}
        {sel.realm_skill && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: dur.fast,
              ease: ease.out,
              delay: skillDelays[skills.length] ?? 0.2,
            }}
            className="text-sm flex items-center gap-1"
            style={{ color: "var(--violet)" }}
          >
            <Icon name="star" size={12} color="var(--violet)" className="fill-current" />
            <span>{selOwned ? sel.realm_skill : "???"}</span>
          </motion.div>
        )}
      </div>

      {selUm && (
        <div>
          <div
            className="flex justify-between items-center text-[10px] uppercase tracking-[0.18em] mb-1"
            style={{ color: "var(--ink-secondary)" }}
          >
            <span>Bond</span>
            <span className="flex items-center gap-2">
              {(() => {
                const m = MOOD_META[moodForBond(selUm.bond_percent)];
                return (
                  <span style={{ color: m.color }} title={m.effect}>
                    {m.icon} {m.label}
                  </span>
                );
              })()}
              <NumberFlow
                value={Math.round(selUm.bond_percent)}
                suffix="%"
                className="font-mono"
                style={{ color: "var(--gold-bright)" }}
              />
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${selUm.bond_percent}%` }}
              transition={{ duration: dur.weighty, ease: ease.weighty, delay: 0.18 }}
              className="h-full"
              style={{ background: "linear-gradient(90deg, var(--gold-glow), var(--gold-bright))" }}
            />
          </div>
          <div className="flex justify-between mt-1">
            {[25, 50, 100].map((m) => (
              <span
                key={m}
                className="text-[9px]"
                style={{
                  color: selUm.bond_percent >= m ? "var(--gold-bright)" : "var(--ink-tertiary)",
                }}
              >
                {m}%
              </span>
            ))}
          </div>
          <div
            className="mt-3 flex flex-wrap gap-2 text-xs"
            style={{ color: "var(--ink-secondary)" }}
          >
            <span>
              Lvl <NumberFlow value={selUm.level} />
            </span>
            <span className="flex items-center gap-0.5">
              <Icon name="star" size={10} color="var(--gold-bright)" className="fill-current" />{" "}
              <NumberFlow value={selUm.star_level} />
              /7
            </span>
            {selUm.is_on_team && <span style={{ color: "var(--success)" }}>On Team</span>}
          </div>
          <div className="mt-2 text-[11px]" style={{ color: "var(--ink-tertiary)" }}>
            Grew from{" "}
            <NumberFlow
              value={selUm.growth_xp ?? 0}
              className="font-mono"
              style={{ color: "var(--gold-bright)" }}
            />{" "}
            matching deeds.
          </div>

          {/* Dormant Powers */}
          <div className="mt-4">
            <p
              className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-2"
              style={{ color: "var(--ink-secondary)" }}
            >
              Dormant Powers
            </p>
            <div className="space-y-1">
              {dormant.map((def, i) => {
                const unlocked = (selUm.awakened_skills as string[] | undefined)?.includes(
                  def.name,
                );
                return (
                  <motion.div
                    key={def.name}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: dur.fast, ease: ease.out, delay: dormantDelays[i] }}
                    className="rounded-md p-2 text-[11px]"
                    style={{
                      background: unlocked ? "rgba(255,213,79,0.08)" : "rgba(0,0,0,0.3)",
                      border: `1px solid ${unlocked ? "rgba(255,213,79,0.45)" : "rgba(255,255,255,0.06)"}`,
                      boxShadow: unlocked ? "0 0 12px rgba(255,213,79,0.08) inset" : "none",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        style={{
                          color: unlocked ? "var(--gold-bright)" : "var(--ink-tertiary)",
                          fontWeight: 600,
                        }}
                      >
                        <span className="inline-flex items-center gap-1">
                          <Icon
                            name={unlocked ? "stamina" : "close"}
                            size={12}
                            color={unlocked ? "var(--gold-bright)" : "var(--ink-tertiary)"}
                          />{" "}
                          {def.name}
                        </span>
                      </span>
                    </div>
                    <p
                      className="mt-0.5 italic"
                      style={{ color: unlocked ? "var(--ink-primary)" : "var(--ink-tertiary)" }}
                    >
                      {unlocked ? def.flavor : `Awakens when: ${def.triggerText}`}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
          {selUm.star_level < 7 && (
            <motion.button
              onClick={() => onPromote(selUm.id, sel.name, sel.art_url)}
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -1 }}
              transition={trans.springy}
              className="ss-btn ss-btn-d-primary mt-4 w-full"
            >
              Promote at the Chamber
            </motion.button>
          )}
        </div>
      )}
      {!selOwned && (
        <p className="text-sm mt-4" style={{ color: "var(--ink-tertiary)" }}>
          Not yet discovered. Summon from the Altar!
        </p>
      )}
    </div>
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
      className={`ss-btn whitespace-nowrap ${active ? "ss-btn-d-primary" : "ss-btn-secondary"}`}
    >
      {children}
    </button>
  );
}

function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <span
      className="ss-chip"
      style={{
        background: `${RARITY_COLOR[rarity]}20`,
        color: RARITY_COLOR[rarity],
        borderColor: `${RARITY_COLOR[rarity]}40`,
      }}
    >
      {rarity}
    </span>
  );
}
