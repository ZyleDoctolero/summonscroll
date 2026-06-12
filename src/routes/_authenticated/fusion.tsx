import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/game/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { getMyProfile, listMyMonsters } from "@/lib/game/supabase-api";
import { RARITY_COLOR, type Rarity } from "@/lib/game/gacha.constants";

export const Route = createFileRoute("/_authenticated/fusion")({
  component: FusionPage,
});

function FusionPage() {
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const monstersQ = useQuery({ queryKey: ["my-monsters"], queryFn: listMyMonsters });

  const [slots, setSlots] = useState<Array<string | null>>([null, null, null]);
  const [selectingSlot, setSelectingSlot] = useState<number | null>(null);

  const userMonsters = monstersQ.data?.userMonsters ?? [];
  const usedIds = new Set(slots.filter(Boolean));

  if (profileQ.isLoading) return <div className="min-h-screen grid place-items-center" style={{ background: "#0C0E14", color: "#A09D96" }}>Loading…</div>;
  if (!profileQ.data) return null;

  const filledSlots = slots.filter(Boolean).length;

  return (
    <AppShell profile={profileQ.data.profile}>
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        <h1 className="t-h1 text-3xl font-bold mb-1" style={{ color: "var(--gold-bright)" }}>Fusion Matrix</h1>
        <p className="text-sm mb-6" style={{ color: "var(--ink-secondary)" }}>Combine monsters to create more powerful forms. Consumed monsters are permanently removed.</p>

        {/* Ingredient slots */}
        <div className="flex gap-4 mb-6 justify-center">
          {slots.map((slotId, i) => {
            const um = slotId ? userMonsters.find((m: any) => m.id === slotId) : null;
            if (um) {
              const r = um.monster.rarity as Rarity;
              return (
                <div key={i} className="rounded-xl p-4 text-center w-32" style={{ background: "#13161F", border: `1px solid ${RARITY_COLOR[r]}` }}>
                  <div className="w-16 h-16 mx-auto rounded mb-2 flex items-center justify-center overflow-hidden" style={{ background: "#1A1E2A" }}>
                    <img src="/monsters/placeholder.png" className="w-full h-full object-cover" alt="Monster" />
                  </div>
                  <p className="t-label truncate" style={{ color: "var(--ink-primary)" }}>{um.monster.name}</p>
                  <p className="text-[9px]" style={{ color: RARITY_COLOR[r] }}>{um.monster.rarity}</p>
                  <button onClick={() => { const n = [...slots]; n[i] = null; setSlots(n); }}
                    className="mt-2 text-[9px] px-2 py-0.5 rounded" style={{ color: "#E05252", background: "rgba(224,82,82,0.1)" }}>Remove</button>
                </div>
              );
            }
            return (
              <button key={i} onClick={() => setSelectingSlot(i)}
                className="rounded-xl p-4 border-2 border-dashed w-32 min-h-[120px] flex flex-col items-center justify-center"
                style={{ borderColor: "rgba(255,255,255,0.1)", color: "#6B6864" }}>
                <span className="text-2xl mb-1">+</span>
                <span className="text-[10px]">Slot {i + 1}{i === 2 ? " (opt)" : ""}</span>
              </button>
            );
          })}
        </div>

        {/* Arrow + result preview */}
        {filledSlots >= 2 && (
          <div className="text-center mb-6">
            <div className="text-2xl mb-2" style={{ color: "#6B6864" }}>↓</div>
            <div className="ss-card-d-glow inline-block p-6">
              <p className="t-label mb-1">Fusion Result</p>
              <p className="t-h3 text-lg font-bold" style={{ color: "var(--gold-bright)" }}>Unknown Fusion</p>
              <p className="text-xs mt-1" style={{ color: "var(--ink-tertiary)" }}>Fusion recipes coming soon — the Matrix pulses with potential.</p>
            </div>
          </div>
        )}

        {/* Warning */}
        {filledSlots >= 2 && (
          <div className="text-center mb-6">
            <p className="text-xs" style={{ color: "#E05252" }}>⚠ Consumed monsters will be permanently removed from your collection.</p>
            <button disabled className="mt-3 px-8 py-3 rounded-lg font-bold uppercase tracking-widest text-sm opacity-40"
              style={{ background: "linear-gradient(135deg,#C89A3E,#FFD54F)", color: "#0C0E14" }}>
              🔮 Perform Fusion (Coming Soon)
            </button>
          </div>
        )}

        {filledSlots === 0 && userMonsters.length === 0 && (
          <EmptyState
            icon="sparkle"
            title="The Matrix is dormant."
            body="Summon two or more monsters to begin fusing."
          />
        )}
      </div>

      {/* Monster selector modal */}
      {selectingSlot !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.8)" }} onClick={() => setSelectingSlot(null)}>
          <div onClick={(e) => e.stopPropagation()} className="ss-modal">
            <h3 className="t-h3 text-lg font-bold mb-4" style={{ color: "var(--gold-bright)" }}>Select Monster for Slot {selectingSlot + 1}</h3>
            <div className="grid grid-cols-3 gap-2">
              {userMonsters.filter((um: any) => !usedIds.has(um.id)).map((um: any) => (
                <button key={um.id} onClick={() => {
                  const n = [...slots]; n[selectingSlot] = um.id; setSlots(n); setSelectingSlot(null);
                }} className="rounded-lg p-2 text-center hover:scale-[1.03] transition-all"
                  style={{ background: "#13161F", border: `1px solid ${RARITY_COLOR[um.monster.rarity as Rarity]}40` }}>
                  <div className="w-full aspect-square rounded mb-1 flex items-center justify-center overflow-hidden" style={{ background: "#0C0E14" }}>
                    <img src="/monsters/placeholder.png" className="w-full h-full object-cover" alt="Monster" />
                  </div>
                  <p className="text-[10px] font-bold truncate" style={{ color: "#F0EDE6" }}>{um.monster.name}</p>
                  <p className="text-[9px]" style={{ color: RARITY_COLOR[um.monster.rarity as Rarity] }}>{um.monster.rarity}</p>
                </button>
              ))}
            </div>
            {userMonsters.filter((um: any) => !usedIds.has(um.id)).length === 0 && (
              <EmptyState
                icon="sparkle"
                title="All companions are occupied."
                body="Free some monsters from the current fusion slots to select new ones."
              />
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
