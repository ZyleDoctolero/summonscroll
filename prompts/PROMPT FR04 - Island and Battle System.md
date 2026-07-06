# PROMPT FR04 — SummonScroll: Island & Battle System v0.2

## Project Context & Objective

Build the SummonScroll Island (Monster Habitat) and Battle System modules. The Island is where the player's collected monsters live — their visual state reflecting real-world habit consistency. The Battle System combines two modes: (1) **Quest Battles** that work like Habitica's boss/collection quests — where completing real-world tasks deals damage to bosses and missing dailies makes the boss attack your entire guild party, and (2) **Arena Battles** which are automated turn-based monster combat for farming rewards.

**Crucial Design Constraint:** SummonScroll is a dark-fantasy productivity RPG. Every screen uses a deep dark background (`#0C0E14`), gold accent colors (`#C89A3E` / `#FFD54F`), and the Cinzel font for headings. The Island must feel alive and reactive to player behavior. Quest battles tie directly into the habit loop (Habitica-style), while Arena battles provide traditional gacha RPG combat.

**Core Design Tokens:**
```
Backgrounds:   #0C0E14 (page) · #13161F (cards) · #1A1E2A (modals)
Accents:        #C89A3E (gold) · #FFD54F (gold-bright) · #E05252 (danger) · #5FAD41 (success)
Weather:        Sunny = success green halo · Overcast = amber tint · Stormy = danger red tint
Fonts:          Cinzel (headings) · DM Sans (body) · JetBrains Mono (stats)
```

---

## 1. Island Habitat (`/island`)

### Dynamic Weather System

The island background and atmosphere change based on the player's habit completion for the day:
```
Sunny (☀)    → All habits completed today    → Bright, warm tones, clear sky
Overcast (🌥) → Partial completion            → Muted, grey overtones, clouds
Stormy (⛈)   → Multiple habits missed        → Dark, red-tinted, rain/lightning effects
```

**Weather Transition:** 2000ms linear crossfade between states — never abrupt.

**Data Source:** Weather must be wired to the REAL habit completion percentage from the API, not hardcoded values.

### Biome Selector

The island has multiple biome zones that correspond to the 12 realms:
```
[ 🏛 Vaults ] [ 🔥 Wastes ] [ 🌀 Dark ] [ 💀 Blight ] [ 🌿 Wild ] [ ✨ Divine ] ...
```
Each biome displays only the monsters from that realm's affinity. Biome visual style matches the realm's theme.

### Monster Sprites on Island

Each team-assigned monster appears as a sprite on the island. Their behavior reflects bond percentage:
```
Bond 0–25%:   Monster sits still, looks away from camera
Bond 26–75%:  Monster roams idle, occasionally glances at camera
Bond 76–100%: Monster excited, waves, plays, bounces
```

### Activity Halo (Critical Feature)

Each monster sprite has a colored halo ring beneath it:
- **Green halo** → The habit linked to this monster's realm was completed today
- **Grey halo** → The habit has NOT been completed today

### FATIGUED State

When a habit streak is broken, the affected realm's monsters display:
- Greyscale portrait (desaturated sprite)
- Red crack overlay texture
- "FATIGUED" badge in red text above the sprite
- Battle power reduced (visible in stat display)

### Team Slot Assignment

```
┌──────────────────────────────────────────────┐
│  YOUR TEAM (5 slots)                          │
│  [Monster 1] [Monster 2] [Monster 3] [+] [+] │
│                                               │
│  Team Power: 12,450  (JetBrains Mono)         │
│  [Manage Team →]                              │
└──────────────────────────────────────────────┘
```
- Tapping an empty `[+]` slot opens the Compendium for monster selection
- Team monsters provide stat bonuses to the player (STR, INT, CON, PER) based on their element and role

---

## 2. Battle System (`/battles`) — Two Modes

### Mode Selection Screen

