# PROMPT FR01 — SummonScroll: Auth Shell & Habit Engine v0.2

## Project Context & Objective

Build the SummonScroll Authentication Shell and Habit-Tracking Engine. This is the foundational module that powers user identity, session management, and the core gameplay loop — habits that fuel the entire gacha economy. The task system mechanics (task value colors, difficulty multipliers, HP damage from missed tasks, death penalty, random drops) are directly modeled after Habitica's proven systems, adapted for a gacha monster-collection context.

**Crucial Design Constraint:** SummonScroll is a dark-fantasy productivity RPG. Every screen uses a deep dark background (`#0C0E14`), gold accent colors (`#C89A3E` / `#FFD54F`), and the Cinzel font for headings. Cards use `#13161F` surfaces with subtle `rgba(255,255,255,0.07)` borders. All interactive elements must feel premium and game-like — not like a generic SaaS dashboard. The aesthetic draws from Genshin Impact, Summoners War, and Habitica. Do not use white backgrounds, light themes, or generic UI patterns.

**Core Design Tokens:**
```
Backgrounds:   #0C0E14 (page) · #13161F (cards) · #1A1E2A (modals) · #1E2333 (hover)
Text:           #F0EDE6 (primary) · #A09D96 (secondary) · #6B6864 (tertiary)
Accents:        #C89A3E (gold) · #FFD54F (gold-bright) · #E05252 (danger) · #5FAD41 (success)
Borders:        rgba(255,255,255,0.07) (default) · rgba(255,255,255,0.18) (active)
Fonts:          Cinzel (headings, monster names) · DM Sans (body, labels) · JetBrains Mono (stats, currency)
Border radius:  8px (sm) · 12px (md) · 16px (lg) · 24px (xl)
```

---

## 1. Authentication & Session Management

### Login Screen (`/auth/login`)

**Layout:** Centered card on full-bleed dark background image (`bg_login.jpg`), with a 70-80% dark overlay + backdrop blur. The card uses `bg-surface/80` with `backdrop-blur-xl` and a subtle gold gradient line along the top edge.

**Header:**
- App title "SummonScroll" in Cinzel 700, 32px, gold-bright (`#FFD54F`), centered
- Tagline "Your habits. Your monsters. Your legend." in 14px secondary text

**Form Fields:**
- Email input — label "EMAIL" (12px uppercase tracking-wider), placeholder "you@example.com"
- Password input — label "PASSWORD", placeholder "••••••••", with a show/hide toggle button (👁/🙈 icons) positioned absolute right inside the input
- All inputs: dark elevated background (`#1A1E2A`), `border-border` default, `border-gold` on focus, `border-danger` on validation error

**Actions:**
- Primary CTA button: "Enter the Realm" — full-width, gold gradient (`from-gold to-gold-bright`), dark text, uppercase tracking-widest, 14px bold. Disabled state at 50% opacity. Loading state shows "Summoning…"
- "New summoner? Create account" link below — gold text, links to `/auth/register`

**Server Error Display:** Red-tinted card (`bg-danger/10 border-danger/30`) with error message text

**Technical Requirements:**
- React Hook Form + Zod validation
- TanStack Query `useMutation` for login API call
- On success: store user + tokens in Zustand (`userStore`), navigate to `/hub`
- Zustand store persists `accessToken` to survive page refresh
- Axios interceptor auto-refreshes token on 401 using `refreshToken` from sessionStorage

### Register Screen (`/auth/register`)

**Layout:** Same centered card pattern as login.

**Fields:**
- Summoner Name — text input, placeholder "CrimsonBlade"
- Email — email input
- Password — password input with strength indicator bar (colored segments: red → amber → green)
- Confirm Password — must match password field
- Class Selection — Choose starting class (see §2.5 Class System). Displayed as 4 illustrated cards the user picks from. Can be changed later at Level 10.

**Actions:**
- Primary CTA: "Begin Your Journey" — same gold gradient style. Loading: "Forging Contract…"
- "Already have an account? Sign in" link

### App Shell (`/_app` layout)

