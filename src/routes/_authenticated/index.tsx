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
import { localTodayISO, type TaskType } from "@/lib/game/constants";
import type { TaskInput } from "@/lib/game/tasks-client";
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

  const [tab, setTab] = useState<TaskType | "today" | "vice">("today");
  const [quickTitle, setQuickTitle] = useState("");
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

  const todayDow = new Date().getDay();
  const todayLocal = localTodayISO();
  const isRestingDaily = (t: Task) =>
    t.type === "daily" && !(t.schedule_days ?? [0, 1, 2, 3, 4, 5, 6]).includes(todayDow);

  const matchesTab = (t: Task, key: TaskType | "today" | "vice") => {
    if (key === "today") {
      // the "what do I need to do right now" view:
      // dailies scheduled for today + todos due today or overdue
      if (t.type === "daily") return !isRestingDaily(t);
      if (t.type === "todo") return !t.completed && !!t.due_date && t.due_date <= todayLocal;
      return false;
    }
    if (key === "vice")
      return t.type === "habit" && (t as { negative_enabled?: boolean }).negative_enabled;
    if (key === "habit")
      return t.type === "habit" && (t as { positive_enabled?: boolean }).positive_enabled;
    return t.type === key && t.category !== "side_quest";
  };

  const filtered = useMemo(
    () => tasks.filter((t) => matchesTab(t, tab)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, tab, todayDow, todayLocal],
  );

  // pending counts per tab so the board is navigable at a glance
  // (habits have no "done" state, so no badge there)
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const k of ["today", "daily", "todo"] as const) {
      counts[k] = tasks.filter(
        (t) => matchesTab(t, k) && !t.completed && !(k === "daily" && isRestingDaily(t)),
      ).length;
    }
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, todayDow, todayLocal]);

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
      // actionable first, then resting dailies, then completed
      const rank = (t: Task) => (t.completed ? 2 : isRestingDaily(t) ? 1 : 0);
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      if (tab === "today") {
        // Today view reads like an agenda: timed items in clock order first
        const tA = a.due_time ?? "99:99";
        const tB = b.due_time ?? "99:99";
        if (tA !== tB) return tA < tB ? -1 : 1;
        const dA = a.due_date ?? "9999-12-31";
        const dB = b.due_date ?? "9999-12-31";
        if (dA !== dB) return dA < dB ? -1 : 1;
      } else {
        // earliest due date/time first; undated items last
        const dueA = `${a.due_date ?? "9999-12-31"} ${a.due_time ?? "99:99"}`;
        const dueB = `${b.due_date ?? "9999-12-31"} ${b.due_time ?? "99:99"}`;
        if (dueA !== dueB) return dueA < dueB ? -1 : 1;
      }
      const diffOrder: Record<string, number> = { hard: 0, medium: 1, easy: 2, trivial: 3 };
      return (diffOrder[a.difficulty] ?? 2) - (diffOrder[b.difficulty] ?? 2);
    });
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, questSearch, todayDow]);

  const scoreMut = useTaskScoring({
    setBusyIds,
    profile: profileQ.data?.profile,
    setShowTutorialFollowUp,
    setDeathTick,
    triggerWhisper,
    setActiveRealmPulse,
  });

  const warnDropped = (dropped?: string[]) => {
    if (dropped?.length) {
      toast.warning(
        `Saved, but this database is missing: ${dropped.join(", ")}. Run CATCHUP_TASKS.sql in the Supabase SQL editor to enable those fields.`,
        { duration: 8000 },
      );
    }
  };

  const createMut = useMutation({
    mutationFn: (v: TaskFormValue) => createTask(v),
    onSuccess: (res) => {
      warnDropped(res.droppedFields);
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const quickAddMut = useMutation({
    mutationFn: (v: TaskInput) => createTask(v),
    onSuccess: (res) => {
      warnDropped(res.droppedFields);
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setQuickTitle("");
      toast.success(`Logged: ${res.task?.title ?? "task"}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (v: { id: string; patch: Partial<TaskFormValue> }) => updateTask(v.id, v.patch),
    onSuccess: (res) => {
      warnDropped(res.droppedFields);
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setDialogOpen(false);
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function quickAdd() {
    const title = quickTitle.trim();
    if (!title || quickAddMut.isPending) return;
    const type: TaskType = tab === "today" ? "todo" : tab === "vice" ? "habit" : tab;
    quickAddMut.mutate({
      type,
      title,
      difficulty: "easy",
      positive_enabled: true,
      negative_enabled: tab === "vice",
      // from the Today tab a quick task is something to do today
      ...(tab === "today" ? { due_date: todayLocal } : {}),
    });
  }

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

  if (profileQ.isError || tasksQ.isError) {
    return (
      <AppShell profile={undefined as never} withHeader={false}>
        <div className="relative z-10 p-6 max-w-xl mx-auto pt-20">
          <EmptyState
            icon="warning"
            title="The scroll could not be read."
            body={
              (profileQ.error ?? tasksQ.error)?.message ??
              "Something went wrong loading your board."
            }
            cta={{
              label: "Try Again",
              onClick: () => {
                profileQ.refetch();
                tasksQ.refetch();
              },
            }}
          />
        </div>
      </AppShell>
    );
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
        <div className="flex flex-wrap items-start gap-4 mb-6">
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
          <div className="flex flex-wrap items-center gap-2">
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
            <div>
              <h2
                className="text-lg font-bold uppercase"
                style={{
                  fontFamily: "var(--ss-font-pixel)",
                  color: "var(--gold-ink)",
                  letterSpacing: "0.06em",
                }}
              >
                QUEST BOARD
              </h2>
              {tab === "today" && (
                <p
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  {new Date().toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
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

          {/* Quick add (primary action) + search (utility) in one row so the
              task list — the point of this page — stays above the fold */}
          <div className="px-4 pt-3 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 flex gap-2">
              <div className="relative flex-1">
                <Icon
                  name="plus"
                  size={14}
                  color="var(--gold-bright)"
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                />
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      quickAdd();
                    }
                  }}
                  placeholder={
                    tab === "today"
                      ? "Quick add for today — type and press Enter"
                      : tab === "daily"
                        ? "Quick add a daily duty — press Enter"
                        : tab === "habit"
                          ? "Quick add a habit — press Enter"
                          : "Quick add a to-do — press Enter"
                  }
                  maxLength={120}
                  className="ss-input w-full pl-9 text-sm"
                  style={{ height: "44px" }}
                />
              </div>
              {quickTitle.trim() && (
                <button
                  onClick={quickAdd}
                  disabled={quickAddMut.isPending}
                  className="ss-btn ss-btn-d-primary text-xs px-4 disabled:opacity-50"
                  style={{ height: "44px" }}
                >
                  {quickAddMut.isPending ? "..." : "Add"}
                </button>
              )}
            </div>
            <div className="relative sm:w-48">
              <Icon
                name="search"
                size={14}
                color="var(--ink-tertiary)"
                className="absolute left-3 top-1/2 -translate-y-1/2"
              />
              <input
                type="text"
                value={questSearch}
                onChange={(e) => setQuestSearch(e.target.value)}
                placeholder="Search..."
                aria-label="Search quests"
                className="ss-input w-full pl-9 text-sm"
                style={{ height: "44px" }}
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
                { key: "today" as const, label: "Today" },
                { key: "habit" as const, label: "Rites" },
                { key: "daily" as const, label: "Duties" },
                { key: "todo" as const, label: "Hunts" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`pb-2 text-sm min-h-[44px] flex items-center gap-2 border-b-2 transition-colors ${
                  tab === t.key
                    ? "font-bold border-[var(--gold-glow)]"
                    : "font-semibold border-transparent"
                }`}
                style={{
                  // gold marks the active tab via the border; text stays AA-readable ink
                  color: tab === t.key ? "var(--ink-primary)" : "var(--ink-secondary)",
                }}
                aria-current={tab === t.key ? "page" : undefined}
              >
                {t.label}
                {t.key in tabCounts && tabCounts[t.key] > 0 && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 font-bold leading-none"
                    style={{
                      borderRadius: 0,
                      fontFamily: "var(--ss-font-pixel)",
                      background: tab === t.key ? "var(--gold-bright)" : "rgba(200,154,62,0.15)",
                      color: tab === t.key ? "var(--ink-primary)" : "var(--ink-secondary)",
                    }}
                  >
                    {tabCounts[t.key]}
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
                icon={
                  tab === "today" || tab === "habit" || tab === "daily" ? "morning" : "checklist"
                }
                title={
                  questSearch
                    ? "No matching quests."
                    : tab === "today"
                      ? "All clear for today."
                      : tab === "habit"
                        ? "The board is empty."
                        : tab === "daily"
                          ? "No daily bounties."
                          : "No pending requests."
                }
                body={
                  questSearch
                    ? "Try a different search term."
                    : tab === "today"
                      ? "Type in the quick-add bar above to log something for today."
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
                      notToday={tab === "daily" && isRestingDaily(task)}
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
        defaultType={tab === "vice" ? "habit" : tab === "today" ? "todo" : tab}
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
