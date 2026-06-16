import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { AppShell } from "@/components/game/AppShell";
import { AtmosphereBackdrop } from "@/components/game/AtmosphereBackdrop";
import {
  getMyProfile,
  listMyMonsters,
  listIdleExpeditions,
  dispatchIdleExpedition,
  claimIdleExpedition,
} from "@/lib/game/supabase-api";

export const Route = createFileRoute("/_authenticated/expeditions")({
  component: ExpeditionsPage,
});

type ActiveExpedition = {
  id: string;
  claimed: boolean;
  start_time: string;
  duration_minutes: number;
  realm_name: string;
  user_monster_id: string;
  user_monster?: {
    monster: {
      name: string;
      art_url?: string | null;
    };
  };
};

const REALMS = [
  {
    id: "void",
    name: "The Void",
    duration: 60,
    color: "var(--accent-void)",
    desc: "A 1-hour short expedition into nothingness.",
  },
  {
    id: "crimson",
    name: "Crimson Wastes",
    duration: 240,
    color: "var(--danger)",
    desc: "A 4-hour medium expedition yielding high combat EXP.",
  },
  {
    id: "astral",
    name: "Astral Peaks",
    duration: 720,
    color: "#b89047",
    desc: "A 12-hour deep dive. High chance of rare evolution materials.",
  },
];

