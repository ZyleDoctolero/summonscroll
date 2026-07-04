import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import { AppShell } from "@/components/game/AppShell";
import { TaskCard, type Task } from "@/components/game/TaskCard";
import { TaskFormDialog, type TaskFormValue } from "@/components/game/TaskFormDialog";
import { useTaskScoring } from "@/hooks/useTaskScoring";
import { DeathOverlay } from "@/components/game/DeathOverlay";
import { MorningRitual, EveningRitual } from "@/components/game/DailyRitual";
import { Compass } from "@/components/game/Compass";
import { Onboarding } from "@/components/game/Onboarding";
import { LoadingScreen } from "@/components/game/LoadingScreen";
import { Icon } from "@/components/ui/Icon";
import { TutorialFollowUpModal } from "@/components/game/TutorialFollowUpModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { whisper } from "@/components/game/WhisperFeed";
import { RealmPulse } from "@/components/game/RealmPulse";
import { SoulResonanceTimer } from "@/components/game/SoulResonanceTimer";
import {
  getMyProfile,
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  getDevotedCommentary,
  completeOnboarding,
  listMyMonsters,
} from "@/lib/game/supabase-api";
import type { TaskType } from "@/lib/game/constants";
import { useWhisperFeed } from "@/hooks/useWhisperFeed";

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

  const [showMorning, setShowMorning] = useState(false);
  const [showEvening, setShowEvening] = useState(false);
  const [showTutorialFollowUp, setShowTutorialFollowUp] = useState(false);
  const [activeRealmPulse, setActiveRealmPulse] = useState<number | null>(null);
  const [questSearch, setQuestSearch] = useState("");

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

  const sortedTasks = useMemo(() => {
    let items = [...filtered];
    if (questSearch.trim()) {
      const q = questSearch.toLowerCase();
      items = items.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q),
      );
    }
    items.sort((a, b) => {
      if (a.is_starred && !b.is_starred) return -1;
      if (!a.is_starred && b.is_starred) return 1;
      if (!a.completed && b.completed) return -1;
      if (a.completed && !b.completed) return 1;
      const diffOrder: Record<string, number> = { hard: 0, medium: 1, easy: 2, trivial: 3 };
      return (diffOrder[a.difficulty] ?? 2) - (diffOrder[b.difficulty] ?? 2);
    });
    return items;
  }, [filtered, questSearch]);

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

      {/* Inline Hub Content */}
      <div className="relative z-10 p-4 md:p-6 max-w-5xl mx-auto pb-28">
        {/* Tethered Monster + Utilities Row */}
        <div className="flex items-start gap-4 mb-6">
          {/* Tethered Monster Compact */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {tetheredUm ? (
              <div className="flex items-center gap-3">
                <div
                  className="w-16 h-16 border-[3px] border-[rgba(200,154,62,0.3)] bg-gradient-to-b from-[rgba(200,154,62,0.08)] to-transparent flex items-center justify-center overflow-hidden"
                  style={{
                    borderRadius: 0,
                    boxShadow: "3px 3px 0 rgba(0,0,0,0.4)",
                    imageRendering: "pixelated" as const,
                  }}
                >
                  <img
                    src={
                      tetheredUm.monster.art_url
                        ? tetheredUm.monster.art_url
                        : `/sprites/monsters/${tetheredUm.monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
                    }
                    alt={tetheredUm.monster.name}
                    className="w-full h-full object-contain p-1 drop-shadow-[0_0_8px_rgba(212,175,63,0.4)]"
                    onError={(e) => {
                      e.currentTarget.src = "/monsters/placeholder.png";
                    }}
                  />
                </div>
                <div>
                  <p
                    className="text-[11px] uppercase tracking-wider font-bold"
                    style={{ color: "var(--ink-tertiary)" }}
                  >
                    Life-Bound
                  </p>
                  <h2 className="text-sm font-bold" style={{ color: "var(--ink-primary)" }}>
                    {tetheredUm.monster.name}
                  </h2>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div
                  className="w-16 h-16 border-2 border-dashed border-[rgba(200,154,62,0.2)] flex items-center justify-center"
                  style={{ borderRadius: 0 }}
                >
                  <Icon name="scroll" size={24} color="var(--ink-tertiary)" />
                </div>
                <p className="text-xs" style={{ color: "var(--ink-tertiary)" }}>
                  No beast tethered
                </p>
              </div>
            )}
          </div>

          {/* Compact Utilities */}
          <div className="flex items-center gap-2 shrink-0">
            <Compass
              onOpenMorning={() => setShowMorning(true)}
              onOpenEvening={() => setShowEvening(true)}
            />
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

        {/* Inline Quest Board */}
        <div className="ss-card p-0 overflow-hidden border-[rgba(200,154,62,0.2)]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[rgba(200,154,62,0.15)] flex justify-between items-center bg-gradient-to-r from-[rgba(200,154,62,0.06)] to-transparent">
            <h2
              className="text-lg font-bold uppercase"
              style={{
                fontFamily: "var(--ss-font-pixel)",
                color: "var(--gold-bright)",
                letterSpacing: "0.06em",
              }}
            >
              QUEST BOARD
            </h2>
            <button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
              className="ss-btn ss-btn-d-primary text-xs px-4 py-2"
            >
              + Issue Quest
            </button>
          </div>

          {/* Search */}
          <div className="px-4 pt-3">
            <div className="relative">
              <Icon
                name="target"
                size={14}
                color="var(--ink-tertiary)"
                className="absolute left-3 top-1/2 -translate-y-1/2"
              />
              <input
                type="text"
                value={questSearch}
                onChange={(e) => setQuestSearch(e.target.value)}
                placeholder="Search quests..."
                className="ss-input w-full pl-9 text-sm"
                style={{ height: "40px" }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div
            className="px-4 pt-3 flex gap-4 border-b-2"
            style={{ borderColor: "rgba(200,154,62,0.2)" }}
          >
            {(
              [
                { key: "habit" as const, label: "Rites" },
                { key: "daily" as const, label: "Duties" },
                { key: "todo" as const, label: "Hunts" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`pb-2 text-sm font-semibold min-h-[44px] flex items-center gap-2 border-b-2 transition-colors ${
                  tab === t.key
                    ? "text-[#b8860b] border-[#b8860b]"
                    : "text-[#8b7355] hover:text-[#c89a3e] border-transparent"
                }`}
              >
                {t.label}
                {tab === t.key && sortedTasks.filter((s) => !s.completed).length > 0 && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 font-bold leading-none"
                    style={{
                      borderRadius: 0,
                      fontFamily: "var(--ss-font-pixel)",
                      background: "rgba(200,154,62,0.15)",
                      color: "var(--gold-bright)",
                    }}
                  >
                    {sortedTasks.filter((s) => !s.completed).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Fallen Covenant pinned quest */}
          {(() => {
            const fallen = (myMonstersQ.data?.userMonsters ?? []).filter(
              (m: Record<string, unknown>) => m.fallen_covenant === true,
            );
            return fallen.length > 0 ? (
              <div className="px-4 pt-3">
                <div
                  className="p-3 border flex items-center gap-3"
                  style={{
                    borderColor: "rgba(196,79,111,0.3)",
                    borderRadius: 0,
                    background: "linear-gradient(135deg, rgba(196,79,111,0.06), transparent)",
                    boxShadow: "3px 3px 0 rgba(0,0,0,0.3)",
                  }}
                >
                  <span className="text-xl">💀</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[10px] uppercase font-bold"
                      style={{
                        fontFamily: "var(--ss-font-pixel)",
                        color: "var(--danger)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Fallen Covenant — Redemption Required
                    </p>
                    <p
                      className="text-[9px]"
                      style={{ fontFamily: "var(--ss-font-pixel)", color: "var(--ink-tertiary)" }}
                    >
                      {fallen.length} creature{fallen.length > 1 ? "s" : ""} in fallen state:{" "}
                      {fallen
                        .slice(0, 3)
                        .map((m: { monster: { name: string } }) => m.monster.name)
                        .join(", ")}
                    </p>
                  </div>
                  <span className="ss-badge-fallen text-[9px]">{fallen.length}</span>
                </div>
              </div>
            ) : null;
          })()}

          {/* Task List */}
          <div className="p-4">
            {sortedTasks.length === 0 ? (
              <EmptyState
                icon={tab === "habit" ? "morning" : tab === "daily" ? "morning" : "checklist"}
                title={
                  questSearch
                    ? "No matching quests."
                    : tab === "habit"
                      ? "The board is empty."
                      : tab === "daily"
                        ? "No daily bounties."
                        : "No pending requests."
                }
                body={
                  questSearch
                    ? "Try a different search term."
                    : "Issue a new quest to begin earning rewards."
                }
                cta={
                  questSearch
                    ? { label: "Clear Search", onClick: () => setQuestSearch("") }
                    : {
                        label: "Issue Quest",
                        onClick: () => {
                          setEditing(null);
                          setDialogOpen(true);
                        },
                      }
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sortedTasks.map((task, i) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                  >
                    <TaskCard
                      task={task}
                      busy={busyIds.has(task.id)}
                      isTutorial={profile?.tutorial_directive_id === task.id}
                      onScore={(_, dir) => scoreMut.mutate({ id: task.id, direction: dir })}
                      onEdit={() => {
                        setEditing(task);
                        setDialogOpen(true);
                      }}
                      onDelete={() => deleteMut.mutate(task.id)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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
