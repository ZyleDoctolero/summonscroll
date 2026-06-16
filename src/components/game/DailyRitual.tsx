import { forwardRef, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  getTodayLog,
  setMorningIntents,
  submitEveningReflection,
  isMorningWindow,
  isEveningWindow,
} from "@/lib/game/rituals-client";
import { whisper } from "@/components/game/WhisperFeed";
import { trans, ease, dur, reducedMotion, stagger } from "@/lib/ui/motion-tokens";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";
import type { Task } from "./TaskCard";

//  Morning Ritual

export function MorningRitual({ tasks, onClose }: { tasks: Task[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [picked, setPicked] = useState<string[]>([]);

  const saveMut = useMutation({
    mutationFn: () => setMorningIntents(picked),
    onSuccess: () => {
      confetti({
        particleCount: 90,
        spread: 60,
        origin: { y: 0.5 },
        // eslint-disable-next-line no-restricted-syntax
        colors: ["#C89A3E", "#FFD54F"],
      });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["today-log"] });
      whisper({
        monsterName: "Dawn Herald",
        line: "Three Directives. Today has shape.",
        tone: "calm",
      });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = (id: string) => {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id]));
  };

  const candidates = tasks.filter((t) => !t.completed || t.type === "habit");
  const delays = stagger(Math.min(8, candidates.length), 0.04);

  return (
    <ResponsiveDialog
      open={true}
      onOpenChange={(open) => !open && onClose()}
      title="Morning Ritual"
    >
      <Glyph emoji="🌅" />
      <Sub>
        Pick today's <strong style={{ color: "var(--gold-bright)" }}>3 Sacred Directives</strong>.
        They earn 1.5x rewards and unlock a Reflection Pull tonight if all three are completed.
      </Sub>

      <div
        className="max-h-[300px] overflow-y-auto rounded-xl p-2 my-4 space-y-1"
        style={{ background: "rgba(0,0,0,0.32)" }}
      >
        {candidates.length === 0 ? (
          <p className="text-center py-8 text-xs" style={{ color: "var(--ink-tertiary)" }}>
            Forge a directive first, then return.
          </p>
        ) : (
          candidates.map((t, i) => {
            const isPicked = picked.includes(t.id);
            return (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: dur.fast,
                  ease: ease.out,
                  delay: delays[Math.min(i, delays.length - 1)],
                }}
                whileTap={{ scale: 0.985 }}
                onClick={() => toggle(t.id)}
                disabled={!isPicked && picked.length >= 3}
                className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-40"
                style={{
                  background: isPicked ? "rgba(255,213,79,0.13)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isPicked ? "rgba(255,213,79,0.45)" : "rgba(255,255,255,0.06)"}`,
                  color: "var(--ink-primary)",
                }}
              >
                <span className="mr-2">{isPicked ? "*" : "o"}</span>
                <span>{t.title}</span>
                <span
                  className="text-[10px] ml-2 uppercase tracking-wider"
                  style={{ color: "var(--ink-tertiary)" }}
                >
                  {t.type}
                </span>
              </motion.button>
            );
          })
        )}
      </div>

      <Actions>
        <SpringyButton
          onClick={onClose}
          className="flex-1 py-2.5 rounded-lg text-xs uppercase tracking-[0.18em] font-bold"
          style={{
            background: "rgba(255,255,255,0.04)",
            color: "var(--ink-secondary)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          Skip Today
        </SpringyButton>
        <SpringyButton
          onClick={() => saveMut.mutate()}
          disabled={picked.length === 0 || saveMut.isPending}
          className="flex-[2] py-2.5 rounded-lg text-xs uppercase tracking-[0.18em] font-bold disabled:opacity-40"
          style={{
            background:
              picked.length > 0
                ? "linear-gradient(135deg,var(--gold-glow),var(--gold-bright))"
                : "rgba(255,255,255,0.05)",
            color: picked.length > 0 ? "var(--bg-deep)" : "var(--ink-tertiary)",
            boxShadow: picked.length > 0 ? "0 4px 20px rgba(255,213,79,0.28)" : "none",
          }}
        >
          {saveMut.isPending ? (
            "Setting"
          ) : (
            <>
              Set <NumberFlow value={picked.length} />
              /3
            </>
          )}
        </SpringyButton>
      </Actions>
    </ResponsiveDialog>
  );
}

//  Evening Reflection

