import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/game/AppShell";
import { AtmosphereBackdrop } from "@/components/game/AtmosphereBackdrop";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  getMyProfile,
  getFullProfile,
  getAllAchievements,
  changeClass,
  listMyMonsters,
  bindCompanion,
} from "@/lib/game/supabase-api";
import { xpToNextLevel } from "@/lib/game/constants";
import { LoadingScreen } from "@/components/game/LoadingScreen";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

const CLASS_INFO: Record<string, { icon: string; label: string; desc: string; color: string }> = {
  warrior: {
    icon: "battle",
    label: "Warrior",
    desc: "+STR, +crit damage, moderate risk/reward",
    color: "var(--danger)",
  },
  mage: {
    icon: "summon",
    label: "Mage",
    desc: "+INT, +XP, +mana regen, high risk",
    color: "var(--gold-bright)",
  },
  healer: {
    icon: "hp",
    label: "Healer",
    desc: "+CON, -damage taken, can heal party",
    color: "var(--success)",
  },
  rogue: {
    icon: "crown",
    label: "Rogue",
    desc: "+PER, +gold, +drop chance, dodge",
    color: "var(--violet)",
  },
};

type Tab = "stats" | "equipment" | "achievements" | "inventory";

function ProfilePage() {
  const qc = useQueryClient();

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const fullQ = useQuery({ queryKey: ["full-profile"], queryFn: getFullProfile });
  const monstersQ = useQuery({ queryKey: ["my-monsters"], queryFn: listMyMonsters });
  const achieveQ = useQuery({ queryKey: ["achievements"], queryFn: getAllAchievements });

  const [tab, setTab] = useState<Tab>("stats");
  const [showClassPicker, setShowClassPicker] = useState(false);

  const classMut = useMutation({
    mutationFn: (c: "warrior" | "mage" | "rogue" | "healer") => changeClass(c),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["full-profile"] });
      setShowClassPicker(false);
      toast.success("Class changed!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const equipMut = useMutation({
    mutationFn: async ({
      slot,
      monsterId,
    }: {
      slot: "weapon" | "armor" | "mount";
      monsterId: string | null;
    }) => {
      await bindCompanion(slot, monsterId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["my-monsters"] });
      toast.success("Soul bond updated!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase
        .from("profiles")
        .update(patch as never)
        .eq("id", user!.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
    },
  });

  const heatmapQ = useQuery({
    queryKey: ["heatmap"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const d = new Date();
      d.setDate(d.getDate() - 30);
      const { data } = await supabase
        .from("task_events")
        .select("created_at")
        .eq("user_id", user!.id)
        .in("kind", ["plus", "complete"])
        .gte("created_at", d.toISOString());
      const counts: Record<string, number> = {};
      for (const e of data ?? []) {
        const dateStr = e.created_at.slice(0, 10);
        counts[dateStr] = (counts[dateStr] ?? 0) + 1;
      }
      return counts;
    },
  });

  if (profileQ.isLoading) return <LoadingScreen realmSlug="ancient-vaults" />;
  if (!profileQ.data) return null;

  const profile = profileQ.data.profile;
  const full = fullQ.data;
  const xpReq = xpToNextLevel(profile.level);
  const xpPct = Math.min(100, (profile.xp / xpReq) * 100);
  const hpPct = Math.min(100, (profile.hp / profile.max_hp) * 100);
  const classInfo = CLASS_INFO[profile.class] ?? {
    icon: "sparkle",
    label: "None",
    desc: "Choose a class at Level 10",
    color: "var(--ink-secondary)",
  };

  const lastClassChange = full?.profile?.last_class_change;
  let cooldownDays = 0;
  if (lastClassChange && profile.class !== "none") {
    const diff = (new Date().getTime() - new Date(lastClassChange).getTime()) / (1000 * 3600 * 24);
    if (diff < 7) cooldownDays = Math.ceil(7 - diff);
  }

  return (
    <AppShell profile={profile}>
      <AtmosphereBackdrop realm="dark" />
      <div className="bg-[var(--bg-stage)] bg-[var(--bg-stage)]-hub relative min-h-screen">
        <div className="p-6 md:p-10 max-w-6xl">
          {/* Hero section */}
          <div className="game-panel p-5 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full grid place-items-center text-2xl font-bold ss-btn-d-primary">
                {profile.display_name[0].toUpperCase()}
              </div>
              <div>
                <h1 className="t-h1 text-2xl" style={{ color: "var(--gold-bright)" }}>
                  {profile.display_name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-sm flex items-center gap-1"
                    style={{ color: classInfo.color }}
                  >
                    <Icon
                      name={classInfo.icon as React.ComponentProps<typeof Icon>["name"]}
                      size={14}
                      color={classInfo.color}
                    />{" "}
                    {classInfo.label}
                  </span>
                  <span className="t-label" style={{ color: "var(--ink-secondary)" }}>
                    Level {profile.level}
                  </span>
                  {profile.level >= 10 && (
                    <button
                      onClick={() => setShowClassPicker(true)}
                      className="ss-btn ss-btn-ghost text-[10px] px-2 py-0.5"
                    >
                      Change
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bars */}
            <div className="space-y-2">
              <Bar
                label="HP"
                current={profile.hp}
                max={profile.max_hp}
                pct={hpPct}
                color={
                  profile.hp <= 10
                    ? "var(--danger)"
                    : profile.hp <= 25
                      ? "var(--gold-bright)"
                      : "var(--success)"
                }
              />
              <Bar
                label="XP"
                current={profile.xp}
                max={xpReq}
                pct={xpPct}
                color="var(--gold-bright)"
                gradient
              />
              <Bar
                label="MP"
                current={profile.mp ?? 30}
                max={profile.max_mp ?? 30}
                pct={Math.min(100, ((profile.mp ?? 30) / (profile.max_mp ?? 30)) * 100)}
                color="var(--violet)"
              />
            </div>

            {/* Stats — using stat-color language */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              {(
                [
                  ["STR", "str", profile.str_stat ?? 0],
                  ["INT", "int", profile.int_stat ?? 0],
                  ["CON", "con", profile.con_stat ?? 0],
                  ["PER", "per", profile.per_stat ?? 0],
                ] as const
              ).map(([label, stat, v]) => (
                <div
                  key={label}
                  className="text-center rounded-md p-2 ss-pane"
                  style={{
                    border: `1px solid rgba(var(--ss-stat-${stat}-rgb),0.18)`,
                  }}
                >
                  <div
                    className="text-[10px] uppercase tracking-[0.18em] font-semibold"
                    style={{ color: `var(--ss-stat-${stat})` }}
                  >
                    {label}
                  </div>
                  <div className="font-serif-lg font-bold" style={{ color: `var(--ss-stat-${stat})` }}>
                    {v}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick stats */}
            <div className="flex gap-4 mt-4 text-xs" style={{ color: "var(--ink-secondary)" }}>
              <span className="flex items-center gap-1">
                <Icon name="sparkle" size={12} /> {full?.stats?.monstersCollected ?? 0} monsters
              </span>
              <span className="flex items-center gap-1">
                <Icon name="battle" size={12} /> {full?.stats?.battlesWon ?? 0} victories
              </span>
              <span className="flex items-center gap-1">
                <Icon name="streak" size={12} color="var(--ember)" /> {profile.streak} streak
              </span>
              <span className="flex items-center gap-1">
                <Icon name="death" size={12} color="var(--danger)" /> {profile.deaths} deaths
              </span>
            </div>

            <VoidFrontierSeal streak={profile.streak} />
          </div>

          {/* Tabs */}
          <div
            className="flex gap-2 mb-6 border-b"
            style={{ borderColor: "rgba(61,46,31,0.08)" }}
          >
            {(
              [
                ["stats", "Stats"],
                ["companion-loadout", "Soul Loadout"],
                ["achievements", "Achievements"],
                ["inventory", "Inventory"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k as Tab)}
                className={`ss-tab-d pb-2 text-sm font-semibold capitalize ${tab === k ? "active" : ""}`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Companion Loadout */}
          {tab === ("companion-loadout" as Tab) && (
            <div className="space-y-6">
              <div className="ss-card p-4 bg-gradient-to-r from-[rgba(138,43,226,0.2)] to-transparent border-l-4 border-[var(--primary)]">
                <div className="flex justify-between items-center mb-2">
                  <h2
                    className="t-h2 text-lg font-bold flex items-center gap-2"
                    style={{ color: "var(--ink-primary)" }}
                  >
                    <Icon
                      name="sparkle"
                      size={20}
                      color="rgb(138,43,226)"
                      className="drop-shadow-[0_0_10px_rgb(138,43,226)]"
                    />
                    Soul Load
                  </h2>
                  <div
                    className="text-xl font-bold font-serif"
                    style={{
                      color: "var(--accent-void)",
                      textShadow: "0 0 10px var(--accent-void)",
                    }}
                  >
                    {profile.soul_load_current ?? 0}{" "}
                    <span className="text-sm" style={{ color: "var(--ink-secondary)" }}>
                      / {profile.soul_load_max ?? 10}
                    </span>
                  </div>
                </div>
                <p className="text-xs" style={{ color: "var(--ink-secondary)" }}>
                  Equip companions directly to your soul. Higher star ratings require more Soul Load
                  capacity.
                </p>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full overflow-hidden bg-[var(--bg-stage)]/50 mt-4 border border-[rgba(61,46,31,0.1)]">
                  <div
                    className="h-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(100, ((profile.soul_load_current ?? 0) / (profile.soul_load_max ?? 10)) * 100)}%`,
                      background: "var(--accent-void)",
                      boxShadow: "0 0 10px var(--accent-void)",
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["weapon", "armor", "mount"] as const).map((slot) => {
                  const equippedId = profile[`equip_${slot}_id`];
                  const equippedMonster = monstersQ.data?.userMonsters.find(
                    (m: { id: string }) => m.id === equippedId,
                  );

                  return (
                    <div
                      key={slot}
                      className="ss-card p-4 flex flex-col items-center justify-center relative overflow-hidden group"
                    >
                      <div
                        className="absolute top-2 left-2 text-[10px] uppercase font-bold tracking-widest"
                        style={{ color: "var(--ink-secondary)" }}
                      >
                        {slot}
                      </div>

                      {equippedMonster ? (
                        <>
                          <img
                            src={
                              equippedMonster.monster.art_url
                                ? equippedMonster.monster.art_url
                                : `/sprites/monsters/placeholder.png`
                            }
                            alt={equippedMonster.monster.name}
                            className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] my-2"
                          />
                          <p className="text-sm font-bold" style={{ color: "var(--ink-primary)" }}>
                            {equippedMonster.monster.name}
                          </p>
                          <p className="text-[10px] mb-3" style={{ color: "var(--ink-secondary)" }}>
                            Load: {equippedMonster.star_rating ?? 1}
                          </p>

                          <button
                            onClick={() => equipMut.mutate({ slot, monsterId: null })}
                            disabled={equipMut.isPending}
                            className="ss-btn w-full py-1 text-xs uppercase opacity-0 group-hover:opacity-100 transition-opacity bg-red-900/50 border-red-500/50 hover:bg-red-900"
                          >
                            Unbind
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-20 h-20 border-2 border-dashed border-[var(--ink-secondary)]/20 rounded-full flex items-center justify-center my-2 bg-[var(--bg-stage)]/40">
                            <Icon
                              name={
                                slot === "weapon" ? "swords" : slot === "armor" ? "shield" : "paw"
                              }
                              size={24}
                              color="var(--ink-secondary)"
                            />
                          </div>
                          <p
                            className="text-[10px] text-center max-w-[150px] mb-3"
                            style={{ color: "var(--ink-secondary)" }}
                          >
                            No soul bound.
                          </p>

                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                equipMut.mutate({ slot, monsterId: e.target.value });
                              }
                            }}
                            className="ss-btn w-full py-1 text-xs bg-[var(--bg-stage)]/80 border-[var(--ink-secondary)]/20 text-[var(--ink-secondary)]"
                            value=""
                          >
                            <option value="" disabled>
                              Bind Companion...
                            </option>
                            {monstersQ.data?.userMonsters
                              .filter(
                                (m: { id: string }) =>
                                  m.id !== profile.equip_weapon_id &&
                                  m.id !== profile.equip_armor_id &&
                                  m.id !== profile.equip_mount_id,
                              )
                              .map(
                                (m: {
                                  id: string;
                                  monster: { name: string };
                                  star_rating?: number;
                                }) => (
                                  <option key={m.id} value={m.id}>
                                    {m.monster.name} (Load: {m.star_rating ?? 1})
                                  </option>
                                ),
                              )}
                          </select>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Achievements tab */}
          {tab === "achievements" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(achieveQ.data?.achievements ?? []).map(
                (a: {
                  id: string;
                  name: string;
                  description: string;
                  icon: string;
                  unlocked: boolean;
                  reward_crystals: number;
                }) => (
                  <div
                    key={a.id}
                    className="ss-card rounded-lg p-4 text-center"
                    style={{
                      borderColor: a.unlocked ? "var(--gold-bright)" : undefined,
                      opacity: a.unlocked ? 1 : 0.4,
                    }}
                  >
                    <div className="text-3xl mb-2 flex justify-center">
                      {a.unlocked ? (
                        a.icon
                      ) : (
                        <Icon name="close" size={24} color="var(--ink-secondary)" />
                      )}
                    </div>
                    <p
                      className="text-xs font-bold"
                      style={{ color: a.unlocked ? "var(--ink-primary)" : "var(--ink-secondary)" }}
                    >
                      {a.name}
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: "var(--ink-secondary)" }}>
                      {a.description}
                    </p>
                    {a.reward_crystals > 0 && (
                      <p
                        className="text-[10px] mt-1 flex items-center justify-center gap-0.5"
                        style={{ color: "var(--gold-bright)" }}
                      >
                        <Icon name="crystal" size={10} color="var(--gold-bright)" />+{a.reward_crystals}
                      </p>
                    )}
                  </div>
                ),
              )}
            </div>
          )}

          {/* Inventory tab */}
          {tab === "inventory" && (
            <div className="space-y-3">
              {(full?.inventory ?? []).length === 0 ? (
                <EmptyState
                  icon="sparkle"
                  title="Your satchel is empty."
                  body="Tasks drop materials, eggs, food, and rarities. Keep moving."
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {(full?.inventory ?? []).map(
                    (inv: {
                      id: string;
                      item_type: string;
                      item_name: string;
                      quantity: number;
                    }) => (
                      <div key={inv.id} className="ss-card p-3 text-center">
                        <div className="mb-2 flex justify-center">
                          <Icon
                            name={
                              inv.item_type === "egg"
                                ? "egg"
                                : inv.item_type === "realm_potion"
                                  ? "potion"
                                  : inv.item_type === "food"
                                    ? "food"
                                    : "stone"
                            }
                            size={28}
                            color={
                              inv.item_type === "egg"
                                ? "var(--gold-bright)"
                                : inv.item_type === "realm_potion"
                                  ? "var(--violet)"
                                  : inv.item_type === "food"
                                    ? "var(--ember)"
                                    : "var(--ink-secondary)"
                            }
                            className="lucide-glow"
                          />
                        </div>
                        <p className="text-xs font-bold" style={{ color: "var(--ink-primary)" }}>
                          {inv.item_name}
                        </p>
                        <p className="text-[10px]" style={{ color: "var(--ink-secondary)" }}>
                          ×{inv.quantity}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              )}

              {/* Pets */}
              {(full?.pets ?? []).length > 0 && (
                <div>
                  <h3
                    className="t-h2 text-lg font-bold mt-6 mb-3"
                    style={{ color: "var(--ink-primary)" }}
                  >
                    Pets &amp; Mounts
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {(full?.pets ?? []).map(
                      (pet: {
                        id: string;
                        is_mount: boolean;
                        pet_name: string;
                        food_fed: number;
                      }) => (
                        <div key={pet.id} className="ss-card p-3 text-center">
                          <div className="mb-2 flex justify-center">
                            <Icon
                              name={pet.is_mount ? "mount" : "pet"}
                              size={28}
                              color={pet.is_mount ? "var(--gold-bright)" : "var(--gold-bright)"}
                              className="lucide-glow"
                            />
                          </div>
                          <p className="text-xs font-bold" style={{ color: "var(--ink-primary)" }}>
                            {pet.pet_name}
                          </p>
                          <p className="text-[10px]" style={{ color: "var(--ink-secondary)" }}>
                            {pet.is_mount ? "Mount" : `Pet · Fed ${pet.food_fed}/50`}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stats tab (default) */}
          {tab === "stats" && (
            <div className="space-y-4">
              {/* Talents */}
              <div className="ss-card">
                <h3
                  className="t-h2 font-bold text-lg mb-3 flex items-center gap-2"
                  style={{ color: "var(--ink-primary)" }}
                >
                  Talents
                </h3>
                <div className="text-sm mb-4" style={{ color: "var(--ink-secondary)" }}>
                  You earn 1 Talent Point every 5 levels. Points available:{" "}
                  <strong className="text-[var(--ink-secondary)]">
                    {Math.max(
                      0,
                      Math.floor(profile.level / 5) -
                        Object.values((profile.talents as Record<string, number>) ?? {}).reduce(
                          (a, b) => a + b,
                          0,
                        ),
                    )}
                  </strong>
                </div>
                <div className="space-y-3">
                  {[
                    { id: "greed", name: "Greed", desc: "+5% Gold from tasks per rank", max: 5 },
                    { id: "scholar", name: "Scholar", desc: "+5% XP from tasks per rank", max: 5 },
                    {
                      id: "resilience",
                      name: "Resilience",
                      desc: "-10% HP loss from missed dailies",
                      max: 3,
                    },
                    { id: "collector", name: "Collector", desc: "+5% Drop Chance", max: 3 },
                  ].map((t) => {
                    const currentRank = (profile.talents as Record<string, number>)?.[t.id] ?? 0;
                    const ptsAvail =
                      Math.floor(profile.level / 5) -
                      Object.values((profile.talents as Record<string, number>) ?? {}).reduce(
                        (a, b) => a + b,
                        0,
                      );
                    const canUpgrade = ptsAvail > 0 && currentRank < t.max;
                    return (
                      <div
                        key={t.id}
                        className="flex justify-between items-center p-3 rounded-lg ss-pane border border-[var(--ink-secondary)]/5"
                      >
                        <div>
                          <div className="font-bold text-sm text-[var(--ink-primary)]">
                            {t.name}{" "}
                            <span className="text-xs font-normal text-[var(--ink-secondary)]">
                              ({currentRank}/{t.max})
                            </span>
                          </div>
                          <div className="text-xs text-[var(--ink-secondary)]">{t.desc}</div>
                        </div>
                        <button
                          onClick={() =>
                            updateMut.mutate({
                              talents: {
                                ...(profile.talents as Record<string, number>),
                                [t.id]: currentRank + 1,
                              },
                            })
                          }
                          disabled={!canUpgrade || updateMut.isPending}
                          className="px-3 py-1 rounded text-xs font-bold transition-all disabled:opacity-50 ss-btn ss-btn-d-primary"
                        >
                          +
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="ss-card">
                <h2 className="text-lg font-bold mb-4" style={{ color: "var(--ink-primary)" }}>
                  Class Details
                </h2>
                <p className="text-sm mb-2" style={{ color: "var(--ink-secondary)" }}>
                  {classInfo.desc}
                </p>
                <p className="text-xs" style={{ color: "var(--ink-secondary)" }}>
                  {profile.class !== "none"
                    ? "Equipment matching your class gets a 50% stat bonus!"
                    : "Choose a class at Level 10 to unlock class bonuses and skills."}
                </p>
              </div>

              {/* Heatmap */}
              <div className="ss-card">
                <h3 className="font-bold text-sm mb-4" style={{ color: "var(--ink-secondary)" }}>
                  30-Day Activity
                </h3>
                <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (29 - i));
                    const ds = d.toISOString().slice(0, 10);
                    const c = heatmapQ.data?.[ds] ?? 0;
                    const color =
                      c === 0
                        ? "rgba(61,46,31,0.06)"
                        : c < 3
                          ? "rgba(93,211,158,0.5)"
                          : c < 6
                            ? "var(--success)"
                            : "var(--gold-bright)";
                    return (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-sm flex-shrink-0"
                        style={{ background: color }}
                        title={`${ds}: ${c} tasks`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Class picker modal */}
      {showClassPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 ss-modal-backdrop"
          onClick={() => setShowClassPicker(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="ss-modal">
            <h2 className="text-xl font-bold mb-1" style={{ color: "var(--gold-bright)" }}>
              Choose Your Class
            </h2>
            {profile.class !== "none" ? (
              cooldownDays > 0 ? (
                <p className="text-xs mb-4" style={{ color: "var(--danger)" }}>
                  Class change is on cooldown for {cooldownDays} more day(s).
                </p>
              ) : (
                <p className="text-xs mb-4" style={{ color: "var(--ink-secondary)" }}>
                  Changing class costs{" "}
                  <span
                    className="inline-flex items-center gap-0.5"
                    style={{ color: "var(--gold-bright)" }}
                  >
                    500
                    <Icon name="crystal" size={11} color="var(--gold-bright)" />
                  </span>{" "}
                  and has a 7-day cooldown.
                </p>
              )
            ) : (
              <p className="text-xs mb-4" style={{ color: "var(--success)" }}>
                Your first class choice is free!
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(CLASS_INFO) as Array<[string, (typeof CLASS_INFO)[string]]>).map(
                ([key, info]) => (
                  <button
                    key={key}
                    onClick={() => classMut.mutate(key as "warrior" | "mage" | "rogue" | "healer")}
                    disabled={classMut.isPending || profile.class === key || cooldownDays > 0}
                    className="ss-card rounded-lg p-4 text-center transition-all hover:scale-[1.03] disabled:opacity-40"
                    style={{ borderColor: profile.class === key ? info.color : undefined }}
                  >
                    <div className="mb-2 flex justify-center">
                      <Icon
                        name={info.icon as React.ComponentProps<typeof Icon>["name"]}
                        size={28}
                        color={info.color}
                      />
                    </div>
                    <p className="font-bold text-sm" style={{ color: info.color }}>
                      {info.label}
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: "var(--ink-secondary)" }}>
                      {info.desc}
                    </p>
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Bar({
  label,
  current,
  max,
  pct,
  color,
  gradient,
}: {
  label: string;
  current: number;
  max: number;
  pct: number;
  color: string;
  gradient?: boolean;
}) {
  return (
    <div>
      <div
        className="flex justify-between text-[10px] uppercase tracking-wider mb-0.5"
        style={{ color: "var(--ink-secondary)" }}
      >
        <span>{label}</span>
        <span className="font-serif" style={{ color }}>
          {current}/{max}
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: "rgba(61,46,31,0.06)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: gradient
              ? "linear-gradient(90deg,var(--gold-bright),var(--gold-bright))"
              : color,
          }}
        />
      </div>
    </div>
  );
}

function VoidFrontierSeal({ streak }: { streak: number }) {
  const goal = 30;
  const pct = Math.min(100, (streak / goal) * 100);
  let message = "The Void watches. Begin your journey.";
  if (streak > 0) message = "A single step into the dark.";
  if (streak >= 7) message = "You have survived the first week.";
  if (streak >= 14) message = "The shadows part before you.";
  if (streak >= 21) message = "Almost at the edge of the world.";
  if (streak >= 30) message = "You bear the Void Frontier Seal.";

  return (
    <div
      className="ss-card mt-4"
      style={{
        borderColor: streak >= 30 ? "var(--violet)" : undefined,
        boxShadow: streak >= 30 ? "0 0 16px rgba(163, 116, 255, 0.2)" : undefined,
      }}
    >
      <h3
        className="font-bold text-sm mb-1 flex justify-between"
        style={{ color: "var(--violet)" }}
      >
        <span>Void Frontier Seal</span>
        <span className="font-serif">
          {streak}/{goal} Days
        </span>
      </h3>
      <p className="text-xs mb-3" style={{ color: "var(--ink-secondary)" }}>
        {message}
      </p>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: "rgba(61,46,31,0.06)" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: "var(--violet)" }}
        />
      </div>
    </div>
  );
}
