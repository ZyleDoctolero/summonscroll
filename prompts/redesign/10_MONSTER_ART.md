# 10 — Monster Art

> **Standalone** — runs in parallel with all other files. **Pairs tightly
> with [13_REALM_WORLDGEN.md](./13_REALM_WORLDGEN.md)** — every monster gets a
> per-realm style fragment injected into its prompt for visual cohesion.

## The problem

There are 202 generated monster images in `public/sprites/monsters/`. They're a
mess:

- 47 JPGs + 155 PNGs (mixed format)
- 5+ different art styles (pixel chibi, painterly detail, dungeon scenes, etc.)
- Many are landscape scenes with a tiny knight in them — not portraits
- AI-generated text baked onto shields/items ("HOLY GUARD")
- Mixed backgrounds: transparent, flat color, checker, dungeon
- Inconsistent crop / framing

In the Compendium grid these read as a sticker-pack dump. They actively work
against the chosen visual identity.

## The fix

Three parts:

1. **A locked Gemini prompt** that generates consistent monster portraits.
2. **A triage script** that scans the existing 202 and flags which ones to
   keep vs. regenerate.
3. **A batch-generation runner** to refill with consistent art.

---

## Part 1 — The locked Gemini prompt

This goes in `prompts/MONSTER_ART_PROMPT.md` (already created earlier — confirm
it matches and update if needed). Inline here for reference:

````markdown
You are generating a single monster portrait for a dark-fantasy gacha collection
game called SummonScroll. Every output must obey these rules without exception.

## Format

- Output PNG with TRANSPARENT background. No backgrounds, no scenes, no
  environment props, no frames, no signature, no watermark.
- Square 1:1 aspect ratio. Render at 1024×1024.
- Subject fills 70–85% of the canvas, centered, with 8–15% padding on all sides.

## Style (PICK ONE BASED ON VISUAL IDENTITY)

### Identity A — Burning Page (illuminated)

- Hand-painted illuminated manuscript style
- Burnt umber + ochre + gold leaf palette
- Subtle paper grain texture overlay
- Brush strokes visible, painterly quality
- No anime, no chibi, no pixel art

### Identity B — Lantern Garden (pixel)

- Pixel art, 16-bit JRPG style
- Reference: Octopath Traveler / Triangle Strategy character sprites
- Crisp pixel clusters, no anti-aliased blur
- Limited palette per piece: 12–18 colors max, dithering allowed
- Bold contrast, strong silhouette readable at 80px

### Identity C — Iron Court (gothic)

- Heraldic illustration, near-monochrome
- Black ink on candlewax background or single accent color
- Stencil-edged, formal posture, three-quarter view
- Reference: medieval blazoning, Pentiment art

### Identity D — Summoner's Console (modern anime mobile gacha)

- Anime gacha portrait illustration — dramatic three-quarter pose
- Reference: Genshin Impact character splash art, Honkai Star Rail key art,
  Arknights operator portraits, Wuthering Waves Resonators
- Sharp linework, soft cel-shading with hard rim light from upper-back
- Bold accent color glow around the subject (matches element)
- Particle/wisp effects swirling around the figure (sparingly — 5-15 motes)
- Confident dramatic stance: weapon raised, hand outstretched, or static
  ready-pose. Never neutral.
- Subject's eyes should glow softly in their element color
- Photoreal-ish lighting, anime-stylized form
- NO chibi proportions, NO sd-style, NO western cartoon

## Framing

- Three-quarter or full-body view, facing slightly off-camera
- Confident static "card pose", no mid-action motion blur
- No floor, no shadow disc, no platform

## Forbidden

- NO text of any kind on armor/banners/scrolls/weapons/background
- NO dialogue bubbles, no UI, no borders, no watermarks, no signatures
- NO scenes, no environment
- NO transparent checker pattern — output must actually have alpha channel
- NO photo-real, no oil painting, no chibi

## Per-monster variables

- Name: {name}
- Rarity: {rarity} (common / uncommon / rare / elite / epic / legendary / mythic / ex)
- Role: {role} (attacker / tank / healer / support / debuffer)
- Element: {element} (Arcane / Chaos / Death / Divine / Dread / Digital / Nature / Stellar / Primal)
- Origin: {origin}
- Realm: {realm_name} — pulled from realms table via realm_id

## Realm context (auto-injected — see file 13)

