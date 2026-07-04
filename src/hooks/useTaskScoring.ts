import { useMutation, useQueryClient } from "@tanstack/react-query";
import { scoreTask } from "@/lib/game/supabase-api";
import { showCascade, type CascadeEvent } from "@/components/game/CascadeCard";
import { whisper } from "@/components/game/WhisperFeed";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";

interface UseTaskScoringOptions {
  setBusyIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  profile: any;
  setShowTutorialFollowUp: (val: boolean) => void;
  setDeathTick: React.Dispatch<React.SetStateAction<number>>;
  triggerWhisper: (ticks: any[], realmId: number | null) => void;
  setActiveRealmPulse: (val: number | null) => void;
}

export function useTaskScoring({
  setBusyIds,
  profile,
  setShowTutorialFollowUp,
  setDeathTick,
  triggerWhisper,
  setActiveRealmPulse,
}: UseTaskScoringOptions) {
  const qc = useQueryClient();

  function shootConfetti() {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
    });
  }

  return useMutation({
    mutationFn: async (v: {
      id: string;
      direction: "plus" | "minus" | "complete" | "uncomplete";
    }) => {
      setBusyIds((s) => new Set(s).add(v.id));
      try {
        return await scoreTask(v.id, v.direction);
      } finally {
        setBusyIds((s) => {
          const n = new Set(s);
          n.delete(v.id);
          return n;
        });
      }
    },
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = qc.getQueryData(["tasks"]);
      qc.setQueryData(
        ["tasks"],
        (old: { tasks: { id: string; completed: boolean }[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            tasks: old.tasks.map((t: { id: string; completed: boolean }) => {
              if (t.id === v.id) {
                if (v.direction === "complete") return { ...t, completed: true };
                if (v.direction === "uncomplete") return { ...t, completed: false };
              }
              return t;
            }),
          };
        },
      );
      return { previousTasks };
    },
    onSuccess: async (res, variables) => {
      const wasTutorialDirective = profile?.tutorial_directive_id === variables.id;
      const wasPositiveScore = variables.direction === "plus" || variables.direction === "complete";

      if (wasTutorialDirective && wasPositiveScore) {
        setTimeout(() => setShowTutorialFollowUp(true), 1500);
      }

      const tasksData = qc.getQueryData<{ tasks: any[] }>(["tasks"]);
      const task = tasksData?.tasks?.find((t) => t.id === variables.id);

      if (task?.category === "tribulation" && variables.direction === "complete") {
        try {
          const parsed = JSON.parse(task.notes || "{}");
          if (parsed.monsterId) {
            const { data: um } = await supabase
              .from("user_monsters")
              .select("ascension_level")
              .eq("id", parsed.monsterId)
              .single();
            if (um) {
              await supabase
                .from("user_monsters")
                .update({ ascension_level: (um.ascension_level ?? 0) + 1 })
                .eq("id", parsed.monsterId);

              toast.success("Heavenly Tribulation Overcome! Beast Ascension complete.", {
                icon: "⚡",
              });
              await supabase.from("tasks").delete().eq("id", task.id);
            }
          }
        } catch (e) {
          console.error("Tribulation processing failed", e);
        }
      }

      const events: CascadeEvent[] = [];

      if (
        res?.reward &&
        (res.reward.gold || res.reward.xp || res.reward.crystals || res.reward.hp)
      ) {
        events.push({
          kind: "reward",
          gold: res.reward.gold,
          xp: res.reward.xp,
          crystals: res.reward.crystals,
          hp: res.reward.hp,
        });
      }

      if (res?.time_skipped) {
        toast.info("-30m Cultivation Time!", {
          icon: "⏳",
          style: { color: "var(--gold-bright)" },
        });
      }

      if (res?.leveledUp && res.reward) {
        events.push({
          kind: "leveledUp",
          level: profile?.level ? profile.level + 1 : 1,
        });
        shootConfetti();
      }

      const ticks =
        (
          res as
            | { growthTicks?: Array<{ monster_name: string; realm_name: string | null }> }
            | undefined
        )?.growthTicks ?? [];

      if (ticks.length > 0) {
        for (const t of ticks.slice(0, 2)) {
          events.push({ kind: "bond", monsterName: t.monster_name, from: 0, to: 0.5 });
        }

        const taskRealmId = (res as { realmPulse?: string })?.realmPulse ?? null;
        triggerWhisper(
          ticks.map((t) => ({ monsterName: t.monster_name, realmName: t.realm_name })),
          taskRealmId,
        );
      } else if ((res as { realmPulse?: string })?.realmPulse) {
        triggerWhisper([], (res as { realmPulse?: string }).realmPulse!);
      }

      if ((res as { realmPulse?: string })?.realmPulse) {
        setActiveRealmPulse((res as { realmPulse?: string }).realmPulse!);
      }

      const awakened =
        (
          res as
            | { awakenings?: Array<{ monsterName: string; skillName: string; flavor: string }> }
            | undefined
        )?.awakenings ?? [];
      for (const a of awakened) {
        events.push({
          kind: "awakening",
          monsterName: a.monsterName,
          skillName: a.skillName,
          flavor: a.flavor,
        });
        shootConfetti();
        whisper({
          monsterName: a.monsterName,
          line: `Something has awakened in me. ${a.skillName}.`,
          tone: "grave",
        });
      }

      const goal = (
        res as
          | {
              goalDamage?: {
                slain: Array<{ title: string; hp_total: number }>;
                damaged: Array<{
                  goal: { title: string; hp_total: number; hp_remaining: number };
                  damage: number;
                }>;
                tomeMinted: boolean;
              } | null;
            }
          | undefined
      )?.goalDamage;
      if (goal) {
        if (goal.slain.length > 0) {
          const s = goal.slain[0];
          events.push({
            kind: "boss",
            title: s.title,
            damage: 0,
            hpRemaining: 0,
            hpTotal: s.hp_total ?? 0,
          });
        }
        for (const d of goal.damaged) {
          events.push({
            kind: "boss",
            title: d.goal.title,
            damage: d.damage,
            hpRemaining: d.goal.hp_remaining,
            hpTotal: d.goal.hp_total,
          });
        }
        if (goal.tomeMinted) {
          events.push({ kind: "tomeMint" });
          shootConfetti();
          const slainTitle = goal.slain[0]?.title ?? "the boss";
          whisper({
            monsterName: "Vault Keeper",
            line: `${slainTitle} has fallen. The Tome is yours.`,
            tone: "grave",
          });
        }
      }

      if (res?.drop) {
        events.push({
          kind: "drop",
          itemType: res.drop.type,
          itemName: res.drop.name,
          quantity: 1,
        });
        shootConfetti();
      }

      if (res?.died) {
        events.push({ kind: "died" });
        setDeathTick((n) => n + 1);
      }

      showCascade(events);
    },
    onError: (err: Error, _variables, context) => {
      if (context?.previousTasks) {
        qc.setQueryData(["tasks"], context.previousTasks);
      }
      toast.error(err.message);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["my-monsters"] });
    },
  });
}
