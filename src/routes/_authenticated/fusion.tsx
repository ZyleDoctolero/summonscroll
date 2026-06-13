import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/game/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { getMyProfile, listMyMonsters } from "@/lib/game/supabase-api";
import { RARITY_COLOR, type Rarity } from "@/lib/game/gacha.constants";
import { Icon } from "@/components/ui/Icon";

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

  if (profileQ.isLoading)
    return (
      <div
        className="min-h-screen grid place-items-center"
        style={{ color: "var(--ink-secondary)" }}
      >
        Loading…
      </div>
    );
  if (!profileQ.data) return null;

  const filledSlots = slots.filter(Boolean).length;

  return (
    <AppShell profile={profileQ.data.profile}>
      <div className="p-6 md:p-10 max-w-6xl">
        <h1 className="t-h1 text-3xl font-bold mb-1" style={{ color: "var(--gold-bright)" }}>
          Fusion Matrix
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--ink-secondary)" }}>
          Combine monsters to create more powerful forms. Consumed monsters are permanently removed.
        </p>

        {/* Ingredient slots */}
        <div className="flex gap-4 mb-6 justify-center">
          {slots.map((slotId, i) => {
            const um = slotId ? userMonsters.find((m: any) => m.id === slotId) : null;
            if (um) {
              const r = um.monster.rarity as Rarity;
              return (
                <div
                  key={i}
                  className="ss-card text-center w-32"
                  style={{ borderColor: RARITY_COLOR[r] }}
                >
                  <div className="w-16 h-16 mx-auto rounded mb-2 flex items-center justify-center overflow-hidden ss-pane">
                    <img
                      src={
                        um.monster.art_url
                          ? um.monster.art_url
                          : `/sprites/monsters/${um.monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
                      }
                      className="w-full h-full object-cover"
                      alt={um.monster.name}
                      onError={(e) => {
                        e.currentTarget.src = "/monsters/placeholder.png";
                      }}
                    />
                  </div>
                  <p className="t-label truncate" style={{ color: "var(--ink-primary)" }}>
                    {um.monster.name}
                  </p>
                  <p className="text-[9px]" style={{ color: RARITY_COLOR[r] }}>
                    {um.monster.rarity}
                  </p>
                  <button
                    onClick={() => {
                      const n = [...slots];
                      n[i] = null;
                      setSlots(n);
                    }}
                    className="mt-2 text-[9px] px-2 py-0.5 rounded font-semibold"
                    style={{ color: "var(--danger)", background: "rgba(255,94,94,0.1)" }}
                  >
                    Remove
                  </button>
                </div>
              );
            }
            return (
              <button
                key={i}
                onClick={() => setSelectingSlot(i)}
                className="rounded-xl p-4 border-2 border-dashed w-32 min-h-[120px] flex flex-col items-center justify-center transition-colors hover:border-white/20"
                style={{ borderColor: "var(--ss-border)", color: "var(--ink-tertiary)" }}
              >
                <span className="text-2xl mb-1">+</span>
                <span className="text-[10px]">
                  Slot {i + 1}
                  {i === 2 ? " (opt)" : ""}
                </span>
              </button>
            );
          })}
        </div>

        {/* Arrow + result preview */}
        {filledSlots >= 2 && (
          <div className="text-center mb-6">
            <div className="text-2xl mb-2" style={{ color: "var(--ink-tertiary)" }}>
              ↓
            </div>
            <div className="ss-card-d-glow inline-block p-6">
              <p className="t-label mb-1">Fusion Result</p>
              <p className="t-h3 text-lg font-bold" style={{ color: "var(--gold-bright)" }}>
                Unknown Fusion
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--ink-tertiary)" }}>
                Fusion recipes coming soon — the Matrix pulses with potential.
              </p>
            </div>
          </div>
        )}

        {/* Warning */}
        {filledSlots >= 2 && (
          <div className="text-center mb-6">
            <p
              className="text-xs flex items-center justify-center gap-1.5"
              style={{ color: "var(--danger)" }}
            >
              <Icon name="warning" size={13} color="var(--danger)" />
              <span>Consumed monsters will be permanently removed from your collection.</span>
            </p>
            <button
              disabled
              className="ss-btn ss-btn-d-primary mt-3 px-8 py-3 opacity-40 flex items-center justify-center gap-1.5 mx-auto"
            >
              <Icon name="summon" size={14} />
              <span>Perform Fusion (Coming Soon)</span>
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
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center ss-modal-backdrop"
          onClick={() => setSelectingSlot(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="ss-modal max-w-md">
            <h3 className="t-h3 text-lg font-bold mb-4" style={{ color: "var(--gold-bright)" }}>
              Select Monster for Slot {selectingSlot + 1}
            </h3>
            <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {userMonsters
                .filter((um: any) => !usedIds.has(um.id))
                .map((um: any) => (
                  <button
                    key={um.id}
                    onClick={() => {
                      const n = [...slots];
                      n[selectingSlot] = um.id;
                      setSlots(n);
                      setSelectingSlot(null);
                    }}
                    className="ss-card text-center p-2 hover:scale-[1.03] transition-all"
                    style={{ borderColor: `${RARITY_COLOR[um.monster.rarity as Rarity]}40` }}
                  >
                    <div className="w-full aspect-square rounded mb-1 flex items-center justify-center overflow-hidden ss-pane">
                      <img
                        src={
                          um.monster.art_url
                            ? um.monster.art_url
                            : `/sprites/monsters/${um.monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
                        }
                        className="w-full h-full object-cover"
                        alt={um.monster.name}
                        onError={(e) => {
                          e.currentTarget.src = "/monsters/placeholder.png";
                        }}
                      />
                    </div>
                    <p
                      className="text-[10px] font-bold truncate"
                      style={{ color: "var(--ink-primary)" }}
                    >
                      {um.monster.name}
                    </p>
                    <p
                      className="text-[9px]"
                      style={{ color: RARITY_COLOR[um.monster.rarity as Rarity] }}
                    >
                      {um.monster.rarity}
                    </p>
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
