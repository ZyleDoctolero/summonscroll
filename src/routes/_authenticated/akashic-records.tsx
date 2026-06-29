import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/game/AppShell";
import { AtmosphereBackdrop } from "@/components/game/AtmosphereBackdrop";
import { LoadingScreen } from "@/components/game/LoadingScreen";
import { useState, useMemo } from "react";
import { RARITY_COLOR, type Rarity } from "@/lib/game/gacha.constants";
import { ChevronLeft } from "lucide-react";
import { AscensionTree } from "@/components/game/AscensionTree";
import { getMyProfile, listMyMonsters } from "@/lib/game/supabase-api";

type MonsterRecord = {
  id: string;
  current_star?: number;
  star_level?: number;
  current_class?: string;
  title?: string;
  secondary_element?: string;
  corruption_level?: number;
  monster: {
    name: string;
    rarity: string;
    role: string;
    art_url?: string;
  };
};

export const Route = createFileRoute("/_authenticated/akashic-records")({
  component: AkashicRecordsPage,
});

function AkashicRecordsPage() {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const monstersQ = useQuery({ queryKey: ["my-monsters"], queryFn: listMyMonsters });

  const monstersData = monstersQ.data?.userMonsters as MonsterRecord[] | undefined;

  const targetMonster = useMemo(() => {
    if (!monstersData) return null;
    return selectedTarget ? monstersData.find((m) => m.id === selectedTarget) : null;
  }, [selectedTarget, monstersData]);

  if (profileQ.isLoading || monstersQ.isLoading) return <LoadingScreen realmSlug="void" />;
  if (!profileQ.data || !monstersQ.data) return null;

  const profile = profileQ.data.profile;
  const monsters = monstersData as MonsterRecord[];

  return (
    <AppShell profile={profile}>
      <AtmosphereBackdrop realm="void" />

      <div className="relative z-10 p-4 md:p-8 max-w-6xl mx-auto pt-20 space-y-8 min-h-screen">
        <header className="text-center space-y-2">
          <h1
            className="text-3xl font-bold uppercase"
            style={{ fontFamily: "var(--ss-font-pixel)", color: "#b8860b", letterSpacing: "0.08em" }}
          >
            AKASHIC RECORDS
          </h1>
          <p
            style={{ color: "var(--ink-secondary)", fontFamily: "var(--ss-font-pixel)", fontSize: "10px" }}
            className="uppercase"
          >
            VIEW THE ASCENSION LINEAGE OF YOUR SOULS
          </p>
        </header>

        {!selectedTarget ? (
          <>
            <p
              className="text-center text-xs tracking-widest uppercase font-bold"
              style={{ color: "#b8860b" }}
            >
              Select a soul to view its evolution milestones and future paths.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 mt-8">
              {monsters.map((m) => {
                const rarity = (m.monster?.rarity || "common") as Rarity;
                const rarityColor = RARITY_COLOR[rarity] || "var(--ink-secondary)";
                const currentStar = m.current_star ?? m.star_level ?? 1;

                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedTarget(m.id)}
                    className={`ss-card p-3 text-center cursor-pointer transition-all duration-300 group hover:scale-105 aura-${rarity}`}
                  >
                    <div className="w-14 h-14 mx-auto mb-2 overflow-hidden ss-pane flex items-center justify-center transition-colors">
                      <img
                        src={
                          m.monster?.art_url
                            ? m.monster.art_url
                            : `/sprites/monsters/${(m.monster?.name || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
                        }
                        alt={m.monster?.name || "Monster"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/monsters/placeholder.png";
                        }}
                      />
                    </div>
                    <div className="font-serif font-bold text-sm" style={{ color: rarityColor }}>
                      {currentStar}★
                    </div>
                    <div
                      className="text-xs truncate mt-1"
                      title={m.monster?.name}
                      style={{ color: "var(--ink-primary)" }}
                    >
                      {m.monster?.name}
                    </div>
                    <div
                      className="text-[11px] uppercase tracking-wider mt-0.5"
                      style={{ color: rarityColor }}
                    >
                      {rarity}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : targetMonster ? (
          <div className="flex flex-col items-center">
            <button
              onClick={() => setSelectedTarget(null)}
              className="mb-6 flex items-center gap-1 hover:gap-2 transition-all text-sm font-serif uppercase tracking-widest"
              style={{ color: "var(--ink-secondary)" }}
            >
              <ChevronLeft className="w-4 h-4" />
              Return to Archives
            </button>

            <AscensionTree
              currentStar={targetMonster.current_star ?? targetMonster.star_level ?? 1}
              currentClass={targetMonster.current_class || targetMonster.monster.role}
              title={targetMonster.title}
              secondaryElement={targetMonster.secondary_element}
              corruptionLevel={targetMonster.corruption_level ?? 0}
              rarity={targetMonster.monster.rarity as Rarity}
            />
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
