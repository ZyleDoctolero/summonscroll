# PROMPT FR03 — SummonScroll: Compendium & Monster Bonding v0.2

## Project Context & Objective

Build the SummonScroll Compendium and Monster Bonding module. This is the collection and progression system — where players browse their monster bestiary, inspect individual monsters, track bond progress, manage awakening stages, and see the direct visual impact of their habit consistency on monster health.

**Crucial Design Constraint:** SummonScroll is a dark-fantasy productivity RPG. Every screen uses a deep dark background (`#0C0E14`), gold accent colors (`#C89A3E` / `#FFD54F`), and the Cinzel font for headings. Monster cards must communicate rarity through glow intensity (not just color), and the visual bond between habits and monsters must be immediately obvious — missing habits makes monsters visually degrade.

**Core Design Tokens:**

```
Backgrounds:   #0C0E14 (page) · #13161F (cards) · #1A1E2A (modals)
Rarity Glows:  Common: none · Uncommon: 0 0 8px rgba(129,199,132,0.30)
               Rare: 0 0 12px rgba(79,195,247,0.40) · Elite: 0 0 14px rgba(255,183,77,0.45)
               Epic: 0 0 18px rgba(206,147,216,0.50) · Legendary: 0 0 28px rgba(255,213,79,0.65)
               Mythic: 0 0 32px rgba(255,138,101,0.70) · EX: 0 0 48px rgba(255,255,255,0.90)
Fonts:          Cinzel (monster names) · DM Sans (labels) · JetBrains Mono (stats, levels)
```

---

## 1. Compendium Browser (`/compendium`)

### Realm Tab Navigation

Pill-style tabs across the top, one per realm. Each tab shows the realm name and a collection count badge:

```
[ Ancient Vaults 43/160 ] [ Chaos Wastes 28/155 ] [ Outer Dark 12/145 ] ...
```

- Active tab: gold background + dark text with badge count
- Scrollable horizontally on mobile
- "All Realms" tab as first option shows the complete collection

### Filter Bar

Below the realm tabs, a comprehensive filter row:

```
[Search 🔍]  [Rarity ▼]  [Element ▼]  [Role ▼]  [Sort: Rarity↓ ▼]  [Grid/List toggle]
```

**Sort Options:** Rarity ↓ · Level ↓ · Bond ↓ · Recent · Alphabetical

### Monster Card (Grid View)

```
┌─[rarity glow border]─────────────────┐
│  ┌──────────────────────────────┐    │
│  │       Monster Portrait       │    │  200×200px art area
│  │       (or silhouette ?)      │    │
│  │                              │    │
│  │  [Role icon]   [Element ⚡]  │    │  bottom corners overlay
│  └──────────────────────────────┘    │
│  Monster Name                         │  Cinzel 600, 15px
│  Lvl 42  ·  Bond ████░░ 78%          │  JetBrains Mono 600, 12px
│  [★★★★☆ Awakening]                   │  Star indicator
│  [Rarity Badge]                       │
└──────────────────────────────────────┘
```

**Rarity Glow System:** Every card's `box-shadow` uses the rarity's glow value. Common has no glow. EX has a dramatic white nova glow. This is communicated through glow INTENSITY, not just color.

**Hover Behavior:** Scale to `1.03` + glow intensity increases by 20%. Use CSS `hover:brightness-105` — NOT React `useState` for hover tracking (avoids unnecessary re-renders).

**Missing Monsters (Silhouettes):** Monsters the player has NOT collected appear as dark silhouettes with a centered `?` mark. The silhouette shape matches the monster's actual art but is fully blacked out. This creates a "gotta catch 'em all" drive.

**Role Icons:** ⚔ Attacker · 🛡 Tank · 💚 Healer · ⭐ Support · ☠ Debuffer

### Monster Card (List View)

Compact horizontal row:

```
[Art 64px] [Name · Rarity Badge]  [Lvl 42]  [Bond 78%]  [Element]  [Role]
```

Toggle between Grid and List view via a toggle button in the filter bar top-right.

### Responsive Grid

| Breakpoint       | Columns | Card Width |
| ---------------- | ------- | ---------- |
| 375px (mobile)   | 2       | 160px      |
| 768px (tablet)   | 3       | 210px      |
| 1024px (desktop) | 4       | 220px      |
| 1280px+ (wide)   | 5       | 230px      |

No horizontal scrolling. Cards wrap vertically.

---

## 2. Monster Detail Sheet

Clicking a monster card opens a slide-over detail panel (or bottom sheet on mobile).

### Monster Art Display

Large monster portrait (256×256px) centered at the top. Border uses rarity glow. EX monsters have animated portraits (not static).

### Stats Section

```
┌─────────────────────────────────────────────┐
│  [Monster Name]  Cinzel 700, 24px            │
│  [Rarity Badge]  [Element Icon + Label]      │
│  [Role Icon + Label]  ·  Realm: Ancient Vaults│
│                                               │
│  Level 42 / 100                               │
│  HP:  1,240    ATK: 380    DEF: 210          │  JetBrains Mono
│  SPD: 165     CRIT: 18%   ACC: 92%          │
└─────────────────────────────────────────────┘
```

