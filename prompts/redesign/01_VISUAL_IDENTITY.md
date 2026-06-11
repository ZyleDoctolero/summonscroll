# 01 — Visual Identity Decision

> **This is the only file in this redesign that requires a human decision before
> implementation can start.** Files 02–11 all reference the choice made here.

## The problem

Right now the app is "dark + gold + Cinzel headers." That's a *theme template*,
not a brand. Compare to apps that have committed:

- **Pokémon HOME** — clean white + soft pastels. You know it from a thumbnail.
- **Elden Ring menus** — parchment + ink + black + crumbling gold filigree.
- **Persona 5** — red + white + jazz typography + diagonal cuts.
- **Octopath Traveler** — pixel sprites + 2.5D depth + storybook serifs.
- **Hades** — Greek myth illuminated manuscript + gold + cherry red.

SummonScroll currently could be a finance app's dark mode. There is nothing in
the chrome that tells a new user *what world they're in*. The redesign starts
with deciding that.

---

## Three proposals to choose ONE

Pick A, B, or C. Don't blend. Identity strength comes from commitment.

---

### Proposal A — "The Burning Page" (illuminated manuscript)

**Steal from:** Hades + Disco Elysium + Elden Ring menus

**The world tells:** This is a book of summons. Every screen is a page that
*remembers* the player. The Compendium is the book's table of contents. Monsters
are illuminations in the margins. Trial of Echoes is the page that bleeds.

**Color palette:**

```css
--bg-deep:      #1a1410   /* burnt umber, near-black */
--bg-paper:     #2a1f17   /* aged vellum dark */
--bg-pane:     #3a2a1d   /* embossed leather */
--ink-primary:  #f4ead8   /* candleflame cream */
--ink-secondary:#a89373   /* faded ink */
--ink-tertiary: #6b5841   /* dust */
--gold-leaf:   #d4af3f   /* illuminated gold */
--gold-burn:   #8b6914   /* tarnish */
--ember:       #c44e2a   /* fire orange */
--sigil:       #6f4d8c   /* arcane violet */
--blood:       #732424   /* dried blood */
--health:      #5a7b3a   /* moss */
```

**Typography:**
- Display: **IM Fell English SC** (serif, illuminated)
- Heading: **Cormorant Garamond** (high-contrast serif)
- Body: **Fanwood** or **EB Garamond**
- Lore/journal: **Caudex** (italic-heavy)
- Mono: **Iosevka** (medieval-monospace blend) or **JetBrains Mono**

**Surface motifs:**
- Cards have **subtle paper grain** (CSS noise overlay at 4% opacity)
- Modals open like turning a page (origin Y, slight tilt on entrance)
- Borders are **double-line filigree**, not single radius
- Dividers are tiny **fleurons** (✦ or ❦), not horizontal rules
- Numbers render in old-style figures (lowercase numerals, OpenType `onum`)

**Icons:** Hand-drawn line set — Phosphor Icons with `weight="duotone"` works,
or commission ~30 line icons in a single hand. NO emoji.

**Backgrounds per screen:**
- Hub → vellum page texture with margin illustration
- Altar → candlelit ritual page with hand-drawn pentacle (low contrast)
- Battle → coliseum diagram woodcut
- Codex → torn parchment with index ribbon
- Compendium → bestiary index page with hand-numbered margins
- Trial → black page with red wax seal in corner

**Voice:** Diegetic, slightly archaic, never modern slang. Buttons say
"Begin Ritual" not "Start." Empty states say "The page is blank." Tooltips
read like marginalia.

**Verdict:** Highest visual ceiling. Best if you want the app to feel *literary*.
Reads as serious adult RPG. Worst on mobile (typography-heavy = small text).

---

### Proposal B — "The Lantern Garden" (pixel JRPG)

**Steal from:** Octopath Traveler + Loop Hero + Triangle Strategy + Eastward

**The world tells:** This is a small wandering party in a pixel realm. Every
monster is a sprite. Backgrounds suggest place — a shrine, a workshop, a
campfire. Color is warm but darkly lit.

**Color palette:**

