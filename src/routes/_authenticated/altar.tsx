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
      <div className="relative w-full h-screen overflow-hidden flex flex-col md:flex-row text-white">
        
        {/* Full Screen Banner Background (Placeholder) */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.15)_0%,rgba(5,10,20,0.9)_100%)]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-color-dodge" />
          {/* A massive magical summoning circle suggestion in the background */}
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-cyan-500/10 shadow-[inset_0_0_100px_rgba(0,240,255,0.05)] pointer-events-none"
          />
        </div>

        {/* Left Side: Banner Selection (Vertical Tabs) */}
        <div className="relative z-10 w-full md:w-[320px] p-6 md:pt-24 flex flex-col gap-3 md:border-r border-cyan-500/20 bg-black/40 backdrop-blur-md">
          <h1 className="text-4xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-br from-white to-cyan-400 tracking-widest drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]">
            THE ALTAR
          </h1>
          <div className="flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-4 md:pb-0">
            {banners.map((b: { id: string; name: string }) => {
              const isActive = selectedBanner?.id === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBannerId(b.id)}
                  className={`relative flex items-center justify-start px-6 py-4 rounded-xl transition-all duration-300 overflow-hidden group min-w-[200px] ${
                    isActive 
                      ? "bg-cyan-950/60 border border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.3)] scale-105" 
                      : "bg-black/40 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-950/20"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-cyan-400 shadow-[0_0_15px_#00f0ff]" />
                  )}
                  <span className={`font-black tracking-widest uppercase text-sm ${isActive ? "text-white" : "text-slate-400 group-hover:text-cyan-100"}`}>
                    {b.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: The Featured Banner & Summoning Buttons */}
        {selectedBanner && (() => {
          const isPactSeal = selectedBanner.banner_type === "pact_seal";
          const cost1 = isPactSeal ? (selectedBanner.pull_cost_seals ?? 1) : selectedBanner.pull_cost_crystals;
          const cost10 = isPactSeal ? (selectedBanner.pull_cost_seals ?? 1) * 10 : selectedBanner.pull_cost_10_crystals;
          const balance = isPactSeal ? profile.pact_seals : profile.crystals;
          const icon = isPactSeal ? "seal" : "crystal";
          const iconColor = isPactSeal ? "#d946ef" : "#00f0ff"; // fuchsia or cyan
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
                  <div className="text-[8rem] leading-none opacity-5 absolute left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-white mix-blend-overlay blur-sm">
                    {selectedBanner.realms?.icon ?? "✦"}
                  </div>
                  <h2 className="text-5xl md:text-7xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                    {selectedBanner.name}
                  </h2>
                  <p className="text-xl md:text-2xl mt-4 text-cyan-400 tracking-[0.2em] font-mono">
                    {selectedBanner.realms?.name ?? "ALL REALMS ALLOWED"}
                  </p>
                </motion.div>
              </div>

              {/* The Tactile Gacha Control Panel at the bottom */}
              <div className="relative w-full max-w-4xl mx-auto flex flex-col items-end gap-6 mt-auto">
                
                {/* Currency Display */}
                <div className="bg-black/60 backdrop-blur-md border border-white/10 px-6 py-3 rounded-xl flex items-center gap-3">
                  <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Resonance Balance</span>
                  <div className={`flex items-center gap-2 text-xl font-black ${canPull1 ? 'text-white' : 'text-red-500'}`}>
                    <Icon name={icon as any} size={20} color={iconColor} />
                    {balance.toLocaleString()}
                  </div>
                </div>

                {/* Skewed Action Buttons */}
                <div className="flex gap-4 w-full md:w-auto">
                  
                  {/* Pull x1 */}
                  <button
                    onClick={() => pullMut.mutate({ bannerId: selectedBanner.id, count: 1 })}
                    disabled={!canPull1 || pullMut.isPending}
                    className="relative flex-1 md:w-[220px] h-[80px] group disabled:opacity-50 transition-all active:scale-95"
                  >
                    {/* Skewed background layer */}
                    <div className="absolute inset-0 bg-slate-900 border-2 border-slate-700 group-hover:border-slate-500 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)]" style={{ clipPath: "polygon(15% 0, 100% 0, 85% 100%, 0% 100%)" }} />
                    <div className="relative h-full flex flex-col items-center justify-center font-black tracking-widest">
                      <span className="text-slate-300 text-lg">PULL ×1</span>
                      <div className="flex items-center gap-1.5 text-slate-400 text-sm mt-1">
                        <Icon name={icon as any} size={14} color={iconColor} /> {cost1}
                      </div>
                    </div>
                  </button>

                  {/* Pull x10 - Premium Button */}
                  <button
                    onClick={() => pullMut.mutate({ bannerId: selectedBanner.id, count: 10 })}
                    disabled={!canPull10 || pullMut.isPending}
                    className="relative flex-[1.5] md:w-[320px] h-[80px] group disabled:opacity-50 transition-all active:scale-95"
                  >
                    {/* Glowing Skewed background layer */}
                    <div className="absolute inset-0 bg-cyan-950 border-2 border-cyan-400 group-hover:bg-cyan-900 transition-colors shadow-[0_0_30px_rgba(0,240,255,0.4)]" style={{ clipPath: "polygon(10% 0, 100% 0, 90% 100%, 0% 100%)" }} />
                    
                    {/* Shine sweep */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" style={{ clipPath: "polygon(10% 0, 100% 0, 90% 100%, 0% 100%)" }} />

                    <div className="relative h-full flex flex-col items-center justify-center font-black tracking-widest">
                      <span className="text-white text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">★ PULL ×10 ★</span>
                      <div className="flex items-center gap-2 text-cyan-100 text-base mt-1">
                        <Icon name={icon as any} size={16} color={iconColor} /> {cost10}
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
