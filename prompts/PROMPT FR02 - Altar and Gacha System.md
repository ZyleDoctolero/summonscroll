# PROMPT FR02 — SummonScroll: Altar & Gacha Summoning System v0.2

## Project Context & Objective

Build the SummonScroll Altar (Gacha Summoning) module. This is the core dopamine loop of the entire application — the moment where earned currency converts into collectible monsters via animated reveal sequences. This screen must feel premium, exciting, and reward-worthy.

**Crucial Design Constraint:** SummonScroll is a dark-fantasy productivity RPG. Every screen uses a deep dark background (`#0C0E14`), gold accent colors (`#C89A3E` / `#FFD54F`), and the Cinzel font for headings. Cards use `#13161F` surfaces with subtle `rgba(255,255,255,0.07)` borders. The Altar is the most visually dramatic screen in the entire app — banner art fills edge-to-edge, animations are layered and rarity-dependent, and every pull must feel like an event.

**Core Design Tokens:**
```
Backgrounds:   #0C0E14 (page) · #13161F (cards) · #1A1E2A (modals)
Accents:        #C89A3E (gold) · #FFD54F (gold-bright) · #7F77DD (void)
Rarity Colors:  #9E9E9E (Common) · #81C784 (Uncommon) · #4FC3F7 (Rare) · #FFB74D (Elite)
                #CE93D8 (Epic) · #FFD54F (Legendary) · #FF8A65 (Mythic) · #FFFFFF (EX)
Fonts:          Cinzel (headings) · DM Sans (body) · JetBrains Mono (stats)
```

---

## 1. Banner Display & Selection

### Altar Page (`/altar`)

**Banner Tab Navigation:** Pill-style tabs at the top of the screen:
```
[ Standard ] [ Featured ] [ Streak ] [ Pact Seal ] [ Event ]
```
Active tab: gold background + dark text. Inactive: elevated background + secondary text. Each tab filters to show only banners of that type.

### Banner Card Component

Each banner displays as a full-width card with dramatic art:
```
┌─[Banner Art — full bleed edge-to-edge]───────────────────┐
│  [Banner Name]  Cinzel 600                                │
│  [Realm Badge]  [Featured Monster Name]                   │
│  [Timer Arc ○] Ends in 12d 4h                            │
│  [HABIT CHARGED 🔥] badge (conditional glow border)       │
├──────────────────────────────────────────────────────────┤
│  PITY TRACKER:                                            │
│  🟡 Legendary ████░░░░ 63/100  "37 pulls left"           │
│  🟣 Epic      ████░░   40/50   "10 pulls left"           │
├──────────────────────────────────────────────────────────┤
│  Currency: 💎 2,450 Spirit Crystals                       │
│                                                           │
│          [PULL ×1  — 160💎]                               │
│    [★ PULL ×10 — 1,600💎 ★]  ← LARGER, primary action   │
│                                                           │
│  [Banner History]  [Rates]                                │
└──────────────────────────────────────────────────────────┘
```

**Key Behaviors:**
- Banner art fills full width — no white padding, art bleeds edge to edge
- Banner timer shows as a depleting arc around the banner art (not just plain text countdown)
- "PULL ×10" button is visually LARGER than "Pull ×1" — multi-pull is the primary action
- "HABIT CHARGED" badge: appears with a glowing animated border when the user has an active habit streak that matches the banner's realm affinity. This provides a visual incentive to maintain streaks.

### Pity Tracker

Both pity progress bars displayed simultaneously:
- Legendary pity: gold progress bar, `63/100 pulls` in JetBrains Mono
- Epic pity: purple progress bar, `40/50 pulls`
- When within 10 pulls of guarantee: amber pulse animation on the bar
- Text below each bar: "X pulls until guaranteed [Rarity]"

### Currency Display

Show the user's current Spirit Crystal (💎) balance prominently above the pull buttons. If insufficient for a pull, disable the button and show the balance in danger-red.

