# How to run this redesign in Kiro IDE

Copy-paste prompts. Each block is one message to Kiro.

---

## STEP 0 — One-time setup (5 min)

Open Kiro in the SummonScroll-Fresh project. Paste this as your first message:

```
I have 13 redesign briefs in prompts/redesign/. They're sized to fit your
context one at a time. Please:

1. Read prompts/redesign/00_OVERVIEW.md
2. Confirm you understand the structure
3. Then wait for me to tell you which file to execute next

Do NOT start implementing anything yet. Just acknowledge the plan.
```

**Why:** This anchors Kiro on the existence of the briefs so subsequent
prompts can just say "execute file 06" and it knows where to look.

---

## STEP 1 — Make the visual identity decision (you, not Kiro)

This step is human-only. Do it yourself.

1. Open `prompts/redesign/01_VISUAL_IDENTITY.md` in your editor.
2. Read the three proposals (A: Burning Page, B: Lantern Garden, C: Iron Court).
3. Look at the decision matrix.
4. Pick ONE.
5. Edit the top of the file to record your choice. Replace the header with:

```markdown
# 01 — Visual Identity Decision

> **CHOSEN: Proposal B — Lantern Garden**
>
> (Decided 2026-06-12 by Zyle)
```

Replace "Proposal B — Lantern Garden" with whichever you picked.

**Time:** 15–30 minutes of reading + deciding. Do not skip.

---

## STEP 2 — Execute file 02 (Surface System)

Paste this to Kiro:

```
Execute prompts/redesign/02_SURFACE_SYSTEM.md.

The chosen visual identity is recorded at the top of
prompts/redesign/01_VISUAL_IDENTITY.md — read that first to know which
color palette to apply.

Follow the "Tasks for agent" section exactly. After each file you migrate,
run `npm run build` to confirm nothing breaks. Commit per screen for clean
diff history. Use the commit message pattern from
prompts/redesign/12_IMPLEMENTATION_ORDER.md.

When done, report back with:
- How many files you migrated
- Build size (modules / kb / gz)
- Any acceptance checks that didn't pass
```

Wait for Kiro to finish. Review the diff. Test the app briefly in
`npm run dev`.

---

## STEP 3 — Execute file 03 (Icon System)

```
Execute prompts/redesign/03_ICON_SYSTEM.md.

Follow the "Tasks for agent" section. The chosen visual identity dictates
whether to use Option A (Phosphor), Option B (Pixelarticons), or Option C
(commissioned set). Use Option A as default unless the chosen identity is
Proposal B, in which case use Option B.

When done, report:
- Which icon library you installed
- How many files you migrated
- Any emoji remaining in source
- Build size
```

---

## STEP 4 — Execute file 04 (Typography)

```
Execute prompts/redesign/04_TYPOGRAPHY_SYSTEM.md.

Read the chosen visual identity from file 01 and pick the matching font set.
Apply the typography CSS classes from the spec. Migrate all inline
fontFamily declarations to .t-* utility classes.

When done, report:
- Which Google Fonts were loaded
- How many fontFamily inline styles you removed
- Build size
```

---

## STEP 5 — Execute file 05 (Atmosphere)

Atmosphere needs actual image generation. Two options:

**5a) If you have Gemini API access:**

```
Execute prompts/redesign/05_ATMOSPHERE_PER_SCREEN.md.

For image generation, use the scripts/regen_monsters.mjs template as a base.
Modify it for the six atmosphere prompts in the file. Use the GEMINI_API_KEY
env var. Save outputs to public/atmos/.

Then apply the .bg-atmos-* CSS classes per the per-route mapping table.

When done, report:
- Which 6 images were generated
- Total size of the public/atmos/ folder
- Build size
```

**5b) If you don't have Gemini access (manual):**

Generate the 6 images yourself in Midjourney / DALL-E / Stable Diffusion using
the prompts in file 05. Save them as PNGs to `public/atmos/`. Then tell Kiro:

```
The 6 atmosphere images are in public/atmos/. Execute the rest of
prompts/redesign/05_ATMOSPHERE_PER_SCREEN.md — add the .bg-atmos CSS and
apply the per-route classes per the mapping table.
```

---

## STEP 6 — Execute file 06 (The Compass)

```
Execute prompts/redesign/06_THE_COMPASS.md.

Build the Compass component per the spec. Wire it into the Hub. Remove the
RitualStatusPill once the Compass is rendering.

When done, report:
- Whether all 8 candidate rules are implemented
- The fallback behavior on a brand-new account
- Build size
```

---

## STEP 7 — Execute file 07 (First Time Experience)

```
Execute prompts/redesign/07_FIRST_TIME_EXPERIENCE.md.

This one includes a DB migration. Use:
  supabase db push --password 'YOUR_DB_PASSWORD'

The DB password is in our prior conversation context if you have it,
otherwise ask me. Same for the SUPABASE_ACCESS_TOKEN env var.

When done, report:
- Whether the migration applied to remote DB
- The expected first-time flow when a brand-new user signs up
- Build size
```

