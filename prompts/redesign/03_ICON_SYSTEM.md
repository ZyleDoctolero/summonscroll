# 03 — Icon System

> **Depends on:** [01_VISUAL_IDENTITY](./01_VISUAL_IDENTITY.md), [02_SURFACE_SYSTEM](./02_SURFACE_SYSTEM.md)

## The problem

The app uses emoji as primary icons everywhere — 👾 for monsters, 💎 for crystals,
🪨 for stones, 📕 for tomes, 🔥 for streaks, 🪦 for fallen, 🍖 for food, etc.

This is broken because:

1. **Emoji renders differently on every OS.** Windows users see Microsoft's
   geometric set, iOS users see Apple's gloss, Android users see Google's. The
   "same icon" is three different images.
2. **Emoji cannot be color-tinted.** A 💎 stays cyan even when you want it to
   match the stat-int variable.
3. **Emoji are unrelated to each other visually.** 🪦 is realistic; 🍖 is
   cartoon; 👾 is retro arcade. They don't form a _set_.
4. **Emoji read as "AI prototype" or "Discord bot."** A polished app uses
   either a consistent line-icon set, custom commissioned glyphs, or pixel
   sprites that match the world.

## The fix

Pick ONE icon strategy. Below are three options keyed to the three visual
identity proposals.

---

## Option A — Phosphor Icons (for Proposal A / C — line-icon worlds)

**Why:** Free, MIT, 7,000+ icons in 6 weights (thin / light / regular / bold /
fill / duotone). Consistent stroke width. Easy to tint with CSS color. Maintained.

**Install:**

```bash
npm install @phosphor-icons/react
```

**Usage pattern:**

```tsx
import { Sword, Heart, Coins, Sparkle } from "@phosphor-icons/react";

// Use weight="regular" by default
<Sword size={16} weight="regular" />

// For decorative emphasis (titles, hero moments)
<Sparkle size={24} weight="duotone" />

// For active/selected states
<Heart size={16} weight="fill" />
```

**Style discipline:**

- All icons in a single screen use the **same weight** (`regular` or `light`).
- Inline color: use CSS custom properties so they inherit the surface palette:
  ```tsx
  <Coins size={14} style={{ color: "var(--gold-leaf)" }} />
  ```
- Hero moments (modal headers, ceremony banners) can use `duotone` weight.
- Active selection states use `fill`.

---

## Option B — Pixelarticons (for Proposal B — pixel JRPG world)

**Why:** Free, MIT, 480+ pixel-perfect icons designed for retro UI. Render
sharp at 16/24/32px on integer scales.

**Install:**

```bash
npm install pixelarticons
```

**Usage pattern:**

```tsx
// Import as React components (each icon is a tiny SVG)
import Sword from "pixelarticons/svg/sword.svg?react";

<Sword className="w-4 h-4 text-[var(--lantern)]" />;
```

**CSS for pixel sharpness:**

```css
.pixel-icon {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges; /* legacy */
}
```

**Sizing rule:** Multiples of 8px only (8/16/24/32/48). Anything else blurs.

---

## Option C — Commissioned line set (for any proposal, premium feel)

**Why:** Hand-drawn, brand-specific. Premium games do this. ~$30–80 from a
Fiverr illustrator or one weekend with Figma.

**Process:**

1. Build a CSV of every icon the app needs (see migration table below).
2. Commission a single illustrator to make all 30-40 in matching style.
3. Export as inline SVG components (no PNG — must be tintable).
4. Drop into `src/components/icons/` as one component per icon.

**This is the highest-quality outcome. Skip if budget = $0.**

---

## Option D — Lucide Icons (for Proposal D — modern gacha world)

**Why:** Free, ISC, ~1,500 clean geometric icons designed for modern UI. Sharp
consistent stroke, perfectly readable at small sizes, easy to tint. Used in
Linear, Vercel, and most modern UI kits. Distinct from Phosphor: more
geometric, less organic — exactly the right vibe for D's HUD-style chrome.

**Install:**

```bash
npm install lucide-react
```

**Usage pattern:**

```tsx
import { Sword, Heart, Coins, Sparkles, Crown, Skull } from "lucide-react";

// Default — clean stroke, current size, current color
<Sword className="w-4 h-4 text-[var(--gold-bright)]" />

// With glow effect (Proposal D signature)
<Crown
  className="w-6 h-6 lucide-glow"
  style={{ color: "var(--gold-bright)", filter: "drop-shadow(0 0 6px var(--gold-glow))" }}
/>
```

**Proposal D — glow CSS utility:**

```css
.lucide-glow {
  filter: drop-shadow(0 0 4px currentColor);
  transition: filter 160ms ease-out;
}
.lucide-glow:hover {
  filter: drop-shadow(0 0 8px currentColor) drop-shadow(0 0 16px currentColor);
}
```

**Style discipline (Proposal D specific):**

