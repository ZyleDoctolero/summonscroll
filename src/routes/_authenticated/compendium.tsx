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

type VoidArtifact = {
  id: string;
  monster_id: string | null;
  set_name: string;
  main_stat: string;
  enhancement_level: number;
};

const FireSprite = () => (
  <svg width="100%" height="100%" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="48" cy="62" rx="28" ry="20" fill="#2a1a0a"/>
    <rect x="28" y="74" width="10" height="12" rx="4" fill="#1e1206"/>
    <rect x="58" y="74" width="10" height="12" rx="4" fill="#1e1206"/>
    <ellipse cx="48" cy="42" rx="22" ry="18" fill="#2a1a0a"/>
    <polygon points="30,28 24,14 38,26" fill="#1e1206"/>
    <polygon points="66,28 72,14 58,26" fill="#1e1206"/>
    <polygon points="31,26 27,18 36,26" fill="#ff5e2a" opacity="0.6"/>
    <polygon points="65,26 69,18 60,26" fill="#ff5e2a" opacity="0.6"/>
    <ellipse cx="40" cy="40" rx="5" ry="5.5" fill="#ff5e2a"/>
    <ellipse cx="56" cy="40" rx="5" ry="5.5" fill="#ff5e2a"/>
    <ellipse cx="40" cy="40" rx="2.5" ry="3" fill="#ff1a00"/>
    <ellipse cx="56" cy="40" rx="2.5" ry="3" fill="#ff1a00"/>
    <ellipse cx="48" cy="56" rx="6" ry="8" fill="#ff5e2a" opacity="0.7"/>
    <ellipse cx="48" cy="50" rx="4" ry="6" fill="#ffe066" opacity="0.6"/>
    <ellipse cx="48" cy="49" rx="4" ry="2.5" fill="#0e0906"/>
    <path d="M76,62 Q90,48 84,38 Q80,30 72,36" stroke="#ff5e2a" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.8"/>
    <path d="M76,62 Q88,50 83,40" stroke="#ffe066" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"/>
  </svg>
);

const WaterSprite = () => (
  <svg width="100%" height="100%" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="48" cy="68" rx="24" ry="18" fill="#0a1e30"/>
    <path d="M32,72 Q24,82 28,88" stroke="#38b8f5" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7"/>
    <path d="M64,72 Q72,82 68,88" stroke="#38b8f5" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7"/>
    <path d="M48,78 Q48,88 50,92" stroke="#38b8f5" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5"/>
    <ellipse cx="48" cy="60" rx="16" ry="14" fill="#0e2840"/>
    <ellipse cx="30" cy="58" rx="10" ry="5" fill="#0a1e30" transform="rotate(-20,30,58)"/>
    <ellipse cx="66" cy="58" rx="10" ry="5" fill="#0a1e30" transform="rotate(20,66,58)"/>
    <rect x="43" y="44" width="10" height="10" rx="4" fill="#0a1e30"/>
    <ellipse cx="48" cy="36" rx="18" ry="16" fill="#0e2840"/>
    <ellipse cx="41" cy="34" rx="6" ry="6" fill="#001c30"/>
    <ellipse cx="55" cy="34" rx="6" ry="6" fill="#001c30"/>
    <ellipse cx="41" cy="34" rx="4" ry="4" fill="#38b8f5"/>
    <ellipse cx="55" cy="34" rx="4" ry="4" fill="#38b8f5"/>
    <ellipse cx="41" cy="33" rx="1.5" ry="2" fill="#fff" opacity="0.8"/>
    <ellipse cx="55" cy="33" rx="1.5" ry="2" fill="#fff" opacity="0.8"/>
    <polygon points="30,28 22,14 36,26" fill="#38b8f5" opacity="0.7"/>
    <polygon points="66,28 74,14 60,26" fill="#38b8f5" opacity="0.7"/>
    <circle cx="20" cy="50" r="4" fill="#38b8f5" opacity="0.6"/>
    <circle cx="76" cy="44" r="3" fill="#38b8f5" opacity="0.5"/>
    <circle cx="22" cy="38" r="2.5" fill="#38b8f5" opacity="0.4"/>
  </svg>
);

