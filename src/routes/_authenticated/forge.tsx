import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { AppShell } from "@/components/game/AppShell";
import { AtmosphereBackdrop } from "@/components/game/AtmosphereBackdrop";
import { getMyProfile, listMyMonsters, evolveMonster } from "@/lib/game/supabase-api";
import { Icon } from "@/components/ui/Icon";

export const Route = createFileRoute("/_authenticated/forge")({
  component: AlchemyPage,
});

const ALCHEMY_RECIPES = [
  {
    id: "rec_1",
    base: "Wolf",
    catalyst: "Flame Core",
    habitRequirement: "Drops from Fitness & Sport tasks.",
    result: "Hellfire Hound",
    desc: "Mutates a base Wolf into a high-DPS fire elemental.",
    color: "var(--danger)",
    img: "/sprites/monsters/hellfire_hound.png",
  },
  {
    id: "rec_2",
    base: "Wolf",
    catalyst: "Aqua Core",
    habitRequirement: "Drops from Chores & Health tasks.",
    result: "Tidal Hound",
    desc: "Mutates a base Wolf into a high-defense water elemental.",
    color: "var(--gold-bright)",
    img: "/sprites/monsters/frostfang_lupus.png",
  },
  {
    id: "rec_3",
    base: "Feline",
    catalyst: "Mind Core",
    habitRequirement: "Drops from Study & Work tasks.",
    result: "Shadowstalker",
    desc: "A stealth-based evolution that increases critical hit rate.",
    color: "var(--accent-void)",
    img: "/sprites/monsters/shadowstalker.png",
  },
];