```
┌──────────────────────────────────────────────────────┐
│  "Battle"  Cinzel 700 24px                            │
│                                                       │
│  QUEST BATTLES (Habitica-style)                       │
│  ┌──────────────────┐  ┌──────────────────┐          │
│  │  ⚔ BOSS QUEST    │  │  🔍 COLLECTION   │          │
│  │  "Slay Tiamat"   │  │  "Dragon Scales" │          │
│  │  HP ████░░ 60%    │  │  Found 12/30     │          │
│  │  Party: 4 members │  │  Party: 4 members│          │
│  │  [View Quest →]   │  │  [View Quest →]  │          │
│  └──────────────────┘  └──────────────────┘          │
│                                                       │
│  ARENA BATTLES (Auto-combat)                          │
│  ┌──────────────────┐  ┌──────────────────┐          │
│  │  🗼 CHAOS TOWER   │  │  🎪 EVENT        │          │
│  │  Floor 47/100     │  │  "Eclipse Hunt"  │          │
│  │  ████████░░ 47%   │  │  Ends in 3d 12h  │          │
│  │  [Enter →]        │  │  [Enter →]       │          │
│  └──────────────────┘  └──────────────────┘          │
└──────────────────────────────────────────────────────┘
```

---

## 3. Quest Battles (Habitica-Style — Core Mechanic)

This is the **primary battle mode** and directly mirrors Habitica's quest system. Players do NOT control combat in real-time. Instead, completing real-world tasks IS the combat.

### 3.1 How Quest Battles Work

Quest Battles are cooperative challenges shared with the player's **guild party**. A quest is started using a **Quest Scroll** (obtained from the Shop, random drops, or quest rewards).

**The fundamental mechanic:** Your real-world habits, dailies, and to-dos ARE your attacks against the boss. There is no separate "fight" screen — you fight by living your life.

### 3.2 Boss Quests (from Habitica)

A Boss Quest pits the entire guild party against a boss monster with a large HP pool:

```
┌──────────────────────────────────────────────────────┐
│  BOSS QUEST: "Slay Tiamat the Chromatic"              │
│  Quest scroll used by: CrimsonBlade                   │
│                                                       │
│  [Tiamat Art — large, dramatic, center]               │
│                                                       │
│  BOSS HP:                                             │
│  ████████████████░░░░░░░░  6,500 / 10,000 HP          │
│                                                       │
│  BOSS RAGE:                                           │
│  ██████░░░░░░░░░░░░░░░░░  320 / 1,000                │
│  "If rage fills, Tiamat heals 1,000 HP!"             │
│                                                       │
│  YOUR DAMAGE TODAY: 245                               │
│  PARTY DAMAGE TODAY: 1,120                            │
│                                                       │
│  PARTY MEMBERS:                                       │
│  [Avatar] CrimsonBlade  — 245 dmg today               │
│  [Avatar] NightOwl      — 380 dmg today               │
│  [Avatar] ZenMaster     — 310 dmg today               │
│  [Avatar] IronWill      — 185 dmg today               │
│                                                       │
│  ───────────────────────────────────                   │
│  "Complete your Habits, Dailies, and To-Dos to        │
│   deal damage! Missing Dailies lets the boss          │
│   attack your entire party!"                          │
└──────────────────────────────────────────────────────┘
```

**Damage to Boss (from completing tasks):**
```
bossDamage = taskValue × difficultyMultiplier × STR_bonus × critMultiplier

difficultyMultiplier: Trivial=0.1, Easy=1.0, Medium=1.5, Hard=2.0
STR_bonus: 1 + (STR × 0.005)
critMultiplier: random chance (influenced by STR), 1.5× on crit
```

- Every completed Habit (+), Daily, and To-Do deals damage to the boss
- Completing red/neglected tasks deals MORE damage (task value is higher)
- Warrior's "Brutal Smash" and Mage's "Burst of Flames" skills deal bonus damage on top
- Damage accumulates throughout the day and is applied at Cron (midnight)

**Boss Attacks (from missing Dailies):**
```
bossAttack = Σ(missedDaily.value × missedDaily.difficulty) × bossStrength

This damage is dealt to EVERY party member, not just the player who missed.
```

- At Cron (midnight), ALL unchecked Dailies from ALL party members are tallied
- The boss attacks every party member for the combined damage
- **This is the social accountability mechanic** — your missed dailies hurt your friends
- This motivates players to complete tasks to protect their guild mates

