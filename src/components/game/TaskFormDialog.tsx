import { useEffect, useState } from "react";
import type { Task } from "./TaskCard";
import type { Difficulty, TaskType } from "@/lib/game/constants";

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

export type TaskFormValue = {
  type: TaskType;
  title: string;
  notes: string;
  category: string;
  difficulty: Difficulty;
  positive_enabled: boolean;
  negative_enabled: boolean;
  schedule_days: number[];
  tags: string[];
  realm_id: number | null;
  element: string | null;
  due_date: string | null;
  due_time: string | null;
};

export function TaskFormDialog({
  open,
  defaultType,
  initial,
  onSubmit,
  onClose,
}: {
  open: boolean;
  defaultType: TaskType;
  initial?: Task & { schedule_days?: number[]; tags?: string[]; realm_id?: number | null };
  onSubmit: (v: TaskFormValue) => void | Promise<void>;
  onClose: () => void;
}) {
  const [v, setV] = useState<TaskFormValue>({
    type: defaultType,
    title: "",
    notes: "",
    category: "",
    difficulty: "easy",
    positive_enabled: true,
    negative_enabled: false,
    schedule_days: [0, 1, 2, 3, 4, 5, 6],
    tags: [],
    realm_id: null,
    element: null,
    due_date: null,
    due_time: null,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setV({
      type: initial?.type ?? defaultType,
      title: initial?.title ?? "",
      notes: initial?.notes ?? "",
      category: initial?.category ?? "",
      difficulty: initial?.difficulty ?? "easy",
      positive_enabled: initial?.positive_enabled ?? true,
      negative_enabled: initial?.negative_enabled ?? false,
      schedule_days: initial?.schedule_days ?? [0, 1, 2, 3, 4, 5, 6],
      tags: initial?.tags ?? [],
      realm_id: initial?.realm_id ?? null,
      element: (initial as { element?: string | null })?.element ?? null,
      due_date: initial?.due_date ?? null,
      due_time: initial?.due_time ? initial.due_time.slice(0, 5) : null,
    });
  }, [open, initial, defaultType]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        ...v,
        // habits have no schedule; dailies recur so a fixed date makes no sense
        due_date: v.type === "todo" ? v.due_date : null,
        due_time: v.type === "habit" ? null : v.due_time,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.82)" }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="ss-modal w-full"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <h2
          className="font-bold font-['Cinzel'] text-base mb-3"
          style={{ color: "var(--gold-ink)", letterSpacing: "0.1em" }}
        >
          {initial ? "EDIT DIRECTIVE" : "NEW DIRECTIVE"}
        </h2>

        {!initial && (
          <div
            className="flex gap-0 mb-1"
            style={{ border: "2px solid rgba(200,154,62,0.3)", borderRadius: 0 }}
          >
            {(["habit", "daily", "todo"] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setV((s) => ({ ...s, type: t }))}
                className="flex-1 py-2 text-[9px] uppercase font-bold"
                style={{
                  fontFamily: "var(--ss-font-pixel)",
                  background: v.type === t ? "var(--gold-bright)" : "transparent",
                  color: v.type === t ? "var(--ink-primary)" : "var(--ink-tertiary)",
                  borderRight: t !== "todo" ? "1px solid rgba(200,154,62,0.2)" : "none",
                  letterSpacing: "0.04em",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        <Field label="Title">
          <input
            className="ss-input"
            value={v.title}
            onChange={(e) => setV({ ...v, title: e.target.value })}
            maxLength={120}
            required
            autoFocus
          />
        </Field>

        {v.type !== "habit" && (
          <div className="flex gap-2">
            {v.type === "todo" && (
              <div className="flex-1">
                <Field label="Due date (optional)">
                  <input
                    type="date"
                    className="ss-input"
                    value={v.due_date ?? ""}
                    onChange={(e) => setV({ ...v, due_date: e.target.value || null })}
                  />
                </Field>
              </div>
            )}
            <div className="flex-1">
              <Field label="At time (optional)">
                <input
                  type="time"
                  className="ss-input"
                  value={v.due_time ?? ""}
                  onChange={(e) => setV({ ...v, due_time: e.target.value || null })}
                />
              </Field>
            </div>
          </div>
        )}

        <Field label="Notes (optional)">
          <textarea
            className="ss-input"
            value={v.notes}
            onChange={(e) => setV({ ...v, notes: e.target.value })}
            rows={2}
            maxLength={2000}
          />
        </Field>

        <Field label="Difficulty">
          <div
            className="flex gap-0"
            style={{ border: "2px solid rgba(200,154,62,0.25)", borderRadius: 0 }}
          >
            {(["trivial", "easy", "medium", "hard"] as const).map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() => setV({ ...v, difficulty: d })}
                className="flex-1 py-2 text-[9px] uppercase font-bold"
                style={{
                  fontFamily: "var(--ss-font-pixel)",
                  background: v.difficulty === d ? "rgba(200,154,62,0.2)" : "transparent",
                  color: v.difficulty === d ? "var(--ink-primary)" : "var(--ink-tertiary)",
                  borderRight: i < 3 ? "1px solid rgba(200,154,62,0.2)" : "none",
                  letterSpacing: "0.04em",
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </Field>

        {v.type === "habit" && (
          <Field label="Buttons">
            <div className="flex gap-3">
              <label
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--ink-primary)" }}
              >
                <input
                  type="checkbox"
                  checked={v.positive_enabled}
                  onChange={(e) => setV({ ...v, positive_enabled: e.target.checked })}
                />
                Positive (+)
              </label>
              <label
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--ink-primary)" }}
              >
                <input
                  type="checkbox"
                  checked={v.negative_enabled}
                  onChange={(e) => setV({ ...v, negative_enabled: e.target.checked })}
                />
                Negative (-)
              </label>
            </div>
          </Field>
        )}

        {v.type === "daily" && (
          <Field label="Schedule">
            <div className="flex gap-1">
              {DOW.map((d, i) => {
                const on = v.schedule_days.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      setV({
                        ...v,
                        schedule_days: on
                          ? v.schedule_days.filter((x) => x !== i)
                          : [...v.schedule_days, i].sort(),
                      })
                    }
                    className="flex-1 py-2 text-[9px] font-bold"
                    style={{
                      fontFamily: "var(--ss-font-pixel)",
                      background: on ? "var(--gold-bright)" : "rgba(200,154,62,0.06)",
                      color: on ? "var(--ink-primary)" : "var(--ink-secondary)",
                      border: `2px solid ${on ? "var(--gold-glow)" : "rgba(200,154,62,0.15)"}`,
                      borderRadius: 0,
                      boxShadow: on ? "2px 2px 0 var(--gold-glow)" : "none",
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </Field>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 text-[10px] uppercase font-bold ss-btn ss-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2 text-[10px] uppercase font-bold ss-btn ss-btn-primary disabled:opacity-50"
          >
            {saving ? "Saving..." : initial ? "Save" : "Create"}
          </button>
        </div>
        {/* .ss-input styles defined globally in styles.css */}
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div
        className="mb-1 uppercase"
        style={{
          fontFamily: "var(--ss-font-pixel)",
          fontSize: 9,
          letterSpacing: "0.06em",
          color: "var(--ink-tertiary)",
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}
