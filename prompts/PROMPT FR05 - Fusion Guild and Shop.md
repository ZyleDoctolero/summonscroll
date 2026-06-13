# PROMPT FR05 — SummonScroll: Fusion Matrix, Guild System & Shop v0.2

## Project Context & Objective

Build the SummonScroll Fusion Matrix, Guild System, and Shop modules. The Guild system mirrors Habitica's party mechanics — guilds are quest parties where members cooperatively fight bosses through real-world task completion. The Shop mirrors Habitica's market — selling equipment (stat-boosting artifacts), health potions, quest scrolls, and cosmetic items. Fusion is SummonScroll's unique monster-combination system.

**Crucial Design Constraint:** SummonScroll is a dark-fantasy productivity RPG. Every screen uses a deep dark background (`#0C0E14`), gold accent colors (`#C89A3E` / `#FFD54F`), and the Cinzel font for headings. Cards use `#13161F` surfaces with subtle `rgba(255,255,255,0.07)` borders. These screens must feel like part of the same cohesive dark-fantasy game world.

**Core Design Tokens:**

```
Backgrounds:   #0C0E14 (page) · #13161F (cards) · #1A1E2A (modals)
Accents:        #C89A3E (gold) · #FFD54F (gold-bright) · #7F77DD (void) · #E05252 (danger)
Borders:        rgba(255,255,255,0.07) (default) · rgba(255,255,255,0.18) (active)
Fonts:          Cinzel (headings) · DM Sans (body) · JetBrains Mono (stats, currency)
```

---

## 1. Fusion Matrix (`/fusion`)

### Fusion Overview

The Fusion Matrix allows players to combine 2 or 3 monsters into a single more powerful result. Consumed monsters are permanently removed from the player's collection.

### Ingredient Selection

```
┌──────────────────────────────────────────────────────┐
│  "Fusion Matrix"  Cinzel 700 24px                     │
│                                                       │
│  INGREDIENTS                                          │
│  ┌────────┐  ┌────────┐  ┌────────┐                  │
│  │ Slot 1 │  │ Slot 2 │  │ Slot 3 │  (optional)      │
│  │ [+]    │  │ [+]    │  │ [+]    │                  │
│  └────────┘  └────────┘  └────────┘                  │
│                                                       │
│  FUSION RESULT PREVIEW:                               │
│  [Result Monster Art + Name + Rarity]                 │
│  "CROSS-REALM" badge (if cross-realm fusion)          │
│  Success Rate: 100%                                   │
│                                                       │
│  ⚠ Warning: Consumed monsters will be permanently     │
│    removed from your collection.                      │
│                                                       │
│  [🔮 Perform Fusion]  gold CTA                        │
└──────────────────────────────────────────────────────┘
```

### Fusion Types

| Type                  | Ingredients                    | Result Rarity         | Special             |
| --------------------- | ------------------------------ | --------------------- | ------------------- |
| Standard 2-ingredient | 2 specific monsters            | Varies (recipe-based) | Most common         |
| Triple fusion         | 3 specific monsters            | Mythic                | Rare recipes        |
| EX fusion             | 2+ EX monsters                 | Cross-realm EX        | Unique, ultra-rare  |
| Cross-realm           | Monsters from different realms | Legendary+            | "CROSS-REALM" badge |

### Fusion Confirmation Modal

Uses the shared `<Modal>` component with focus trap, escape key, body scroll lock.

### Fusion Animation

1. Ingredient thumbnails glow and lift (200ms)
2. Particles converge toward center (400ms)
3. Bright flash (150ms)
4. Result monster reveals (300ms)
5. Rarity badge + name appear (200ms)

### Recipe Browser

Browse known fusion recipes:

- [Ingredient 1] + [Ingredient 2] → [Result]
- Owned ingredients highlighted gold, missing greyed
- "Ready to fuse!" badge on completable recipes

---

## 2. Guild System (`/guild`) — Habitica Party Mechanics

The Guild in SummonScroll functions exactly like Habitica's Party system — it's the cooperative unit where players fight bosses together through shared task completion.

### 2.1 Guild = Quest Party

