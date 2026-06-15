import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { AppShell } from "@/components/game/AppShell";
import { TaskCard, type Task } from "@/components/game/TaskCard";
import { TaskFormDialog, type TaskFormValue } from "@/components/game/TaskFormDialog";
import { DeathOverlay } from "@/components/game/DeathOverlay";
import { MorningRitual, EveningRitual } from "@/components/game/DailyRitual";
import { Compass } from "@/components/game/Compass";
import { Onboarding } from "@/components/game/Onboarding";
import { LoadingScreen } from "@/components/game/LoadingScreen";
import { TutorialFollowUpModal } from "@/components/game/TutorialFollowUpModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { showCascade, type CascadeEvent } from "@/components/game/CascadeCard";
import { whisper } from "@/components/game/WhisperFeed";
import { RealmPulse } from "@/components/game/RealmPulse";
import { SoulResonanceTimer } from "@/components/game/SoulResonanceTimer";
import {
  getMyProfile,
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  scoreTask,
  getDevotedCommentary,
  completeOnboarding,
} from "@/lib/game/supabase-api";
import type { TaskType } from "@/lib/game/constants";
import { useWhisperFeed } from "@/hooks/useWhisperFeed";

function shootConfetti() {
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#ffb83d", "#FFD54F", "#4FC3F7", "#7F77DD"],
  });
}

const REALM_VOICES: Record<string, string> = {
  "Ancient Vaults": "The text remembers being read.",
  "Chaos Wastes": "Stronger today. Smaller tomorrow. Pull the bow again.",
  "The Outer Dark": "I am here. I have always been here.",
  "Blighted Expanse": "Lay your weapon down a moment. Sit beside the candle.",
  "Wild Frontier": "Run with me. There will be a reason.",
  "Divine Threshold": "The breath comes. The breath goes.",
  "Haunted Veil": "You came back. Most don't.",
  "Digital Nexus": "Process complete. Beginning next process.",
  "Elder Realm": "You came hungry. We have soup.",
  "Void Frontier": "There — that light. We go there.",
  "Myth Eternal": "This is older than you think. So are you.",
  "Iron Dominion": "This task. I will finish it. With you.",
};

// Replaced standard Focus Ritual with Manhwa System Soul Resonance Timer

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Hub Directives — SummonScroll" }] }),
  component: HubPage,
});

