import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/game/AppShell";
import { AkashicRecords } from "@/components/game/AkashicRecords";
import { LoadingScreen } from "@/components/game/LoadingScreen";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/akashic-records")({
  component: AkashicRecordsPage,
});

function AkashicRecordsPage() {
  const queryClient = useQueryClient();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return { profile: data, user };
    },
  });

  const { data: monsters } = useQuery({
    queryKey: ["my-monsters"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_monsters")
        .select("*, monster:monster_id(*)")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
  });

  const synthesizeMut = useMutation({
    mutationFn: async ({ targetId, fodderIds }: { targetId: string; fodderIds: string[] }) => {
      const { data, error } = await supabase.rpc("synthesize_monster_v2", {
        p_target_id: targetId,
        p_fodder_ids: fodderIds,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-monsters"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setSelectedTarget(null);
    },
  });

  if (!profile || !monsters) return <LoadingScreen realmSlug="void" />;

  const targetMonster = monsters.find((m) => m.id === selectedTarget);

  // Dummy fodder logic for the UI demonstration
  const requiredFodderCount = targetMonster?.current_star || 1;
  const availableFodder = monsters.filter(
    (m) => m.id !== selectedTarget && m.current_star === requiredFodderCount,
  );

  const requiredFodderNodes = Array.from({ length: requiredFodderCount }).map((_, i) => ({
    id: availableFodder[i]?.id || `empty-${i}`,
    name: availableFodder[i]?.monster?.name || "Empty",
    isAvailable: !!availableFodder[i],
    element: availableFodder[i]?.monster?.element || "none",
  }));

  return (
    <AppShell profile={profile.profile}>
      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 font-mono">
            AKASHIC RECORDS
          </h1>
          <p className="text-cyan-200/50 font-mono text-sm tracking-widest">
            SYNTHESIZE SOULS TO BREAK MORTAL LIMITS
          </p>
        </div>

        {!selectedTarget ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {monsters.map((m: any) => (
              <div
                key={m.id}
                onClick={() => setSelectedTarget(m.id)}
                className="system-panel p-4 text-center cursor-pointer hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all group"
              >
                <div className="text-cyan-400 font-mono font-bold">{m.current_star}★</div>
                <div className="text-xs text-white truncate">{m.monster?.name}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <button
              onClick={() => setSelectedTarget(null)}
              className="mb-8 text-cyan-500/50 hover:text-cyan-400 font-mono text-xs uppercase tracking-widest"
            >
              ← Return to Roster
            </button>

            <AkashicRecords
              targetId={targetMonster.id}
              targetName={targetMonster.monster?.name}
              targetStar={targetMonster.current_star}
              maxStarLevel={7}
              requiredFodder={requiredFodderNodes}
              isLocked={targetMonster.is_locked}
              onSynthesize={async (fodderIds) => {
                await synthesizeMut.mutateAsync({ targetId: targetMonster.id, fodderIds });
              }}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
