import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
import { trans } from "@/lib/ui/motion-tokens";
import {
  getMyProfile,
  getTodayLog,
  listGoals,
  listMyMonsters,
  listTasks,
  getTowerProgress,
  computeCurrentStamina,
  isMorningWindow,
  isEveningWindow,
} from "@/lib/game/supabase-api";

type Suggestion = {
  id: string;
  score: number;
  title: string;
  reason: string;
  cta: string;
  to?: string;
  action?: () => void;
  icon: string;
  tone: "calm" | "urgent" | "rare";
};

export function Compass({
  onOpenMorning,
  onOpenEvening,
}: {
  onOpenMorning: () => void;
  onOpenEvening: () => void;
}) {
  const nav = useNavigate();

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: getMyProfile });
  const logQ = useQuery({ queryKey: ["today-log"], queryFn: getTodayLog });
  const goalsQ = useQuery({ queryKey: ["goals-active"], queryFn: () => listGoals("active") });
  const monstersQ = useQuery({ queryKey: ["my-monsters"], queryFn: listMyMonsters });
  const towerQ = useQuery({ queryKey: ["tower"], queryFn: getTowerProgress });
  const tasksQ = useQuery({ queryKey: ["tasks"], queryFn: listTasks });

  const suggestion = useMemo<Suggestion | null>(() => {
    if (!profileQ.data || !logQ.data) return null;

    const profile = profileQ.data.profile;
    const log = logQ.data;
    const goals = goalsQ.data?.goals ?? [];
    const monsters = monstersQ.data?.userMonsters ?? [];
    const tower = towerQ.data?.progress;
    const tasks = tasksQ.data?.tasks ?? [];

    const candidates: Suggestion[] = [];

    // Candidate 1: Morning ritual
    if (isMorningWindow() && !log.am_completed_at) {
      const hoursPast4am = Math.max(0, new Date().getHours() - 4);
      candidates.push({
        id: "morning",
        score: 100 + hoursPast4am,
        title: "Set today's Sacred Directives.",
        reason: "Mornings shape the day. Three tasks earn 1.5× rewards.",
        cta: "Begin Ritual",
        action: onOpenMorning,
        icon: "morning",
        tone: "calm",
      });
    }

    // Candidate 2: Evening reflection
    const eveningOpen = isEveningWindow(profile.wind_down_hour ?? 21);
    if (eveningOpen && log.am_completed_at && !log.pm_completed_at) {
      candidates.push({
        id: "evening",
        score: 90 + (new Date().getHours() - (profile.wind_down_hour ?? 21)),
        title: "Reflect on the day.",
        reason: "Ninety seconds. Builds the ritual streak.",
        cta: "Reflect",
        action: onOpenEvening,
        icon: "evening",
        tone: "calm",
      });
    }

    // Candidate 3: Reflection Pull
    if (log.reflection_pull_granted && !log.reflection_pull_used) {
      candidates.push({
        id: "pull",
        score: 95,
        title: "A Reflection Pull is waiting.",
        reason: "Earned tonight. Claim before midnight.",
        cta: "Open the Altar",
        to: "/altar",
        icon: "sparkle",
        tone: "rare",
      });
    }

    // Candidate 4: Quarterly Boss almost slain
    const finishingGoal = goals.find(
      (g) => g.type === "quarterly" && g.hp_remaining / g.hp_total < 0.15,
    );
    if (finishingGoal) {
      candidates.push({
        id: "boss-close",
        score: 95,
        title: `"${finishingGoal.title}" is close to falling.`,
        reason: `${finishingGoal.hp_remaining.toLocaleString()} HP left. Strike now.`,
        cta: "View Quests",
        to: "/quests",
        icon: "crown",
        tone: "urgent",
      });
    }

    // Candidate 5: Promotion possible (heuristic check)
    const promotable = monsters.find(
      (m) => m.bond_percent >= 60 && m.star_level < 5 && m.level >= 15,
    );
    if (promotable) {
      candidates.push({
        id: "promote",
        score: 88 + (promotable.star_level + 1) * 2,
        title: `${promotable.monster?.name ?? "A monster"} may be ready to promote.`,
        reason: "Visit the Chamber to check the stones.",
        cta: "Inspect",
        to: "/compendium",
        icon: "star",
        tone: "calm",
      });
    }

    // Candidate 6: Stamina full
    if (profile.stamina_max && profile.stamina != null && profile.stamina_last_tick) {
      const current = computeCurrentStamina(
        profile.stamina,
        profile.stamina_max,
        profile.stamina_last_tick,
      );
      if (current >= profile.stamina_max) {
        candidates.push({
          id: "stamina",
          score: 70,
          title: "Stamina is full.",
          reason: "Five expedition runs ready.",
          cta: "Send the team",
          to: "/expeditions",
          icon: "stamina",
          tone: "calm",
        });
      }
    }

    // Candidate 7: Wailing Wall at floor 49
    if (tower && tower.highest_floor === 49) {
      // Check if we have the full tower progress object with wailing_wall_cleared_at
      const hasWailingWallField = "wailing_wall_cleared_at" in tower;
      const wailingWallCleared = hasWailingWallField ? tower.wailing_wall_cleared_at : false;

      if (!wailingWallCleared) {
        candidates.push({
          id: "wailing",
          score: 92,
          title: "Floor 50 is the Wailing Wall.",
          reason: "First clear earns 5 Tome Shards and a permanent badge.",
          cta: "Enter the Tower",
          to: "/battle",
          icon: "battle",
          tone: "urgent",
        });
      }
    }

    // Candidate 8: Sacred Directives almost done (2 of 3 starred tasks completed today)
    if (log.am_intent_task_ids && log.am_intent_task_ids.length >= 2) {
      const starredTaskIds = log.am_intent_task_ids;
      const starredTasks = tasks.filter((t) => starredTaskIds.includes(t.id));

      if (starredTasks.length >= 2) {
        const today = new Date().toISOString().split("T")[0];
        const completedCount = starredTasks.filter((t) => {
          // For habits: check if last_completed_date is today
          if (t.type === "habit") return t.last_completed_date === today;
          // For dailies/todos: check if completed is true
          return Boolean(t.completed);
        }).length;

        // If we have 2+ starred tasks and 2+ are completed, suggest finishing the set
        if (starredTasks.length >= 3 && completedCount === 2) {
          candidates.push({
            id: "directives-almost",
            score: 80,
            title: "Two Sacred Directives complete. Finish the third.",
            reason: "Triple completion grants bonus rewards.",
            cta: "View Directives",
            action: () => {}, // Stay on Hub
            icon: "target",
            tone: "calm",
          });
        }
      }
    }

    // Fallback
    if (candidates.length === 0) {
      candidates.push({
        id: "fallback",
        score: 10,
        title: "Quiet day. Add a small directive.",
        reason: "Small wins compound.",
        cta: "Forge",
        action: () => {},
        icon: "sparkle",
        tone: "calm",
      });
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
  }, [
    profileQ.data,
    logQ.data,
    goalsQ.data,
    monstersQ.data,
    towerQ.data,
    tasksQ.data,
    onOpenMorning,
    onOpenEvening,
  ]);

  if (!suggestion) return null;

  const toneStyles: Record<string, React.CSSProperties & Record<string, string>> = {
    calm: {
      background: "rgba(255, 217, 92, 0.03)",
      "--ss-glow-start": "var(--gold-glow)",
      "--ss-glow-end": "var(--gold-bright)",
      boxShadow: "0 4px 20px rgba(255, 217, 92, 0.03)",
    },
    urgent: {
      background: "rgba(255, 94, 94, 0.03)",
      "--ss-glow-start": "var(--danger)",
      "--ss-glow-end": "var(--rose)",
      boxShadow: "0 4px 20px rgba(255, 94, 94, 0.03)",
    },
    rare: {
      background: "rgba(163, 116, 255, 0.03)",
      "--ss-glow-start": "var(--violet)",
      "--ss-glow-end": "var(--cyan)",
      boxShadow: "0 4px 20px rgba(163, 116, 255, 0.03)",
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={trans.cascadeIn}
      role="region"
      aria-label="Next action"
      className="ss-card-d-glow mb-4 flex items-center gap-4"
      style={toneStyles[suggestion.tone]}
    >
      <div className="shrink-0">
        <Icon name={suggestion.icon as any} size={28} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="t-h3">{suggestion.title}</p>
        <p className="t-lore mt-0.5">{suggestion.reason}</p>
      </div>
      <button
        onClick={() => {
          if (suggestion.action) suggestion.action();
          else if (suggestion.to) nav({ to: suggestion.to });
        }}
        className="ss-btn ss-btn-primary"
      >
        {suggestion.cta}
      </button>
    </motion.div>
  );
}
