import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/game/AppShell";
import { AtmosphereBackdrop } from "@/components/game/AtmosphereBackdrop";
import { getMyProfile } from "@/lib/game/supabase-api";
import { Icon } from "@/components/ui/Icon";
import { LoadingScreen } from "@/components/game/LoadingScreen";
import { EmptyState } from "@/components/ui/EmptyState";

export const Route = createFileRoute("/_authenticated/race-skills")({
  component: RaceSkillsPage,
});

type SkillNode = {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  tier: number;
  unlocked: boolean;
  requires?: string;
};

type RaceTree = {
  race: string;
  color: string;
  icon: string;
  nodes: SkillNode[];
};

const RACE_TREES: RaceTree[] = [
  {
    race: "Beast",
    color: "#d4843a",
    icon: "🐾",
    nodes: [
      {
        id: "b1",
        name: "Feral Instinct",
        description: "Critical rate +5% for beast-type souls",
        icon: "⚔",
        cost: 100,
        tier: 1,
        unlocked: false,
      },
      {
        id: "b2",
        name: "Pack Tactics",
        description: "If 2+ beasts in team, ATK +8%",
        icon: "🐺",
        cost: 200,
        tier: 2,
        unlocked: false,
        requires: "b1",
      },
      {
        id: "b3",
        name: "Apex Predator",
        description: "Beast souls heal 3% HP on kill",
        icon: "🦁",
        cost: 500,
        tier: 3,
        unlocked: false,
        requires: "b2",
      },
      {
        id: "b4",
        name: "Primal Fury",
        description: "Below 30% HP, beast ATK doubles",
        icon: "💥",
        cost: 1000,
        tier: 4,
        unlocked: false,
        requires: "b3",
      },
    ],
  },
  {
    race: "Dragon",
    color: "#e85d3a",
    icon: "🐲",
    nodes: [
      {
        id: "d1",
        name: "Dragonscale",
        description: "DEF +8% for dragon-type souls",
        icon: "🛡",
        cost: 100,
        tier: 1,
        unlocked: false,
      },
      {
        id: "d2",
        name: "Breath Mastery",
        description: "Elemental skill damage +12%",
        icon: "🔥",
        cost: 200,
        tier: 2,
        unlocked: false,
        requires: "d1",
      },
      {
        id: "d3",
        name: "Dragonflight",
        description: "Evade +10%, ignore terrain penalties",
        icon: "🕊",
        cost: 500,
        tier: 3,
        unlocked: false,
        requires: "d2",
      },
      {
        id: "d4",
        name: "Ancient Wyrm",
        description: "All stats +5% per dragon in team",
        icon: "⭐",
        cost: 1000,
        tier: 4,
        unlocked: false,
        requires: "d3",
      },
    ],
  },
  {
    race: "Spirit",
    color: "#9b6dff",
    icon: "👻",
    nodes: [
      {
        id: "s1",
        name: "Ethereal Form",
        description: "15% chance to dodge physical attacks",
        icon: "💨",
        cost: 100,
        tier: 1,
        unlocked: false,
      },
      {
        id: "s2",
        name: "Soul Drain",
        description: "Attacks steal 2% of damage as HP",
        icon: "💜",
        cost: 200,
        tier: 2,
        unlocked: false,
        requires: "s1",
      },
      {
        id: "s3",
        name: "Phase Shift",
        description: "First hit each battle is nullified",
        icon: "🔮",
        cost: 500,
        tier: 3,
        unlocked: false,
        requires: "s2",
      },
      {
        id: "s4",
        name: "Astral Projection",
        description: "On death, fight as ghost for 2 turns",
        icon: "✨",
        cost: 1000,
        tier: 4,
        unlocked: false,
        requires: "s3",
      },
    ],
  },
  {
    race: "Construct",
    color: "#38b8f5",
    icon: "⚙",
    nodes: [
      {
        id: "c1",
        name: "Reinforced Plating",
        description: "Max HP +10% for constructs",
        icon: "🔧",
        cost: 100,
        tier: 1,
        unlocked: false,
      },
      {
        id: "c2",
        name: "Overclock",
        description: "Speed +15% for first 3 turns",
        icon: "⚡",
        cost: 200,
        tier: 2,
        unlocked: false,
        requires: "c1",
      },
      {
        id: "c3",
        name: "Emergency Repair",
        description: "Auto-heal 20% HP once per battle",
        icon: "🔩",
        cost: 500,
        tier: 3,
        unlocked: false,
        requires: "c2",
      },
      {
        id: "c4",
        name: "Singularity Core",
        description: "Immune to debuffs, +20% all stats",
        icon: "💎",
        cost: 1000,
        tier: 4,
        unlocked: false,
        requires: "c3",
      },
    ],
  },
  {
    race: "Undead",
    color: "#c44f6f",
    icon: "💀",
    nodes: [
      {
        id: "u1",
        name: "Deathless",
        description: "Survive fatal blow with 1 HP (once)",
        icon: "☠",
        cost: 100,
        tier: 1,
        unlocked: false,
      },
      {
        id: "u2",
        name: "Necrotic Aura",
        description: "Enemies near undead lose 2% HP/turn",
        icon: "🦴",
        cost: 200,
        tier: 2,
        unlocked: false,
        requires: "u1",
      },
      {
        id: "u3",
        name: "Grave Rising",
        description: "Revive once with 30% HP after 2 turns",
        icon: "⚰",
        cost: 500,
        tier: 3,
        unlocked: false,
        requires: "u2",
      },
      {
        id: "u4",
        name: "Lich King",
        description: "Each fallen ally boosts undead ATK +15%",
        icon: "👑",
        cost: 1000,
        tier: 4,
        unlocked: false,
        requires: "u3",
      },
    ],
  },
];

