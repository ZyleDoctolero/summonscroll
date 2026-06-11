import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/game/AppShell";
import { PromotionChamber } from "@/components/game/PromotionChamber";
import { getMyProfile, listRealms, listAllMonsters, listMyMonsters, awakeningsForRole, moodForBond, MOOD_META } from "@/lib/game/supabase-api";
import { RARITY_COLOR, RARITY_GLOW, type Rarity } from "@/lib/game/gacha.constants";

export const Route = createFileRoute("/_authenticated/compendium")({
  component: CompendiumPage,
});

function CompendiumPage() {
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const realmsQ = useQuery({ queryKey: ["realms"], queryFn: listRealms });
  const monstersQ = useQuery({ queryKey: ["monsters"], queryFn: listAllMonsters });
  const myMonstersQ = useQuery({ queryKey: ["my-monsters"], queryFn: listMyMonsters });

  const [realmFilter, setRealmFilter] = useState<number | null>(null);
  const [rarityFilter, setRarityFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chamberFor, setChamberFor] = useState<{ id: string; name: string } | null>(null);

  const ownedIds = useMemo(
    () => new Set((myMonstersQ.data?.userMonsters ?? []).map((um: { monster_id: string }) => um.monster_id)),
    [myMonstersQ.data],
  );

  const filtered = useMemo(() => {
    let list = monstersQ.data?.monsters ?? [];
    if (realmFilter !== null) list = list.filter((m: { realm_id: number }) => m.realm_id === realmFilter);
    if (rarityFilter) list = list.filter((m: { rarity: string }) => m.rarity === rarityFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m: { name: string }) => m.name.toLowerCase().includes(q));
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

  if (profileQ.isLoading) return <div className="min-h-screen grid place-items-center" style={{ background: "#0C0E14", color: "#A09D96" }}>Loading…</div>;
  if (!profileQ.data) return null;

  const sel = selectedId ? (monstersQ.data?.monsters ?? []).find((m: { id: string }) => m.id === selectedId) : null;
  const selOwned = selectedId ? ownedIds.has(selectedId) : false;
  const selUm = selectedId ? (myMonstersQ.data?.userMonsters ?? []).find((um: { monster_id: string }) => um.monster_id === selectedId) : null;

  return (
    <AppShell profile={profileQ.data.profile}>
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-1" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>Compendium</h1>
        <p className="text-sm mb-6" style={{ color: "#A09D96" }}>{ownedIds.size} / {monstersQ.data?.monsters?.length ?? 0} discovered</p>

        {/* Realm tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <PillBtn active={realmFilter === null} onClick={() => setRealmFilter(null)}>All</PillBtn>
          {(realmsQ.data?.realms ?? []).map((r: { id: number; name: string; icon: string }) => (
            <PillBtn key={r.id} active={realmFilter === r.id} onClick={() => setRealmFilter(r.id)}>
              {r.icon} {r.name} {realmStats[r.id] ? `${realmStats[r.id].owned}/${realmStats[r.id].total}` : ""}
            </PillBtn>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
            className="px-3 py-2 rounded-md text-sm flex-1 min-w-[180px]"
            style={{ background: "#1A1E2A", color: "#F0EDE6", border: "1px solid rgba(255,255,255,0.08)" }} />
          <select value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)}
            className="px-3 py-2 rounded-md text-sm" style={{ background: "#1A1E2A", color: "#F0EDE6", border: "1px solid rgba(255,255,255,0.08)" }}>
            <option value="">All Rarities</option>
            {["common","uncommon","rare","elite","epic","legendary","mythic","ex"].map((r) => (
              <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((m: { id: string; name: string; rarity: string; element: string; role: string; art_url: string | null }) => {
            const owned = ownedIds.has(m.id);
            const r = m.rarity as Rarity;
            return (
              <button key={m.id} onClick={() => setSelectedId(m.id)}
                className="rounded-lg p-3 text-center transition-all hover:scale-[1.03]"
                style={{
                  background: "#13161F", opacity: owned ? 1 : 0.5,
                  border: `1px solid ${owned ? RARITY_COLOR[r] : "rgba(255,255,255,0.05)"}`,
                  boxShadow: owned && r !== "common" ? RARITY_GLOW[r] : undefined,
                }}>
                <div className="w-full aspect-square rounded mb-2 flex items-center justify-center text-3xl overflow-hidden" 
                     style={{ 
                       background: "#1A1E2A",
                       border: owned ? `2px solid ${RARITY_COLOR[r]}` : "2px dashed rgba(255,255,255,0.1)",
                       boxShadow: owned && r !== "common" ? `0 0 10px ${RARITY_COLOR[r]}40 inset` : undefined
                     }}>
                  {owned ? (
                    <img src={m.art_url ? m.art_url : `/sprites/monsters/${m.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.png`} 
                         className="w-full h-full object-cover" 
                         alt={m.name} 
                         onError={(e) => { e.currentTarget.src = "/monsters/placeholder.png" }} />
                  ) : "?"}
                </div>
                <p className="text-xs font-bold truncate" style={{ color: owned ? "#F0EDE6" : "#6B6864", fontFamily: "'Cinzel',serif" }}>
                  {owned ? m.name : "???"}
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                  style={{ background: `${RARITY_COLOR[r]}20`, color: RARITY_COLOR[r] }}>{r}</span>
              </button>
            );
          })}
        </div>
        {filtered.length === 0 && <div className="text-center py-16" style={{ color: "#6B6864" }}><p className="text-4xl mb-2">📖</p><p>No monsters match your filters.</p></div>}
      </div>

      {/* Detail modal */}
      {sel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }} onClick={() => setSelectedId(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-xl p-6 border" style={{ background: "#1A1E2A", borderColor: RARITY_COLOR[sel.rarity as Rarity] }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold" style={{ color: RARITY_COLOR[sel.rarity as Rarity], fontFamily: "'Cinzel',serif" }}>{sel.name}</h2>
                <div className="flex gap-2 mt-1">
                  <RarityBadge rarity={sel.rarity as Rarity} />
                  <span className="text-xs" style={{ color: "#A09D96" }}>{sel.element} · {sel.role}</span>
                </div>
              </div>
              <button onClick={() => setSelectedId(null)} style={{ color: "#6B6864" }}>✕</button>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4 text-center">
              {([["HP", sel.base_hp], ["ATK", sel.base_atk], ["DEF", sel.base_def], ["SPD", sel.base_spd]] as const).map(([l, v]) => (
                <div key={l} className="rounded-md p-2" style={{ background: "rgba(0,0,0,0.3)" }}>
                  <div className="text-[10px] uppercase" style={{ color: "#6B6864" }}>{l}</div>
                  <div className="font-bold text-sm" style={{ color: "#FFD54F", fontFamily: "'JetBrains Mono',monospace" }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="space-y-1 mb-4">
              <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#A09D96" }}>Skills</div>
              {[sel.skill_1, sel.skill_2, sel.skill_3].filter(Boolean).map((s: string, i: number) => (
                <div key={i} className="text-sm" style={{ color: selOwned ? "#F0EDE6" : "#6B6864" }}>
                  <span style={{ color: selOwned ? "#5FAD41" : "#6B6864" }}>●</span> {selOwned ? s : "???"}
                </div>
              ))}
              {sel.realm_skill && (
                <div className="text-sm" style={{ color: "#CE93D8" }}>★ {selOwned ? sel.realm_skill : "???"}</div>
              )}
            </div>
            {selUm && (
              <div>
                <div className="flex justify-between items-center text-[10px] uppercase mb-1" style={{ color: "#A09D96" }}>
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
                    <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>{Math.round(selUm.bond_percent)}%</span>
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full" style={{ width: `${selUm.bond_percent}%`, background: "linear-gradient(90deg,#C89A3E,#FFD54F)" }} />
                </div>
                <div className="flex justify-between mt-1">
                  {[25, 50, 100].map((m) => (
                    <span key={m} className="text-[9px]" style={{ color: selUm.bond_percent >= m ? "#FFD54F" : "#6B6864" }}>{m}%</span>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs" style={{ color: "#A09D96" }}>
                  <span>Lvl {selUm.level}</span>
                  <span>★ {selUm.star_level}/7</span>
                  {selUm.is_on_team && <span style={{ color: "#5FAD41" }}>On Team</span>}
                </div>
                <div className="mt-2 text-[11px]" style={{ color: "#6B6864" }}>
                  Grew from <span style={{ color: "#FFD54F", fontFamily: "'JetBrains Mono',monospace" }}>{selUm.growth_xp ?? 0}</span> matching deeds.
                </div>

                {/* Dormant Powers */}
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "#A09D96" }}>
                    Dormant Powers
                  </p>
                  <div className="space-y-1">
                    {awakeningsForRole(sel.role).map((def) => {
                      const unlocked = (selUm.awakened_skills as string[] | undefined)?.includes(def.name);
                      return (
                        <div
                          key={def.name}
                          className="rounded p-2 text-[11px]"
                          style={{
                            background: unlocked ? "rgba(255,213,79,0.08)" : "rgba(0,0,0,0.3)",
                            border: `1px solid ${unlocked ? "#FFD54F" : "rgba(255,255,255,0.06)"}`,
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span style={{ color: unlocked ? "#FFD54F" : "#6B6864", fontWeight: 600 }}>
                              {unlocked ? "⚡" : "🔒"} {def.name}
                            </span>
                          </div>
                          <p className="mt-0.5 italic" style={{ color: unlocked ? "#F0EDE6" : "#6B6864" }}>
                            {unlocked ? def.flavor : `Awakens when: ${def.triggerText}`}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {selUm.star_level < 7 && (
                  <button
                    onClick={() => setChamberFor({ id: selUm.id, name: sel.name })}
                    className="mt-4 w-full py-2 rounded-md text-xs uppercase tracking-widest font-bold"
                    style={{ background: "linear-gradient(135deg,#C89A3E,#FFD54F)", color: "#0C0E14" }}
                  >
                    Promote at the Chamber
                  </button>
                )}
              </div>
            )}
            {!selOwned && <p className="text-sm mt-4" style={{ color: "#6B6864" }}>Not yet discovered. Summon from the Altar!</p>}
          </div>
        </div>
      )}

      {chamberFor && (
        <PromotionChamber
          userMonsterId={chamberFor.id}
          monsterName={chamberFor.name}
          onClose={() => setChamberFor(null)}
        />
      )}
    </AppShell>
  );
}

function PillBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap"
      style={{
        background: active ? "linear-gradient(135deg,#C89A3E,#FFD54F)" : "rgba(255,255,255,0.05)",
        color: active ? "#0C0E14" : "#A09D96",
      }}>{children}</button>
  );
}

function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
      style={{ background: `${RARITY_COLOR[rarity]}20`, color: RARITY_COLOR[rarity], border: `1px solid ${RARITY_COLOR[rarity]}40` }}>{rarity}</span>
  );
}
