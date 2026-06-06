import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/game/AppShell";
import { getMyProfile } from "@/lib/game/profile.functions";
import { listShopItems, purchaseItem } from "@/lib/game/shop.functions";

export const Route = createFileRoute("/_authenticated/bazaar")({
  head: () => ({ meta: [{ title: "Shop — SummonScroll" }] }),
  component: ShopPage,
});

type ShopTab = "equipment" | "potion" | "scroll" | "armoire";

function ShopPage() {
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const fetchItems = useServerFn(listShopItems);
  const doPurchase = useServerFn(purchaseItem);

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const itemsQ = useQuery({ queryKey: ["shop-items"], queryFn: () => fetchItems() });

  const [tab, setTab] = useState<ShopTab>("potion");

  const purchaseMut = useMutation({
    mutationFn: async (shopItemId: string) => doPurchase({ data: { shopItemId, quantity: 1 } }),
    onSuccess: (res) => {
      if (res.reward) {
        toast.success(`Purchased: ${res.reward.name}${res.reward.type === "equipment" ? " (check Equipment)" : ""}`);
      }
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["shop-items"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (profileQ.isLoading) return <div className="min-h-screen grid place-items-center" style={{ background: "#0C0E14", color: "#A09D96" }}>Loading…</div>;
  if (!profileQ.data) return null;

  const profile = profileQ.data.profile;
  const items = (itemsQ.data?.items ?? []).filter((i: { category: string }) => i.category === tab);

  return (
    <AppShell profile={profile}>
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-1" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>The Bazaar</h1>
        <p className="text-sm mb-6" style={{ color: "#A09D96" }}>Spend your hard-earned crystals on equipment, potions, and quest scrolls.</p>

        {/* Balance */}
        <div className="flex gap-4 mb-6 text-sm" style={{ color: "#A09D96" }}>
          <span>💎 <b style={{ color: "#FFD54F", fontFamily: "'JetBrains Mono',monospace" }}>{profile.gems.toLocaleString()}</b></span>
          <span>🔑 <b style={{ color: "#CE93D8", fontFamily: "'JetBrains Mono',monospace" }}>{profile.pact_seals}</b></span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {([["potion", "Potions & Items"], ["equipment", "Equipment"], ["scroll", "Quest Scrolls"], ["armoire", "Enchanted Armoire"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className="pb-2 text-sm font-semibold transition-colors"
              style={{ color: tab === key ? "#FFD54F" : "#A09D96", borderBottom: `2px solid ${tab === key ? "#FFD54F" : "transparent"}` }}>
              {label}
            </button>
          ))}
        </div>

        {/* Armoire special UI */}
        {tab === "armoire" && (
          <div className="rounded-xl p-8 text-center border mb-6" style={{ background: "#13161F", borderColor: "rgba(255,213,79,0.2)" }}>
            <div className="text-5xl mb-4">🗄</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>Enchanted Armoire</h2>
            <p className="text-sm mb-4" style={{ color: "#A09D96" }}>Spend 100💎 for a chance at rare equipment, food for your pets, or bonus XP!</p>
            <button
              onClick={() => {
                const armoireItem = (itemsQ.data?.items ?? []).find((i: { category: string }) => i.category === "armoire");
                if (armoireItem) purchaseMut.mutate(armoireItem.id);
              }}
              disabled={purchaseMut.isPending || profile.gems < 100}
              className="px-8 py-3 rounded-lg font-bold uppercase tracking-widest text-sm disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#C89A3E,#FFD54F)", color: "#0C0E14", boxShadow: "0 0 24px rgba(255,213,79,0.3)" }}>
              {purchaseMut.isPending ? "Opening…" : "🎰 Open Armoire — 100💎"}
            </button>
          </div>
        )}

        {/* Item grid */}
        {tab !== "armoire" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item: { id: string; name: string; description: string; price: number; currency: string; effect_type: string; effect_value: number }) => {
              const canAfford = item.currency === "pact_seals" ? profile.pact_seals >= item.price : profile.gems >= item.price;
              const icon = item.currency === "pact_seals" ? "🔑" : "💎";
              return (
                <div key={item.id} className="rounded-lg p-4 border" style={{ background: "#13161F", borderColor: "rgba(255,255,255,0.07)" }}>
                  <h3 className="font-bold text-sm mb-1" style={{ color: "#F0EDE6", fontFamily: "'Cinzel',serif" }}>{item.name}</h3>
                  <p className="text-xs mb-3" style={{ color: "#A09D96" }}>{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm" style={{ color: canAfford ? "#FFD54F" : "#E05252", fontFamily: "'JetBrains Mono',monospace" }}>
                      {icon} {item.price}
                    </span>
                    <button
                      onClick={() => purchaseMut.mutate(item.id)}
                      disabled={!canAfford || purchaseMut.isPending}
                      className="px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider disabled:opacity-40"
                      style={{ background: canAfford ? "linear-gradient(135deg,#C89A3E,#FFD54F)" : "rgba(255,255,255,0.05)", color: canAfford ? "#0C0E14" : "#6B6864" }}>
                      {purchaseMut.isPending ? "…" : "Buy"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab !== "armoire" && items.length === 0 && (
          <div className="text-center py-16" style={{ color: "#6B6864" }}>
            <p className="text-4xl mb-2">🏪</p>
            <p>No items in this category yet.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