function ExpeditionsPage() {
  const qc = useQueryClient();
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const monstersQ = useQuery({ queryKey: ["my-monsters"], queryFn: listMyMonsters });
  const expeditionsQ = useQuery({ queryKey: ["idle-expeditions"], queryFn: listIdleExpeditions });

  const [selectedRealm, setSelectedRealm] = useState(REALMS[0]);
  const [selectedMonster, setSelectedMonster] = useState<string | null>(null);

  const dispatchMut = useMutation({
    mutationFn: async ({
      monsterId,
      realmName,
      duration,
    }: {
      monsterId: string;
      realmName: string;
      duration: number;
    }) => {
      await dispatchIdleExpedition(monsterId, realmName, duration, 10);
    },
    onSuccess: () => {
      toast.success("Monster dispatched!");
      setSelectedMonster(null);
      qc.invalidateQueries({ queryKey: ["idle-expeditions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const claimMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await claimIdleExpedition(id);
      return res;
    },
    onSuccess: (data) => {
      toast.success("Expedition Complete! Loot claimed.");
      shootConfetti();
      qc.invalidateQueries({ queryKey: ["idle-expeditions"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const shootConfetti = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  if (profileQ.isLoading || expeditionsQ.isLoading) {
    return (
      <div
        className="min-h-screen grid place-items-center"
        style={{ color: "#3d2e1f" }}
      >
        Loading expeditions…
      </div>
    );
  }

  if (!profileQ.data) return null;

  const activeExpeditions = (expeditionsQ.data?.expeditions ?? []).filter(
    (e: ActiveExpedition) => !e.claimed,
  );

  // Calculate remaining time for active expeditions
  const calculateProgress = (start: string, durationMinutes: number) => {
    const startTime = new Date(start).getTime();
    const endTime = startTime + durationMinutes * 60000;
    const now = new Date().getTime();
    const progress = Math.min(100, Math.max(0, ((now - startTime) / (endTime - startTime)) * 100));
    const isDone = now >= endTime;
    return { progress, isDone };
  };

  return (
    <AppShell profile={profileQ.data.profile}>
      <AtmosphereBackdrop
        realm={selectedRealm.id as React.ComponentProps<typeof AtmosphereBackdrop>["realm"]}
      />

      <div className="relative z-10 p-4 md:p-8 max-w-5xl mx-auto pt-20">
        <header className="mb-8 text-center">
          <h1
            className="t-h1 text-4xl mb-2"
            style={{ color: "#b89047", textShadow: "0 0 20px #b89047" }}
          >
            Astral Expeditions
          </h1>
          <p style={{ color: "#3d2e1f" }}>
            Dispatch your inactive companions to cultivate and gather resources.
          </p>
        </header>

        {/* Active Expeditions Strip */}
        {activeExpeditions.length > 0 && (
          <div className="mb-10">
            <h2 className="t-h3 mb-4" style={{ color: "#2a1e12" }}>
              Active Dispatches
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeExpeditions.map((exp) => {
                const { progress, isDone } = calculateProgress(
                  exp.start_time,
                  exp.duration_minutes,
                );
                const monster = (exp as ActiveExpedition).user_monster?.monster;
                return (
                  <div
                    key={exp.id}
                    className="ss-card flex flex-col p-4 relative overflow-hidden group"
                  >
                    <div className="flex gap-4 items-center mb-4">
                      {monster && (
                        <img
                          src={
                            monster.art_url
                              ? monster.art_url
                              : `/sprites/monsters/${monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
                          }
                          alt={monster.name}
                          className="w-16 h-16 object-contain drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]"
                          onError={(e) => {
                            e.currentTarget.src = "/monsters/placeholder.png";
                          }}
                        />
                      )}
                      <div>
                        <h3 className="font-bold text-lg" style={{ color: "#2a1e12" }}>
                          {monster?.name}
                        </h3>
                        <p className="text-xs" style={{ color: "#3d2e1f" }}>
                          Cultivating in {exp.realm_name}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full overflow-hidden bg-[#f4ecd8]/50 mb-4 border border-[rgba(61,46,31,0.1)]">
                      <div
                        className="h-full transition-all duration-1000"
                        style={{
                          width: `${progress}%`,
                          background: isDone ? "var(--success)" : "#b89047",
                          boxShadow: isDone ? "0 0 10px var(--success)" : "0 0 10px #b89047",
                        }}
                      />
                    </div>

                    {isDone ? (
                      <button
                        onClick={() => claimMut.mutate(exp.id)}
                        disabled={claimMut.isPending}
                        className="ss-btn ss-btn-d-primary shadow-[0_0_15px_rgba(45,212,191,0.4)]"
                      >
                        Claim Loot
                      </button>
                    ) : (
                      <button
                        disabled
                        className="ss-btn opacity-50 cursor-not-allowed border border-[#3d2e1f]/10 text-[#3d2e1f]/50"
                      >
                        {Math.floor(progress)}% Complete
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Realm Selection */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <h2 className="t-h3" style={{ color: "#2a1e12" }}>
              Select Realm
            </h2>
            {REALMS.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRealm(r)}
                className={`ss-card p-4 text-left border-l-4 transition-all hover:scale-105 ${selectedRealm.id === r.id ? "shadow-[0_0_20px_rgba(0,0,0,0.5)]" : "opacity-70"}`}
                style={{
                  borderLeftColor: r.color,
                  ...(selectedRealm.id === r.id && { borderColor: r.color }),
                }}
              >
                <h3 className="text-lg font-bold" style={{ color: r.color }}>
                  {r.name}
                </h3>
                <p className="text-xs mt-1" style={{ color: "#3d2e1f" }}>
                  {r.desc}
                </p>
              </button>
            ))}
          </div>

          {/* Dispatch Panel */}
          <div className="lg:col-span-2">
            <h2 className="t-h3 mb-4" style={{ color: "#2a1e12" }}>
              Dispatch Companion
            </h2>
            <div className="ss-card p-6 bg-[#f4ecd8]/40 backdrop-blur-md border border-[rgba(61,46,31,0.1)] h-full flex flex-col">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-6 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                {monstersQ.data?.userMonsters
                  .filter((m: { id: string }) => m.id !== profileQ.data?.profile.soul_tether_id)
                  .map((um: { id: string; monster: { name: string; art_url?: string | null } }) => {
                    const isBusy = activeExpeditions.some((e) => e.user_monster_id === um.id);
                    const isSelected = selectedMonster === um.id;
                    return (
                      <button
                        key={um.id}
                        disabled={isBusy}
                        onClick={() => setSelectedMonster(um.id)}
                        className={`relative rounded-lg p-2 transition-all flex flex-col items-center ${isBusy ? "opacity-30 grayscale cursor-not-allowed" : "hover:scale-105 hover:bg-[#3d2e1f]/10"} ${isSelected ? "bg-[#3d2e1f]/10 border border-[#3d2e1f]/30 shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "border border-transparent"}`}
                      >
                        <img
                          src={
                            um.monster.art_url
                              ? um.monster.art_url
                              : `/sprites/monsters/${um.monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
                          }
                          alt={um.monster.name}
                          className="w-12 h-12 object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "/monsters/placeholder.png";
                          }}
                        />
                        <span
                          className="text-[10px] font-bold mt-2 truncate w-full text-center"
                          style={{ color: "#2a1e12" }}
                        >
                          {um.monster.name}
                        </span>
                        {isBusy && (
                          <div className="absolute inset-0 bg-[#f4ecd8]/50 flex items-center justify-center text-[10px] font-bold text-[#3d2e1f] uppercase tracking-widest">
                            Busy
                          </div>
                        )}
                      </button>
                    );
                  })}
              </div>

              <div className="pt-6 border-t border-[rgba(61,46,31,0.1)] flex justify-between items-center">
                <div>
                  <p className="text-sm" style={{ color: "#3d2e1f" }}>
                    Realm:{" "}
                    <strong style={{ color: selectedRealm.color }}>{selectedRealm.name}</strong>
                  </p>
                  <p className="text-sm" style={{ color: "#3d2e1f" }}>
                    Duration: <strong>{selectedRealm.duration / 60} Hours</strong>
                  </p>
                </div>
                <button
                  onClick={() =>
                    dispatchMut.mutate({
                      monsterId: selectedMonster!,
                      realmName: selectedRealm.name,
                      duration: selectedRealm.duration,
                    })
                  }
                  disabled={!selectedMonster || dispatchMut.isPending}
                  className="ss-btn ss-btn-d-primary px-8 text-lg uppercase tracking-widest disabled:opacity-50"
                >
                  {dispatchMut.isPending ? "Opening Portal..." : "Dispatch"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