> **Note:** Tell Kiro the password explicitly OR set it as an env var on your
> system before running this step. Do NOT commit the password.

---

## STEP 8 — Execute file 08 (Nav Hierarchy)

```
Execute prompts/redesign/08_NAV_HIERARCHY.md.

Restructure the sidebar into Daily / Weekly / Rare tiers. Build the MoreSheet
component. Update mobile bottom-nav to match.

When done, report:
- Confirmation all 14 routes remain accessible
- Mobile nav layout (which 5 items are visible)
- Build size
```

---

## STEP 9 — Execute file 09 (Empty States)

```
Execute prompts/redesign/09_EMPTY_STATES.md.

Create the EmptyState component. Walk the 13 audit locations and replace
each "No X yet" string with the voice from the chosen visual identity.

When done, report:
- How many empty states you rewrote
- Result of the grep audit (should be 0 bare "No X yet" strings)
- Build size
```

---

## STEP 10 — Execute file 10 (Monster Art) — runs in parallel

If you want to start regenerating monster sprites, paste:

```
Execute prompts/redesign/10_MONSTER_ART.md.

Confirm prompts/MONSTER_ART_PROMPT.md exists and matches the chosen visual
identity from file 01. Create the triage script and run it. Then create
the batch regen script but DO NOT run a full batch — only run a 5-monster
test batch first.

I'll review the output and tell you whether to continue with the full set.
```

**This step can run any time, independent of the others.**

---

## STEP 11 — Execute file 11 (Mobile First)

```
Execute prompts/redesign/11_MOBILE_FIRST.md.

Create the ResponsiveDialog component. Migrate the 6 modal-using components
to use it. Apply the touch-target audit fixes. Build the MobilePlayerHeader.

When done, report:
- All migrated modals (list)
- Mobile viewport test results at 380px width
- Build size
```

---

## STEP 12 — Final verification

```
Read prompts/redesign/12_IMPLEMENTATION_ORDER.md "What success looks like"
section. Walk through each bullet and confirm it's true in the current
codebase. List anything that isn't true.

Then take screenshots of:
- The Hub (with Compass visible)
- The Altar
- A Compendium detail modal (on mobile width)
- The Trial of Echoes confirmation
- The Codex heatmap

Save them to docs/redesign-screenshots/ and commit.
```

---

## Troubleshooting prompts

### If Kiro gets confused mid-execution

```
Stop. Re-read prompts/redesign/<file you were working on>.md from scratch.
Re-confirm:
1. Which visual identity proposal is chosen (top of file 01)
2. Which step in "Tasks for agent" you're on
3. What the acceptance checks say

Then continue from that step.
```

### If a build breaks

```
The build is broken. Show me the last 30 lines of npm run build output.
Identify the exact file and line causing the error. Make the minimum fix
to restore the build. Do NOT roll back the entire file.
```

### If migration drifts

```
The current implementation has drifted from prompts/redesign/<file>.md.
Compare the current state to the spec. List discrepancies. Then ask me
which side wins for each — the spec or the current code.

Do NOT change anything until I approve.
```

### If you want to skip a file

```
Skip prompts/redesign/<file>.md for now. Move to <next file>. Note in
TODO.md why we're skipping and what acceptance criteria are unmet.
```

---

## Time estimates

| Step | What | Time |
|---|---|---|
| 0 | Setup | 5 min |
| 1 | Pick visual identity | 30 min (human) |
| 2 | Surface system | 2-4 hours (Kiro) |
| 3 | Icons | 1-2 hours |
| 4 | Typography | 1 hour |
| 5 | Atmosphere | 2-3 hours (mostly generation) |
| 6 | Compass | 1-2 hours |
| 7 | First-time experience | 2-3 hours |
| 8 | Nav hierarchy | 1 hour |
| 9 | Empty states | 1-2 hours |
| 10 | Monster art (parallel) | 30 min setup + ongoing |
| 11 | Mobile-first | 2-3 hours |
| 12 | Verification | 30 min |

**Total Kiro time:** ~15-25 hours of execution time. Spread across however
many sessions you want.

**Your time:** ~1 hour total — the identity decision (30 min) + reviewing
each step's output (~3 min × 11 = 33 min).

---

## After Kiro is done

1. Run `npm run dev` and walk through every screen by hand.
2. Take screenshots and compare against the originals.
3. Test on a real phone via the Vercel preview URL.
4. If everything looks right: `git push origin main` and `vercel --prod`.
5. If anything looks off, paste the screen into Kiro and ask:

```
This screen doesn't feel right. Here's a screenshot. What's off and
how would you fix it without breaking the surface system from file 02?
```

That's it. The whole redesign workflow.