**Desktop Sidebar (1024px+):**
```
[Avatar + Level + HP bar + XP bar]
────────────────────────────────
Hub · Island · Altar · Battle · Compendium
────────────────────────────────
Guild · Fusion · Shop
────────────────────────────────
Profile · Settings
```
- Active nav item: gold text + gold left border accent
- Inactive: secondary text color

**Mobile Bottom Nav (< 1024px):**
```
[ 🏠 Hub ] [ 🏝 Island ] [ ⛩ Altar ] [ ⚔ Battle ] [ 📖 More ]
```
- 5 tabs max. Active: gold icon + text. Additional pages accessible via hamburger drawer.
- Drawer slides in from right with backdrop overlay, animated with Framer Motion `slideInRight` variant + `AnimatePresence` for exit

**Header Bar (always visible):**
```
[Avatar] [LVL 42] [❤ HP bar] [💎 2,450] [🔷 234] [🔑 3]  [🔥14] [🔔][⚙]
```
- HP bar (red, see §2.4) always visible — the player's health is a primary game metric
- Currency displayed in JetBrains Mono 700
- Streak fire badge (🔥 14) pulses orange when active, turns grey ❄ when broken

### Daily Login Reward Modal

On first login of the day, display a reward modal with a 7-day cycle grid:
```
Day 1   Day 2   Day 3   Day 4   Day 5   Day 6   Day 7
 💎      💎      🔷      💎      💎      💎      🔑
[✓]     [✓]     [✓]    [now]   [ ]     [ ]     [ ]
```
- Day 7 always grants a Pact Seal (the premium summoning currency)
- Claimed days show green checkmark, today's slot glows with gold border + pulse animation
- "Claim Reward" CTA button — gold gradient, satisfying press feedback
- Today's reward previewed in a bordered highlight card with gold border

---

## 2. Habit & Task System (Directives) — Habitica-Aligned Mechanics

### 2.1 Directives Dashboard (`/directives`)

**Tab Navigation:** Three underline-style tabs at the top:
```
[ Habits ]  [ Dailies ]  [ To-Dos ]
```
Active tab: gold underline + gold text. Inactive: secondary text.

**Three Task Types (matching Habitica exactly):**
| Type | Behavior | Penalty for Missing |
|---|---|---|
| **Habits** | Clickable +/− anytime. No schedule. Positive clicks earn rewards, negative clicks deal self-damage. | No automatic penalty — only when user clicks − |
| **Dailies** | Must be completed once per day (or on scheduled days). Resets at midnight (Cron). | **Missed Dailies deal HP damage to the player** (and to guild quest boss). This is the core accountability mechanic. |
| **To-Dos** | One-time tasks. No schedule. Complete and they're done. | No direct penalty, but neglected To-Dos shift red and give bigger rewards when finally completed. |

### 2.2 Task Value Color System (from Habitica)

Every task has an internal "value" score that shifts over time, visually represented by the task card's color tint. This is a critical motivational mechanic:

```
Blue (#4FC3F7)    → Consistently completed. Low reward (you've mastered this habit).
Green (#5FAD41)   → Doing well. Moderate reward.
Yellow (#FFB74D)  → Neutral / new task. Default starting color.
Orange (#FF8A65)  → Neglected. Higher reward when completed. Starting to slip.
Red (#E05252)     → Badly neglected. Highest reward when completed. Urgent.
```

**How it shifts:**
- Completing a task (✓ or +) increases its value → shifts toward blue
- Missing a Daily or clicking − on a Habit decreases its value → shifts toward red
- Uncompleted To-Dos gradually drift toward red over time

**Why this matters:** Red tasks give MORE gold/XP/crystals when finally completed — this self-balancing mechanic encourages players to tackle their hardest, most-neglected tasks first. It's the opposite of punishing failure; it's rewarding recovery.

**Visual:** The task card's left border color (4px) AND a subtle background tint reflect the current task value color. The tint is applied at 10% opacity over the card surface.

### 2.3 Habit Card Component

