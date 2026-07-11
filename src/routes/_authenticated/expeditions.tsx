import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { AppShell } from "@/components/game/AppShell";
import { AtmosphereBackdrop } from "@/components/game/AtmosphereBackdrop";
import { Icon } from "@/components/ui/Icon";
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
    color: "var(--violet-ink)",
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
    color: "var(--gold-ink)",
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
    onSuccess: () => {
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

  const activeExpeditions = useMemo<ActiveExpedition[]>(
    () => (expeditionsQ.data?.expeditions ?? []).filter((e: ActiveExpedition) => !e.claimed),
    [expeditionsQ.data],
  );

  const dispatchable = useMemo(
    () =>
      (monstersQ.data?.userMonsters ?? []).filter(
        (m: { id: string }) => m.id !== profileQ.data?.profile.soul_tether_id,
      ),
    [monstersQ.data, profileQ.data],
  );

  if (profileQ.isLoading || expeditionsQ.isLoading) {
    return (
      <div
        className="min-h-screen grid place-items-center"
        style={{ color: "var(--ink-secondary)" }}
      >
        Loading expeditions…
      </div>
    );
  }

  if (profileQ.isError || expeditionsQ.isError) {
    return (
      <div
        className="min-h-screen grid place-items-center p-6 text-center"
        style={{ color: "var(--ink-secondary)" }}
      >
        <div>
          <p className="mb-4">The portal flickered — expeditions failed to load.</p>
          <button
            onClick={() => {
              profileQ.refetch();
              expeditionsQ.refetch();
            }}
            className="ss-btn ss-btn-secondary min-h-[44px]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profileQ.data) return null;

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
        <header className="mb-8 text-center flex flex-col items-center">
          <div
            className="w-16 h-16 flex items-center justify-center mb-3"
            style={{
              border: "2px solid rgba(200,154,62,0.4)",
              borderRadius: 0,
              background: "rgba(200,154,62,0.08)",
              boxShadow: "3px 3px 0 rgba(0,0,0,0.4)",
            }}
          >
            <Icon name="compass" size={32} color="var(--gold-bright)" />
          </div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              fontFamily: "var(--ss-font-pixel)",
              color: "var(--gold-ink)",
              letterSpacing: "0.08em",
            }}
          >
            ASTRAL EXPEDITIONS
          </h1>
          <p className="max-w-md" style={{ color: "var(--ink-secondary)" }}>
            Dispatch your inactive companions to cultivate and gather resources.
          </p>
        </header>

        {/* Active Expeditions Strip */}
        {activeExpeditions.length > 0 && (
          <div className="mb-10">
            <h2 className="t-h3 mb-4" style={{ color: "var(--ink-primary)" }}>
              Active Dispatches
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeExpeditions.map((exp, i) => {
                const { progress, isDone } = calculateProgress(
                  exp.start_time,
                  exp.duration_minutes,
                );
                const monster = (exp as ActiveExpedition).user_monster?.monster;
                return (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
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
                          loading="lazy"
                          decoding="async"
                          className="w-16 h-16 object-contain drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]"
                          onError={(e) => {
                            e.currentTarget.src = "/monsters/placeholder.png";
                          }}
                        />
                      )}
                      <div>
                        <h3 className="font-bold text-lg" style={{ color: "var(--ink-primary)" }}>
                          {monster?.name}
                        </h3>
                        <p className="text-xs" style={{ color: "var(--ink-secondary)" }}>
                          Cultivating in {exp.realm_name}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div
                      className="ss-bar-pixel mb-4"
                      style={{ height: 8 }}
                      role="progressbar"
                      aria-label={`${exp.realm_name} expedition progress`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.floor(progress)}
                    >
                      <div
                        className="ss-bar-pixel-fill transition-all duration-1000"
                        style={{
                          width: `${progress}%`,
                          background: isDone ? "var(--success)" : "var(--gold-bright)",
                          boxShadow: isDone
                            ? "0 0 10px var(--success)"
                            : "0 0 10px var(--gold-bright)",
                        }}
                      />
                    </div>

                    {isDone ? (
                      <button
                        onClick={() => claimMut.mutate(exp.id)}
                        disabled={claimMut.isPending}
                        className="ss-btn ss-btn-d-primary min-h-[44px] shadow-[0_0_15px_rgba(45,212,191,0.4)]"
                      >
                        Claim Loot
                      </button>
                    ) : (
                      <button
                        disabled
                        className="ss-btn min-h-[44px] cursor-not-allowed border"
                        style={{
                          borderColor: "rgba(94,78,63,0.25)",
                          color: "var(--ink-secondary)",
                        }}
                      >
                        {Math.floor(progress)}% Complete
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Realm Selection */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <h2 className="t-h3" style={{ color: "var(--ink-primary)" }}>
              Select Realm
            </h2>
            {REALMS.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRealm(r)}
                aria-pressed={selectedRealm.id === r.id}
                className={`ss-card p-4 text-left border-l-4 transition-all hover:scale-105 min-h-[44px] ${selectedRealm.id === r.id ? "shadow-[0_0_20px_rgba(120,90,50,0.15)]" : "opacity-70"}`}
                style={{
                  borderLeftColor: r.color,
                  ...(selectedRealm.id === r.id && { borderColor: r.color }),
                }}
              >
                <h3 className="text-lg font-bold" style={{ color: "var(--ink-primary)" }}>
                  {r.name}
                </h3>
                <p className="text-xs mt-1" style={{ color: "var(--ink-secondary)" }}>
                  {r.desc}
                </p>
              </button>
            ))}
          </div>

          {/* Dispatch Panel */}
          <div className="lg:col-span-2">
            <h2 className="t-h3 mb-4" style={{ color: "var(--ink-primary)" }}>
              Dispatch Companion
            </h2>
            <div className="ss-card p-6 bg-[var(--bg-stage)]/60 border border-[rgba(61,46,31,0.1)] h-full flex flex-col">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-6 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                {monstersQ.isLoading ? (
                  <p
                    className="col-span-full text-center text-sm py-8"
                    style={{ color: "var(--ink-secondary)" }}
                  >
                    Loading companions…
                  </p>
                ) : dispatchable.length === 0 ? (
                  <p
                    className="col-span-full text-center text-sm py-8"
                    style={{ color: "var(--ink-secondary)" }}
                  >
                    No idle companions to dispatch. Recruit or free monsters on your Island first.
                  </p>
                ) : (
                  dispatchable.map(
                    (um: { id: string; monster: { name: string; art_url?: string | null } }) => {
                      const isBusy = activeExpeditions.some((e) => e.user_monster_id === um.id);
                      const isSelected = selectedMonster === um.id;
                      return (
                        <button
                          key={um.id}
                          disabled={isBusy}
                          onClick={() => setSelectedMonster(um.id)}
                          aria-pressed={isSelected}
                          className={`relative p-2 transition-all flex flex-col items-center min-h-[44px] ${isBusy ? "opacity-30 grayscale cursor-not-allowed" : ""} ${isSelected ? "bg-[var(--ink-secondary)]/10 border border-[var(--ink-secondary)]/30" : "border border-transparent"}`}
                          style={{
                            borderRadius: 0,
                            boxShadow: isSelected ? "3px 3px 0 rgba(0,0,0,0.3)" : undefined,
                          }}
                        >
                          <img
                            src={
                              um.monster.art_url
                                ? um.monster.art_url
                                : `/sprites/monsters/${um.monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
                            }
                            alt={um.monster.name}
                            loading="lazy"
                            decoding="async"
                            className="w-12 h-12 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = "/monsters/placeholder.png";
                            }}
                          />
                          <span
                            className="text-[11px] font-bold mt-2 truncate w-full text-center"
                            style={{ color: "var(--ink-primary)" }}
                          >
                            {um.monster.name}
                          </span>
                          {isBusy && (
                            <div className="absolute inset-0 bg-[var(--bg-stage)]/50 flex items-center justify-center text-[11px] font-bold text-[var(--ink-secondary)] uppercase tracking-widest">
                              Busy
                            </div>
                          )}
                        </button>
                      );
                    },
                  )
                )}
              </div>

              <div className="pt-6 border-t border-[rgba(61,46,31,0.1)] flex flex-wrap gap-3 justify-between items-center">
                <div>
                  <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
                    Realm:{" "}
                    <strong style={{ color: "var(--ink-primary)" }}>{selectedRealm.name}</strong>
                  </p>
                  <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
                    Duration:{" "}
                    <strong style={{ color: "var(--ink-primary)" }}>
                      {selectedRealm.duration / 60} Hours
                    </strong>
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
                  className="ss-btn ss-btn-d-primary px-8 min-h-[44px] text-lg uppercase tracking-widest disabled:opacity-50"
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
