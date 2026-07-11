import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { AppShell } from "@/components/game/AppShell";
import { AtmosphereBackdrop } from "@/components/game/AtmosphereBackdrop";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import {
  getMyProfile,
  getMyGuild,
  listGuilds,
  createGuild,
  joinGuild,
  leaveGuild,
  listQuestTemplates,
  startQuest,
  getAvailableScrolls,
} from "@/lib/game/supabase-api";
import { LoadingScreen } from "@/components/game/LoadingScreen";

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-guild"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Guild created!");
      setTab("guild");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const joinMut = useMutation({
    mutationFn: (guildId: string) => joinGuild(guildId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-guild"] });
      toast.success("Joined!");
      setTab("guild");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const leaveMut = useMutation({
    mutationFn: () => leaveGuild(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-guild"] });
      toast("Left guild.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const questMut = useMutation({
    mutationFn: (v: { templateId: string; scrollName: string }) =>
      startQuest(v.templateId, v.scrollName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-guild"] });
      qc.invalidateQueries({ queryKey: ["my-scrolls"] });
      toast.success("Quest started!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (profileQ.isLoading) return <LoadingScreen realmSlug="iron-dominion" />;
  if (profileQ.isError) {
    return (
      <AppShell profile={undefined as never} withHeader={false}>
        <div className="relative z-10 p-6 max-w-xl mx-auto pt-20">
          <EmptyState
            icon="warning"
            title="The hall doors are barred."
            body={profileQ.error?.message ?? "Something went wrong loading the Guild Hall."}
            cta={{ label: "Try Again", onClick: () => profileQ.refetch() }}
          />
        </div>
      </AppShell>
    );
  }
  if (!profileQ.data) return null;

  const profile = profileQ.data.profile;
  const myGuild = guildQ.data?.guild;
  const members = guildQ.data?.members ?? [];
  const activeQuest = guildQ.data?.quest;

  return (
    <AppShell profile={profile}>
      <AtmosphereBackdrop realm="iron" />
      <div className="p-6 md:p-10 max-w-6xl mx-auto min-h-screen relative z-10">
        <header className="mb-8 text-center flex flex-col items-center">
          <div
            className="w-16 h-16 flex items-center justify-center mb-3"
            style={{
              border: "2px solid rgba(200,154,62,0.4)",
              borderRadius: 0,
              background: "rgba(200,154,62,0.08)",
              boxShadow: "3px 3px 0 rgba(0,0,0,0.4)",
            }}
          >
            <Icon name="crown" size={32} color="var(--gold-bright)" />
          </div>
          <h1
            className="text-3xl font-bold mb-1"
            style={{
              fontFamily: "var(--ss-font-pixel)",
              color: "var(--gold-ink)",
              letterSpacing: "0.08em",
            }}
          >
            GUILD HALL
          </h1>
          <p
            className="text-[10px]"
            style={{ fontFamily: "var(--ss-font-pixel)", color: "var(--ink-secondary)" }}
          >
            {myGuild ? `Member of ${myGuild.name}` : "Join a guild to fight bosses cooperatively!"}
          </p>
        </header>

        {/* World Raid Banner */}
        {myGuild && (
          <div
            className="mb-6 p-4 border relative overflow-hidden"
            style={{
              borderColor: "rgba(255,94,42,0.3)",
              borderRadius: 0,
              background: "linear-gradient(135deg, rgba(255,94,42,0.06), rgba(200,154,62,0.04))",
              boxShadow: "4px 4px 0 rgba(0,0,0,0.4)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-[10px] uppercase font-bold"
                  style={{
                    fontFamily: "var(--ss-font-pixel)",
                    color: "var(--danger)",
                    letterSpacing: "0.06em",
                  }}
                >
                  🌋 World Raid — Coming Soon
                </p>
                <p
                  className="text-[9px] mt-1"
                  style={{ fontFamily: "var(--ss-font-pixel)", color: "var(--ink-secondary)" }}
                >
                  All guilds unite against a realm-tier boss. Contribute damage through daily tasks.
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl">⚔</div>
                <span
                  className="text-[8px] uppercase"
                  style={{ fontFamily: "var(--ss-font-pixel)", color: "var(--ink-tertiary)" }}
                >
                  Season 1
                </span>
              </div>
            </div>
            <div className="ss-bar-pixel mt-3" style={{ height: 8 }}>
              <div
                className="ss-bar-pixel-fill"
                style={{ width: "0%", background: "var(--danger)" }}
              />
            </div>
            <p
              className="text-[8px] mt-1 text-right"
              style={{ fontFamily: "var(--ss-font-pixel)", color: "var(--ink-tertiary)" }}
            >
              Global HP: ???/??? — Awaiting raid start
            </p>
          </div>
        )}

        {/* Tabs */}
        <div
          className="flex gap-2 mb-6 border-b overflow-x-auto no-scrollbar"
          style={{ borderColor: "rgba(61,46,31,0.08)" }}
          role="tablist"
          aria-label="Guild sections"
        >
          {(
            [
              ["guild", "My Guild"],
              ["browse", "Browse"],
              ["create", "Create"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              role="tab"
              aria-selected={tab === k}
              className={`ss-tab-d pb-2 text-sm font-semibold min-h-[44px] whitespace-nowrap ${tab === k ? "active" : ""}`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* My Guild */}
        {tab === "guild" && !myGuild && (
          <EmptyState
            icon="crown"
            title="No Pact Has Been Formed"
            body="The Vanguard hall is silent. Seek others who write the Page."
            cta={{
              label: "Browse Guilds",
              onClick: () => setTab("browse"),
            }}
          />
        )}

        {tab === "guild" && myGuild && (
          <div className="space-y-6">
            {/* Guild info */}
            <div className="ss-card">
              <h2 className="t-h2 text-xl font-bold mb-1" style={{ color: "var(--gold-ink)" }}>
                {myGuild.name}
              </h2>
              <p className="text-sm mb-3" style={{ color: "var(--ink-secondary)" }}>
                {myGuild.description || "No description."}
              </p>
              <div className="flex gap-4 text-xs" style={{ color: "var(--ink-secondary)" }}>
                <span>Level {myGuild.level}</span>
                <span>{members.length} members</span>
                <span>Privacy: {myGuild.privacy}</span>
              </div>
            </div>

            {/* Active Quest */}
            {activeQuest ? (
              <div className="ss-card" style={{ borderColor: "rgba(255,213,79,0.2)" }}>
                <h3 className="t-h3 text-lg font-bold mb-2" style={{ color: "var(--gold-ink)" }}>
                  Active Quest: {activeQuest.quest_template?.name}
                </h3>
                {activeQuest.boss_hp_remaining != null && (
                  <div className="mb-3">
                    <div
                      className="flex justify-between mb-1"
                      style={{
                        fontFamily: "var(--ss-font-pixel)",
                        fontSize: 9,
                        color: "var(--ink-secondary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      <span>Boss HP</span>
                      <span>
                        {activeQuest.boss_hp_remaining.toLocaleString()} /{" "}
                        {activeQuest.quest_template?.boss_hp?.toLocaleString()}
                      </span>
                    </div>
                    <div className="ss-bar-pixel" style={{ height: 12 }}>
                      <div
                        className="ss-bar-pixel-fill"
                        style={{
                          width: `${(activeQuest.boss_hp_remaining / (activeQuest.quest_template?.boss_hp ?? 1)) * 100}%`,
                          background: "var(--danger)",
                        }}
                      />
                    </div>
                  </div>
                )}
                <p className="text-xs" style={{ color: "var(--ink-secondary)" }}>
                  Complete your tasks to deal damage to the boss! Missing dailies lets the boss
                  attack your party.
                </p>
              </div>
            ) : (
              <div className="ss-card">
                <h3 className="t-h3 text-lg font-bold mb-3" style={{ color: "var(--ink-primary)" }}>
                  Start a Quest
                </h3>
                {templatesQ.isLoading && (
                  <p className="text-xs" style={{ color: "var(--ink-secondary)" }}>
                    Unrolling the quest ledger…
                  </p>
                )}
                {templatesQ.isError && (
                  <p className="text-xs" style={{ color: "var(--danger)" }}>
                    Could not load quests.{" "}
                    <button
                      onClick={() => templatesQ.refetch()}
                      className="underline"
                      style={{ color: "var(--gold-ink)" }}
                    >
                      Retry
                    </button>
                  </p>
                )}
                {!templatesQ.isLoading &&
                  !templatesQ.isError &&
                  (templatesQ.data?.templates ?? []).length === 0 && (
                    <p className="text-xs" style={{ color: "var(--ink-secondary)" }}>
                      No quests are available right now.
                    </p>
                  )}
                <div className="space-y-2">
                  {(templatesQ.data?.templates ?? []).map(
                    (t: {
                      id: string;
                      name: string;
                      quest_type: string;
                      boss_hp?: number;
                      difficulty: string;
                    }) => {
                      const requiredScroll = SCROLL_MAPPING[t.name] ?? t.name + " Scroll";
                      const hasScroll = (scrollsQ.data?.scrolls ?? []).some(
                        (s: { item_name: string }) => s.item_name === requiredScroll,
                      );
                      return (
                        <div
                          key={t.id}
                          className="ss-pane flex items-center justify-between gap-3 p-3"
                        >
                          <div className="min-w-0">
                            <p
                              className="text-sm font-bold"
                              style={{ color: "var(--ink-primary)" }}
                            >
                              {t.name}
                            </p>
                            <p className="text-xs" style={{ color: "var(--ink-secondary)" }}>
                              {t.quest_type === "boss"
                                ? `Boss · HP ${t.boss_hp?.toLocaleString()}`
                                : "Collection"}{" "}
                              · {t.difficulty}
                            </p>
                            <p
                              className="text-[11px] mt-1 font-semibold flex items-center gap-1"
                              style={{ color: hasScroll ? "var(--success)" : "var(--danger)" }}
                            >
                              {hasScroll ? (
                                <>
                                  <Icon name="check" size={12} color="var(--success)" />
                                  <span>You have a {requiredScroll}</span>
                                </>
                              ) : (
                                `Requires ${requiredScroll} (Buy in Shop)`
                              )}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              questMut.mutate({ templateId: t.id, scrollName: requiredScroll })
                            }
                            disabled={!hasScroll || questMut.isPending}
                            className={`ss-btn disabled:opacity-40 shrink-0 ${hasScroll ? "ss-btn-d-primary" : "ss-btn-secondary"}`}
                          >
                            Start
                          </button>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            )}

            {/* Members */}
            <div className="ss-card">
              <h3 className="t-h3 text-lg font-bold mb-3" style={{ color: "var(--ink-primary)" }}>
                Members
              </h3>
              <div className="space-y-2">
                {members.map(
                  (
                    m: {
                      id: string;
                      role: string;
                      profile: { display_name: string; level: number; class: string };
                    },
                    i: number,
                  ) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(i * 0.05, 0.3) }}
                      className="flex items-center gap-3 p-2 rounded ss-pane hover:bg-[rgba(200,154,62,0.06)] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full grid place-items-center font-bold text-xs ss-btn-d-primary">
                        {m.profile.display_name[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p
                          className="text-sm font-semibold flex items-center gap-1.5"
                          style={{ color: "var(--ink-primary)" }}
                        >
                          {m.role === "leader" && (
                            <Icon
                              name="crown"
                              size={13}
                              color="var(--gold-bright)"
                              className="lucide-glow"
                            />
                          )}
                          <span>{m.profile.display_name}</span>
                        </p>
                        <p className="text-xs" style={{ color: "var(--ink-secondary)" }}>
                          Lvl {m.profile.level} · {m.profile.class || "No class"}
                        </p>
                      </div>
                      <span
                        className="ss-chip"
                        style={{
                          background:
                            m.role === "leader" ? "rgba(200,154,62,0.18)" : "rgba(44,31,20,0.06)",
                          color: m.role === "leader" ? "var(--gold-ink)" : "var(--ink-secondary)",
                        }}
                      >
                        {m.role}
                      </span>
                    </motion.div>
                  ),
                )}
              </div>
              <button
                onClick={() => leaveMut.mutate()}
                className="ss-btn ss-btn-ghost mt-4 text-xs"
                style={{ color: "var(--danger)" }}
              >
                Leave Guild
              </button>
            </div>
          </div>
        )}

        {/* Browse */}
        {tab === "browse" && guildsQ.isLoading && (
          <div className="ss-card">
            <p className="text-sm" style={{ color: "var(--ink-secondary)" }}>
              Scouting the realm for fellowships…
            </p>
          </div>
        )}
        {tab === "browse" && guildsQ.isError && (
          <EmptyState
            icon="warning"
            title="The guild roll could not be read."
            body={guildsQ.error?.message ?? "Something went wrong loading guilds."}
            cta={{ label: "Try Again", onClick: () => guildsQ.refetch() }}
          />
        )}
        {tab === "browse" && !guildsQ.isLoading && !guildsQ.isError && (
          <div className="space-y-2">
            {(guildsQ.data?.guilds ?? []).map(
              (g: {
                id: string;
                name: string;
                level: number;
                privacy: string;
                guild_members?: { count: number }[];
              }) => (
                <div key={g.id} className="ss-card flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="t-h3 font-bold text-sm truncate"
                      style={{ color: "var(--ink-primary)" }}
                    >
                      {g.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--ink-secondary)" }}>
                      Lvl {g.level} · {g.guild_members?.[0]?.count ?? "?"} members · {g.privacy}
                    </p>
                  </div>
                  <button
                    onClick={() => joinMut.mutate(g.id)}
                    disabled={!!myGuild || joinMut.isPending}
                    className="ss-btn ss-btn-d-primary disabled:opacity-30 shrink-0"
                  >
                    {myGuild ? "Already in guild" : "Join"}
                  </button>
                </div>
              ),
            )}
            {(guildsQ.data?.guilds ?? []).length === 0 && (
              <EmptyState
                icon="crown"
                title="No fellowship has been forged."
                body="Be the first to create one!"
              />
            )}
          </div>
        )}

        {/* Create */}
        {tab === "create" && (
          <div className="ss-card max-w-md">
            <h2 className="t-h2 text-lg font-bold mb-4" style={{ color: "var(--gold-ink)" }}>
              Create Guild
            </h2>
            <p className="text-xs mb-4" style={{ color: "var(--ink-secondary)" }}>
              Costs 500 Crystals
            </p>
            <div className="space-y-3">
              <label className="block">
                <span className="t-label">Guild Name</span>
                <input
                  value={guildName}
                  onChange={(e) => setGuildName(e.target.value)}
                  maxLength={30}
                  className="ss-input mt-1"
                />
              </label>
              <label className="block">
                <span className="t-label">Description</span>
                <textarea
                  value={guildDesc}
                  onChange={(e) => setGuildDesc(e.target.value)}
                  maxLength={200}
                  rows={3}
                  className="ss-input mt-1"
                />
              </label>
              <button
                onClick={() => createMut.mutate()}
                disabled={!guildName.trim() || createMut.isPending}
                className="ss-btn ss-btn-d-primary w-full disabled:opacity-40"
              >
                {createMut.isPending ? "Creating…" : "Create Guild — 500 Crystals"}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