```css
--bg-deep:      #0d0b14   /* night blue-violet */
--bg-stage:     #1d1830   /* dusk indigo */
--bg-pane:     #2a2240   /* lantern wood */
--ink-primary:  #f0e6d2   /* lantern light */
--ink-secondary:#b09480   /* dawn rose */
--ink-tertiary: #6e5c4d   /* shadow */
--lantern:     #ffb85c   /* warm flame */
--lantern-glow:#ff7a30   /* deep flame */
--moss:        #6ec07a   /* moss green */
--river:       #4fb0ff   /* river blue */
--blossom:     #ff8fb3   /* sakura */
--rune:        #b88bff   /* twilight rune */
```

**Typography:**
- Display: **Press Start 2P** (used SPARINGLY — only for hero numbers)
- Heading: **Pixelify Sans** or **VT323** at 28-40px
- Body: **Inter** or **DM Sans** — modern legible sans for UI ergonomics
- Lore: **Crimson Text** italic
- Mono: **JetBrains Mono**

**Surface motifs:**
- Cards have **2px crisp pixel borders**, no shadows
- 3-pixel highlight stripe at top of every card (faux light source)
- Buttons render as **chunky pixel slabs** with bottom-shadow inset
- Numbers use Pixelify Sans for HP/ATK/DEF readouts
- Modals slide in *without easing* (snappy pixel feel) or with stepped easing

**Icons:** Pixel sprites — commission from itch.io, or use **Lucide Icons** at
small sizes with pixelated rendering CSS: `image-rendering: pixelated`. Even
better: pick one pixel icon pack like **Pixelarticons** (free, MIT, 480+ icons).

**Backgrounds per screen:**
- Hub → small pixel village (~64×64 tile scene) with parallax lanterns
- Altar → animated pixel pentagram on starfield
- Battle → pixel arena with seated crowd
- Codex → pixel scroll unrolled on stone
- Compendium → pixel library shelves
- Trial → pixel skull pile with mist

**Voice:** Modern English with occasional pixel-game playfulness. Empty states
can be cute — "The grove is quiet. Nothing yet." Tooltips read like
fortune-cookie wisdom.

**Verdict:** Best visual cohesion possible if you commit. Easiest to keep
consistent. The 202 existing monster images that are already pixel-style FIT
this perfectly. Worst if you want the app to feel "serious."

---

### Proposal C — "The Iron Court" (gothic terminal)

**Steal from:** Elden Ring + Dark Souls inventory + Sekiro UI + Pentiment

**The world tells:** This is a tactical command post in a black-iron castle.
Information is dense and ranked. Every screen is a heraldic banner. Color is
absent except for stat reds and a singular gold.

**Color palette:**

```css
--bg-deep:      #0a0a0c   /* iron pitch */
--bg-stone:    #15161a   /* cathedral stone */
--bg-vellum:   #2c2620   /* aged map */
--ink-primary:  #e8e2d0   /* candle wax */
--ink-secondary:#888073   /* slate */
--ink-tertiary: #555049   /* iron oxide */
--gold-heraldic:#b8973c  /* heraldic gold */
--blood:       #781d1d   /* dried sigil */
--frost:       #8a9bb5   /* frost blue */
--ember:       #8c4226   /* coal */
--moss:        #4a5238   /* lichen */
```

**Typography:**
- Display: **UnifrakturCook** or **Pirata One** (blackletter — used VERY sparingly)
- Heading: **Cinzel** (you already have it; keep it but make it lighter weight)
- Body: **Cormorant Garamond** for lore, **Inter** for UI
- Mono: **JetBrains Mono**
- Inscriptions: **Cormorant Unicase**

**Surface motifs:**
- Cards have **sharp 90° corners** — no border radius
- 1px hairline borders, never 2+
- Buttons render as **etched plates** — inset shadow, hairline border
- Stats render in **stencil-style** all-caps with letter-spacing 0.2em
- Modals open from **top center** like a banner unfurling

**Icons:** Heraldic glyphs — Phosphor Icons `weight="fill"` or commissioned set
of 30 line icons modeled on medieval blazoning (chalice, sword, eye, crown,
chain). NO emoji.