After the rarity/element/role hints, inject this block based on the monster's
realm. The text comes from `prompts/redesign/13_REALM_WORLDGEN.md`.

```
[REALM CONTEXT — {realm_name}]
Palette: {realm_palette_string}
Visual motifs to incorporate: {realm_motifs}
Voice / stance: {realm_voice_stance}

This monster lives in the {realm_name}. It must visually belong to the
same realm as: {3-5 sibling monster names from same realm_id}. If you
wouldn't put this creature beside them in a single illustrated plate,
regenerate.
```

The `scripts/regen_monsters.mjs` runner builds this fragment by looking up
the monster's `realm_id`, fetching the realm fragment from file 13's content
(or a JSON map of it), and querying 3 sibling monsters from the same realm.

## Rarity visual budget

- common/uncommon: simple silhouette, 1–2 distinguishing features, muted color
- rare/elite: more detail, glowing eyes or single accent gem
- epic: layered armor or distinct weapon, secondary accent color
- legendary: ornate gear, two accent colors, faint particle motes
- mythic: dramatic silhouette, three accent colors, broken/scarred details
- ex: white-gold or void-black palette, ambient warping, 10-15 particle motes

## Element palette hints (accent only, not whole-figure tint)

- Arcane: violet + gold
- Chaos: blood red + obsidian
- Death: bone white + sickly green
- Divine: ivory + sunlight gold
- Dread: charcoal + bruise purple
- Digital: cyan + magenta scanlines
- Nature: moss + amber
- Stellar: deep navy + silver starlight
- Primal: clay red + ash gray

## Role hints (subtle, do not override the main concept)

- attacker: weapon prominent
- tank: shield or heavy armor focus
- healer: glow at hands or staff/orb
- support: scroll, instrument, or aura device
- debuffer: chains, masks, or hex marks

## Self-check before returning

1. Background fully transparent? ✓
2. Subject fills 70-85%? ✓
3. No text or letters anywhere on the figure? ✓
4. Pixel/painterly style consistent (no smoothing if pixel)? ✓
5. Reads at 80px from a 4-meter distance? ✓

Return only the PNG. No commentary, no caption.
````

---

## Part 2 — The triage script

### File: `scripts/triage_monsters.mjs`

Scans existing images, scores them for likely consistency, outputs a CSV of
keep/regenerate decisions.

```js
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SPRITES_DIR = "public/sprites/monsters";
const REPORT = "triage_report.csv";

async function triage() {
  const files = await fs.readdir(SPRITES_DIR);
  const rows = ["filename,format,size_kb,has_alpha,square,verdict,reason"];

  for (const file of files) {
    const filepath = path.join(SPRITES_DIR, file);
    const ext = path.extname(file).toLowerCase().slice(1);
    const stat = await fs.stat(filepath);
    const sizeKb = Math.round(stat.size / 1024);

    let hasAlpha = false;
    let square = false;
    let verdict = "regen";
    let reason = "";

    try {
      const img = sharp(filepath);
      const meta = await img.metadata();
      hasAlpha = meta.hasAlpha ?? false;
      square = meta.width === meta.height;

      // Rules — adjust thresholds for your set
      if (ext !== "png") {
        reason = "wrong format (JPG)";
      } else if (!hasAlpha) {
        reason = "no alpha channel";
      } else if (!square) {
        reason = `not square (${meta.width}x${meta.height})`;
      } else if (sizeKb > 300) {
        reason = `oversized (${sizeKb}kb)`;
      } else if (sizeKb < 15) {
        reason = `suspiciously small (${sizeKb}kb)`;
      } else {
        // Heuristic: if it's a PNG, square, has alpha, reasonable size, keep
        verdict = "keep";
        reason = "passes baseline checks";
      }
    } catch (e) {
      reason = `read error: ${e.message}`;
    }

    rows.push([file, ext, sizeKb, hasAlpha, square, verdict, reason].join(","));
  }

  await fs.writeFile(REPORT, rows.join("\n"));
  console.log(`Wrote ${REPORT} (${rows.length - 1} files)`);
}

triage().catch(console.error);
```

Run:

```bash
npm install --save-dev sharp
node scripts/triage_monsters.mjs
```

Open `triage_report.csv` in a spreadsheet. Manually review the "keep" rows by
looking at the actual images and confirming style fit. Move regen rows to a
queue for the batch runner.

---

## Part 3 — The batch generation runner