function HubPage() {
  const qc = useQueryClient();
  const { triggerWhisper } = useWhisperFeed();

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: getMyProfile,
    refetchOnWindowFocus: false,
  });
  const tasksQ = useQuery({ queryKey: ["tasks"], queryFn: listTasks, refetchOnWindowFocus: false });
  const commentaryQ = useQuery({
    queryKey: ["devoted-line"],
    queryFn: getDevotedCommentary,
    refetchOnWindowFocus: false,
  });

  const [tab, setTab] = useState<TaskType>("habit");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deathTick, setDeathTick] = useState(0);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [tourStep, setTourStep] = useState(3);
  const [showMorning, setShowMorning] = useState(false);
  const [showEvening, setShowEvening] = useState(false);
  const [showTutorialFollowUp, setShowTutorialFollowUp] = useState(false);
  const [activeRealmPulse, setActiveRealmPulse] = useState<number | null>(null);

  useEffect(() => {
    if (profileQ.data?.cron?.died) {
      setDeathTick((n) => n + 1);
      toast.error(`Cron damage — you fell. HP restored.`);
    }
  }, [profileQ.data?.cron]);

  // Surface today's Devoted-monster commentary into the WhisperFeed once per
  // mount. The query is non-refetching so this stays a single moment per session.
  useEffect(() => {
    if (commentaryQ.data) {
      whisper({
        monsterName: commentaryQ.data.monsterName,
        line: commentaryQ.data.line,
        tone: "calm",
      });
    }
  }, [commentaryQ.data]);

  const rawTasks = tasksQ.data?.tasks ?? [];
  const tasks = useMemo(() => rawTasks as unknown as Task[], [rawTasks]);
  const sideQuests = useMemo(() => tasks.filter((t) => t.category === "side_quest"), [tasks]);
  const filtered = useMemo(
    () =>
      tasks.filter((t) => {
        if (tab === "vice") return t.type === "habit" && (t as any).negative_enabled;
        if (tab === "habit") return t.type === "habit" && (t as any).positive_enabled;
        return t.type === tab && t.category !== "side_quest";
      }),
    [tasks, tab],
  );

  const scoreMut = useMutation({
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
      qc.setQueryData(["tasks"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map((t: any) => {
            if (t.id === v.id) {
              if (v.direction === "complete") return { ...t, completed: true };
              if (v.direction === "uncomplete") return { ...t, completed: false };
            }
            return t;
          }),
        };
      });
      return { previousTasks };
    },
    onSuccess: (res, variables) => {
      // Check if this was the tutorial directive being scored for the first time
      const wasTutorialDirective = profile?.tutorial_directive_id === variables.id;
      const wasPositiveScore = variables.direction === "plus" || variables.direction === "complete";

      if (wasTutorialDirective && wasPositiveScore) {
        // Show the follow-up modal after a brief delay to let the cascade complete
        setTimeout(() => setShowTutorialFollowUp(true), 1500);
      }

      // Build the cascade — one unified card showing every consequence.
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

      if (res?.leveledUp && res.reward) {
        events.push({
          kind: "leveledUp",
          level: profileQ.data?.profile.level ? profileQ.data.profile.level + 1 : 1,
        });
        shootConfetti();
      }

      const ticks =
        (
          res as
            | { growthTicks?: Array<{ monster_name: string; realm_name: string | null }> }
            | undefined
        )?.growthTicks ?? [];
      // Bond rows: show first 2 monsters (third+ collapse into a count via reward-style label)
      if (ticks.length > 0) {
        // Show +0.5% bond tick rows
        for (const t of ticks.slice(0, 2)) {
          events.push({ kind: "bond", monsterName: t.monster_name, from: 0, to: 0.5 });
        }

        const taskRealmId = (res as any)?.realmPulse ?? null;
        triggerWhisper(
          ticks.map((t) => ({ monsterName: t.monster_name, realmName: t.realm_name })),
          taskRealmId,
        );
      } else if ((res as any)?.realmPulse) {
        triggerWhisper([], (res as any).realmPulse);
      }

      // Trigger Realm Pulse if backend responded with it
      if ((res as any)?.realmPulse) {
        setActiveRealmPulse((res as any).realmPulse);
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

  const createMut = useMutation({
    mutationFn: (v: TaskFormValue) => createTask(v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (v: { id: string; patch: Partial<TaskFormValue> }) => updateTask(v.id, v.patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setDialogOpen(false);
      setEditing(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const onboardingMut = useMutation({
    mutationFn: () => completeOnboarding(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Welcome to SummonScroll!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (profileQ.isLoading || tasksQ.isLoading) {
    return <LoadingScreen />;
  }

  const profile = profileQ.data?.profile;
  // Only show onboarding if the column exists in the DB and is explicitly null.
  // If the column doesn't exist at all (migration not run), skip onboarding entirely.
  const showOnboarding =
    profile != null &&
    "onboarding_completed_at" in profile &&
    profile.onboarding_completed_at === null;

  return (
    <AppShell profile={profile}>
      <RealmPulse realmId={activeRealmPulse} onComplete={() => setActiveRealmPulse(null)} />
      {showOnboarding && <Onboarding onComplete={() => onboardingMut.mutate()} />}
      <DeathOverlay trigger={deathTick} />
      <div className="bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-[#0a0512] relative min-h-screen border-2 border-[#d4af3f]/20 shadow-[inset_0_0_80px_rgba(26,11,46,1)] rounded-lg m-2 md:m-4 overflow-hidden">
        <div className="p-6 md:p-10 max-w-6xl relative z-10">
          <Compass
            onOpenMorning={() => setShowMorning(true)}
            onOpenEvening={() => setShowEvening(true)}
          />
          <div className="mb-6">
            <SoulResonanceTimer
              monsterId={profile?.soul_tether_id || "unlinked"}
              monsterName="Tethered Soul"
              onComplete={() => {
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                toast.success("Resonance Complete! Buff applied.");
              }}
              onFail={() => {}}
            />
          </div>
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h1
                className="t-h1 text-3xl md:text-4xl mb-1"
                style={{ color: "#fcd34d", textShadow: "0 2px 10px rgba(212,175,63,0.5)" }}
              >
                Hub Directives
              </h1>
            </div>
            <button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
              className="ss-btn ss-btn-d-primary shadow-[0_0_15px_rgba(212,175,63,0.4)]"
            >
              + New Directive
            </button>
          </header>

          <div
            className="flex gap-6 mb-6 border-b-2"
            style={{ borderColor: "rgba(212,175,63,0.3)" }}
          >
            {(["habit", "daily", "todo"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`ss-tab-d pb-2 text-base font-semibold capitalize ${tab === t ? "active text-[#fcd34d]" : "text-[#b09e80] hover:text-[#d4af3f]"}`}
              >
                {t === "habit" ? "Habits" : t === "daily" ? "Dailies" : "To-Dos"}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={tab === "habit" ? "morning" : tab === "daily" ? "morning" : "checklist"}
              title={
                tab === "habit"
                  ? "The grove is quiet."
                  : tab === "daily"
                    ? "The dawn awaits your decree."
                    : "The list is blank."
              }
              body={
                tab === "habit"
                  ? "Forge one small directive. Something you'd do anyway."
                  : "Create your first directive to begin earning Gold and XP."
              }
              cta={{
                label: "Forge a Directive",
                onClick: () => {
                  setEditing(null);
                  setDialogOpen(true);
                },
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  busy={busyIds.has(task.id)}
                  isTutorial={profile?.tutorial_directive_id === task.id}
                  onScore={(dir) => scoreMut.mutate({ id: task.id, direction: dir })}
                  onEdit={() => {
                    setEditing(task);
                    setDialogOpen(true);
                  }}
                  onDelete={() => deleteMut.mutate(task.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <TaskFormDialog
        open={dialogOpen}
        defaultType={tab}
        initial={editing ?? undefined}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onSubmit={async (v) => {
          if (editing) await updateMut.mutateAsync({ id: editing.id, patch: v });
          else await createMut.mutateAsync(v);
        }}
      />

      {showMorning && <MorningRitual tasks={tasks} onClose={() => setShowMorning(false)} />}
      {showEvening && <EveningRitual tasks={tasks} onClose={() => setShowEvening(false)} />}
      {showTutorialFollowUp && (
        <TutorialFollowUpModal
          open={showTutorialFollowUp}
          onClose={() => setShowTutorialFollowUp(false)}
        />
      )}
    </AppShell>
  );
}
