# 05 — Atmosphere Per Screen

> **Depends on:** [01_VISUAL_IDENTITY](./01_VISUAL_IDENTITY.md), [02_SURFACE_SYSTEM](./02_SURFACE_SYSTEM.md)

## The problem

Every screen background is `#0C0E14` (or whatever the chosen identity's
`--ss-bg-deep` is). The Hub, the Altar, the Battle screen, the Codex — they all
look like the same admin dashboard. A player flipping between routes
experiences no sense of *place*.

Compare to any RPG:
- Genshin's menu has parallax stars behind it.
- Persona 5's screens each pulse with their menu identity.
- Pokemon HOME's box screen feels like a *physical box*.

The fix is six small background paintings (one per primary route) loaded as
CSS background-image or React layered overlay. They sit behind the chrome at
8-15% opacity so they suggest atmosphere without competing with the UI.

## The system

Each primary route gets a `bg-atmos-{name}` CSS class applied to its root
container. The class is just a background-image rule on the existing dark
surface. All atmosphere images live in `public/atmos/`.

```css
.bg-atmos {
  background-image: var(--bg-atmos-image);
  background-size: cover;
  background-position: center top;
  background-repeat: no-repeat;
  background-color: var(--ss-bg-deep);
  background-blend-mode: overlay;
}
.bg-atmos::before {
  /* darkening veil — keeps the chrome readable */
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg,
    rgba(12,14,20,0.65) 0%,
    rgba(12,14,20,0.85) 60%,
    rgba(12,14,20,0.95) 100%);
  pointer-events: none;
  z-index: 0;
}
.bg-atmos > * {
  position: relative;
  z-index: 1;
}
```

Per-screen class:

```css
.bg-atmos-hub        { --bg-atmos-image: url("/atmos/hub.png"); }
.bg-atmos-altar      { --bg-atmos-image: url("/atmos/altar.png"); }
.bg-atmos-expedition { --bg-atmos-image: url("/atmos/expedition.png"); }
.bg-atmos-battle     { --bg-atmos-image: url("/atmos/battle.png"); }
.bg-atmos-codex      { --bg-atmos-image: url("/atmos/codex.png"); }
.bg-atmos-trial      { --bg-atmos-image: url("/atmos/trial.png"); }
.bg-atmos-compendium { --bg-atmos-image: url("/atmos/compendium.png"); }
```

---

## The six atmosphere paintings — what they show

These are written as Gemini / Midjourney generation prompts. Each is one image,
1920×1080 PNG, sits behind the chrome at low contrast. Style locked to the
chosen identity proposal.

### Hub — "The Lectern"

**Concept:** The desk where the player plans the day. A wide wooden lectern
with a candle, an open ledger, a tea cup, parchment scraps. Daylight filters in
from a window upper-right. Calm, organized, slightly cluttered.

```
A wide gothic study lectern at first light. An open leather-bound book lies on
worn oak, a brass quill resting in a half-full inkwell beside it. A single
candle flame trembles. A teacup steams on the right margin. A folded letter
peeks from beneath the book. A high arched window upper-right floods the scene
with cool morning light. Bookshelves recede into shadow behind. Wide horizontal
composition, the lectern itself fills the lower third. Painterly, low contrast,
muted color. Wide canvas 1920×1080. NO text, NO modern objects, NO people.
[Plus identity-specific style: "pixel art 64×36 tile feel" for B / "illuminated
manuscript painted style, ochre and burnt umber" for A / "oil painted, candle-
lit, near-monochrome" for C.]
```

### Altar — "The Ritual Circle"

**Concept:** A stone altar at night. A pentagram drawn in chalk. Five floating
braziers. The summoning chamber. Empty — you're alone here.

```
A circular stone summoning chamber seen from above-front. A chalk pentagram
glows faintly on the slate floor. Five tall iron braziers burn at the points of
the star, each flame a slightly different color (violet, gold, blue, green,
red). The room is otherwise dark, walls suggested only by depth shadow.
Particles of magic dust drift upward. Composition: pentagram centered, room
recedes into darkness top and bottom. Painterly, low saturation except for the
brazier flames. Wide canvas 1920×1080. NO text, NO people, NO monsters in the
image yet.
```

### Expedition — "The Crossroads"

**Concept:** A path forks in the woods. Distance and direction. The image
suggests journey, not a static place.