const NatureSprite = () => (
  <svg width="100%" height="100%" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
    <path d="M36,78 Q28,86 24,92" stroke="#3ed97a" strokeWidth="3" fill="none" opacity="0.5"/>
    <path d="M60,78 Q68,86 72,92" stroke="#3ed97a" strokeWidth="3" fill="none" opacity="0.5"/>
    <path d="M48,80 Q42,88 40,92" stroke="#3ed97a" strokeWidth="2.5" fill="none" opacity="0.4"/>
    <ellipse cx="48" cy="62" rx="20" ry="16" fill="#0a1e0c"/>
    <path d="M36,54 Q42,60 36,68" stroke="#3ed97a" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M60,54 Q54,60 60,68" stroke="#3ed97a" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <ellipse cx="28" cy="56" rx="12" ry="6" fill="#0f2812" transform="rotate(-25,28,56)"/>
    <ellipse cx="68" cy="56" rx="12" ry="6" fill="#0f2812" transform="rotate(25,68,56)"/>
    <ellipse cx="28" cy="54" rx="7" ry="3.5" fill="#3ed97a" opacity="0.5" transform="rotate(-25,28,54)"/>
    <ellipse cx="68" cy="54" rx="7" ry="3.5" fill="#3ed97a" opacity="0.5" transform="rotate(25,68,54)"/>
    <rect x="43" y="46" width="10" height="10" rx="4" fill="#0a1e0c"/>
    <ellipse cx="48" cy="36" rx="19" ry="17" fill="#0a1e0c"/>
    <path d="M36,24 Q32,10 40,12 Q44,20 40,24" fill="#3ed97a" opacity="0.8"/>
    <path d="M48,20 Q46,6 52,8 Q52,14 50,22" fill="#3ed97a" opacity="0.7"/>
    <path d="M60,24 Q64,10 56,12 Q52,20 56,24" fill="#3ed97a" opacity="0.8"/>
    <ellipse cx="41" cy="36" rx="6" ry="6" fill="#06100a"/>
    <ellipse cx="55" cy="36" rx="6" ry="6" fill="#06100a"/>
    <ellipse cx="41" cy="36" rx="4" ry="4" fill="#3ed97a"/>
    <ellipse cx="55" cy="36" rx="4" ry="4" fill="#3ed97a"/>
    <ellipse cx="41" cy="35" rx="2" ry="2" fill="#d0ffe0" opacity="0.9"/>
    <ellipse cx="55" cy="35" rx="2" ry="2" fill="#d0ffe0" opacity="0.9"/>
    <circle cx="48" cy="26" r="4" fill="#3ed97a" opacity="0.6"/>
    <circle cx="48" cy="26" r="2" fill="#ffe066" opacity="0.8"/>
  </svg>
);

