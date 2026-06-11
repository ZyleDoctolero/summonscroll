# 07 — First Time Experience

> **Depends on:** [06_THE_COMPASS](./06_THE_COMPASS.md). Visual style depends on
> [01_VISUAL_IDENTITY](./01_VISUAL_IDENTITY.md).

## The problem

A brand new user signs up, lands on the Hub, sees this:

> Hub Directives  
> *No habits yet*  
> *Forge your first directive to start earning Gold and XP.*

That's it. Behind that one sentence are 12 mechanical systems they have no
idea about. They:
- Don't know the Altar exists
- Don't know what a monster is or how to get one
- Don't know about Expeditions, Quests, Promotions
- Don't know which kind of directive matters (habit vs daily vs todo)
- Don't get any "first delight" — pulling a monster, slaying a boss, leveling

Day-1 retention will be ~15% with this UX. With proper onboarding it can be
40%+. This file fixes that.

## The fix

A 4-step welcome flow shown to any user whose profile has `level <= 2` and
`onboarding_completed_at IS NULL`. After completion, set the flag and never
show again.

The flow:

1. **Welcome modal** — sets context. "You're starting a game disguised as a
   habit tracker. Here's the loop." 3-card carousel.
2. **First directive seeded** — a pre-created tutorial habit is in their task
   list. They tap it. Cascade fires.
3. **Free first pull** — banner opens, free 10-pull guaranteed at least one
   Rare. Players see real monsters they own.
4. **Compass takes over** — the Compass starts suggesting the next action.

Each step is dismissable but it's so smooth nobody skips it.

---

## DB change

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS tutorial_directive_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL;
```

Run via `supabase db push` after creating a migration:
`supabase/migrations/20260621000000_onboarding.sql`

---

## Step 1: Welcome carousel

### File: `src/components/game/Onboarding.tsx`

A full-screen modal shown when `profile.onboarding_completed_at` is null.
Three cards, swipe / button to advance, final button is "Forge my first
directive."

```tsx
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { trans, dur, ease } from "@/lib/ui/motion-tokens";
import { Icon } from "@/components/ui/Icon";

const STEPS = [
  {
    title: "Your habits forge a fantasy world.",
    body: "Every habit you complete strengthens monsters in your collection. Every streak shapes a story. This is not a checklist app.",
    icon: "morning",
  },
  {
    title: "Three rhythms, one game.",
    body: "Daily — tick tasks, earn rewards. Weekly — run expeditions, climb the Tower. Quarterly — slay a Boss, mint a Tome. The deeper rhythms reward consistency.",
    icon: "battle",
  },
  {
    title: "Start with one directive.",
    body: "We've added a tutorial directive to your list. Tap the [+] on it to feel how it ripples through the entire system.",
    icon: "star",
  },
];

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(4px)" }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: dur.measured, ease: ease.weighty }}
          className="ss-modal max-w-md text-center"
        >
          <div className="mb-4">
            <Icon name={STEPS[step].icon as any} size={48} weight="duotone" />
          </div>
          <h2 className="t-h1 mb-3" style={{ color: "var(--gold-leaf)" }}>
            {STEPS[step].title}
          </h2>
          <p className="t-body mb-6">{STEPS[step].body}</p>

          {/* Dots */}
          <div className="flex gap-1 justify-center mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: i === step ? "var(--gold-leaf)" : "var(--ss-ink-tertiary)",
                  transform: i === step ? "scale(1.2)" : "scale(1)",
                }}
              />
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="ss-btn ss-btn-secondary">
                Back
              </button>
            )}
            <button
              onClick={() => (last ? onComplete() : setStep(step + 1))}
              className="ss-btn ss-btn-primary"
            >
              {last ? "Begin" : "Continue"}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
```

### Mounting

In `src/routes/_authenticated/index.tsx` (or a higher layer):

```tsx
const showOnboarding = profileQ.data?.profile.onboarding_completed_at == null;

return (
  <AppShell profile={profile}>
    {showOnboarding && (
      <Onboarding onComplete={() => completeOnboarding.mutate()} />
    )}
    {/* rest of Hub */}
  </AppShell>
);
```

The `completeOnboarding` mutation:
1. Inserts a tutorial directive into the user's tasks (see Step 2).
2. Updates `profile.onboarding_completed_at`.
3. Records the directive id in `profile.tutorial_directive_id` so the
   special UI shown in Step 2 knows which task is the tutorial.

---

## Step 2: First directive seeded

### Backend function in `rituals-client.ts` or new `onboarding-client.ts`

```ts
export async function completeOnboarding() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // 1. Create the tutorial directive
  const { data: task, error: taskErr } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      type: "habit",
      title: "Drink water (first habit)",
      notes: "Tap the [+] to score this habit. Watch what happens.",
      category: "wellness",
      difficulty: "easy",
      positive_enabled: true,
      negative_enabled: false,
      tags: ["con"],  // CON-tagged so it ticks a monster bond when scored
    })
    .select()
    .single();
  if (taskErr) throw taskErr;

  // 2. Update profile
  const { error: profErr } = await supabase
    .from("profiles")
    .update({
      onboarding_completed_at: new Date().toISOString(),
      tutorial_directive_id: task.id,
    })
    .eq("id", user.id);
  if (profErr) throw profErr;

  return { taskId: task.id };
}
```

### Visual highlighting in TaskCard

`TaskCard.tsx` should detect when a task is the tutorial directive and glow:

```tsx
const isTutorial = task.id === profile.tutorial_directive_id;

