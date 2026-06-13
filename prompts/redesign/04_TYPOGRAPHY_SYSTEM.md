# 04 — Typography System

> **Depends on:** [01_VISUAL_IDENTITY](./01_VISUAL_IDENTITY.md)

## The problem

The app uses 3 fonts:

- DM Sans (everything UI)
- Cinzel (headers + display)
- JetBrains Mono (numbers)

That's the minimum. JRPGs and high-end UIs typically run 4–6 with intentional
roles. The current setup also lacks **type roles** — every heading is the same
Cinzel weight, every body is DM Sans, the brain has no signal about "this is a
hero number" vs "this is a lore caption."

## The fix

Five typographic roles, one font per role. Each role has a purpose. Components
use the role classes, not raw font-family declarations.

---

## The five roles

| Role        | Used for                                                                                        | Sample sizes |
| ----------- | ----------------------------------------------------------------------------------------------- | ------------ |
| **Display** | Hero numbers, ceremony titles, big reveals. Used sparingly — fewer than 5 instances per screen. | 36–64px      |
| **Heading** | Screen titles, section labels, card titles.                                                     | 18–28px      |
| **Body**    | All running UI text — buttons, descriptions, instructions, errors.                              | 13–16px      |
| **Mono**    | Counts, percentages, stats, currency amounts.                                                   | 12–18px      |
| **Lore**    | Italic / atmospheric text — whisper lines, journal entries, empty states, monster flavor.       | 12–14px      |

---

## Font picks per visual identity

### Proposal A — The Burning Page (illuminated manuscript)

```html
<!-- in src/index.html, replace the existing fonts <link>: -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&family=Cormorant+Garamond:wght@400;600;700&family=EB+Garamond:wght@400;500;600&family=Caudex:ital@0;1&family=JetBrains+Mono:wght@400;600&display=swap"
/>
```

| Role    | Font                   | Family stack                    |
| ------- | ---------------------- | ------------------------------- |
| Display | IM Fell English SC     | `'IM Fell English SC', serif`   |
| Heading | Cormorant Garamond 600 | `'Cormorant Garamond', serif`   |
| Body    | EB Garamond 500        | `'EB Garamond', Georgia, serif` |
| Mono    | JetBrains Mono 600     | `'JetBrains Mono', monospace`   |
| Lore    | Caudex italic          | `'Caudex', serif`               |

### Proposal B — The Lantern Garden (pixel JRPG)

```html
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@500;700&family=Inter:wght@400;500;600;700&family=Crimson+Text:ital@0;1&family=Press+Start+2P&family=JetBrains+Mono:wght@400;600&display=swap"
/>
```

| Role    | Font                | Family stack                     |
| ------- | ------------------- | -------------------------------- |
| Display | Press Start 2P      | `'Press Start 2P', monospace`    |
| Heading | Pixelify Sans 700   | `'Pixelify Sans', monospace`     |
| Body    | Inter 500           | `'Inter', system-ui, sans-serif` |
| Mono    | JetBrains Mono 600  | `'JetBrains Mono', monospace`    |
| Lore    | Crimson Text italic | `'Crimson Text', serif`          |

### Proposal C — The Iron Court (gothic terminal)

```html
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500;600;700&family=Cormorant+Unicase&family=JetBrains+Mono:wght@400;600&display=swap"
/>
```

| Role    | Font                               | Family stack                     |
| ------- | ---------------------------------- | -------------------------------- |
| Display | Cinzel 700 (you already have this) | `'Cinzel', serif`                |
| Heading | Cormorant Unicase                  | `'Cormorant Unicase', serif`     |
| Body    | Inter 500                          | `'Inter', system-ui, sans-serif` |
| Mono    | JetBrains Mono 600                 | `'JetBrains Mono', monospace`    |
| Lore    | Cormorant Garamond italic          | `'Cormorant Garamond', serif`    |

### Proposal D — The Summoner's Console (modern mobile gacha)

```html
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Saira+Condensed:wght@400;600;700&family=Inter:wght@400;500;600;700&family=Spectral:ital,wght@1,400;1,500&family=JetBrains+Mono:wght@400;600&display=swap"
/>
```

| Role    | Font                                 | Family stack                     |
| ------- | ------------------------------------ | -------------------------------- |
| Display | Orbitron 700/900 (futuristic)        | `'Orbitron', sans-serif`         |
| Heading | Saira Condensed 700 (wide condensed) | `'Saira Condensed', sans-serif`  |
| Body    | Inter 500                            | `'Inter', system-ui, sans-serif` |
| Mono    | JetBrains Mono 600                   | `'JetBrains Mono', monospace`    |
| Lore    | Spectral 500 italic                  | `'Spectral', serif`              |

