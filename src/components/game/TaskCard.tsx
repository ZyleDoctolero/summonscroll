import { useState } from "react";
import {
  valueColor,
  VALUE_COLOR_HEX,
  type Difficulty,
  type TaskType,
} from "@/lib/game/constants";

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
};

// Category → realm affinity mapping per FR01 §2.8
const CATEGORY_ICONS: Record<string, string> = {
  study: "📚", reading: "📚", mind: "📚",
  strength: "💪", training: "💪", body: "💪",
  meditation: "🧘", mindfulness: "🙏",
  sleep: "😴", recovery: "😴",
  exercise: "🏃", fitness: "🏃",
  night: "🌙",
  custom: "🎯",
  water: "🥗", nutrition: "🥗",
  goals: "🚀", ambition: "🚀",
  productivity: "⚡", work: "⚡",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  trivial: "☆ Trivial",
  easy: "⭐ Easy",
  medium: "⭐⭐ Medium",
  hard: "⭐⭐⭐ Hard",
};

export function TaskCard({
  task,
  onScore,
  onEdit,
  onDelete,
  busy,
}: {
  task: Task;
  onScore: (dir: "plus" | "minus" | "complete" | "uncomplete") => void;
  onEdit: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const color = VALUE_COLOR_HEX[valueColor(Number(task.value))];
  const [open, setOpen] = useState(false);
  const categoryIcon = task.category
    ? CATEGORY_ICONS[task.category.toLowerCase()] ?? "🎯"
    : "📋";

  // Streak health calculation per FR01 §2.2
  const streakHealth = task.streak > 0
    ? Math.min(100, task.streak * 15) // rough approximation
    : Number(task.value) > 0 ? 50 : 0;
  const streakColor = streakHealth >= 75 ? "#5FAD41" : streakHealth >= 40 ? "#FFB74D" : streakHealth > 0 ? "#E05252" : "#6B6864";

  return (
    <article
      className="rounded-lg p-4 flex gap-3 group relative transition-all"
      style={{
        background: `linear-gradient(90deg, ${color}14, #13161F 30%)`,
        borderLeft: `4px solid ${color}`,
        border: "1px solid rgba(255,255,255,0.07)",
        borderLeftWidth: 4,
        borderLeftColor: color,
        opacity: task.completed && task.type !== "habit" ? 0.55 : 1,
      }}
    >
      {/* Action buttons — FR01 §2.3: [+] and [−] for habits */}
      {task.type === "habit" ? (
        <div className="flex flex-col gap-1.5">
          {task.positive_enabled && (
            <button
              disabled={busy}
              onClick={() => onScore("plus")}
              className="w-9 h-9 rounded-md grid place-items-center transition-all hover:scale-110 disabled:opacity-40 font-bold text-lg"
              style={{ background: "rgba(95,173,65,0.15)", color: "#5FAD41", border: "1px solid rgba(95,173,65,0.4)" }}
              aria-label="Score positive"
            >
              +
            </button>
          )}
          {task.negative_enabled && (
            <button
              disabled={busy}
              onClick={() => onScore("minus")}
              className="w-9 h-9 rounded-md grid place-items-center transition-all hover:scale-110 disabled:opacity-40 font-bold text-lg"
              style={{ background: "rgba(224,82,82,0.15)", color: "#E05252", border: "1px solid rgba(224,82,82,0.4)" }}
              aria-label="Score negative"
            >
              −
            </button>
          )}
        </div>
      ) : (
        <button
          disabled={busy}
          onClick={() => onScore(task.completed ? "uncomplete" : "complete")}
          className="w-9 h-9 rounded-md grid place-items-center self-start transition-all hover:scale-110 disabled:opacity-40"
          style={{
            background: task.completed ? color : "transparent",
            border: `2px solid ${color}`,
            color: task.completed ? "#0C0E14" : color,
          }}
          aria-label="Toggle complete"
        >
          {task.completed && "✓"}
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {task.category && (
              <div className="text-[10px] uppercase tracking-widest mb-0.5 flex items-center gap-1" style={{ color }}>
                <span>{categoryIcon}</span>
                <span>{task.category}</span>
              </div>
            )}
            <h3
              className="font-semibold text-base truncate"
              style={{
                color: "#F0EDE6",
                fontFamily: "'Cinzel',serif",
                textDecoration: task.completed && task.type !== "habit" ? "line-through" : undefined,
              }}
            >
              {task.title}
            </h3>
          </div>
          <div className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="w-7 h-7 grid place-items-center rounded hover:bg-white/5"
              style={{ color: "#A09D96" }}
              aria-label="More options"
            >
              ⋮
            </button>
            {open && (
              <div
                className="absolute right-0 top-8 z-10 min-w-[120px] rounded border shadow-xl"
                style={{ background: "#1A1E2A", borderColor: "rgba(255,255,255,0.1)" }}
                onMouseLeave={() => setOpen(false)}
              >
                <button
                  onClick={() => { setOpen(false); onEdit(); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-white/5"
                  style={{ color: "#F0EDE6" }}
                >
                  ✏ Edit
                </button>
                <button
                  onClick={() => { setOpen(false); onDelete(); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-white/5"
                  style={{ color: "#E05252" }}
                >
                  🗑 Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {task.notes && (
          <p className="text-xs mt-1 line-clamp-2" style={{ color: "#A09D96" }}>
            {task.notes}
          </p>
        )}

        {/* Task meta row */}
        <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: "#6B6864" }}>
          <span style={{ color, fontFamily: "'JetBrains Mono',monospace" }}>
            {DIFFICULTY_LABELS[task.difficulty] ?? task.difficulty}
          </span>
          {task.streak > 0 && (
            <span className="flex items-center gap-1">
              <span style={{ color: "#FF8A65" }}>🔥</span>
              <span style={{ color: "#FF8A65", fontFamily: "'JetBrains Mono',monospace" }}>
                {task.streak}
              </span>
            </span>
          )}
        </div>

        {/* Streak health bar — FR01 §2.2 */}
        {task.type !== "todo" && task.streak > 0 && (
          <div className="mt-2">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${streakHealth}%`, background: streakColor }}
              />
            </div>
          </div>
        )}

        {/* Reward preview — FR01 §2.3 */}
        <div className="mt-1.5 text-[10px] flex gap-2" style={{ color: "#6B6864", fontFamily: "'JetBrains Mono',monospace" }}>
          <span style={{ color: `${color}99` }}>val {Number(task.value).toFixed(1)}</span>
        </div>
      </div>
    </article>
  );
}