### Bond Progress Bar (Key Feature)

```
Bond Progress ──────────────────────────── 78%
[Realm-colored fill]  ████████████████░░░░░░░

Milestone markers at:
  25% → Skill 2 unlocks  (marker dot on bar)
  50% → Skill 3 unlocks  (marker dot on bar)
  100% → Passive ability unlocks (marker dot on bar)
```

- Bar fill color matches the monster's realm/element color
- On bond increase: radial sweep animation from center, sparkle particles at milestone markers
- Bond XP comes FROM habit completion (habits matching the monster's realm affinity)

### Skill List

Display the monster's skills in a vertical list:

```
[Skill 1]  "Arcane Bolt"  — Always unlocked
[Skill 2]  "Mana Shield"  — Unlocked at 25% bond (or locked/greyed if below)
[Skill 3]  "Void Rift"    — Unlocked at 50% bond
[Passive]  "Arcane Mastery"— Unlocked at 100% bond
[Realm Skill] (EX only)   — "Eye of Vecna" — 4th active slot, unique to EX monsters
```

Locked skills: greyed out icon + text, with "Requires XX% bond" label in tertiary text.

### Awakening Stars

```
★★★★☆  (4/5 Awakened)
```

- 0–5 stars displayed as filled/empty star icons
- Awakening requires consuming duplicate monsters of the same base
- Stages: Base → Awakened → Ascended → Transcendent → Apex (each = +1 star)

### Skin Selector

If the monster has unlocked cosmetic skins, display a horizontal skin thumbnail strip:

```
[Default ✓] [Eclipse] [Frost] [Infernal]
```

Tapping a skin swaps the portrait art. Selected skin shows a gold checkmark border.

---

## 3. Habit-Monster Visual Bond (Core Differentiator)

This is the key feature that makes SummonScroll unique — the visual connection between habit consistency and monster health. This must be immediately visible on monster cards, the island screen, and the detail view.

### Visual Degradation States

| Habit State                            | Monster Visual Effect                                            |
| -------------------------------------- | ---------------------------------------------------------------- |
| Healthy streak (7+ days)               | Full color, bright rarity glow at 100%, element particles        |
| Moderate streak (3–6 days)             | Slightly desaturated, glow at 70% intensity                      |
| At risk (1–2 days or missed yesterday) | Amber tint overlay, glow at 40%, small crack texture on portrait |
| Broken (missed today's habit)          | Greyscale portrait, red crack overlay, "FATIGUED" badge in red   |
| Just completed (animation)             | Flash of element color, sparkles burst, brief scale 1.1 bounce   |

**Where this renders:**

- **Monster Cards** in the Compendium grid — thumbnail shows degradation
- **Island screen sprites** — monsters on the island visually degrade
- **Detail view portrait** — full-size art shows the effect
- **Battle screen** — fatigued monsters display a red ⚡ debuff icon

### Bond XP Flow

```
User completes "Study" habit (Category: Study)
  → Category maps to Realm 1 (Ancient Vaults)
  → All user's Realm 1 monsters receive bond XP
  → Bond bar increases on those monsters
  → At milestones (25%/50%/100%), new skills unlock with celebration animation
```

Missing habits = those realm's monsters receive NO bond XP and begin degrading visually. The monster's battle power also decreases proportionally to streak health.

**Stat Contributions:** Monsters on the player's team provide stat bonuses (STR, INT, CON, PER) based on their role and element (see FR01 §2.5 for what stats do). Higher bond% = higher stat contribution. A FATIGUED monster provides 0 stat bonus — directly impacting the player's survivability and rewards.

**Equipment Interaction:** The player's equipped gear (see FR05 §3.2) provides additional stats. Stats from monsters + equipment + class bonuses all combine to determine: task rewards (PER), boss damage (STR), XP gain (INT), and damage reduction from missed Dailies (CON).

---

## 4. Loading & Empty States

### Skeleton Loaders (No spinners — learned from Genshin)

| Component          | Skeleton Shape                                                       |
| ------------------ | -------------------------------------------------------------------- |
| MonsterCard (grid) | Dark rect 200×280px, rounded 16px, 3 inner rects for name/level/bond |
| MonsterCard (list) | Full-width rect 80px tall with placeholder rectangles                |
| Monster Detail     | Large square + 4 text lines + 2 bars                                 |
| Filter Bar         | Row of pill-shaped rects                                             |

Skeleton shimmer: `background: linear-gradient(90deg, #13161F 25%, #1A1E2A 50%, #13161F 75%)` animated left→right.

### Empty States

| State                 | Visual                             | Message                                        | CTA                                 |
| --------------------- | ---------------------------------- | ---------------------------------------------- | ----------------------------------- |
| No monsters collected | Shadowed tome with closed lock     | "Your bestiary awaits your first summon."      | "Go to Altar →"                     |
| Realm tab empty       | Realm-themed silhouette art        | "No creatures discovered in [Realm Name] yet." | "Summon from this realm's banner →" |
| Search no results     | Magnifying glass over empty scroll | "No monsters match your search."               | —                                   |

Empty state illustrations should feel atmospheric and dark-fantasy themed — not generic clip art.