export function EveningRitual({ tasks, onClose }: { tasks: Task[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [wentWell, setWentWell] = useState("");
  const [didntGo, setDidntGo] = useState("");
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [anchor, setAnchor] = useState<string>("");

  const submitMut = useMutation({
    mutationFn: () =>
      submitEveningReflection({
        went_well: wentWell.trim(),
        didnt_go: didntGo.trim(),
        mood,
        energy,
        tomorrow_anchor_task_id: anchor || null,
      }),
    onSuccess: (res) => {
      if (res.rewards.reflectionPull) {
        confetti({
          particleCount: 180,
          spread: 90,
          origin: { y: 0.5 },
          // eslint-disable-next-line no-restricted-syntax
          colors: ["#C89A3E", "#FFD54F", "#7F77DD"],
        });
        whisper({
          monsterName: "Reflection Spirit",
          line: "The Altar opens for you tonight.",
          tone: "grave",
        });
      }
      if (res.rewards.tomeShard) {
        whisper({
          monsterName: "Vault Keeper",
          line: "A Tome Shard fell from the sky.",
          tone: "grave",
        });
      }
      toast(`<Icon name="evening" size={14} /> Ritual streak: ${res.rewards.ritualStreak}`);
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["today-log"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <ResponsiveDialog
      open={true}
      onOpenChange={(open) => !open && onClose()}
      title="Evening Reflection"
    >
      <Glyph emoji="🌙" />
      <Sub>Two lines, two sliders, one anchor. Ninety seconds.</Sub>

      <div className="space-y-3 mt-4">
        <Field label="What went well?">
          <textarea
            value={wentWell}
            onChange={(e) => setWentWell(e.target.value)}
            placeholder="One sentence."
            rows={2}
            maxLength={200}
            className="ss-input resize-none"
          />
        </Field>

        <Field label="What didn't go well?">
          <textarea
            value={didntGo}
            onChange={(e) => setDidntGo(e.target.value)}
            placeholder="One sentence."
            rows={2}
            maxLength={200}
            className="ss-input resize-none"
          />
        </Field>

        <Slider label="Mood" emoji={["1", "2", "3", "4", "5"]} value={mood} onChange={setMood} />
        <Slider
          label="Energy"
          emoji={["o", "o", "o", "!", "!"]}
          value={energy}
          onChange={setEnergy}
        />

        <Field label="Tomorrow's anchor (optional)">
          <select value={anchor} onChange={(e) => setAnchor(e.target.value)} className="ss-input">
            <option value="">- none -</option>
            {tasks
              .filter((t) => !t.completed || t.type === "habit")
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
          </select>
        </Field>
      </div>

      <Actions>
        <SpringyButton
          onClick={onClose}
          className="flex-1 py-2.5 rounded-lg text-xs uppercase tracking-[0.18em] font-bold"
          style={{
            background: "rgba(255,255,255,0.04)",
            color: "var(--ink-secondary)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          Later
        </SpringyButton>
        <SpringyButton
          onClick={() => submitMut.mutate()}
          disabled={submitMut.isPending}
          className="flex-[2] py-2.5 rounded-lg text-xs uppercase tracking-[0.18em] font-bold disabled:opacity-40"
          style={{
            background: "linear-gradient(135deg,var(--violet),var(--violet-light))",
            color: "var(--bg-deep)",
            boxShadow: "0 4px 20px rgba(127,119,221,0.32)",
          }}
        >
          {submitMut.isPending ? "Reflecting" : "Sleep Well"}
        </SpringyButton>
      </Actions>
    </ResponsiveDialog>
  );
}

//  Shared atoms

function Glyph({ emoji }: { emoji: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: dur.measured, ease: ease.weighty }}
      className="text-4xl text-center mb-2"
    >
      {emoji}
    </motion.div>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-center mb-2" style={{ color: "var(--ink-secondary)" }}>
      {children}
    </p>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div
        className="text-[10px] uppercase tracking-[0.18em] mb-1 font-semibold"
        style={{ color: "var(--ink-secondary)" }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}

function Slider({
  label,
  emoji,
  value,
  onChange,
}: {
  label: string;
  emoji: string[];
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-end mb-1">
        <span
          className="text-[10px] uppercase tracking-[0.18em] font-semibold"
          style={{ color: "var(--ink-secondary)" }}
        >
          {label}
        </span>
        <motion.span
          key={value}
          initial={{ scale: 0.7, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={trans.springy}
          className="text-lg"
        >
          {emoji[value - 1]}
        </motion.span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((v) => (
          <motion.button
            key={v}
            onClick={() => onChange(v)}
            whileTap={{ scale: 0.92 }}
            transition={trans.springy}
            className="flex-1 h-9 rounded-md text-xs font-bold"
            style={{
              background:
                v <= value
                  ? "linear-gradient(135deg,var(--violet),var(--violet-light))"
                  : "rgba(255,255,255,0.05)",
              color: v <= value ? "var(--bg-deep)" : "var(--ink-tertiary)",
            }}
          >
            {v}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function Actions({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2 mt-5">{children}</div>;
}

type SpringyButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
const SpringyButton = forwardRef<HTMLButtonElement, SpringyButtonProps>(
  function SpringyButton(props, ref) {
    const rm = reducedMotion();
    return (
      <motion.button
        ref={ref}
        whileTap={rm ? undefined : { scale: 0.97 }}
        whileHover={rm ? undefined : { y: -1 }}
        transition={trans.springy}
        {...(props as React.ComponentProps<typeof motion.button>)}
      />
    );
  },
);