**Backgrounds per screen:**
- Hub → stone wall with hung banner
- Altar → black stone with iron grating, single red light below
- Battle → tournament list with crests
- Codex → leather-bound ledger
- Compendium → painted heraldic shields in grid
- Trial → black iron portcullis half-raised

**Voice:** Cold, military, archaic. "Send the team" not "Run x5." Empty states
are clipped — "No record." Tooltips read like inventory descriptions in Dark
Souls — short, evocative.

**Verdict:** Highest cohesion with what you already have (gold + Cinzel +
dark). Lowest visual ceiling — could feel oppressive. Best for the player who
wants a *severe* experience.

---

### Proposal D — "The Summoner's Console" (modern mobile gacha)

**Steal from:** Genshin Impact + Honkai: Star Rail + Arknights + Limbus Company +
Reverse: 1999 + Wuthering Waves

**The world tells:** This is *the in-universe game from Pick Me Up, Infinite
Gacha*. A modern mobile gacha interface — bright accents glowing against deep
black, big confident stat numbers, particle-emitting rarity stars, dramatic
anime-style hero portraits in your collection. Sci-fantasy hybrid: ritual magic
filtered through a slick HUD.

**The world feels:** Cinematic. Produced. The way Genshin's menu feels alive.

**Color palette:**

```css
--bg-deep:      #08080d   /* void black */
--bg-stage:    #11111c   /* deep slate */
--bg-panel:    #1a1a2a   /* console panel */
--bg-pane:     #232336   /* elevated panel */
--ink-primary:  #f5f0e6   /* paper white */
--ink-secondary:#9089a8   /* muted lilac */
--ink-tertiary: #5a566b   /* dim */
--gold-bright: #ffd95c   /* signature gold (UI default accent) */
--gold-glow:   #ffb83d   /* gold particle */
--violet:      #a374ff   /* sigil purple (epic/mythic) */
--cyan:        #5ae0ff   /* arcane cyan (rare/elite) */
--rose:        #ff5e85   /* mythic accent */
--ember:       #ff7843   /* fire / damage */
--success:     #5dd39e
--danger:      #ff5e5e
```

**Typography:**
- Display: **Orbitron** 700 (futuristic geometric) — for big stat numbers, level, hero name
- Heading: **Bebas Neue** or **Saira Condensed** (wide condensed sans) — section labels
- Body: **Inter** 500 (clean modern reading)
- Mono: **JetBrains Mono** 600
- Lore: **Spectral italic** (only for monster flavor + journal)

**Surface motifs:**
- Cards have **glowing 2-stop gradient borders** (e.g. `linear-gradient(135deg, var(--gold-glow), var(--violet))` at 1px)
- Modals appear with a **radial light burst** behind them (CSS radial-gradient pseudo-element fading from gold to transparent)
- Rarity stars are **big**, **particle-emitting** (CSS animation with absolute-positioned glow), glow per rarity color
- Buttons have **inset hairline highlight at top** + drop shadow at bottom — feels like a metal plate
- Stats render in **Orbitron at 1.5× the size you'd think** — Genshin makes stats huge
- Active tab gets a **bright glowing under-bar** (3px gradient line) and the text glows softly
- Backgrounds have subtle **animated star/particle drift** at low opacity

**Icons:** **Lucide Icons** — clean geometric line set with consistent stroke. Tinted per accent (gold/violet/cyan). NO emoji. NO Phosphor (too organic).

**Backgrounds per screen:**
- Hub → starfield with faint concentric sigil rings, slow parallax drift
- Altar → full ritual circle with particle wisps swirling around it (CSS animation), violet gradient floor glow
- Battle → coliseum with HUD-overlay frame (corner brackets, scanline texture)
- Codex → holographic book with light beams piercing upward
- Compendium → grid of glowing portrait frames against dark void
- Trial → black portal with violet inner glow + slow particle flow inward
- Expeditions → wide dungeon entrance with element-tinted lighting that shifts by weekday