**Boss Rage Mechanic:**
- Some bosses have a Rage bar that fills from missed Dailies
- If the Rage bar fills completely, the boss activates a special effect:
  - Most bosses: **heal themselves** (undo party progress)
  - Special bosses: unique rage effects (e.g., "Tiamat breathes fire — all party members lose 20 HP")
- Rage bar resets after activation

**Quest Completion:**
When boss HP reaches 0:
1. Victory animation: boss shatters, gold particle explosion
2. **ALL party members receive rewards** (not just top damage dealers):
   - Quest-specific pet egg (e.g., "Dragon Egg 🥚")
   - Spirit Crystals (scales with boss difficulty)
   - XP (scales with boss difficulty)
   - Chance for rare equipment/fusion materials
3. Toast: "🏆 QUEST COMPLETE — Tiamat has been defeated!"

### 3.3 Collection Quests (from Habitica)

Instead of fighting a boss, players collect items by completing tasks:

```
┌──────────────────────────────────────────────────────┐
│  COLLECTION QUEST: "Gather Dragon Scales"             │
│                                                       │
│  [Quest Art]                                          │
│                                                       │
│  ITEMS FOUND:                                         │
│  🐉 Dragon Scales:  ████████░░░░  12 / 30             │
│  💎 Dragon Teeth:   ██████░░░░░░   8 / 20             │
│                                                       │
│  "Complete tasks for a chance to find quest items!"   │
│                                                       │
│  YOUR FINDS TODAY: 3 scales, 1 tooth                  │
└──────────────────────────────────────────────────────┘
```

