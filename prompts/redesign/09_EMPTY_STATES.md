# 09 — Empty States

> **Depends on:** [03_ICON_SYSTEM](./03_ICON_SYSTEM.md), [04_TYPOGRAPHY_SYSTEM](./04_TYPOGRAPHY_SYSTEM.md).

## The problem

Every "no X yet" message in the app is functional and dead:

> "No habits yet"  
> "No active quests"  
> "No fallen yet"  
> "No journal entries yet"  
> "No memorial yet"  
> "No equipment yet"  
> "No monsters yet"

Empty states are the moment a player decides whether your game has soul. These
say "this is a feature waiting for content." A polished game writes them as
_evocative_, _inviting_, and _diegetic_ — they speak from inside the world.

## The fix

Audit every empty-state string in the codebase. Rewrite each with the voice
from the chosen identity proposal (file 01). Each empty state has:

1. **A small evocative line** — diegetic, not functional
2. **An icon** — from the icon set (file 03), large and dim
3. **A CTA** — the next concrete action
4. **Optional flavor** — a quiet second sentence

---

## The voice library

By identity:

### Proposal A — Burning Page (illuminated)

| Type            | Pattern                                          |
| --------------- | ------------------------------------------------ |
| Mostly absent   | "The page is blank. Let it burn into something." |
| Recently empty  | "Once there was an entry here. Begin again."     |
| Never started   | "What you do shall be written. Nothing yet."     |
| Awaiting action | "The page waits, ink at the ready."              |

### Proposal B — Lantern Garden (pixel)

| Type            | Pattern                                 |
| --------------- | --------------------------------------- |
| Mostly absent   | "The grove is quiet. Nothing yet."      |
| Recently empty  | "The fire's out. Light another."        |
| Never started   | "First steps make the path."            |
| Awaiting action | "Your lantern is dim. Time to fill it." |

### Proposal C — Iron Court (gothic)

| Type            | Pattern                 |
| --------------- | ----------------------- |
| Mostly absent   | "No record."            |
| Recently empty  | "The ledger is closed." |
| Never started   | "Unwritten."            |
| Awaiting action | "Standing by."          |

---

## The audit — every empty state in the codebase

Grep for empty-state strings:

```bash
grep -rnE 'No [a-z]+ yet|No active|No journal|No memorial|No equipment' \
  src --include='*.tsx'
```

Expected matches (these are the strings to rewrite):

### Hub

**File:** `src/routes/_authenticated/index.tsx`

```tsx
// BEFORE
<div className="text-center py-16 ...">
  <div className="text-lg mb-1" style={{ fontFamily: "'Cinzel',serif" }}>No habits yet</div>
  <div className="text-sm">Forge your first directive to start earning Gold and XP.</div>
</div>

// AFTER (Proposal B example)
<EmptyState
  icon="morning"
  title="The grove is quiet."
  body="Forge one small directive. Something you'd do anyway."
  cta={{ label: "Forge a Directive", onClick: () => setDialogOpen(true) }}
/>
```

### Quests

**File:** `src/routes/_authenticated/quests.tsx`

```tsx
// BEFORE
<div className="text-center py-16 ...">
  <p className="text-3xl mb-2">⚔</p>
  <p className="mb-3">No active quests.</p>
  <button>Forge a Quest</button>
</div>

// AFTER
<EmptyState
  icon="crown"
  title="No boss has been named."
  body="Choose one. Three months from now, what will you have slain?"
  cta={{ label: "Name the Boss", onClick: () => setTab("forge") }}
/>
```

### Quests slain

```tsx
// BEFORE
<p className="text-center py-16 text-sm" ...>
  No quests slain yet. Forge one and grind it to zero.
</p>

// AFTER
<EmptyState
  icon="crown"
  title="The wall is bare."
  body="When you slay your first quarterly boss, the head hangs here."
/>
```

### Codex — Heatmap

**File:** `src/routes/_authenticated/codex.tsx`

The heatmap has data even on day 1 (all empty cells), so no empty state.
But the journal tab can be empty:

```tsx
// BEFORE
<p className="text-center py-16 text-sm" ...>
  No journal entries yet. Reflect tonight.
</p>

// AFTER
<EmptyState
  icon="evening"
  title="The page hasn't seen ink."
  body="An evening reflection takes ninety seconds. The first one matters most."
/>
```

### Codex — Awakening Log

```tsx
// BEFORE
<p ...>No skills awakened yet. Keep grinding.</p>

// AFTER
<EmptyState
  icon="sparkle"
  title="Nothing has awakened in your company."
  body="Discipline triggers awakenings. Your monsters are listening."
/>
```

### Trial — Memorial

**File:** `src/routes/_authenticated/trial.tsx`

```tsx
// BEFORE
<p ...>No fallen yet. May it stay that way.</p>

// AFTER
<EmptyState
  icon="memorial"
  title="No name has been carved."
  body="May the wall stay bare."
/>
```

### Battle — History

**File:** `src/routes/_authenticated/battle.tsx`

