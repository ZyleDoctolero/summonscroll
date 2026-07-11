import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/game/AppShell";
import { AtmosphereBackdrop } from "@/components/game/AtmosphereBackdrop";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { getMyProfile, listShopItems, purchaseItem } from "@/lib/game/supabase-api";
import { LoadingScreen } from "@/components/game/LoadingScreen";

export const Route = createFileRoute("/_authenticated/bazaar")({
  component: ShopPage,
});

type ShopTab = "equipment" | "potion" | "scroll" | "armoire";

type ShopItem = {
  id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  currency: string;
};

function ShopPage() {
  const qc = useQueryClient();

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const itemsQ = useQuery({ queryKey: ["shop-items"], queryFn: listShopItems });

  const [tab, setTab] = useState<ShopTab>("potion");
  // two-tap purchase guard: first click arms the button, second confirms
  const [armedId, setArmedId] = useState<string | null>(null);

  const purchaseMut = useMutation({
    mutationFn: async (shopItemId: string) => purchaseItem(shopItemId, 1),
    onSuccess: (res) => {
      if (res.reward) {
        toast.success(
          `Purchased: ${res.reward.name}${res.reward.type === "equipment" ? " (check Equipment)" : ""}`,
        );
      }
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["shop-items"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (profileQ.isLoading) return <LoadingScreen realmSlug="ancient-vaults" />;
  if (profileQ.isError)
    return (
      <div
        className="min-h-screen grid place-items-center p-6 text-center"
        style={{ background: "var(--bg-stage)" }}
      >
        <div>
          <p className="mb-4 text-lg font-serif" style={{ color: "var(--ink-primary)" }}>
            The Bazaar&apos;s gates are sealed. Your ledger could not be summoned.
          </p>
          <button
            onClick={() => profileQ.refetch()}
            className="ss-btn ss-btn-d-primary min-h-[44px]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  if (!profileQ.data) return null;

  const profile = profileQ.data.profile;
  const items = (itemsQ.data?.items ?? []).filter((i: ShopItem) => i.category === tab);

  return (
    <AppShell profile={profile}>
      <AtmosphereBackdrop realm="myth" />
      <div className="p-6 md:p-10 max-w-6xl">
        <h1
          className="text-3xl font-bold mb-1"
          style={{
            fontFamily: "var(--ss-font-pixel)",
            color: "var(--gold-ink)",
            letterSpacing: "0.08em",
          }}
        >
          THE BAZAAR
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--ink-secondary)" }}>
          Spend your hard-earned crystals on equipment, potions, and quest scrolls.
        </p>

        {/* Balance */}
        <div className="flex gap-4 mb-6 text-sm" style={{ color: "var(--ink-secondary)" }}>
          <span>
            <Icon name="gold" size={13} color="var(--gold-bright)" />{" "}
            <b className="font-serif" style={{ color: "var(--gold-ink)" }}>
              {profile.gold.toLocaleString()}
            </b>
          </span>
          <span>
            <Icon name="crystal" size={13} color="var(--gold-bright)" />{" "}
            <b className="font-serif" style={{ color: "var(--gold-ink)" }}>
              {profile.crystals.toLocaleString()}
            </b>
          </span>
          <span>
            <Icon name="seal" size={13} color="var(--violet)" />{" "}
            <b className="font-serif" style={{ color: "var(--violet-ink)" }}>
              {profile.pact_seals}
            </b>
          </span>
        </div>

        {/* Tabs — scroll on narrow screens instead of overflowing the page. */}
        <div
          className="flex gap-2 mb-6 border-b overflow-x-auto no-scrollbar"
          style={{ borderColor: "rgba(61,46,31,0.08)" }}
          role="tablist"
          aria-label="Shop categories"
        >
          {(
            [
              ["potion", "Potions & Items"],
              ["equipment", "Equipment"],
              ["scroll", "Quest Scrolls"],
              ["armoire", "Enchanted Armoire"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              role="tab"
              aria-selected={tab === key}
              className={`ss-tab-d pb-2 text-sm font-semibold whitespace-nowrap ${tab === key ? "active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Armoire special UI */}
        {tab === "armoire" && (
          <div className="ss-card-hero text-center mb-6 p-8 flex flex-col items-center">
            <div className="mb-4">
              <Icon name="stone" size={48} color="var(--gold-bright)" className="lucide-glow" />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--gold-ink)" }}>
              Enchanted Armoire
            </h2>
            <p className="text-sm mb-4" style={{ color: "var(--ink-secondary)" }}>
              Spend 100{" "}
              <span
                className="inline-flex items-center gap-0.5"
                style={{ color: "var(--gold-ink)" }}
              >
                <Icon name="crystal" size={12} /> Crystals
              </span>{" "}
              for a chance at rare equipment, food for your pets, or bonus XP!
            </p>
            <button
              onClick={() => {
                if (armedId !== "armoire") {
                  setArmedId("armoire");
                  window.setTimeout(
                    () => setArmedId((cur) => (cur === "armoire" ? null : cur)),
                    3000,
                  );
                  return;
                }
                setArmedId(null);
                const armoireItem = (itemsQ.data?.items ?? []).find(
                  (i: ShopItem) => i.category === "armoire",
                );
                if (armoireItem) purchaseMut.mutate(armoireItem.id);
              }}
              disabled={purchaseMut.isPending || profile.crystals < 100}
              className="ss-btn ss-btn-d-primary disabled:opacity-40 flex items-center gap-1.5 min-h-[44px]"
            >
              {purchaseMut.isPending ? (
                "Opening…"
              ) : armedId === "armoire" ? (
                "Confirm — spend 100?"
              ) : (
                <>
                  <Icon name="sparkle" size={14} />
                  <span>Open Armoire — 100</span>
                  <Icon name="crystal" size={12} />
                </>
              )}
            </button>
          </div>
        )}

        {/* Item grid — loading skeletons */}
        {tab !== "armoire" && itemsQ.isLoading && (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            aria-busy="true"
            aria-label="Loading shop items"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`sk-${i}`} className="ss-card animate-pulse">
                <div className="h-4 w-2/3 mb-2 bg-[var(--bg-pane)]" />
                <div className="h-3 w-full mb-1 bg-[var(--bg-pane)]" />
                <div className="h-3 w-4/5 mb-4 bg-[var(--bg-pane)]" />
                <div className="h-8 w-full bg-[var(--bg-pane)]" />
              </div>
            ))}
          </div>
        )}

        {/* Item grid — error + retry */}
        {tab !== "armoire" && itemsQ.isError && (
          <div className="ss-card text-center p-8 flex flex-col items-center gap-4">
            <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
              The market ledger could not be read.
            </p>
            <button
              onClick={() => itemsQ.refetch()}
              className="ss-btn ss-btn-d-primary min-h-[44px]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Item grid */}
        {tab !== "armoire" && !itemsQ.isLoading && !itemsQ.isError && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item: ShopItem) => {
              const canAfford =
                item.currency === "pact_seals"
                  ? profile.pact_seals >= item.price
                  : item.currency === "gold"
                    ? profile.gold >= item.price
                    : profile.crystals >= item.price;
              const iconName =
                item.currency === "pact_seals"
                  ? "seal"
                  : item.currency === "gold"
                    ? "gold"
                    : "crystal";
              const iconColor =
                item.currency === "pact_seals"
                  ? "var(--violet)"
                  : item.currency === "gold"
                    ? "var(--gold-bright)"
                    : "var(--gold-bright)";
              return (
                <div key={item.id} className="ss-card">
                  <h3 className="font-bold text-sm mb-1" style={{ color: "var(--ink-primary)" }}>
                    {item.name}
                  </h3>
                  <p className="text-xs mb-3" style={{ color: "var(--ink-secondary)" }}>
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      className="font-serif font-bold text-sm flex items-center gap-1"
                      style={{ color: canAfford ? "var(--gold-ink)" : "var(--danger)" }}
                    >
                      <Icon name={iconName} size={14} color={iconColor} />
                      {item.price}
                    </span>
                    <button
                      onClick={() => {
                        if (armedId === item.id) {
                          setArmedId(null);
                          purchaseMut.mutate(item.id);
                        } else {
                          setArmedId(item.id);
                          window.setTimeout(
                            () => setArmedId((cur) => (cur === item.id ? null : cur)),
                            3000,
                          );
                        }
                      }}
                      disabled={!canAfford || purchaseMut.isPending}
                      className={`ss-btn disabled:opacity-40 min-h-[44px] ${canAfford ? "ss-btn-d-primary" : "ss-btn-secondary"}`}
                    >
                      {purchaseMut.isPending ? "…" : armedId === item.id ? "Confirm?" : "Buy"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab !== "armoire" && !itemsQ.isLoading && !itemsQ.isError && items.length === 0 && (
          <EmptyState
            icon="gold"
            title="The Market Rests Between Cycles"
            body="Offerings appear when the Page turns. Come back tomorrow."
          />
        )}
      </div>
    </AppShell>
  );
}
