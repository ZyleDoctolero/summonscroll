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
      {/* Action buttons left */}
      {task.type === "habit" ? (
        <div className="flex flex-col gap-1.5">
          {task.positive_enabled && (
            <button
              disabled={busy}
              onClick={() => onScore("plus")}
              className="w-8 h-8 rounded grid place-items-center transition-all hover:scale-110 disabled:opacity-40"
              style={{ background: "rgba(95,173,65,0.15)", color: "#5FAD41", border: "1px solid rgba(95,173,65,0.4)" }}
              aria-label="Score positive"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
          )}
          {task.negative_enabled && (
            <button
              disabled={busy}
              onClick={() => onScore("minus")}
              className="w-8 h-8 rounded grid place-items-center transition-all hover:scale-110 disabled:opacity-40"
              style={{ background: "rgba(224,82,82,0.15)", color: "#E05252", border: "1px solid rgba(224,82,82,0.4)" }}
              aria-label="Score negative"
            >
              <span className="material-symbols-outlined text-[18px]">remove</span>
            </button>
          )}
        </div>
      ) : (
        <button
          disabled={busy}
          onClick={() => onScore(task.completed ? "uncomplete" : "complete")}
          className="w-8 h-8 rounded-md grid place-items-center self-start transition-all hover:scale-110 disabled:opacity-40"
          style={{
            background: task.completed ? color : "transparent",
            border: `2px solid ${color}`,
            color: task.completed ? "#0C0E14" : color,
          }}
          aria-label="Toggle complete"
        >
          {task.completed && <span className="material-symbols-outlined text-[18px]">check</span>}
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {task.category && (
              <div
                className="text-[10px] uppercase tracking-widest mb-0.5"
                style={{ color }}
              >
                {task.category}
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
              aria-label="More"
            >
              <span className="material-symbols-outlined text-[18px]">more_vert</span>
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
                  Edit
                </button>
                <button
                  onClick={() => { setOpen(false); onDelete(); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-white/5"
                  style={{ color: "#E05252" }}
                >
                  Delete
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
        <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: "#6B6864" }}>
          <span style={{ color, fontFamily: "'JetBrains Mono',monospace" }}>
            {Difficulty(task.difficulty)}
          </span>
          {task.streak > 0 && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]" style={{ color: "#FF8A65" }}>
                local_fire_department
              </span>
              <span style={{ color: "#FF8A65", fontFamily: "'JetBrains Mono',monospace" }}>
                {task.streak}
              </span>
            </span>
          )}
          <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>
            value {Number(task.value).toFixed(1)}
          </span>
        </div>
      </div>
    </article>
  );
}

function Difficulty(d: string) {
  const map: Record<string, string> = {
    trivial: "★ Trivial",
    easy: "★ Easy",
    medium: "★★ Medium",
    hard: "★★★ Hard",
  };
  return map[d] ?? d;
}
