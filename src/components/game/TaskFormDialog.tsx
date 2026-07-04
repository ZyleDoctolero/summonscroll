import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Task } from "./TaskCard";
import type { Difficulty, TaskType } from "@/lib/game/constants";
import { listRealms } from "@/lib/game/supabase-api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const ELEMENT_OPTIONS: { key: string; label: string; color: string; icon: string }[] = [
  { key: "fire", label: "Fire", color: "#ff5e2a", icon: "🔥" },
  { key: "water", label: "Water", color: "#38b8f5", icon: "💧" },
  { key: "nature", label: "Nature", color: "#3ed97a", icon: "🌿" },
  { key: "light", label: "Light", color: "#ffe066", icon: "✨" },
  { key: "dark", label: "Dark", color: "#c47fff", icon: "🌑" },
  { key: "arcane", label: "Arcane", color: "#c89a3e", icon: "🔮" },
];

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
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);

  const realmsQ = useQuery({
    queryKey: ["realms"],
    queryFn: listRealms,
    staleTime: Infinity,
  });

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
    setTagsInput((initial?.tags ?? []).join(", "));
  }, [open, initial, defaultType]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.title.trim()) return;
    setSaving(true);
    try {
      const finalTags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await onSubmit({
        ...v,
        tags: finalTags,
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
          style={{ color: "var(--gold-bright)", letterSpacing: "0.1em" }}
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

        <Field label="Category (optional)">
          <input
            className="ss-input"
            value={v.category}
            onChange={(e) => setV({ ...v, category: e.target.value })}
            maxLength={40}
            placeholder="Mind . Body . Vaults"
          />
        </Field>

        <Field label="Realm Affinity (optional)">
          <Select
            value={v.realm_id ? String(v.realm_id) : "none"}
            onValueChange={(val) => setV({ ...v, realm_id: val === "none" ? null : Number(val) })}
          >
            <SelectTrigger className="ss-input flex h-auto min-h-[42px] w-full items-center justify-between outline-none focus:border-[var(--ss-gold)] transition-colors">
              <SelectValue placeholder="No Realm Affinity" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--bg-pane)] border-[var(--ss-hairline)] text-[var(--ink-primary)]">
              <SelectItem value="none">No Realm Affinity</SelectItem>
              {realmsQ.data?.realms.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Tags (comma separated)">
          <input
            className="ss-input"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="fitness, work, reading"
          />
        </Field>

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
                  color: v.difficulty === d ? "var(--gold-bright)" : "var(--ink-tertiary)",
                  borderRight: i < 3 ? "1px solid rgba(200,154,62,0.2)" : "none",
                  letterSpacing: "0.04em",
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Element Tag — for Ritual Incubation">
          <div className="flex gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => setV({ ...v, element: null })}
              className="py-1 px-2 text-[9px] font-bold uppercase"
              style={{
                fontFamily: "var(--ss-font-pixel)",
                background: v.element === null ? "rgba(180,150,100,0.25)" : "transparent",
                color: v.element === null ? "var(--ink-primary)" : "var(--ink-tertiary)",
                border: `1px solid ${v.element === null ? "rgba(180,150,100,0.5)" : "rgba(180,150,100,0.2)"}`,
                borderRadius: 0,
                letterSpacing: "0.04em",
              }}
            >
              None
            </button>
            {ELEMENT_OPTIONS.map((el) => (
              <button
                key={el.key}
                type="button"
                onClick={() => setV({ ...v, element: el.key })}
                className="py-1 px-2 text-[9px] font-bold uppercase flex items-center gap-1"
                style={{
                  fontFamily: "var(--ss-font-pixel)",
                  background: v.element === el.key ? `${el.color}22` : "transparent",
                  color: v.element === el.key ? el.color : "var(--ink-tertiary)",
                  border: `1px solid ${v.element === el.key ? el.color : "rgba(180,150,100,0.2)"}`,
                  borderRadius: 0,
                  letterSpacing: "0.04em",
                  boxShadow: v.element === el.key ? `2px 2px 0 rgba(0,0,0,0.35)` : "none",
                }}
              >
                {el.icon} {el.label}
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