- Every completed task has a random chance to find a quest item
- Drop chance is influenced by Perception (PER) stat
- When all items are collected, all party members receive rewards
- No penalty for missing Dailies (collection quests don't have a boss to attack you)

### 3.4 Quest Scroll System

Quest Scrolls are items that start quests:

| Source | Example |
|---|---|
| Shop purchase (gold/crystals) | "Tiamat Quest Scroll — 500💎" |
| Random drop from tasks | Rare drop (~1% chance) |
| Quest completion reward | Completing a quest unlocks the next in a quest line |
| Achievement reward | "Complete 100 habits → unlock Legendary Quest Scroll" |
| Guild milestones | Guild reaches Level 10 → "Raid: Bahamut" scroll |

**Starting a Quest:**
1. Player uses a Quest Scroll from their inventory
2. Invitation is sent to all guild party members
3. Party members accept or decline
4. Quest begins when all members respond OR the quest owner force-starts it
5. Only one quest can be active at a time per guild party

---

## 4. Arena Battles (Auto-Combat RPG Mode)

These are traditional automated monster battles for farming rewards. Unlike Quest Battles, these happen in a dedicated combat screen.

### 4.1 Arena Modes

| Mode | Description | Unlock |
|---|---|---|
| **Chaos Tower** 🗼 | Floor-by-floor progression (1-100). Endless climb. Higher floors = better rewards. | Level 5 |
| **Event Arena** 🎪 | Limited-time battles with special enemies and exclusive drops. | Level 10 |
| **Boss Rush** ⚔ | Fight 5 bosses in sequence. No healing between fights. | Level 20 |

### 4.2 Battle Preparation Screen

```
┌─────────────────────────────────────────────┐
│  [Mode Name]  Cinzel 700 20px                │
│  Floor 47 — Team of 5 monsters               │
│                                               │
│  [Avatar 1] [Avatar 2] [Avatar 3] [4] [5]   │
│  Monster names below each                     │
│  Rarity glow on each avatar circle            │
│  ⚡ FATIGUED badge on monsters with broken streaks │
│                                               │
│  Team Power: 12,450                           │
│  [⚔ Start Battle]       [Cancel]             │
└─────────────────────────────────────────────┘
```

**Guard Condition:** If < 3 monsters on team → disable battle → "Build a team of 3+ to enter battle." with CTA to `/island`.

### 4.3 Battle Outcome Screen

```
┌─────────────────────────────────────────────┐
│  ⚔ VICTORY  (or 💀 DEFEAT)                  │
│  Cinzel 700 32px, gold-bright (or danger)    │
│  Chaos Tower — Floor 47 — 8 rounds           │
│                                               │
│  YOUR TEAM                                    │
│  ████████████████░░░  1,240 / 1,500 HP       │  green bar
│                                               │
│  ENEMY                                        │
│  ░░░░░░░░░░░░░░░░░░  0 / 2,000 HP            │  red bar
│                                               │
│  BATTLE LOG:                                  │
│  R1  Team Attack          -180                │
│  R1  Shadow Drake attacks  -95                │
│  R2  Team Attack          -210                │
│  ...                                          │
│                                               │
│  [Next →]  (reveals log in chunks of 5)       │
│                                               │
│  REWARDS:                                     │
│  +450💎  +1🔷  +120 XP  +🥚 Wolf Egg!        │
│                                               │
│  [Continue]  ← gold CTA                       │
└─────────────────────────────────────────────┘
```

### 4.4 Fatigue Debuff in Arena

Monsters with broken habit streaks (FATIGUED state from FR01 §2.4):
- Red ⚡ debuff icon next to their name
- **Damage reduced by 30%** (calculated server-side)
- Visual indicator in log: "Team Attack (FATIGUED: -30%)"
- This creates direct motivation: "If I don't do my study habit, my Ancient Vaults monsters will be weak in battle"

### 4.5 Arena Rewards

| Outcome | Crystals | Shards | XP | Drops |
|---|---|---|---|---|
| Victory | 15× floor multiplier | 1 per 10 floors | 30× floor multiplier | Random egg/potion/food chance |
| Defeat | 5 fixed | 0 | 10 fixed | No drops |

---

## 5. Pet & Mount System (from Habitica)

Pets and Mounts are cosmetic collectibles hatched from drops:

### 5.1 Hatching

```
🥚 Wolf Egg  +  🧪 Fire Realm Potion  =  🐺 Fire Wolf (Pet)
```

- **Eggs** drop randomly from task completion (see FR01 §2.7)
- **Realm Potions** drop randomly from task completion (12 types, one per realm)
- Each Egg + Potion combination produces a unique pet variant
- Pets appear on the player's Island alongside their monster team

### 5.2 Feeding & Growing

- Pets can be fed **Food** items (also random drops from tasks)
- Feeding a pet enough food grows it into a **Mount** (larger, more dramatic cosmetic)
- Mounts appear as rideable creatures on the Island
- Neither pets nor mounts affect gameplay stats — purely cosmetic collection

### 5.3 Pet Collection Grid

Accessible from Profile → Pets & Mounts:
```
┌──────────────────────────────────────────────┐
│  PETS (24/120 collected)                      │
│  [🐺] [🐉] [🦅] [?] [?] [?] [?] [?]        │
│  [?]  [?]  [?]  [?] [?] [?] [?] [?]         │
│                                               │
│  MOUNTS (8/120 collected)                     │
│  [🐺] [🐉] [?] [?] [?] [?] [?] [?]         │
└──────────────────────────────────────────────┘
```
- Collected: full color icon
- Not collected: grey silhouette with `?`
- "Gotta catch 'em all" collection drive

---

## 6. Screen Shake & Battle Animations

### Damage Screen Shake

On enemy attack in Arena battles, trigger a Framer Motion screen shake:
- Shake intensity scales with damage percentage
- Duration: 200ms, ease-in-out
- Implementation: Framer Motion `animate` with `x` offset, NOT CSS `@keyframes`

### Quest Boss Damage Animation

When the Cron processes and the boss takes damage / attacks:
1. Boss HP bar depletes with a satisfying animation (500ms)
2. If boss attacked: red flash on screen edges + HP bar decreases
3. Damage numbers float up from the boss: "−1,120 HP"
4. If boss rage activated: special rage animation + warning toast

### Post-Arena Reward Reveal

1. Treasure chest icon appears center-screen
2. Chest opens with gold particle burst (400ms)
3. Reward items float up (+450💎, +🥚 Egg, +120 XP)
4. "Continue" button appears below

---

## 7. Technical Requirements

- **Quest battles are NOT real-time** — damage accumulates from task completion and is processed at Cron
- **Arena battles are server-authoritative** — client sends team + mode + floor, server simulates and returns results
- Quest state is shared across guild via WebSocket real-time updates (boss HP, party damage, rage bar)
- All state mutations go through Zustand stores with named devtools actions
- TanStack Query for all server data with proper cache invalidation
- Error handling: toast notifications on API errors
