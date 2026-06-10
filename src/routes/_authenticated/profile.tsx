import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/game/AppShell";
import { getMyProfile } from "@/lib/game/profile.functions";
import { getFullProfile, getAllAchievements, changeClass } from "@/lib/game/profile.extended.functions";
import { listEquipment, equipItem } from "@/lib/game/shop.functions";
import { xpToNextLevel } from "@/lib/game/constants";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — SummonScroll" }] }),
  component: ProfilePage,
});

const CLASS_INFO: Record<string, { icon: string; label: string; desc: string; color: string }> = {
  warrior: { icon: "⚔", label: "Warrior", desc: "+STR, +crit damage, moderate risk/reward", color: "#E05252" },
  mage:    { icon: "🔮", label: "Mage", desc: "+INT, +XP, +mana regen, high risk", color: "#4FC3F7" },
  healer:  { icon: "💚", label: "Healer", desc: "+CON, -damage taken, can heal party", color: "#5FAD41" },
  rogue:   { icon: "🗡", label: "Rogue", desc: "+PER, +gold, +drop chance, dodge", color: "#CE93D8" },
};

type Tab = "stats" | "equipment" | "achievements" | "inventory";

function ProfilePage() {
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const fetchFull = useServerFn(getFullProfile);
  const fetchEquipment = useServerFn(listEquipment);
  const fetchAchievements = useServerFn(getAllAchievements);
  const doChangeClass = useServerFn(changeClass);
  const doEquip = useServerFn(equipItem);

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const fullQ = useQuery({ queryKey: ["full-profile"], queryFn: () => fetchFull() });
  const equipQ = useQuery({ queryKey: ["my-equipment"], queryFn: () => fetchEquipment() });
  const achieveQ = useQuery({ queryKey: ["achievements"], queryFn: () => fetchAchievements() });

  const [tab, setTab] = useState<Tab>("stats");
  const [showClassPicker, setShowClassPicker] = useState(false);

  const classMut = useMutation({
    mutationFn: (c: "warrior" | "mage" | "rogue" | "healer") => doChangeClass({ data: { newClass: c } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); qc.invalidateQueries({ queryKey: ["full-profile"] }); setShowClassPicker(false); toast.success("Class changed!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const equipMut = useMutation({
    mutationFn: (ueId: string) => doEquip({ data: { userEquipmentId: ueId } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); qc.invalidateQueries({ queryKey: ["full-profile"] }); qc.invalidateQueries({ queryKey: ["my-equipment"] }); toast.success("Equipped!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (profileQ.isLoading) return <div className="min-h-screen grid place-items-center" style={{ background: "#0C0E14", color: "#A09D96" }}>Loading…</div>;
  if (!profileQ.data) return null;

  const profile = profileQ.data.profile;
  const full = fullQ.data;
  const xpReq = xpToNextLevel(profile.level);
  const xpPct = Math.min(100, (profile.xp / xpReq) * 100);
  const hpPct = Math.min(100, (profile.hp / profile.max_hp) * 100);
  const classInfo = CLASS_INFO[profile.class] ?? { icon: "👤", label: "None", desc: "Choose a class at Level 10", color: "#A09D96" };

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
              <h1 className="text-2xl font-bold" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>{profile.display_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm" style={{ color: classInfo.color }}>{classInfo.icon} {classInfo.label}</span>
                <span className="text-xs" style={{ color: "#6B6864" }}>Level {profile.level}</span>
                {profile.level >= 10 && (
                  <button onClick={() => setShowClassPicker(true)} className="text-[10px] px-2 py-0.5 rounded"
                    style={{ color: "#A09D96", background: "rgba(255,255,255,0.05)" }}>Change</button>
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

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[["STR", profile.str_stat ?? 0], ["INT", profile.int_stat ?? 0], ["CON", profile.con_stat ?? 0], ["PER", profile.per_stat ?? 0]].map(([l, v]) => (
              <div key={l as string} className="text-center rounded-md p-2" style={{ background: "rgba(0,0,0,0.3)" }}>
                <div className="text-[10px] uppercase" style={{ color: "#6B6864" }}>{l}</div>
                <div className="text-lg font-bold" style={{ color: "#FFD54F", fontFamily: "'JetBrains Mono',monospace" }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Quick stats */}
          <div className="flex gap-4 mt-4 text-xs" style={{ color: "#A09D96" }}>
            <span>🐾 {full?.stats?.monstersCollected ?? 0} monsters</span>
            <span>⚔ {full?.stats?.battlesWon ?? 0} victories</span>
            <span>🔥 {profile.streak} streak</span>
            <span>💀 {profile.deaths} deaths</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {([["stats", "Stats"], ["equipment", "Equipment"], ["achievements", "Achievements"], ["inventory", "Inventory"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className="pb-2 text-sm font-semibold"
              style={{ color: tab === k ? "#FFD54F" : "#A09D96", borderBottom: `2px solid ${tab === k ? "#FFD54F" : "transparent"}` }}>{l}</button>
          ))}
        </div>

        {/* Equipment tab */}
        {tab === "equipment" && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold" style={{ color: "#F0EDE6", fontFamily: "'Cinzel',serif" }}>Your Equipment</h2>
            {(equipQ.data?.equipment ?? []).length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: "#6B6864" }}>No equipment yet. Visit the Shop!</p>
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
            {(achieveQ.data?.achievements ?? []).map((a: any) => (
              <div key={a.id} className="rounded-lg p-4 text-center border"
                style={{ background: "#13161F", borderColor: a.unlocked ? "#FFD54F" : "rgba(255,255,255,0.05)", opacity: a.unlocked ? 1 : 0.4 }}>
                <div className="text-3xl mb-2">{a.unlocked ? a.icon : "🔒"}</div>
                <p className="text-xs font-bold" style={{ color: a.unlocked ? "#F0EDE6" : "#6B6864", fontFamily: "'Cinzel',serif" }}>{a.name}</p>
                <p className="text-[10px] mt-1" style={{ color: "#6B6864" }}>{a.description}</p>
                {a.reward_gems > 0 && <p className="text-[10px] mt-1" style={{ color: "#FFD54F" }}>+{a.reward_gems}💎</p>}
              </div>
            ))}
          </div>
        )}

        {/* Inventory tab */}
        {tab === "inventory" && (
          <div className="space-y-3">
            {(full?.inventory ?? []).length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: "#6B6864" }}>Inventory empty. Complete tasks to earn drops!</p>
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
                <h3 className="text-lg font-bold mt-6 mb-3" style={{ color: "#F0EDE6", fontFamily: "'Cinzel',serif" }}>Pets & Mounts</h3>
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
          <div className="rounded-xl p-6 border" style={{ background: "#13161F", borderColor: "rgba(255,255,255,0.07)" }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "#F0EDE6", fontFamily: "'Cinzel',serif" }}>Class Details</h2>
            <p className="text-sm mb-2" style={{ color: "#A09D96" }}>{classInfo.desc}</p>
            <p className="text-xs" style={{ color: "#6B6864" }}>
              {profile.class !== "none"
                ? "Equipment matching your class gets a 50% stat bonus!"
                : "Choose a class at Level 10 to unlock class bonuses and skills."}
            </p>
          </div>
        )}
      </div>

      {/* Class picker modal */}
      {showClassPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }} onClick={() => setShowClassPicker(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-xl p-6 border" style={{ background: "#1A1E2A", borderColor: "rgba(255,213,79,0.2)" }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>Choose Your Class</h2>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(CLASS_INFO) as Array<[string, typeof CLASS_INFO[string]]>).map(([key, info]) => (
                <button key={key} onClick={() => classMut.mutate(key as "warrior" | "mage" | "rogue" | "healer")}
                  disabled={classMut.isPending}
                  className="rounded-lg p-4 text-center border transition-all hover:scale-[1.03] disabled:opacity-40"
                  style={{ background: "#13161F", borderColor: profile.class === key ? info.color : "rgba(255,255,255,0.07)" }}>
                  <div className="text-3xl mb-2">{info.icon}</div>
                  <p className="font-bold text-sm" style={{ color: info.color }}>{info.label}</p>
                  <p className="text-[10px] mt-1" style={{ color: "#A09D96" }}>{info.desc}</p>
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
        <span style={{ color, fontFamily: "'JetBrains Mono',monospace" }}>{current}/{max}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: gradient ? "linear-gradient(90deg,#C89A3E,#FFD54F)" : color }} />
      </div>
    </div>
  );
}
