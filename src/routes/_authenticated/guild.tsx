import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/game/AppShell";
import { getMyProfile, getMyGuild, listGuilds, createGuild, joinGuild, leaveGuild, listQuestTemplates, startQuest, getAvailableScrolls } from "@/lib/game/supabase-api";

const SCROLL_MAPPING: Record<string, string> = {
  "Shadow Drake Hunt": "Shadow Drake Scroll",
  "Tiamat's Wrath": "Tiamat Scroll",
  "Lich King's Return": "Lich King Scroll",
  "Dragon Scale Gathering": "Dragon Scale Scroll",
  "Void Essence Hunt": "Void Essence Scroll",
};

export const Route = createFileRoute("/_authenticated/guild")({
  component: GuildPage,
});

function GuildPage() {
  const qc = useQueryClient();

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const guildQ = useQuery({ queryKey: ["my-guild"], queryFn: getMyGuild });
  const guildsQ = useQuery({ queryKey: ["all-guilds"], queryFn: listGuilds });
  const templatesQ = useQuery({ queryKey: ["quest-templates"], queryFn: listQuestTemplates });
  const scrollsQ = useQuery({ queryKey: ["my-scrolls"], queryFn: getAvailableScrolls });

  const [tab, setTab] = useState<"guild" | "browse" | "create">("guild");
  const [guildName, setGuildName] = useState("");
  const [guildDesc, setGuildDesc] = useState("");

  const createMut = useMutation({
    mutationFn: () => createGuild(guildName, guildDesc),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-guild"] }); qc.invalidateQueries({ queryKey: ["profile"] }); toast.success("Guild created!"); setTab("guild"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const joinMut = useMutation({
    mutationFn: (guildId: string) => joinGuild(guildId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-guild"] }); toast.success("Joined!"); setTab("guild"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const leaveMut = useMutation({
    mutationFn: () => leaveGuild(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-guild"] }); toast("Left guild."); },
    onError: (e: Error) => toast.error(e.message),
  });

  const questMut = useMutation({
    mutationFn: (v: { templateId: string; scrollName: string }) => startQuest(v.templateId, v.scrollName),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-guild"] }); qc.invalidateQueries({ queryKey: ["my-scrolls"] }); toast.success("Quest started!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (profileQ.isLoading) return <div className="min-h-screen grid place-items-center" style={{ background: "#0C0E14", color: "#A09D96" }}>Loading…</div>;
  if (!profileQ.data) return null;

  const profile = profileQ.data.profile;
  const myGuild = guildQ.data?.guild;
  const members = guildQ.data?.members ?? [];
  const activeQuest = guildQ.data?.quest;

  return (
    <AppShell profile={profile}>
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-1" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>Guild</h1>
        <p className="text-sm mb-6" style={{ color: "#A09D96" }}>
          {myGuild ? `Member of ${myGuild.name}` : "Join a guild to fight bosses cooperatively!"}
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {([["guild", "My Guild"], ["browse", "Browse"], ["create", "Create"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className="pb-2 text-sm font-semibold"
              style={{ color: tab === k ? "#FFD54F" : "#A09D96", borderBottom: `2px solid ${tab === k ? "#FFD54F" : "transparent"}` }}>{l}</button>
          ))}
        </div>

        {/* My Guild */}
        {tab === "guild" && !myGuild && (
          <div className="text-center py-16 rounded-xl border-2 border-dashed" style={{ borderColor: "rgba(255,255,255,0.08)", color: "#A09D96" }}>
            <p className="text-4xl mb-2">🍺</p>
            <p className="text-lg mb-1" style={{ fontFamily: "'Cinzel',serif" }}>No guild yet</p>
            <p className="text-sm mb-4">Find your Vanguard.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setTab("browse")} className="px-4 py-2 rounded text-xs uppercase font-bold"
                style={{ background: "rgba(255,255,255,0.05)", color: "#A09D96" }}>Browse Guilds</button>
              <button onClick={() => setTab("create")} className="px-4 py-2 rounded text-xs uppercase font-bold"
                style={{ background: "linear-gradient(135deg,#C89A3E,#FFD54F)", color: "#0C0E14" }}>Create Guild</button>
            </div>
          </div>
        )}

        {tab === "guild" && myGuild && (
          <div className="space-y-6">
            {/* Guild info */}
            <div className="rounded-xl p-6 border" style={{ background: "#13161F", borderColor: "rgba(255,255,255,0.07)" }}>
              <h2 className="text-xl font-bold mb-1" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>{myGuild.name}</h2>
              <p className="text-sm mb-3" style={{ color: "#A09D96" }}>{myGuild.description || "No description."}</p>
              <div className="flex gap-4 text-xs" style={{ color: "#6B6864" }}>
                <span>Level {myGuild.level}</span>
                <span>{members.length} members</span>
                <span>Privacy: {myGuild.privacy}</span>
              </div>
            </div>

            {/* Active Quest */}
            {activeQuest ? (
              <div className="rounded-xl p-6 border" style={{ background: "#13161F", borderColor: "rgba(255,213,79,0.2)" }}>
                <h3 className="text-lg font-bold mb-2" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>
                  Active Quest: {activeQuest.quest_template?.name}
                </h3>
                {activeQuest.boss_hp_remaining != null && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1" style={{ color: "#A09D96" }}>
                      <span>Boss HP</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>{activeQuest.boss_hp_remaining.toLocaleString()} / {activeQuest.quest_template?.boss_hp?.toLocaleString()}</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full" style={{ width: `${(activeQuest.boss_hp_remaining / (activeQuest.quest_template?.boss_hp ?? 1)) * 100}%`, background: "#E05252" }} />
                    </div>
                  </div>
                )}
                <p className="text-xs" style={{ color: "#A09D96" }}>Complete your tasks to deal damage to the boss! Missing dailies lets the boss attack your party.</p>
              </div>
            ) : (
              <div className="rounded-xl p-6 border" style={{ background: "#13161F", borderColor: "rgba(255,255,255,0.07)" }}>
                <h3 className="text-lg font-bold mb-3" style={{ color: "#F0EDE6", fontFamily: "'Cinzel',serif" }}>Start a Quest</h3>
                <div className="space-y-2">
                  {(templatesQ.data?.templates ?? []).map((t: { id: string; name: string; quest_type: string; boss_hp: number | null; difficulty: string; description: string }) => {
                    const requiredScroll = SCROLL_MAPPING[t.name] ?? t.name + " Scroll";
                    const hasScroll = (scrollsQ.data?.scrolls ?? []).some((s: { item_name: string }) => s.item_name === requiredScroll);
                    return (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-md" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div>
                        <p className="text-sm font-bold" style={{ color: "#F0EDE6" }}>{t.name}</p>
                        <p className="text-xs" style={{ color: "#6B6864" }}>{t.quest_type === "boss" ? `Boss · HP ${t.boss_hp?.toLocaleString()}` : "Collection"} · {t.difficulty}</p>
                        <p className="text-[10px] mt-1 font-semibold" style={{ color: hasScroll ? "#5FAD41" : "#E05252" }}>
                          {hasScroll ? `✓ You have a ${requiredScroll}` : `Requires ${requiredScroll} (Buy in Shop)`}
                        </p>
                      </div>
                      <button onClick={() => questMut.mutate({ templateId: t.id, scrollName: requiredScroll })} disabled={!hasScroll || questMut.isPending}
                        className="px-3 py-1.5 rounded text-xs font-bold uppercase disabled:opacity-40"
                        style={{ background: hasScroll ? "linear-gradient(135deg,#C89A3E,#FFD54F)" : "rgba(255,255,255,0.05)", color: hasScroll ? "#0C0E14" : "#6B6864" }}>Start</button>
                    </div>
                  )})}
                </div>
              </div>
            )}

            {/* Members */}
            <div className="rounded-xl p-6 border" style={{ background: "#13161F", borderColor: "rgba(255,255,255,0.07)" }}>
              <h3 className="text-lg font-bold mb-3" style={{ color: "#F0EDE6", fontFamily: "'Cinzel',serif" }}>Members</h3>
              <div className="space-y-2">
                {members.map((m: { id: string; role: string; profile: { display_name: string; level: number; class: string } }) => (
                  <div key={m.id} className="flex items-center gap-3 p-2 rounded" style={{ background: "rgba(0,0,0,0.2)" }}>
                    <div className="w-8 h-8 rounded-full grid place-items-center font-bold text-xs"
                      style={{ background: "linear-gradient(135deg,#C89A3E,#FFD54F)", color: "#0C0E14" }}>
                      {m.profile.display_name[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: "#F0EDE6" }}>
                        {m.role === "leader" && "♛ "}{m.profile.display_name}
                      </p>
                      <p className="text-xs" style={{ color: "#6B6864" }}>Lvl {m.profile.level} · {m.profile.class || "No class"}</p>
                    </div>
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded-full"
                      style={{ background: m.role === "leader" ? "rgba(255,213,79,0.2)" : "rgba(255,255,255,0.05)", color: m.role === "leader" ? "#FFD54F" : "#6B6864" }}>
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
              <button onClick={() => leaveMut.mutate()} className="mt-4 text-xs px-3 py-1 rounded" style={{ color: "#E05252", background: "rgba(224,82,82,0.1)" }}>
                Leave Guild
              </button>
            </div>
          </div>
        )}

        {/* Browse */}
        {tab === "browse" && (
          <div className="space-y-2">
            {(guildsQ.data?.guilds ?? []).map((g: { id: string; name: string; description: string; level: number; privacy: string; guild_members: Array<{ count: number }> }) => (
              <div key={g.id} className="flex items-center justify-between p-4 rounded-lg border" style={{ background: "#13161F", borderColor: "rgba(255,255,255,0.07)" }}>
                <div>
                  <p className="font-bold text-sm" style={{ color: "#F0EDE6", fontFamily: "'Cinzel',serif" }}>{g.name}</p>
                  <p className="text-xs" style={{ color: "#6B6864" }}>Lvl {g.level} · {g.guild_members?.[0]?.count ?? "?"} members · {g.privacy}</p>
                </div>
                <button onClick={() => joinMut.mutate(g.id)} disabled={!!myGuild || joinMut.isPending}
                  className="px-4 py-1.5 rounded text-xs font-bold uppercase disabled:opacity-30"
                  style={{ background: "linear-gradient(135deg,#C89A3E,#FFD54F)", color: "#0C0E14" }}>
                  {myGuild ? "Already in guild" : "Join"}
                </button>
              </div>
            ))}
            {(guildsQ.data?.guilds ?? []).length === 0 && (
              <p className="text-center py-8" style={{ color: "#6B6864" }}>No guilds yet. Be the first to create one!</p>
            )}
          </div>
        )}

        {/* Create */}
        {tab === "create" && (
          <div className="rounded-xl p-6 border max-w-md" style={{ background: "#13161F", borderColor: "rgba(255,255,255,0.07)" }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>Create Guild</h2>
            <p className="text-xs mb-4" style={{ color: "#A09D96" }}>Costs 500 💎 Crystals</p>
            <div className="space-y-3">
              <label className="block">
                <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "#A09D96" }}>Guild Name</span>
                <input value={guildName} onChange={(e) => setGuildName(e.target.value)} maxLength={30}
                  className="w-full mt-1 px-3 py-2 rounded-md text-sm" style={{ background: "#0C0E14", color: "#F0EDE6", border: "1px solid rgba(255,255,255,0.08)" }} />
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "#A09D96" }}>Description</span>
                <textarea value={guildDesc} onChange={(e) => setGuildDesc(e.target.value)} maxLength={200} rows={3}
                  className="w-full mt-1 px-3 py-2 rounded-md text-sm" style={{ background: "#0C0E14", color: "#F0EDE6", border: "1px solid rgba(255,255,255,0.08)" }} />
              </label>
              <button onClick={() => createMut.mutate()} disabled={!guildName.trim() || createMut.isPending}
                className="w-full py-3 rounded-md font-bold text-sm uppercase tracking-widest disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#C89A3E,#FFD54F)", color: "#0C0E14" }}>
                {createMut.isPending ? "Creating…" : "Create Guild — 500💎"}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
