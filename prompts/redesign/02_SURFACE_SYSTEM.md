# 02 — Surface System

> **Depends on:** [01_VISUAL_IDENTITY](./01_VISUAL_IDENTITY.md) (must be decided first)

## The problem

Right now every component re-defines its own background, border, radius, and
shadow inline:

```tsx
// Found in dozens of components, each slightly different:
<div style={{ background: "#13161F", borderColor: "rgba(255,255,255,0.07)" }}>
<div style={{ background: "#1A1E2A", border: "1px solid rgba(255,213,79,0.18)" }}>
<div style={{ background: "linear-gradient(180deg, #1B1F2A 0%, #15181F 100%)" }}>
```

These should all be the same `.ss-card`. They're not. The eye registers this
inconsistency as sloppy even when individual screens look fine in isolation.

## The fix

A small, tokenized surface kit lives in `src/styles.css`. Every card, modal,
pane, button, and input pulls from it. No inline style overrides for these
surfaces.

---

## The token kit

Drop this into `src/styles.css` after the existing `:root` block. Color values
shown for **Proposal B (Lantern Garden)** — swap the palette block from
file 01 if you chose A or C.

```css
:root {
  /* ─── Spacing scale ─── */
  --ss-space-1: 4px;
  --ss-space-2: 8px;
  --ss-space-3: 12px;
  --ss-space-4: 16px;
  --ss-space-5: 24px;
  --ss-space-6: 32px;
  --ss-space-8: 48px;

  /* ─── Radius scale ─── */
  --ss-radius-sm: 4px;     /* chips */
  --ss-radius-md: 8px;     /* inputs */
  --ss-radius-lg: 12px;    /* cards */
  --ss-radius-xl: 16px;    /* modals */
  --ss-radius-pill: 9999px;

  /* ─── Elevation scale ─── */
  --ss-shadow-low:    0 2px 6px rgba(0,0,0,0.25);
  --ss-shadow-mid:    0 8px 24px rgba(0,0,0,0.40);
  --ss-shadow-high:   0 24px 64px rgba(0,0,0,0.55);

  /* Inset highlight — gives surfaces faux "rim lighting" */
  --ss-inset-edge: inset 0 1px 0 rgba(255,255,255,0.04);

  /* ─── Hairlines ─── */
  --ss-hairline:        1px solid rgba(255,255,255,0.06);
  --ss-hairline-soft:   1px solid rgba(255,255,255,0.03);
  --ss-hairline-active: 1px solid rgba(255,213,79,0.32);  /* swap with palette */
}
```

---

## Surface primitives