```
┌─[task value color border 4px]─────────────────────────────┐
│  [📚 Category]  "Study Japanese for 30 minutes"           │
│  ⭐⭐ Medium  ·  🔥 14-day streak  ·  Realm 1             │
│  ████████████████░░░░░░  Streak Health: 78%                │
│  Reward: +20💎 +15XP +2🔷                                 │
│                                          [+ ✓]  [− ✗]     │
└───────────────────────────────────────────────────────────┘
```

**[+] and [−] Buttons (Habitica-style):**
- **[+] (positive):** Earns gold, XP, crystals, bond XP. Shifts task toward blue. Increases streak.
- **[−] (negative):** Deals HP damage to player. Shifts task toward red. Breaks streak. Used for "bad habit" tracking (e.g., "Ate junk food" → click − to track failure and take damage).
- Habits can be positive-only (+), negative-only (−), or both (+/−). Configured at creation.

**Completion Interaction:**
- Tapping + triggers: checkmark burst animation + element-color edge flash (600ms ease-out)
- Currency float animation: "+30💎 +15XP" floats upward and fades (800ms)
- Random drop chance (see §2.7): occasionally "+🥚 Dragon Egg!" floats up too
- Streak counter increments with a brief scale bounce

### 2.4 Player HP System (from Habitica)

**Every player has a Health Points (HP) bar, always visible in the header.**

```
❤ ████████████████░░░░  42 / 50 HP
```

**HP Mechanics:**
- Max HP: 50 (all players, does not scale with level — same as Habitica)
- **Damage Sources:**
  - Missed Dailies at Cron (midnight reset) → each missed Daily deals damage based on its difficulty and task value
  - Clicking [−] on a negative Habit → self-inflicted damage
  - Boss quest rage attacks (see FR04)
- **Healing Sources:**
  - Health Potion: purchasable in Shop for 25💎. Restores 15 HP.
  - Healer class skills (see §2.5)
  - Leveling up fully restores HP
- **Damage Formula (matching Habitica):**
  ```
  Daily Damage = taskValue × difficultyMultiplier × (1 - CON_reduction)
  
  difficultyMultiplier: Trivial=0.1, Easy=1.0, Medium=1.5, Hard=2.0
  CON_reduction: Constitution stat reduces damage (up to ~40% reduction at high CON)
  ```

### Death Penalty (from Habitica)

