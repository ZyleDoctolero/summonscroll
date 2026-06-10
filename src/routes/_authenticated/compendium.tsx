import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/game/AppShell";
import { getMyProfile } from "@/lib/game/profile.functions";
import { listRealms, listAllMonsters, listMyMonsters } from "@/lib/game/compendium.functions";
import { RARITY_COLOR, RARITY_GLOW, type Rarity } from "@/lib/game/gacha.constants";

export const Route = createFileRoute("/_authenticated/compendium")({
  head: () => ({ meta: [{ title: "Compendium — SummonScroll" }] }),
  component: CompendiumPage,
});

function CompendiumPage() {
  const fetchProfile = useServerFn(getMyProfile);
  const fetchRealms = useServerFn(listRealms);
  const fetchMonsters = useServerFn(listAllMonsters);
  const fetchMyMonsters = useServerFn(listMyMonsters);

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const realmsQ = useQuery({ queryKey: ["realms"], queryFn: () => fetchRealms() });
  const monstersQ = useQuery({ queryKey: ["monsters"], queryFn: () => fetchMonsters() });
  const myMonstersQ = useQuery({ queryKey: ["my-monsters"], queryFn: () => fetchMyMonsters() });

  const [realmFilter, setRealmFilter] = useState<number | null>(null);
  const [rarityFilter, setRarityFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  if (profileQ.isLoading) return <div className="min-h-screen grid place-items-center" style={{ background: "#0C0E14", color: "#A09D96" }}>Loading…</div>;
  if (!profileQ.data) return null;

  const sel = selectedId ? (monstersQ.data?.monsters ?? []).find((m: any) => m.id === selectedId) : null;
  const selOwned = selectedId ? ownedIds.has(selectedId) : false;
  const selUm = selectedId ? (myMonstersQ.data?.userMonsters ?? []).find((um: any) => um.monster_id === selectedId) : null;

  return (
    <AppShell profile={profileQ.data.profile}>
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-1" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>Compendium</h1>
        <p className="text-sm mb-6" style={{ color: "#A09D96" }}>{ownedIds.size} / {monstersQ.data?.monsters?.length ?? 0} discovered</p>

        {/* Realm tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <PillBtn active={realmFilter === null} onClick={() => setRealmFilter(null)}>All</PillBtn>
          {(realmsQ.data?.realms ?? []).map((r: any) => (
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
          {filtered.map((m: any) => {
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
                <div className="w-full aspect-square rounded mb-2 flex items-center justify-center text-3xl" style={{ background: "#1A1E2A" }}>
                  {owned ? "👾" : "❓"}
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
                <div className="flex justify-between text-[10px] uppercase mb-1" style={{ color: "#A09D96" }}>
                  <span>Bond</span><span style={{ fontFamily: "'JetBrains Mono',monospace" }}>{Math.round(selUm.bond_percent)}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full" style={{ width: `${selUm.bond_percent}%`, background: "linear-gradient(90deg,#C89A3E,#FFD54F)" }} />
                </div>
                <div className="flex justify-between mt-1">
                  {[25, 50, 100].map((m) => (
                    <span key={m} className="text-[9px]" style={{ color: selUm.bond_percent >= m ? "#FFD54F" : "#6B6864" }}>{m}%</span>
                  ))}
                </div>
                <div className="mt-3 flex gap-2 text-xs" style={{ color: "#A09D96" }}>
                  <span>Lvl {selUm.level}</span>
                  <span>★ {selUm.awakening_stars}/5</span>
                  {selUm.is_on_team && <span style={{ color: "#5FAD41" }}>On Team</span>}
                </div>
              </div>
            )}
            {!selOwned && <p className="text-sm mt-4" style={{ color: "#6B6864" }}>Not yet discovered. Summon from the Altar!</p>}
          </div>
        </div>
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
