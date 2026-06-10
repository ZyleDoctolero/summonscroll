import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/game/AppShell";
import { getMyProfile } from "@/lib/game/profile.functions";
import { listBanners, pullBanner, getPity } from "@/lib/game/gacha.functions";
import { RARITY_COLOR, RARITY_GLOW, RARITY_ORDER, type Rarity } from "@/lib/game/gacha.constants";

export const Route = createFileRoute("/_authenticated/altar")({
  head: () => ({ meta: [{ title: "Altar — SummonScroll" }] }),
  component: AltarPage,
});

function AltarPage() {
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const fetchBanners = useServerFn(listBanners);
  const doPull = useServerFn(pullBanner);

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const bannersQ = useQuery({ queryKey: ["banners"], queryFn: () => fetchBanners() });

  const [selectedBannerId, setSelectedBannerId] = useState<string | null>(null);
  const [pullResults, setPullResults] = useState<PullResult[] | null>(null);
  const [revealIndex, setRevealIndex] = useState(0);

  const pullMut = useMutation({
    mutationFn: async (v: any) => {
      return await doPull({ data: v });
    },
    onSuccess: (res) => {
      setPullResults(res.results as PullResult[]);
      setRevealIndex(0);
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["banners"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (profileQ.isLoading || bannersQ.isLoading) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: "#0C0E14", color: "#A09D96" }}>
        Loading the Altar…
      </div>
    );
  }

  if (!profileQ.data || !bannersQ.data) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: "#0C0E14", color: "#E05252" }}>
        Failed to load Altar.
      </div>
    );
  }

  const profile = profileQ.data.profile;
  const banners = bannersQ.data.banners;
  const selectedBanner = banners.find((b: any) => b.id === selectedBannerId) ?? banners[0];

  // If showing pull results
  if (pullResults) {
    return (
      <AppShell profile={profile}>
        <PullResultsView
          results={pullResults}
          revealIndex={revealIndex}
          onNext={() => setRevealIndex((i) => Math.min(i + 1, pullResults.length - 1))}
          onClose={() => setPullResults(null)}
          allRevealed={revealIndex >= pullResults.length - 1}
        />
      </AppShell>
    );
  }

  return (
    <AppShell profile={profile}>
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        {/* Header */}
        <h1
          className="text-3xl md:text-4xl font-bold mb-2"
          style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}
        >
          The Altar
        </h1>
        <p className="text-sm mb-8" style={{ color: "#A09D96" }}>
          Spend Spirit Crystals to summon monsters from across the 12 Realms.
        </p>

        {/* Banner tabs */}
        <div
          className="flex gap-2 mb-6 overflow-x-auto pb-2"
          role="tablist"
          aria-label="Banner selection"
        >
          {banners.map((banner: any) => (
            <button
              key={banner.id}
              role="tab"
              aria-selected={selectedBanner?.id === banner.id}
              onClick={() => setSelectedBannerId(banner.id)}
              className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all"
              style={{
                background: selectedBanner?.id === banner.id
                  ? "linear-gradient(135deg,#C89A3E,#FFD54F)"
                  : "rgba(255,255,255,0.05)",
                color: selectedBanner?.id === banner.id ? "#0C0E14" : "#A09D96",
                border: `1px solid ${selectedBanner?.id === banner.id ? "#FFD54F" : "rgba(255,255,255,0.07)"}`,
              }}
            >
              {banner.name}
            </button>
          ))}
        </div>

        {selectedBanner && (
          <BannerDisplay
            banner={selectedBanner as unknown as BannerData}
            profile={profile}
            pulling={pullMut.isPending}
            onPull={(count) => pullMut.mutate({ bannerId: selectedBanner.id, count })}
          />
        )}
      </div>
    </AppShell>
  );
}

// ─── Banner Display ─────────────────────────────────────────────────────────

type BannerData = {
  id: string;
  name: string;
  banner_type: string;
  pull_cost_gems: number;
  pull_cost_10_gems: number;
  pull_cost_seals: number | null;
  ends_at: string | null;
  realms: { name: string; icon: string } | null;
  featured_monster: { name: string; rarity: string } | null;
};

