import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/game/AppShell";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { getMyProfile, listRealms, listAllMonsters, listMyMonsters } from "@/lib/game/supabase-api";
import { listMyArtifacts, equipArtifact, unequipArtifact } from "@/lib/game/artifacts-client";
import { RARITY_COLOR, type Rarity } from "@/lib/game/gacha.constants";

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

type VoidArtifact = {
  id: string;
  monster_id: string | null;
  set_name: string;
  main_stat: string;
  enhancement_level: number;
};

export const Route = createFileRoute("/_authenticated/compendium")({
  component: CompendiumPage,
});

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
      className={`px-3 py-1.5 rounded-full text-xs font-serif font-bold transition-all border whitespace-nowrap ${
        active
          ? "bg-[#b89047]/20 border-[#b89047] text-[#b89047] shadow-[0_0_10px_rgba(212,175,63,0.3)]"
          : "bg-[#f4ecd8]/40 border-[#3d2e1f]/10 text-[#3d2e1f]/60 hover:text-[#3d2e1f]/90 hover:border-[#3d2e1f]/30"
      }`}
    >
      {children}
    </button>
  );
}

function CompendiumPage() {
  const qc = useQueryClient();
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const realmsQ = useQuery({ queryKey: ["realms"], queryFn: listRealms });
  const monstersQ = useQuery({ queryKey: ["monsters"], queryFn: listAllMonsters });
  const myMonstersQ = useQuery({ queryKey: ["my-monsters"], queryFn: listMyMonsters });
  const artifactsQ = useQuery({ queryKey: ["my-artifacts"], queryFn: listMyArtifacts });

  const [realmFilter, setRealmFilter] = useState<number | null>(null);
  const [rarityFilter, setRarityFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const [selectedUM, setSelectedUM] = useState<CompendiumMonster | null>(null);
  const [modalTab, setModalTab] = useState<"details" | "equipment">("details");

  const equipMut = useMutation({
    mutationFn: async ({ artifactId, monsterId }: { artifactId: string; monsterId: string }) =>
      equipArtifact(artifactId, monsterId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-artifacts"] });
      toast.success("Artifact Equipped");
    },
  });

  const unequipMut = useMutation({
    mutationFn: async (artifactId: string) => unequipArtifact(artifactId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-artifacts"] });
      toast.success("Artifact Unequipped");
    },
  });

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
    return list;
  }, [monstersQ.data, realmFilter, rarityFilter, search]);

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
        className="min-h-screen grid place-items-center"
        style={{ color: "#3d2e1f" }}
      >
        Loading the records…
      </div>
    );
  }

  const allArtifacts = artifactsQ.data?.artifacts ?? [];
  const equippedArtifacts = selectedUM
    ? allArtifacts.filter((a: VoidArtifact) => a.monster_id === selectedUM.id)
    : [];
  const availableArtifacts = allArtifacts.filter((a: VoidArtifact) => a.monster_id === null);

  return (
    <AppShell profile={profileQ.data?.profile as React.ComponentProps<typeof AppShell>["profile"]}>
      <div className="p-6 md:p-10 max-w-6xl mx-auto relative z-10 min-h-screen pt-20">
        <header className="mb-6 relative z-20">
          <h1
            className="text-4xl font-serif font-bold tracking-tighter uppercase italic flex items-center gap-3 mb-2"
            style={{ color: "#b89047", textShadow: "0 0 20px #b89047" }}
          >
            <Icon name="sparkle" size={32} />
            Compendium
          </h1>
          <p className="text-sm max-w-xl font-serif" style={{ color: "#3d2e1f" }}>
            Explore the Codex of all known entities. Click on your owned monsters to view their
            details and equip Void Artifacts.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 relative z-20 items-start">
          {/* Left Sidebar: Filters */}
          <div className="flex flex-col gap-6">
            <div className="ss-card p-4 border border-[rgba(61,46,31,0.1)]">
              <h3 className="font-serif mb-3 text-sm" style={{ color: "#2a1e12" }}>
                Progress
              </h3>
              <div className="text-2xl font-bold font-serif" style={{ color: "#b89047" }}>
                {myMonstersMap.size}{" "}
                <span className="text-sm text-[#3d2e1f]/50">
                  / {monstersQ.data?.monsters?.length ?? 0}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#f4ecd8]/50 mt-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#b89047]"
                  style={{
                    width: `${(myMonstersMap.size / (monstersQ.data?.monsters?.length || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="ss-card p-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search monsters…"
                className="ss-input w-full mb-4"
              />
              <div className="flex flex-wrap gap-2 mb-4">
                <PillBtn active={rarityFilter === ""} onClick={() => setRarityFilter("")}>
                  All Rarities
                </PillBtn>
                <PillBtn
                  active={rarityFilter === "common"}
                  onClick={() => setRarityFilter("common")}
                >
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
                <PillBtn
                  active={rarityFilter === "mythic"}
                  onClick={() => setRarityFilter("mythic")}
                >
                  Mythic
                </PillBtn>
              </div>
              <div className="flex flex-col gap-2">
                <PillBtn active={realmFilter === null} onClick={() => setRealmFilter(null)}>
                  All Realms
                </PillBtn>
                {(realmsQ.data?.realms ?? []).map((r: RealmData) => (
                  <PillBtn
                    key={r.id}
                    active={realmFilter === r.id}
                    onClick={() => setRealmFilter(r.id)}
                  >
                    <div className="flex justify-between w-full">
                      <span>
                        {r.icon} {r.name}
                      </span>
                      <span className="opacity-50 text-[10px]">
                        {realmStats[r.id]?.owned || 0}/{realmStats[r.id]?.total || 0}
                      </span>
                    </div>
                  </PillBtn>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {filtered.map(
              (m: { id: string; art_url?: string | null; name: string; rarity: string }) => {
                const ownsList = myMonstersMap.get(m.id) || [];
                const owned = ownsList.length > 0;
                const color = RARITY_COLOR[m.rarity as keyof typeof RARITY_COLOR] || "white";
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      if (owned) {
                        // Just pick the highest level one if multiple
                        const highest = [...ownsList].sort((a, b) => b.level - a.level)[0];
                        setSelectedUM(highest);
                        setModalTab("details");
                      }
                    }}
                    className="ss-card relative overflow-hidden group transition-all hover:scale-105 cursor-pointer"
                    style={{
                      aspectRatio: "3/4",
                      borderColor: owned ? color : "rgba(61,46,31,0.1)",
                      filter: owned ? "none" : "grayscale(100%) opacity(50%)",
                      background: owned
                        ? "linear-gradient(180deg, #f4ecd8 0%, #e0d8c4 100%)"
                        : "#f4ecd8",
                    }}
                  >
                    <div className="absolute inset-0 p-2 flex flex-col items-center justify-center">
                      <img
                        src={
                          m.art_url ||
                          `/sprites/monsters/${m.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
                        }
                        alt={m.name}
                        className="w-16 h-16 object-cover mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                        style={{
                          mixBlendMode: "multiply",
                          maskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 80%)",
                          WebkitMaskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 80%)"
                        }}
                        onError={(e) => {
                          e.currentTarget.src = "/monsters/placeholder.png";
                        }}
                      />
                      <span
                        className="text-[10px] font-bold text-center w-full truncate px-1"
                        style={{ color: owned ? "#2a1e12" : "#3d2e1f" }}
                      >
                        {owned ? m.name : "???"}
                      </span>
                    </div>
                    {owned && (
                      <div
                        className="absolute top-1 left-1 text-[8px] uppercase font-serif tracking-widest font-bold px-1 rounded bg-[#f4ecd8]/80 border"
                        style={{ color, borderColor: color }}
                      >
                        {m.rarity}
                      </div>
                    )}
                    {ownsList.length > 1 && (
                      <div className="absolute top-1 right-1 text-[8px] bg-[#3d2e1f]/20 text-[#3d2e1f] px-1 rounded font-bold font-serif">
                        x{ownsList.length}
                      </div>
                    )}
                  </div>
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

      {/* Monster Details / Equipment Modal */}
      {selectedUM && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center ss-modal-backdrop p-4"
          onClick={() => setSelectedUM(null)}
        >
          <div
            className="ss-modal max-w-3xl w-full flex flex-col md:flex-row gap-6 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: Monster Portrait */}
            <div className="w-full md:w-1/3 flex flex-col items-center">
              <h2 className="t-h2 text-xl mb-4 text-center" style={{ color: "#b89047" }}>
                {selectedUM.monster.name}
              </h2>
              <div
                className="w-48 h-48 rounded-xl border-2 flex flex-col items-center justify-center ss-pane relative overflow-hidden mb-4"
                style={{ borderColor: RARITY_COLOR[selectedUM.monster.rarity as Rarity] }}
              >
                <div className="absolute top-2 left-2 text-xs font-serif font-bold bg-[#f4ecd8]/50 px-1.5 rounded text-[#3d2e1f] z-10">
                  Lv. {selectedUM.level}
                </div>
                <div className="absolute top-2 right-2 text-xs font-serif font-bold bg-[#f4ecd8]/50 px-1.5 rounded text-[#b89047] z-10">
                  {selectedUM.current_star ?? selectedUM.star_level ?? 1}★
                </div>
                <img
                  src={
                    selectedUM.monster.art_url ||
                    `/sprites/monsters/${selectedUM.monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
                  }
                  alt={selectedUM.monster.name}
                  className="w-[120%] h-[120%] object-cover p-2"
                  style={{
                    mixBlendMode: "multiply",
                    maskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 70%)",
                    WebkitMaskImage: "radial-gradient(circle at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 70%)"
                  }}
                  onError={(e) => {
                    e.currentTarget.src = "/monsters/placeholder.png";
                  }}
                />
              </div>

              <div className="flex w-full mt-2 rounded border border-[#3d2e1f]/10 overflow-hidden text-xs font-bold uppercase tracking-widest">
                <button
                  onClick={() => setModalTab("details")}
                  className={`flex-1 py-2 text-center transition-colors ${modalTab === "details" ? "bg-[#b89047] text-black" : "bg-[#f4ecd8] text-[#3d2e1f]/50 hover:bg-[#3d2e1f]/5"}`}
                >
                  Stats
                </button>
                <button
                  onClick={() => setModalTab("equipment")}
                  className={`flex-1 py-2 text-center transition-colors ${modalTab === "equipment" ? "bg-[#b89047] text-black" : "bg-[#f4ecd8] text-[#3d2e1f]/50 hover:bg-[#3d2e1f]/5"}`}
                >
                  Void Gear
                </button>
              </div>
            </div>

            {/* Right: Tab Content */}
            <div className="w-full md:w-2/3 max-h-[60vh] overflow-y-auto pr-2">
              {modalTab === "details" ? (
                <div className="space-y-4">
                  <div className="ss-card p-4">
                    <p className="text-xs uppercase tracking-widest font-bold mb-2 text-[#3d2e1f]/50">
                      Combat Stats
                    </p>
                    <div className="grid grid-cols-2 gap-4 font-serif text-sm">
                      <div className="flex justify-between border-b border-[#3d2e1f]/10 pb-1">
                        <span className="text-[#3d2e1f]/60">HP</span>
                        <span className="text-[var(--success)]">
                          {selectedUM.monster.base_hp + selectedUM.level * 10}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-[#3d2e1f]/10 pb-1">
                        <span className="text-[#3d2e1f]/60">ATK</span>
                        <span className="text-[var(--danger)]">
                          {selectedUM.monster.base_atk + selectedUM.level * 2}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-[#3d2e1f]/10 pb-1">
                        <span className="text-[#3d2e1f]/60">DEF</span>
                        <span className="text-[#b89047]">
                          {selectedUM.monster.base_def + selectedUM.level * 1}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-[#3d2e1f]/10 pb-1">
                        <span className="text-[#3d2e1f]/60">Bond</span>
                        <span className="text-pink-400">{selectedUM.bond_percent}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="ss-card p-4">
                    <p className="text-xs uppercase tracking-widest font-bold mb-2 text-[#3d2e1f]/50">
                      Abyssal Lineage
                    </p>
                    <p className="text-sm">
                      <strong className="text-[#b89047]">Class:</strong>{" "}
                      {selectedUM.current_class || selectedUM.monster.role}
                    </p>
                    <p className="text-sm mt-1">
                      <strong className="text-[#b89047]">Title:</strong>{" "}
                      {selectedUM.title || "None"}
                    </p>
                    <p className="text-sm mt-1">
                      <strong className="text-[#b89047]">Corruption:</strong>{" "}
                      {selectedUM.corruption_level ?? 0}%
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Equipped Artifacts */}
                  <h3 className="text-xs uppercase tracking-widest font-bold mb-2 text-[#b89047]">
                    Equipped Artifacts ({equippedArtifacts.length}/4)
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 4 }).map((_, i) => {
                      const art = equippedArtifacts[i];
                      if (art) {
                        return (
                          <div
                            key={art.id}
                            className="ss-card p-2 border-[#b89047] relative group"
                          >
                            <button
                              onClick={() => unequipMut.mutate(art.id)}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-xs text-red-400 bg-red-900/20 px-1 rounded transition-opacity"
                            >
                              Unequip
                            </button>
                            <p className="text-[10px] font-bold text-[#b89047]">
                              +{art.enhancement_level} {art.set_name}
                            </p>
                            <p className="text-xs text-[#3d2e1f] font-serif">{art.main_stat}</p>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={i}
                          className="ss-card p-2 border-dashed border-[#3d2e1f]/20 flex items-center justify-center min-h-[60px] opacity-50"
                        >
                          <span className="text-[10px] uppercase font-bold tracking-widest">
                            Empty Slot
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <hr className="border-[#3d2e1f]/10 my-4" />

                  {/* Inventory */}
                  <h3 className="text-xs uppercase tracking-widest font-bold mb-2 text-[#3d2e1f]/50">
                    Void Artifact Inventory
                  </h3>
                  {availableArtifacts.length === 0 ? (
                    <div className="text-center p-4 opacity-50 text-xs italic font-serif">
                      Your inventory is empty. Conquer the Void to obtain Artifacts.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {availableArtifacts.map((art: VoidArtifact) => (
                        <div
                          key={art.id}
                          className="ss-card p-2 border-[#3d2e1f]/20 flex flex-col justify-between"
                        >
                          <div>
                            <p className="text-[10px] font-bold text-[#3d2e1f]/70">
                              +{art.enhancement_level} {art.set_name}
                            </p>
                            <p className="text-xs text-[#3d2e1f] font-serif">{art.main_stat}</p>
                          </div>
                          <button
                            disabled={equippedArtifacts.length >= 4 || equipMut.isPending}
                            onClick={() =>
                              equipMut.mutate({ artifactId: art.id, monsterId: selectedUM.id })
                            }
                            className="mt-2 text-[10px] bg-[#3d2e1f]/10 hover:bg-[#b89047] hover:text-black transition-colors rounded py-1 font-bold uppercase tracking-widest"
                          >
                            Equip
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              className="absolute -top-4 -right-4 w-10 h-10 bg-[#f4ecd8] border border-[#3d2e1f]/20 rounded-full flex items-center justify-center text-[#3d2e1f]/50 hover:text-[#3d2e1f] hover:border-[#3d2e1f] hover:bg-red-500 transition-all z-50"
              onClick={() => setSelectedUM(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