**The guild IS the quest party.** When a guild member starts a Boss Quest (using a Quest Scroll), ALL guild members participate:

- **Completing tasks** = damage to the boss (shared across all members)
- **Missing Dailies** = the boss attacks ALL guild members for HP damage
- This social accountability is the core motivator — "If I skip my habits, my friends get hurt"

### 2.2 Guild Dashboard

**Pill-tab navigation:**

```
[ My Guild ] [ Members ] [ Active Quest ] [ Quest Log ] [ Browse ]
```

### My Guild Tab

If the player is in a guild:

```
┌──────────────────────────────────────────────────────┐
│  [Guild Banner Art]                                   │
│  "The Vanguard"  Cinzel 700 24px                      │
│  Level 12  ·  4 Members  ·  Rank #7                  │
│                                                       │
│  Guild Power: 1,245  (sum of all members' levels)     │
│                                                       │
│  ACTIVE QUEST:                                        │
│  [Boss Art] "Slay Tiamat the Chromatic"               │
│  Boss HP: ████████████░░░░░  6,500 / 10,000           │
│  Rage:    ██████░░░░░░░░░░  320 / 1,000              │
│  Your dmg today: 245  ·  Party dmg today: 1,120       │
│  [View Quest Details →]                               │
│                                                       │
│  QUEST SCROLL INVENTORY:                              │
│  [🗞 Dragon of the Vaults] [🗞 Hydra Hunt] [+ Buy]   │
│                                                       │
│  CHAT / ANNOUNCEMENTS:                                │
│  [Latest message from guild leader]                   │
└──────────────────────────────────────────────────────┘
```

If NOT in a guild — empty state:

```
[Tavern illustration with empty table]
"No guild yet. Find your Vanguard."
[Browse Guilds →]    [Create Guild →]
```

### 2.3 Members Tab

```
[Avatar] [Username] [Class Icon] [Level] [Role] [Today's Damage] [Last Active]
```

- Guild leader: crown icon ♛
- Officers: star icon ⭐
- Class icons show each member's class (⚔ Warrior, 🔮 Mage, 💚 Healer, 🗡 Rogue)
- "Today's Damage" column shows each member's boss damage contribution for the day
- **Healers can click "Heal" next to injured party members** — costs mana, heals HP (prevents death before they log in — same as Habitica)

### 2.4 Active Quest Tab

Full quest detail view (see FR04 §3.2 for Boss Quest UI and §3.3 for Collection Quest UI).

**Quest Management:**

- Quest owner or guild leader can **force-start** a quest if members haven't responded
- Quest owner can **abort** an active quest (requires confirmation — lost progress, no rewards)
- Members can join/leave quests individually

### 2.5 Quest Log

History of completed quests:

```
[✓] "Slay Tiamat" — Completed 3 days ago — Reward: Dragon Egg 🥚
[✓] "Gather Dragon Scales" — Completed 1 week ago — Reward: 500💎
[✓] "Defeat the Shadow Drake" — Completed 2 weeks ago — Reward: Void Shard 🔷
```

### 2.6 Browse & Create

**Browse Guilds:**

```
[Guild Name] [Level] [Members X/30] [Active Quest] [Apply →]
```

**Create Guild:**

```
Guild Name:     [text input, 3-30 chars]
Description:    [textarea, 200 chars max]
Privacy:        [Open / Apply-only / Invite-only]
[Create Guild]  gold CTA — costs 500💎
```

---

## 3. Shop (`/shop`) — Habitica Market Style

The Shop mirrors Habitica's Market structure: equipment, potions, quest scrolls, and cosmetic items — all purchasable with earned currency (Spirit Crystals 💎). No real-money purchases exist.

### 3.1 Shop Tab Navigation

Underline-style tabs:

```
[ Equipment ] [ Potions & Items ] [ Quest Scrolls ] [ Seasonal ] [ Enchanted Armoire ]
```

### 3.2 Equipment Tab (from Habitica)

Equipment provides stat bonuses to the player. Equipped gear from the player's current class gets a **50% stat bonus** (matching Habitica exactly).