- All icons use **stroke-width 1.75–2.25** consistently (Lucide default is 2)
- Tint with the accent color matching their meaning (gold for currency,
  violet for sigil/rare, cyan for arcane, rose for mythic)
- Hero icons in modals get `.lucide-glow` always
- Active state in nav uses `fill` on the icon + glow

---

## The icon migration map

Every emoji currently in the codebase, what it represents, and what to swap it
for. (Phosphor names shown — adapt for Pixelarticons or your commissioned set.)

### Currency / resource

| Current | Where used             | Phosphor               | Pixelarticons    | Notes                                              |
| ------- | ---------------------- | ---------------------- | ---------------- | -------------------------------------------------- |
| 💰      | gold balance, rewards  | `Coins`                | `coin`           | tint: `var(--gold-leaf)`                           |
| 💎      | crystals balance       | `Diamond`              | `diamond`        | tint: `var(--river)` for B, `var(--sigil)` for A/C |
| 🔑      | pact seals             | `Key`                  | `key`            | tint: `var(--blossom)` or `var(--gold-burn)`       |
| 📕      | Tome of Reverse Heaven | `BookOpen` (fill)      | `book-open`      | always gold                                        |
| 🪨      | crafting stones        | `Cube` (duotone)       | `stone` (custom) | tint per element                                   |
| ⚡      | stamina                | `Lightning`            | `bolt`           | tint: `var(--lantern)`                             |
| ✨      | rare materials         | `Sparkle`              | `sparkles`       | tint: gold                                         |
| 🥚      | egg drops              | `Egg`                  | (custom)         | neutral                                            |
| 🧪      | realm potions          | `TestTube` (or `Drop`) | `flask`          | per realm color                                    |
| 🍖      | food drops             | `ForkKnife`            | `meat`           | neutral warm                                       |

### Player state

| Current | Where used             | Phosphor               | Pixelarticons  | Notes                   |
| ------- | ---------------------- | ---------------------- | -------------- | ----------------------- |
| 🔥      | streak                 | `Flame`                | `flame`        | animated tint on active |
| ❄       | broken streak          | `Snowflake`            | `snowflake`    | dim                     |
| 🧊      | freeze charm           | `Snowflake`            | `shield`       | always blue             |
| 💖      | bond                   | `Heart` (fill)         | `heart`        | active animation        |
| 🥀      | despondent monster     | `Heart` (regular, dim) | `heart-broken` | desaturated             |
| 💔      | fading monster         | `HeartBreak`           | `heart-broken` | red dim                 |
| ❤       | HP                     | `Heart`                | `heart`        | red                     |
| ✦ ✧     | XP marker              | `Sparkle`              | `sparkle`      | gold                    |
| 👑      | apex crown, boss slain | `Crown` (fill)         | `crown`        | gold                    |
| 💀      | death state            | `Skull`                | `skull`        | red dim                 |

### Activity / system

| Current | Where used         | Phosphor                       | Pixelarticons      | Notes        |
| ------- | ------------------ | ------------------------------ | ------------------ | ------------ |
| ☀       | morning ritual     | `Sun` (regular for AM)         | `sun`              | warm yellow  |
| 🌙      | evening reflection | `MoonStars`                    | `moon-stars`       | sigil violet |
| ⚔       | battle, attack     | `Sword` (duotone for hero)     | `sword`            | neutral      |
| 🗼      | tower              | `Tower` or `BuildingApartment` | `castle`           | stone        |
| 🔮      | summoning          | `Sphere` or `CrystalBall`      | `eye`              | sigil        |
| 🪦      | memorial / fallen  | `Cross` (regular)              | `cross`            | stone        |
| 🏝      | island             | `Island`                       | `island`           | warm green   |
| ⚜       | level / lvl marker | `Crown` (light)                | `fleur-de-lis`     | gold         |
| ⭐      | sacred directive   | `Star` (fill)                  | `star`             | gold         |
| ✓       | completed          | `Check`                        | `check`            | moss         |
| ✕       | dismiss / close    | `X`                            | `close`            | tertiary     |
| ← →     | back / next        | `ArrowLeft/Right`              | `arrow-left/right` | secondary    |

### Monster placeholder

| Current | Where used                         | Replacement                                                                                                                                                                  |
| ------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 👾      | every monster card with no art_url | **Hard requirement**: replace with the placeholder `public/monsters/placeholder.png` already in the repo, OR a generic Phosphor `Sphere` (fill) at 50% opacity. NEVER emoji. |

---

## The icon component layer

Create `src/components/ui/Icon.tsx` to centralize tinting + sizing:

```tsx
import {
  Coins,
  Diamond,
  Key,
  BookOpen,
  Cube,
  Lightning,
  Sparkle,
  Egg,
  TestTube,
  ForkKnife,
  Flame,
  Snowflake,
  Heart,
  HeartBreak,
  Crown,
  Skull,
  Sun,
  MoonStars,
  Sword,
  Sphere,
  Cross,
  Star,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
} from "@phosphor-icons/react";

const ICONS = {
  // Currency
  gold: Coins,
  crystal: Diamond,
  seal: Key,
  tome: BookOpen,
  stone: Cube,
  stamina: Lightning,
  sparkle: Sparkle,
  egg: Egg,
  potion: TestTube,
  food: ForkKnife,
  // Player
  streak: Flame,
  cold: Snowflake,
  bond: Heart,
  bondLow: HeartBreak,
  hp: Heart,
  xp: Sparkle,
  crown: Crown,
  death: Skull,
  // Activity
  morning: Sun,
  evening: MoonStars,
  battle: Sword,
  tower: Sphere, // swap if your set has a better tower icon
  summon: Sphere,
  memorial: Cross,
  star: Star,
  // Actions
  check: Check,
  close: X,
  prev: ArrowLeft,
  next: ArrowRight,
} as const;

export type IconName = keyof typeof ICONS;
export type IconWeight = "thin" | "light" | "regular" | "bold" | "fill" | "duotone";

export function Icon({
  name,
  size = 16,
  weight = "regular",
  color = "currentColor",
  className,
}: {
  name: IconName;
  size?: number;
  weight?: IconWeight;
  color?: string;
  className?: string;
}) {
  const Component = ICONS[name];
  return <Component size={size} weight={weight} color={color} className={className} aria-hidden />;
}
```

Now every icon-use in the app becomes:

```tsx
import { Icon } from "@/components/ui/Icon";

// Replaces: <span>💰 {amount}</span>
<span className="inline-flex items-center gap-1">
  <Icon name="gold" size={14} color="var(--gold-leaf)" />
  {amount}
</span>;
```

---

## Migration files

Search the codebase for every emoji and replace:

```bash
# Audit pass — find every literal emoji in components/routes
grep -rnE '💰|💎|🔑|📕|🪨|⚡|✨|🥚|🧪|🍖|🔥|❄|🧊|💖|🥀|💔|❤|👑|💀|☀|🌙|⚔|🗼|🔮|🪦|🏝|⚜|⭐|✓|✕|👾' \
  src/components src/routes --include='*.tsx'
```

The 8 highest-impact files to migrate first (these have the most emoji):

1. `src/components/game/PlayerHeader.tsx` — currencies, streak, freeze
2. `src/components/game/CascadeCard.tsx` — every event row icon
3. `src/components/game/WhisperFeed.tsx` — tone icons
4. `src/components/game/DailyRitual.tsx` — ☀ / 🌙 glyphs
5. `src/routes/_authenticated/index.tsx` — Hub header, focus ritual, ritual pill
6. `src/routes/_authenticated/expeditions.tsx` — drop type icons, stamina
7. `src/routes/_authenticated/altar.tsx` — pull cost icons, summon
8. `src/routes/_authenticated/profile.tsx` — quick-stat icons

Rare ones (still migrate, lower priority): 9. `src/routes/_authenticated/trial.tsx` — 🪦, ☠ 10. `src/routes/_authenticated/quests.tsx` — 👑 on slain 11. `src/routes/_authenticated/codex.tsx` — heatmap legend 12. `src/routes/_authenticated/battle.tsx` — milestone icons

---

## Acceptance checks

```bash
# 1. No emoji remaining in source (excludes node_modules)
grep -rnE '💰|💎|🔑|📕|🪨|⚡|✨|🔥|❄|💖|❤|👑|💀|☀|🌙|⚔|🪦|⭐|👾' \
  src --include='*.tsx' --include='*.ts' | wc -l
# Expect: < 5 (only in display-only contexts like onboarding text, if any)

# 2. Icon component is used widely
grep -rn 'from "@/components/ui/Icon"' src --include='*.tsx' | wc -l
# Expect: 12+

# 3. Build still passes
npm run build
```

## Tasks for agent

1. Decide A (Phosphor), B (Pixelarticons), or C (commissioned) based on file 01.
2. Install the chosen package.
3. Create `src/components/ui/Icon.tsx` per the spec above.
4. Walk the 8 high-impact files and replace every emoji. Test each in build before committing.
5. Replace the `👾` monster placeholder with `/monsters/placeholder.png` in Compendium/Altar.
6. Run the audit and acceptance checks.
7. Commit per-file for clean history.

## Out of scope

- **Don't migrate WhisperFeed tone icons until file 09 (empty states).**
  That file rewrites the tone language anyway.
- **Don't replace `🥕` `🧠` `🚀` etc. in `TaskCard` category icons.** Those are
  user-chosen and intentionally varied — keep them as user expression. We may
  replace with a category picker UI in a later round.
- **Don't touch sound icons (`🔊`/`🔇`) in the sidebar.** They're UI-system
  icons. Replace as part of file 02's button migration instead.