---

## 2. Pull Rates & Pity System

### Pull Probability by Banner Type

| Rarity | Standard | Featured | Streak | Pact Seal |
|---|---|---|---|---|
| Common | 45% | 35% | 25% | 10% |
| Uncommon | 25% | 22% | 20% | 15% |
| Rare | 17% | 25% | 30% | 25% |
| Elite | 8% | 12% | 16% | 22% |
| Epic | 4% | 5% | 7% | 15% |
| Legendary | 0.8% | 0.9% | 1.5% | 8% |
| Mythic | 0.15% | 0.08% | 0.4% | 4% |
| EX | 0.05% | — | 0.1% | 1% |

### Pity Guarantees

- **Rare pity:** Every 10 pulls → guaranteed Rare or higher
- **Elite pity:** Every 20 pulls → guaranteed Elite or higher
- **Epic pity:** Every 50 pulls → guaranteed Epic or higher
- **Legendary pity:** Every 100 pulls → guaranteed Legendary or higher
- **Mythic pity:** Every 200 pulls → guaranteed Mythic or higher
- **EX pity:** Every 500 Pact Seal pulls → guaranteed EX of active banner
- **Soft pity:** From pull 80 onward (Legendary pity counter), Legendary+ probability increases by +2% per pull

### EX Pull Rules

- EX monsters can ONLY be obtained from Pact Seal Banners (requires 30-day habit streak to earn Pact Seals)
- Each EX is unique — one per realm, 12 total
- Pulling a duplicate EX grants a Transcendence Stone instead

---

## 3. Summon Reveal Animations (Rarity-Tiered)

Each rarity tier has a progressively more dramatic reveal animation. The rarity of the pull determines which animation plays BEFORE the user sees what they got — building anticipation.

### Common / Uncommon (1100ms total)
```
0ms    → Dark overlay fades in 0→70% (150ms)
150ms  → Small portal appears center-screen, spins up (300ms)
450ms  → Monster slides in with element-colored particles (400ms spring easing)
850ms  → Rarity color flood from center outward (250ms)
1100ms → Name + rarity badge reveal (150ms slide up)
```

### Rare / Elite (1500ms total)
```
0ms    → Overlay darkens more dramatically (200ms)
200ms  → Element-colored beam shoots from bottom of screen (400ms)
600ms  → Monster appears within the beam with stat flash (500ms spring)
1100ms → Rarity particles scatter outward from center (400ms)
1500ms → Name + role icon + rarity badge reveal (200ms)
```

### Epic (2000ms total)
```
0ms    → Full dark overlay (250ms)
250ms  → Purple vortex portal opens center-screen, spiraling (600ms)
850ms  → Monster emerges from vortex — dramatic entrance (400ms)
1250ms → Purple particles fill screen corners (500ms)
1750ms → Name reveal with light ray behind text (250ms)
```

### Legendary (2600ms total — includes tension pause)
```
0ms    → Screen dims to near-black (300ms)
300ms  → Golden portal TEARS open — dramatic crack VFX (700ms)
1000ms → 500ms of silence and darkness (TENSION — learned from Genshin Impact)
1500ms → Monster emerges with screen-edge gold bloom
2000ms → Gold particle cascade fills entire screen (600ms)
2600ms → Name in Cinzel 48px fades in with light beam behind
```

### Mythic (2200ms total)
```
Phase 1: Full blackout + ember rain falling from above (600ms)
Phase 2: Prismatic aurora border sweeps in from edges (500ms)
Phase 3: Monster shown as black silhouette first, then full color reveal (800ms)
Phase 4: Name + "MYTHIC" badge descend from top of screen (300ms)
```

