import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { AppShell } from "@/components/game/AppShell";
import { getMyProfile } from "@/lib/game/supabase-api";
import { listRecipes, craft, type Recipe, type CraftQuality } from "@/lib/game/forge-client";

export const Route = createFileRoute("/_authenticated/forge")({
  component: ForgePage,
});

const QUALITY_LABELS: Record<CraftQuality, { label: string; color: string; goldMult: number; desc: string }> = {
  standard:   { label: "Standard",   color: "#A09D96", goldMult: 1, desc: "Functional." },
  refined:    { label: "Refined",    color: "#7FD4FF", goldMult: 3, desc: "+50% stats." },
  masterwork: { label: "Masterwork", color: "#FFD54F", goldMult: 9, desc: "Random affix." },
};

function ForgePage() {
  const qc = useQueryClient();
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const recipesQ = useQuery({ queryKey: ["recipes"], queryFn: listRecipes });
  const invQ = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from("inventory").select("*").eq("user_id", user.id);
      return data ?? [];
    },
  });

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<CraftQuality>("standard");

  const craftMut = useMutation({
    mutationFn: ({ recipeId, quality }: { recipeId: string; quality: CraftQuality }) => craft(recipeId, quality),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["my-equipment"] });
      confetti({ particleCount: 80, spread: 60 });
      toast.success(`Forged ${QUALITY_LABELS[res.quality].label} ${res.itemName}`, {
        description: res.affix ? `Affix: ${res.affix.text}` : undefined,
      });
      setSelectedRecipe(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const invMap = (invQ.data ?? []).reduce(
    (acc, i) => ({ ...acc, [i.item_name]: i.quantity }),
    {} as Record<string, number>
  );
  const gold = profileQ.data?.profile.gold ?? 0;
  const level = profileQ.data?.profile.level ?? 1;

  if (profileQ.isLoading || recipesQ.isLoading) {
    return <div className="min-h-screen grid place-items-center" style={{ background: "#0C0E14", color: "#A09D96" }}>Stoking the forge…</div>;
  }
  if (!profileQ.data) return null;

  return (
    <AppShell profile={profileQ.data.profile}>
      <div className="p-6 md:p-10 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-1" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>The Forge</h1>
        <p className="text-sm mb-6" style={{ color: "#A09D96" }}>
          Combine stones and materials from Expeditions into wearable gear. Burn extra Gold for Refined or Masterwork quality.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(recipesQ.data?.recipes ?? []).map((r) => {
            const locked = r.unlock_condition.level ? level < r.unlock_condition.level : false;
            const ingsOk = (r.ingredients ?? []).every((i) => (invMap[i.name] ?? 0) >= i.qty);
            const goldOk = gold >= r.base_gold_cost;
            const canCraft = !locked && ingsOk && goldOk;
            return (
              <div
                key={r.id}
                className="rounded-lg p-4 border"
                style={{
                  background: "#13161F",
                  borderColor: locked ? "rgba(255,255,255,0.04)" : "rgba(255,213,79,0.15)",
                  opacity: locked ? 0.5 : 1,
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: "#F0EDE6", fontFamily: "'Cinzel',serif" }}>
                      {locked ? "🔒 " : ""}{r.name}
                    </h3>
                    {r.equipment && (
                      <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: "#6B6864" }}>
                        {r.equipment.slot} ·{" "}
                        {[r.equipment.str_bonus && `+${r.equipment.str_bonus} STR`, r.equipment.int_bonus && `+${r.equipment.int_bonus} INT`, r.equipment.con_bonus && `+${r.equipment.con_bonus} CON`, r.equipment.per_bonus && `+${r.equipment.per_bonus} PER`].filter(Boolean).join(" / ")}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-mono" style={{ color: goldOk ? "#FFD54F" : "#E05252" }}>
                    💰 {r.base_gold_cost}
                  </span>
                </div>

                <div className="space-y-1 mb-3">
                  {(r.ingredients ?? []).map((ing) => {
                    const have = invMap[ing.name] ?? 0;
                    const ok = have >= ing.qty;
                    return (
                      <div key={ing.name} className="flex justify-between text-xs">
                        <span style={{ color: ok ? "#A09D96" : "#E05252" }}>✨ {ing.name}</span>
                        <span className="font-mono" style={{ color: ok ? "#5FAD41" : "#E05252" }}>
                          {have} / {ing.qty}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {locked && (
                  <p className="text-[10px] text-center mb-2" style={{ color: "#6B6864" }}>
                    Unlocks at Level {r.unlock_condition.level}
                  </p>
                )}

                <button
                  onClick={() => { setSelectedRecipe(r); setSelectedQuality("standard"); }}
                  disabled={!canCraft || craftMut.isPending}
                  className="w-full py-2 rounded text-xs uppercase tracking-widest font-bold disabled:opacity-40"
                  style={{
                    background: canCraft ? "linear-gradient(135deg,#C89A3E,#FFD54F)" : "rgba(255,255,255,0.05)",
                    color: canCraft ? "#0C0E14" : "#6B6864",
                  }}
                >
                  Strike the Anvil
                </button>
              </div>
            );
          })}
        </div>

        {(recipesQ.data?.recipes ?? []).length === 0 && (
          <p className="text-center py-16 text-sm" style={{ color: "#6B6864" }}>
            No recipes yet. (Database may need seeding.)
          </p>
        )}
      </div>

      {/* Quality picker modal */}
      {selectedRecipe && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setSelectedRecipe(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl p-6 border"
            style={{ background: "#1A1E2A", borderColor: "rgba(255,213,79,0.3)" }}
          >
            <h2 className="text-lg font-bold mb-1 text-center" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>
              Choose Quality
            </h2>
            <p className="text-xs text-center mb-4" style={{ color: "#A09D96" }}>
              Higher quality consumes more Gold. Masterwork rolls an affix.
            </p>

            <div className="space-y-2 mb-4">
              {(Object.keys(QUALITY_LABELS) as CraftQuality[]).map((q) => {
                const def = QUALITY_LABELS[q];
                const cost = selectedRecipe.base_gold_cost * def.goldMult;
                const canAfford = gold >= cost;
                return (
                  <button
                    key={q}
                    onClick={() => setSelectedQuality(q)}
                    disabled={!canAfford}
                    className="w-full text-left p-3 rounded transition-all disabled:opacity-30"
                    style={{
                      background: selectedQuality === q ? `${def.color}18` : "rgba(0,0,0,0.3)",
                      border: `1px solid ${selectedQuality === q ? def.color : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span style={{ color: def.color, fontWeight: 700 }}>{def.label}</span>
                      <span className="text-xs font-mono" style={{ color: canAfford ? "#FFD54F" : "#E05252" }}>💰 {cost}</span>
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: "#A09D96" }}>{def.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedRecipe(null)}
                className="flex-1 py-2.5 rounded-md text-xs uppercase tracking-widest font-bold"
                style={{ background: "rgba(255,255,255,0.05)", color: "#A09D96" }}
              >
                Cancel
              </button>
              <button
                onClick={() => craftMut.mutate({ recipeId: selectedRecipe.id, quality: selectedQuality })}
                disabled={craftMut.isPending}
                className="flex-[2] py-2.5 rounded-md text-xs uppercase tracking-widest font-bold disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#C89A3E,#FFD54F)", color: "#0C0E14" }}
              >
                {craftMut.isPending ? "Striking…" : "Forge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
