import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/game/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { getMyProfile, listMyMonsters, updateTeamSlot, listTasks } from "@/lib/game/supabase-api";
import { RARITY_COLOR, RARITY_GLOW, type Rarity } from "@/lib/game/gacha.constants";
import { supabase } from "@/integrations/supabase/client";
import { Icon } from "@/components/ui/Icon";

export const Route = createFileRoute("/_authenticated/island")({
  component: IslandPage,
});

function IslandPage() {
  const qc = useQueryClient();

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const monstersQ = useQuery({ queryKey: ["my-monsters"], queryFn: listMyMonsters });
  const tasksQ = useQuery({ queryKey: ["tasks"], queryFn: listTasks });

  const [assignSlot, setAssignSlot] = useState<number | null>(null);

  const slotMut = useMutation({
    mutationFn: async (v: { userMonsterId: string; slot: number | null }) =>
      updateTeamSlot(v.userMonsterId, v.slot),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-monsters"] });
      setAssignSlot(null);
      toast.success("Team updated!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const invQ = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data } = await supabase.from("inventory").select("*").eq("user_id", user!.id);
      return data ?? [];
    },
  });

  const ascendMut = useMutation({
    mutationFn: async (monsterId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const profile = profileQ.data?.profile;
      const inv = invQ.data ?? [];
      const potions = inv.find((i) => i.item_type === "realm_potion")?.quantity ?? 0;
      if (!profile || profile.gold < 1000) throw new Error("Not enough gold (1000 required).");
      if (potions < 5) throw new Error("Not enough Realm Potions (5 required).");

      await supabase
        .from("profiles")
        .update({ gold: profile.gold - 1000 })
        .eq("id", user!.id);
      const potionId = inv.find((i) => i.item_type === "realm_potion")!.id;
      if (potions === 5) await supabase.from("inventory").delete().eq("id", potionId);
      else
        await supabase
          .from("inventory")
          .update({ quantity: potions - 5 })
          .eq("id", potionId);

      const um = monstersQ.data!.userMonsters.find((m) => m.id === monsterId);
      await supabase
        .from("user_monsters")
        .update({ ascension_level: (um?.ascension_level ?? 0) + 1 })
        .eq("id", monsterId);
      return um;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-monsters"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Monster Ascended! Stats and Power have increased.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const userMonsters = monstersQ.data?.userMonsters ?? [];
  const team = useMemo(
    () =>
      userMonsters
        .filter((um: any) => um.is_on_team)
        .sort((a: any, b: any) => (a.team_slot ?? 99) - (b.team_slot ?? 99)),
    [userMonsters],
  );
  const roster = useMemo(() => userMonsters.filter((um: any) => !um.is_on_team), [userMonsters]);

  // Weather based on today's task completion
  const tasks = (tasksQ.data?.tasks ?? []) as Array<{ type: string; completed: boolean }>;
  const dailies = tasks.filter((t) => t.type === "daily");
  const completedDailies = dailies.filter((t) => t.completed).length;
  const completionPct = dailies.length > 0 ? (completedDailies / dailies.length) * 100 : 100;
  const weather = completionPct >= 100 ? "sunny" : completionPct >= 50 ? "overcast" : "stormy";
  const weatherIcon =
    weather === "sunny" ? "morning" : weather === "overcast" ? "evening" : "death";
  const weatherBg =
    weather === "sunny"
      ? "rgba(95,173,65,0.08)"
      : weather === "overcast"
        ? "rgba(255,183,77,0.08)"
        : "rgba(224,82,82,0.08)";

  let basePower = team.reduce(
    (
      sum: number,
      um: {
        monster: {
          base_atk: number;
          base_def: number;
          base_hp: number;
          realm_id: number;
          element: string;
        };
        level: number;
        bond_percent: number;
        ascension_level: number;
      },
    ) => {
      const m = um.monster;
      const power =
        (m.base_atk + m.base_def + m.base_hp / 10) *
        (1 + um.level * 0.05) *
        (1 + (um.ascension_level ?? 0) * 0.1);
      const fatigue = um.bond_percent < 10 ? 0.7 : 1;
      return sum + Math.round(power * fatigue);
    },
    0,
  );

  const realmCounts = Object.values(
    team.reduce((acc: Record<string, number>, t: any) => {
      acc[t.monster.realm_id] = (acc[t.monster.realm_id] || 0) + 1;
      return acc;
    }, {}),
  );
  const elementCounts = Object.values(
    team.reduce((acc: Record<string, number>, t: any) => {
      acc[t.monster.element] = (acc[t.monster.element] || 0) + 1;
      return acc;
    }, {}),
  );

  const realmSynergy = realmCounts.some((c) => (c as number) >= 3);
  const elementSynergy = elementCounts.some((c) => (c as number) >= 2);

  let synergyMult = 1.0;
  if (realmSynergy) synergyMult += 0.15;
  if (elementSynergy) synergyMult += 0.05;

  const teamPower = Math.round(basePower * synergyMult);

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

  return (
    <AppShell profile={profileQ.data.profile}>
      <div className="bg-atmos bg-atmos-hub relative min-h-screen">
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <h1 className="t-h1 text-3xl font-bold" style={{ color: "var(--gold-bright)" }}>
              Your Island
            </h1>
            <Icon
              name={weatherIcon}
              size={24}
              color={
                weather === "sunny"
                  ? "var(--gold-bright)"
                  : weather === "overcast"
                    ? "var(--ink-secondary)"
                    : "var(--danger)"
              }
            />
          </div>

          {/* Weather banner */}
          <div
            className="ss-card mb-6"
            style={{ background: weatherBg, borderColor: "var(--ss-border)" }}
          >
            <div
              className="text-sm flex items-center gap-2"
              style={{ color: "var(--ink-secondary)" }}
            >
              <Icon
                name={weatherIcon}
                size={16}
                color={
                  weather === "sunny"
                    ? "var(--success)"
                    : weather === "overcast"
                      ? "var(--gold-glow)"
                      : "var(--danger)"
                }
              />
              <span>
                {weather === "sunny" && "All dailies complete — your island basks in sunlight!"}
                {weather === "overcast" &&
                  `${completedDailies}/${dailies.length} dailies done — clouds gather over your island.`}
                {weather === "stormy" &&
                  `Only ${completedDailies}/${dailies.length} dailies done — storms rage across your island!`}
              </span>
            </div>
          </div>

          {/* Team slots */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="t-h3 text-lg font-bold" style={{ color: "var(--ink-primary)" }}>
                Your Team
              </h2>
              <span className="text-sm font-mono" style={{ color: "var(--gold-bright)" }}>
                Power: {teamPower.toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((slot) => {
                const um = team.find((t: any) => t.team_slot === slot);
                if (um) {
                  const r = um.monster.rarity as Rarity;
                  const fatigued = um.bond_percent < 10;
                  const ascensionLevel = um.ascension_level ?? 0;
                  return (
                    <div
                      key={slot}
                      className="ss-card text-center relative"
                      style={{
                        borderColor: RARITY_COLOR[r],
                        boxShadow: r !== "common" ? RARITY_GLOW[r] : undefined,
                        opacity: fatigued ? 0.5 : 1,
                      }}
                    >
                      {ascensionLevel > 0 && (
                        <div
                          className="absolute -top-2 -right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "linear-gradient(135deg,#8A2387,#E94057,#F27121)",
                            color: "#fff",
                          }}
                        >
                          +{ascensionLevel}
                        </div>
                      )}
                      <div className="w-full aspect-square rounded mb-2 flex items-center justify-center overflow-hidden ss-pane">
                        <img
                          src="/monsters/placeholder.png"
                          className="w-full h-full object-cover"
                          alt="Monster"
                        />
                      </div>
                      <p className="t-label truncate" style={{ color: "var(--ink-primary)" }}>
                        {um.monster.name}
                      </p>
                      <p className="text-[9px]" style={{ color: "var(--ink-secondary)" }}>
                        Lvl {um.level} · Bond {Math.round(um.bond_percent)}%
                      </p>
                      {fatigued && (
                        <div
                          className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"
                          style={{ background: "var(--danger)", color: "#fff" }}
                        >
                          <Icon name="stamina" size={10} color="#fff" />
                          <span>FATIGUE</span>
                        </div>
                      )}
                      <button
                        onClick={() => slotMut.mutate({ userMonsterId: um.id, slot: null })}
                        className="mt-1 text-[9px] px-2 py-0.5 rounded font-semibold"
                        style={{ color: "var(--danger)", background: "rgba(255,94,94,0.1)" }}
                      >
                        Remove
                      </button>
                    </div>
                  );
                }
                return (
                  <button
                    key={slot}
                    onClick={() => setAssignSlot(slot)}
                    className="rounded-lg p-3 border-2 border-dashed flex flex-col items-center justify-center min-h-[120px] transition-colors hover:border-white/20"
                    style={{ borderColor: "var(--ss-border)", color: "var(--ink-tertiary)" }}
                  >
                    <span className="text-2xl mb-1">+</span>
                    <span className="text-[10px]">Slot {slot}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Monster roster */}
          <h2 className="t-h3 text-lg font-bold mb-3" style={{ color: "var(--ink-primary)" }}>
            Available Monsters ({roster.length})
          </h2>
          {roster.length === 0 ? (
            <EmptyState
              icon="sparkle"
              title="The island feels empty."
              body="Visit the Altar to summon your first companion."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {roster.map(
                (um: {
                  id: string;
                  monster: { name: string; rarity: string; element: string };
                  level: number;
                  bond_percent: number;
                  ascension_level: number;
                  is_on_team: boolean;
                }) => {
                  const r = um.monster.rarity as Rarity;
                  const isMaxBond = um.bond_percent >= 100;
                  return (
                    <div
                      key={um.id}
                      className="ss-card text-center p-2"
                      style={{
                        borderColor: `${RARITY_COLOR[r]}40`,
                        outline: assignSlot !== null ? "2px solid var(--gold-bright)" : undefined,
                      }}
                    >
                      <button
                        onClick={() =>
                          assignSlot !== null
                            ? slotMut.mutate({ userMonsterId: um.id, slot: assignSlot })
                            : undefined
                        }
                        className="w-full"
                      >
                        <div className="w-full aspect-square rounded mb-1 flex items-center justify-center overflow-hidden ss-pane">
                          <img
                            src="/monsters/placeholder.png"
                            className="w-full h-full object-cover"
                            alt="Monster"
                          />
                        </div>
                        <p
                          className="text-[10px] font-bold truncate"
                          style={{ color: "var(--ink-primary)" }}
                        >
                          {um.monster.name}
                        </p>
                        <p className="text-[9px]" style={{ color: RARITY_COLOR[r] }}>
                          {um.monster.rarity}
                        </p>
                      </button>
                      {isMaxBond && (
                        <button
                          onClick={() => ascendMut.mutate(um.id)}
                          disabled={ascendMut.isPending}
                          className="w-full mt-2 py-1 rounded text-[10px] font-bold text-white transition-all hover:opacity-80 disabled:opacity-50"
                          style={{ background: "linear-gradient(135deg,#8A2387,#E94057)" }}
                        >
                          {ascendMut.isPending ? "..." : `Ascend (1000g, 5 Potions)`}
                        </button>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>
      </div>

      {/* Assign modal */}
      {assignSlot !== null && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 p-4 border-t ss-modal rounded-b-none"
          style={{ background: "var(--bg-stage)" }}
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: "var(--gold-bright)" }}>
              Select a monster for Slot {assignSlot}
            </p>
            <button
              onClick={() => setAssignSlot(null)}
              className="ss-btn ss-btn-secondary py-1 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
