# Implementation Plan: Bestiary View (Full Monster Codex)

> **Goal:** Transform the current Compendium page from a flat ownership grid into a rich, interactive Bestiary that showcases every monster's art, lore, skills, and stats — whether the player owns them or not. This is the "Pokédex" of SummonScroll.

---

## Current State

- **Compendium page** (`routes/_authenticated/compendium.tsx`) — shows a grid of monster cards with ownership overlay, rarity filter, realm filter, search. Clicking an owned monster opens a modal with stats + artifact equip.
- **Monster data** — all 150 monsters now have `lore`, `origin`, `realm_skill`, `skill_1`, `skill_2`, `skill_3` populated.
- **Art** — 46/150 monsters have `art_url` pointing to full-body PNGs in `public/monsters/`. The rest fall back to element-specific SVG sprites.
- **Existing API** — `listAllMonsters()` returns all monsters; `listMyMonsters()` returns owned `user_monsters`.

---

## Phase 1: Bestiary Detail Page (Priority: HIGH)

**What:** Clicking any monster (owned or not) opens a full detail view — not just a modal but a dedicated panel/page showing everything we know about the creature.

### Tasks

1. **Create `MonsterDetailPanel` component**
   - File: `src/components/game/MonsterDetailPanel.tsx`
   - Full-width slide-in panel or modal (reuse the existing modal pattern but expand it)
   - Sections:
     - **Hero area**: Full monster art (or SVG sprite), name, rarity badge, element icon, role icon
     - **Lore card**: `monster.lore` text with styled parchment background
     - **Origin line**: `monster.origin` in italic serif
     - **Stats block**: HP / ATK / DEF / SPD with bar visualizations (use `motion.div` animated bars like PlayerHeader's MiniBar)
     - **Skills section**: Parse `skill_1/2/3` JSON → render skill cards with name, damage, MP cost, description
     - **Realm Skill**: Passive ability display with element-colored accent
   - Unowned monsters show all data except stats are shown as "???" and skills are locked/blurred
   - Owned monsters show computed stats (base + level scaling) and bond progress

2. **Wire up the panel in `compendium.tsx`**
   - Change the grid card `onClick` to open `MonsterDetailPanel` for ANY monster (not just owned)
   - Pass `monster` data + optional `userMonster` data if owned
   - Keep the existing artifact equipment tab inside this panel for owned monsters

3. **Add element-themed styling**
   - Use `getElementColor()` already in compendium to tint the detail panel header/border
   - Rarity-based glow intensity on the hero art frame
   - Element particle effect behind the art (CSS-only, subtle)

### Files touched
- `src/components/game/MonsterDetailPanel.tsx` (NEW)
- `src/routes/_authenticated/compendium.tsx` (modify onClick, import panel)

---

## Phase 2: Bestiary Grid Enhancements (Priority: MEDIUM)

**What:** Make the grid itself more informative and visually rich.

### Tasks

4. **Card rarity border glow**
   - Owned cards: animated subtle glow pulse matching rarity color
   - Epic+: add a shimmer sweep animation (reuse `hud-shimmer` keyframe from PlayerHeader)

5. **Realm section headers**
   - When filtering by realm, show a realm banner at the top with icon, name, and completion percentage
   - Show realm description/flavor text from the `realms` table

6. **Sort options**
   - Add sort dropdown: Bestiary # (default), Rarity (high→low), Element, Name A-Z
   - Persist selection in URL search params via TanStack Router

7. **Collection milestone badges**
   - At the top of the grid, show milestone progress: "25% Explorer", "50% Scholar", "75% Sage", "100% Archivist"
   - Unlock visual badge when crossing each threshold

### Files touched
- `src/routes/_authenticated/compendium.tsx` (all modifications)

---

## Phase 3: Monster Comparison & Team Builder (Priority: LOW)

**What:** Let players compare monsters side-by-side and plan teams.

### Tasks

8. **Compare mode**
   - Toggle button "Compare" in the filter bar
   - Select 2-4 monsters → side-by-side stat comparison panel
   - Radar chart or bar chart visualization of stat differences (CSS-only, no chart library)

9. **Team synergy preview**
   - Show realm/element synergy bonuses when multiple same-element monsters selected
   - Display combined realm_skill effects

### Files touched
- `src/components/game/MonsterCompare.tsx` (NEW)
- `src/routes/_authenticated/compendium.tsx` (add compare toggle)

---

## Phase 4: Bestiary Progression System (Priority: LOW)

**What:** Reward players for filling the bestiary.

### Tasks

10. **Bestiary milestones → rewards**
    - Backend: Add RPC `check_bestiary_milestones` that grants gold/crystals/seals at thresholds
    - Frontend: Show reward preview in the milestone badges from Phase 2
    - Thresholds: 10 (500 gold), 25 (1000 gold), 50 (200 crystals), 75 (500 crystals), 100 (1 seal), 150 (5 seals + title "Arch-Collector")

11. **Monster flavor unlocks**
    - Show lore only after owning the monster (currently all visible)
    - Show skills only at bond level 25%+
    - This creates progression incentive within the bestiary itself

---

## Technical Notes

### Skill JSON Schema (already populated in DB)
```json
{
  "name": "Holy Smite",
  "dmg": 125,
  "mp": 8,
  "desc": "Calls down divine judgment."
}
```
Parse with `JSON.parse(monster.skill_1)` — already typed as `string | null`.

### Art URL Pattern
- Monsters with art: `/monsters/full_{name}_{timestamp}.png`
- Fallback: SVG sprites via `getElementSprite(element)` — already implemented

### Realm Skill Format
Plain string: `"Holy Shield: Start battle with a 100 HP barrier."`
Split on `:` to get name vs description for display.

### Rarity Color Map
Already available via `RARITY_COLOR` from `@/lib/game/gacha.constants`.

### Animation Patterns (established in codebase)
- Stagger: `delay: Math.min(i * 0.03, 0.3)`
- Spring bars: `type: "spring", stiffness: 120, damping: 20`
- Use `motion/react` (not `framer-motion`)

---

## Estimated Effort

| Phase | Effort | Impact |
|-------|--------|--------|
| Phase 1: Detail Panel | ~2-3 hours | HIGH — transforms the bestiary from a grid into a codex |
| Phase 2: Grid Enhancements | ~1-2 hours | MEDIUM — polish and UX improvements |
| Phase 3: Comparison | ~2-3 hours | LOW — power-user feature |
| Phase 4: Progression | ~2-3 hours | LOW — engagement loop, needs backend |

**Recommended start:** Phase 1 → Phase 2 → ship, then Phase 3-4 as follow-up.
