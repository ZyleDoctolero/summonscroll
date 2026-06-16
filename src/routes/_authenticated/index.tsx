import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";
import { AppShell } from "@/components/game/AppShell";
import { TaskCard, type Task } from "@/components/game/TaskCard";
import { TaskFormDialog, type TaskFormValue } from "@/components/game/TaskFormDialog";
import { QuestBoardModal } from "@/components/game/QuestBoardModal";
import { useTaskScoring } from "@/hooks/useTaskScoring";
import { DeathOverlay } from "@/components/game/DeathOverlay";
import { MorningRitual, EveningRitual } from "@/components/game/DailyRitual";
import { Compass } from "@/components/game/Compass";
import { Onboarding } from "@/components/game/Onboarding";
import { LoadingScreen } from "@/components/game/LoadingScreen";
import { Icon } from "@/components/ui/Icon";
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
  listMyMonsters,
} from "@/lib/game/supabase-api";
import type { TaskType } from "@/lib/game/constants";
import { useWhisperFeed } from "@/hooks/useWhisperFeed";

function shootConfetti() {
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
    // eslint-disable-next-line no-restricted-syntax
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
  const myMonstersQ = useQuery({
    queryKey: ["my-monsters"],
    queryFn: listMyMonsters,
    refetchOnWindowFocus: false,
  });

  const [tab, setTab] = useState<TaskType | "vice">("habit");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deathTick, setDeathTick] = useState(0);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [tourStep, setTourStep] = useState(3);
  const [showMorning, setShowMorning] = useState(false);
  const [showEvening, setShowEvening] = useState(false);
  const [showTutorialFollowUp, setShowTutorialFollowUp] = useState(false);
  const [activeRealmPulse, setActiveRealmPulse] = useState<number | null>(null);
  const [showQuestBoard, setShowQuestBoard] = useState(false);

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

  const tasks = useMemo(
    () => (tasksQ.data?.tasks ?? []) as unknown as Task[],
    [tasksQ.data?.tasks],
  );
  const sideQuests = useMemo(() => tasks.filter((t) => t.category === "side_quest"), [tasks]);
  const filtered = useMemo(
    () =>
      tasks.filter((t) => {
        if (tab === "vice")
          return t.type === "habit" && (t as { negative_enabled?: boolean }).negative_enabled;
        if (tab === "habit")
          return t.type === "habit" && (t as { positive_enabled?: boolean }).positive_enabled;
        return t.type === tab && t.category !== "side_quest";
      }),
    [tasks, tab],
  );

  const scoreMut = useTaskScoring({
    setBusyIds,
    profile: profileQ.data?.profile,
    setShowTutorialFollowUp,
    setDeathTick,
    triggerWhisper,
    setActiveRealmPulse,
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

  const tetheredId = profile?.soul_tether_id;
  const tetheredUm = tetheredId
    ? (myMonstersQ.data?.userMonsters ?? []).find((m: { id: string }) => m.id === tetheredId)
    : null;

  return (
    <AppShell profile={profile as never}>
      <RealmPulse realmId={activeRealmPulse} onComplete={() => setActiveRealmPulse(null)} />
      {showOnboarding && <Onboarding onComplete={() => onboardingMut.mutate()} />}
      <DeathOverlay trigger={deathTick} />

      {/* Lobby Environment */}
      <div className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none z-0">
        <div className="absolute inset-0 bg-atmos bg-atmos-divine opacity-40 mix-blend-overlay" />
        <div
          className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"
          style={{ animation: "hud-shimmer 20s linear infinite" }}
        />

        {/* Tethered Monster Display */}
        <div className="relative z-10 flex flex-col items-center justify-center animate-[float_4s_ease-in-out_infinite] hover:scale-105 transition-transform duration-700">
          {tetheredUm ? (
            <>
              <img
                src={
                  tetheredUm.monster.art_url
                    ? tetheredUm.monster.art_url
                    : `/sprites/monsters/${tetheredUm.monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
                }
                alt={tetheredUm.monster.name}
                className="w-64 h-64 md:w-96 md:h-96 object-contain drop-shadow-[0_0_30px_rgba(212,175,63,0.5)]"
                onError={(e) => {
                  e.currentTarget.src = "/monsters/placeholder.png";
                }}
              />
              <div className="mt-4 text-center backdrop-blur-md bg-black/40 px-6 py-2 rounded-full border border-[var(--gold-primary)]/30">
                <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
                  Life-Bound Beast
                </p>
                <h2 className="text-xl font-bold" style={{ color: "var(--gold-bright)" }}>
                  {tetheredUm.monster.name}
                </h2>
              </div>
            </>
          ) : (
            <div className="text-center backdrop-blur-md bg-black/40 px-8 py-6 rounded-2xl border border-[rgba(255,255,255,0.1)]">
              <Icon name="scroll" size={48} color="var(--ink-tertiary)" className="mx-auto mb-4" />
              <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
                No Life-Bound Beast
              </p>
              <p className="text-xs mt-2 max-w-xs" style={{ color: "var(--ink-tertiary)" }}>
                Go to the Compendium to tether a monster and manifest it here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Diegetic Lobby HUD */}
      <div className="absolute inset-0 z-10 pointer-events-none p-4 md:p-8 flex flex-col justify-between">
        <div className="flex justify-between items-start mt-16 md:mt-0">
          <div className="pointer-events-auto">
            <Compass
              onOpenMorning={() => setShowMorning(true)}
              onOpenEvening={() => setShowEvening(true)}
            />
          </div>
          <div className="pointer-events-auto">
            <SoulResonanceTimer
              monsterId={profile?.soul_tether_id || "unlinked"}
              monsterName="Life-Bound Beast"
              onComplete={() => {
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                toast.success("Resonance Complete! Buff applied.");
              }}
              onFail={() => {}}
            />
          </div>
        </div>

        {/* Quest Board Icon Button */}
        <div className="absolute right-4 bottom-28 md:right-10 md:bottom-32 pointer-events-auto">
          <button onClick={() => setShowQuestBoard(true)} className="group ss-btn-quest-board">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[var(--gold-primary)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Icon
              name="checklist"
              size={32}
              color="var(--gold-bright)"
              className="group-hover:drop-shadow-[0_0_8px_#fcd34d] transition-all"
            />
            <span className="text-[10px] font-bold tracking-widest mt-1 text-[var(--gold-primary)] uppercase">
              Quests
            </span>

            {/* Notification Badge */}
            {tasks.filter((t) => !t.completed).length > 0 && (
              <div className="ss-badge-notification">
                {tasks.filter((t) => !t.completed).length}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Quest Board Modal Overlay */}
      <QuestBoardModal
        open={showQuestBoard}
        onClose={() => setShowQuestBoard(false)}
        tab={tab}
        setTab={setTab}
        filtered={filtered}
        busyIds={busyIds}
        profile={profile}
        onScore={(id, direction) => scoreMut.mutate({ id, direction })}
        onEdit={(task) => {
          setEditing(task);
          setDialogOpen(true);
        }}
        onDelete={(id) => deleteMut.mutate(id)}
        onIssueQuest={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
      />

      <TaskFormDialog
        open={dialogOpen}
        defaultType={tab === "vice" ? "habit" : tab}
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
