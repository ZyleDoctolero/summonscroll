import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { forwardRef, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { AppShell } from "@/components/game/AppShell";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";
import { whisper } from "@/components/game/WhisperFeed";
import { trans, ease, dur, reducedMotion, stagger } from "@/lib/ui/motion-tokens";
import { sounds } from "@/lib/ui/sounds";
import {
  getMyProfile,
  listMyMonsters,
  runTrial,
  getTrialCooldown,
  listMemorial,
} from "@/lib/game/supabase-api";

export const Route = createFileRoute("/_authenticated/trial")({
  component: TrialPage,
});

function TrialPage() {
  const qc = useQueryClient();
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const monstersQ = useQuery({ queryKey: ["my-monsters"], queryFn: listMyMonsters });
  const cooldownQ = useQuery({ queryKey: ["trial-cooldown"], queryFn: getTrialCooldown });
  const memorialQ = useQuery({ queryKey: ["memorial"], queryFn: listMemorial });

  const [picked, setPicked] = useState<string[]>([]);
  const [tab, setTab] = useState<"trial" | "memorial">("trial");
  const [confirming, setConfirming] = useState(false);
  const [results, setResults] = useState<Awaited<ReturnType<typeof runTrial>> | null>(null);

  const runMut = useMutation({
    mutationFn: () => runTrial(picked),
    onSuccess: (res) => {
      if (res.fullClear) {
        sounds.ascend();
        confetti({ particleCount: 300, spread: 100, colors: ["#ffd95c", "#a374ff", "#5ae0ff"] });
        whisper({
          monsterName: "Trial Keeper",
          line: "All five returned. The Echo is touched.",
          tone: "grave",
        });
      } else if (res.fallen.length > 0) {
        sounds.toll();
      } else {
        sounds.bell();
      }
      for (const f of res.fallen) {
        whisper({ monsterName: f.name, line: "I will remember the road.", tone: "grave" });
      }
      setResults(res);
      setConfirming(false);
      setPicked([]);
      qc.invalidateQueries({ queryKey: ["my-monsters"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["trial-cooldown"] });
      qc.invalidateQueries({ queryKey: ["memorial"] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setConfirming(false);
    },
  });

  if (profileQ.isLoading || monstersQ.isLoading) {
    return (
      <div
        className="min-h-screen grid place-items-center"
        style={{ color: "var(--ink-secondary)" }}
      >
        Echoes gather…
      </div>
    );
  }
  if (!profileQ.data) return null;

  const roster = (monstersQ.data?.userMonsters ?? []) as Array<{
    id: string;
    monster: { name: string; role: string; rarity: string; art_url?: string | null };
    level: number;
    bond_percent: number;
    star_level: number;
  }>;

  return (
    <AppShell profile={profileQ.data.profile}>
      <div className="bg-atmos bg-atmos-trial p-6 md:p-10 max-w-4xl mx-auto min-h-screen">
        <h1 className="t-h1 text-3xl font-bold mb-1" style={{ color: "var(--danger)" }}>
          Trial of Echoes
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--ink-secondary)" }}>
          20 procedural floors. <b style={{ color: "var(--danger)" }}>Permadeath</b>. Pick 5 souls.
          Bring them home or honor them in the Memorial.
        </p>

        <div className="flex gap-6 mb-6 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {[
            { key: "trial" as const, label: "Enter Trial" },
            { key: "memorial" as const, label: "Memorial" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`ss-tab-d pb-2 text-sm font-semibold capitalize ${tab === t.key ? "active" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "trial" && (
          <>
            {/* Cooldown banner */}
            {cooldownQ.data && !cooldownQ.data.canStart && (
              <div
                className="ss-card mb-4 flex items-center gap-2"
                style={{ background: "rgba(255,94,94,0.08)", borderColor: "rgba(255,94,94,0.3)" }}
              >
                <Icon name="evening" size={14} color="var(--danger)" />
                <p className="text-sm" style={{ color: "var(--danger)" }}>
                  Cooldown: {cooldownQ.data.daysRemaining} day
                  {cooldownQ.data.daysRemaining === 1 ? "" : "s"} until next trial.
                </p>
              </div>
            )}

            {/* Picked slots */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Array.from({ length: 5 }, (_, i) => {
                const id = picked[i];
                const um = id ? roster.find((r) => r.id === id) : null;
                if (um) {
                  return (
                    <div
                      key={i}
                      className="ss-card rounded-md p-2 text-center"
                      style={{ borderColor: "var(--danger)" }}
                    >
                      <div className="aspect-square mb-1 grid place-items-center overflow-hidden ss-pane rounded">
                        <img
                          src={
                            um.monster.art_url
                              ? um.monster.art_url
                              : `/sprites/monsters/${um.monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
                          }
                          className="w-full h-full object-cover"
                          alt={um.monster.name}
                          onError={(e) => {
                            e.currentTarget.src = "/monsters/placeholder.png";
                          }}
                        />
                      </div>
                      <p
                        className="text-[10px] font-bold truncate"
                        style={{ color: "var(--ink-primary)" }}
                      >
                        {um.monster.name}
                      </p>
                      <p
                        className="text-[9px] flex items-center justify-center gap-0.5"
                        style={{ color: "var(--danger)" }}
                      >
                        <span>{um.star_level}</span>
                        <Icon name="star" size={9} className="fill-current" />
                      </p>
                    </div>
                  );
                }
                return (
                  <div
                    key={i}
                    className="ss-card rounded-md p-2 text-center border-2 border-dashed"
                    style={{ borderColor: "var(--ss-border)" }}
                  >
                    <div
                      className="aspect-square grid place-items-center"
                      style={{ color: "var(--ink-tertiary)" }}
                    >
                      ?
                    </div>
                    <p className="text-[9px] mt-1" style={{ color: "var(--ink-tertiary)" }}>
                      Slot {i + 1}
                    </p>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setConfirming(true)}
              disabled={picked.length !== 5 || !cooldownQ.data?.canStart || runMut.isPending}
              className="ss-btn w-full disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg,#5a1818,var(--danger))",
                color: "var(--ink-primary)",
                boxShadow: "0 0 24px rgba(255,94,94,0.4)",
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <Icon name="death" size={16} /> Enter the Trial ({picked.length}/5)
              </span>
            </button>

            {/* Roster */}
            <h2 className="text-sm font-bold mt-8 mb-3" style={{ color: "var(--ink-secondary)" }}>
              Choose your 5
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {roster.map((um) => {
                const isPicked = picked.includes(um.id);
                return (
                  <button
                    key={um.id}
                    onClick={() => {
                      if (isPicked) setPicked(picked.filter((p) => p !== um.id));
                      else if (picked.length < 5) setPicked([...picked, um.id]);
                    }}
                    className="ss-card rounded p-2 text-center transition-all"
                    style={{
                      background: isPicked ? "rgba(255,94,94,0.1)" : undefined,
                      borderColor: isPicked ? "var(--danger)" : undefined,
                    }}
                  >
                    <div className="aspect-square grid place-items-center mb-1 overflow-hidden ss-pane rounded">
                      <img
                        src={
                          um.monster.art_url
                            ? um.monster.art_url
                            : `/sprites/monsters/${um.monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.png`
                        }
                        className="w-full h-full object-cover"
                        alt={um.monster.name}
                        onError={(e) => {
                          e.currentTarget.src = "/monsters/placeholder.png";
                        }}
                      />
                    </div>
                    <p
                      className="text-[10px] font-bold truncate"
                      style={{ color: "var(--ink-primary)" }}
                    >
                      {um.monster.name}
                    </p>
                    <p
                      className="text-[9px] flex items-center justify-center gap-1"
                      style={{ color: "var(--ink-secondary)" }}
                    >
                      <span className="flex items-center gap-0.5">
                        {um.star_level}
                        <Icon name="star" size={9} className="fill-current" />
                      </span>
                      <span>·</span>
                      <span>{Math.round(um.bond_percent)}%</span>
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {tab === "memorial" && <Memorial memorials={memorialQ.data?.memorials ?? []} />}

        {/* Confirm modal */}
        <ResponsiveDialog
          open={confirming}
          onOpenChange={(open) => !open && setConfirming(false)}
          title="The Trial is Final"
        >
          <p className="text-sm text-center mb-5" style={{ color: "var(--ink-secondary)" }}>
            Once you enter, any monster that falls is{" "}
            <b style={{ color: "var(--danger)" }}>gone forever</b>. They will be honored in the
            Memorial. Continue?
          </p>
          <div className="flex gap-2">
            <SpringyButton
              onClick={() => setConfirming(false)}
              className="ss-btn ss-btn-secondary flex-1 py-2.5 font-bold"
            >
              Stay Home
            </SpringyButton>
            <SpringyButton
              onClick={() => runMut.mutate()}
              disabled={runMut.isPending}
              className="flex-[2] py-2.5 rounded-lg text-xs uppercase tracking-[0.18em] font-bold disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg,#5a1818,var(--danger))",
                color: "var(--ink-primary)",
                boxShadow: "0 4px 20px rgba(255,94,94,0.35)",
              }}
            >
              {runMut.isPending ? "Echoes…" : "We Walk Together"}
            </SpringyButton>
          </div>
        </ResponsiveDialog>

        {/* Results modal */}
        <ResponsiveDialog open={!!results} onOpenChange={(open) => !open && setResults(null)}>
          {results && (
            <>
              <motion.h2
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: dur.measured, ease: ease.weighty }}
                className="text-2xl font-bold mb-1 text-center"
                style={{
                  color: results.fullClear
                    ? "var(--gold-bright)"
                    : results.fallen.length === 0
                      ? "var(--success)"
                      : "var(--danger)",
                  letterSpacing: "0.04em",
                }}
              >
                {results.fullClear ? (
                  <span className="flex items-center justify-center gap-2">
                    <Icon name="crown" size={24} color="var(--gold-bright)" /> Full Clear
                  </span>
                ) : results.fallen.length === 0 ? (
                  <span className="flex items-center justify-center gap-2">
                    <Icon name="check" size={24} color="var(--success)" /> Returned Intact
                  </span>
                ) : (
                  "Floor "
                )}
                {!results.fullClear && results.fallen.length > 0 && (
                  <NumberFlow value={results.floorsCleared} />
                )}
                {!results.fullClear && results.fallen.length > 0 && " reached"}
              </motion.h2>
              {results.echoTouched && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...trans.cascadeIn, delay: 0.2 }}
                  className="text-center text-xs mb-4"
                  style={{ color: "var(--gold-bright)" }}
                >
                  <span className="flex items-center justify-center gap-1">
                    <Icon name="sparkle" size={12} color="var(--gold-bright)" /> Echo-Touched
                    bestowed.
                  </span>
                </motion.p>
              )}

              {results.fallen.length > 0 && (
                <div className="ss-pane my-4" style={{ borderColor: "rgba(255,94,94,0.32)" }}>
                  <p
                    className="text-[10px] uppercase tracking-[0.18em] mb-2"
                    style={{ color: "var(--ink-secondary)" }}
                  >
                    Fallen
                  </p>
                  {results.fallen.map((f, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: dur.fast,
                        ease: ease.out,
                        delay: stagger(results.fallen.length, 0.12, 0.1)[i],
                      }}
                      className="text-sm flex items-center gap-1.5"
                      style={{ color: "var(--ink-primary)" }}
                    >
                      <Icon name="death" size={13} color="var(--danger)" />
                      <span>
                        <b style={{ color: "var(--danger)" }}>{f.name}</b> — {f.star_level}
                        <Icon name="star" size={9} className="fill-current inline-block ml-0.5" /> ·
                        bond {Math.round(f.bond_percent)}%
                      </span>
                    </motion.p>
                  ))}
                </div>
              )}

              {results.rewards.length > 0 && (
                <div
                  className="ss-card mb-4"
                  style={{
                    background: "rgba(255,213,79,0.06)",
                    borderColor: "rgba(255,213,79,0.22)",
                  }}
                >
                  <p
                    className="text-[10px] uppercase tracking-[0.18em] mb-2"
                    style={{ color: "var(--gold-bright)" }}
                  >
                    Rewards
                  </p>
                  {results.rewards.map((r, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: dur.fast, ease: ease.out, delay: 0.25 + i * 0.08 }}
                      className="text-sm"
                      style={{ color: "var(--gold-bright)" }}
                    >
                      +<NumberFlow value={r.qty} /> {r.name}
                    </motion.p>
                  ))}
                </div>
              )}

              <SpringyButton
                onClick={() => setResults(null)}
                className="w-full py-2.5 ss-btn ss-btn-d-primary"
              >
                Continue
              </SpringyButton>
            </>
          )}
        </ResponsiveDialog>
      </div>
    </AppShell>
  );
}

