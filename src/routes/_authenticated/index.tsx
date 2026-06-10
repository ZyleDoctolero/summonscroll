import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { AppShell } from "@/components/game/AppShell";
import { TaskCard, type Task } from "@/components/game/TaskCard";
import { TaskFormDialog, type TaskFormValue } from "@/components/game/TaskFormDialog";
import { DeathOverlay } from "@/components/game/DeathOverlay";
import { MorningRitual, EveningRitual, RitualStatusPill } from "@/components/game/DailyRitual";
import { getMyProfile, listTasks, createTask, updateTask, deleteTask, scoreTask } from "@/lib/game/supabase-api";
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
    <div className="bg-[#13161F] p-4 rounded-xl border border-white/5 mb-6 flex items-center justify-between">
      <div>
        <h3 className="font-bold text-[#F0EDE6] flex items-center gap-2" style={{ fontFamily: "'Cinzel',serif" }}>
          Focus Ritual
        </h3>
        <p className="text-xs text-[#A09D96]">25 minutes of deep focus.</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-2xl font-mono font-bold text-[#FFD54F]">{mins}:{secs}</div>
        <button 
          onClick={() => setActive(!active)}
          className="px-4 py-1.5 rounded font-bold text-xs"
          style={{ background: active ? "#E05252" : "#C89A3E", color: "#0C0E14" }}
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

  const [tab, setTab] = useState<TaskType>("habit");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deathTick, setDeathTick] = useState(0);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [tourStep, setTourStep] = useState(3);
  const [showMorning, setShowMorning] = useState(false);
  const [showEvening, setShowEvening] = useState(false);

  useEffect(() => {
    if (profileQ.data?.cron?.died) {
      setDeathTick((n) => n + 1);
      toast.error(`Cron damage — you fell. HP restored.`);
    }
  }, [profileQ.data?.cron]);

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
    onSuccess: (res) => {
      if (res?.reward) {
        if (res.drop) shootConfetti();
        if (res.leveledUp) shootConfetti();
        if (res.died) setDeathTick((n) => n + 1);
      }
      const ticks = (res as { growthTicks?: Array<{ monster_name: string; stat: string }> } | undefined)?.growthTicks ?? [];
      if (ticks.length > 0) {
        const names = ticks.slice(0, 3).map((t) => t.monster_name).join(", ");
        const more = ticks.length > 3 ? ` +${ticks.length - 3} more` : "";
        toast(`✨ Bond grew with ${names}${more}`, { duration: 2500 });
      }
      const awakened = (res as { awakenings?: Array<{ monsterName: string; skillName: string; flavor: string }> } | undefined)?.awakenings ?? [];
      for (const a of awakened) {
        shootConfetti();
        toast.success(`⚡ ${a.monsterName} has awakened: ${a.skillName}`, { duration: 6000, description: a.flavor });
      }
      const goal = (res as { goalDamage?: { slain: Array<{ title: string }>; damaged: Array<{ goal: { title: string }; damage: number }>; tomeMinted: boolean } | null } | undefined)?.goalDamage;
      if (goal) {
        if (goal.tomeMinted) {
          shootConfetti();
          const slainTitle = goal.slain[0]?.title ?? "your quest";
          toast.success(`👑 ${slainTitle} slain! 📕 Tome of Reverse Heaven minted.`, { duration: 8000 });
        } else if (goal.damaged.length > 0) {
          const d = goal.damaged[0];
          toast(`⚔ −${d.damage} HP to "${d.goal.title}"`, { duration: 2000 });
        }
      }
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

  if (profileQ.isLoading || tasksQ.isLoading) {
    return <div className="min-h-screen grid place-items-center" style={{ background: "#0C0E14", color: "#A09D96" }}>Loading the realm…</div>;
  }

  const profile = profileQ.data?.profile;

  return (
    <AppShell profile={profile}>
      <DeathOverlay trigger={deathTick} />
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
        <RitualStatusPill onClickMorning={() => setShowMorning(true)} onClickEvening={() => setShowEvening(true)} />
        <FocusRitual />
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-1" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>Hub Directives</h1>
          </div>
          <button onClick={() => { setEditing(null); setDialogOpen(true); }}
            className="px-5 py-2.5 rounded-md font-bold uppercase tracking-widest text-xs transition-transform hover:scale-105"
            style={{ background: "linear-gradient(135deg,#C89A3E,#FFD54F)", color: "#0C0E14" }}>
            + New Directive
          </button>
        </header>

        <div className="flex gap-6 mb-6 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {(["habit", "daily", "todo"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="pb-2 text-base font-semibold capitalize transition-colors"
              style={{
                color: tab === t ? "#FFD54F" : "#A09D96",
                borderBottom: `2px solid ${tab === t ? "#FFD54F" : "transparent"}`,
              }}
            >
              {t === "habit" ? "Habits" : t === "daily" ? "Dailies" : "To-Dos"}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 rounded-xl border-2 border-dashed" style={{ borderColor: "rgba(255,255,255,0.08)", color: "#A09D96" }}>
            <div className="text-lg mb-1" style={{ fontFamily: "'Cinzel',serif" }}>No {tab === "habit" ? "habits" : tab === "daily" ? "dailies" : "to-dos"} yet</div>
            <div className="text-sm">Forge your first directive to start earning Gold and XP.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((task) => (
              <TaskCard key={task.id} task={task} busy={busyIds.has(task.id)}
                onScore={(dir) => scoreMut.mutate({ id: task.id, direction: dir })}
                onEdit={() => { setEditing(task); setDialogOpen(true); }}
                onDelete={() => deleteMut.mutate(task.id)} />
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
    </AppShell>
  );
}
