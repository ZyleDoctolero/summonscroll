import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/game/AppShell";
import { TaskCard, type Task } from "@/components/game/TaskCard";
import { TaskFormDialog, type TaskFormValue } from "@/components/game/TaskFormDialog";
import { DeathOverlay } from "@/components/game/DeathOverlay";
import { getMyProfile } from "@/lib/game/profile.functions";
import {
  createTask,
  deleteTask,
  listTasks,
  scoreTask,
  updateTask,
} from "@/lib/game/tasks.functions";
import type { TaskType } from "@/lib/game/constants";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Hub Directives — SummonScroll" }] }),
  component: HubPage,
});

function HubPage() {
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const fetchTasks = useServerFn(listTasks);
  const create = useServerFn(createTask);
  const update = useServerFn(updateTask);
  const remove = useServerFn(deleteTask);
  const score = useServerFn(scoreTask);

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
    refetchOnWindowFocus: false,
  });
  const tasksQ = useQuery({
    queryKey: ["tasks"],
    queryFn: () => fetchTasks(),
    refetchOnWindowFocus: false,
  });

  const [tab, setTab] = useState<TaskType>("habit");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deathTick, setDeathTick] = useState(0);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (profileQ.data?.cron?.died) {
      setDeathTick((n) => n + 1);
      toast.error(`Cron applied damage — you fell asleep at your post. HP: ${profileQ.data.profile.hp}/${profileQ.data.profile.max_hp}`);
    } else if (profileQ.data?.cron?.ran && profileQ.data.cron.missedDailies > 0) {
      toast(`Cron: ${profileQ.data.cron.missedDailies} missed daily — ${profileQ.data.cron.hpLost} HP lost.`);
    }
  }, [profileQ.data?.cron]);

  const tasks = (tasksQ.data?.tasks ?? []) as unknown as Task[];
  const filtered = useMemo(() => tasks.filter((t) => t.type === tab), [tasks, tab]);

  const scoreMut = useMutation({
    mutationFn: async (v: { id: string; direction: "plus" | "minus" | "complete" | "uncomplete" }) => {
      setBusyIds((s) => new Set(s).add(v.id));
      try {
        return await score({ data: v });
      } finally {
        setBusyIds((s) => { const n = new Set(s); n.delete(v.id); return n; });
      }
    },
    onSuccess: (res) => {
      if (res && "reward" in res && res.reward) {
        const parts: string[] = [];
        if (res.reward.gold) parts.push(`${res.reward.gold > 0 ? "+" : ""}${res.reward.gold}💰`);
        if (res.reward.xp) parts.push(`${res.reward.xp > 0 ? "+" : ""}${res.reward.xp} XP`);
        if (res.reward.gems) parts.push(`+${res.reward.gems} 💎`);
        if (res.reward.hp) parts.push(`${res.reward.hp} HP`);
        if (parts.length) {
          if (res.isPositive) toast.success(parts.join("  "));
          else toast.error(parts.join("  "));
        }
        // FR04 §3.2: Show boss damage dealt
        if ("bossDamage" in res && res.bossDamage) {
          toast(`⚔ Dealt ${res.bossDamage} damage to quest boss!`);
        }
        // FR01 §2.7: Show random drops
        if ("drop" in res && res.drop) {
          const dropRes = res.drop as { type: string; name: string };
          const icon = dropRes.type === "egg" ? "🥚" : dropRes.type === "realm_potion" ? "🧪" : "🍖";
          toast.success(`${icon} Drop: ${dropRes.name}!`);
        }
        if (res.died) setDeathTick((n) => n + 1);
      }
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["my-guild"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createMut = useMutation({
    mutationFn: (v: TaskFormValue) => create({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setDialogOpen(false);
      toast.success("Directive forged.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (v: { id: string; patch: Partial<TaskFormValue> }) => update({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setDialogOpen(false);
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast("Directive archived.");
    },
  });

  if (profileQ.isLoading || tasksQ.isLoading) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: "#0C0E14", color: "#A09D96" }}>
        Loading the realm…
      </div>
    );
  }
  if (profileQ.error || !profileQ.data) {
    return (
      <div className="min-h-screen grid place-items-center text-center" style={{ background: "#0C0E14", color: "#E05252" }}>
        Failed to load profile. <br />
        {(profileQ.error as Error | undefined)?.message}
      </div>
    );
  }

  const profile = profileQ.data.profile;

  return (
    <AppShell profile={profile}>
      <DeathOverlay trigger={deathTick} />
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-3xl md:text-4xl font-bold mb-1"
              style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}
            >
              Hub Directives
            </h1>
            <p className="text-sm" style={{ color: "#A09D96" }}>
              Manage your daily incantations and tasks.
            </p>
          </div>
          <button
            onClick={() => { setEditing(null); setDialogOpen(true); }}
            className="px-5 py-2.5 rounded-md font-bold uppercase tracking-widest text-xs"
            style={{
              background: "linear-gradient(135deg,#C89A3E,#FFD54F)",
              color: "#0C0E14",
              boxShadow: "0 0 24px rgba(255,213,79,0.25)",
            }}
          >
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
          <div
            className="text-center py-16 rounded-xl border-2 border-dashed"
            style={{ borderColor: "rgba(255,255,255,0.08)", color: "#A09D96" }}
          >
            <div className="text-lg mb-1" style={{ fontFamily: "'Cinzel',serif" }}>
              No {tab === "habit" ? "habits" : tab === "daily" ? "dailies" : "to-dos"} yet
            </div>
            <div className="text-sm">Forge your first directive to start earning Spirit Crystals.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                busy={busyIds.has(task.id)}
                onScore={(dir) => scoreMut.mutate({ id: task.id, direction: dir })}
                onEdit={() => { setEditing(task); setDialogOpen(true); }}
                onDelete={() => deleteMut.mutate(task.id)}
              />
            ))}
          </div>
        )}
      </div>

      <TaskFormDialog
        open={dialogOpen}
        defaultType={tab}
        initial={editing ?? undefined}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        onSubmit={async (v) => {
          if (editing) {
            await updateMut.mutateAsync({ id: editing.id, patch: v });
          } else {
            await createMut.mutateAsync(v);
          }
        }}
      />
    </AppShell>
  );
}
