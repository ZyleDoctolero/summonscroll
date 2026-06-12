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
import { TutorialFollowUpModal } from "@/components/game/TutorialFollowUpModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { showCascade, type CascadeEvent } from "@/components/game/CascadeCard";
import { whisper } from "@/components/game/WhisperFeed";
import { getMyProfile, listTasks, createTask, updateTask, deleteTask, scoreTask, getDevotedCommentary, completeOnboarding } from "@/lib/game/supabase-api";
import type { TaskType } from "@/lib/game/constants";

function shootConfetti() {
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#C89A3E", "#FFD54F", "#5FAD41", "#E05252"],
  });
}

function FocusRitual() {
  const [active, setActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);

  useEffect(() => {
    let int: ReturnType<typeof setInterval>;
    if (active && timeLeft > 0) {
      int = setInterval(() => setTimeLeft((l) => l - 1), 1000);
    } else if (active && timeLeft <= 0) {
      setActive(false);
      setTimeLeft(25 * 60);
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      toast.success("Focus Ritual Complete!");
    }
    return () => clearInterval(int);
  }, [active, timeLeft]);

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");

  return (
    <div className="ss-card mb-6 flex items-center justify-between">
      <div>
        <h3 className="font-bold flex items-center gap-2" style={{ color: "var(--ink-primary)" }}>
          Focus Ritual
        </h3>
        <p className="text-xs" style={{ color: "var(--ink-secondary)" }}>25 minutes of deep focus.</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-2xl font-mono font-bold" style={{ color: "var(--gold-bright)" }}>{mins}:{secs}</div>
        <button 
          onClick={() => setActive(!active)}
          className={`ss-btn ${active ? "ss-btn-danger" : "ss-btn-d-primary"}`}
        >
          {active ? "Stop" : "Start"}
        </button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Hub Directives — SummonScroll" }] }),
  component: HubPage,
});

