import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { AppShell } from "@/components/game/AppShell";
import { Icon } from "@/components/ui/Icon";
import { getMyProfile, listBanners, pullBanner } from "@/lib/game/supabase-api";
import { RARITY_COLOR, RARITY_GLOW, RARITY_ORDER, type Rarity } from "@/lib/game/gacha.constants";

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

  const pullMut = useMutation({
    mutationFn: async (v: { bannerId: string; count: 1 | 10 }) => pullBanner(v.bannerId, v.count),
    onSuccess: (res) => {
      setPullResults(res.results as PullResult[]);
      setRevealIndex(0);
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

  if (pullResults) {
    const allRevealed = revealIndex >= pullResults.length - 1;
    if (!allRevealed) {
      const current = pullResults[revealIndex];
      const r = current.monster.rarity;
      return (
        <AppShell profile={profile}>
          <div
            className="pull-stage cursor-pointer flex-col"
            onClick={() => setRevealIndex((i) => Math.min(i + 1, pullResults.length - 1))}
          >
            {/* rotating light rays + a fresh rarity-colored burst each reveal */}
            <div className="pull-rays" />
            <div
              key={`burst-${revealIndex}`}
              className="pull-burst"
              style={{ background: `radial-gradient(circle, ${RARITY_COLOR[r]}cc, transparent 65%)` }}
            />
            <motion.div
              key={`card-${revealIndex}`}
              initial={{ opacity: 0, scale: 0.6, rotateY: -25 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="ss-modal text-center max-w-xs relative z-10"
              style={{ border: `2px solid ${RARITY_COLOR[r]}`, boxShadow: RARITY_GLOW[r] }}
            >
              <div className="w-40 h-40 mx-auto rounded-lg mb-4 flex items-center justify-center overflow-hidden ss-pane">
                <img
                  src={
                    current.monster.artUrl
                      ? current.monster.artUrl
                      : `/sprites/monsters/${current.monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
                  }
                  className="w-full h-full object-cover"
                  alt={current.monster.name}
                  onError={(e) => {
                    e.currentTarget.src = "/monsters/placeholder.png";
                  }}
                />
              </div>
              <h2
                className="text-2xl font-bold mb-2 text-gold-bright"
                style={{ color: RARITY_COLOR[r] }}
              >
                {current.monster.name}
              </h2>
              <span
                className="ss-chip"
                style={{
                  background: `${RARITY_COLOR[r]}20`,
                  color: RARITY_COLOR[r],
                  border: `1px solid ${RARITY_COLOR[r]}60`,
                }}
              >
                {r}
              </span>
              <p className="text-xs mt-2 text-muted-foreground">
                {current.monster.element} · {current.monster.role}
              </p>
              {current.isNew && (
                <p className="text-sm mt-2 font-medium text-success flex items-center gap-1 justify-center">
                  <Icon name="sparkle" size={14} color="var(--success)" /> New!
                </p>
              )}
              {current.transcendenceStone && (
                <p
                  className="text-sm mt-1 flex items-center gap-1 justify-center"
                  style={{ color: "var(--gold-bright)" }}
                >
                  <Icon name="summon" size={14} /> Transcendence Stone
                </p>
              )}
            </motion.div>
            {pullResults.length > 1 && (
              <div className="flex gap-1.5 mt-6 relative z-10">
                {pullResults.map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: i <= revealIndex ? "var(--gold-bright)" : "rgba(255,255,255,0.1)",
                    }}
                  />
                ))}
              </div>
            )}
            <p className="mt-4 text-xs text-muted-foreground">Tap to continue</p>
          </div>
        </AppShell>
      );
    }
    const sorted = [...pullResults].sort(
      (a, b) => RARITY_ORDER[b.monster.rarity] - RARITY_ORDER[a.monster.rarity],
    );
    return (
      <AppShell profile={profile}>
        <div className="fixed inset-0 z-50 flex flex-col ss-modal-backdrop">
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-center mb-6 text-gold-bright">Summon Results</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-w-2xl mx-auto">
              {sorted.map((res, i) => {
                const r = res.monster.rarity;
                return (
                  <div
                    key={i}
                    className="ss-card text-center"
                    style={{
                      border: `1px solid ${RARITY_COLOR[r]}`,
                      boxShadow: r !== "common" ? RARITY_GLOW[r] : undefined,
                    }}
                  >
                    <div className="w-16 h-16 mx-auto rounded mb-2 flex items-center justify-center overflow-hidden ss-pane">
                      <img
                        src={
                          res.monster.artUrl
                            ? res.monster.artUrl
                            : `/sprites/monsters/${res.monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
                        }
                        className="w-full h-full object-cover"
                        alt={res.monster.name}
                        onError={(e) => {
                          e.currentTarget.src = "/monsters/placeholder.png";
                        }}
                      />
                    </div>
                    <p className="text-xs font-bold truncate text-foreground">{res.monster.name}</p>
                    <span
                      className="ss-chip mt-1"
                      style={{ background: `${RARITY_COLOR[r]}20`, color: RARITY_COLOR[r] }}
                    >
                      {r}
                    </span>
                    {res.isNew && <p className="text-[10px] mt-0.5 text-success">New!</p>}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="p-4 border-t border-border">
            <button onClick={() => setPullResults(null)} className="ss-btn ss-btn-primary w-full">
              Continue
            </button>
          </div>
        </div>
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
