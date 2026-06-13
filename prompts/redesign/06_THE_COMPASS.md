# 06 — The Compass

> **Depends on:** none structurally, but visual style depends on
> [01_VISUAL_IDENTITY](./01_VISUAL_IDENTITY.md) once it's decided.

## The problem

A returning user opens the app and faces:

- 14 nav routes
- ~10 systems with active state
- No surface telling them which action right now has the highest payoff

Even **you**, the dev, don't always know what you "should" do first when you
open SummonScroll. That's a UX failure.

Most successful games solve this with a **directive layer** — Genshin's daily
commission, Stardew's "events today" banner, Habitica's "Pomodoro suggested
because you've been idle 30 min." A single component at the top of the home
screen surfaces the _one highest-leverage action available right now_.

## The fix

A `<Compass />` component lives at the top of the Hub. It evaluates a small
set of candidate actions against the current state, picks the one with the
highest combined urgency + impact + delight score, and renders it as a single
sentence with a CTA button.

It runs on a fast client-side query — no backend needed. State refreshes when
the user invalidates `["profile"]` or `["today-log"]`.

---

## The candidate rules

Eight candidates the Compass can suggest, ranked by score:

| #   | Candidate                         | Condition                                                | Score factors                                      |
| --- | --------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
| 1   | **Morning Ritual ready**          | `morningWindow && !morning_done`                         | base 100 + urgency (linearly +1 per hour past 4am) |
| 2   | **Evening Reflection ready**      | `eveningWindow && morning_done && !evening_done`         | base 90 + urgency                                  |
| 3   | **Reflection Pull available**     | `reflection_pull_granted && !reflection_pull_used`       | base 95 (rare reward)                              |
| 4   | **Quarterly Boss almost slain**   | `active_quarterly_goal && hp_remaining/hp_total < 0.15`  | base 95 (close to Tome)                            |
| 5   | **Promotion possible**            | `any monster meets all promotion requirements`           | base 88 + (newStar\*2)                             |
| 6   | **Stamina full**                  | `stamina >= stamina_max`                                 | base 70 + 5 per missed-expedition day              |
| 7   | **Wailing Wall reached**          | `tower.highest_floor === 49 && !wailing_wall_cleared_at` | base 92 (milestone)                                |
| 8   | **Sacred Directives almost done** | `2 of 3 starred tasks completed today`                   | base 80                                            |

A 9th fallback: **"Forge a new directive"** if the user has 0 active tasks.

### Scoring formula

```
score = base + bonuses - cooldown_penalty
```

The Compass picks the candidate with the highest score and renders ONE
suggestion at a time. Cooldown: if a candidate was suggested in the last 4
hours, deduct 30. Prevents the same suggestion looping.

---

## The component spec

### File: `src/components/game/Compass.tsx`

```tsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useMemo } from "react";
import {
  getMyProfile,
  getTodayLog,
  listGoals,
  listMyMonsters,
  getTowerProgress,
  computeCurrentStamina,
  checkPromotionEligibility,
  isMorningWindow,
  isEveningWindow,
} from "@/lib/game/supabase-api";
import { Icon } from "@/components/ui/Icon";
import { trans } from "@/lib/ui/motion-tokens";

type Suggestion = {
  id: string;
  score: number;
  title: string; // verb-led sentence: "Set today's directives"
  reason: string; // one-line why: "Mornings shape the day."
  cta: string; // button text: "Open Ritual"
  to?: string; // route to navigate to
  action?: () => void; // OR a callback (for opening a modal)
  icon: string; // Icon name from the icon system
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

  const suggestion = useMemo<Suggestion | null>(() => {
    if (!profileQ.data || !logQ.data) return null;
    const profile = profileQ.data.profile;
    const log = logQ.data;
    const goals = goalsQ.data?.goals ?? [];
    const monsters = monstersQ.data?.userMonsters ?? [];
    const tower = towerQ.data?.progress;

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
        icon: "summon",
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

    // Candidate 5: Promotion possible (cheap async check skipped — use heuristic)
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

    // Candidate 7: Wailing Wall at 49
    if (tower && tower.highest_floor === 49 && !tower.wailing_wall_cleared_at) {
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

    // Candidate 8: 2 of 3 stars done
    // (would need to fetch tasks — simplified placeholder)
    // Implement once you wire task data into Compass

    // Fallback
    if (candidates.length === 0) {
      candidates.push({
        id: "fallback",
        score: 10,
        title: "Quiet day. Add a small directive.",
        reason: "Small wins compound.",
        cta: "Forge",
        action: () => {}, // Hub opens its own directive dialog
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
    onOpenMorning,
    onOpenEvening,
  ]);

  if (!suggestion) return null;

  const toneStyles: Record<string, React.CSSProperties> = {
    calm: { background: "rgba(255,213,79,0.06)", borderColor: "rgba(255,213,79,0.22)" },
    urgent: { background: "rgba(224,82,82,0.06)", borderColor: "rgba(224,82,82,0.28)" },
    rare: { background: "rgba(127,119,221,0.06)", borderColor: "rgba(127,119,221,0.28)" },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={trans.cascadeIn}
      className="ss-card mb-4 flex items-center gap-4"
      style={toneStyles[suggestion.tone]}
    >
      <div className="shrink-0">
        <Icon name={suggestion.icon as any} size={28} weight="duotone" />
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
```

### Mount the Compass on the Hub

In `src/routes/_authenticated/index.tsx`:

```tsx
import { Compass } from "@/components/game/Compass";

// inside the Hub return, FIRST element after RitualStatusPill removed:
<Compass onOpenMorning={() => setShowMorning(true)} onOpenEvening={() => setShowEvening(true)} />;
```

You can remove `<RitualStatusPill />` once the Compass is shipped — the Compass
covers its role and more.

---

## A11y

- Compass is a `region` with `aria-label="Next action"`.
- The CTA button is always reachable by keyboard tab.
- When a new suggestion replaces an old one, the change is silent unless the
  tone changes to `urgent` — then it should announce via `aria-live="polite"`.

---

## Acceptance checks

- [ ] Visible at the top of the Hub on every load
- [ ] Updates when relevant queries invalidate (no manual reload needed)
- [ ] Shows different suggestions at different times of day in dev/test
- [ ] Falls back gracefully (no crash) when state is missing
- [ ] Mobile: card wraps to two rows (icon+text on one, button below)
- [ ] Build passes; no new TS errors

## Tasks for agent

1. Create `src/components/game/Compass.tsx` per the spec.
2. Wire into `src/routes/_authenticated/index.tsx` as the first child of the
   Hub's main content area.
3. Remove `<RitualStatusPill />` from Hub (Compass replaces it).
4. Run through dev to confirm the suggestion changes as you complete the
   Morning ritual / evening reflection.
5. Write a quick smoke test (see scoring rules table) — simulate the 8
   candidate conditions in dev and confirm the right one wins each time.
6. Commit.

## Out of scope

- **Don't add ML-style personalization.** The 8 rules are enough. Adding a
  recommendation model is months of work and you'll never have enough training
  signal.
- **Don't show 2 Compass suggestions at once.** One sentence. One CTA.
- **Don't update the Compass more often than every 60 seconds via timer.**
  React-Query invalidation is the only refresh trigger.
- **Don't put the Compass on routes other than Hub.** Each route is its own
  decision context; the Compass is the entry-point summary.