function BannerDisplay({
  banner,
  profile,
  pulling,
  onPull,
}: {
  banner: BannerData;
  profile: { gems: number; pact_seals: number };
  pulling: boolean;
  onPull: (count: 1 | 10) => void;
}) {
  const isPactSeal = banner.banner_type === "pact_seal";
  const cost1 = isPactSeal ? (banner.pull_cost_seals ?? 1) : banner.pull_cost_gems;
  const cost10 = isPactSeal ? (banner.pull_cost_seals ?? 1) * 10 : banner.pull_cost_10_gems;
  const balance = isPactSeal ? profile.pact_seals : profile.gems;
  const currencyIcon = isPactSeal ? "🔑" : "💎";
  const canPull1 = balance >= cost1;
  const canPull10 = balance >= cost10;

  return (
    <div
      className="rounded-xl overflow-hidden border"
      style={{ background: "#13161F", borderColor: "rgba(255,255,255,0.07)" }}
    >
      {/* Banner art area */}
      <div
        className="relative h-48 flex items-end p-6"
        style={{
          background: "linear-gradient(180deg, rgba(200,154,62,0.15) 0%, #13161F 100%)",
        }}
      >
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C89A3E] to-transparent opacity-50" />
        <div>
          <h2
            className="text-2xl font-bold mb-1"
            style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}
          >
            {banner.name}
          </h2>
          <div className="flex items-center gap-3 text-sm" style={{ color: "#A09D96" }}>
            {banner.realms && (
              <span>{banner.realms.icon} {banner.realms.name}</span>
            )}
            {banner.featured_monster && (
              <span
                className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{
                  background: `${RARITY_COLOR[banner.featured_monster.rarity as Rarity]}20`,
                  color: RARITY_COLOR[banner.featured_monster.rarity as Rarity],
                  border: `1px solid ${RARITY_COLOR[banner.featured_monster.rarity as Rarity]}40`,
                }}
              >
                Featured: {banner.featured_monster.name}
              </span>
            )}
            {banner.ends_at && (
              <span>Ends {new Date(banner.ends_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Currency & Pull buttons */}
      <div className="p-6 space-y-4">
        {/* Balance */}
        <div className="flex items-center gap-2 text-sm" style={{ color: "#A09D96" }}>
          <span>Your balance:</span>
          <span
            className="font-bold text-base"
            style={{
              color: canPull1 ? "#FFD54F" : "#E05252",
              fontFamily: "'JetBrains Mono',monospace",
            }}
          >
            {currencyIcon} {balance.toLocaleString()}
          </span>
        </div>

        {/* Pull buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onPull(1)}
            disabled={!canPull1 || pulling}
            className="flex-1 py-3 rounded-lg font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: canPull1 ? "#F0EDE6" : "#6B6864",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            Pull ×1 — {cost1}{currencyIcon}
          </button>
          <button
            onClick={() => onPull(10)}
            disabled={!canPull10 || pulling}
            className="flex-[2] py-4 rounded-lg font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: canPull10
                ? "linear-gradient(135deg,#C89A3E,#FFD54F)"
                : "rgba(255,255,255,0.05)",
              color: canPull10 ? "#0C0E14" : "#6B6864",
              boxShadow: canPull10 ? "0 0 24px rgba(255,213,79,0.3)" : "none",
            }}
          >
            {pulling ? "Summoning…" : `★ Pull ×10 — ${cost10}${currencyIcon} ★`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pull Results View ──────────────────────────────────────────────────────

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
  isPity: boolean;
  transcendenceStone: boolean;
};

function PullResultsView({
  results,
  revealIndex,
  onNext,
  onClose,
  allRevealed,
}: {
  results: PullResult[];
  revealIndex: number;
  onNext: () => void;
  onClose: () => void;
  allRevealed: boolean;
}) {
  if (!allRevealed) {
    // Individual reveal
    const current = results[revealIndex];
    const rarity = current.monster.rarity;
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer"
        style={{ background: "rgba(0,0,0,0.92)" }}
        onClick={onNext}
      >
        {/* Monster card */}
        <div
          className="rounded-xl p-8 text-center max-w-xs"
          style={{
            background: "#13161F",
            border: `2px solid ${RARITY_COLOR[rarity]}`,
            boxShadow: RARITY_GLOW[rarity],
          }}
        >
          {/* Monster portrait placeholder */}
          <div
            className="w-40 h-40 mx-auto rounded-lg mb-4 flex items-center justify-center text-6xl"
            style={{ background: "#1A1E2A" }}
          >
            {current.monster.artUrl ? (
              <img src={current.monster.artUrl} alt={current.monster.name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              "👾"
            )}
          </div>
          <h2
            className="text-2xl font-bold mb-2"
            style={{
              color: RARITY_COLOR[rarity],
              fontFamily: "'Cinzel',serif",
              textShadow: rarity === "ex" ? "0 0 24px rgba(255,255,255,0.8)" : undefined,
            }}
          >
            {current.monster.name}
          </h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{
                background: `${RARITY_COLOR[rarity]}20`,
                color: RARITY_COLOR[rarity],
                border: `1px solid ${RARITY_COLOR[rarity]}60`,
              }}
            >
              {rarity}
            </span>
            <span className="text-xs" style={{ color: "#A09D96" }}>
              {current.monster.element} · {current.monster.role}
            </span>
          </div>
          {current.isNew && (
            <p className="text-sm font-medium" style={{ color: "#5FAD41" }}>✨ New!</p>
          )}
          {current.transcendenceStone && (
            <p className="text-sm font-medium" style={{ color: "#FFD54F" }}>🔮 Transcendence Stone</p>
          )}
          {current.monster.realmSkill && (
            <p className="text-xs mt-2" style={{ color: "#CE93D8" }}>
              Realm Skill: {current.monster.realmSkill}
            </p>
          )}
        </div>

        {/* Progress dots */}
        {results.length > 1 && (
          <div className="flex gap-1.5 mt-6">
            {results.map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-colors"
                style={{
                  background: i <= revealIndex ? "#FFD54F" : "rgba(255,255,255,0.1)",
                }}
              />
            ))}
          </div>
        )}

        <p className="mt-4 text-xs" style={{ color: "#6B6864" }}>
          Tap to continue
        </p>
      </div>
    );
  }

  // All revealed — show grid summary
  const sorted = [...results].sort(
    (a, b) => RARITY_ORDER[b.monster.rarity] - RARITY_ORDER[a.monster.rarity],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(0,0,0,0.92)" }}
    >
      <div className="flex-1 overflow-y-auto p-6">
        <h2
          className="text-2xl font-bold text-center mb-6"
          style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}
        >
          Summon Results
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-w-2xl mx-auto">
          {sorted.map((result, i) => {
            const r = result.monster.rarity;
            return (
              <div
                key={i}
                className="rounded-lg p-3 text-center"
                style={{
                  background: "#13161F",
                  border: `1px solid ${RARITY_COLOR[r]}`,
                  boxShadow: r !== "common" ? RARITY_GLOW[r] : undefined,
                }}
              >
                <div
                  className="w-16 h-16 mx-auto rounded mb-2 flex items-center justify-center text-2xl"
                  style={{ background: "#1A1E2A" }}
                >
                  👾
                </div>
                <p
                  className="text-xs font-bold truncate"
                  style={{ color: "#F0EDE6", fontFamily: "'Cinzel',serif" }}
                >
                  {result.monster.name}
                </p>
                <span
                  className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                  style={{
                    background: `${RARITY_COLOR[r]}20`,
                    color: RARITY_COLOR[r],
                  }}
                >
                  {r}
                </span>
                {result.isNew && (
                  <p className="text-[10px] mt-0.5" style={{ color: "#5FAD41" }}>New!</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-lg font-bold text-sm uppercase tracking-widest"
          style={{
            background: "linear-gradient(135deg,#C89A3E,#FFD54F)",
            color: "#0C0E14",
            fontFamily: "'Cinzel',serif",
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
