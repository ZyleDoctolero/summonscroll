# 12 — Implementation Order

Reference for sequencing the redesign. Read this last; use during execution.

## The dependency map

```
01 VISUAL_IDENTITY ─── decision gate ────► no work starts before this
                              │
                              ▼
      ┌───────────────────────┴───────────────────────┐
      │                                               │
02 SURFACE_SYSTEM                              06 THE_COMPASS
      │                                               │
      ├─► 03 ICON_SYSTEM                              │
      ├─► 04 TYPOGRAPHY                  07 FIRST_TIME_EXPERIENCE
      ├─► 05 ATMOSPHERE                              │
      │                                               │
      ▼                                               ▼
09 EMPTY_STATES                                       │
                                                      │
11 MOBILE_FIRST  ◄── after 02 + 08 ───┐               │
                                       │              │
08 NAV_HIERARCHY ──────────────────────┘              │
                                                      │
10 MONSTER_ART  ──── runs in parallel, independent ───┘
```

## Recommended week-by-week sequencing (solo dev, ~3h/day)

### Week 1 — Decisions + foundations

- **Day 1**: Read file 01 carefully. Pick A / B / C. Commit the decision in
  the file header.
- **Day 2**: File 02 — Surface System. Drop the CSS, refactor 5 core
  components.
- **Day 3**: File 02 continued — finish migrating remaining components.
- **Day 4**: File 04 — Typography. Imports + role classes. Migrate fonts.
- **Day 5**: File 03 — Icons. Install Phosphor (or chosen set). Replace
  emoji across the 8 high-impact files.

### Week 2 — Atmosphere + meaning

- **Day 6**: File 05 — Generate 6 atmosphere images. Apply per-route classes.
- **Day 7**: File 09 — Empty states. Create EmptyState component. Rewrite
  every "No X yet" string with the chosen voice.
- **Day 8**: File 08 — Nav hierarchy. Restructure sidebar. Build the More
  sheet.
- **Day 9**: File 06 — The Compass. Build and wire to Hub.
- **Day 10**: Buffer / polish day. Run through every route by hand. Fix the
  things that look off in context.

### Week 3 — Adoption + mobile

- **Day 11**: File 07 — First-Time Experience. Migration, welcome carousel,
  tutorial directive, free first pull.
- **Day 12**: File 11 — Mobile-first. ResponsiveDialog. Touch target fixes.
- **Day 13**: File 11 continued. MobilePlayerHeader. Test on real phone.
- **Day 14**: Buffer / polish day. Re-run all acceptance checks across files.
- **Day 15**: Deploy. Take screenshots of every screen and compare against
  the original to confirm the new identity reads everywhere.

### Parallel track — Monster Art (any time, ongoing)

- File 10 is independent. Triage existing 202, set up batch generator, run
  generations in evenings while doing other work in the day.

**Estimated total effort:** 15 working days at ~3h/day = ~45 hours.
**With a focused full-time week:** 5–7 working days.

## How to commit and ship

### Per-file commit pattern

For each of files 02–11, follow this rhythm:

1. Read the file
2. Run `npm run build` (baseline must pass)
3. Implement per "Tasks for agent" section
4. Run `npm run build` (must still pass)
5. Walk through the acceptance checks; fix any failures
6. Commit with conventional pattern:

```
ui: <file number> <short description>

Per prompts/redesign/<file>.md.

- specific change 1
- specific change 2
- specific change 3

Build: <module count> modules, <size> kb / <gz> kb gz.
Acceptance checks: pass.
```

7. Push immediately or batch up to 3 commits then push.

### Branch strategy

Two options:

**A) Trunk-based** (recommended for solo dev): commit straight to `main`.
Each file's work is one commit. Vercel auto-deploys.

**B) Feature branch**: create `redesign/v2` branch, do all 11 files, merge to
`main` in one PR. Risk: merge conflicts pile up.

Pick A unless you have multiple devs working in parallel.

### Rollback plan

Each file lands as one commit. To roll back any single file:

```bash
git revert <sha>
git push
```

The DB migrations from file 07 (onboarding) can't be `git revert`'d safely —
you'd need a compensating migration. Plan that one carefully and only ship it
when files 01–06 are confirmed working.

## What success looks like

After all 11 files ship:

- **Visual identity** reads consistently — open any screen and the world is
  recognizable
- **Cohesion** — modals, cards, panes, buttons, inputs all use the same surface
  kit
- **Atmosphere** — Hub feels like a desk, Altar feels like a ritual chamber,
  Codex feels like a book
- **First-time experience** — new user lands → 3-card walkthrough → tutorial
  habit → free first pull → Compass takes over
- **Direction** — Compass on Hub answers "what now"; no decision paralysis
- **Mobile** — modals are drawers; touch targets ≥44px; PlayerHeader visible
- **Empty states** — every "No X yet" feels like a literary moment
- **No emoji** — icons consistent across the app
- **Typography** — five roles in active use, all from the chosen font set

## What can wait

These are NOT in the 11 files but should be on the post-launch backlog:

- **Sound effects on more moments** (we wired CascadeCard + Promotion + Trial,
  but Altar pull / Battle / Forge could also have sound). 4-6 hour task.
- **Animations on Compendium card hover** — subtle tilt or glow on hover.
  1-2 hour task.
- **Daily / weekly events** (Genshin-style "today's bonus") — bigger feature.
- **Leaderboard / social proof** — bigger feature.
- **Achievement notifications** — they exist server-side, no UI yet.
- **Internationalization** — defer until you have 10k+ users.

## Re-reading these prompts

If you (or Kiro) lose context, the order to re-read is:

1. This file (12) for sequencing
2. The Overview (00) for the dependency graph
3. The specific file being worked on

Each file is designed to be self-contained — you can hand any one of them to a
fresh coding agent without context from the others (except file 01's decision).

## What if you stall?

If implementation grinds to a halt for any reason:

- **Files 01-05 are the minimum viable refresh.** If you stop after those, the
  app already looks distinctly different and the decision-paralysis problem is
  unsolved but the visual one is improved.
- **Files 06-07 are the highest-leverage UX.** If you skip 08-11, the visual
  identity still works but mobile and "what to do next" remain weak.
- **File 10 (Monster Art) is the highest-impact long-term.** Even with perfect
  chrome, mismatched monster sprites kill the collection feeling. Don't skip
  this.

Reasonable stopping points if life gets in the way:

- After files 01-05: "Looks like a real game now"
- After files 01-07: "Onboarding works, retention should climb"
- After all 11: "It's done"

## Final note

This redesign is mostly about _committing_ to decisions. The hardest part is
file 01. Once that's chosen, everything else is mechanical.

Don't sit on file 01. Decision velocity > decision quality at this stage. A B
or C, picked today and committed to, beats any of them debated for a week.
