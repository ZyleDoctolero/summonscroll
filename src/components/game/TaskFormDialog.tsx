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
      await onSubmit({ ...v, tags: finalTags });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(61,46,31,0.5)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="ss-modal">
        <h2 className="t-h2 text-xl font-bold" style={{ color: "var(--gold-bright)" }}>
          {initial ? "Edit Directive" : "New Directive"}
        </h2>

        {!initial && (
          <div className="flex gap-2">
            {(["habit", "daily", "todo"] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setV((s) => ({ ...s, type: t }))}
                className="flex-1 py-2 rounded text-xs uppercase tracking-widest font-bold"
                /* eslint-disable no-restricted-syntax */
                style={{
                  background:
                    v.type === t
                      ? "linear-gradient(135deg,#d4af3f,#fcd34d)"
                      : "rgba(200,154,62,0.06)",
                  color: v.type === t ? "#ffffff" : "var(--ink-secondary)",
                }}
                /* eslint-enable no-restricted-syntax */
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
          <div className="flex gap-2">
            {(["trivial", "easy", "medium", "hard"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setV({ ...v, difficulty: d })}
                className="flex-1 py-2 rounded text-xs uppercase font-semibold"
                style={{
                  background:
                    v.difficulty === d ? "rgba(255,213,79,0.18)" : "rgba(200,154,62,0.04)",
                  color: v.difficulty === d ? "var(--gold-bright)" : "var(--ink-secondary)",
                  border: `1px solid ${v.difficulty === d ? "rgba(255,213,79,0.4)" : "transparent"}`,
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
                    className="flex-1 py-2 text-xs font-bold rounded"
                    /* eslint-disable no-restricted-syntax */
                    style={{
                      background: on
                        ? "linear-gradient(135deg,#d4af3f,#fcd34d)"
                        : "rgba(200,154,62,0.06)",
                      color: on ? "#ffffff" : "var(--ink-secondary)",
                    }}
                    /* eslint-enable no-restricted-syntax */
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
            className="flex-1 py-2 rounded text-sm uppercase tracking-widest"
            style={{ background: "rgba(200,154,62,0.06)", color: "var(--ink-secondary)" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2 rounded text-sm uppercase tracking-widest font-bold disabled:opacity-50"
            // eslint-disable-next-line no-restricted-syntax
            style={{ background: "linear-gradient(135deg,#d4af3f,#fcd34d)", color: "#ffffff" }}
          >
            {saving ? "Saving" : initial ? "Save" : "Create"}
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
        className="text-[11px] uppercase tracking-widest mb-1 font-semibold"
        style={{ color: "var(--ink-secondary)" }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}