<article
  className="ss-card"
  style={{
    boxShadow: isTutorial ? "0 0 24px rgba(255,213,79,0.45)" : undefined,
    animation: isTutorial ? "tutorial-pulse 2s ease-in-out infinite" : undefined,
  }}
>
```

CSS for the pulse:

```css
@keyframes tutorial-pulse {
  0%, 100% { box-shadow: 0 0 18px rgba(255,213,79,0.35); }
  50%      { box-shadow: 0 0 28px rgba(255,213,79,0.55); }
}
```

When the user taps `[+]` on the tutorial task, after the CascadeCard fires,
the `is_tutorial` flag clears so it doesn't pulse forever.

---

## Step 3: Free first pull

After the user scores the tutorial directive, a follow-up modal:

```tsx
<motion.div ... >
  <Icon name="summon" size={48} weight="duotone" />
  <h2 className="t-h1">A summon awaits.</h2>
  <p className="t-body">
    The first pull is on the house. Visit the Altar to summon your starting monster.
  </p>
  <button className="ss-btn ss-btn-primary" onClick={() => nav({ to: "/altar" })}>
    Open the Altar
  </button>
</motion.div>
```

### Server change — first pull is free

In `gacha-client.ts > pullBanner`, add a check:

```ts
// If this is the user's first pull EVER, skip the cost and guarantee a Rare+
const { count } = await supabase
  .from("pulls")
  .select("id", { count: "exact", head: true })
  .eq("user_id", user.id);

const isFirstPull = (count ?? 0) === 0;
const totalCost = isFirstPull ? 0 : (count === 1 ? cost1 : cost10);
```

For the rarity roll on first pull, override the result of `rollRarity()` to
`"rare"` for at least one of the 10 in a x10 pull. Easy way:

```ts
if (isFirstPull && i === 0) rolledRarity = "rare";
```

This means a brand new user does ONE 10-pull and ends with at least one Rare
monster — feels generous, hooks them.

---

## Step 4: Compass takes over

After all of the above completes, the user lands back on the Hub with:
- 1 tutorial directive (still in their list, no longer pulsing)
- 1+ monsters in their collection
- Profile flag set

The Compass component now starts firing real suggestions. Onboarding is done.

---

## Acceptance checks

- [ ] New user signing up sees the welcome carousel within 1 second of Hub load
- [ ] After completing the carousel, exactly one tutorial directive is in their
      task list, with a glowing pulse
- [ ] Scoring the tutorial directive fires the cascade with all expected events
      (gold, xp, growth ticks if matching monster on team)
- [ ] Tutorial pulse stops after the first score
- [ ] After scoring, the "Open the Altar" follow-up modal appears
- [ ] First pull is free AND includes at least one Rare in the 10-pull
- [ ] Re-loading the app does NOT re-trigger onboarding for the same user
- [ ] DB has `onboarding_completed_at` set and `tutorial_directive_id` populated

## Tasks for agent

1. Write the migration `supabase/migrations/20260621000000_onboarding.sql` with
   the two new profile columns. Run `supabase db push`.
2. Create `src/components/game/Onboarding.tsx` per the spec.
3. Add `completeOnboarding()` to a new `src/lib/game/onboarding-client.ts` and
   export from `supabase-api.ts`.
4. Mount the Onboarding component on the Hub conditionally.
5. Add the tutorial-pulse logic to `TaskCard.tsx`.
6. Modify `gacha-client.ts > pullBanner` to handle the free-first-pull rule.
7. Test end-to-end: sign up a new account, walk through the flow, confirm DB
   state after each step.
8. Commit.

## Out of scope

- **No video / animations beyond the existing motion system.** Onboarding
  should not be a 3-minute cutscene.
- **No "skip everything" button.** The user can dismiss each step but the
  tutorial directive still appears in their list. It's a soft commitment.
- **Don't gate other features behind onboarding completion.** They can roam.
- **Don't internationalize the onboarding strings yet.** English only for v1.
  Add an i18n layer later if/when you internationalize.