```css
/* ─── Cards ─── */
.ss-card {
  background: var(--ss-bg-pane);
  border: var(--ss-hairline);
  border-radius: var(--ss-radius-lg);
  padding: var(--ss-space-4);
  box-shadow: var(--ss-shadow-low), var(--ss-inset-edge);
  transition: border-color 160ms ease-out, transform 160ms ease-out;
}
.ss-card:hover {
  border-color: var(--ss-hairline-active);
}

/* Bigger, more important surface — hero card on a screen */
.ss-card-hero {
  background: linear-gradient(180deg, var(--ss-bg-pane) 0%, var(--ss-bg-stage) 100%);
  border: var(--ss-hairline-active);
  border-radius: var(--ss-radius-lg);
  padding: var(--ss-space-5);
  box-shadow: var(--ss-shadow-mid), var(--ss-inset-edge);
}

/* ─── Modals ─── */
.ss-modal {
  background: linear-gradient(180deg, var(--ss-bg-pane) 0%, var(--ss-bg-deep) 100%);
  border: var(--ss-hairline-active);
  border-radius: var(--ss-radius-xl);
  padding: var(--ss-space-5);
  box-shadow: var(--ss-shadow-high), var(--ss-inset-edge);
  max-width: 28rem;
  width: 100%;
}

.ss-modal-backdrop {
  background: rgba(0,0,0,0.78);
  backdrop-filter: blur(3px);
}

/* ─── Panes (sub-sections within a card) ─── */
.ss-pane {
  background: rgba(0,0,0,0.32);
  border-radius: var(--ss-radius-md);
  padding: var(--ss-space-3);
}

/* ─── Inputs ─── */
.ss-input {
  width: 100%;
  background: rgba(0,0,0,0.32);
  border: var(--ss-hairline);
  border-radius: var(--ss-radius-md);
  padding: 10px 12px;
  color: var(--ss-ink-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 120ms ease-out;
}
.ss-input:focus {
  border-color: var(--ss-hairline-active);
  box-shadow: 0 0 0 3px rgba(255,213,79,0.08);  /* swap with palette */
}

/* ─── Buttons ─── */
.ss-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ss-space-2);
  padding: 10px 16px;
  border-radius: var(--ss-radius-md);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 120ms ease-out, box-shadow 120ms ease-out;
  user-select: none;
}

.ss-btn-primary {
  background: linear-gradient(135deg, var(--ss-gold-burn), var(--ss-gold-leaf));
  color: var(--ss-bg-deep);
  border: none;
  box-shadow: 0 4px 20px rgba(255,213,79,0.28);  /* swap with palette */
}
.ss-btn-primary:hover { transform: translateY(-1px); }
.ss-btn-primary:active { transform: translateY(0); }
.ss-btn-primary:disabled {
  opacity: 0.4;
  pointer-events: none;
  box-shadow: none;
}

.ss-btn-secondary {
  background: rgba(255,255,255,0.04);
  color: var(--ss-ink-secondary);
  border: var(--ss-hairline);
}
.ss-btn-secondary:hover {
  border-color: var(--ss-hairline-active);
  color: var(--ss-ink-primary);
}

.ss-btn-danger {
  background: linear-gradient(135deg, #5a1818, #781d1d);
  color: var(--ss-ink-primary);
  border: none;
  box-shadow: 0 4px 20px rgba(120,29,29,0.35);
}

.ss-btn-ghost {
  background: transparent;
  color: var(--ss-ink-secondary);
  border: none;
  padding: 8px 12px;
}
.ss-btn-ghost:hover { color: var(--ss-ink-primary); }

/* ─── Chips ─── */
.ss-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--ss-radius-pill);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  line-height: 1;
  border: 1px solid transparent;
}
.ss-chip-gold {
  background: rgba(255,213,79,0.12);
  color: var(--ss-gold-leaf);
  border-color: rgba(255,213,79,0.32);
}
.ss-chip-muted {
  background: rgba(255,255,255,0.04);
  color: var(--ss-ink-tertiary);
}

/* ─── Dividers ─── */
.ss-divider {
  height: 1px;
  background: var(--ss-hairline);
  border: 0;
  margin: var(--ss-space-3) 0;
}

/* For Proposal A (illuminated): use a fleuron divider */
.ss-divider-fleuron {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: var(--ss-space-4) 0;
  color: var(--ss-ink-tertiary);
}
.ss-divider-fleuron::before,
.ss-divider-fleuron::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--ss-hairline);
}
.ss-divider-fleuron::before { margin-right: var(--ss-space-3); }
.ss-divider-fleuron::after  { margin-left:  var(--ss-space-3); }
```

---

## Proposal D specific — glow + gradient chrome