**Voice:** Modern, dramatic, occasionally archaic for flavor. "Begin the
Summon." "The hero answers your call." "She is gone. The Echo remembers." Tab
labels read like a real game's menu — *RECRUIT*, *DEPLOY*, *ARCHIVE*. Empty
states are evocative but modern: "No records yet — your story is unwritten."

**Verdict:** Highest "this is a real published game" ceiling. Most faithful to
the Pick Me Up source material. Hardest to ship — needs gradient + glow + particle
chrome, plus the existing monster art must be regenerated as anime portraits to
match. Best for the player who wants the app to feel like a "real gacha game"
they're playing, not a productivity tool with theming.

---

## Decision matrix

| Concern | A: Burning Page | B: Lantern Garden | C: Iron Court | D: Summoner's Console |
|---|---|---|---|---|
| Existing code reuse | low | medium | **high** | low (needs glow/gradient chrome) |
| Existing monster art fits | poor | **good** (already pixel-leaning) | poor | poor (needs anime portraits) |
| Mobile readability | poor (serif) | **excellent** | medium | good (with care for glow legibility) |
| Time to ship | slow | medium | **fast** | slow (most produced) |
| "Feels like a real published gacha game" | high | medium | low | **highest** |
| Pick Me Up source-faithful | low | low | low | **highest** |
| Voice opportunity | literary | playful | severe | dramatic / cinematic |
| Risk of cliché | medium ("dnd book") | low (modern pixel) | high ("souls UI #4582") | medium ("yet another anime gacha") |
| Future events/seasons fit | excellent | excellent | poor | **excellent** (banner art is the core medium) |
| Implementation effort vs A/B/C | baseline | baseline | baseline | **+3-5 days** of chrome + art regen |

---

## My recommendation

The right choice depends on what you want SummonScroll to **feel like to use**:

### Pick **D (Summoner's Console)** if:
- You want it to feel like *the game from Pick Me Up* — modern anime gacha, big
  glowing stars, dramatic summon reveals.
- You're willing to regenerate the monster bestiary as anime portraits (file 10
  has the prompt).
- You're willing to put ~3-5 extra days into the gradient/glow/particle chrome.
- **Mobile habit-app played daily? Acceptable but ambitious.** The "produced
  game" feel may eclipse the habit-tracker utility.

### Pick **B (Lantern Garden)** if:
- You want the fastest path to a coherent, shippable identity.
- Existing pixel-leaning monster art is mostly salvageable.
- The app must remain readable as a habit tool first, game second.
- Mobile is the primary surface.
- *Stardew Valley energy* in a productivity app appeals to you.

### Pick **A (Burning Page)** if:
- You want it to feel **serious / literary / collectible-prestige**.
- You don't mind regenerating the monster art as illuminated illustrations.
- Mobile readability is a secondary concern.

### Pick **C (Iron Court)** only if:
- You specifically want a **punishing, severe** aesthetic.
- You're willing to burn the existing monster art.
- Be aware: this has the highest cliché risk.

**Honest take from me:** If you want SummonScroll to feel like Pick Me Up's
in-universe game, pick **D**. If you want it to ship and *retain habit users*
for a year+, pick **B**. The two are different optimization targets. D has the
higher ceiling but B has the higher floor.

---

## What happens after the decision

Once you've chosen, update this file with the choice at the top:

```markdown
# 01 — Visual Identity Decision

> **CHOSEN: Proposal B — Lantern Garden**
```

Then file 02 (SURFACE_SYSTEM) reads that and writes the CSS tokens accordingly,
file 03 picks the icon pack, file 04 imports the fonts, and so on. The whole
redesign becomes mechanical from this single choice.

## Tasks for agent

This file is informational — no agent action until a human picks A / B / C.

When the choice is made:
1. Update this file's top section with the chosen proposal.
2. Proceed to [02_SURFACE_SYSTEM.md](./02_SURFACE_SYSTEM.md).

## Out of scope

- **Do not blend two proposals.** "A bit of A and a bit of B" is how SummonScroll
  got into this mess. Commit.
- **Do not rename the app** as part of this. Name stays SummonScroll.
- **Do not redesign the game mechanics.** This is pure visual + UX.