```
A pre-dawn forest crossroads. Three paths fork from the foreground: one
descending into a mine entrance (left), one ascending through cedars (center),
one curving away into rolling hills (right). A weathered wooden signpost at
the join. Mist clings to the ground. The sky is purple-blue with the first
hint of sun. A single distant lantern glows along the right path. Soft,
atmospheric, deep depth. Wide canvas 1920×1080. NO text, NO people, NO modern
elements.
```

### Battle — "The Coliseum"

**Concept:** The arena at distance — not the action. The pit before the
combat begins. Hushed.

```
An empty stone coliseum seen from the highest tier. Curved tiered seating
recedes into the dark. The center floor is sand, raked. Two iron gates face
each other across the sand — closed. Torches burn on each gate's pillars. The
sky overhead is twilight, no stars yet. Composition: the arena floor is
center-low, gates frame it. Cinematic, low contrast, painterly. Wide canvas
1920×1080. NO crowd, NO fighters, NO text. The image breathes anticipation,
not violence.
```

### Codex — "The Open Tome"

**Concept:** A massive book lies on a reading table. The page is blank, ready
to receive what the player has done. A second floor of a library suggests
the depth of memory.

```
A two-story library interior. Centered foreground: a vast open book on a
carved wooden reading table. The pages are subtly textured paper, mostly blank
with a single illustrated initial in one corner. Behind the table, dim
bookshelves stretch upward into a vaulted ceiling. Soft golden light from
green-shaded reading lamps. A small bird perches on the highest shelf
(barely visible). Painterly, warm, contemplative. Wide canvas 1920×1080. NO
text on the open pages (subtle margins only), NO modern furniture.
```

### Trial of Echoes — "The Black Gate"

**Concept:** A massive iron gate, half-raised. The threshold. Something is
behind it, never quite seen.

```
A massive black iron portcullis seen from the outside. The gate is half-
raised, leaving a horizontal slit of pitch darkness at the bottom. Faint
red light bleeds from inside, casting long horizontal shadows on the stone
floor of the antechamber. Two unlit braziers flank the gate. Skeletal cracks
spider the surrounding stone arch. The image is composed so the gate
dominates, with a sliver of revealed darkness at the bottom edge. Painterly,
near-monochrome, deep red accent. Wide canvas 1920×1080. NO text, NO figures,
NO monsters, NO crowns.
```

### Compendium — "The Bestiary Shelf" (optional 7th)

**Concept:** A shelf of leather-bound bestiaries. The implication: this is
where the player's collection becomes a permanent record.

```
A library shelf seen close-up. Dozens of identical leather-bound bestiaries
line the shelf, each spine inscribed with a roman numeral I through M. A
single book leans out slightly from its slot, hinting it has been recently
opened. A reading candle stands on the shelf below. Warm light, deep
shadows in the gaps between books. Painterly, intimate scale. Wide canvas
1920×1080. NO text on the spines that spells a word (only numerals).
```

---

## Implementation per route

### `src/routes/_authenticated/index.tsx` (Hub)

Wrap the outermost container:

```tsx
return (
  <AppShell profile={profile}>
    <DeathOverlay trigger={deathTick} />
    <div className="bg-atmos bg-atmos-hub relative min-h-screen">
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
        {/* existing Hub content unchanged */}
      </div>
    </div>
  </AppShell>
);
```

### Per-route mapping

| Route file | Class to add to root |
|---|---|
| `_authenticated/index.tsx` | `bg-atmos bg-atmos-hub` |
| `_authenticated/altar.tsx` | `bg-atmos bg-atmos-altar` |
| `_authenticated/expeditions.tsx` | `bg-atmos bg-atmos-expedition` |
| `_authenticated/battle.tsx` | `bg-atmos bg-atmos-battle` |
| `_authenticated/codex.tsx` | `bg-atmos bg-atmos-codex` |
| `_authenticated/trial.tsx` | `bg-atmos bg-atmos-trial` |
| `_authenticated/compendium.tsx` | `bg-atmos bg-atmos-compendium` (optional) |
| `_authenticated/quests.tsx` | reuse `bg-atmos-codex` or leave plain |
| `_authenticated/island.tsx` | reuse `bg-atmos-hub` or leave plain |
| `_authenticated/forge.tsx` | none (forge has its own UI density — atmosphere would compete) |
| `_authenticated/bazaar.tsx` | none |
| `_authenticated/guild.tsx` | none |
| `_authenticated/fusion.tsx` | none |
| `_authenticated/profile.tsx` | none |

Use atmosphere sparingly. **Six routes, max.** Adding it everywhere kills its
impact.

---

## Performance notes