**Proposal D type rules:**

- Display sizes are **larger** than the other proposals — 56-80px for hero
  numbers, 40-48px for screen titles. This is the Genshin/Star Rail
  signature.
- Headings use **wider tracking** than A/B/C — `letter-spacing: 0.08em`
  minimum.
- Mono numbers in stats use `font-weight: 700` with `tabular-nums` so they
  align in columns.
- Lore italic only appears in dialogue bubbles and journal entries — never
  in primary UI.

---

## CSS utility classes

Add to `src/styles.css` (under your existing tokens):

```css
/* ─── Typography roles ─── */
/* Swap font-family stack lines per chosen identity proposal */

:root {
  --ss-font-display: "Pixelify Sans", monospace;
  --ss-font-heading: "Pixelify Sans", monospace;
  --ss-font-body: "Inter", system-ui, sans-serif;
  --ss-font-mono: "JetBrains Mono", monospace;
  --ss-font-lore: "Crimson Text", serif;

  /* Type scale */
  --ss-text-xs: 12px;
  --ss-text-sm: 13px;
  --ss-text-base: 15px;
  --ss-text-lg: 18px;
  --ss-text-xl: 22px;
  --ss-text-2xl: 28px;
  --ss-text-3xl: 36px;
  --ss-text-4xl: 48px;
  --ss-text-5xl: 64px;

  /* Tracking presets */
  --ss-track-tight: -0.01em;
  --ss-track-normal: 0;
  --ss-track-wide: 0.04em;
  --ss-track-wider: 0.08em;
  --ss-track-widest: 0.18em;
}

/* Apply body font to root */
body {
  font-family: var(--ss-font-body);
  font-size: var(--ss-text-base);
  color: var(--ss-ink-primary);
  line-height: 1.5;
}

/* Display — hero numbers, ceremony titles, big reveals */
.t-display {
  font-family: var(--ss-font-display);
  font-size: var(--ss-text-4xl);
  font-weight: 700;
  letter-spacing: var(--ss-track-wide);
  line-height: 1.05;
}

/* Heading 1 — screen title */
.t-h1 {
  font-family: var(--ss-font-heading);
  font-size: var(--ss-text-3xl);
  font-weight: 700;
  letter-spacing: var(--ss-track-wide);
  line-height: 1.1;
}

/* Heading 2 — section title */
.t-h2 {
  font-family: var(--ss-font-heading);
  font-size: var(--ss-text-xl);
  font-weight: 700;
  letter-spacing: var(--ss-track-normal);
  line-height: 1.2;
}

/* Heading 3 — card title */
.t-h3 {
  font-family: var(--ss-font-heading);
  font-size: var(--ss-text-base);
  font-weight: 700;
  letter-spacing: var(--ss-track-wide);
}

/* Label — uppercase mini-label above a value */
.t-label {
  font-family: var(--ss-font-body);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: var(--ss-track-widest);
  text-transform: uppercase;
  color: var(--ss-ink-secondary);
}

/* Body */
.t-body {
  font-family: var(--ss-font-body);
  font-size: var(--ss-text-base);
  font-weight: 500;
  line-height: 1.5;
  color: var(--ss-ink-primary);
}

.t-body-sm {
  font-family: var(--ss-font-body);
  font-size: var(--ss-text-sm);
  font-weight: 500;
  line-height: 1.45;
  color: var(--ss-ink-secondary);
}

/* Mono — counts, stats, currencies */
.t-mono {
  font-family: var(--ss-font-mono);
  font-size: var(--ss-text-base);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.t-mono-lg {
  font-family: var(--ss-font-mono);
  font-size: var(--ss-text-lg);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* Lore — italic, atmospheric */
.t-lore {
  font-family: var(--ss-font-lore);
  font-size: var(--ss-text-sm);
  font-style: italic;
  font-weight: 400;
  line-height: 1.5;
  color: var(--ss-ink-secondary);
}

.t-lore-sm {
  font-family: var(--ss-font-lore);
  font-size: var(--ss-text-xs);
  font-style: italic;
  font-weight: 400;
  color: var(--ss-ink-tertiary);
}

/* Special — old-style figures (Proposal A only) */
.t-onum {
  font-feature-settings:
    "onum" 1,
    "lnum" 0;
}
```

---

## Component-level migration

The pattern: any element that has `style={{ fontFamily: "..." }}` becomes a
typography class.