function Memorial({
  memorials,
}: {
  memorials: Array<{
    id: string;
    fallen: Array<{ name: string; star_level: number; bond_percent: number }>;
    floors_cleared: number;
    full_clear: boolean;
    created_at: string;
  }>;
}) {
  const allFallen = memorials.flatMap((m) =>
    m.fallen.map((f) => ({ ...f, when: m.created_at, floor: m.floors_cleared })),
  );
  if (allFallen.length === 0) {
    return (
      <EmptyState icon="memorial" title="No name has been carved." body="May the wall stay bare." />
    );
  }
  return (
    <div>
      <p className="text-xs mb-4" style={{ color: "var(--ink-secondary)" }}>
        {allFallen.length} souls honored across {memorials.length} trial
        {memorials.length === 1 ? "" : "s"}.
      </p>
      <div className="space-y-2">
        {allFallen.map((f, i) => (
          <div
            key={i}
            className="ss-card flex items-start gap-3"
            style={{ borderColor: "rgba(255,94,94,0.2)" }}
          >
            <div className="text-2xl">
              <Icon name="death" size={20} color="var(--danger)" />
            </div>
            <div className="flex-1">
              <p className="t-h3 text-sm" style={{ color: "var(--danger)" }}>
                {f.name}
              </p>
              <p
                className="text-[10px] flex items-center gap-1.5"
                style={{ color: "var(--ink-secondary)" }}
              >
                <span>Fell on floor {f.floor + 1}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  {f.star_level}
                  <Icon name="star" size={9} className="fill-current" />
                </span>
                <span>·</span>
                <span>bond {Math.round(f.bond_percent)}%</span>
              </p>
              <p className="text-[10px] mt-1" style={{ color: "var(--ink-tertiary)" }}>
                {new Date(f.when).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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
