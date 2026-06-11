# SummonScroll Redesign — Overview

This folder contains a full redesign brief for SummonScroll, broken into focused
files so each can be handed to a coding agent (Kiro, Cursor, Claude Code) without
exceeding context.

## Why this exists

SummonScroll's mechanics are deep — 12 interlocking systems (Pick Me Up + 5
Pillars) shipped. But the visual surface is a generic "dark fantasy" template
with no committed art direction, emoji icons, and no first-time experience.
Players don't know what to do, the screens don't feel like a *place*, and the
polish (motion, sound, animations) is currently sitting on top of placeholder
chrome.

This redesign fixes all of that systematically. Each file is one decision area.

## File index — read in order

| # | File | Purpose | Effort |
|---|---|---|---|
| 01 | [VISUAL_IDENTITY](./01_VISUAL_IDENTITY.md) | Pick the single visual reference everything else hangs off. **FOUR proposals** — A/B/C are tabletop/RPG flavors; **D ("Summoner's Console") is the Pick Me Up–faithful modern anime gacha option**. | 0 (decision only) |
| 02 | [SURFACE_SYSTEM](./02_SURFACE_SYSTEM.md) | Build the tokenized `.ss-card`, `.ss-modal`, `.ss-pane` CSS kit. Replace inline-style chaos with one source of truth. | 1 day |
| 03 | [ICON_SYSTEM](./03_ICON_SYSTEM.md) | Replace every emoji with Phosphor Icons OR a chosen pixel set. Migration map included. | 1 day |
| 04 | [TYPOGRAPHY_SYSTEM](./04_TYPOGRAPHY_SYSTEM.md) | Establish 5 type roles (display, heading, body, mono, lore). Pick Google Fonts. | 0.5 day |
| 05 | [ATMOSPHERE_PER_SCREEN](./05_ATMOSPHERE_PER_SCREEN.md) | One backdrop per primary route. Altar gets a ritual circle, Battle gets an arena, Codex gets parchment. | 1.5 days |
| 06 | [THE_COMPASS](./06_THE_COMPASS.md) | The "what should I do right now" component on Hub. Kills decision fatigue. | 1 day |
| 07 | [FIRST_TIME_EXPERIENCE](./07_FIRST_TIME_EXPERIENCE.md) | Onboarding overlay, tutorial task, free first pull, day-1 walkthrough. | 1.5 days |
| 08 | [NAV_HIERARCHY](./08_NAV_HIERARCHY.md) | Demote rare destinations. Three nav tiers. Mobile bottom-nav fix. | 0.5 day |
| 09 | [EMPTY_STATES](./09_EMPTY_STATES.md) | Rewrite every "No X yet" message. Audit + replacement copy. | 0.5 day |
| 10 | [MONSTER_ART](./10_MONSTER_ART.md) | The Gemini prompt + triage script + batch runner for the 202 existing images. | 0.5 day setup, ongoing generation |
| 11 | [MOBILE_FIRST](./11_MOBILE_FIRST.md) | Vaul drawers replacing modals on small viewports. Touch targets. | 1.5 days |
| 12 | [IMPLEMENTATION_ORDER](./12_IMPLEMENTATION_ORDER.md) | Dependency graph + recommended sequencing + rollback plan. | reference only |

**Total committed effort: ~9 working days** (if a single dev) for proposals
A/B/C. Add **+3 to +5 days** if Proposal D is chosen (extra chrome + monster
art regeneration as anime portraits). Front-loaded on decisions (file 01) and
atmosphere/surfaces (files 02-05), which are the highest leverage.

## If you want the Pick Me Up, Infinite Gacha vibe specifically

Pick **Proposal D** in file 01. It's modeled on the modern mobile gacha
aesthetic of Genshin / Honkai Star Rail / Arknights — the visual language the
in-universe Pick Me Up game would actually use. Files 02, 03, 04, 05, and 10
all have D-specific sections that activate when D is chosen.

Trade-off: D needs more produced chrome (gradients, glows, particle effects)
and the existing monster bestiary must be regenerated as anime portraits.
Estimated extra effort: 3-5 days on top of the base 9-day plan.

If you want SummonScroll to retain habit users for a year+, B might still be
the more practical pick — it has a higher *floor* of consistency for less
effort. D has the higher *ceiling*.

## Dependency graph

```
01 VISUAL_IDENTITY  ←  decided first; everything else inherits from this
         │
         ├──► 02 SURFACE_SYSTEM
         │        │
         │        ├──► 03 ICON_SYSTEM
         │        ├──► 04 TYPOGRAPHY_SYSTEM
         │        └──► 05 ATMOSPHERE_PER_SCREEN
         │
         ├──► 06 THE_COMPASS         (independent — can start anytime)
         ├──► 07 FIRST_TIME_EXPERIENCE  (depends on 06)
         ├──► 08 NAV_HIERARCHY       (independent)
         ├──► 09 EMPTY_STATES        (uses 03 icons, 04 typography)
         ├──► 10 MONSTER_ART         (independent — runs in parallel)
         └──► 11 MOBILE_FIRST        (depends on 02)
```

## How to use these with Kiro

For each file:
1. Open the file in Kiro
2. Read the "Decision required" / "Out of scope" sections to confirm you're ready
3. Use the "Tasks for agent" section as the prompt
4. Reference specific source files mentioned in the brief
5. Run the acceptance checks before marking complete

**Do not skip file 01.** Files 02-11 each assume the identity is decided. Without
that decision, the agent will keep producing "dark+gold" output that doesn't move
the needle.

## What's already in place to build on

The current codebase has good bones to work from:
- `src/lib/ui/motion-tokens.ts` — duration budget + easing curves (Emil's principles)
- `src/lib/ui/sounds.ts` — Web Audio synth (no asset files needed)
- `src/components/game/CascadeCard.tsx` — connective-tissue card pattern
- `src/components/game/WhisperFeed.tsx` — diegetic dialogue feed
- `src/components/game/PromotionChamber.tsx` — Emil template modal
- 12 mechanical systems all working server-side (Pick Me Up + Pillars)

The redesign builds *on top* of all of this. None of it gets deleted. The motion
+ sound + cascade work was correct polish; it was applied before the foundational
visual identity was decided. Now we go back and decide that, then the polish
becomes a magnifier instead of a band-aid.

## The single decision that gates everything

**File 01 is the only one with a real cost if you skip it.** Read it now. Pick
one of the three proposals. Then everything downstream becomes mechanical.
