import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { AppShell } from "@/components/game/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  getMyProfile,
  listMyMonsters,
  updateTeamSlot,
  listTasks,
  harvestIsland,
  createTask,
} from "@/lib/game/supabase-api";
import { RARITY_COLOR, RARITY_GLOW, type Rarity } from "@/lib/game/gacha.constants";
import { supabase } from "@/integrations/supabase/client";
import { Icon } from "@/components/ui/Icon";
import { LoadingScreen } from "@/components/game/LoadingScreen";
import { MonsterCard } from "@/components/game/MonsterCard";
import { IslandZones } from "@/components/game/IslandZones";

export const Route = createFileRoute("/_authenticated/island")({
  component: IslandPage,
});

type IslandTeamMember = {
  monster: {
    realm_id: number;
    element: string;
  };
};

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

  const harvestMut = useMutation({
    mutationFn: async () => harvestIsland(),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success(`Condensed ${res.harvested} Spirit Stones!`);
      if (res.whisperName) {
        toast.info(`${res.whisperName} looks pleased with the harvest.`);
      }
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
      if (!profile || profile.gold < 1000)
        throw new Error("Not enough Spirit Stones (1000 required).");
      if (potions < 5) throw new Error("Not enough Tribulation Pills (5 required).");

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

      await createTask({
        type: "todo",
        title: `Heavenly Tribulation: ${um?.monster?.name || "Beast"}`,
        notes: JSON.stringify({ monsterId }),
        category: "tribulation",
        difficulty: "hard",
      });

      return um;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-monsters"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tribulation Task added to your Quest Board! Complete it to ascend.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const userMonsters = useMemo(() => monstersQ.data?.userMonsters ?? [], [monstersQ.data]);
  const team = useMemo(
    () =>
      userMonsters
        .filter((um: { is_on_team: boolean; team_slot: number | null }) => um.is_on_team)
        .sort(
          (
            a: { is_on_team: boolean; team_slot: number | null },
            b: { is_on_team: boolean; team_slot: number | null },
          ) => (a.team_slot ?? 99) - (b.team_slot ?? 99),
        ),
    [userMonsters],
  );
  const roster = useMemo(
    () =>
      userMonsters.filter(
        (um: { is_on_team: boolean; team_slot: number | null }) => !um.is_on_team,
      ),
    [userMonsters],
  );

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

  const basePower = team.reduce(
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
    team.reduce((acc: Record<string, number>, t: IslandTeamMember) => {
      acc[t.monster.realm_id] = (acc[t.monster.realm_id] || 0) + 1;
      return acc;
    }, {}),
  );
  const elementCounts = Object.values(
    team.reduce((acc: Record<string, number>, t: IslandTeamMember) => {
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

  const pendingHarvest = useMemo(() => {
    const profile = profileQ.data?.profile;
    if (!profile || team.length === 0) return 0;
    const lastHarvest = new Date(profile.island_last_harvest_at || Date.now());
    const hours = (Date.now() - lastHarvest.getTime()) / 3600000;

    let gold = 0;
    for (const um of team) {
      const r = um.monster.rarity;
      let mult = 1;
      if (r === "uncommon") mult = 1.2;
      if (r === "rare") mult = 1.5;
      if (r === "epic") mult = 2.0;
      if (r === "legendary") mult = 3.0;
      if (r === "ex") mult = 5.0;
      gold += (um.bond_percent / 100.0) * mult * 0.5 * hours;
    }
    return Math.floor(gold) + (profile.island_pending_gold || 0);
  }, [profileQ.data?.profile, team]);

  if (profileQ.isLoading) return <LoadingScreen realmSlug="divine-threshold" />;
  if (!profileQ.data) return null;

  return (
    <AppShell profile={profileQ.data.profile}>
      <div className="relative min-h-screen">
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
          <div className="mb-6">
            <div
              className="w-16 h-16 flex items-center justify-center mb-3"
              style={{
                border: "2px solid rgba(62,217,122,0.3)",
                borderRadius: 0,
                background: "rgba(62,217,122,0.06)",
                boxShadow: "3px 3px 0 rgba(0,0,0,0.4)",
              }}
            >
              <Icon
                name={weatherIcon}
                size={28}
                color={
                  weather === "sunny"
                    ? "var(--gold-bright)"
                    : weather === "overcast"
                      ? "var(--ink-secondary)"
                      : "var(--danger)"
                }
              />
            </div>
            <h1
              className="text-3xl font-bold"
              style={{
                fontFamily: "var(--ss-font-pixel)",
                color: "var(--gold-ink)",
                letterSpacing: "0.08em",
              }}
            >
              CULTIVATION REALM
            </h1>
          </div>

          {/* Weather banner */}
          <div
            className="ss-card mb-6 flex items-center gap-3"
            style={{
              background: weatherBg,
              borderColor:
                weather === "sunny"
                  ? "rgba(95,173,65,0.2)"
                  : weather === "overcast"
                    ? "rgba(200,154,62,0.2)"
                    : "rgba(224,82,82,0.2)",
            }}
          >
            <div
              className="w-10 h-10 grid place-items-center flex-shrink-0"
              style={{
                borderRadius: 0,
                background:
                  weather === "sunny"
                    ? "rgba(95,173,65,0.15)"
                    : weather === "overcast"
                      ? "rgba(255,183,77,0.15)"
                      : "rgba(224,82,82,0.15)",
              }}
            >
              <Icon
                name={weatherIcon}
                size={20}
                color={
                  weather === "sunny"
                    ? "var(--success)"
                    : weather === "overcast"
                      ? "var(--gold-bright)"
                      : "var(--danger)"
                }
              />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--ink-primary)" }}>
                {weather === "sunny" && "Heaven's Light"}
                {weather === "overcast" && "Tribulation Clouds"}
                {weather === "stormy" && "Demonic Qi Storm"}
              </p>
              <p className="text-xs" style={{ color: "var(--ink-secondary)" }}>
                {weather === "sunny" && "All dailies complete — your realm prospers!"}
                {weather === "overcast" &&
                  `${completedDailies}/${dailies.length} dailies done — clouds gather.`}
                {weather === "stormy" &&
                  `Only ${completedDailies}/${dailies.length} dailies — demonic qi rages!`}
              </p>
            </div>
          </div>

          {/* Synergy indicators */}
          {(realmSynergy || elementSynergy) && (
            <div className="flex gap-2 mb-4">
              {realmSynergy && (
                <span
                  className="text-[9px] px-2 py-1 font-bold uppercase"
                  style={{
                    fontFamily: "var(--ss-font-pixel)",
                    borderRadius: 0,
                    background: "rgba(200,154,62,0.1)",
                    color: "var(--gold-ink)",
                    border: "1px solid rgba(200,154,62,0.2)",
                  }}
                >
                  Realm Synergy +15%
                </span>
              )}
              {elementSynergy && (
                <span
                  className="text-[9px] px-2 py-1 font-bold uppercase"
                  style={{
                    fontFamily: "var(--ss-font-pixel)",
                    borderRadius: 0,
                    background: "rgba(56,184,245,0.1)",
                    color: "#38b8f5",
                    border: "1px solid rgba(56,184,245,0.2)",
                  }}
                >
                  Element Synergy +5%
                </span>
              )}
            </div>
          )}

          {/* Team slots */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="t-h3 text-lg font-bold" style={{ color: "var(--ink-primary)" }}>
                Your Team
              </h2>
              <div className="flex items-center gap-4">
                {pendingHarvest > 0 && (
                  <button
                    onClick={() => harvestMut.mutate()}
                    disabled={harvestMut.isPending}
                    className="ss-btn ss-btn-d-primary animate-pulse"
                    style={{
                      background: "linear-gradient(135deg, var(--success), var(--realm-wild))",
                    }}
                  >
                    Condense {pendingHarvest} Spirit Stones
                  </button>
                )}
                <span className="text-sm font-serif" style={{ color: "var(--gold-ink)" }}>
                  CP: {teamPower.toLocaleString()}
                </span>
              </div>
            </div>
            <IslandZones monsters={team} onEmptyClick={(slot) => setAssignSlot(slot)} />
          </div>

          {/* Monster roster */}
          <h2 className="t-h3 text-lg font-bold mb-3" style={{ color: "var(--ink-primary)" }}>
            Contracted Spirits ({roster.length})
          </h2>
          {roster.length === 0 ? (
            <EmptyState
              icon="sparkle"
              title="The Realm Awaits Its First Inhabitant"
              body="Summon from the Altar. Place them here. Watch them grow."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {roster.map(
                (
                  um: {
                    id: string;
                    monster: { name: string; rarity: string; element: string };
                    level: number;
                    bond_percent: number;
                    ascension_level: number;
                    is_on_team: boolean;
                  },
                  i: number,
                ) => {
                  const r = um.monster.rarity as Rarity;
                  const isMaxBond = um.bond_percent >= 100;
                  return (
                    <motion.div
                      key={um.id}
                      className="relative w-full"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                    >
                      <MonsterCard
                        monster={um}
                        compact={true}
                        onClick={() =>
                          assignSlot !== null
                            ? slotMut.mutate({ userMonsterId: um.id, slot: assignSlot })
                            : undefined
                        }
                      />
                      {assignSlot !== null && (
                        <div
                          className="absolute inset-0 border-2 pointer-events-none"
                          style={{ borderRadius: 0, borderColor: "var(--gold-bright)" }}
                        />
                      )}
                      {isMaxBond && (
                        <button
                          onClick={() => ascendMut.mutate(um.id)}
                          disabled={ascendMut.isPending}
                          className="w-full mt-2 py-1.5 text-[10px] font-bold uppercase transition-all disabled:opacity-50"
                          style={{
                            borderRadius: 0,
                            fontFamily: "var(--ss-font-pixel)",
                            boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
                            background:
                              "linear-gradient(135deg, rgba(200,154,62,0.15), rgba(200,154,62,0.08))",
                            color: "var(--gold-ink)",
                            border: "1px solid rgba(200,154,62,0.3)",
                          }}
                        >
                          {ascendMut.isPending ? "..." : `Ascend`}
                        </button>
                      )}
                    </motion.div>
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
            <p className="text-sm font-semibold" style={{ color: "var(--gold-ink)" }}>
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