**Equipment Categories:**
| Slot | Examples | Stats |
|---|---|---|
| Weapon | Arcane Staff, Shadow Blade, Iron Mace | +STR, +INT |
| Armor | Dragon Scale Mail, Void Robes, Crystal Shield | +CON, +PER |
| Helm | Crown of Flames, Hood of Shadows | +INT, +PER |
| Accessory | Ring of Fortitude, Amulet of Perception | Any stat |

**Equipment Card:**

```
┌────────────────────────────────┐
│  [Equipment Art 64px]          │
│  "Dragon Scale Mail"           │
│  Armor · Rare                  │
│                                │
│  +12 CON  +8 STR              │  JetBrains Mono
│  (⚔ Warrior: +18 CON +12 STR)│  class bonus shown in gold
│                                │
│  💎 350 Spirit Crystals        │
│  [Purchase]  gold CTA          │
└────────────────────────────────┘
```

**Class Bonus Display:** If the equipment matches the player's class, show the boosted stats in gold text below the base stats: "(⚔ Warrior: +18 CON +12 STR)" — the 50% class bonus applied.

**Equipment Management (Profile → Equipment):**

- Equip/unequip gear
- Compare stats of new vs currently equipped
- Sell equipment back for 50% of purchase price

### 3.3 Potions & Items Tab

| Item                             | Cost  | Effect                                                        |
| -------------------------------- | ----- | ------------------------------------------------------------- |
| Health Potion                    | 25💎  | Restore 15 HP (max 50 HP). Purchasable anytime.               |
| Fortify Potion                   | 100💎 | Prevent HP loss from missed Dailies for 1 day. Emergency use. |
| Bond Accelerator                 | 200💎 | 2× bond XP gain for 24 hours.                                 |
| XP Booster                       | 150💎 | 2× XP gain for 24 hours.                                      |
| Hatching Potion (specific realm) | 75💎  | One realm-specific hatching potion for pet hatching.          |

**Batch Buying:** Players can buy multiple of the same item at once (quantity selector), matching Habitica's batch buying feature.

### 3.4 Quest Scrolls Tab

Quest Scrolls are items that start cooperative Boss or Collection quests (see FR04 §3.4):

| Scroll                 | Cost    | Boss/Collection       | Difficulty |
| ---------------------- | ------- | --------------------- | ---------- |
| Shadow Drake Scroll    | 200💎   | Boss (HP: 5,000)      | Easy       |
| Tiamat's Wrath         | 500💎   | Boss (HP: 10,000)     | Hard       |
| Dragon Scale Hunt      | 150💎   | Collection (30 items) | Easy       |
| Void Essence Gathering | 400💎   | Collection (50 items) | Medium     |
| EX: Vecna's Ascension  | 1,000💎 | Boss (HP: 25,000)     | Legendary  |

Scrolls can also drop randomly from task completion (~1% base chance, improved by PER stat).

### 3.5 Seasonal Tab

During seasonal events (4 per year), special limited-time equipment becomes available:

- **Class-specific seasonal gear** purchasable with 💎 (current season)
- **Previous season's gear** purchasable with 🔷 Void Shards (premium currency)
- Seasonal gear is purely cosmetic variants with identical stats to standard equipment
- Timer showing "Event ends in X days"

### 3.6 Enchanted Armoire (from Habitica)

A mystery-reward feature:

```
┌──────────────────────────────────────────────┐
│  🗄 ENCHANTED ARMOIRE                         │
│                                               │
│  "Spend 100💎 for a chance at rare equipment, │
│   food for your pets, or bonus XP!"           │
│                                               │
│  [🎰 Open Armoire — 100💎]  gold CTA          │
│                                               │
│  Last reward: "Steel Gauntlets (+5 STR)"      │
└──────────────────────────────────────────────┘
```

- Costs 100 Spirit Crystals per pull
- Possible rewards:
  - **Equipment** (unique armoire-exclusive gear not available elsewhere)
  - **Food** (random food item for feeding pets)
  - **XP** (bonus experience points)
- This is Habitica's gold-sink mechanic — gives players something to spend gold on when they've bought all standard equipment

