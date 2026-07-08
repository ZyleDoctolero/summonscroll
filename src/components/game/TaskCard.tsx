import React, { useState, useCallback } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  valueColor,
  VALUE_COLOR_HEX,
  dueInfoFor,
  type Difficulty,
  type TaskType,
} from "@/lib/game/constants";
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
  element?: string | null;
  schedule_days?: number[];
  due_date?: string | null;
  due_time?: string | null;
};

const ELEMENT_COLOR: Record<string, string> = {
  fire: "#ff5e2a",
  water: "#38b8f5",
  nature: "#3ed97a",
  light: "#ffe066",
  dark: "#c47fff",
  arcane: "#c89a3e",
};
const ELEMENT_ICON: Record<string, string> = {
  fire: "🔥",
  water: "💧",
  nature: "🌿",
  light: "✨",
  dark: "🌑",
  arcane: "🔮",
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
  notToday = false,
}: {
  task: Task;
  onScore: (id: string, direction: "plus" | "minus" | "complete" | "uncomplete") => void;
  onEdit: (task: Task) => void;
  onDelete: () => void;
  busy: boolean;
  isTutorial?: boolean;
  /** Daily that is not scheduled for today — rendered resting/dimmed. */
  notToday?: boolean;
}) {
  const color = VALUE_COLOR_HEX[valueColor(Number(task.value))];
  const [open, setOpen] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextItem[]>([]);
  const [justCompleted, setJustCompleted] = useState(false);

  const categoryIcon = task.category
    ? (CATEGORY_ICONS[task.category.toLowerCase()] ?? "target")
    : "target";

  const dueInfo = task.type === "habit" ? null : dueInfoFor(task.due_date, task.due_time);
  const dueColor =
    dueInfo?.tone === "overdue"
      ? "var(--danger)"
      : dueInfo?.tone === "today"
        ? "var(--gold-bright)"
        : "var(--ink-tertiary)";

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
      className="ss-card flex gap-3 group relative transition-all overflow-visible duration-150"
      /* eslint-disable no-restricted-syntax */
      style={{
        borderLeft: `4px solid ${task.is_starred ? "#fcd34d" : color}`,
        borderLeftWidth: task.is_starred ? 6 : 4,
        borderLeftColor: task.is_starred ? "#fcd34d" : color,
        borderRadius: 0,
        opacity: task.completed && task.type !== "habit" ? 0.55 : notToday ? 0.5 : 1,
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
          className="absolute -top-2 -right-2 px-2 py-0.5 text-[9px] font-bold uppercase flex items-center gap-1"
          /* eslint-disable no-restricted-syntax */
          style={{
            fontFamily: "var(--ss-font-pixel)",
            background: "#c89a3e",
            color: "var(--bg-deep)",
            border: "2px solid #7a5a1a",
            borderRadius: 0,
            boxShadow: "2px 2px 0 #7a5a1a",
          }}
          /* eslint-enable no-restricted-syntax */
        >
          <Icon name="star" size={9} color="var(--bg-deep)" className="fill-current" />
          Sacred
        </div>
      )}
      {/* Action buttons — pixel art push style */}
      {task.type === "habit" ? (
        <div className="flex flex-col gap-1.5">
          {task.positive_enabled && (
            <button
              disabled={busy}
              onClick={() => handleScore("plus")}
              className="ss-task-btn-plus disabled:opacity-40"
              aria-label="Score positive"
            >
              +
            </button>
          )}
          {task.negative_enabled && (
            <button
              disabled={busy}
              onClick={() => handleScore("minus")}
              className="ss-task-btn-minus disabled:opacity-40"
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
          className="relative w-12 h-12 min-w-[48px] grid place-items-center self-start disabled:opacity-40 transition-all"
          /* eslint-disable no-restricted-syntax */
          style={{
            background: task.completed ? color : "rgba(180,150,100,0.12)",
            border: `2px solid ${color}`,
            borderRadius: 0,
            // cyan is the only light value fill — dark ink reads there, white on the rest
            color: task.completed
              ? valueColor(Number(task.value)) === "blue"
                ? "var(--ink-primary)"
                : "#ffffff"
              : color,
            boxShadow: task.completed ? `2px 2px 0 rgba(0,0,0,0.4)` : `3px 3px 0 rgba(0,0,0,0.3)`,
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
              className="w-11 h-11 min-w-[44px] grid place-items-center hover:bg-[rgba(200,154,62,0.08)]"
              style={{ borderRadius: 0, color: "var(--ink-secondary)" }}
              aria-label="More options"
            >
              <Icon name="more" size={18} />
            </button>
            {open && (
              <div
                className="absolute right-0 top-10 z-[70] min-w-[140px] border ss-card py-1"
                style={{
                  borderRadius: 0,
                  boxShadow: "3px 3px 0 rgba(0,0,0,0.4)",
                  borderColor: "var(--ss-hairline)",
                }}
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
          className="flex items-center gap-2 mt-2 flex-wrap"
          style={{ color: "var(--ink-tertiary)" }}
        >
          <span
            className="flex items-center gap-1"
            style={{ fontFamily: "var(--ss-font-pixel)", fontSize: 9, color }}
          >
            {Array.from({ length: DIFFICULTY_STARS[task.difficulty] ?? 0 }).map((_, i) => (
              <Icon key={i} name="star" size={9} color={color} className="fill-current" />
            ))}
            {DIFFICULTY_STARS[task.difficulty] === 0 && (
              <Icon name="star" size={9} color={color} className="opacity-40" />
            )}
            <span className="ml-1">{DIFFICULTY_LABELS[task.difficulty] ?? task.difficulty}</span>
          </span>
          {dueInfo && (
            <span
              className="flex items-center gap-1"
              style={{
                fontFamily: "var(--ss-font-pixel)",
                fontSize: 9,
                padding: "1px 5px",
                border: `1px solid ${dueColor}`,
                color: dueColor,
                background:
                  dueInfo.tone === "overdue"
                    ? "rgba(230,62,0,0.1)"
                    : dueInfo.tone === "today"
                      ? "rgba(200,154,62,0.1)"
                      : "transparent",
                borderRadius: 0,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              <Icon name={task.due_time ? "clock" : "calendar"} size={10} color={dueColor} />
              {dueInfo.label}
            </span>
          )}
          {notToday && (
            <span
              style={{
                fontFamily: "var(--ss-font-pixel)",
                fontSize: 9,
                padding: "1px 5px",
                border: "1px solid rgba(180,150,100,0.3)",
                color: "var(--ink-tertiary)",
                borderRadius: 0,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Resting — not due today
            </span>
          )}
          {task.streak > 0 && (
            <span
              className="flex items-center gap-1"
              style={{
                fontFamily: "var(--ss-font-pixel)",
                fontSize: 9,
                color:
                  task.streak >= 30
                    ? "#e63e00"
                    : task.streak >= 14
                      ? "#e68a00"
                      : task.streak >= 7
                        ? "var(--gold-bright)"
                        : "#ffb74d",
              }}
            >
              <Icon
                name="streak"
                size={11}
                color={
                  task.streak >= 30
                    ? "#e63e00"
                    : task.streak >= 14
                      ? "#e68a00"
                      : task.streak >= 7
                        ? "var(--gold-bright)"
                        : "#ffb74d"
                }
              />
              {task.streak}🔥
            </span>
          )}
          {task.element && ELEMENT_COLOR[task.element] && (
            <span
              style={{
                fontFamily: "var(--ss-font-pixel)",
                fontSize: 9,
                padding: "1px 5px",
                border: `1px solid ${ELEMENT_COLOR[task.element]}`,
                color: ELEMENT_COLOR[task.element],
                background: `${ELEMENT_COLOR[task.element]}15`,
                borderRadius: 0,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {ELEMENT_ICON[task.element]} {task.element}
            </span>
          )}
        </div>

        {/* Streak health bar — segmented pixel art */}
        {task.type !== "todo" && task.streak > 0 && (
          <div className="mt-2">
            <div className="ss-bar-pixel" style={{ height: 10 }}>
              <div
                className="ss-bar-pixel-fill"
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