### EX (2400ms total — sacred, do not rush)
```
Phase 1: Full blackout — 400ms hold in pure darkness
Phase 2: Single white point appears at exact center of screen (200ms, 0→full opacity)
Phase 3: NOVA — white point expands to fill entire screen (200ms blinding flash)
Phase 4: White slowly recedes revealing monster in black silhouette (600ms)
Phase 5: Silhouette dissolves into full-color art with bloom effect (400ms)
Phase 6: "EX" badge in Cinzel 48px descends from top (300ms)
Phase 7: Realm Skill name + icon appears below monster name
```

**Accessibility:** If `prefers-reduced-motion` is set, condense ALL reveals to a 3-phase sequence: instant dark overlay → monster + name appear → badge. No particles, no glow scaling, no screen flash.

### Skip Button

A "Skip ▶" text button appears in the bottom-right corner after 500ms of any reveal animation. Tapping it immediately jumps to the final "done" state. Unobtrusive but accessible.

### Multi-Pull Result Grid (×10)

After all 10 individual reveals play (or are skipped), show a summary grid:
```
┌──────────────────────────────────────────────────────┐
│  "Summon Results"  Cinzel 700 24px                    │
│                                                       │
│  [Card] [Card] [Card] [Card] [Card]                  │
│  [Card] [Card] [Card] [Card] [Card]                  │
│                                                       │
│  Each card: monster art + name + rarity badge         │
│  Cards sorted by rarity DESCENDING (best first)       │
│  Card border color = rarity color                     │
│  Non-common cards get rarity glow box-shadow          │
│  "New!" badge on first-time pulls                     │
│                                                       │
│  ──────────── border-border ────────────              │
│  [Continue]  ← full-width gold CTA                    │
└──────────────────────────────────────────────────────┘
```

### Progress Dots (Multi-Pull)

During sequential reveals in a ×10 pull, show progress dots at the bottom center:
```
● ● ● ○ ○ ○ ○ ○ ○ ○
```
Current reveal = gold dot. Completed = gold dot. Upcoming = elevated background dot.

---

## 4. Currency & Economy

### Three Currencies

| Currency | Icon | Earn Method | Spend On |
|---|---|---|---|
| Spirit Crystals 💎 | Crystal icon | Habit completion, battle rewards, daily login | Standard/Featured/Streak banner pulls, Shop items |
| Void Shards 🔷 | Shard icon | 7-day streak milestone, battle floor rewards | Featured banner pulls, premium shop items |
| Pact Seals 🔑 | Seal icon | 30-day streak milestone, Day 7 login reward | Pact Seal banner pulls (EX monsters) |

### Pull Costs

| Banner Type | ×1 Cost | ×10 Cost |
|---|---|---|
| Standard | 160 💎 | 1,600 💎 |
| Featured | 200 💎 | 2,000 💎 |
| Streak | 180 💎 | 1,800 💎 |
| Pact Seal | 1 🔑 | 10 🔑 |

### Earning Crystals (Habitica-Aligned Economy)

Spirit Crystals (💎) are earned from ALL task completions — the amount varies based on:
- **Task difficulty multiplier:** Trivial (×0.1), Easy (×1.0), Medium (×1.5), Hard (×2.0)
- **Task value color:** Red (neglected) tasks give MORE crystals than blue (mastered) tasks — this self-balancing mechanic (from Habitica) means players who tackle their hardest, most-neglected tasks get rewarded with more pull currency
- **Perception stat:** Higher PER increases gold/crystal rewards from all tasks (Rogue class bonus)
- **Quest completion rewards:** Boss/Collection quest victories grant large crystal payouts
- **Arena battle rewards:** Clearing Chaos Tower floors grants crystals scaling with floor number
- **Daily login rewards:** 7-day cycle with crystals on most days (see FR01)

This means the path to more pulls is: complete your real-world habits consistently → earn crystals → spend on the Altar. The gacha is fueled entirely by productivity, not real money.

### WebSocket Real-Time Updates

Currency changes from any source (habit completion, battle rewards, shop purchases) must instantly reflect in the header currency bar via WebSocket push events. The Altar screen must also reactively update the pull button enabled/disabled state when currency changes.