```tsx
// BEFORE — Battle screen just doesn't show the history div when empty
// AFTER — explicit empty state

<EmptyState
  icon="battle"
  title="No battles fought."
  body="When you climb the Tower, every fight goes in the ledger here."
/>
```

### Compendium

**File:** `src/routes/_authenticated/compendium.tsx`

```tsx
// BEFORE
<div className="text-center py-16" ...>
  <p className="text-4xl mb-2">📖</p>
  <p>No monsters match your filters.</p>
</div>

// AFTER
<EmptyState
  icon="tome"
  title="The bestiary is silent on this query."
  body="Loosen your filters, or summon a kind of monster you haven't met."
/>
```

### Forge

**File:** `src/routes/_authenticated/forge.tsx`

If no recipes unlocked:

```tsx
<EmptyState
  icon="stone"
  title="The anvil is cold."
  body="Reach Level 5 to unlock your first recipe."
/>
```

### Bazaar / Shop

**File:** `src/routes/_authenticated/bazaar.tsx`

If a category is empty:

```tsx
// BEFORE
<div ...>No items in this category yet.</div>

// AFTER
<EmptyState
  icon="gold"
  title="The merchant has nothing of that kind today."
  body="Try the other tabs. Or check back tomorrow."
/>
```

### Profile — Equipment

**File:** `src/routes/_authenticated/profile.tsx`

```tsx
// BEFORE
<p ...>No equipment yet. Visit the Shop!</p>

// AFTER
<EmptyState
  icon="stone"
  title="You stand unarmored."
  body="The Bazaar and the Forge both make gear. The Forge is cheaper."
/>
```

### Profile — Inventory

```tsx
// BEFORE
<p ...>Inventory empty. Complete tasks to earn drops!</p>

// AFTER
<EmptyState
  icon="sparkle"
  title="Your satchel is empty."
  body="Tasks drop materials, eggs, food, and rarities. Keep moving."
/>
```

### Profile — Pets

Probably never empty for an active user, but for new ones:

```tsx
<EmptyState
  icon="bond"
  title="No companion has chosen you."
  body="Score 10 tasks and an egg may find its way to your inventory."
/>
```

### Guild

**File:** `src/routes/_authenticated/guild.tsx`

```tsx
// BEFORE
<p className="text-4xl mb-2">🍺</p>
<p ...>No guild yet</p>
<p ...>Find your Vanguard.</p>

// AFTER
<EmptyState
  icon="crown"
  title="You walk alone."
  body="Browse a guild or forge your own (500 Crystals)."
  cta={{ label: "Browse Guilds", onClick: () => setTab("browse") }}
/>
```

### Fusion

**File:** `src/routes/_authenticated/fusion.tsx`

```tsx
<EmptyState
  icon="sparkle"
  title="The Matrix is dormant."
  body="Summon two or more monsters to begin fusing."
/>
```

---

## The shared component

### File: `src/components/ui/EmptyState.tsx`

```tsx
import { motion } from "motion/react";
import { trans } from "@/lib/ui/motion-tokens";
import { Icon, type IconName } from "@/components/ui/Icon";

export function EmptyState({
  icon,
  title,
  body,
  cta,
}: {
  icon: IconName;
  title: string;
  body?: string;
  cta?: { label: string; onClick: () => void };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={trans.itemIn}
      className="ss-card flex flex-col items-center text-center py-12 px-6"
      style={{ borderStyle: "dashed", borderColor: "rgba(255,255,255,0.08)" }}
    >
      <div className="mb-3 opacity-60">
        <Icon name={icon} size={40} weight="regular" />
      </div>
      <h3 className="t-h3 mb-2" style={{ color: "var(--ss-ink-primary)" }}>
        {title}
      </h3>
      {body && <p className="t-lore max-w-sm">{body}</p>}
      {cta && (
        <button onClick={cta.onClick} className="ss-btn ss-btn-primary mt-5">
          {cta.label}
        </button>
      )}
    </motion.div>
  );
}
```

---

## Acceptance checks

- [ ] No bare "No X yet" string anywhere in the routes folder
- [ ] All 13+ empty-state locations use the `<EmptyState>` component
- [ ] Voice matches the chosen identity proposal
- [ ] Each EmptyState has at least an icon and title; body is optional
- [ ] Build passes

```bash
# Quick audit
grep -rnE '"No [a-z]+ yet"|>No [a-z]' src/routes --include='*.tsx'
# Expect: 0 results
```

## Tasks for agent

1. Create `src/components/ui/EmptyState.tsx` per the spec.
2. Walk each route file in the audit list above. For each:
   - Replace the inline empty-state markup with `<EmptyState>`.
   - Use the chosen voice (Proposal A/B/C) — see voice library.
3. Test by viewing each screen with the appropriate empty state.
4. Commit per route file.

## Out of scope

- **Don't add illustrations to empty states.** Icon + words is enough.
- **Don't internationalize empty-state strings yet.**
- **Don't add empty states to non-route components** (modals, popovers) —
  those are handled inline by their parent.
- **Don't change the loading states.** Different beast, different file.