function AlchemyPage() {
  const qc = useQueryClient();
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const monstersQ = useQuery({ queryKey: ["my-monsters"], queryFn: listMyMonsters });

  const [selectedRecipe, setSelectedRecipe] = useState(ALCHEMY_RECIPES[0]);
  const [selectedMonster, setSelectedMonster] = useState<string | null>(null);

  const evolveMut = useMutation({
    mutationFn: async () => {
      if (!selectedMonster) throw new Error("No monster selected");
      await evolveMonster(
        selectedMonster,
        selectedRecipe.id,
        selectedRecipe.catalyst,
        selectedRecipe.result,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-monsters"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      toast.success(`Bloodline Awakening Successful! You created a ${selectedRecipe.result}.`);
      setSelectedMonster(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (profileQ.isLoading || monstersQ.isLoading) {
    return (
      <div
        className="min-h-screen grid place-items-center"
        style={{ color: "var(--ink-secondary)" }}
      >
        Igniting the Bloodline Crucible…
      </div>
    );
  }

  if (!profileQ.data) return null;
  const profile = profileQ.data.profile;

  // Filter monsters that match the base requirement roughly (for demo, just show all that contain the string, or just all monsters if it's restrictive)
  const compatibleMonsters =
    monstersQ.data?.userMonsters.filter((m: { monster: { name: string } }) =>
      m.monster.name.toLowerCase().includes(selectedRecipe.base.toLowerCase()),
    ) || [];

  return (
    <AppShell profile={profile}>
      <AtmosphereBackdrop realm="blight" />
      <div className="p-6 md:p-10 max-w-6xl mx-auto relative z-10 min-h-screen pt-20">
        <header className="mb-10 text-center flex flex-col items-center">
          <div
            className="w-16 h-16 flex items-center justify-center mb-4"
            style={{
              border: "2px solid rgba(200,154,62,0.5)",
              borderRadius: 0,
              background: "rgba(200,154,62,0.08)",
              boxShadow: "3px 3px 0 rgba(0,0,0,0.4)",
            }}
          >
            <Icon name="forge" size={36} color="var(--gold-bright)" />
          </div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              fontFamily: "var(--ss-font-pixel)",
              color: "var(--gold-bright)",
              letterSpacing: "0.08em",
            }}
          >
            BLOODLINE CRUCIBLE
          </h1>
          <p className="max-w-xl text-sm" style={{ color: "var(--ink-secondary)" }}>
            Refine your Contracted Spirits with Beast Cores to trigger a Bloodline Awakening.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recipe List */}
          <div className="flex flex-col gap-4">
            <h2 className="t-h3" style={{ color: "var(--ink-primary)" }}>
              Branching Paths
            </h2>
            {ALCHEMY_RECIPES.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setSelectedRecipe(r);
                  setSelectedMonster(null);
                }}
                className={`ss-card p-4 text-left border-l-4 transition-all hover:scale-105 ${selectedRecipe.id === r.id ? "shadow-[0_0_20px_rgba(212,175,63,0.3)] bg-[var(--ink-secondary)]/5" : "opacity-70"}`}
                style={{
                  borderLeftColor: r.color,
                  borderColor: selectedRecipe.id === r.id ? r.color : "rgba(61,46,31,0.1)",
                }}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-lg" style={{ color: "var(--ink-primary)" }}>
                    {r.result}
                  </h3>
                  <span
                    className="text-[11px] uppercase font-bold px-2 py-1 rounded bg-[var(--bg-stage)]/50"
                    style={{ color: r.color }}
                  >
                    {r.base} Base
                  </span>
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--ink-secondary)" }}>
                  Requires: <strong style={{ color: "var(--gold-bright)" }}>{r.catalyst}</strong>
                </p>
                <p className="text-[11px] italic mt-1" style={{ color: "var(--ink-secondary)" }}>
                  {r.habitRequirement}
                </p>
              </button>
            ))}
          </div>

          {/* Bloodline Chamber */}
          <div className="lg:col-span-2 ss-card p-8 flex flex-col justify-center items-center relative overflow-hidden bg-gradient-to-b from-[rgba(200,154,62,0.06)] to-[rgba(245,239,230,0.9)]">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay animate-[hud-shimmer_20s_linear_infinite]" />

            <h2
              className="t-h2 text-2xl mb-8 relative z-10"
              style={{
                color: selectedRecipe.color,
                textShadow: `0 0 15px ${selectedRecipe.color}`,
              }}
            >
              Target: {selectedRecipe.result}
            </h2>

            <div className="flex items-center justify-center gap-4 md:gap-10 relative z-10 mb-12 w-full">
              {/* Catalyst Input */}
              <div className="flex flex-col items-center">
                <div
                  className="w-20 h-20 md:w-28 md:h-28 border-2 border-dashed border-[var(--gold-bright)]/50 flex items-center justify-center bg-[var(--bg-stage)]/40 relative overflow-hidden"
                  style={{ borderRadius: 0, boxShadow: "3px 3px 0 rgba(0,0,0,0.4)" }}
                >
                  <Icon
                    name="sparkle"
                    size={32}
                    color="var(--gold-bright)"
                    className="opacity-50"
                  />
                  <div
                    className="absolute bottom-2 text-[11px] font-bold text-center w-full"
                    style={{ color: "var(--gold-base)" }}
                  >
                    0 / 1
                  </div>
                </div>
                <span
                  className="mt-3 text-xs font-bold uppercase tracking-wider text-center"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  {selectedRecipe.catalyst}
                </span>
              </div>

              <Icon
                name="swords"
                size={24}
                color="var(--ink-secondary)"
                className="rotate-45 opacity-50"
              />

              {/* Monster Input */}
              <div className="flex flex-col items-center">
                <div
                  className="w-24 h-24 md:w-32 md:h-32 border-2 border-[rgba(255,255,255,0.2)] flex items-center justify-center bg-[var(--bg-stage)]/60 relative overflow-hidden group"
                  style={{ borderRadius: 0, boxShadow: "3px 3px 0 rgba(0,0,0,0.4)" }}
                >
                  {selectedMonster ? (
                    <img
                      src={`/sprites/monsters/placeholder.png`}
                      alt="Selected"
                      className="w-full h-full object-contain p-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                    />
                  ) : (
                    <div className="text-center p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <Icon
                        name="target"
                        size={32}
                        color="var(--ink-secondary)"
                        className="mx-auto mb-2"
                      />
                      <span
                        className="text-[11px] font-bold uppercase"
                        style={{ color: "var(--ink-secondary)" }}
                      >
                        Select Base
                      </span>
                    </div>
                  )}
                </div>
                <span
                  className="mt-3 text-xs font-bold uppercase tracking-wider text-center"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  Base: {selectedRecipe.base}
                </span>
              </div>
            </div>

            <p
              className="text-center text-sm max-w-md relative z-10 mb-8"
              style={{ color: "var(--ink-secondary)" }}
            >
              {selectedRecipe.desc}
            </p>

            <button
              disabled={evolveMut.isPending}
              onClick={() => {
                if (!selectedMonster) {
                  toast.error("Please select a base monster first.");
                  return;
                }
                evolveMut.mutate();
              }}
              className="ss-btn w-full md:w-auto px-12 py-4 text-xl font-bold uppercase tracking-widest relative z-10 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              style={{
                background: `linear-gradient(135deg, ${selectedRecipe.color}40, transparent)`,
                border: `2px solid ${selectedRecipe.color}`,
                color: "var(--ink-primary)",
                boxShadow: `0 0 20px ${selectedRecipe.color}40`,
              }}
            >
              {evolveMut.isPending ? "Synthesizing..." : "Initiate Evolution"}
            </button>
          </div>
        </div>

        {/* Compatible Monsters Drawer */}
        <div className="mt-8 ss-card p-6 border-t-4" style={{ borderColor: selectedRecipe.color }}>
          <h3 className="t-h3 mb-4" style={{ color: "var(--ink-primary)" }}>
            Available Bases
          </h3>
          {compatibleMonsters.length === 0 ? (
            <div
              className="p-8 text-center bg-[var(--bg-stage)]/40 border border-dashed border-[var(--ink-secondary)]/10"
              style={{ borderRadius: 0 }}
            >
              <p style={{ color: "var(--ink-secondary)" }}>
                No compatible monsters found in your Compendium.
              </p>
              <p className="text-xs mt-2" style={{ color: "var(--ink-secondary)" }}>
                Hint: You need a monster with "{selectedRecipe.base}" in its name or type.
              </p>
              <button
                onClick={() => setSelectedMonster("mock_id")}
                className="mt-4 px-4 py-2 text-xs border border-[var(--ink-secondary)]/20 rounded hover:bg-[var(--ink-secondary)]/10"
              >
                Use Mock Monster (Dev Mode)
              </button>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {compatibleMonsters.map(
                (um: { id: string; monster: { name: string; art_url?: string | null } }) => (
                  <button
                    key={um.id}
                    onClick={() => setSelectedMonster(um.id)}
                    className={`flex-shrink-0 w-24 p-2 border flex flex-col items-center gap-2 transition-all ${selectedMonster === um.id ? "border-[var(--gold-bright)] bg-[var(--ink-secondary)]/10" : "border-[var(--ink-secondary)]/10 opacity-70"}`}
                    style={{
                      borderRadius: 0,
                      boxShadow:
                        selectedMonster === um.id
                          ? "3px 3px 0 rgba(200,154,62,0.3)"
                          : "2px 2px 0 rgba(0,0,0,0.2)",
                    }}
                  >
                    <img
                      src={
                        um.monster.art_url
                          ? um.monster.art_url
                          : `/sprites/monsters/placeholder.png`
                      }
                      alt={um.monster.name}
                      className="w-16 h-16 object-contain"
                    />
                    <span
                      className="text-[11px] font-bold truncate w-full text-center"
                      style={{ color: "var(--ink-primary)" }}
                    >
                      {um.monster.name}
                    </span>
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
