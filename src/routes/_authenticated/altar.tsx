import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { AppShell } from "@/components/game/AppShell";
import { Icon } from "@/components/ui/Icon";
import { getMyProfile, listBanners, pullBanner } from "@/lib/game/supabase-api";
import { RARITY_COLOR, RARITY_GLOW, RARITY_ORDER, type Rarity } from "@/lib/game/gacha.constants";
import { SummonReveal, SummonResults, type PullResultData } from "@/components/game/SummonReveal";

export const Route = createFileRoute("/_authenticated/altar")({
  head: () => ({ meta: [{ title: "Altar — SummonScroll" }] }),
  component: AltarPage,
});

type PullResult = {
  monster: {
    id: string;
    name: string;
    rarity: Rarity;
    role: string;
    element: string;
    artUrl: string | null;
    realmSkill: string | null;
  };
  isNew: boolean;
  transcendenceStone: boolean;
};

function AltarPage() {
  const qc = useQueryClient();
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const bannersQ = useQuery({ queryKey: ["banners"], queryFn: () => listBanners() });
  const [selectedBannerId, setSelectedBannerId] = useState<string | null>(null);
  const [pullResults, setPullResults] = useState<PullResult[] | null>(null);
  const [revealIndex, setRevealIndex] = useState(0);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const pullMut = useMutation({
    mutationFn: async (v: { bannerId: string; count: 1 | 10 }) => pullBanner(v.bannerId, v.count),
    onSuccess: (res) => {
      setIsSynthesizing(true);
      setTimeout(() => {
        setIsSynthesizing(false);
        setPullResults(res.results as PullResultData[]);
        setRevealIndex(0);
      }, 3000);
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (profileQ.isLoading || bannersQ.isLoading)
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        Loading the Altar…
      </div>
    );
  if (!profileQ.data || !bannersQ.data) return null;

  const profile = profileQ.data.profile;
  const banners = bannersQ.data.banners;
  const selectedBanner = banners.find((b: any) => b.id === selectedBannerId) ?? banners[0];

  if (isSynthesizing) {
    return (
      <AppShell profile={profile}>
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050a14]">
          {/* Holographic Rift Animation */}
          <motion.div 
            initial={{ scale: 0, opacity: 0, rotate: -90 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 2.8, ease: "easeInOut" }}
            className="w-40 h-40 rounded-full border-t-[6px] border-b-[6px] border-cyan-400 border-l-[2px] border-r-[2px] border-l-fuchsia-500 border-r-fuchsia-500 shadow-[0_0_60px_rgba(0,229,255,0.6),inset_0_0_40px_rgba(213,0,249,0.4)]"
          />
          <motion.div
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: "100vh", opacity: [0, 0.5, 0] }}
             transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
             className="absolute w-[2px] bg-cyan-300 shadow-[0_0_20px_#00e5ff]"
          />
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0, 1, 1] }}
            transition={{ duration: 3, times: [0, 0.2, 0.4, 0.6, 1] }}
            className="absolute mt-64 text-4xl font-['VT323'] text-cyan-400 tracking-[0.5em] uppercase"
            style={{ textShadow: "0 0 15px #00e5ff" }}
          >
            Synthesizing
          </motion.h2>
          {/* CRT Overlay just for the cutscene */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,229,255,0)_50%,rgba(0,229,255,0.05)_50%)] bg-[length:100%_4px]" />
        </div>
      </AppShell>
    );
  }

  if (pullResults) {
    const allRevealed = revealIndex >= pullResults.length - 1;
    if (!allRevealed) {
      return (
        <AppShell profile={profile}>
          <SummonReveal
            current={pullResults[revealIndex]}
            currentIndex={revealIndex}
            total={pullResults.length}
            onNext={() => setRevealIndex((i) => Math.min(i + 1, pullResults.length - 1))}
          />
        </AppShell>
      );
    }
    return (
      <AppShell profile={profile}>
        <SummonResults
          results={pullResults}
          onFinish={() => setPullResults(null)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell profile={profile}>
      <div className="bg-atmos bg-atmos-altar p-6 md:p-10 max-w-6xl min-h-screen">
        <h1 className="t-h1 text-3xl mb-2 text-gold-bright">The Altar</h1>
        <p className="text-sm mb-8" style={{ color: "var(--ink-secondary)" }}>
          Spend Crystals to summon monsters.
        </p>
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2" role="tablist">
          {banners.map((b: { id: string; name: string }) => (
            <button
              key={b.id}
              role="tab"
              onClick={() => setSelectedBannerId(b.id)}
              className={`ss-btn whitespace-nowrap ${selectedBanner?.id === b.id ? "ss-btn-d-primary" : "ss-btn-secondary"}`}
            >
              {b.name}
            </button>
          ))}
        </div>
        {selectedBanner &&
          (() => {
            const isPactSeal = selectedBanner.banner_type === "pact_seal";
            const cost1 = isPactSeal
              ? (selectedBanner.pull_cost_seals ?? 1)
              : selectedBanner.pull_cost_crystals;
            const cost10 = isPactSeal
              ? (selectedBanner.pull_cost_seals ?? 1) * 10
              : selectedBanner.pull_cost_10_crystals;
            const balance = isPactSeal ? profile.pact_seals : profile.crystals;
            const icon = isPactSeal ? "seal" : "crystal";
            const iconColor = isPactSeal ? "var(--violet)" : "var(--cyan)";
            return (
              <div className="ss-card-hero overflow-hidden">
                <div
                  className="relative h-48 flex items-end p-6 overflow-hidden"
                  style={{
                    background:
                      `radial-gradient(120% 90% at 80% 10%, ${iconColor}22 0%, transparent 55%), linear-gradient(180deg, rgba(255,213,79,0.10) 0%, var(--bg-stage) 70%, var(--bg-pane) 100%)`,
                  }}
                >
                  {/* large faded realm glyph watermark */}
                  <div
                    className="absolute -right-4 -top-6 select-none pointer-events-none"
                    style={{ fontSize: "9rem", opacity: 0.08, lineHeight: 1 }}
                    aria-hidden
                  >
                    {selectedBanner.realms?.icon ?? "✦"}
                  </div>
                  {/* concentric summon-ring suggestion */}
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      right: "1.5rem", top: "50%", transform: "translateY(-50%)",
                      width: 140, height: 140, borderRadius: "9999px",
                      border: `1px solid ${iconColor}33`,
                      boxShadow: `inset 0 0 40px ${iconColor}18, 0 0 24px ${iconColor}14`,
                    }}
                  />
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      right: "2.6rem", top: "50%", transform: "translateY(-50%)",
                      width: 92, height: 92, borderRadius: "9999px",
                      border: `1px solid ${iconColor}22`,
                    }}
                  />
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--gold-glow)] to-transparent opacity-60" />
                  <div className="relative">
                    <h2 className="t-h2 mb-1" style={{ color: "var(--gold-bright)" }}>
                      {selectedBanner.name}
                    </h2>
                    <p className="text-sm flex items-center gap-1.5" style={{ color: "var(--ink-secondary)" }}>
                      <span style={{ fontSize: "1rem" }}>{selectedBanner.realms?.icon}</span>
                      {selectedBanner.realms?.name ?? "All Realms"}
                    </p>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="text-sm" style={{ color: "var(--ink-secondary)" }}>
                    Balance:{" "}
                    <span
                      className="font-bold text-base flex items-center gap-1 inline-flex"
                      style={{ color: balance >= cost1 ? "var(--gold-bright)" : "var(--danger)" }}
                    >
                      <Icon name={icon as any} size={14} color={iconColor} />{" "}
                      {balance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => pullMut.mutate({ bannerId: selectedBanner.id, count: 1 })}
                      disabled={balance < cost1 || pullMut.isPending}
                      className="ss-btn ss-btn-secondary flex-1"
                    >
                      Pull ×1 — {cost1} <Icon name={icon as any} size={12} color={iconColor} />
                    </button>
                    <button
                      onClick={() => pullMut.mutate({ bannerId: selectedBanner.id, count: 10 })}
                      disabled={balance < cost10 || pullMut.isPending}
                      className="ss-btn ss-btn-d-primary flex-[2] disabled:opacity-40"
                      style={{
                        boxShadow: balance >= cost10 ? "0 0 24px rgba(255,213,79,0.3)" : "none",
                      }}
                    >
                      {pullMut.isPending ? (
                        "Summoning…"
                      ) : (
                        <span className="flex items-center gap-1">
                          ★ Pull ×10 — {cost10}{" "}
                          <Icon name={icon as any} size={12} color={iconColor} /> ★
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
      </div>
    </AppShell>
  );
}