const LightSprite = () => (
  <svg width="100%" height="100%" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
    <path d="M30,52 Q8,30 12,14 Q22,28 30,40" fill="#ffe066" opacity="0.35"/>
    <path d="M66,52 Q88,30 84,14 Q74,28 66,40" fill="#ffe066" opacity="0.35"/>
    <ellipse cx="48" cy="62" rx="18" ry="14" fill="#1a1404"/>
    <ellipse cx="48" cy="56" rx="10" ry="8" fill="#ffe066" opacity="0.3"/>
    <circle cx="48" cy="58" r="6" fill="#ffe066" opacity="0.5"/>
    <circle cx="48" cy="58" r="3" fill="#fff" opacity="0.8"/>
    <rect x="36" y="72" width="9" height="14" rx="4" fill="#141004"/>
    <rect x="51" y="72" width="9" height="14" rx="4" fill="#141004"/>
    <ellipse cx="48" cy="36" rx="19" ry="18" fill="#1a1404"/>
    <ellipse cx="48" cy="24" rx="16" ry="4" fill="none" stroke="#ffe066" strokeWidth="3" opacity="0.8"/>
    <polygon points="48,14 44,22 52,22" fill="#ffe066" opacity="0.9"/>
    <polygon points="40,16 36,24 44,23" fill="#ffe066" opacity="0.6"/>
    <polygon points="56,16 60,24 52,23" fill="#ffe066" opacity="0.6"/>
    <ellipse cx="41" cy="36" rx="6" ry="6" fill="#0a0800"/>
    <ellipse cx="55" cy="36" rx="6" ry="6" fill="#0a0800"/>
    <ellipse cx="41" cy="36" rx="4" ry="4" fill="#ffe066"/>
    <ellipse cx="55" cy="36" rx="4" ry="4" fill="#ffe066"/>
    <ellipse cx="41" cy="35" rx="2" ry="2" fill="#fff"/>
    <ellipse cx="55" cy="35" rx="2" ry="2" fill="#fff"/>
    <line x1="48" y1="10" x2="48" y2="4" stroke="#ffe066" strokeWidth="2" opacity="0.5"/>
    <line x1="60" y1="14" x2="64" y2="8" stroke="#ffe066" strokeWidth="2" opacity="0.4"/>
    <line x1="36" y1="14" x2="32" y2="8" stroke="#ffe066" strokeWidth="2" opacity="0.4"/>
  </svg>
);

const DarkSprite = () => (
  <svg width="100%" height="100%" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="48" cy="72" rx="22" ry="14" fill="#0e061a"/>
    <path d="M26,56 Q16,70 20,82" stroke="#c47fff" strokeWidth="2" fill="none" opacity="0.5"/>
    <path d="M70,56 Q80,70 76,82" stroke="#c47fff" strokeWidth="2" fill="none" opacity="0.5"/>
    <ellipse cx="48" cy="58" rx="18" ry="16" fill="#100820"/>
    <ellipse cx="30" cy="52" rx="11" ry="7" fill="#0c0618" transform="rotate(-15,30,52)"/>
    <ellipse cx="66" cy="52" rx="11" ry="7" fill="#0c0618" transform="rotate(15,66,52)"/>
    <ellipse cx="30" cy="50" rx="6" ry="4" fill="#c47fff" opacity="0.3" transform="rotate(-15,30,50)"/>
    <ellipse cx="66" cy="50" rx="6" ry="4" fill="#c47fff" opacity="0.3" transform="rotate(15,66,50)"/>
    <ellipse cx="48" cy="36" rx="18" ry="18" fill="#100820"/>
    <polygon points="38,20 34,8 44,18" fill="#c47fff" opacity="0.7"/>
    <polygon points="58,20 62,8 52,18" fill="#c47fff" opacity="0.7"/>
    <polygon points="48,18 48,6 52,16" fill="#c47fff" opacity="0.5"/>
    <ellipse cx="41" cy="36" rx="7" ry="5" fill="#050210"/>
    <ellipse cx="55" cy="36" rx="7" ry="5" fill="#050210"/>
    <ellipse cx="41" cy="36" rx="5" ry="3.5" fill="#c47fff"/>
    <ellipse cx="55" cy="36" rx="5" ry="3.5" fill="#c47fff"/>
    <ellipse cx="41" cy="35" rx="2" ry="2" fill="#fff" opacity="0.6"/>
    <ellipse cx="55" cy="35" rx="2" ry="2" fill="#fff" opacity="0.6"/>
    <text x="48" y="58" textAnchor="middle" fill="#c47fff" fontSize="10" opacity="0.5" fontFamily="serif">ᛜ</text>
    <circle cx="18" cy="40" r="5" fill="#c47fff" opacity="0.3"/>
    <circle cx="78" cy="36" r="4" fill="#c47fff" opacity="0.25"/>
  </svg>
);

