import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { AppShell } from "@/components/game/AppShell";
import { Icon } from "@/components/ui/Icon";
import { getMyProfile, listBanners, pullBanner } from "@/lib/game/supabase-api";
import { RARITY_COLOR, type Rarity } from "@/lib/game/gacha.constants";
import { SummonReveal, SummonResults, type PullResultData } from "@/components/game/SummonReveal";

export const Route = createFileRoute("/_authenticated/altar")({
  head: () => ({ meta: [{ title: "Resonance Array — SummonScroll" }] }),
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

type Banner = {
  id: string;
  name: string;
  banner_type?: string;
  pull_cost_crystals: number;
  pull_cost_seals?: number;
  pull_cost_10_crystals: number;
  realms?: { icon: string; name: string };
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

  const bannersData = bannersQ.data?.banners as Banner[] | undefined;

  const selectedBanner = React.useMemo(() => {
    if (!bannersData || bannersData.length === 0) return null;
    return bannersData.find((b) => b.id === selectedBannerId) ?? bannersData[0];
  }, [bannersData, selectedBannerId]);

  if (profileQ.isLoading || bannersQ.isLoading)
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        Loading the Soul Resonance Array…
      </div>
    );
  if (!profileQ.data || !bannersQ.data) return null;

  const profile = profileQ.data.profile;
  const banners = bannersData as Banner[];

  if (isSynthesizing) {
    return (
      <AppShell profile={profile}>
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--bg-deep)]">
          {/* Holographic Rift Animation */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -90 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 2.8, ease: "easeInOut" }}
            className="w-40 h-40 rounded-full border-t-[6px] border-b-[6px] border-[#c89a3e] border-l-[2px] border-r-[2px] border-l-[#b8860b] border-r-[#b8860b] shadow-[0_0_60px_rgba(200,154,62,0.4),inset_0_0_40px_rgba(184,134,11,0.3)]"
          />
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "100vh", opacity: [0, 0.5, 0] }}
            transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
            className="absolute w-[2px] bg-[#c89a3e] shadow-[0_0_20px_rgba(200,154,62,0.4)]"
          />
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0, 1, 1] }}
            transition={{ duration: 3, times: [0, 0.2, 0.4, 0.6, 1] }}
            className="absolute mt-64 text-4xl font-['VT323'] text-[#c89a3e] tracking-[0.5em] uppercase"
            style={{ textShadow: "0 0 15px rgba(200,154,62,0.4)" }}
          >
            Synthesizing
          </motion.h2>
          {/* CRT Overlay just for the cutscene */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(200,154,62,0)_50%,rgba(200,154,62,0.03)_50%)] bg-[length:100%_4px]" />
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
        <SummonResults results={pullResults} onFinish={() => setPullResults(null)} />
      </AppShell>
    );
  }

  return (
    <AppShell profile={profile}>
      <div className="relative w-full h-screen overflow-hidden flex flex-col md:flex-row text-[var(--ink-secondary)]">
        {/* Full Screen Banner Background (Placeholder) */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(200,154,62,0.08)_0%,rgba(250,246,240,0.95)_100%)]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-color-dodge" />
          {/* A massive magical summoning circle suggestion in the background */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-[#c89a3e]/10 shadow-[inset_0_0_100px_rgba(200,154,62,0.03)] pointer-events-none"
          />
        </div>

        {/* Left Side: Banner Selection (Vertical Tabs) */}
        <div className="relative z-10 w-full md:w-[320px] p-6 md:pt-24 flex flex-col gap-3 md:border-r border-[var(--gold-bright)]/30 bg-[var(--bg-stage)]/80">
          <div
            className="w-16 h-16 flex items-center justify-center mb-3"
            style={{
              border: "2px solid rgba(127,119,221,0.3)",
              borderRadius: 0,
              background: "rgba(127,119,221,0.06)",
              boxShadow: "3px 3px 0 rgba(0,0,0,0.4)",
            }}
          >
            <Icon name="altar" size={28} color="var(--violet)" />
          </div>
          <h1
            className="text-2xl font-bold mb-8"
            style={{
              fontFamily: "var(--ss-font-pixel)",
              color: "var(--gold-bright)",
              letterSpacing: "0.08em",
            }}
          >
            SOUL RESONANCE ARRAY
          </h1>
          {/* Ritual Incubation tracker */}
          {(() => {
            const p = profile as Record<string, unknown>;
            const el = (p.ritual_incubation_element as string | null) ?? null;
            const days = (p.ritual_incubation_day_count as number | null) ?? 0;
            const ELEMENT_COLOR: Record<string, string> = {
              fire: "#ff5e2a",
              water: "#38b8f5",
              nature: "#3ed97a",
              light: "#ffe066",
              dark: "#c47fff",
              arcane: "#c89a3e",
            };
            const elColor = el ? (ELEMENT_COLOR[el] ?? "#c89a3e") : "#c89a3e";
            const pct = Math.min(100, (days / 7) * 100);
            return (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span
                    style={{
                      fontFamily: "var(--ss-font-pixel)",
                      fontSize: 9,
                      color: "var(--ink-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    🔮 Ritual Incubation
                  </span>
                  <span style={{ fontFamily: "var(--ss-font-pixel)", fontSize: 9, color: elColor }}>
                    {days}/7 days
                  </span>
                </div>
                <div className="ss-ritual-bar">
                  <div
                    className="ss-ritual-bar-fill"
                    style={{ width: `${pct}%`, background: elColor }}
                  />
                </div>
                {el && (
                  <div
                    style={{
                      fontFamily: "var(--ss-font-pixel)",
                      fontSize: 9,
                      color: elColor,
                      marginTop: 3,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Element: {el} —{" "}
                    {days >= 7 ? "★ Guaranteed pull ready!" : `${7 - days} days remaining`}
                  </div>
                )}
                {!el && (
                  <div
                    style={{
                      fontFamily: "var(--ss-font-pixel)",
                      fontSize: 8,
                      color: "var(--ink-tertiary)",
                      marginTop: 3,
                    }}
                  >
                    Tag tasks with an element to begin incubation
                  </div>
                )}
              </div>
            );
          })()}

          <div className="flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-4 md:pb-0">
            {banners.map((b, i) => {
              const isActive = selectedBanner?.id === b.id;
              return (
                <motion.button
                  key={b.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                  onClick={() => setSelectedBannerId(b.id)}
                  className={`relative flex items-center justify-start px-6 py-4 border-2 transition-all duration-150 overflow-hidden group min-w-[200px]`}
                  style={{
                    borderRadius: 0,
                    background: isActive ? "var(--bg-panel)" : "var(--bg-pane)",
                    borderColor: isActive ? "var(--gold-bright)" : "rgba(200,154,62,0.1)",
                    boxShadow: isActive ? "4px 4px 0 rgba(0,0,0,0.4)" : "2px 2px 0 rgba(0,0,0,0.2)",
                  }}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-[var(--gold-bright)] shadow-[0_0_15px_#d4af3f]" />
                  )}
                  <span
                    className={`font-serif font-bold tracking-widest uppercase text-sm ${isActive ? "text-[var(--gold-bright)]" : "text-[var(--ink-tertiary)] group-hover:text-[var(--gold-bright)]"}`}
                  >
                    {b.name}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Right Side: The Featured Banner & Summoning Buttons */}
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
            const iconColor = isPactSeal ? "var(--violet)" : "var(--gold-bright)";
            const canPull1 = balance >= cost1;
            const canPull10 = balance >= cost10;

            return (
              <div className="relative flex-1 flex flex-col justify-end p-8 md:p-16 z-10">
                {/* Featured Character / Title Floating in the void */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full px-8 pointer-events-none">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    key={selectedBanner.id}
                  >
                    <div className="text-[8rem] leading-none opacity-5 absolute left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif font-bold text-[var(--ink-secondary)] mix-blend-overlay blur-sm">
                      {selectedBanner.realms?.icon ?? "✦"}
                    </div>
                    <h2 className="text-5xl md:text-7xl font-serif font-bold italic tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-[#3d2e1e] to-[#8b7355] drop-shadow-[0_0_30px_rgba(200,154,62,0.2)]">
                      {selectedBanner.name}
                    </h2>
                    <p className="text-xl md:text-2xl mt-4 text-[#c89a3e] tracking-[0.2em] font-serif">
                      {selectedBanner.realms?.name ?? "ALL REALMS ALLOWED"}
                    </p>
                  </motion.div>
                </div>

                {/* The Tactile Gacha Control Panel at the bottom */}
                <div className="relative w-full max-w-4xl mx-auto flex flex-col items-end gap-6 mt-auto">
                  {/* Currency Display */}
                  <div
                    className="border px-6 py-3 flex items-center gap-3"
                    style={{
                      borderColor: "rgba(200,154,62,0.15)",
                      borderRadius: 0,
                      background: "rgba(12,10,6,0.7)",
                      boxShadow: "3px 3px 0 rgba(0,0,0,0.4)",
                    }}
                  >
                    <span
                      className="text-[9px] uppercase font-bold"
                      style={{
                        fontFamily: "var(--ss-font-pixel)",
                        color: "var(--ink-on-dark-muted)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Resonance Balance
                    </span>
                    <div
                      className={`flex items-center gap-2 text-xl font-serif font-bold ${canPull1 ? "text-[var(--ink-on-dark)]" : "text-red-500"}`}
                    >
                      <Icon
                        name={icon as React.ComponentProps<typeof Icon>["name"]}
                        size={20}
                        color={iconColor}
                      />
                      {balance.toLocaleString()}
                    </div>
                  </div>

                  {/* Runic Rounded Action Buttons */}
                  <div className="flex gap-4 w-full md:w-auto">
                    {/* Pull x1 */}
                    <button
                      onClick={() => pullMut.mutate({ bannerId: selectedBanner.id, count: 1 })}
                      disabled={!canPull1 || pullMut.isPending}
                      className="relative flex-1 md:w-[220px] h-[80px] group disabled:opacity-50 transition-all overflow-hidden border-2 border-[var(--gold-glow)]/40 hover:border-[var(--gold-bright)]/60 bg-[var(--bg-panel)]"
                      style={{ borderRadius: 0, boxShadow: "4px 4px 0 rgba(0,0,0,0.4)" }}
                    >
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none" />
                      <div className="relative h-full flex flex-col items-center justify-center font-serif font-bold tracking-widest">
                        <span className="text-[var(--ink-secondary)] group-hover:text-[var(--gold-bright)] text-lg transition-colors">
                          PULL ×1
                        </span>
                        <div className="flex items-center gap-1.5 text-[var(--ink-tertiary)] text-sm mt-1">
                          <Icon
                            name={icon as React.ComponentProps<typeof Icon>["name"]}
                            size={14}
                            color={iconColor}
                          />{" "}
                          {cost1}
                        </div>
                      </div>
                    </button>

                    {/* Pull x10 - Premium Button */}
                    <button
                      onClick={() => pullMut.mutate({ bannerId: selectedBanner.id, count: 10 })}
                      disabled={!canPull10 || pullMut.isPending}
                      className="relative flex-[1.5] md:w-[320px] h-[80px] group disabled:opacity-50 transition-all overflow-hidden border-2 border-[var(--gold-glow)] bg-gradient-to-r from-[#c89a3e] to-[#e8c55a] text-[var(--ink-primary)]"
                      style={{ borderRadius: 0, boxShadow: "4px 4px 0 rgba(0,0,0,0.5)" }}
                    >
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none mix-blend-overlay" />

                      {/* Shine sweep */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/20 to-transparent -translate-x-full group-hover:animate-shimmer" />

                      <div className="relative h-full flex flex-col items-center justify-center font-serif font-bold tracking-widest">
                        <span className="text-[var(--ink-primary)] text-2xl">★ PULL ×10 ★</span>
                        <div className="flex items-center gap-2 text-[var(--ink-primary)]/85 text-base mt-1">
                          <Icon
                            name={icon as React.ComponentProps<typeof Icon>["name"]}
                            size={16}
                            color={iconColor}
                          />{" "}
                          {cost10}
                        </div>
                      </div>
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
