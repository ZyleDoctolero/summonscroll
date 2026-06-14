# SUMMONSCROLL — MASTER REQUIREMENTS GUIDE
**Repo:** `SummonScroll-Fresh` · **Stack:** React 19 · TypeScript · Supabase · Vite · Vercel  
**Genre:** Habit-Tracking Gacha RPG · **Aesthetic:** Proposal D — "Summoner's Console" (Genshin / Honkai / Arknights)  
**Version:** 3.0 — Unified from codebase audit + Elite Agent Roster + Master Improvement Guide  
**Status:** Requirements only. No implementation. Each item is an isolated, actionable unit.

> *"A summoner does not fight alone. They command legions."*  
> This is the single source of truth for all SummonScroll improvements, owned by five specialist agents, grounded in the actual codebase.

---

## TERMINOLOGY GLOSSARY

Before reading further: the codebase uses specific terms. These are authoritative — the Master Guide's alternate terms are in parentheses.

| Codebase Term | Master Guide Equivalent | Definition |
|---|---|---|
| **Realm** | "Faction" | The 12 world-zones (Ancient Vaults, Chaos Wastes, etc.). Monsters belong to realms. |
| **Monster** | "Character" | The collectible entities players summon and bond with. |
| **Task** | "Quest" | The user-created habit/daily/todo that drives the core loop. |
| **Island** | "Base/Home" | The spatial screen where the player places their monster team. |
| **Altar** | "Summon Gate" | The gacha/banner screen. |
| **Compendium** | "Collection" | The bestiary / full monster catalog. |
| **Gold** | "Currency" | The standard reward from task completion. |
| **Crystals** | "Premium Currency" | Gems used for banner pulls. Earned at 25-30% chance per task. |
| **Pact Seals** | "Premium Seals" | Ultra-rare currency for the `pact_seal` banner (30-day streak gate). |
| **Score Task** | "Complete Quest" | The main scoring action — maps to `scoreTask()` in `supabase-api.ts`. |
| **GrowthTick** | "Bond Tick" | The bond increment returned by `scoreTask()` when stat tags match. |

---

## TABLE OF CONTENTS