const getElementSprite = (el: string) => {
  switch (el?.toLowerCase()) {
    case "fire": case "chaos": return <FireSprite />;
    case "water": case "digital": case "stellar": return <WaterSprite />;
    case "nature": case "primal": return <NatureSprite />;
    case "light": case "divine": return <LightSprite />;
    case "dark": case "void": case "death": case "dread": return <DarkSprite />;
    case "arcane": return <LightSprite />;
    default: return <NatureSprite />;
  }
};

const getElementColor = (el: string) => {
  switch (el?.toLowerCase()) {
    case "fire": case "chaos": return "#e85d3a";
    case "water": case "digital": return "#38b8f5";
    case "nature": case "primal": return "#3ed97a";
    case "light": case "divine": return "#e8b830";
    case "dark": case "void": return "#9b6dff";
    case "death": case "dread": return "#c44f6f";
    case "arcane": return "#d4a030";
    case "stellar": return "#6db8e8";
    default: return "#c9a84c";
  }
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
          ? "bg-[rgba(200,154,62,0.12)] border-[#c89a3e]/50 text-[#3d2e1e] shadow-[0_0_10px_rgba(200,154,62,0.15)]"
          : "bg-transparent border-[#b5a28a]/20 text-[#8b7355]/60 hover:text-[#3d2e1e]/90 hover:border-[#b5a28a]/40"
      }`}
    >
      {children}
    </button>
  );
}

function ImageOrSprite({ url, name, element, owned, color }: { url?: string|null, name: string, element: string, owned: boolean, color: string }) {
  const [error, setError] = useState(false);
  const elColor = getElementColor(element);

  if (!error && url) {
    return (
      <img
        src={url}
        alt={name}
        className="w-full h-full object-contain p-2"
        style={{
          filter: owned
            ? `drop-shadow(0 0 6px ${color}80) drop-shadow(0 2px 4px rgba(61,46,31,0.2))`
            : `brightness(0) saturate(0) opacity(0.15) drop-shadow(0 0 12px ${elColor}60)`,
        }}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div
      className="w-full h-full flex items-center justify-center p-2"
      style={{
        filter: owned
          ? `drop-shadow(0 0 6px ${color}80)`
          : `opacity(0.7)`,
      }}
    >
      {getElementSprite(element)}
    </div>
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
        className="min-h-screen grid place-items-center font-serif text-xl"
        style={{ color: "var(--ink-primary)", textShadow: "0 0 10px rgba(200,154,62,0.3)" }}
      >
        Loading the Codex…
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
      <div className="w-full flex flex-col relative z-10">
        <header className="mb-6 relative z-20">
          <h1
            className="text-4xl font-serif font-bold tracking-tighter uppercase italic flex items-center gap-3 mb-2"
            style={{ color: "#b8860b", textShadow: "0 0 20px rgba(200,154,62,0.3)" }}
          >
            <Icon name="sparkle" size={32} color="#c89a3e" />
            Compendium
          </h1>
          <p className="text-sm max-w-xl font-serif" style={{ color: "var(--ink-secondary)" }}>
            Explore the Codex of all known entities. Click on your owned monsters to view their
            details and equip Void Artifacts.
          </p>
        </header>

        {/* Compact filter bar */}
        <div className="relative z-20 mb-6">
          <div className="flex flex-col gap-3">
            {/* Progress + Search row */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xl font-bold font-serif" style={{ color: "var(--ink-primary)" }}>
                  {myMonstersMap.size}
                </span>
                <span className="text-xs text-[#8b7355]/60">
                  / {monstersQ.data?.monsters?.length ?? 0}
                </span>
                <div className="w-20 h-1.5 bg-[rgba(180,150,100,0.12)] rounded-full overflow-hidden border border-[#c89a3e]/20">
                  <div
                    className="h-full bg-[#c89a3e] transition-all duration-500"
                    style={{
                      width: `${(myMonstersMap.size / (monstersQ.data?.monsters?.length || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search monsters…"
                className="flex-1 px-3 py-2 bg-white border border-[rgba(200,154,62,0.25)] rounded-lg text-[var(--ink-primary)] placeholder-[#8b7355]/50 focus:outline-none focus:border-[#c89a3e] focus:shadow-[0_0_8px_rgba(200,154,62,0.2)] transition-all font-serif text-sm"
              />
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
              <PillBtn active={rarityFilter === "legendary"} onClick={() => setRarityFilter("legendary")}>
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
                  <span className="opacity-50 text-[9px] ml-1">
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
              (m: { id: string; art_url?: string | null; name: string; rarity: string; element: string }) => {
                const ownsList = myMonstersMap.get(m.id) || [];
                const owned = ownsList.length > 0;
                const color = RARITY_COLOR[m.rarity as keyof typeof RARITY_COLOR] || "#c9a84c";
                const elColor = getElementColor(m.element);
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      if (owned) {
                        const highest = [...ownsList].sort((a, b) => b.level - a.level)[0];
                        setSelectedUM(highest);
                        setModalTab("details");
                      }
                    }}
                    className={`relative overflow-hidden group transition-all duration-200 rounded-xl border ${owned ? "cursor-pointer hover:scale-[1.04] hover:-translate-y-0.5" : ""}`}
                    style={{
                      aspectRatio: "3/4",
                      borderColor: owned ? `${color}60` : "rgba(180,150,100,0.12)",
                      background: owned
                        ? `linear-gradient(160deg, #faf6f0, ${color}08)`
                        : `linear-gradient(160deg, #eee8dc, ${elColor}06)`,
                      boxShadow: owned
                        ? `0 4px 16px ${color}20, inset 0 1px 0 rgba(255,255,255,0.5)`
                        : "0 2px 8px rgba(120,90,50,0.06), inset 0 1px 0 rgba(255,255,255,0.3)",
                    }}
                  >
                    {/* Element indicator dot */}
                    <div
                      className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border border-white/50 z-10"
                      style={{ background: elColor, boxShadow: `0 0 6px ${elColor}60` }}
                      title={m.element}
                    />

                    {/* Monster art area */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-1.5">
                      <div className="flex-1 w-full flex items-center justify-center">
                        <ImageOrSprite url={m.art_url} name={m.name} element={m.element} owned={owned} color={color} />
                      </div>
                      <span
                        className="text-[10px] font-bold text-center w-full truncate px-1 pb-1 relative z-10"
                        style={{ color: owned ? "var(--ink-primary)" : "#a09080" }}
                      >
                        {owned ? m.name : "???"}
                      </span>
                    </div>

                    {/* Rarity badge */}
                    {owned && (
                      <div
                        className="absolute top-1 left-1 text-[7px] uppercase font-serif tracking-widest font-bold px-1.5 py-0.5 rounded-md bg-white/80 border backdrop-blur-sm z-10"
                        style={{ color, borderColor: `${color}50` }}
                      >
                        {m.rarity}
                      </div>
                    )}
                    {ownsList.length > 1 && (
                      <div className="absolute bottom-6 right-1 text-[8px] bg-white/80 border border-[#c89a3e]/30 text-[var(--ink-primary)] px-1 rounded font-bold font-serif backdrop-blur-sm z-10">
                        x{ownsList.length}
                      </div>
                    )}

                    {/* Unowned overlay pattern */}
                    {!owned && (
                      <div className="absolute inset-0 rounded-xl" style={{
                        background: `radial-gradient(circle at 50% 40%, transparent 30%, ${elColor}08 100%)`,
                      }} />
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
            className="max-w-3xl w-full flex flex-col md:flex-row gap-6 p-6 rounded-2xl border border-[rgba(200,154,62,0.25)] shadow-[0_8px_40px_rgba(120,90,50,0.15)] relative"
            style={{ background: "rgba(255,252,247,0.96)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: Monster Portrait */}
            <div className="w-full md:w-1/3 flex flex-col items-center">
              <h2 className="t-h2 text-xl mb-4 text-center" style={{ color: "var(--ink-primary)" }}>
                {selectedUM.monster.name}
              </h2>
              <div
                className="w-48 h-48 rounded-xl border-2 flex flex-col items-center justify-center relative overflow-hidden mb-4"
                style={{ 
                  borderColor: RARITY_COLOR[selectedUM.monster.rarity as Rarity],
                  background: "linear-gradient(145deg, #f5efe6, rgba(240,230,215,0.8))",
                  boxShadow: `inset 0 0 20px ${RARITY_COLOR[selectedUM.monster.rarity as Rarity]}40`
                }}
              >
                <div className="absolute top-2 left-2 text-xs font-serif font-bold bg-white/80 border border-[#c89a3e]/30 px-1.5 rounded text-[var(--ink-primary)] z-10 backdrop-blur-sm">
                  Lv. {selectedUM.level}
                </div>
                <div className="absolute top-2 right-2 text-xs font-serif font-bold bg-white/80 border border-[#c89a3e]/30 px-1.5 rounded text-[var(--ink-primary)] z-10 backdrop-blur-sm">
                  {selectedUM.current_star ?? selectedUM.star_level ?? 1}★
                </div>
                <ImageOrSprite url={selectedUM.monster.art_url} name={selectedUM.monster.name} element={selectedUM.monster.element} owned={true} color={RARITY_COLOR[selectedUM.monster.rarity as Rarity] || "white"} />
              </div>

              <div className="flex w-full mt-2 rounded border border-[#c89a3e]/15 overflow-hidden text-xs font-bold uppercase tracking-widest bg-[rgba(240,230,210,0.5)] backdrop-blur-md">
                <button
                  onClick={() => setModalTab("details")}
                  className={`flex-1 py-2 text-center transition-all ${modalTab === "details" ? "bg-white text-[#b8860b] shadow-sm" : "text-[#8b7355]/70 hover:text-[var(--ink-primary)] hover:bg-white/50"}`}
                >
                  Stats
                </button>
                <button
                  onClick={() => setModalTab("equipment")}
                  className={`flex-1 py-2 text-center transition-all ${modalTab === "equipment" ? "bg-white text-[#b8860b] shadow-sm" : "text-[#8b7355]/70 hover:text-[var(--ink-primary)] hover:bg-white/50"}`}
                >
                  Void Gear
                </button>
              </div>
            </div>

            {/* Right: Tab Content */}
            <div className="w-full md:w-2/3 max-h-[60vh] overflow-y-auto pr-2">
              {modalTab === "details" ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-[rgba(200,154,62,0.15)] bg-[rgba(240,230,210,0.3)] text-[var(--ink-primary)]">
                    <p className="text-xs uppercase tracking-widest font-bold mb-2 text-[var(--ink-primary)]/70">
                      Combat Stats
                    </p>
                    <div className="grid grid-cols-2 gap-4 font-serif text-sm">
                      <div className="flex justify-between border-b border-[#b5a28a]/20 pb-1">
                        <span className="text-[var(--ink-primary)]/80">HP</span>
                        <span className="text-[var(--success)]">
                          {selectedUM.monster.base_hp + selectedUM.level * 10}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-[#b5a28a]/20 pb-1">
                        <span className="text-[var(--ink-primary)]/80">ATK</span>
                        <span className="text-[var(--danger)]">
                          {selectedUM.monster.base_atk + selectedUM.level * 2}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-[#b5a28a]/20 pb-1">
                        <span className="text-[var(--ink-primary)]/80">DEF</span>
                        <span className="text-[var(--ink-primary)]">
                          {selectedUM.monster.base_def + selectedUM.level * 1}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-[#b5a28a]/20 pb-1">
                        <span className="text-[var(--ink-primary)]/80">Bond</span>
                        <span className="text-pink-400">{selectedUM.bond_percent}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-[rgba(200,154,62,0.15)] bg-[rgba(240,230,210,0.3)] text-[var(--ink-primary)]">
                    <p className="text-xs uppercase tracking-widest font-bold mb-2 text-[var(--ink-primary)]/70">
                      Abyssal Lineage
                    </p>
                    <p className="text-sm">
                      <strong className="text-[var(--ink-primary)]">Class:</strong>{" "}
                      {selectedUM.current_class || selectedUM.monster.role}
                    </p>
                    <p className="text-sm mt-1">
                      <strong className="text-[var(--ink-primary)]">Title:</strong>{" "}
                      {selectedUM.title || "None"}
                    </p>
                    <p className="text-sm mt-1">
                      <strong className="text-[var(--ink-primary)]">Corruption:</strong>{" "}
                      {selectedUM.corruption_level ?? 0}%
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Equipped Artifacts */}
                  <h3 className="text-xs uppercase tracking-widest font-bold mb-2 text-[var(--ink-primary)]">
                    Equipped Artifacts ({equippedArtifacts.length}/4)
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 4 }).map((_, i) => {
                      const art = equippedArtifacts[i];
                      if (art) {
                        return (
                          <div
                            key={art.id}
                            className="p-2 rounded-xl border border-[#c89a3e]/25 bg-white/80 relative group shadow-[0_4px_10px_rgba(120,90,50,0.08)]"
                          >
                            <button
                              onClick={() => unequipMut.mutate(art.id)}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-[10px] text-red-600 bg-red-100 px-1.5 py-0.5 rounded transition-opacity hover:bg-red-200 uppercase font-bold tracking-widest border border-red-200"
                            >
                              Unequip
                            </button>
                            <p className="text-[10px] font-bold text-[var(--ink-primary)]">
                              +{art.enhancement_level} {art.set_name}
                            </p>
                            <p className="text-xs text-[var(--ink-primary)] font-serif">{art.main_stat}</p>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={i}
                          className="p-2 rounded-xl border border-dashed border-[#b5a28a]/30 bg-[rgba(240,230,210,0.3)] flex items-center justify-center min-h-[60px] opacity-50"
                        >
                          <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--ink-primary)]/50">
                            Empty Slot
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <hr className="border-[#b5a28a]/20 my-4" />

                  {/* Inventory */}
                  <h3 className="text-xs uppercase tracking-widest font-bold mb-2 text-[var(--ink-primary)]/70">
                    Void Artifact Inventory
                  </h3>
                  {availableArtifacts.length === 0 ? (
                    <div className="text-center p-4 opacity-50 text-xs italic font-serif text-[var(--ink-primary)]">
                      Your inventory is empty. Conquer the Void to obtain Artifacts.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {availableArtifacts.map((art: VoidArtifact) => (
                        <div
                          key={art.id}
                          className="p-2 rounded-xl border border-[#b5a28a]/20 bg-[rgba(240,230,210,0.3)] flex flex-col justify-between"
                        >
                          <div>
                            <p className="text-[10px] font-bold text-[var(--ink-primary)]/80">
                              +{art.enhancement_level} {art.set_name}
                            </p>
                            <p className="text-xs text-[var(--ink-primary)] font-serif">{art.main_stat}</p>
                          </div>
                          <button
                            disabled={equippedArtifacts.length >= 4 || equipMut.isPending}
                            onClick={() =>
                              equipMut.mutate({ artifactId: art.id, monsterId: selectedUM.id })
                            }
                            className="mt-2 text-[10px] bg-[#c89a3e] text-white hover:bg-[#b8860b] border border-[#c89a3e] transition-all rounded py-1 font-bold uppercase tracking-widest shadow-[0_2px_4px_rgba(200,154,62,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="absolute -top-4 -right-4 w-10 h-10 bg-white border border-[#b5a28a]/30 rounded-full flex items-center justify-center text-[var(--ink-secondary)] hover:text-white hover:border-red-500 hover:bg-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all z-50 shadow-[0_4px_10px_rgba(120,90,50,0.1)]"
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
