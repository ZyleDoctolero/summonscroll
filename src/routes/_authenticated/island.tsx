import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/game/AppShell";
import { getMyProfile } from "@/lib/game/profile.functions";
import { listMyMonsters, updateTeamSlot, listRealms } from "@/lib/game/compendium.functions";
import { listTasks } from "@/lib/game/tasks.functions";
import { RARITY_COLOR, RARITY_GLOW, type Rarity } from "@/lib/game/gacha.constants";

export const Route = createFileRoute("/_authenticated/island")({
  head: () => ({ meta: [{ title: "Island — SummonScroll" }] }),
  component: IslandPage,
});

function IslandPage() {
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const fetchMonsters = useServerFn(listMyMonsters);
  const fetchTasks = useServerFn(listTasks);
  const doUpdateSlot = useServerFn(updateTeamSlot);

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const monstersQ = useQuery({ queryKey: ["my-monsters"], queryFn: () => fetchMonsters() });
  const tasksQ = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks() });

  const [assignSlot, setAssignSlot] = useState<number | null>(null);

  const slotMut = useMutation({
    mutationFn: async (v: any) => doUpdateSlot({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-monsters"] });
      setAssignSlot(null);
      toast.success("Team updated!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const userMonsters = monstersQ.data?.userMonsters ?? [];
  const team = useMemo(() => userMonsters.filter((um: any) => um.is_on_team).sort((a: any) => (a.team_slot ?? 99) - (b.team_slot ?? 99)), [userMonsters]);
  const roster = useMemo(() => userMonsters.filter((um: any) => !um.is_on_team), [userMonsters]);

  // Weather based on today's task completion
  const tasks = (tasksQ.data?.tasks ?? []) as Array<{ type: string; completed: boolean }>;
  const dailies = tasks.filter((t) => t.type === "daily");
  const completedDailies = dailies.filter((t) => t.completed).length;
  const completionPct = dailies.length > 0 ? (completedDailies / dailies.length) * 100 : 100;
  const weather = completionPct >= 100 ? "sunny" : completionPct >= 50 ? "overcast" : "stormy";
  const weatherEmoji = weather === "sunny" ? "☀" : weather === "overcast" ? "🌥" : "⛈";
  const weatherBg = weather === "sunny" ? "rgba(95,173,65,0.08)" : weather === "overcast" ? "rgba(255,183,77,0.08)" : "rgba(224,82,82,0.08)";

  const teamPower = team.reduce((sum: number, um: { monster: { base_atk: number; base_def: number; base_hp: number }; level: number; bond_percent: number }) => {
    const m = um.monster;
    const power = (m.base_atk + m.base_def + m.base_hp / 10) * (1 + um.level * 0.05);
    const fatigue = um.bond_percent < 10 ? 0.7 : 1;
    return sum + Math.round(power * fatigue);
  }, 0);

  if (profileQ.isLoading) return <div className="min-h-screen grid place-items-center" style={{ background: "#0C0E14", color: "#A09D96" }}>Loading…</div>;
  if (!profileQ.data) return null;

  return (
    <AppShell profile={profileQ.data.profile}>
      <div className="p-6 md:p-10 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-bold" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>Your Island</h1>
          <span className="text-2xl">{weatherEmoji}</span>
        </div>

        {/* Weather banner */}
        <div className="rounded-xl p-4 mb-6 border" style={{ background: weatherBg, borderColor: "rgba(255,255,255,0.05)" }}>
          <p className="text-sm" style={{ color: "#A09D96" }}>
            {weather === "sunny" && "☀ All dailies complete — your island basks in sunlight!"}
            {weather === "overcast" && `🌥 ${completedDailies}/${dailies.length} dailies done — clouds gather over your island.`}
            {weather === "stormy" && `⛈ Only ${completedDailies}/${dailies.length} dailies done — storms rage across your island!`}
          </p>
        </div>

        {/* Team slots */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold" style={{ color: "#F0EDE6", fontFamily: "'Cinzel',serif" }}>Your Team</h2>
            <span className="text-sm font-mono" style={{ color: "#FFD54F" }}>Power: {teamPower.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((slot) => {
              const um = team.find((t: any) => t.team_slot === slot);
              if (um) {
                const r = um.monster.rarity as Rarity;
                const fatigued = um.bond_percent < 10;
                return (
                  <div key={slot} className="rounded-lg p-3 text-center relative" style={{
                    background: "#13161F", border: `1px solid ${RARITY_COLOR[r]}`,
                    boxShadow: r !== "common" ? RARITY_GLOW[r] : undefined,
                    opacity: fatigued ? 0.5 : 1, filter: fatigued ? "grayscale(0.7)" : undefined,
                  }}>
                    <div className="w-full aspect-square rounded mb-2 flex items-center justify-center text-2xl" style={{ background: "#1A1E2A" }}>👾</div>
                    <p className="text-[10px] font-bold truncate" style={{ color: "#F0EDE6", fontFamily: "'Cinzel',serif" }}>{um.monster.name}</p>
                    <p className="text-[9px]" style={{ color: "#A09D96" }}>Lvl {um.level} · Bond {Math.round(um.bond_percent)}%</p>
                    {fatigued && <div className="absolute top-1 right-1 text-[10px] px-1 rounded" style={{ background: "rgba(224,82,82,0.8)", color: "#fff" }}>⚡FATIGUE</div>}
                    <button onClick={() => slotMut.mutate({ userMonsterId: um.id, slot: null })}
                      className="mt-1 text-[9px] px-2 py-0.5 rounded" style={{ color: "#E05252", background: "rgba(224,82,82,0.1)" }}>Remove</button>
                  </div>
                );
              }
              return (
                <button key={slot} onClick={() => setAssignSlot(slot)}
                  className="rounded-lg p-3 border-2 border-dashed flex flex-col items-center justify-center min-h-[120px]"
                  style={{ borderColor: "rgba(255,255,255,0.1)", color: "#6B6864" }}>
                  <span className="text-2xl mb-1">+</span>
                  <span className="text-[10px]">Slot {slot}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Monster roster */}
        <h2 className="text-lg font-bold mb-3" style={{ color: "#F0EDE6", fontFamily: "'Cinzel',serif" }}>
          Available Monsters ({roster.length})
        </h2>
        {roster.length === 0 ? (
          <div className="text-center py-12 rounded-xl border-2 border-dashed" style={{ borderColor: "rgba(255,255,255,0.08)", color: "#6B6864" }}>
            <p className="text-3xl mb-2">📖</p>
            <p className="text-sm">No monsters yet. Visit the Altar to summon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {roster.map((um: any) => {
              const r = um.monster.rarity as Rarity;
              return (
                <button key={um.id}
                  onClick={() => assignSlot !== null ? slotMut.mutate({ userMonsterId: um.id, slot: assignSlot }) : undefined}
                  className="rounded-lg p-2 text-center transition-all hover:scale-[1.03]"
                  style={{
                    background: "#13161F", border: `1px solid ${RARITY_COLOR[r]}40`,
                    outline: assignSlot !== null ? "2px solid #FFD54F" : undefined,
                  }}>
                  <div className="w-full aspect-square rounded mb-1 flex items-center justify-center text-xl" style={{ background: "#1A1E2A" }}>👾</div>
                  <p className="text-[10px] font-bold truncate" style={{ color: "#F0EDE6" }}>{um.monster.name}</p>
                  <p className="text-[9px]" style={{ color: RARITY_COLOR[r] }}>{um.monster.rarity}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Assign modal */}
      {assignSlot !== null && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 border-t" style={{ background: "#1A1E2A", borderColor: "rgba(255,213,79,0.3)" }}>
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-sm" style={{ color: "#FFD54F" }}>Select a monster for Slot {assignSlot}</p>
            <button onClick={() => setAssignSlot(null)} className="px-4 py-1 rounded text-xs" style={{ background: "rgba(255,255,255,0.05)", color: "#A09D96" }}>Cancel</button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
