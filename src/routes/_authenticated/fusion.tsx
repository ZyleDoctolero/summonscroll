import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/game/AppShell";
import { AtmosphereBackdrop } from "@/components/game/AtmosphereBackdrop";
import { EmptyState } from "@/components/ui/EmptyState";
import { getMyProfile, listMyMonsters, synthesizeMonster } from "@/lib/game/supabase-api";
import { RARITY_COLOR, type Rarity } from "@/lib/game/gacha.constants";
import { Icon } from "@/components/ui/Icon";
import { LoadingScreen } from "@/components/game/LoadingScreen";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export const Route = createFileRoute("/_authenticated/fusion")({
  component: FusionPage,
});

type FusionMonster = {
  id: string;
  level: number;
  current_star?: number;
  star_level?: number;
  is_locked: boolean;
  monster: {
    name: string;
    rarity: string;
    art_url?: string | null;
  };
};

function FusionPage() {
  const qc = useQueryClient();
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const monstersQ = useQuery({ queryKey: ["my-monsters"], queryFn: listMyMonsters });

  const [targetId, setTargetId] = useState<string | null>(null);
  const [fodderIds, setFodderIds] = useState<Array<string | null>>([]);
  const [selectingMode, setSelectingMode] = useState<"target" | "fodder" | null>(null);
  const [fodderSlotIndex, setFodderSlotIndex] = useState<number>(0);

  const synthesizeMut = useMutation({
    mutationFn: async () => {
      if (!targetId) throw new Error("No target selected");
      const validFodder = fodderIds.filter(Boolean) as string[];
      return synthesizeMonster(targetId, validFodder, false);
    },
    onSuccess: (data: { message?: string }) => {
      qc.invalidateQueries({ queryKey: ["my-monsters"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      // eslint-disable-next-line no-restricted-syntax
      confetti({ particleCount: 150, spread: 100, colors: ["#c89a3e", "#d4af3f", "#e8c55a"] });
      toast.success(data?.message || "Synthesis Complete!");
      setTargetId(null);
      setFodderIds([]);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Synthesis failed");
    },
  });

  const userMonsters = monstersQ.data?.userMonsters ?? [];
  const usedIds = new Set([targetId, ...fodderIds].filter(Boolean));

  if (profileQ.isLoading) return <LoadingScreen realmSlug="void-frontier" />;
  if (!profileQ.data) return null;

  const targetMonster = targetId
    ? userMonsters.find((m: FusionMonster) => m.id === targetId)
    : null;
  // Use current_star falling back to star_level for backwards compatibility
  const currentStar = targetMonster
    ? (targetMonster.current_star ?? targetMonster.star_level ?? 1)
    : 1;
  const requiredFodderCount = targetMonster ? currentStar : 0;

  // Make sure fodder array matches required count
  if (targetMonster && fodderIds.length !== requiredFodderCount) {
    setFodderIds(Array(requiredFodderCount).fill(null));
  }

  const isReady = targetMonster && fodderIds.every((f) => f !== null);
  const cost = targetMonster ? currentStar * 500 : 0;
  const hasGold = (profileQ.data.profile.gold ?? 0) >= cost;

  return (
    <AppShell profile={profileQ.data.profile}>
      <AtmosphereBackdrop realm="void" />
      <div className="p-6 md:p-10 max-w-6xl mx-auto relative z-10 min-h-screen flex flex-col items-center">
        <h1
          className="text-3xl font-bold mb-2 uppercase"
          style={{ fontFamily: "var(--ss-font-pixel)", color: "var(--gold-bright)", letterSpacing: "0.08em" }}
        >
          FUSION MATRIX
        </h1>
        <p className="text-sm mb-12 max-w-lg text-center" style={{ color: "var(--ink-secondary)" }}>
          Transcend mortal limits. Select a target at max level, then sacrifice{" "}
          {currentStar > 1 ? currentStar : ""} same-star companions to increase its potential.
          Consumed monsters are lost forever.
        </p>

        {/* The Matrix */}
        <div className="relative w-full max-w-2xl flex flex-col items-center mb-12">
          {/* Target Slot */}
          <div className="relative z-20 mb-12">
            <p className="text-center t-label mb-3" style={{ color: "var(--gold-bright)" }}>
              TARGET VESSEL
            </p>
            {targetMonster ? (
              <div
                className="ss-card text-center w-40 p-4 relative cursor-pointer hover:scale-105 transition-transform"
                style={{ borderColor: "var(--gold-bright)", boxShadow: "0 0 30px rgba(0,240,255,0.2)" }}
                onClick={() => setSelectingMode("target")}
              >
                <div
                  className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center font-bold bg-[var(--bg-stage)] border-2"
                  style={{ borderRadius: 0, fontFamily: "var(--ss-font-pixel)", borderColor: "var(--gold-bright)", color: "var(--gold-bright)" }}
                >
                  {currentStar}★
                </div>
                <div className="w-24 h-24 mx-auto mb-3 flex items-center justify-center overflow-hidden ss-pane">
                  <img
                    src={
                      targetMonster.monster.art_url ||
                      `/sprites/monsters/${targetMonster.monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
                    }
                    className="w-full h-full object-cover"
                    alt={targetMonster.monster.name}
                    onError={(e) => {
                      e.currentTarget.src = "/monsters/placeholder.png";
                    }}
                  />
                </div>
                <p className="t-label truncate" style={{ color: "var(--ink-primary)" }}>
                  {targetMonster.monster.name}
                </p>
                <p className="text-[11px]" style={{ color: "#8a6d3b" }}>
                  Level {targetMonster.level}
                </p>
              </div>
            ) : (
              <button
                onClick={() => setSelectingMode("target")}
                className="p-4 border-2 border-dashed w-40 h-48 flex flex-col items-center justify-center transition-colors"
                style={{ borderColor: "var(--gold-bright)", color: "var(--gold-bright)", borderRadius: 0, fontFamily: "var(--ss-font-pixel)" }}
              >
                <span className="text-4xl mb-2">+</span>
                <span className="text-[10px] font-bold">SELECT TARGET</span>
              </button>
            )}
          </div>

          {/* Fodder Slots */}
          {targetMonster && (
            <div className="w-full">
              <p className="text-center t-label mb-4" style={{ color: "var(--danger)" }}>
                SACRIFICE ({fodderIds.filter(Boolean).length}/{requiredFodderCount})
              </p>
              <div className="flex flex-wrap gap-4 justify-center relative">
                {/* Connecting Lines (CSS trick) */}
                <div className="absolute -top-12 left-1/2 w-px h-12 bg-gradient-to-b from-cyan-500/50 to-red-500/50 -translate-x-1/2 -z-10" />

                {fodderIds.map((slotId, i) => {
                  const um = slotId
                    ? userMonsters.find((m: FusionMonster) => m.id === slotId)
                    : null;
                  if (um) {
                    const r = um.monster.rarity as Rarity;
                    return (
                      <div
                        key={i}
                        className="ss-card text-center w-28 p-2 relative group cursor-pointer hover:border-red-500/50 transition-colors"
                        style={{ borderColor: RARITY_COLOR[r] }}
                        onClick={() => {
                          setFodderSlotIndex(i);
                          setSelectingMode("fodder");
                        }}
                      >
                        <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center overflow-hidden ss-pane grayscale group-hover:grayscale-0 transition-all">
                          <img
                            src={
                              um.monster.art_url ||
                              `/sprites/monsters/${um.monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
                            }
                            className="w-full h-full object-cover"
                            alt={um.monster.name}
                            onError={(e) => {
                              e.currentTarget.src = "/monsters/placeholder.png";
                            }}
                          />
                        </div>
                        <p className="text-[11px] truncate" style={{ color: "var(--ink-primary)" }}>
                          {um.monster.name}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const n = [...fodderIds];
                            n[i] = null;
                            setFodderIds(n);
                          }}
                          className="absolute -top-2 -right-2 bg-red-900 text-red-100 w-5 h-5 flex items-center justify-center text-[11px] font-bold border border-red-500 hover:bg-red-500"
                          style={{ borderRadius: 0 }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setFodderSlotIndex(i);
                        setSelectingMode("fodder");
                      }}
                      className="p-2 border-2 border-dashed w-28 h-32 flex flex-col items-center justify-center transition-colors"
                      style={{ borderColor: "var(--danger)", color: "var(--danger)", opacity: 0.6, borderRadius: 0, fontFamily: "var(--ss-font-pixel)" }}
                    >
                      <span className="text-2xl mb-1">+</span>
                      <span className="text-[11px] uppercase tracking-widest">
                        {currentStar}★ Fodder
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Bar */}
        {targetMonster && (
          <div className="flex flex-col items-center mt-8">
            <p
              className="text-xs mb-3 font-serif"
              style={{ color: hasGold ? "var(--gold-bright)" : "var(--danger)" }}
            >
              Synthesis Cost: {cost} Gold
            </p>
            <button
              disabled={!isReady || !hasGold || synthesizeMut.isPending}
              onClick={() => synthesizeMut.mutate()}
              className="ss-btn ss-btn-d-primary px-12 py-4 text-lg tracking-widest uppercase font-bold flex items-center gap-2"
              style={isReady && hasGold ? { boxShadow: "0 0 20px rgba(0,240,255,0.4)" } : {}}
            >
              {synthesizeMut.isPending ? "Synthesizing..." : "Synthesize"}
            </button>
            {!isReady && (
              <p className="text-[11px] mt-3" style={{ color: "var(--ink-secondary)" }}>
                Must fill all sacrifice slots to proceed.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Monster Selector Modal */}
      {selectingMode !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center ss-modal-backdrop"
          onClick={() => setSelectingMode(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="ss-modal max-w-2xl w-full max-h-[80vh] flex flex-col"
          >
            <h3
              className="t-h3 text-xl font-bold mb-4"
              style={{ color: selectingMode === "target" ? "var(--gold-bright)" : "var(--danger)" }}
            >
              {selectingMode === "target"
                ? "Select Target Vessel"
                : `Select ${currentStar}★ Sacrifice`}
            </h3>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 overflow-y-auto pr-2 pb-4">
              {userMonsters
                .filter((um: FusionMonster) => {
                  if (usedIds.has(um.id)) return false;
                  const umStar = um.current_star ?? um.star_level ?? 1;
                  if (selectingMode === "target") {
                    // Can only target monsters that aren't at ultimate limit
                    return umStar < 10;
                  } else {
                    // Can only use fodder of exact same star level
                    return umStar === currentStar && !um.is_locked;
                  }
                })
                .map((um: FusionMonster) => {
                  const umStar = um.current_star ?? um.star_level ?? 1;
                  const r = um.monster.rarity as Rarity;
                  return (
                    <button
                      key={um.id}
                      onClick={() => {
                        if (selectingMode === "target") {
                          setTargetId(um.id);
                          setFodderIds([]); // reset fodder when target changes
                        } else {
                          const n = [...fodderIds];
                          n[fodderSlotIndex] = um.id;
                          setFodderIds(n);
                        }
                        setSelectingMode(null);
                      }}
                      className="ss-card p-2 text-center hover:scale-[1.05] transition-all relative"
                      style={{ borderColor: `${RARITY_COLOR[r]}40` }}
                    >
                      <div
                        className="absolute top-1 right-1 text-[11px] font-bold z-10 drop-shadow-md"
                        style={{ color: "var(--gold-bright)" }}
                      >
                        {umStar}★
                      </div>
                      <div className="w-full aspect-square mb-1 flex items-center justify-center overflow-hidden ss-pane">
                        <img
                          src={
                            um.monster.art_url ||
                            `/sprites/monsters/${um.monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
                          }
                          className="w-full h-full object-cover"
                          alt={um.monster.name}
                          onError={(e) => {
                            e.currentTarget.src = "/monsters/placeholder.png";
                          }}
                        />
                      </div>
                      <p
                        className="text-[11px] font-bold truncate"
                        style={{ color: "var(--ink-primary)" }}
                      >
                        {um.monster.name}
                      </p>
                      <p className="text-[11px]" style={{ color: "var(--ink-secondary)" }}>
                        Lvl {um.level}
                      </p>
                    </button>
                  );
                })}
            </div>
            {userMonsters.filter((um: FusionMonster) => {
              if (usedIds.has(um.id)) return false;
              const umStar = um.current_star ?? um.star_level ?? 1;
              if (selectingMode === "target") return umStar < 10;
              return umStar === currentStar && !um.is_locked;
            }).length === 0 && (
              <div className="p-8 text-center">
                <EmptyState
                  icon="sparkle"
                  title="No available monsters."
                  body={
                    selectingMode === "target"
                      ? "You have no monsters available to evolve."
                      : `You have no ${currentStar}★ monsters available to sacrifice.`
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