function RaceSkillsPage() {
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const [selectedRace, setSelectedRace] = useState(0);

  if (profileQ.isLoading) return <LoadingScreen />;
  if (!profileQ.data?.profile) return <EmptyState icon="alert" title="Not authenticated" />;

  const profile = profileQ.data.profile;
  const tree = RACE_TREES[selectedRace];
  const sp = ((profile as Record<string, unknown>).skill_points as number) ?? 0;

  return (
    <AppShell profile={profile}>
      <AtmosphereBackdrop realm="elder" />
      <div className="p-6 md:p-10 max-w-5xl mx-auto relative z-10 min-h-screen">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div
            className="w-16 h-16 flex items-center justify-center"
            style={{
              border: "2px solid rgba(200,154,62,0.4)",
              borderRadius: 0,
              background: "rgba(200,154,62,0.08)",
              boxShadow: "3px 3px 0 rgba(0,0,0,0.4)",
            }}
          >
            <Icon name="sparkle" size={28} color="var(--gold-bright)" />
          </div>
          <div>
            <h1
              className="text-3xl font-bold uppercase"
              style={{
                fontFamily: "var(--ss-font-pixel)",
                color: "var(--gold-ink)",
                letterSpacing: "0.08em",
              }}
            >
              RACE SKILL TREES
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--ink-secondary)" }}>
              Invest Skill Points to unlock racial passives for your souls.
            </p>
          </div>
        </div>

        {/* SP Display */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 border"
          style={{
            borderRadius: 0,
            borderColor: "rgba(200,154,62,0.3)",
            background: "rgba(200,154,62,0.06)",
            boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
          }}
        >
          <Icon name="sparkle" size={14} color="var(--gold-bright)" />
          <span
            className="text-[11px] font-bold"
            style={{ fontFamily: "var(--ss-font-pixel)", color: "var(--gold-ink)" }}
          >
            {sp} SP AVAILABLE
          </span>
        </div>

        {/* Race Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {RACE_TREES.map((rt, i) => (
            <button
              key={rt.race}
              onClick={() => setSelectedRace(i)}
              className="px-3 py-2 border text-[10px] uppercase font-bold transition-all"
              style={{
                fontFamily: "var(--ss-font-pixel)",
                borderRadius: 0,
                borderColor: selectedRace === i ? rt.color : "rgba(139,115,85,0.2)",
                background: selectedRace === i ? `${rt.color}18` : "transparent",
                color: selectedRace === i ? "var(--ink-primary)" : "var(--ink-tertiary)",
                boxShadow: selectedRace === i ? `3px 3px 0 ${rt.color}40` : "none",
              }}
            >
              {rt.icon} {rt.race}
            </button>
          ))}
        </div>

        {/* Skill Tree */}
        <div
          className="p-6 border"
          style={{
            borderRadius: 0,
            borderColor: `${tree.color}30`,
            background: `${tree.color}08`,
            boxShadow: "4px 4px 0 rgba(0,0,0,0.3)",
          }}
        >
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">{tree.icon}</span>
            <h2
              className="text-xl font-bold uppercase"
              style={{ fontFamily: "var(--ss-font-pixel)", color: "var(--ink-primary)" }}
            >
              {tree.race} LINEAGE
            </h2>
          </div>

          {/* Nodes */}
          <div className="space-y-4">
            {tree.nodes.map((node, idx) => {
              const isAvailable = idx === 0 || tree.nodes[idx - 1].unlocked;
              const canAfford = sp >= node.cost;
              return (
                <div key={node.id} className="flex items-stretch gap-4">
                  {/* Connector */}
                  <div className="flex flex-col items-center w-8 flex-shrink-0">
                    <div
                      className="w-8 h-8 flex items-center justify-center border-2 text-sm"
                      style={{
                        borderRadius: 0,
                        borderColor: node.unlocked ? tree.color : `${tree.color}40`,
                        background: node.unlocked ? `${tree.color}25` : "rgba(0,0,0,0.1)",
                        color: node.unlocked ? tree.color : "var(--ink-tertiary)",
                        boxShadow: node.unlocked ? `2px 2px 0 ${tree.color}30` : "none",
                      }}
                    >
                      {node.icon}
                    </div>
                    {idx < tree.nodes.length - 1 && (
                      <div
                        className="w-0.5 flex-1 mt-1"
                        style={{
                          background: node.unlocked ? tree.color : `${tree.color}25`,
                        }}
                      />
                    )}
                  </div>

                  {/* Node Card */}
                  <div
                    className="flex-1 p-3 border"
                    style={{
                      borderRadius: 0,
                      borderColor: node.unlocked ? `${tree.color}50` : `${tree.color}20`,
                      background: node.unlocked ? `${tree.color}10` : "rgba(0,0,0,0.05)",
                      boxShadow: node.unlocked
                        ? `3px 3px 0 ${tree.color}25`
                        : "2px 2px 0 rgba(0,0,0,0.15)",
                      opacity: isAvailable || node.unlocked ? 1 : 0.5,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-[11px] font-bold uppercase"
                        style={{
                          fontFamily: "var(--ss-font-pixel)",
                          color: node.unlocked ? tree.color : "var(--ink-primary)",
                        }}
                      >
                        {node.name}
                      </span>
                      <span
                        className="text-[9px] px-1.5 py-0.5 border font-bold"
                        style={{
                          fontFamily: "var(--ss-font-pixel)",
                          borderRadius: 0,
                          borderColor: node.unlocked ? `${tree.color}40` : "rgba(139,115,85,0.2)",
                          color: node.unlocked ? tree.color : "var(--ink-tertiary)",
                          background: node.unlocked ? `${tree.color}15` : "rgba(0,0,0,0.05)",
                        }}
                      >
                        {node.unlocked ? "UNLOCKED" : `${node.cost} SP`}
                      </span>
                    </div>
                    <p className="text-[11px]" style={{ color: "var(--ink-secondary)" }}>
                      {node.description}
                    </p>
                    {!node.unlocked && isAvailable && (
                      <button
                        disabled={!canAfford}
                        className="mt-2 px-3 py-1 text-[9px] font-bold uppercase border disabled:opacity-30"
                        style={{
                          fontFamily: "var(--ss-font-pixel)",
                          borderRadius: 0,
                          borderColor: canAfford ? tree.color : "rgba(139,115,85,0.2)",
                          color: canAfford ? "#fff" : "var(--ink-tertiary)",
                          background: canAfford ? tree.color : "rgba(0,0,0,0.05)",
                          boxShadow: canAfford ? "2px 2px 0 rgba(0,0,0,0.4)" : "none",
                        }}
                      >
                        UNLOCK ({node.cost} SP)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Race Passive Summary */}
        <div
          className="mt-6 p-4 border"
          style={{
            borderRadius: 0,
            borderColor: `${tree.color}15`,
            background: `${tree.color}03`,
            boxShadow: "3px 3px 0 rgba(0,0,0,0.2)",
          }}
        >
          <p
            className="text-[10px] uppercase font-bold mb-2"
            style={{ fontFamily: "var(--ss-font-pixel)", color: tree.color }}
          >
            {tree.race} LINEAGE BONUS
          </p>
          <p className="text-[11px]" style={{ color: "var(--ink-secondary)" }}>
            Unlocking all 4 nodes grants the{" "}
            <b style={{ color: tree.color }}>{tree.race} Lineage Mastery</b> title and a permanent
            +3% all-stats bonus to every {tree.race.toLowerCase()}-type soul.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