- Each PNG is **at most 400 KB**. Compress with TinyPNG or `oxipng -o 4`.
- Use `loading="lazy"` for any image tags. For CSS backgrounds, browsers handle
  this automatically.
- Preload only the Hub atmosphere (first paint matters most):
  ```html
  <link rel="preload" as="image" href="/atmos/hub.png">
  ```
- Total atmosphere assets together should be under 3 MB for the full app.

---

## Generation workflow

Use **the same Gemini / Midjourney model with consistent style anchors** for
all 6-7 images so they form a set:

1. Write a "style anchor" prompt fragment (one paragraph) describing the look —
   palette, brush quality, light direction, painterly style.
2. Prefix every per-screen prompt above with that anchor.
3. Generate at 1920×1080 (or upscale from 1024×576 with Topaz).
4. Manually verify each one fits the set — discard any outlier.
5. Run through TinyPNG to compress.
6. Drop into `public/atmos/{name}.png`.

Example style anchor for Proposal A:

```
[STYLE ANCHOR]: Painterly illuminated manuscript style. Burnt umber, gold leaf,
deep shadow. Subtle paper grain. Brush quality of a 14th century French
miniature, but composed as a wide horizontal panel. Low contrast. No
saturation above 30%. Slight vignette. Composition allows central 60% of the
canvas to be UI-overlaid without losing detail.
```

Example style anchor for Proposal B (pixel):

```
[STYLE ANCHOR]: Pixel art, 16-bit JRPG style at high resolution. Limited
palette per piece (12-18 colors). Crisp pixel clusters, no anti-aliasing.
Composition lit by warm lantern light against dusk indigo. Octopath Traveler
2.5D aesthetic with painterly skies. No motion blur. Composition allows
central 60% to be UI-overlaid without losing the scene.
```

Example style anchor for Proposal D (modern gacha):

```
[STYLE ANCHOR]: Modern anime mobile gacha key art. Deep near-black background
(#08080d) with bright glowing accents in violet, gold, and cyan. Particle
effects: floating dust motes, soft volumetric light beams, swirling magic
sparks. Cinematic HUD-friendly composition — the central 60% is darker so UI
overlays remain readable. Reference: Genshin Impact menu backgrounds, Honkai
Star Rail world art, Arknights operator stages, Wuthering Waves environment
splashes. Photoreal-ish lighting with anime stylization — soft glow,
volumetric atmosphere, never flat. Suggest depth with three planes: distant
backdrop (silhouette), midground (subject), foreground (particle wisps). No
text, no UI elements in the image, no characters.
```

For Proposal D, additionally request **animated overlays** as separate small
PNGs if budget allows:
- `public/atmos/altar_particles.png` — tileable particle field for the Altar
- `public/atmos/star_drift.png` — slow-drift starfield for Hub

These get layered via CSS `background-image` with `background-position`
animation. The effect makes D's atmosphere feel alive without baking video.

---

## Acceptance checks

- [ ] All 6 atmosphere PNGs exist in `public/atmos/`
- [ ] Combined size under 3 MB
- [ ] Hub atmosphere is preloaded
- [ ] Each of the 6 primary routes has the corresponding `bg-atmos-*` class
- [ ] Chrome remains readable on top — text contrast ≥ 4.5:1 against background
- [ ] No FOUC / flash: atmosphere fades in within 200ms of route mount
- [ ] Mobile: atmosphere scales sensibly (`background-size: cover` + center top)

## Tasks for agent

1. Generate 6 atmosphere images per the prompts above, applying the style anchor
   for the chosen identity proposal. Save as `public/atmos/{name}.png`.
2. Add the `.bg-atmos` + per-screen class CSS to `src/styles.css`.
3. Add atmosphere preload `<link>` for Hub to `src/index.html`.
4. Update each of the 6 primary route files to wrap their outer container with
   the right class.
5. Verify contrast on each screen — adjust the `::before` veil opacity per
   screen if needed.
6. Compress all atmosphere PNGs before commit.
7. Build, screenshot each screen, confirm tonality matches across the set.

## Out of scope

- **Don't animate the atmospheres.** Static. Moving backgrounds are distracting
  in a productivity app played daily.
- **Don't add atmosphere to modals / dialogs.** They get their own surface
  (file 02). Atmosphere is route-level only.
- **Don't apply atmosphere to mobile if it costs page-load weight** — load
  conditionally with a media query.
- **Don't fork the auth page.** Keep its existing Unsplash backdrop or replace
  with one of the 6 atmospheres if it fits. The auth page is the entry point;
  do this last and tread carefully.
