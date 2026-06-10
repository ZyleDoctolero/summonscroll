import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/game/AppShell";
import { getMyProfile, listBanners, pullBanner } from "@/lib/game/supabase-api";
import { RARITY_COLOR, RARITY_GLOW, RARITY_ORDER, type Rarity } from "@/lib/game/gacha.constants";

export const Route = createFileRoute("/_authenticated/altar")({
  head: () => ({ meta: [{ title: "Altar — SummonScroll" }] }),
  component: AltarPage,
});

type PullResult = { monster: { id: string; name: string; rarity: Rarity; role: string; element: string; artUrl: string | null; realmSkill: string | null }; isNew: boolean; transcendenceStone: boolean };

function AltarPage() {
  const qc = useQueryClient();
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const bannersQ = useQuery({ queryKey: ["banners"], queryFn: () => listBanners() });
  const [selectedBannerId, setSelectedBannerId] = useState<string | null>(null);
  const [pullResults, setPullResults] = useState<PullResult[] | null>(null);
  const [revealIndex, setRevealIndex] = useState(0);

  const pullMut = useMutation({
    mutationFn: async (v: { bannerId: string; count: 1 | 10 }) => pullBanner(v.bannerId, v.count),
    onSuccess: (res) => { setPullResults(res.results as PullResult[]); setRevealIndex(0); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (profileQ.isLoading || bannersQ.isLoading) return <div className="min-h-screen grid place-items-center" style={{ background: "#0C0E14", color: "#A09D96" }}>Loading the Altar…</div>;
  if (!profileQ.data || !bannersQ.data) return null;

  const profile = profileQ.data.profile;
  const banners = bannersQ.data.banners;
  const selectedBanner = banners.find((b: { id: string }) => b.id === selectedBannerId) ?? banners[0];

  if (pullResults) {
    const allRevealed = revealIndex >= pullResults.length - 1;
    if (!allRevealed) {
      const current = pullResults[revealIndex];
      const r = current.monster.rarity;
      return (
        <AppShell profile={profile}>
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer" style={{ background: "rgba(0,0,0,0.92)" }} onClick={() => setRevealIndex((i) => Math.min(i + 1, pullResults.length - 1))}>
            <div className="rounded-xl p-8 text-center max-w-xs" style={{ background: "#13161F", border: `2px solid ${RARITY_COLOR[r]}`, boxShadow: RARITY_GLOW[r] }}>
              <div className="w-40 h-40 mx-auto rounded-lg mb-4 flex items-center justify-center overflow-hidden" style={{ background: "#1A1E2A" }}>
                <img src="/monsters/placeholder.png" className="w-full h-full object-cover" alt="Monster" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: RARITY_COLOR[r], fontFamily: "'Cinzel',serif" }}>{current.monster.name}</h2>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase" style={{ background: `${RARITY_COLOR[r]}20`, color: RARITY_COLOR[r], border: `1px solid ${RARITY_COLOR[r]}60` }}>{r}</span>
              <p className="text-xs mt-2" style={{ color: "#A09D96" }}>{current.monster.element} · {current.monster.role}</p>
              {current.isNew && <p className="text-sm mt-2 font-medium" style={{ color: "#5FAD41" }}>✨ New!</p>}
              {current.transcendenceStone && <p className="text-sm mt-1" style={{ color: "#FFD54F" }}>🔮 Transcendence Stone</p>}
            </div>
            {pullResults.length > 1 && <div className="flex gap-1.5 mt-6">{pullResults.map((_, i) => <div key={i} className="w-2 h-2 rounded-full" style={{ background: i <= revealIndex ? "#FFD54F" : "rgba(255,255,255,0.1)" }} />)}</div>}
            <p className="mt-4 text-xs" style={{ color: "#6B6864" }}>Tap to continue</p>
          </div>
        </AppShell>
      );
    }
    const sorted = [...pullResults].sort((a, b) => RARITY_ORDER[b.monster.rarity] - RARITY_ORDER[a.monster.rarity]);
    return (
      <AppShell profile={profile}>
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.92)" }}>
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-center mb-6" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>Summon Results</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-w-2xl mx-auto">
              {sorted.map((res, i) => { const r = res.monster.rarity; return (
                <div key={i} className="rounded-lg p-3 text-center" style={{ background: "#13161F", border: `1px solid ${RARITY_COLOR[r]}`, boxShadow: r !== "common" ? RARITY_GLOW[r] : undefined }}>
                  <div className="w-16 h-16 mx-auto rounded mb-2 flex items-center justify-center overflow-hidden" style={{ background: "#1A1E2A" }}>
                    <img src="/monsters/placeholder.png" className="w-full h-full object-cover" alt="Monster" />
                  </div>
                  <p className="text-xs font-bold truncate" style={{ color: "#F0EDE6", fontFamily: "'Cinzel',serif" }}>{res.monster.name}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ background: `${RARITY_COLOR[r]}20`, color: RARITY_COLOR[r] }}>{r}</span>
                  {res.isNew && <p className="text-[10px] mt-0.5" style={{ color: "#5FAD41" }}>New!</p>}
                </div>
              ); })}
            </div>
          </div>
          <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <button onClick={() => setPullResults(null)} className="w-full py-3 rounded-lg font-bold text-sm uppercase tracking-widest" style={{ background: "linear-gradient(135deg,#C89A3E,#FFD54F)", color: "#0C0E14" }}>Continue</button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell profile={profile}>
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>The Altar</h1>
        <p className="text-sm mb-8" style={{ color: "#A09D96" }}>Spend Crystals to summon monsters.</p>
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2" role="tablist">
          {banners.map((b: { id: string; name: string }) => (
            <button key={b.id} role="tab" onClick={() => setSelectedBannerId(b.id)}
              className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap"
              style={{ background: selectedBanner?.id === b.id ? "linear-gradient(135deg,#C89A3E,#FFD54F)" : "rgba(255,255,255,0.05)", color: selectedBanner?.id === b.id ? "#0C0E14" : "#A09D96" }}>{b.name}</button>
          ))}
        </div>
        {selectedBanner && (() => {
          const isPactSeal = selectedBanner.banner_type === "pact_seal";
          const cost1 = isPactSeal ? (selectedBanner.pull_cost_seals ?? 1) : selectedBanner.pull_cost_crystals;
          const cost10 = isPactSeal ? (selectedBanner.pull_cost_seals ?? 1) * 10 : selectedBanner.pull_cost_10_crystals;
          const balance = isPactSeal ? profile.pact_seals : profile.crystals;
          const icon = isPactSeal ? "🔑" : "💎";
          return (
            <div className="rounded-xl overflow-hidden border" style={{ background: "#13161F", borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="relative h-48 flex items-end p-6" style={{ background: "linear-gradient(180deg, rgba(200,154,62,0.15) 0%, #13161F 100%)" }}>
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C89A3E] to-transparent opacity-50" />
                <div>
                  <h2 className="text-2xl font-bold mb-1" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>{selectedBanner.name}</h2>
                  <p className="text-sm" style={{ color: "#A09D96" }}>{selectedBanner.realms?.icon} {selectedBanner.realms?.name ?? "All Realms"}</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-sm" style={{ color: "#A09D96" }}>Balance: <span className="font-bold text-base" style={{ color: balance >= cost1 ? "#FFD54F" : "#E05252", fontFamily: "'JetBrains Mono',monospace" }}>{icon} {balance.toLocaleString()}</span></div>
                <div className="flex gap-3">
                  <button onClick={() => pullMut.mutate({ bannerId: selectedBanner.id, count: 1 })} disabled={balance < cost1 || pullMut.isPending}
                    className="flex-1 py-3 rounded-lg font-bold text-sm uppercase tracking-widest disabled:opacity-40" style={{ background: "rgba(255,255,255,0.05)", color: "#F0EDE6", border: "1px solid rgba(255,255,255,0.1)" }}>Pull ×1 — {cost1}{icon}</button>
                  <button onClick={() => pullMut.mutate({ bannerId: selectedBanner.id, count: 10 })} disabled={balance < cost10 || pullMut.isPending}
                    className="flex-[2] py-4 rounded-lg font-bold text-sm uppercase tracking-widest disabled:opacity-40" style={{ background: balance >= cost10 ? "linear-gradient(135deg,#C89A3E,#FFD54F)" : "rgba(255,255,255,0.05)", color: balance >= cost10 ? "#0C0E14" : "#6B6864", boxShadow: balance >= cost10 ? "0 0 24px rgba(255,213,79,0.3)" : "none" }}>
                    {pullMut.isPending ? "Summoning…" : `★ Pull ×10 — ${cost10}${icon} ★`}</button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </AppShell>
  );
}
