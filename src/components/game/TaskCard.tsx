import React, { useState, useCallback } from "react";
import { Icon } from "@/components/ui/Icon";
import { valueColor, VALUE_COLOR_HEX, type Difficulty, type TaskType } from "@/lib/game/constants";
import { FloatingTextContainer, type FloatingTextItem } from "./FloatingText";

export type Task = {
  id: string;
  type: TaskType;
  title: string;
  notes: string | null;
  category: string | null;
  difficulty: Difficulty;
  value: number;
  streak: number;
  positive_enabled: boolean;
  negative_enabled: boolean;
  completed: boolean;
  is_starred?: boolean;
  tags?: string[];
  realm_id?: number | null;
};

// Category  realm affinity mapping per FR01 2.8
// Category  realm affinity mapping per FR01 2.8
const CATEGORY_ICONS: Record<string, string> = {
  study: "tome",
  reading: "tome",
  mind: "tome",
  strength: "dumbbell",
  training: "dumbbell",
  body: "dumbbell",
  meditation: "morning",
  mindfulness: "memorial",
  sleep: "evening",
  recovery: "evening",
  exercise: "stamina",
  fitness: "stamina",
  night: "evening",
  custom: "target",
  water: "food",
  nutrition: "food",
  goals: "crown",
  ambition: "crown",
  productivity: "stamina",
  work: "stamina",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  trivial: "Trivial",
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const DIFFICULTY_STARS: Record<string, number> = {
  trivial: 0,
  easy: 1,
  medium: 2,
  hard: 3,
};

export const TaskCard = React.memo(function TaskCard({
  task,
  onScore,
  onEdit,
  onDelete,
  busy,
  isTutorial = false,
}: {
  task: Task;
  onScore: (id: string, direction: "plus" | "minus" | "complete" | "uncomplete") => void;
  onEdit: (task: Task) => void;
  onDelete: () => void;
  busy: boolean;
  isTutorial?: boolean;
}) {
  const color = VALUE_COLOR_HEX[valueColor(Number(task.value))];
  const [open, setOpen] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextItem[]>([]);
  const [justCompleted, setJustCompleted] = useState(false);

  const categoryIcon = task.category
    ? (CATEGORY_ICONS[task.category.toLowerCase()] ?? "target")
    : "target";

  const handleScore = useCallback(
    (dir: "plus" | "minus" | "complete" | "uncomplete") => {
      if (dir === "plus" || dir === "complete") {
        setJustCompleted(true);
        setTimeout(() => setJustCompleted(false), 800);
        setFloatingTexts((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).slice(2),
            text: `+${Math.max(10, Math.floor(Number(task.value) * 1.5))} XP`,
            color: "var(--gold-bright)",
          },
        ]);
      }
      onScore(task.id, dir);
    },
    [task.id, task.value, onScore],
  );

  const removeFloatingText = useCallback((id: string) => {
    setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Streak health calculation per FR01 2.2
  const streakHealth =
    task.streak > 0
      ? Math.min(100, task.streak * 15) // rough approximation
      : Number(task.value) > 0
        ? 50
        : 0;
  const streakColor =
    streakHealth >= 75
      ? "var(--success)"
      : streakHealth >= 40
        ? "var(--warning)"
        : streakHealth > 0
          ? "var(--danger)"
          : "var(--ink-tertiary)";

  return (
    <article
      className="ss-card ss-panel-holographic holographic flex gap-3 group relative transition-all overflow-visible duration-300 hover:shadow-[0_4px_20px_rgba(200,154,62,0.2)]"
      /* eslint-disable no-restricted-syntax */
      style={{
        borderLeft: `4px solid ${task.is_starred ? "#fcd34d" : color}`,
        borderLeftWidth: task.is_starred ? 6 : 4,
        borderLeftColor: task.is_starred ? "#fcd34d" : color,
        borderRadius: "12px",
        opacity: task.completed && task.type !== "habit" ? 0.55 : 1,
        boxShadow: task.is_starred ? "0 0 18px rgba(212,175,63,0.4)" : undefined,
        animation: isTutorial 
          ? "tutorial-pulse 2s ease-in-out infinite" 
          : justCompleted 
            ? "task-complete-flash 0.8s ease-out forwards" 
            : undefined,
      }}
      /* eslint-enable no-restricted-syntax */
    >
      <FloatingTextContainer items={floatingTexts} onComplete={removeFloatingText} />

      {task.is_starred && (
        <div
          className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-widest shadow flex items-center gap-1"
          /* eslint-disable no-restricted-syntax */
          style={{
            background: "linear-gradient(135deg,#d4af3f,#fcd34d)",
            color: "#ffffff",
            border: "1px solid #fef08a",
            boxShadow: "0 0 10px rgba(212,175,63,0.5)",
          }}
          /* eslint-enable no-restricted-syntax */
        >
          <Icon name="star" size={10} color="var(--bg-deep)" className="fill-current" />
          Sacred
        </div>
      )}
      {/* Action buttons - FR01 2.3: [+] and [-] for habits */}
      {task.type === "habit" ? (
        <div className="flex flex-col gap-1.5">
          {task.positive_enabled && (
            <button
              disabled={busy}
              onClick={() => handleScore("plus")}
              className="relative w-12 h-12 min-w-[48px] rounded-lg grid place-items-center transition-all hover:scale-110 active:scale-95 disabled:opacity-40 font-bold text-xl"
              style={{
                background: "rgba(95,173,65,0.12)",
                color: "var(--success)",
                border: "1.5px solid rgba(95,173,65,0.35)",
              }}
              aria-label="Score positive"
            >
              +
            </button>
          )}
          {task.negative_enabled && (
            <button
              disabled={busy}
              onClick={() => handleScore("minus")}
              className="relative w-12 h-12 min-w-[48px] rounded-lg grid place-items-center transition-all hover:scale-110 active:scale-95 disabled:opacity-40 font-bold text-xl"
              style={{
                background: "rgba(224,82,82,0.12)",
                color: "var(--danger)",
                border: "1.5px solid rgba(224,82,82,0.35)",
              }}
              aria-label="Score negative"
            >
              -
            </button>
          )}
        </div>
      ) : (
        <button
          disabled={busy}
          onClick={() => handleScore(task.completed ? "uncomplete" : "complete")}
          className="relative w-12 h-12 min-w-[48px] rounded-[12px] grid place-items-center self-start transition-all hover:scale-110 active:scale-95 disabled:opacity-40"
          /* eslint-disable no-restricted-syntax */
          style={{
            background: task.completed ? color : "rgba(180,150,100,0.12)",
            border: `3px solid ${color}`,
            color: task.completed ? "#ffffff" : color,
            boxShadow: `inset 0 0 8px ${color}40`,
          }}
          /* eslint-enable no-restricted-syntax */
          aria-label="Toggle complete"
        >
          {task.completed && <Icon name="check" size={18} strokeWidth={3} />}
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {task.category && (
              <div
                className="text-[11px] uppercase tracking-widest mb-0.5 flex items-center gap-1"
                style={{ color }}
              >
                <Icon
                  name={categoryIcon as React.ComponentProps<typeof Icon>["name"]}
                  size={11}
                  color={color}
                />
                <span>{task.category}</span>
              </div>
            )}
            <h3
              className="t-h3 text-base truncate"
              style={{
                color: "var(--ink-primary)",
                textDecoration:
                  task.completed && task.type !== "habit" ? "line-through" : undefined,
              }}
            >
              {task.title}
            </h3>
          </div>
          <div className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="w-11 h-11 min-w-[44px] grid place-items-center rounded-lg hover:bg-[rgba(200,154,62,0.08)]"
              style={{ color: "var(--ink-secondary)" }}
              aria-label="More options"
            >
              <Icon name="more" size={18} />
            </button>
            {open && (
              <div
                className="absolute right-0 top-10 z-[70] min-w-[140px] rounded-lg border shadow-xl ss-card py-1"
                style={{ borderColor: "var(--ss-hairline)" }}
                onMouseLeave={() => setOpen(false)}
              >
                <button
                  onClick={() => {
                    setOpen(false);
                    onEdit(task);
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-[rgba(200,154,62,0.06)] flex items-center gap-2"
                  style={{ color: "var(--ink-primary)" }}
                >
                  <Icon name="edit" size={13} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    onDelete();
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-[rgba(200,154,62,0.06)] flex items-center gap-2"
                  style={{ color: "var(--danger)" }}
                >
                  <Icon name="delete" size={13} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {task.notes && (
          <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--ink-tertiary)" }}>
            {task.notes}
          </p>
        )}

        {/* Task meta row */}
        <div
          className="flex items-center gap-3 mt-2 text-[11px]"
          style={{ color: "var(--ink-tertiary)" }}
        >
          <span className="t-mono flex items-center gap-1" style={{ color }}>
            {Array.from({ length: DIFFICULTY_STARS[task.difficulty] ?? 0 }).map((_, i) => (
              <Icon key={i} name="star" size={10} color={color} className="fill-current" />
            ))}
            {DIFFICULTY_STARS[task.difficulty] === 0 && (
              <Icon name="star" size={10} color={color} className="opacity-40" />
            )}
            <span className="ml-1">{DIFFICULTY_LABELS[task.difficulty] ?? task.difficulty}</span>
          </span>
          {task.streak > 0 && (
            <span className="flex items-center gap-1" style={{
              color: task.streak >= 30 ? "#e63e00" : task.streak >= 14 ? "#e68a00" : task.streak >= 7 ? "var(--gold-bright)" : "var(--warning)",
            }}>
              <Icon name="streak" size={task.streak >= 14 ? 15 : task.streak >= 7 ? 13 : 12} color={
                task.streak >= 30 ? "#e63e00" : task.streak >= 14 ? "#e68a00" : task.streak >= 7 ? "var(--gold-bright)" : "var(--warning)"
              } className={task.streak >= 7 ? "drop-shadow-[0_0_4px_rgba(230,138,0,0.5)]" : ""} />
              <span className="t-mono font-bold">
                {task.streak}
              </span>
            </span>
          )}
        </div>

        {/* Streak health bar - FR01 2.2 */}
        {task.type !== "todo" && task.streak > 0 && (
          <div className="mt-2">
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "rgba(180,150,100,0.12)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${streakHealth}%`, background: streakColor }}
              />
            </div>
          </div>
        )}

        {/* value is conveyed by the colored left border; no raw dev readout */}
      </div>
    </article>
  );
});
