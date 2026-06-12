import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/game/AppShell";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { getMyProfile, getFullProfile, getAllAchievements, changeClass, listEquipment, equipItem } from "@/lib/game/supabase-api";
import { xpToNextLevel } from "@/lib/game/constants";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

const CLASS_INFO: Record<string, { icon: string; label: string; desc: string; color: string }> = {
  warrior: { icon: "battle", label: "Warrior", desc: "+STR, +crit damage, moderate risk/reward", color: "var(--danger)" },
  mage:    { icon: "summon", label: "Mage", desc: "+INT, +XP, +mana regen, high risk", color: "var(--cyan)" },
  healer:  { icon: "hp",     label: "Healer", desc: "+CON, -damage taken, can heal party", color: "var(--success)" },
  rogue:   { icon: "crown",  label: "Rogue", desc: "+PER, +gold, +drop chance, dodge", color: "var(--violet)" },
};

type Tab = "stats" | "equipment" | "achievements" | "inventory";

function ProfilePage() {
  const qc = useQueryClient();

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const fullQ = useQuery({ queryKey: ["full-profile"], queryFn: getFullProfile });
  const equipQ = useQuery({ queryKey: ["my-equipment"], queryFn: listEquipment });
  const achieveQ = useQuery({ queryKey: ["achievements"], queryFn: getAllAchievements });

  const [tab, setTab] = useState<Tab>("stats");
  const [showClassPicker, setShowClassPicker] = useState(false);

  const classMut = useMutation({
    mutationFn: (c: "warrior" | "mage" | "rogue" | "healer") => changeClass(c),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); qc.invalidateQueries({ queryKey: ["full-profile"] }); setShowClassPicker(false); toast.success("Class changed!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const equipMut = useMutation({
    mutationFn: (ueId: string) => equipItem(ueId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); qc.invalidateQueries({ queryKey: ["full-profile"] }); qc.invalidateQueries({ queryKey: ["my-equipment"] }); toast.success("Equipped!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("profiles").update(patch).eq("id", user!.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
    }
  });

  const heatmapQ = useQuery({ queryKey: ["heatmap"], queryFn: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const { data } = await supabase.from("task_events")
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
  } });

  if (profileQ.isLoading) return <div className="min-h-screen grid place-items-center" style={{ background: "#0C0E14", color: "#A09D96" }}>Loading…</div>;
  if (!profileQ.data) return null;

  const profile = profileQ.data.profile;
  const full = fullQ.data;
  const xpReq = xpToNextLevel(profile.level);
  const xpPct = Math.min(100, (profile.xp / xpReq) * 100);
  const hpPct = Math.min(100, (profile.hp / profile.max_hp) * 100);
  const classInfo = CLASS_INFO[profile.class] ?? { icon: "sparkle", label: "None", desc: "Choose a class at Level 10", color: "var(--ink-secondary)" };

  const lastClassChange = full?.profile?.last_class_change;
  let cooldownDays = 0;
  if (lastClassChange && profile.class !== "none") {
    const diff = (new Date().getTime() - new Date(lastClassChange).getTime()) / (1000 * 3600 * 24);
    if (diff < 7) cooldownDays = Math.ceil(7 - diff);
  }

  return (
    <AppShell profile={profile}>
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        {/* Hero section */}
        <div className="rounded-xl p-6 mb-6 border" style={{ background: "#13161F", borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full grid place-items-center text-2xl font-bold"
              style={{ background: "linear-gradient(135deg,#C89A3E,#FFD54F)", color: "#0C0E14" }}>
              {profile.display_name[0].toUpperCase()}
            </div>
            <div>
              <h1 className="t-h1 text-2xl" style={{ color: "var(--gold-bright)" }}>{profile.display_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm flex items-center gap-1" style={{ color: classInfo.color }}><Icon name={classInfo.icon as any} size={14} color={classInfo.color} /> {classInfo.label}</span>
                <span className="t-label" style={{ color: "var(--ink-tertiary)" }}>Level {profile.level}</span>
                {profile.level >= 10 && (
                  <button onClick={() => setShowClassPicker(true)} className="ss-btn ss-btn-ghost text-[10px] px-2 py-0.5">Change</button>
                )}
              </div>
            </div>
          </div>

          {/* Bars */}
          <div className="space-y-2">
            <Bar label="HP" current={profile.hp} max={profile.max_hp} pct={hpPct}
              color={profile.hp <= 10 ? "#E05252" : profile.hp <= 25 ? "#FFB74D" : "#5FAD41"} />
            <Bar label="XP" current={profile.xp} max={xpReq} pct={xpPct} color="#FFD54F" gradient />
            <Bar label="MP" current={profile.mp ?? 30} max={profile.max_mp ?? 30}
              pct={Math.min(100, ((profile.mp ?? 30) / (profile.max_mp ?? 30)) * 100)} color="#7F77DD" />
          </div>

          {/* Stats — using stat-color language */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {([
              ["STR", "str", profile.str_stat ?? 0],
              ["INT", "int", profile.int_stat ?? 0],
              ["CON", "con", profile.con_stat ?? 0],
              ["PER", "per", profile.per_stat ?? 0],
            ] as const).map(([label, stat, v]) => (
              <div
                key={label}
                className="text-center rounded-md p-2"
                style={{
                  background: `rgba(var(--ss-stat-${stat}-rgb),0.06)`,
                  border: `1px solid rgba(var(--ss-stat-${stat}-rgb),0.18)`,
                }}
              >
                <div
                  className="text-[10px] uppercase tracking-[0.18em] font-semibold"
                  style={{ color: `var(--ss-stat-${stat})` }}
                >
                  {label}
                </div>
                <div
                  className="t-mono-lg font-bold"
                  style={{ color: `var(--ss-stat-${stat})` }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>

          {/* Quick stats */}
          <div className="flex gap-4 mt-4 text-xs" style={{ color: "var(--ink-secondary)" }}>
            <span className="flex items-center gap-1"><Icon name="sparkle" size={12} /> {full?.stats?.monstersCollected ?? 0} monsters</span>
            <span className="flex items-center gap-1"><Icon name="battle" size={12} /> {full?.stats?.battlesWon ?? 0} victories</span>
            <span className="flex items-center gap-1"><Icon name="streak" size={12} color="var(--ember)" /> {profile.streak} streak</span>
            <span className="flex items-center gap-1"><Icon name="death" size={12} color="var(--danger)" /> {profile.deaths} deaths</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="bg-[#13161F] border rounded-xl p-4 md:p-6" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <h3 className="t-h2 font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "var(--ink-primary)" }}>
                <span className="material-symbols-outlined text-[#FFD54F]">psychiatry</span>
                Talents
              </h3>
              <div className="text-sm text-[#A09D96] mb-4">
                You earn 1 Talent Point every 5 levels. Points available: <strong className="text-white">{Math.max(0, Math.floor(profile.level / 5) - Object.values(profile.talents as Record<string, number> ?? {}).reduce((a,b) => a+b, 0))}</strong>
              </div>
              <div className="space-y-4">
                {[
                  { id: "greed", name: "Greed", desc: "+5% Gold from tasks per rank", max: 5 },
                  { id: "scholar", name: "Scholar", desc: "+5% XP from tasks per rank", max: 5 },
                  { id: "resilience", name: "Resilience", desc: "-10% HP loss from missed dailies", max: 3 },
                  { id: "collector", name: "Collector", desc: "+5% Drop Chance", max: 3 },
                ].map(t => {
                  const currentRank = (profile.talents as Record<string, number>)?.[t.id] ?? 0;
                  const ptsAvail = Math.floor(profile.level / 5) - Object.values(profile.talents as Record<string, number> ?? {}).reduce((a,b) => a+b, 0);
                  const canUpgrade = ptsAvail > 0 && currentRank < t.max;
                  return (
                    <div key={t.id} className="flex justify-between items-center p-3 rounded-lg bg-[#0C0E14] border border-white/5">
                      <div>
                        <div className="font-bold text-sm text-[#F0EDE6]">{t.name} <span className="text-xs font-normal text-[#A09D96]">({currentRank}/{t.max})</span></div>
                        <div className="text-xs text-[#A09D96]">{t.desc}</div>
                      </div>
                      <button 
                        onClick={() => updateMut.mutate({ talents: { ...(profile.talents as any), [t.id]: currentRank + 1 } })}
                        disabled={!canUpgrade || updateMut.isPending}
                        className="px-3 py-1 rounded text-xs font-bold transition-all disabled:opacity-50"
                        style={{ background: canUpgrade ? "#C89A3E" : "#333", color: canUpgrade ? "#0C0E14" : "#A09D96" }}
                      >
                        +
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          {([["stats", "Stats"], ["equipment", "Equipment"], ["achievements", "Achievements"], ["inventory", "Inventory"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className="pb-2 text-sm font-semibold"
              style={{ color: tab === k ? "#FFD54F" : "#A09D96", borderBottom: `2px solid ${tab === k ? "#FFD54F" : "transparent"}` }}>{l}</button>
          ))}
        </div>

        {/* Equipment tab */}
        {tab === "equipment" && (
          <div className="space-y-3">
            <h2 className="t-h2 text-lg font-bold" style={{ color: "var(--ink-primary)" }}>Your Equipment</h2>
            {(equipQ.data?.equipment ?? []).length === 0 ? (
              <EmptyState
                icon="stone"
                title="You stand unarmored."
                body="The Bazaar and the Forge both make gear. The Forge is cheaper."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(equipQ.data?.equipment ?? []).map((ue: any) => (
                  <div key={ue.id} className="flex items-center justify-between p-3 rounded-lg border"
                    style={{ background: "#13161F", borderColor: ue.is_equipped ? "#FFD54F" : "rgba(255,255,255,0.05)" }}>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "#F0EDE6" }}>{ue.equipment.name}</p>
                      <p className="text-[10px]" style={{ color: "#6B6864" }}>
                        {ue.equipment.slot} · {ue.equipment.rarity}
                        {ue.equipment.str_bonus > 0 && ` · +${ue.equipment.str_bonus} STR`}
                        {ue.equipment.int_bonus > 0 && ` · +${ue.equipment.int_bonus} INT`}
                        {ue.equipment.con_bonus > 0 && ` · +${ue.equipment.con_bonus} CON`}
                        {ue.equipment.per_bonus > 0 && ` · +${ue.equipment.per_bonus} PER`}
                      </p>
                    </div>
                    {ue.is_equipped ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,213,79,0.2)", color: "#FFD54F" }}>Equipped</span>
                    ) : (
                      <button onClick={() => equipMut.mutate(ue.id)} className="text-[10px] px-2 py-1 rounded font-bold"
                        style={{ background: "rgba(255,213,79,0.1)", color: "#FFD54F" }}>Equip</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Achievements tab */}
        {tab === "achievements" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(achieveQ.data?.achievements ?? []).map((a: { id: string; name: string; description: string; icon: string; unlocked: boolean; reward_crystals: number }) => (
              <div key={a.id} className="ss-card rounded-lg p-4 text-center"
                style={{ borderColor: a.unlocked ? "var(--gold-bright)" : undefined, opacity: a.unlocked ? 1 : 0.4 }}>
                <div className="text-3xl mb-2 flex justify-center">{a.unlocked ? a.icon : <Icon name="close" size={24} color="var(--ink-tertiary)" />}</div>
                <p className="text-xs font-bold" style={{ color: a.unlocked ? "var(--ink-primary)" : "var(--ink-tertiary)" }}>{a.name}</p>
                <p className="text-[10px] mt-1" style={{ color: "var(--ink-tertiary)" }}>{a.description}</p>
                {a.reward_crystals > 0 && <p className="text-[10px] mt-1 flex items-center justify-center gap-0.5" style={{ color: "var(--cyan)" }}><Icon name="crystal" size={10} color="var(--cyan)" />+{a.reward_crystals}</p>}
              </div>
            ))}
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
                {(full?.inventory ?? []).map((inv: any) => (
                  <div key={inv.id} className="rounded-lg p-3 text-center border" style={{ background: "#13161F", borderColor: "rgba(255,255,255,0.05)" }}>
                    <div className="text-2xl mb-1">{inv.item_type === "egg" ? "🥚" : inv.item_type === "realm_potion" ? "🧪" : inv.item_type === "food" ? "🍖" : "📦"}</div>
                    <p className="text-xs font-bold" style={{ color: "#F0EDE6" }}>{inv.item_name}</p>
                    <p className="text-[10px]" style={{ color: "#A09D96" }}>×{inv.quantity}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Pets */}
            {(full?.pets ?? []).length > 0 && (
              <div>
                <h3 className="t-h2 text-lg font-bold mt-6 mb-3" style={{ color: "var(--ink-primary)" }}>Pets &amp; Mounts</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {(full?.pets ?? []).map((pet: any) => (
                    <div key={pet.id} className="rounded-lg p-3 text-center border" style={{ background: "#13161F", borderColor: "rgba(255,255,255,0.05)" }}>
                      <div className="text-2xl mb-1">{pet.is_mount ? "🐴" : "🐾"}</div>
                      <p className="text-xs font-bold" style={{ color: "#F0EDE6" }}>{pet.pet_name}</p>
                      <p className="text-[10px]" style={{ color: "#A09D96" }}>{pet.is_mount ? "Mount" : `Pet · Fed ${pet.food_fed}/50`}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats tab (default) */}
        {tab === "stats" && (
          <>
            <div className="ss-card mb-4">
              <h2 className="text-lg font-bold mb-4" style={{ color: "var(--ink-primary)" }}>Class Details</h2>
              <p className="text-sm mb-2" style={{ color: "var(--ink-secondary)" }}>{classInfo.desc}</p>
              <p className="text-xs" style={{ color: "var(--ink-tertiary)" }}>
                {profile.class !== "none"
                  ? "Equipment matching your class gets a 50% stat bonus!"
                  : "Choose a class at Level 10 to unlock class bonuses and skills."}
              </p>
            </div>
            
            {/* Heatmap */}
            <div className="ss-card">
              <h3 className="font-bold text-sm mb-4" style={{ color: "var(--ink-secondary)" }}>30-Day Activity</h3>
              <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar">
                {Array.from({ length: 30 }).map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (29 - i));
                  const ds = d.toISOString().slice(0, 10);
                  const c = heatmapQ.data?.[ds] ?? 0;
                  const color = c === 0 ? "rgba(255,255,255,0.06)" : c < 3 ? "rgba(93,211,158,0.5)" : c < 6 ? "var(--success)" : "var(--gold-bright)";
                  return <div key={i} className="w-4 h-4 rounded-sm flex-shrink-0" style={{ background: color }} title={`${ds}: ${c} tasks`} />;
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Class picker modal */}
      {showClassPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 ss-modal-backdrop" onClick={() => setShowClassPicker(false)}>
          <div onClick={(e) => e.stopPropagation()} className="ss-modal">
            <h2 className="text-xl font-bold mb-1" style={{ color: "var(--gold-bright)" }}>Choose Your Class</h2>
            {profile.class !== "none" ? (
              cooldownDays > 0 ? (
                <p className="text-xs mb-4" style={{ color: "var(--danger)" }}>Class change is on cooldown for {cooldownDays} more day(s).</p>
              ) : (
              <p className="text-xs mb-4" style={{ color: "var(--ink-secondary)" }}>Changing class costs <span className="inline-flex items-center gap-0.5" style={{ color: "var(--gold-bright)" }}>500<Icon name="crystal" size={11} color="var(--cyan)" /></span> and has a 7-day cooldown.</p>
              )
            ) : (
              <p className="text-xs mb-4" style={{ color: "var(--success)" }}>Your first class choice is free!</p>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(CLASS_INFO) as Array<[string, typeof CLASS_INFO[string]]>).map(([key, info]) => (
                <button key={key} onClick={() => classMut.mutate(key as "warrior" | "mage" | "rogue" | "healer")}
                  disabled={classMut.isPending || profile.class === key || cooldownDays > 0}
                  className="ss-card rounded-lg p-4 text-center transition-all hover:scale-[1.03] disabled:opacity-40"
                  style={{ borderColor: profile.class === key ? info.color : undefined }}>
                  <div className="mb-2 flex justify-center"><Icon name={info.icon as any} size={28} color={info.color} /></div>
                  <p className="font-bold text-sm" style={{ color: info.color }}>{info.label}</p>
                  <p className="text-[10px] mt-1" style={{ color: "var(--ink-secondary)" }}>{info.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Bar({ label, current, max, pct, color, gradient }: { label: string; current: number; max: number; pct: number; color: string; gradient?: boolean }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "#A09D96" }}>
        <span>{label}</span>
        <span className="t-mono" style={{ color }}>{current}/{max}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: gradient ? "linear-gradient(90deg,#C89A3E,#FFD54F)" : color }} />
      </div>
    </div>
  );
}