### Before / After examples

```tsx
// BEFORE
<h1 className="text-3xl font-bold" style={{ color: "#FFD54F", fontFamily: "'Cinzel',serif" }}>
  Hub Directives
</h1>

// AFTER
<h1 className="t-h1" style={{ color: "var(--gold-leaf)" }}>
  Hub Directives
</h1>
```

```tsx
// BEFORE
<span style={{ fontFamily: "'JetBrains Mono',monospace" }}>{value.toLocaleString()}</span>

// AFTER
<span className="t-mono">{value.toLocaleString()}</span>
```

```tsx
// BEFORE
<p className="text-xs italic" style={{ color: "#A09D96" }}>"{quote}"</p>

// AFTER
<p className="t-lore">"{quote}"</p>
```

---

## Where each role is used

For implementation reference — every screen mapped to roles:

| Screen / Component     | Display                | Heading              | Body               | Mono                          | Lore                |
| ---------------------- | ---------------------- | -------------------- | ------------------ | ----------------------------- | ------------------- |
| PlayerHeader           | —                      | level number         | currency labels    | currency values, HP/XP counts | —                   |
| Hub title              | —                      | "Hub Directives"     | —                  | —                             | empty state         |
| Hub Whisper banner     | —                      | monster name         | —                  | —                             | the line            |
| TaskCard               | —                      | task title           | category, notes    | streak number                 | —                   |
| Altar banner           | —                      | banner name          | description        | cost values                   | —                   |
| Altar pull reveal      | monster name           | rarity label         | role/element       | —                             | "New!"              |
| CascadeCard            | —                      | "Cascade" label      | event descriptions | numbers (gold/xp/etc)         | awakening flavor    |
| PromotionChamber       | —                      | "Promotion Chamber"  | requirements       | counts                        | unlock blurb        |
| Battle result hero     | "VICTORY" / "DEFEAT"   | enemy name           | log entries        | HP/damage                     | ceremony lines      |
| Compendium grid        | —                      | monster name on card | rarity chip        | base stats                    | —                   |
| Compendium detail hero | monster name (Display) | role/element         | skills list        | stats                         | dormant flavor      |
| Quests cards           | —                      | goal title           | type label         | HP remaining                  | —                   |
| Codex Heatmap          | —                      | "Codex" page title   | section labels     | activity counts               | journal entries     |
| Codex Journal          | —                      | date headers         | —                  | mood numerics                 | journal text        |
| Trial confirmation     | —                      | "The Trial is Final" | warning body       | —                             | —                   |
| Trial fallen list      | —                      | monster names        | meta (floor, star) | bond %                        | "I will remember."  |
| Empty states (all)     | —                      | —                    | "No X yet" line    | —                             | the flavor sentence |

---

## Acceptance checks

```bash
# 1. No more raw font-family in JSX inline styles
grep -rnE 'fontFamily:\s*"' src --include='*.tsx' | wc -l
# Expect: < 5 (only in motion-tokens or auth page if you keep it separately styled)

# 2. Typography classes are widely used
grep -rnE 'className=".*t-(h1|h2|h3|body|mono|lore|label|display)' src --include='*.tsx' | wc -l
# Expect: 40+

# 3. Build still passes
npm run build
```

## Tasks for agent

1. Update `src/index.html` with the chosen Google Fonts link for the picked
   identity proposal.
2. Add the typography CSS block to `src/styles.css` with the correct font stack
   for the chosen proposal.
3. Audit `grep -rn 'fontFamily:' src --include='*.tsx'`. For each result:
   - Replace with the appropriate `.t-*` class.
   - Remove the inline `fontFamily` declaration.
4. Add `font-variant-numeric: tabular-nums` to any element that displays
   counts (currency, HP, XP, percentages) so columns of numbers align.
5. For Proposal A only: enable old-style figures on body text with `.t-onum`
   utility on running text containers.
6. Test on mobile — Proposal A needs at least 14px minimum body, B/C can go
   to 13px.
7. Build and commit.

## Out of scope

- **Don't change the Mono font.** JetBrains Mono is excellent and ships across all three proposals.
- **Don't add a sixth typography role.** Five is enough. If you need a sixth
  variant (e.g. "subtitle"), it's a size modifier of one of the existing five.
- **Don't load more than 5 font weights total.** Each weight is a network
  request and slows initial paint. Pick 2 weights per family max.
- **Don't apply Press Start 2P to body text in Proposal B.** It's display-only.
  Body should always read at 13-15px sans.