### 3.7 Purchase Flow

1. Player taps "Purchase" button
2. Confirmation: "Purchase Dragon Scale Mail for 350💎?"
3. On confirm: API call, currency deducted, item added to inventory
4. Success toast: "Equipped! Dragon Scale Mail — +12 CON +8 STR"
5. Insufficient funds: button disabled, price text in danger-red

---

## 4. Profile & Settings

### Profile Page (`/profile`)

```
┌──────────────────────────────────────────────┐
│  [Large Avatar 96px]  [Class Badge: ⚔ Warrior]│
│  "CrimsonBlade"  Cinzel 700 24px              │
│  Level 42  ·  Joined Dec 2024                 │
│                                               │
│  ❤ HP: ████████████████  42/50                │
│  🔮 MP: ████████████░░░  32/45                │
│  ⭐ XP: ████████████████░░░░  67% to Lvl 43   │
│                                               │
│  STATS:                                       │
│  STR: 48  INT: 32  CON: 56  PER: 41          │
│  (includes class bonus + equipment)           │
│                                               │
│  EQUIPPED GEAR:                               │
│  [Weapon icon] [Armor icon] [Helm] [Accessory]│
│                                               │
│  COLLECTION:                                  │
│  Monsters: 147  Pets: 24  Mounts: 8           │
│  Habits: 12   Streak: 🔥 14  Guild: Vanguard │
│                                               │
│  ACHIEVEMENTS:                                │
│  [🏆 Grid of achievement badges]              │
└──────────────────────────────────────────────┘
```

### Inventory Page (`/profile/inventory`)

```
EGGS:     [🥚 Wolf ×3] [🥚 Dragon ×1] [🥚 Phoenix ×2]
POTIONS:  [🧪 Fire ×4] [🧪 Void ×1] [🧪 Nature ×3]
FOOD:     [🍖 Meat ×8] [🍎 Fruit ×5] [🧀 Cheese ×3]
SCROLLS:  [🗞 Shadow Drake] [🗞 Hydra Hunt]
SHARDS:   [🔹 Fusion Shard ×12]
```

- Tap an Egg → select a Potion → Hatch! (pet appears with celebration animation)
- Tap Food → select a Pet to feed → growth progress bar increases

### Settings Page (`/settings`)

```
ACCOUNT:
  [Avatar upload]  [Change username]  [Change email]

CLASS:
  Current: ⚔ Warrior  [Change Class — costs 3🔷] (available at Level 10+)

PREFERENCES:
  Notifications: [Toggle: Streak reminders] [Toggle: Quest updates]
  Sounds:        [Toggle: Pull sound effects] [Toggle: Battle sounds]
  Day Start Time: [Time picker — when does your "day" reset? Default: midnight]

DANGER ZONE:
  [Log Out]  [Delete Account] (requires confirmation modal)
```

**Day Start Time:** Matches Habitica's Custom Day Start — allows players to set when their Cron runs (e.g., 2 AM for night owls). This determines when missed Dailies deal damage and when the day resets.

---

## 5. Technical Requirements

### State Management

- **TanStack Query** for all server data (guilds, shop items, fusion recipes, quests, equipment)
- **Zustand** for UI-only state with `devtools` middleware and named actions
- Feature-scoped query keys and API modules

### Animation

- All animations via **Framer Motion** — no CSS `@keyframes`
- Motion variants defined externally, never inline
- `AnimatePresence` for mount/unmount transitions
- All animations respect `prefers-reduced-motion`

### Component Architecture

- One component per file, PascalCase, max ~150 lines
- Shared UI components: `Card`, `Modal`, `PillTabs`, `UnderlineTabs`
- `cn()` utility for conditional class composition
- Semantic color tokens only — no raw hex values
- `border-border` Tailwind class — never inline `style={{ borderColor }}`

### Real-Time Updates

- Quest boss HP, party damage, rage bar → WebSocket push events
- Guild chat → WebSocket
- Currency changes → WebSocket (reflects instantly in header bar)
- Equipment stat changes → immediate UI recalculation