1. [Project Overview & Grounded State](#1-project-overview--grounded-state)
2. [Core Loop — The Spine of Everything](#2-core-loop--the-spine-of-everything)
3. [Agent 1 — UI/UX Requirements](#3-agent-1--uiux-requirements)
4. [Agent 2 — Systems Architecture Requirements](#4-agent-2--systems-architecture-requirements)
5. [Agent 3 — Game Design Requirements](#5-agent-3--game-design-requirements)
6. [Agent 4 — QA & Test Requirements](#6-agent-4--qa--test-requirements)
7. [Agent 5 — Arbiter: Conflicts & Priority](#7-agent-5--arbiter-conflicts--priority)
8. [External Inspiration Reference](#8-external-inspiration-reference)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [Design Token Reference Card](#10-design-token-reference-card)
11. [Quick-Deploy Agent Reference](#11-quick-deploy-agent-reference)

---

## 1. PROJECT OVERVIEW & GROUNDED STATE

### What SummonScroll Is

SummonScroll is a **habit-tracking application gamified as a dark fantasy gacha RPG**. Players complete real-world habits (tasks) to earn currency, summon monsters from 12 realms, build bonds with their collection, and progress through a mythological narrative called *the Page*.

### Stack (Verified)

| Layer | Technology | Key Files |
|-------|-----------|-----------|
| Frontend | React 19 + TypeScript (Vite 7) | `src/routes/`, `src/components/` |
| Styling | Vanilla CSS + CSS variables (no Tailwind class-first) | `index.css` |
| Components | shadcn/ui (Radix primitives) | `components.json` |
| State | TanStack Query v5 + TanStack Router | `src/lib/` |
| Backend | Supabase (PostgreSQL + client-side mutations) | `src/lib/game/supabase-api.ts` |
| Hosting | Vercel | `vercel.json` |
| Package | Bun | `bun.lock` |
| Motion | Motion (Framer) | `motion/react` |
| Audio | Web Audio API (synth) | `src/lib/ui/sounds.ts` |

### Screens (15 routes, all under `/_authenticated/`)

`index` · `altar` · `battle` · `bazaar` · `codex` · `compendium` · `expeditions` · `forge` · `fusion` · `guild` · `island` · `profile` · `quests` · `trial` · (route.tsx)

### Game Systems (17 client modules in `src/lib/game/`)

`supabase-api` · `gacha-client` · `gacha.constants` · `battle-client` · `trial-client` · `expedition-client` · `awakening-client` · `promotion-client` · `forge-client` · `guild-client` · `rituals-client` · `quests-client` · `companion-client` · `codex-client` · `onboarding-client` · `shop-client` · `constants`

### Gacha Engine: Confirmed No-Pity Design

> From `gacha.constants.ts` line 2: *"No pity, no soft pity: every pull is an independent roll."*

The pull system is pure weighted random. **No pity counter. No guaranteed floor.** The Master Guide's framing is correct — any earlier mention of pity counters or pity bars in design docs is superseded by this. The `pulls` table logs lifetime pulls per player per banner; this is a **dedication badge**, not a progress bar toward a guarantee.

### Current Gaps (Consolidated from Audit)

| Domain | Gap | Severity |
|--------|-----|----------|
| Logic | `scoreTask()` has no atomic transaction — race condition on multi-tab | Critical |
| Logic | `runCronIfNeeded()` runs client-side — double-damage possible on two tabs | Critical |
| Logic | Bond ticks rely on `task.tags` — 100% of user-created tasks have no tags → dead system | Critical |
| Logic | `listAllMonsters()` unbounded — silent 1000-row cap breaks Compendium at scale | High |
| Logic | Death penalty wipes 100% gold — catastrophic, unrecoverable | High |
| UI/UX | 9/15 screens have no atmosphere backdrop (flat `--bg-deep` only) | High |
| UI/UX | `RARITY_COLOR` map uses hardcoded hex injected via inline `style={}` | High |
| UI/UX | No mobile bottom navigation on ≤768px | High |
| UI/UX | Reveal ceremony: all rarities use the same spring animation | Medium |
| Design | Island is visually passive — no loop connection, no passive income | High |
| Design | Battle: zero player agency — simulation the player watches | Medium |
| Design | Void Frontier 30-day streak gate is invisible in UI | Medium |
| Design | Side quest templates are hardcoded; don't adapt to player state | Medium |
| QA | Zero automated tests | High |
| QA | `ascendMut` in `island.tsx` writes directly to `profiles.gold` client-side | High |

---

## 2. CORE LOOP — THE SPINE OF EVERYTHING

**Every feature decision must strengthen at least one link in this chain. If it doesn't connect, it doesn't ship.**

```
┌──────────────────────────────────────────────────────────────────┐
│  Player completes real-world task (habit / daily / todo)         │
│    → Gold + XP earned immediately (visible reward)               │
│    → 25-30% chance: Crystal bonus drop                           │
│    → 30% chance: Realm Whisper fires (narrative feedback)        │
│    → Streak increments (momentum, loss-aversion)                 │
│    → Realm monsters gain bond ticks (narrative connection)       │
│    → Player accumulates Crystals → pulls from Altar              │
│    → Pure weighted roll — no floor, no guarantee                 │
│    → Monster summoned → placed on Island (ownership, identity)   │
│    → Island generates passive gold (idle reward)                 │
│    → Monster used in Battle → rewards → (back to task)           │
└──────────────────────────────────────────────────────────────────┘
```

**The world mythology that drives the copy for every link:**
> *"Before the worlds were named, there was a single Page — blank, infinite, listening. From it bled twelve realms. Each contains monsters that survived a different way of organizing existence. The Summoner draws creatures across realms not to conquer, but to understand what it means to live well. Every task completed adds an ink-stroke to the Page. Every monster bonded reflects a discipline mastered. The Bestiary is the world. To collect a creature is to learn its lesson."*

**The player is not "tracking habits." They are writing the Page.**

---

## 3. AGENT 1 — UI/UX REQUIREMENTS

*Chief UI/UX Designer — "The Architect of the Summoner's Console"*  
*Visual references: Genshin Impact · Honkai: Star Rail · Arknights · Nier: Automata*

---

### 3.1 [CRITICAL] Design Token System

**Problem:** `RARITY_COLOR` in `gacha.constants.ts` stores raw hex values injected via `style={{ border: '2px solid #...' }}` in `altar.tsx`. `VALUE_COLOR_HEX` in `constants.ts` similarly stores raw hex. These bypass the token system.

**Requirement:** Create or extend `/src/styles/tokens.css`. All color references in component files must reference CSS variables — no hex literals in `.tsx` or `.ts` files outside of `tokens.css` and `gacha.constants.ts` (which may retain hex as the source of truth that populates variables).

```css
/* ── BACKGROUNDS ── */
--bg-deep:      #0C0E14;
--bg-surface:   #13161F;
--bg-elevated:  #1A1E2A;
--bg-overlay:   #22273A;

/* ── TEXT ── */
--text-primary:   #F0EDE6;
--text-secondary: #A09D96;
--text-tertiary:  #6B6864;

/* ── BRAND ── */
--accent-gold:   #C89A3E;
--accent-void:   #7F77DD;
--accent-fire:   #E8583A;
--accent-ice:    #5AB4E5;
--accent-nature: #639922;

/* ── RARITY (sourced from RARITY_COLOR in gacha.constants.ts) ── */
--rarity-common:    #9E9E9E;
--rarity-uncommon:  #81C784;
--rarity-rare:      #4FC3F7;
--rarity-elite:     #FFB74D;
--rarity-epic:      #CE93D8;
--rarity-legendary: #FFD54F;
--rarity-mythic:    #FF8A65;
--rarity-ex:        #FFFFFF;

/* ── REALMS ── */
--realm-vaults:  #d4af3f;
--realm-chaos:   #E24B4A;
--realm-dark:    #7F77DD;
--realm-blight:  #888780;
--realm-wild:    #639922;
--realm-divine:  #378ADD;
--realm-haunted: #D4537E;
--realm-digital: #1D9E75;
--realm-elder:   #D85A30;
--realm-stellar: #4A6FA5;
--realm-myth:    #C89A3E;
--realm-iron:    #8B8B8B;

/* ── SPACING ── */
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;
--space-4: 16px;  --space-6: 24px;  --space-8: 32px;  --space-12: 48px;

/* ── RADIUS ── */
--radius-sm: 4px;  --radius-md: 8px;  --radius-lg: 12px;
--radius-xl: 20px; --radius-full: 9999px;
```

**Enforcement:** Add ESLint pattern to flag hex literals `/#[0-9A-Fa-f]{3,8}/` in `.tsx`/`.ts` files excluding `*.constants.ts` and `tokens.css`.

---

### 3.2 [CRITICAL] Motion Budget

**Problem:** `altar.tsx` uses an inline `spring` with hardcoded stiffness/damping. `index.tsx` uses inline `confetti` colors. `motion-tokens.ts` exists in `src/lib/ui/` — it must be the single source of truth and used consistently.

**Requirement:** Verify and enforce `motion-tokens.ts` is the only duration source across all 15 routes. Add the following if missing:

```ts
// src/lib/ui/motion-tokens.ts — add if not present
export const dur = {
  instant:   0,
  micro:     80,    // button press feedback
  fast:      150,   // hover states, icon swaps
  normal:    250,   // nav transitions, card reveals
  slow:      400,   // modal entrances, screen transitions
  reveal:    800,   // Common / Rare summon reveal
  ceremony:  1800,  // Epic / Legendary reveal
  epic:      3500,  // EX reveal — full world shake
} as const;

export const ease = {
  snappy:     [0.34, 1.56, 0.64, 1],  // card pop / overshoot
  smooth:     [0.4, 0, 0.2, 1],       // standard material
  decelerate: [0, 0, 0.2, 1],         // content entrance
  accelerate: [0.4, 0, 1, 1],         // content exit
} as const;
```

---

### 3.3 [HIGH] Typography System

**Requirement:** Add to global stylesheet. Never specify font families inline.

```css
/* src/styles/typography.css */
.font-display  { font-family: 'Cinzel Decorative', serif; font-weight: 700; letter-spacing: 0.05em; }
.font-heading  { font-family: 'Cinzel', serif; font-weight: 600; }
.font-stats    { font-family: 'Rajdhani', sans-serif; font-weight: 600; font-variant-numeric: tabular-nums; }
.font-body     { font-family: 'DM Sans', sans-serif; font-weight: 400; }
.font-lore     { font-family: 'DM Sans', sans-serif; font-style: italic; }
```

| Role | Font | Max per screen | Usage |
|------|------|---------------|-------|
| Display | Cinzel Decorative Bold | 1 | Logo, major screen title |
| Heading | Cinzel SemiBold | Unlimited | Section headers, card titles |
| Stats | Rajdhani SemiBold | Unlimited | Numbers, gold, XP, percentages |
| Body | DM Sans Regular | Unlimited | Descriptions, task text |
| Lore | DM Sans Italic | Unlimited | Whisper feed, realm voices |

---

### 3.4 [HIGH] Screen Atmosphere Requirements

**Problem:** 9 of 15 routes render on flat `--bg-deep` with no visual identity. A player cannot tell which screen they are on from the background alone.

**Requirement:** Every screen must pass the "2-second test" — identifiable within 2 seconds from the backdrop alone, with no nav or titles visible.

| Route | Atmosphere Required | Key Visual |
|-------|--------------------|----|
| `index` (Hub) | Dimensional tear, soft particle field | Realm shimmer overlay, Compass component prominent |
| `altar` | Ritual circle, banner art dominant, ink-glyph geometry | Glyph overlay behind banner; no white/light backgrounds |
| `compendium` | Bestiary grid with realm-colored card border glows | Realm filter tabs with realm color |
| `index` (Directives) | Scroll/parchment texture on task cards | Realm affinity icon on each task |
| `island` | Spatial zones (Front/Mid/Back), day/night cycle | Monsters visually placed, not listed |
| `battle` | Arena HUD, animated combat log | Realm of enemy visible in battle backdrop |
| `fusion` | Three-slot alchemical UI, orbital diagram | Energy convergence animation on slot 3 fill |
| `trial` | Void corruption edge, darkness closing in | Boss HP bar prominent, arena floor visible |
| `guild` | Shared hall, pact brotherhood motif | Party HP pool visible as central element |
| `quests` | Parchment quest board | Pinned scroll cards, faction-ink markers |
| `bazaar` | Underground market, lantern glow | Price tags in `--font-stats` |
| `codex` | Illuminated record book | Heatmap grid as "ink on page" metaphor |
| `expeditions` | World map, fog-of-war zones | Stamina bar as compass needle |
| `forge` | Blacksmith's sanctum, ember glow | Anvil silhouette, material icon grid |
| `profile` | Commander's scroll, personal crest | Stat bars as rune-fills |

---

### 3.5 [HIGH] Empty State Standards

**Problem:** Multiple screens still show "No X yet" or plain system messages.

**Requirement:** All empty states must advance the mythology. No system language.

```tsx
// BAD — system language
<p>No monsters yet.</p>

// GOOD — mythology voice
<EmptyState
  icon={<ScrollIcon />}
  headline="The Page Awaits Its First Ink"
  body="No summoner begins with a full roster. Your first pull awaits at the Altar."
  action={<Button href="/altar">Open the Altar</Button>}
/>
```

**Realm-specific empty state copy (when Compendium is filtered to a realm with no owned monsters):**

| Realm | Empty State Copy |
|-------|-----------------|
| Ancient Vaults | "The Vaults hold 515 creatures. None have answered your call. Return to the Altar." |
| Chaos Wastes | "The Wastes are silent. Earn the noise. Pull from the Chaos banner." |
| The Outer Dark | "Even the Void must be earned. Meditate and return." |
| Wild Frontier | "The Frontier waits for the one who shows up. Complete a movement habit first." |
| Void Frontier | "The Stellar gate is sealed. Build a 30-day streak to break it." |

---

### 3.6 [HIGH] Summon Reveal Ceremony Tiers

**Problem:** `altar.tsx` uses one `spring` animation (`stiffness: 200, damping: 18`) for all rarities.

**Requirement:** Four distinct ceremony tiers, all using `dur` constants from `motion-tokens.ts`.

| Rarity | Duration | Animation | Required Elements |
|--------|----------|-----------|------------------|
| Common / Uncommon | `dur.normal` (250ms) | Fade + scale from 0.9 | Color burst matching rarity |
| Rare | `dur.slow` (400ms) | Slide up + glow ring | Crystal particle burst |
| Elite / Epic | `dur.reveal` (800ms) | Shatter reveal | GPU particle burst, realm-colored |
| Legendary | `dur.ceremony` (1800ms) | Full-screen flash + gold rain | Fanfare audio, screen shake |
| Mythic | `dur.ceremony` (1800ms) | Void rift warp | Distortion shader + bass drop |
| EX | `dur.epic` (3500ms) | World shake + bloom | Full-screen particle explosion, legendary theme |

---

### 3.7 [HIGH] Mobile Requirements

- All interactive elements: **≥ 44px** touch target at 375px viewport
- All modals on **≤ 768px**: bottom-up Vaul drawer, never centered overlay
- No horizontal scroll on any screen at 375px
- Bottom navigation bar (5 slots): **Hub · Altar · Island · Battle · More** (sheet)
- Form validation lives **inside** the bottom drawer — not a blocker to implement drawers

---

### 3.8 [MEDIUM] Lifetime Pull Count Display (Not a Pity Bar)

**Requirement:** Show the player's lifetime pull count on the current banner. This is a **dedication badge** — framed as accomplishment, never as "X pulls to go."

```tsx
// CORRECT — dedication framing
<span className="font-stats text-secondary">374 pulls invested</span>

// WRONG — guarantee framing (forbidden)
<ProgressBar value={74} max={100} label="74 / 100 pulls to Legendary" />
```

The `pulls` table already logs every pull per banner. Query: `COUNT(*) WHERE banner_id = selectedBanner`.

---

### 3.9 [MEDIUM] Icon Discipline

- Zero raw emojis anywhere in the UI — cardinal sin
- All icons from Lucide React (already in `package.json`) or custom SVG sprites
- Touch targets ≥ 44px

**Audit command (PowerShell):**
```powershell
# Find non-ASCII characters in component files
Select-String -Path "src\components\**\*.tsx" -Pattern "[^\x00-\x7F]" -Encoding UTF8
```

---

## 4. AGENT 2 — SYSTEMS ARCHITECTURE REQUIREMENTS

*Senior Game Logic Architect — "The Engineer of Consequence"*  
*Stack: TypeScript · Supabase (PostgreSQL + client RPC) · TanStack Query v5*

---

### 4.1 [CRITICAL] The Golden Rule: Server Authority

**The client never calculates game math. The client never writes directly to game-state tables.**

Currently violated in:
- `island.tsx` lines 55-68: direct `supabase.from("profiles").update({ gold: ... })` client-side
- `gacha-client.ts` line 93: direct `supabase.from("profiles").update(currencyUpdate)` client-side
- `gacha-client.ts` line 98: direct `supabase.from("user_monsters").insert(newInserts)` client-side
- `supabase-api.ts` `scoreTask()`: 15+ sequential writes, no transaction

**Requirement:** All mutations that change `profiles`, `user_monsters`, `tasks`, `pulls`, or `inventory` must go through a Supabase RPC (PostgreSQL function) or Supabase Edge Function with explicit row-locking.

---

### 4.2 [CRITICAL] `scoreTask()` Needs Atomic Transaction

**File:** `supabase-api.ts` lines 308–575  
**Problem:** Reads profile and task simultaneously, then executes 3–6 sequential writes. On multi-tab or rapid re-score:
- Two reads see the same `combo_count` → both write conflicting increments → second write silently overwrites the first
- Two reads see the same `hp` → death penalty can fire twice → double level loss

**Requirement:** Move the core scoring logic to a Supabase RPC: `score_task(p_task_id uuid, p_direction text) → jsonb`

The RPC must:
1. `SELECT ... FOR UPDATE` on `profiles` row to acquire a row lock
2. Perform all calculations in a single PostgreSQL function call
3. Return a typed result matching the current return shape
4. Client-side `scoreTask()` becomes a thin wrapper around `supabase.rpc('score_task', {...})`

**Typed return contract (add to `/src/types/rpc.ts`):**
```ts
export type ScoreTaskResult = {
  ok: boolean;
  noop?: boolean;
  reward: { gold: number; xp: number; crystals: number; hp: number } | null;
  isPositive: boolean;
  died: boolean;
  drop: { type: string; name: string } | null;
  leveledUp: boolean;
  growthTicks: Array<{ user_monster_id: string; monster_name: string; stat: string; realm_name: string | null }>;
  awakenings: Array<{ monsterName: string; skillName: string; flavor: string }>;
  goalDamage: unknown;
  comboCount: number;
  comboMultiplier: number;
};
```

---

### 4.3 [CRITICAL] Client-Side Cron Must Move to Server

**File:** `supabase-api.ts` `runCronIfNeeded()` lines 101–256  
**Problem:** The daily reset (streak, HP damage, daily resets, side-quest generation) runs on the client at login. Two simultaneous browser tabs = two crons = double HP damage.

**Requirement:**
1. Create Supabase Edge Function: `POST /functions/v1/daily-cron`
2. Triggered by: `pg_cron` at `00:05 UTC` daily (catches any player who doesn't log in)
3. Also callable from client login with idempotency guard: `SELECT cron_ran_today WHERE user_id = $1`
4. Edge Function uses a single PostgreSQL transaction for the full daily reset
5. Client-side `runCronIfNeeded()` becomes: check `last_cron_date === today` → if not, call Edge Function → receive result

---

### 4.4 [CRITICAL] Bond Tick System Is Dead — Fix Realm Binding

**File:** `supabase-api.ts` lines 502–540  
**Problem:** `growthTicks` only fire when `task.tags` contains `["str", "int", "con", "per"]`. `TaskFormDialog` has no tag field. Every user-created task has `tags = []`. Bond system fires for 0% of user tasks.

**Requirement:**
1. Add `realm_id INTEGER REFERENCES realms(id)` (nullable) to the `tasks` table
2. `TaskFormDialog` adds optional "Realm Affinity" selector (realm name + icon)
3. Bond tick fires when `task.realm_id === monster_realm_id` (1.0× tick) or any realm match in collection (0.1× tick)
4. Keep the stat-tag system as an **additional** bonus channel — don't remove it, just stop relying on it exclusively
5. Migration: `ALTER TABLE tasks ADD COLUMN realm_id integer REFERENCES realms(id) ON DELETE SET NULL`

---

### 4.5 [HIGH] `listAllMonsters()` Needs Pagination

**File:** `supabase-api.ts` lines 675–683  
**Problem:** `CURRENT_RELEASED_MAX = 150` in `constants.ts` limits the query to the first 150 monsters. But Supabase's default page size is 1000 rows. When `CURRENT_RELEASED_MAX` is raised beyond 1000, monsters beyond row 1000 will silently disappear from the Compendium with no error.

**Requirement:** Add pagination. Compendium must support infinite scroll or explicit pagination.

```ts
export async function listAllMonsters(page = 0, pageSize = 100) {
  const { data, error, count } = await supabase
    .from("monsters")
    .select("*, realms(name, icon)", { count: "exact" })
    .lte("bestiary_id", CURRENT_RELEASED_MAX)
    .order("realm_id")
    .order("rarity")
    .range(page * pageSize, (page + 1) * pageSize - 1);
  if (error) throw error;
  return { monsters: data ?? [], total: count ?? 0, page, pageSize };
}
```

---

### 4.6 [HIGH] Death Penalty Redesign

**File:** `supabase-api.ts` lines 435–443  
**Problem:** On death, `newGold = 0` wipes 100% of accumulated gold in a single action. This is catastrophic for a habit app — real players who miss a few dailies lose everything accumulated from weeks of effort. Per habit psychology research, punishment must be survivable or players churn instead of recovering.

**Requirement:**
- Change death gold penalty to **50% loss** (`newGold = Math.floor(profile.gold * 0.5)`)
- Add "Soul Contract" item: costs 500 Crystals, negates the next death event (apply at death check before gold wipe)
- Death still resets level by 1 — that remains the meaningful penalty
- Add `death_prevented: boolean` to the score task return for UI to display the Soul Contract animation

---

### 4.7 [HIGH] `ascendMut` in `island.tsx` — Remove Direct Client Write

**File:** `island.tsx` lines 47–84  
**Problem:** Ascension writes directly to `profiles.gold` and `inventory` from the client. No server-side ownership validation, no atomic transaction, exploitable via race condition.

**Requirement:** Create Supabase RPC `ascend_monster(p_monster_id uuid) → jsonb` that:
1. Validates `user_monsters.user_id = auth.uid()` (server-side ownership)
2. Checks `profiles.gold >= 1000` with `FOR UPDATE` lock
3. Checks inventory `realm_potion.quantity >= 5`
4. Atomically deducts gold, deducts potions, increments `ascension_level`
5. Returns `{ ok: boolean; newGold: number; newPotions: number; ascensionLevel: number }`

---

### 4.8 [HIGH] Drop System Realm Affinity

**File:** `supabase-api.ts` lines 460–500  
**Problem:** `realm_potion` drops are assigned from a random element list, ignoring the task's realm. A meditation habit drops a Chaos Wastes potion.

**Requirement:** Drop selection must prefer `task.realm_id`. If task has no realm, fall back to random. This closes the narrative loop (study habit → Ancient Vaults material).

---

### 4.9 Gacha Architecture: Confirmed Design

The following are confirmed correct in the current codebase. Document them; do not change.

```ts
// gacha.constants.ts — source of truth
// "No pity, no soft pity: every pull is an independent roll."
// Pull rates by banner type live in PULL_RATES constant.
// rates are SAFE to expose to the client (no hidden server-side rate modification)
// First pull guarantee: 10-pull has at least 1 Rare (first pull only, onboarding)
// EX rarity: gated to pact_seal and streak banners only
// Duplicate monster: +10 bond_percent (not currency; bond first)
```

---

### 4.10 [MEDIUM] Required Database Indexes

Audit current schema for these indexes. Add if missing:

```sql
CREATE INDEX IF NOT EXISTS idx_tasks_user_realm ON tasks(user_id, realm_id);
CREATE INDEX IF NOT EXISTS idx_user_monsters_realm ON user_monsters(user_id) 
  INCLUDE (monster_id, bond_percent);
CREATE INDEX IF NOT EXISTS idx_pulls_user_banner ON pulls(user_id, banner_id);
CREATE INDEX IF NOT EXISTS idx_monsters_realm_rarity ON monsters(realm_id, rarity);
CREATE INDEX IF NOT EXISTS idx_arena_battles_user ON arena_battles(user_id, player_won);
```

---

### 4.11 [MEDIUM] RPC Contract Standard

**Requirement:** Create `/src/types/rpc.ts`. Every existing and new Supabase RPC must have a matching TypeScript type here. No `any` in game API files.

```ts
// /src/types/rpc.ts — add all RPC return types here
export type ScoreTaskResult = { /* see 4.2 */ };
export type AscendMonsterResult = { ok: boolean; newGold: number; newPotions: number; ascensionLevel: number };
export type DailyCronResult = { ran: boolean; died: boolean; missedDailies: number; hpLost: number; freezesUsed: number };
// ... one type per RPC
```

---

### 4.12 Migration Standards

Every migration in `/supabase/migrations/` must be:

1. **Idempotent** — running twice produces no errors, no duplicate data
2. **Named clearly** — `20260615000000_add_tasks_realm_id.sql`, not `fix3.sql`
3. **Self-contained** — no dependency on application code to complete
4. **Tested** — run against clean schema AND schema that already has the change

---

## 5. AGENT 3 — GAME DESIGN REQUIREMENTS

*Lead Game Designer — "The Architect of the Dopamine Loop"*  
*References: Genshin Impact · Arknights · Habitica · Duolingo*

---

### 5.1 Realm–Task–Monster Emotional Contract

Realms are the habit categorization system expressed as world-building. Every task must belong to a realm. Every monster belongs to a realm. The player's emotional contract is:

| Realm | Habit Domain | Emotional Contract | Accent Token |
|-------|-------------|-------------------|--------------|
| Ancient Vaults | Study / Reading | "Every page I read adds ink to the Vaults." | `--realm-vaults` |
| Chaos Wastes | Strength Training | "Every rep is a blow struck in the Wastes." | `--realm-chaos` |
| The Outer Dark | Meditation | "Stillness is a weapon. Silence is the Void." | `--realm-dark` |
| Blighted Expanse | Sleep / Recovery | "Rest is not weakness. The Blight rewards patience." | `--realm-blight` |
| Wild Frontier | Exercise / Movement | "The Frontier rewards those who show up." | `--realm-wild` |
| Divine Threshold | Mindfulness | "The breath comes. The breath goes." | `--realm-divine` |
| Haunted Veil | Night habits | "You came back. Most don't." | `--realm-haunted` |
| Digital Nexus | Skill / Tech work | "Every system built strengthens the Nexus." | `--realm-digital` |
| Elder Realm | Nutrition / Wellness | "You came hungry. We have soup." | `--realm-elder` |
| Void Frontier | Ambitious goals | "Only 30-day streaks open the Stellar gate." | `--realm-stellar` |
| Myth Eternal | Creative pursuits | "This is older than you think. So are you." | `--realm-myth` |
| Iron Dominion | Discipline / Routines | "This task. I will finish it. With you." | `--realm-iron` |

**Requirement:** Audit `data/` directory. Every monster must have a `realm_id`. Every task template must suggest a `realm_id`. Orphaned records are a game design bug.

---

### 5.2 [HIGH] Island Passive Income — Close the Dead Loop Link

**Problem:** The Island is a gallery with zero mechanical effect. Players place monsters but gain nothing from placement.

**Requirement — Island Passive Income System:**
- Monsters on the Island (i.e., `is_on_team = true`) generate passive gold per hour
- Rate formula: `passive_rate = (bond_percent / 100) * rarity_multiplier * 0.5` gold/minute
- Rarity multiplier: Common=1 · Uncommon=1.2 · Rare=1.5 · Elite=2 · Epic=3 · Legendary=5 · Mythic=8 · EX=15
- Income accumulates while the player is away (stored in `pending_passive_gold` on `profiles`)
- Harvesting triggers a Realm Whisper from the highest-bond monster on team
- UI: Island shows a "harvest pending" indicator when `pending_passive_gold > 0`
- Inspired by osu!'s always-on passive scoring philosophy: the game rewards you even offline

---

### 5.3 [HIGH] Void Frontier 30-Day Gate — Make It Visible

**Problem:** The Pact Seal banner (Void Frontier realm) requires a 30-day consecutive streak. This is the game's most exciting long-term goal. It is invisible in the current UI.

**Requirement:**
- Profile screen prominently shows "Void Frontier Seal: Day X / 30"
- Progress states:
  - Day 0–6: "The Stellar gate is sealed. Begin your streak."
  - Day 7: "The gate stirs. 23 days remain."
  - Day 14: "Halfway. The Void Frontier notices your discipline."
  - Day 21: "The seal weakens. 9 days remain."
  - Day 30: Full-screen ceremony — Pact Seal awarded (`pact_seals += 1`), Void Frontier banner unlocked
- This progress bar is as visible as the health bar — not hidden in a tooltip or settings page

---

### 5.4 [MEDIUM] Battle Agency — Manual Mode Option

**Problem:** `startArenaBattle(mode, floor)` resolves entirely server-side. The player watches a log. Zero agency.

**Requirement — Manual Battle Mode (optional, parallel to existing Auto mode):**
- Battle presents 3 choices per turn: **Strike · Guard · Invoke**
- Player selects; client sends `{ choices: ["strike", "guard", "invoke", ...] }` to RPC
- Server validates cooldown rules and applies damage modifiers (Strike +20% damage, Guard +20% defense, Invoke = use team's realm skill)
- Existing auto battle remains as the default for players who don't want manual mode
- Manual mode reward bonus: **+15% gold** on victory (incentivizes engagement)
- Inspired by Lichess's server-authoritative move validation: client proposes a legal choice, server confirms and advances state

---

### 5.5 [MEDIUM] Realm Pulse on Task Completion

**Problem:** The habit–realm–monster connection is entirely invisible. Players see "+10 Gold" not "Ancient Vaults bond strengthened."

**Requirement — Realm Pulse System:**
- On task completion with a `realm_id`: screen edge pulses with `--realm-{name}` color for 400ms (`dur.slow`)
- `growthTicks[]` in score response must include `realm_name`; each tick displays as a WhisperFeed line: "*[Monster Name] grows closer.*"
- Hub shows a "realm affinity summary" after completing 3+ tasks: "Today's ink: mostly Ancient Vaults."
- New component: `<RealmPulse realmId={number} />` — CSS animation, no canvas

---

### 5.6 [MEDIUM] Dynamic Side Quest Templates

**Problem:** The 5 side quest templates in `supabase-api.ts` lines 203–210 are hardcoded and randomly shuffled. "Pull from the Altar" is a useless quest for a player with 0 crystals.

**Requirement:**
- Move templates to `side_quest_templates` DB table with a `weight` and `condition` column
- Scoring function selects the 3 highest-relevance quests for the player's current state:
  - If `profile.crystals < 100` → altar quest is suppressed
  - If `user_monsters.length < 3` → team-building quest is boosted
  - One quest per day must be themed to the player's most-completed realm
- This is the Utility AI pattern from game AI literature: score each option, pick the best N

---

### 5.7 Engagement Architecture

| Timeline | Required Experience |
|----------|---|
| Day 1 | Free first pull → Tutorial task → First bond tick → First Realm Whisper |
| Week 1 | Streak established → Island populated with ≥1 monster → Passive income first harvest |
| Month 1 | First 30-pull milestone (dedication badge) · First Epic from pure RNG · Realm affinity sense |
| Month 3 | First Legendary reveal ceremony · Bond milestone → Awakening · Void Frontier streak awareness |
| Year 1 | Full roster sense · Fusion discovery · Trial of Echoes progression · Guild raid accountability |

---

### 5.8 The Never-Empty-Handed Rule

Players must always have something to do. Required fallback cascade:

1. No tasks available → Suggest creating a task from a realm template
2. All tasks complete today → Show bond progress + "Return tomorrow" lore line
3. Crystals accumulating → Highlight Altar with current lifetime pull count
4. Island has open slots → Suggest placing a monster
5. Pending passive gold → Prompt harvest on Island

---

### 5.9 Voice Line Requirements

Realm Whispers must fire on **≥30% of positive task completions**.

**Requirement:**
- Source from `realms.lore_lines` (DB column) — not the hardcoded `REALM_VOICES` map in `index.tsx`
- Whisper includes monster name when a `growthTick` fires: "*[Monster Name] heard you.*"
- Fallback when task has no realm: Page itself speaks (metacosmology voice)
- Player can mute; cannot disable entirely

**Minimum voice line sets needed per realm (for DB seeding):**
- Task completion: ×5 variants minimum
- Streak milestone (Day 7, Day 30, Day 100): ×1 variant each
- Bond milestone (25%, 50%, 75%, 100%): ×1 variant each
- Monster acquired: ×1 "welcome home" line

---

## 6. AGENT 4 — QA & TEST REQUIREMENTS

*Principal QA Engineer — "The Player Who Tries to Break It"*

---

### 6.1 [CRITICAL] Known Bugs (Verified in Audit)

| Bug | File | Severity | Root Cause |
|-----|------|----------|-----------|
| BUG-01: Double cron on multi-tab | `supabase-api.ts:101` | Critical | No row lock on `last_cron_date` check |
| BUG-02: `scoreTask` race condition | `supabase-api.ts:308` | Critical | No transaction wrapping multiple writes |
| BUG-03: Bond system dead | `supabase-api.ts:502` | Critical | Tag field never surfaced to user |
| BUG-04: Island writes gold directly | `island.tsx:58` | High | Bypasses server authority rule |
| BUG-05: `listAllMonsters` silent cap | `supabase-api.ts:675` | High | No `.range()` pagination |
| BUG-06: Death wipes 100% gold | `supabase-api.ts:440` | High | `gold = 0` — catastrophic |
| BUG-07: Pull writes directly to profiles | `gacha-client.ts:93` | High | Client-side currency deduction |

---

### 6.2 Integration Test Cases (Minimum 20)

**Framework:** Vitest + Supabase test client against a test schema.

| # | Test | Expected | Failure Mode Caught |
|---|------|----------|---|
| 1 | Complete same task twice, same day | Second: `{ noop: true }`, no gold | Double reward |
| 2 | Score "minus" task | HP decreases by `damageFromMiss()` formula | Wrong damage, no HP change |
| 3 | Score "minus" → death | `died: true`, gold halved, level–1 | Gold wiped, wrong level |
| 4 | Pull with insufficient crystals | Error thrown before roll fires | Negative balance |
| 5 | Pull — 10x first pull free | `totalCost = 0`, at least 1 Rare in results | Cost charged on first pull |
| 6 | Pull × 1000 — rarity distribution | Statistically approximates `PULL_RATES.standard` | Client-side rate manipulation |
| 7 | `runCronIfNeeded()` called twice, same day | Second call: `{ ran: false }` | Double HP damage |
| 8 | Task with `realm_id` complete | `growthTicks` non-empty, includes `realm_name` | Empty `growthTicks` |
| 9 | Task without `realm_id` complete | `growthTicks` empty, no error | Crash on missing realm |
| 10 | `ascendMut` with insufficient gold | Error thrown before any DB write | Gold deducted without ascension |
| 11 | `ascendMut` with insufficient potions | Error thrown before any DB write | Potions deducted without ascension |
| 12 | `listAllMonsters(0, 100)` | Returns exactly 100 rows | Returns all rows, unbounded |
| 13 | `listAllMonsters(1, 100)` | Returns rows 101–200 | Returns wrong page |
| 14 | Empty Compendium (new player) | Empty state rendered, not error | Crash or blank screen |
| 15 | Trial with team < 3 monsters | Error state shown, no crash | Trial runs with empty team |
| 16 | Guild join — already in guild | Error returned | Double-join, orphaned guild |
| 17 | Evening ritual outside window | `isEveningWindow()` = false, UI disabled | Ritual runs at 3pm |
| 18 | Streak freeze use — HP not lost | `freezes -= 1`, `hp` unchanged | HP lost despite freeze |
| 19 | Combo counter gap > 1 hour | `combo_count` resets to 1 | Combo compounds infinitely |
| 20 | Bond tick at 100% → awakening | `awakenings[]` non-empty in response | Awakening never triggers |

---

### 6.3 Regression Checklist (Run After Every Significant Change)

**Game Logic**
- [ ] Task completion awards correct gold per difficulty tier
- [ ] Streak counter increments at UTC midnight boundary, not at completion time
- [ ] Every pull is a pure independent weighted roll — no counter modifies outcome
- [ ] `growthTicks[]` includes `realm_name` on every tick
- [ ] Realm Whisper fires ≥30% of positive task completions
- [ ] Combo resets correctly after 1 hour of inactivity
- [ ] Death: gold halved, level–1, HP restored to max

**UI/UX**
- [ ] No raw emojis on any screen (PowerShell audit)
- [ ] No `var(--undefined)` in browser DevTools console
- [ ] All monsters load with art URL or placeholder fallback
- [ ] All empty states show narrative copy
- [ ] No pity bar, pity counter, or "pulls to guarantee" UI anywhere
- [ ] Lifetime pull count displays as dedication badge (not a progress bar)

**Mobile**
- [ ] All interactive elements ≥44px touch target at 375px
- [ ] No horizontal scroll at 375px
- [ ] Modals open as bottom-up Vaul sheets at ≤768px

**Database**
- [ ] Latest migration is idempotent (run twice in staging)
- [ ] No game math calculated client-side
- [ ] All new RPCs have matching types in `/src/types/rpc.ts`

---

### 6.4 Adversarial Test Scenarios

| Scenario | Steps | Expected |
|----------|-------|----------|
| Speed-Clicker | Complete task → repeat within 200ms | Second request rejected |
| Tab-Duplicator | Pull from Altar in two tabs simultaneously | Only one pull fires; one tab receives error |
| Midnight Rider | Complete task at 23:59:59 UTC → same task at 00:00:01 UTC | Both succeed (different days) |
| Streak Chaser | Day 29 complete at 23:59 → miss Day 30 → complete Day 31 at 00:01 | Streak broken on Day 30 |
| Currency Drain | Spend all crystals → immediately attempt pull | Pull rejected, balance unchanged |
| Art Breaker | Monster with `art_url = null` in: collection, reveal, island, battle | Fallback placeholder in all 4 contexts |
| The Resurrector | Score task → immediately uncomplete → immediately score again | Gold on first score; gold removed on uncomplete; gold restored on rescore; net: 0 gain |

---

### 6.5 Visual Regression Snapshots (Playwright)

**Required snapshots (desktop 1440px + mobile 375px):**

1. Hub screen — tasks loaded
2. Altar screen — pre-pull state, banner visible
3. Altar screen — reveal: Common rarity
4. Altar screen — reveal: Legendary rarity (ceremony frame capture at 1.5s)
5. Compendium — empty state (new player)
6. Compendium — loaded (realm filter active)
7. Island — empty team
8. Island — full team (3 monsters placed)
9. Battle — pre-battle (team assembled)
10. Battle — result screen (victory)

---

## 7. AGENT 5 — ARBITER: CONFLICTS & PRIORITY

*Generalist Arbiter — "The One Who Coordinates Them All"*

> **Core Rule:** When in conflict, the **player's experience** wins over technical elegance or aesthetic perfection. Code can be refactored. Players who churn don't come back.

---

### 7.1 Conflict Resolution Table

| Conflict | Agent A Wants | Agent B Wants | Resolution |
|----------|--------------|--------------|-----------|
| Reveal ceremony blocks vs. server response | UI: full 3.5s EX ceremony | Logic: non-blocking response | **Optimistic reveal plays immediately; server result corrects async. Rollback only on confirmed failure — never on timeout.** |
| Pity bar vs. no-pity design | UI: show progress toward guarantee | Game Design: pity doesn't exist | **Lifetime pull count as dedication badge only. Never frame as "X pulls to go." The Page does not promise.** |
| Fatigue/debuff visual vs. server flag | UI: infer from habit data | Logic: debuff is a server flag only | **UI reads `debuff_active` from profile query. Never infer from local habit state.** |
| Island spatial layout vs. mobile performance | Design: 2D canvas spatial | QA: performance on mobile | **CSS grid zones (5 named positions), not canvas. Monsters are absolutely positioned within zones. Zero canvas dependency.** |
| Battle manual mode complexity vs. habit app simplicity | Design: agency, 3-choice input | Design: keep it accessible | **Manual mode is opt-in. Auto remains default. Manual gives +15% gold to incentivize engagement without forcing complexity.** |
| Streak penalty severity vs. player recovery | Design: recoverable | Logic: streak integrity | **Full reset on missed day. Always offer "recover with one habit within 24h" grace mechanic.** |
| Mobile modal + form validation | UI: Vaul drawer | Logic: form needs validation | **Bottom drawer AND validation inside it. Both requirements met simultaneously — not an either/or.** |
| Voice line frequency | Design: ≥30% | QA: avoid performance fatigue | **30% baseline. Player can mute. Cannot disable entirely. Never 0%.** |

---

### 7.2 Arbiter's Weekly Review

**Product Health**
- [ ] Core loop unbroken end-to-end: task → gold → crystal → pull → bond → island → battle
- [ ] ≥1 narrative piece (empty state, whisper, lore) shipped this week
- [ ] ≥1 regression test added for any game logic changed

**Technical Health**
- [ ] No hardcoded hex in component files
- [ ] No raw emojis in `.tsx` files
- [ ] All new RPCs have typed return contracts in `/src/types/rpc.ts`
- [ ] Latest migration is idempotent and tested

**Design Health**
- [ ] New screens pass atmosphere check (identifiable in 2 seconds)
- [ ] Token system is the only source of truth for color and typography
- [ ] Motion budget respected — no new animation without a `dur` constant entry

**Game Design Health**
- [ ] Every new feature connects to at least one realm
- [ ] Player is never in a state with nothing to do
- [ ] No pity bar, pity counter, or guarantee UI exists anywhere
- [ ] World mythology not broken by any new copy

---

## 8. EXTERNAL INSPIRATION REFERENCE

These are reference sources, not dependencies to install. Lessons extracted and applied.

| Repository | Stars | Applied Pattern |
|-----------|-------|----------------|
| **osu!** (ppy/osu) | 18.5k | Passive scoring (Island income) · Always-on feedback · Combat state machine |
| **Lichess** (lichess-org/lila) | 18k | Server-authoritative move validation → scoreTask RPC · State machines for turn-based logic |
| **GDevelop** (4ian/GDevelop) | 23k | Island as a "scene with spatial objects" not a list · Layer architecture (background/gameplay/UI) |
| **Awesome-Gamedev** | Curated | Utility AI for side quest selection · Behavior trees for NPC/companion logic |
| **shadcn/ui** | — | Copy-paste component philosophy · CSS variable tokens as design system source of truth |
| **design-resources-for-developers** | 55k | Font pairing validation · WCAG contrast checks for realm palettes |
| **roadmap.sh** | 300k | Engagement architecture lifecycle mapping (Day 1 → Year 1) |
| **gamedev4noobs** | — | Beginner-friendly feature gating (manual battle as opt-in, not required) |

---

## 9. IMPLEMENTATION ROADMAP

> **Rule:** Each phase completes before the next begins. Phase 3 (Visual) does not start while Phase 1 (Structural) has open items. Decorating a broken foundation is waste.

### Phase 1 — Structural Foundation (No visible changes)

These are critical bugs that affect data integrity. Ship nothing else until these are done.

- [ ] `P1.1` Move `scoreTask()` core to Supabase RPC with `FOR UPDATE` lock
- [ ] `P1.2` Move `runCronIfNeeded()` to Supabase Edge Function + `pg_cron`
- [ ] `P1.3` Add `realm_id` to `tasks` table + `TaskFormDialog` selector
- [ ] `P1.4` Add pagination to `listAllMonsters()` + Compendium infinite scroll
- [ ] `P1.5` Move `ascendMut` gold write to Supabase RPC
- [ ] `P1.6` Move `pullBanner` currency deduction to Supabase RPC
- [ ] `P1.7` Create `/src/types/rpc.ts` with typed contracts for all existing RPCs
- [ ] `P1.8` Add required database indexes (§4.10)

### Phase 2 — Game Mechanics (Player behavior changes)

- [ ] `P2.1` Realm Pulse on task completion (`<RealmPulse>` component)
- [ ] `P2.2` Island passive income system (formula + harvest UI)
- [ ] `P2.3` Void Frontier 30-day streak progress visible on Profile
- [ ] `P2.4` Dynamic side quest templates (DB table + scoring function)
- [ ] `P2.5` Battle manual mode (opt-in 3-choice input + +15% gold bonus)
- [ ] `P2.6` Death penalty → 50% gold loss (not 100%)
- [ ] `P2.7` "Soul Contract" item (negates next death)
- [ ] `P2.8` Drop system prefers task `realm_id` for potion drops
- [ ] `P2.9` Source Realm Whispers from `realms.lore_lines` DB column

### Phase 3 — Visual Completeness (Proposal D)

- [ ] `P3.1` Token system extended and enforced (`tokens.css` complete)
- [ ] `P3.2` Atmosphere backdrops on all 15 routes (§3.4 table)
- [ ] `P3.3` Rarity reveal ceremony tiers (4 distinct tiers, §3.6)
- [ ] `P3.4` Mobile bottom navigation bar (5 slots)
- [ ] `P3.5` All empty states → mythology voice (audit all 15 screens)
- [ ] `P3.6` All loading states → `<LoadingScreen />` with route atmosphere
- [ ] `P3.7` Rarity colors → CSS variables (remove inline hex from `altar.tsx`)
- [ ] `P3.8` Island spatial zone layout (5 CSS grid zones, no canvas)
- [ ] `P3.9` Lifetime pull dedication badge on Altar (not a pity bar)
- [ ] `P3.10` Typography CSS classes enforced across all components

### Phase 4 — Quality Baseline

- [ ] `P4.1` 20 integration tests covering §6.2 test cases
- [ ] `P4.2` 10 visual regression snapshots via Playwright (§6.5)
- [ ] `P4.3` Adversarial test scenarios automated (§6.4)
- [ ] `P4.4` TypeScript strict mode — eliminate all `any` in game API files
- [ ] `P4.5` Ownership assertion audit on all `user_monsters` writes (RLS verify)
- [ ] `P4.6` ESLint hex-literal rule configured and passing

---

## 10. DESIGN TOKEN REFERENCE CARD

### Colors

| Token | Value | Use |
|-------|-------|-----|
| `--bg-deep` | `#0C0E14` | Page backgrounds, full-bleed |
| `--bg-surface` | `#13161F` | Cards, panel interiors |
| `--bg-elevated` | `#1A1E2A` | Modals, tooltips |
| `--bg-overlay` | `#22273A` | Hover states, active rows |
| `--text-primary` | `#F0EDE6` | Main readable text |
| `--text-secondary` | `#A09D96` | Descriptions, subtitles |
| `--text-tertiary` | `#6B6864` | Timestamps, metadata |
| `--accent-gold` | `#C89A3E` | Primary CTAs, Legendary, active nav |
| `--accent-void` | `#7F77DD` | EX, Pact Seals, Void Frontier |
| `--accent-fire` | `#E8583A` | Danger states, Mythic, Chaos |
| `--accent-ice` | `#5AB4E5` | Healing, support, Divine |
| `--accent-nature` | `#639922` | Growth, buffs, Wild |
| `--rarity-common` | `#9E9E9E` | Common badge |
| `--rarity-uncommon` | `#81C784` | Uncommon badge |
| `--rarity-rare` | `#4FC3F7` | Rare badge |
| `--rarity-elite` | `#FFB74D` | Elite badge |
| `--rarity-epic` | `#CE93D8` | Epic badge |
| `--rarity-legendary` | `#FFD54F` | Legendary badge |
| `--rarity-mythic` | `#FF8A65` | Mythic badge |
| `--rarity-ex` | `#FFFFFF` | EX badge |

### Animation Durations

| Constant | Value | Use |
|----------|-------|-----|
| `dur.micro` | 80ms | Button press |
| `dur.fast` | 150ms | Hover states |
| `dur.normal` | 250ms | Nav transitions |
| `dur.slow` | 400ms | Modal entrances, Realm Pulse |
| `dur.reveal` | 800ms | Common / Rare summon |
| `dur.ceremony` | 1800ms | Epic / Legendary / Mythic |
| `dur.epic` | 3500ms | EX reveal |

### Pull Rate Reference (Confirmed, Client-Safe)

| Rarity | Standard | Featured | Streak | Pact Seal | Event |
|--------|----------|----------|--------|-----------|-------|
| Common | 45% | 35% | 25% | 10% | 40% |
| Uncommon | 25% | 22% | 20% | 15% | 23% |
| Rare | 17% | 25% | 30% | 25% | 20% |
| Elite | 8% | 12% | 16% | 22% | 10% |
| Epic | 4% | 5% | 7% | 15% | 5% |
| Legendary | 0.8% | 0.9% | 1.5% | 8% | 1.5% |
| Mythic | 0.15% | 0.08% | 0.4% | 4% | 0.4% |
| EX | 0.05% | 0% | 0.1% | 1% | 0.1% |

> These rates are safe for client-side display. Every pull is an independent roll. No pity. No guaranteed floor.

---

## 11. QUICK-DEPLOY AGENT REFERENCE

When working in a dedicated AI session, load the relevant system prompt from `Elite_Agents.md`.

| I need to… | Agent | Domain |
|-----------|-------|--------|
| Design a new screen or component | Agent 1 — Chief UI/UX Designer | Visual identity, tokens, atmosphere, motion |
| Write or review game logic / API | Agent 2 — Game Logic Architect | RPC contracts, DB writes, server authority |
| Design a new mechanic or feature | Agent 3 — Lead Game Designer | Core loop, realm design, retention |
| Test a feature or find edge cases | Agent 4 — Principal QA Engineer | Integration tests, adversarial scenarios |
| Make a cross-domain decision | Agent 5 — Generalist Arbiter | Conflict resolution, priority, weekly review |

**Recommended deploy order for a new feature:**
```
GAME DESIGNER (design it)
  → GAME LOGIC ARCHITECT (build the server layer)
    → UI/UX DESIGNER (build the interface)
      → QA ENGINEER (break it)
        → ARBITER (ship it)
```

---

### Definition of Done

A requirement is complete when ALL of the following are true:

- [ ] Works for a new player (empty state path)
- [ ] Works for a player with 100+ monsters
- [ ] Works on mobile 375px, all touch targets ≥44px
- [ ] No hardcoded hex colors — all from `tokens.css`
- [ ] No raw emojis — all icons use `<Icon>` or Lucide
- [ ] No game math calculated client-side
- [ ] Relevant integration test(s) pass
- [ ] Supabase Dashboard confirms expected DB state after the action
- [ ] WhisperFeed fires (if applicable) with correct realm affinity
- [ ] Feature fits the metacosmology — "writing the Page"
- [ ] No pity bar, pity counter, or guarantee framing anywhere

---

*SummonScroll Master Requirements Guide · v3.0*  
*Multi-agent synthesis: UI/UX Designer · Game Logic Architect · Game Designer · Principal QA · Generalist Arbiter*  
*Grounded in: gacha.constants.ts (no-pity confirmed) · supabase-api.ts (819 lines) · 15 routes · 25 migrations*  
*Inspired by: osu! · Lichess · GDevelop · Awesome-Gamedev · shadcn/ui · THE_GENERALISTS_CODEX*  
*"The Page remembers every stroke. Write it well."*