### File: `scripts/regen_monsters.mjs`

Takes a list of monsters from the DB (filtered by `bestiary_id <= CURRENT_RELEASED_MAX`)
and generates a new portrait for each one matching the locked prompt.

```js
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "node:fs/promises";
import path from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const CURRENT_RELEASED_MAX = 150;

const supa = createClient(SUPABASE_URL, SUPABASE_KEY);
const gen = new GoogleGenerativeAI(GEMINI_KEY);
const model = gen.getGenerativeModel({ model: "gemini-2.0-flash-exp-image-generation" });

const PROMPT_TEMPLATE = await fs.readFile("prompts/MONSTER_ART_PROMPT.md", "utf8");

async function batchGen() {
  const { data: monsters, error } = await supa
    .from("monsters")
    .select("id, name, rarity, role, element, origin")
    .lte("bestiary_id", CURRENT_RELEASED_MAX)
    .order("bestiary_id");
  if (error) throw error;

  for (const m of monsters) {
    const filename = m.name.toLowerCase().replace(/[^a-z0-9]+/g, "_") + ".png";
    const outpath = path.join("public/sprites/monsters", filename);

    // Skip if already exists and passes a manual approval list
    if (await exists(outpath)) {
      console.log(`SKIP ${filename}`);
      continue;
    }

    const prompt = PROMPT_TEMPLATE.replace("{name}", m.name)
      .replace("{rarity}", m.rarity)
      .replace("{role}", m.role)
      .replace("{element}", m.element)
      .replace("{origin}", m.origin ?? "unknown");

    try {
      const result = await model.generateContent(prompt);
      const part = result.response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
      if (part?.inlineData?.data) {
        await fs.writeFile(outpath, Buffer.from(part.inlineData.data, "base64"));
        console.log(`WROTE ${filename}`);
      } else {
        console.log(`MISS  ${filename} (no inline image in response)`);
      }
    } catch (e) {
      console.log(`ERROR ${filename}: ${e.message}`);
    }

    // Rate limit
    await new Promise((r) => setTimeout(r, 1500));
  }
}

async function exists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

batchGen().catch(console.error);
```

Set up env:

```bash
export SUPABASE_URL=https://nvqbbbcvyhqwqfutpnje.supabase.co
export SUPABASE_SERVICE_KEY=...  # service role key from Supabase dashboard
export GEMINI_API_KEY=...
```

Run:

```bash
node scripts/regen_monsters.mjs
```

Cost estimate: Gemini image generation is roughly $0.04/image. 150 monsters =
~$6. 500 = ~$20. 100k = $4,000. Plan accordingly.

---

## Workflow summary

```
1. Decide visual identity (file 01)
2. Update PROMPT in prompts/MONSTER_ART_PROMPT.md with the chosen style block
3. Run triage script → triage_report.csv
4. Manually review keeps, queue regens
5. Run batch regen for the queued list
6. Move kept files to backup dir; replace with new generations
7. Manually inspect Compendium grid — confirm consistency
8. Increment CURRENT_RELEASED_MAX when next batch is ready
```

---

## Acceptance checks

- [ ] All monster files in `public/sprites/monsters/` are PNG with alpha
- [ ] No files contain baked AI text
- [ ] Style consistent across the active 150 (manual inspect of 5×6 grid)
- [ ] File size 30–150 kb each (compressed)
- [ ] No filenames mismatching their monster.name slug
- [ ] Compendium and Altar render correctly

## Tasks for agent

1. Confirm `prompts/MONSTER_ART_PROMPT.md` matches the spec above and reflects
   the chosen visual identity.
2. Create `scripts/triage_monsters.mjs` and run it.
3. Open the resulting CSV and manually review verdicts.
4. Create `scripts/regen_monsters.mjs` and configure env.
5. Run batch generation against the first 50 queued (test run).
6. Inspect output; tune prompt if needed; run remaining.
7. Replace old files with new ones, keeping a backup at
   `public/sprites/monsters_old_backup/`.

## Out of scope

- **Don't commit the entire `public/sprites/monsters/` to git as a backup
  branch.** Use a local backup folder.
- **Don't auto-deploy as a CI job.** This is a manual generation process; the
  cost is real and needs human review per batch.
- **Don't generate beyond `CURRENT_RELEASED_MAX`.** Wait for images before
  pushing to DB.
- **Don't include sprite generation in `npm run build`.**