**If HP reaches 0, the player dies.** On death:
1. **Lose 1 level** (XP resets to 0 for current level)
2. **Lose all Gold (Spirit Crystals)** — this is harsh but motivating
3. **One random equipped monster loses 1 Awakening Star** (equivalent to Habitica's "lose one piece of equipment")
4. **HP restores to full** (player is revived)
5. **Full-screen death animation:** screen cracks, shatters to black, "💀 YOU HAVE FALLEN" in Cinzel 48px red, then "Revived — fight harder" fades in

**Death Prevention:**
- Health Potions (buy from Shop)
- Healer class abilities (heal self or party)
- Guild members with Healer class can heal you before you log in (prevents death on login — same as Habitica)

**Visual:** HP bar changes color as it drops:
- 50–26 HP → green
- 25–11 HP → amber (pulse animation)
- 10–1 HP → red (urgent pulse + "LOW HP" warning badge)

### 2.5 Class System (from Habitica)

At Level 10 (or on registration as optional preview), the player chooses a class. Each class provides stat bonuses and unique skills:

| Class | Primary Stat | Bonus | Playstyle |
|---|---|---|---|
| **Warrior** ⚔ | Strength (STR) | +50% bonus to STR from equipment. More boss damage. Higher crit damage. | Measured approach. Moderate penalties, moderate rewards. More frequent critical hits in battle. |
| **Mage** 🔮 | Intelligence (INT) | +50% bonus to INT from equipment. More XP from tasks. Higher mana regeneration. | High risk, high reward. Takes the most damage from missed tasks. Uses skills frequently. |
| **Healer** 💚 | Constitution (CON) | +50% bonus to CON from equipment. Takes less damage. Gains XP and mana quickly. | Defensive. Can heal self and guild party. Provides party defensive buffs. |
| **Rogue** 🗡 | Perception (PER) | +50% bonus to PER from equipment. More gold from tasks. Better random drops. | Swashbuckling. Occasionally dodges damage from missed Dailies. High gold income. |

**Stats:**
- **STR (Strength):** Increases damage to quest bosses. Increases critical hit damage.
- **INT (Intelligence):** Increases XP earned from tasks. Increases mana cap and mana regen.
- **CON (Constitution):** Decreases HP damage from missed Dailies and negative Habits. Increases max critical hit bonus.
- **PER (Perception):** Increases gold (crystal) reward from tasks. Increases random drop chance for eggs, potions, and materials.

**Where stats come from:** Base stats from leveling up + equipped monster bonuses (monsters on your team provide stat bonuses based on their element/role) + class bonus multiplier.

### 2.6 Difficulty Multipliers (matching Habitica)

| Difficulty | Reward Multiplier | Damage Multiplier (if missed) | Boss Damage |
|---|---|---|---|
| Trivial (☆) | ×0.1 | ×0.1 | ×0.1 |
| Easy (⭐) | ×1.0 | ×1.0 | ×1.0 |
| Medium (⭐⭐) | ×1.5 | ×1.5 | ×1.5 |
| Hard (⭐⭐⭐) | ×2.0 | ×2.0 | ×2.0 |

Higher difficulty = more crystals/XP/boss damage when completed, BUT more HP damage when missed. This creates meaningful risk/reward choices.

### 2.7 Random Drops from Tasks (from Habitica)

Every time a task is completed (Habit+, Daily, To-Do), there is a random chance to receive a bonus drop. The drop chance is influenced by the player's Perception (PER) stat.

| Drop Type | Use | Drop Rate |
|---|---|---|
| **Monster Egg** 🥚 | Hatch with a Realm Potion to get a pet-size companion (cosmetic) | ~5% base |
| **Realm Potion** 🧪 | Combine with an Egg to hatch a pet. 12 types (one per realm). | ~5% base |
| **Fusion Shard** 🔹 | Crafting material used in certain fusion recipes | ~3% base |
| **Food** 🍖 | Feed pets to grow them into mounts (cosmetic upgrades) | ~8% base |
| **Spirit Crystals** 💎 | Bonus currency (10-50 based on task difficulty) | ~10% base |

**Drop Notification:** When a drop occurs, a floating "+🥚 Wolf Egg!" animation plays alongside the normal reward float. Drops are collected into the player's Inventory (accessible from Profile).

### 2.8 Categories & Realm Affinities

| Category | Icon | Realm Affinity |
|---|---|---|
| Study / Reading | 📚 | Realm 1 — Ancient Vaults |
| Strength Training | 💪 | Realm 2 — Chaos Wastes |
| Meditation | 🧘 | Realm 3 — The Outer Dark |
| Sleep / Recovery | 😴 | Realm 4 — Blighted Expanse |
| Exercise / Fitness | 🏃 | Realm 5 — Wild Frontier |
| Mindfulness | 🙏 | Realm 6 — Divine Threshold |
| Night Habits | 🌙 | Realm 7 — Haunted Veil |
| Custom Tasks | 🎯 | Realm 8 — Digital Nexus |
| Water / Nutrition | 🥗 | Realm 9 — Elder Realm |
| Ambitious Goals | 🚀 | Realm 10 — Void Frontier |
| Productivity | ⚡ | Realm 12 — Iron Dominion |

### 2.9 Add Habit Form

Inline expandable form below the tab header:
- Habit name text input
- Category dropdown (maps to realm affinity)
- Difficulty dropdown (Trivial / Easy / Medium / Hard)
- Direction: Positive only (+) / Negative only (−) / Both (+/−) — toggle buttons
- "Add" button — small gold CTA

### 2.10 To-Do List

Simple checklist with checkboxes:
- Each item: checkbox + title + optional due date + difficulty badge + delete button
- Completed items collapse into a "X completed" expandable section at 50% opacity with line-through text
- **Uncompleted To-Dos gradually shift red** (their task value decreases over days), giving BIGGER rewards when finally completed
- Empty state: scroll with quill illustration — "No to-dos yet. Add your first task."

### 2.11 Dailies with Batch Harvest & Cron Damage

- "🌾 Harvest All" button at the top — completes all pending dailies in one batch
- Each daily shows completion status for today
- **Cron (Midnight Reset):** At midnight UTC, the server runs a cron job:
  1. All unchecked Dailies deal HP damage to the player (per §2.4 formula)
  2. If player is on a guild boss quest, unchecked Dailies also deal damage to ALL guild members (Habitica party damage mechanic)
  3. All Dailies reset to unchecked for the new day
  4. Task values shift (uncompleted → more red, completed → more blue)
  5. Streak counters update (completed → +1 streak, missed → streak resets to 0)

### 2.12 Bond XP Distribution (Core SummonScroll Mechanic)

When a task is completed, bond XP is distributed to monsters matching the task's realm affinity:
- Complete a "Study" habit → XP flows to Realm 1 (Ancient Vaults) monsters
- Missing habits → those realm monsters receive NO bond XP and begin to visually degrade
- The bond XP amount scales with task difficulty and task value color (red tasks give more bond XP too)

### 2.13 Streak Milestones

| Milestone | Reward | Visual |
|---|---|---|
| 7-day streak | Void Shard bonus | 🔥 grows to 24px + bounces once |
| 21-day streak | Bonus monster egg drop | Achievement toast + special egg |
| 30-day streak | Pact Seal + screen pulse | Full-screen gold pulse + "MILESTONE" toast |
| Streak broken | HP damage + monsters degrade | Fire badge turns grey ❄, affected monsters show "FATIGUED" badge |

---

## 3. Level & XP System

### XP Bar (Hub header)

```
Level 42 ────────────────────────────────── Level 43
         ████████████████████░░░░░  67% (6,700 / 10,000 XP)
```
- Bar gradient: gold → gold-bright
- Level numbers in Cinzel 600
- XP values in JetBrains Mono
- XP earned scales with task difficulty multiplier and is boosted by INT stat (Mage bonus)
- XP required per level increases by ~15% per level (progressive scaling)

### Level-Up Effects

On level up:
1. **HP fully restored** (critical for survival — same as Habitica)
2. **Stat points allocated** (auto-distributed based on class)
3. **Level-up full-screen animation:** screen freezes → blur → dark overlay → "LEVEL UP" Cinzel 64px gold shimmer → new level pulses → show unlocks → "Continue"
4. **Unlock checks:** certain levels unlock features:
   - Level 3: Pets & Mounts
   - Level 5: Altar (Gacha) access
   - Level 10: Class selection
   - Level 15: Guild creation
   - Level 20: Fusion Matrix

**Accessibility:** If `prefers-reduced-motion` is set, condense to instant overlay + text reveal (no blur/shimmer).

---

## 4. Mana System (from Habitica)

Players have a Mana Points (MP) bar used to cast class skills:

```
🔮 ████████████░░░  32 / 45 MP
```

- Max MP scales with INT stat
- MP regenerates when completing tasks (amount scales with INT)
- MP is spent on class-specific skills:

| Class | Skill | MP Cost | Effect |
|---|---|---|---|
| Warrior | Brutal Smash | 10 MP | Deals bonus damage to quest boss when completing a task |
| Warrior | Defensive Stance | 25 MP | Party gains +CON buff for the day |
| Mage | Burst of Flames | 10 MP | Deals bonus damage to quest boss (highest single-target) |
| Mage | Ethereal Surge | 30 MP | Party gains +INT buff (more XP) for the day |
| Healer | Healing Light | 15 MP | Heal self for 15 HP |
| Healer | Protective Aura | 25 MP | Heal entire guild party for 10 HP each |
| Rogue | Pickpocket | 10 MP | Bonus gold/crystals from current task |
| Rogue | Stealth | 20 MP | Skip damage from one missed Daily (dodge) |

Skills are cast from a skill bar at the bottom of the Directives page, or from the Hub.