Only apply this block if Proposal D (Summoner's Console) is the chosen
identity. It overlays additional chrome on the base surface kit above.

```css
/* ─── D: Gradient borders (the signature chrome) ─── */
.ss-card-d-glow {
  position: relative;
  background: var(--ss-bg-panel);
  border-radius: var(--ss-radius-lg);
  padding: var(--ss-space-4);
  box-shadow: 0 8px 32px rgba(0,0,0,0.55), var(--ss-inset-edge);
}
/* The gradient border trick: a pseudo-element behind the card with a
   linear-gradient masked to look like a 1px outline. */
.ss-card-d-glow::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, var(--gold-glow), var(--violet) 60%, transparent);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  pointer-events: none;
}

/* ─── D: Radial burst (used behind modal headers + hero reveals) ─── */
.ss-burst {
  position: relative;
}
.ss-burst::after {
  content: "";
  position: absolute;
  inset: -40%;
  background: radial-gradient(circle at center,
    rgba(255,213,79,0.18) 0%,
    rgba(163,116,255,0.10) 30%,
    transparent 65%);
  pointer-events: none;
  z-index: -1;
  animation: ss-burst-pulse 4s ease-in-out infinite;
}
@keyframes ss-burst-pulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50%      { opacity: 1.0; transform: scale(1.06); }
}

/* ─── D: Tab under-bar (signature gacha-game nav) ─── */
.ss-tab-d {
  position: relative;
  padding: 12px 18px;
  color: var(--ss-ink-secondary);
  transition: color 160ms ease-out;
}
.ss-tab-d.active {
  color: var(--ss-ink-primary);
}
.ss-tab-d.active::after {
  content: "";
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--gold-bright), transparent);
  box-shadow: 0 0 8px var(--gold-glow);
}

/* ─── D: Buttons with metallic plate feel ─── */
.ss-btn-d-primary {
  background: linear-gradient(180deg, var(--gold-bright) 0%, var(--gold-glow) 100%);
  color: var(--ss-bg-deep);
  border: none;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.4),   /* top highlight */
    0 4px 12px rgba(255,213,79,0.35),       /* glow */
    0 2px 0 rgba(120,90,0,0.6);             /* hard bottom edge */
  text-shadow: 0 1px 0 rgba(255,255,255,0.2);
}
.ss-btn-d-primary:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
}
.ss-btn-d-primary:active {
  transform: translateY(0);
  filter: brightness(0.95);
}

/* ─── D: Rarity star (with particle glow) ─── */
.ss-rarity-star-d {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--gold-bright);
  filter: drop-shadow(0 0 6px var(--gold-glow));
  animation: ss-star-twinkle 2.5s ease-in-out infinite;
}
@keyframes ss-star-twinkle {
  0%, 100% { filter: drop-shadow(0 0 4px var(--gold-glow)); }
  50%      { filter: drop-shadow(0 0 12px var(--gold-glow)); }
}
/* Variants per rarity tint */
.ss-rarity-star-d.rarity-rare      { color: var(--cyan);   filter: drop-shadow(0 0 6px var(--cyan)); }
.ss-rarity-star-d.rarity-epic      { color: var(--violet); filter: drop-shadow(0 0 6px var(--violet)); }
.ss-rarity-star-d.rarity-legendary { color: var(--gold-bright); filter: drop-shadow(0 0 8px var(--gold-glow)); }
.ss-rarity-star-d.rarity-mythic    { color: var(--rose);   filter: drop-shadow(0 0 10px var(--rose)); }
.ss-rarity-star-d.rarity-ex        { color: var(--ink-primary); filter: drop-shadow(0 0 12px var(--gold-bright)) drop-shadow(0 0 24px var(--violet)); }

/* ─── D: Stat readout (Genshin-style big numbers) ─── */
.ss-stat-d {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 16px;
  border-radius: var(--ss-radius-md);
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.06);
}
.ss-stat-d-label {
  font-family: var(--ss-font-heading);  /* Saira Condensed */
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ss-ink-secondary);
  margin-bottom: 4px;
}
.ss-stat-d-value {
  font-family: var(--ss-font-display);  /* Orbitron */
  font-size: 28px;
  font-weight: 700;
  color: var(--gold-bright);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}
```

**Where to apply each D-chrome class:**

| Class | Where to use |
|---|---|
| `.ss-card-d-glow` | Altar banner card, Promotion Chamber outer, Hero monster card in Compendium, Trial commit card |
| `.ss-burst` | Behind every modal header glyph, Hub Compass background, summon reveal stage |
| `.ss-tab-d` | All tab nav (Codex, Quests, Bazaar, Trial, Battle history) |
| `.ss-btn-d-primary` | Primary CTAs replacing `.ss-btn-primary` when D is active |
| `.ss-rarity-star-d` | Every rarity readout — Compendium grid star, monster header, banner featured card |
| `.ss-stat-d` | HP/ATK/DEF/SPD readouts on monster detail, Profile stat block |

If a different identity is chosen, ignore this entire D block. The base
surface kit above is enough for A/B/C.

---

## Migration plan — file by file

Search and replace inline-style surfaces. Run this audit script first:

```bash
# Find all components using inline-style backgrounds (candidates for migration)
grep -rn 'background: "#13161F"\|background: "#1A1E2A"\|background: "rgba(19,22,31' \
  src/components src/routes --include='*.tsx'
```

**Components to migrate:**

| File | Current style | Replace with |
|---|---|---|
| `src/components/game/CascadeCard.tsx` | inline pane style | `.ss-modal` |
| `src/components/game/DailyRitual.tsx` | inline modal style | `.ss-modal` |
| `src/components/game/PromotionChamber.tsx` | inline modal style | `.ss-modal` |
| `src/components/game/WhisperFeed.tsx` | inline per-tone style | keep tone styles, base on `.ss-card` |
| `src/components/game/TaskCard.tsx` | inline card style | `.ss-card` |
| `src/components/game/PlayerHeader.tsx` | inline button style | `.ss-chip-muted` for currencies |
| `src/components/game/AppShell.tsx` | inline section background | `.ss-pane` for subsections |
| `src/components/game/GameSidebar.tsx` | inline button style | `.ss-btn-ghost`, `.ss-btn-secondary` |
| `src/routes/_authenticated/altar.tsx` | inline banner card | `.ss-card-hero` |
| `src/routes/_authenticated/expeditions.tsx` | inline today's card | `.ss-card-hero` |
| `src/routes/_authenticated/battle.tsx` | inline result modal/cards | `.ss-modal` for results, `.ss-card` for history |
| `src/routes/_authenticated/quests.tsx` | inline goal cards | `.ss-card`, hero card pattern for active quest |
| `src/routes/_authenticated/compendium.tsx` | inline monster cards | `.ss-card` with rarity-glow override |
| `src/routes/_authenticated/codex.tsx` | inline tab cards | `.ss-card` |
| `src/routes/_authenticated/forge.tsx` | inline recipe cards | `.ss-card` |
| `src/routes/_authenticated/bazaar.tsx` | inline item cards | `.ss-card` |
| `src/routes/_authenticated/profile.tsx` | inline stat tiles | `.ss-pane` + stat tokens |
| `src/routes/_authenticated/trial.tsx` | inline picker cards | `.ss-card` for monsters |
| `src/routes/_authenticated/guild.tsx` | inline guild cards | `.ss-card` |
| `src/routes/_authenticated/fusion.tsx` | inline ingredient slots | `.ss-card`, dashed-border variant |

---

## Rules during migration

1. **Inline styles allowed only for dynamic values** — color tints that depend
   on rarity, mood, or theme. Static styling goes to CSS classes.
2. **No new `box-shadow:` strings.** Use the shadow scale (`--ss-shadow-low/mid/high`).
3. **No new `border-radius` literals.** Use the radius scale.
4. **No new color literals in components** — colors come from CSS variables
   defined in styles.css.
5. **Buttons are always `.ss-btn` + one variant.** No more raw `<button>` styling.

---

## Acceptance checks

After migration, all of these must pass:

```bash
# 1. No more hard-coded surface colors in components
grep -rn '#13161F\|#1A1E2A\|#1B1F2A\|#15181F' src/components src/routes \
  --include='*.tsx' --include='*.ts' | wc -l
# Expect: 0 (or only in motion-tokens or legacy theme files)

# 2. No more inline box-shadow values
grep -rn 'box-shadow.*rgba(0,0,0,0' src/components src/routes \
  --include='*.tsx' | wc -l
# Expect: low single-digit (only for specialty hover effects)

# 3. .ss-card and .ss-modal are used widely
grep -rn 'className.*ss-card\|className.*ss-modal' src --include='*.tsx' | wc -l
# Expect: 20+
```

## Tasks for agent

1. Read [01_VISUAL_IDENTITY.md](./01_VISUAL_IDENTITY.md) to confirm the chosen palette.
2. Add the chosen palette block to `src/styles.css` (replace `:root` color tokens; the legacy `--ss-bg-*` names should still resolve so existing components don't break).
3. Add the surface primitive CSS shown above to `src/styles.css`.
4. Migrate the files in the table, one screen at a time. For each:
   - Replace inline surface styles with `.ss-card` / `.ss-modal` / `.ss-pane` classes.
   - Replace `<button>` tags with `.ss-btn` + variant.
   - Replace inline currency/chip styles with `.ss-chip`.
   - Run `npm run build` after each file to catch regressions early.
5. Verify with the three acceptance checks above.
6. Commit per-screen for clean diff history.

## Out of scope

- **Don't redesign components themselves.** Only swap the surface chrome.
- **Don't change motion** (Cascade, Whisper, modal entrances stay the same — those use the motion-tokens system already).
- **Don't touch sound, icons, or typography yet.** Those are files 03 and 04.
- **Don't migrate the existing `auth.tsx`** until file 05 (atmosphere) replaces its background.