function HubPage() {
  const qc = useQueryClient();

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile, refetchOnWindowFocus: false });
  const tasksQ = useQuery({ queryKey: ["tasks"], queryFn: listTasks, refetchOnWindowFocus: false });
  const commentaryQ = useQuery({ queryKey: ["devoted-line"], queryFn: getDevotedCommentary, refetchOnWindowFocus: false });

  const [tab, setTab] = useState<TaskType>("habit");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deathTick, setDeathTick] = useState(0);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [tourStep, setTourStep] = useState(3);
  const [showMorning, setShowMorning] = useState(false);
  const [showEvening, setShowEvening] = useState(false);
  const [showTutorialFollowUp, setShowTutorialFollowUp] = useState(false);

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

  const tasks = (tasksQ.data?.tasks ?? []) as unknown as Task[];
  const sideQuests = useMemo(() => tasks.filter((t) => t.category === "side_quest"), [tasks]);
  const filtered = useMemo(() => tasks.filter((t) => {
    if (tab === "vice") return t.type === "habit" && (t as any).negative_enabled;
    if (tab === "habit") return t.type === "habit" && (t as any).positive_enabled;
    return t.type === tab && t.category !== "side_quest";
  }), [tasks, tab]);

  const scoreMut = useMutation({
    mutationFn: async (v: { id: string; direction: "plus" | "minus" | "complete" | "uncomplete" }) => {
      setBusyIds((s) => new Set(s).add(v.id));
      try { return await scoreTask(v.id, v.direction); }
      finally { setBusyIds((s) => { const n = new Set(s); n.delete(v.id); return n; }); }
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

      if (res?.reward && (res.reward.gold || res.reward.xp || res.reward.crystals || res.reward.hp)) {
        events.push({ kind: "reward", gold: res.reward.gold, xp: res.reward.xp, crystals: res.reward.crystals, hp: res.reward.hp });
      }

      if (res?.leveledUp && res.reward) {
        events.push({ kind: "leveledUp", level: profileQ.data?.profile.level ? profileQ.data.profile.level + 1 : 1 });
        shootConfetti();
      }

      const ticks = (res as { growthTicks?: Array<{ monster_name: string }> } | undefined)?.growthTicks ?? [];
      // Bond rows: show first 2 monsters (third+ collapse into a count via reward-style label)
      if (ticks.length > 0) {
        // We don't have new bond percent in result; show generic +0.5% rise per matching monster
        for (const t of ticks.slice(0, 2)) {
          events.push({ kind: "bond", monsterName: t.monster_name, from: 0, to: 0.5 });
        }
      }

      const awakened = (res as { awakenings?: Array<{ monsterName: string; skillName: string; flavor: string }> } | undefined)?.awakenings ?? [];
      for (const a of awakened) {
        events.push({ kind: "awakening", monsterName: a.monsterName, skillName: a.skillName, flavor: a.flavor });
        shootConfetti();
        whisper({ monsterName: a.monsterName, line: `Something has awakened in me. ${a.skillName}.`, tone: "grave" });
      }

      const goal = (res as { goalDamage?: { slain: Array<{ title: string; hp_total: number }>; damaged: Array<{ goal: { title: string; hp_total: number; hp_remaining: number }; damage: number }>; tomeMinted: boolean } | null } | undefined)?.goalDamage;
      if (goal) {
        if (goal.slain.length > 0) {
          const s = goal.slain[0];
          events.push({ kind: "boss", title: s.title, damage: 0, hpRemaining: 0, hpTotal: s.hp_total ?? 0 });
        }
        for (const d of goal.damaged) {
          events.push({ kind: "boss", title: d.goal.title, damage: d.damage, hpRemaining: d.goal.hp_remaining, hpTotal: d.goal.hp_total });
        }
        if (goal.tomeMinted) {
          events.push({ kind: "tomeMint" });
          shootConfetti();
          const slainTitle = goal.slain[0]?.title ?? "the boss";
          whisper({ monsterName: "Vault Keeper", line: `${slainTitle} has fallen. The Tome is yours.`, tone: "grave" });
        }
      }

      if (res?.drop) {
        events.push({ kind: "drop", itemType: res.drop.type, itemName: res.drop.name, quantity: 1 });
        shootConfetti();
      }

      if (res?.died) {
        events.push({ kind: "died" });
        setDeathTick((n) => n + 1);
      }

      showCascade(events);

      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["my-monsters"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const createMut = useMutation({
    mutationFn: (v: TaskFormValue) => createTask(v),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); setDialogOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (v: { id: string; patch: Partial<TaskFormValue> }) => updateTask(v.id, v.patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); setDialogOpen(false); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); },
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
    return <div className="min-h-screen grid place-items-center" style={{ color: "var(--ink-secondary)" }}>Loading the realm…</div>;
  }

  const profile = profileQ.data?.profile;
  // Only show onboarding if the column exists in the DB and is explicitly null.
  // If the column doesn't exist at all (migration not run), skip onboarding entirely.
  const showOnboarding = profile != null
    && "onboarding_completed_at" in profile
    && profile.onboarding_completed_at === null;

  return (
    <AppShell profile={profile}>
      {showOnboarding && (
        <Onboarding onComplete={() => onboardingMut.mutate()} />
      )}
      <DeathOverlay trigger={deathTick} />
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
        <Compass onOpenMorning={() => setShowMorning(true)} onOpenEvening={() => setShowEvening(true)} />
        <FocusRitual />
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="t-h1 text-3xl md:text-4xl mb-1" style={{ color: "var(--gold-bright)" }}>Hub Directives</h1>
          </div>
          <button onClick={() => { setEditing(null); setDialogOpen(true); }}
            className="ss-btn ss-btn-d-primary">
            + New Directive
          </button>
        </header>

        <div className="flex gap-6 mb-6 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {(["habit", "daily", "todo"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`ss-tab-d pb-2 text-base font-semibold capitalize ${tab === t ? "active" : ""}`}
            >
              {t === "habit" ? "Habits" : t === "daily" ? "Dailies" : "To-Dos"}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={tab === "habit" ? "morning" : tab === "daily" ? "morning" : "checklist"}
            title={tab === "habit" ? "The grove is quiet." : tab === "daily" ? "The dawn awaits your decree." : "The list is blank."}
            body={tab === "habit" ? "Forge one small directive. Something you'd do anyway." : "Create your first directive to begin earning Gold and XP."}
            cta={{
              label: "Forge a Directive",
              onClick: () => { setEditing(null); setDialogOpen(true); }
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
                onEdit={() => { setEditing(task); setDialogOpen(true); }}
                onDelete={() => deleteMut.mutate(task.id)} 
              />
            ))}
          </div>
        )}
      </div>

      <TaskFormDialog open={dialogOpen} defaultType={tab} initial={editing ?? undefined}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        onSubmit={async (v) => {
          if (editing) await updateMut.mutateAsync({ id: editing.id, patch: v });
          else await createMut.mutateAsync(v);
        }} />

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
