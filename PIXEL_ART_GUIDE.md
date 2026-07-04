# SummonScroll Pixel Art Creation Guide
## A Beginner's Step-by-Step Tutorial

---

## PART 0 — SETTING UP YOUR WORKSPACE

### Tool Setup (Aseprite recommended, $20)

1. Open Aseprite → File → New
2. Set width/height to the size specified (e.g., 16×16 for icons)
3. Set Color Mode to **RGBA**
4. Background: **Transparent**
5. Go to View → check **Pixel Grid** (this shows you every single pixel)
6. Zoom to **800%** or higher — you need to see individual pixels
7. Select the **Pencil tool** (shortcut: B) — this is your main tool
8. Set pencil size to **1 pixel** — never use anything bigger for pixel art

### If Using Piskel (free, browser: piskelapp.com)

1. Go to piskelapp.com → Create Sprite
2. Set canvas to your size (16×16)
3. Zoom in with scroll wheel until pixels are huge squares
4. Use the Pen tool (1px)

### Golden Rules for Beginners

- **NEVER use anti-aliasing** — every pixel should be a solid color with hard edges
- **NEVER use blur, smudge, or gradient tools** — those are for regular art, not pixel art
- **Work zoomed in at 800%+** — but check at 100% often to see how it actually looks
- **Less is more** — at 16×16, you only have 256 pixels total. Every single one matters
- **Save as PNG** — never JPG (it blurs pixels), never BMP

---

## PART 1 — UNDERSTANDING PIXEL ART SHADING

Before you draw anything, you need to understand how shading works at tiny sizes.

### The 3-Tone Rule

Every object in pixel art uses exactly **3 tones** of the same color:

```
1. BASE COLOR     — The main color you see (mid-tone)
2. HIGHLIGHT      — 1 shade lighter (where light hits)
3. SHADOW         — 1 shade darker (where shadow falls)
```

Example for gold:
```
HIGHLIGHT:  #e8c55a  (bright gold — top-left edges, shine spots)
BASE:       #c89a3e  (standard gold — fills most of the shape)
SHADOW:     #8a6d20  (dark gold — bottom-right edges, under surfaces)
```

### Where Does Light Come From?

In SummonScroll, light always comes from the **TOP-LEFT** corner.

```
  LIGHT SOURCE
    ↘
    ┌──────────┐
    │ HIGHLIGHT│  ← top edge and left edge get highlight
    │   BASE   │  ← middle area is base color
    │   SHADOW │  ← bottom edge and right edge get shadow
    └──────────┘
```

This means:
- **Top edge** of any shape = highlight color
- **Left edge** of any shape = highlight color  
- **Bottom edge** = shadow color
- **Right edge** = shadow color
- **Interior** = base color

### The 1px Black Outline

Every sprite gets a **1-pixel black (#000000) outline** around its entire silhouette. This is the Habitica/retro RPG style.

```
Step 1: Draw black outline shape
Step 2: Fill interior with BASE color
Step 3: Add HIGHLIGHT on top-left inner edges
Step 4: Add SHADOW on bottom-right inner edges
Step 5: (Optional) Add 1 pixel of white/bright for "shine" spot
```

---

## PART 2 — THE MASTER PALETTE

Save these colors in your tool's palette. Every asset pulls from this set.

### Primary Gold (used everywhere — UI, currencies, borders)
```
#ffe8a0  — Lightest gold (sparkle/shine only, use sparingly)
#e8c55a  — Light gold (highlights)
#c89a3e  — Standard gold (base, most common)
#b8860b  — Dark gold (shadows, outlines)
#8a6d20  — Darkest gold (deep shadow)
```

### Danger Red (fire, damage, combat)
```
#ffb74d  — Light orange (fire tips, highlights)
#ff5e2a  — Bright red-orange (fire base, danger)
#e85d3a  — Standard red (base)
#b83a1a  — Dark red (shadow)
#7a2010  — Darkest red (deep shadow)
```

### Nature Green (healing, nature, success)
```
#a0ffb0  — Lightest green (shine)
#3ed97a  — Bright green (highlight)
#2ab55e  — Standard green (base)
#1a8a3e  — Dark green (shadow)
#0e5a28  — Darkest green (deep shadow)
```

### Ocean Cyan (water, digital, crystals)
```
#b0e8ff  — Lightest cyan (shine)
#80d4ff  — Light cyan (highlight)
#38b8f5  — Standard cyan (base)
#1a8ab5  — Dark cyan (shadow)
#0e5a7a  — Darkest cyan (deep shadow)
```

### Violet (dark, void, arcane, seals)
```
#d4b0ff  — Lightest violet (shine)
#c4a0ff  — Light violet (highlight)
#9b6dff  — Standard violet (base)
#7a4ecc  — Dark violet (shadow)
#5a2e99  — Darkest violet (deep shadow)
```

### Death Pink (fallen, penalty, death)
```
#ff9eb0  — Lightest pink (shine)
#ff6b8a  — Light pink (highlight)
#c44f6f  — Standard pink (base)
#9a3050  — Dark pink (shadow)
#6a1a35  — Darkest pink (deep shadow)
```

### Neutrals (outlines, backgrounds, UI)
```
#f5efe6  — Near-white (text, bone)
#d4c8b0  — Light tan (parchment)
#b5a28a  — Muted tan (secondary text)
#8a7a6a  — Grey-brown (disabled, common rarity)
#5a4e40  — Dark brown (borders, frames)
#3a3028  — Darker brown (panel bg)
#1a1510  — Near-black brown (stage bg)
#0e0b07  — Deepest black-brown (deep bg)
#000000  — Pure black (outlines ONLY)
```

---

## PART 3 — ICON-BY-ICON TUTORIALS

### Starting Point: Your First Icon — `icon_gold.png` (16×16)

This is the gold coin icon. It appears in the header, shop, rewards — everywhere.

**What you should see when done:** A small stack of 2-3 gold coins, slightly overlapping, viewed from a slight angle. Think of a Zelda rupee but round coins.

#### Step-by-step:

```
CANVAS: 16×16, transparent background

COLORS NEEDED:
  Outline:    #000000  (pure black)
  Shadow:     #8a6d20  (dark gold)
  Base:       #c89a3e  (standard gold)
  Highlight:  #e8c55a  (light gold)
  Shine:      #ffe8a0  (brightest, 1-2 pixels only)
```

**Step 1 — Draw the front coin outline (black)**

The front coin is an oval/circle in the center-right area. At 16×16, a "circle" is roughly 8×7 pixels:

```
Row by row (. = transparent, X = black):

Row 1:  . . . . . . . . . . . . . . . .
Row 2:  . . . . . . . . . . . . . . . .
Row 3:  . . . . . . . . . . . . . . . .
Row 4:  . . . . . . . . . . . . . . . .
Row 5:  . . . . . . X X X X X X . . . .
Row 6:  . . . . . X . . . . . . X . . .
Row 7:  . . . . X . . . . . . . . X . .
Row 8:  . . . . X . . . . . . . . X . .
Row 9:  . . . . X . . . . . . . . X . .
Row 10: . . . . X . . . . . . . . X . .
Row 11: . . . . . X . . . . . . X . . .
Row 12: . . . . . . X X X X X X . . . .
Row 13: . . . . . . . . . . . . . . . .
```

**Step 2 — Fill the coin interior**

Fill the inside of the outline with the BASE color `#c89a3e`.

**Step 3 — Add highlight (top-left curve)**

Change the top 2 rows of interior pixels and the left column of interior pixels to HIGHLIGHT `#e8c55a`. Remember: light comes from top-left.

**Step 4 — Add shadow (bottom-right curve)**

Change the bottom 2 rows of interior pixels and the right column of interior pixels to SHADOW `#8a6d20`.

**Step 5 — Add shine spot**

Place exactly 1-2 pixels of SHINE `#ffe8a0` in the upper-left interior. This tiny bright spot makes it look like metal reflecting light.

**Step 6 — Add the back coin**

Draw a second, partially hidden coin peeking out from behind the first, shifted 2-3 pixels to the left and 1 pixel up. Use the same colors but slightly darker (skip the shine spot on the back coin).

**Step 7 — Check at 100% zoom**

Zoom out to actual size. Does it read as "coins" at a glance? If not, adjust. At 16×16, readability is more important than detail.

---

### `icon_crystal.png` (16×16) — Diamond/Crystal Gem

**What you should see:** A classic diamond shape — pointed top, faceted sides, flat bottom. Think Minecraft diamond or Zelda rupee.

```
COLORS NEEDED:
  Outline:    #000000
  Shadow:     #0e5a7a  (darkest cyan)
  Dark face:  #1a8ab5  (dark cyan — right facets)
  Base:       #38b8f5  (standard cyan — center)
  Highlight:  #80d4ff  (light cyan — left facets)
  Shine:      #b0e8ff  (1-2 pixels at top)
```

#### Shape guide:

A diamond at 16×16 is basically a tall octagon:

```
     . . . . . X X . . . . . . . . .    ← pointed top (2px wide)
     . . . . X . . X . . . . . . . .    ← expanding
     . . . X . . . . X . . . . . . .
     . . X . . . . . . X . . . . . .
     . X . . . . . . . . X . . . . .    ← widest point
     . . X . . . . . . X . . . . . .    ← narrowing
     . . . X . . . . X . . . . . . .
     . . . . X . . X . . . . . . . .
     . . . . . X X . . . . . . . . .    ← pointed bottom
```

#### Faceting trick:

Divide the interior diagonally from top to bottom-left and top to bottom-right. This creates 3 triangular facets:

```
LEFT FACET:   Fill with HIGHLIGHT #80d4ff  (light hits this face)
CENTER FACET: Fill with BASE      #38b8f5  (front face)
RIGHT FACET:  Fill with DARK FACE #1a8ab5  (shadow side)
```

Add 1px of SHINE `#b0e8ff` at the very top center. Add 1px of SHADOW `#0e5a7a` at the very bottom point.

This faceted look is what makes it read as "gem" instead of "blue blob."

---

### `icon_seal.png` (16×16) — Pact Seal / Ornate Key

**What you should see:** A wax seal stamp or an old ornate key. Since it represents "Pact Seals" currency, a wax seal is more fitting — round seal with a cross/star impression.

```
COLORS NEEDED:
  Outline:    #000000
  Shadow:     #5a2e99  (dark violet)
  Base:       #9b6dff  (standard violet)
  Highlight:  #c4a0ff  (light violet)
  Shine:      #d4b0ff  (1 pixel)
  Wax ring:   #7a4ecc  (the rim of the seal)
```

#### Drawing guide:

1. Draw a circle outline (7-8px diameter) in the center
2. Fill with BASE violet
3. Inside the circle, draw a simple cross or star pattern using a darker shade — this is the "seal impression"
4. Add highlight to top-left rim, shadow to bottom-right rim
5. Below the circle, draw 2-3 irregular pixels of "dripped wax" to sell the wax seal look

---

### `icon_stamina.png` (16×16) — Lightning Bolt / Energy

**What you should see:** A classic pixel lightning bolt, like the Pokémon Thunder Badge. Zigzag shape.

```
COLORS NEEDED:
  Outline:    #000000
  Shadow:     #8a6d20  (dark gold — it's a gold bolt)
  Base:       #e8c55a  (light gold)
  Highlight:  #ffe8a0  (brightest gold)
```

#### The classic lightning bolt shape:

```
     . . . . . . X X . . . . . . . .
     . . . . . X X . . . . . . . . .
     . . . . X X . . . . . . . . . .
     . . . X X . . . . . . . . . . .
     . . X X X X X X . . . . . . . .    ← horizontal bar (the zigzag)
     . . . . . . X X . . . . . . . .
     . . . . . X X . . . . . . . . .
     . . . . X X . . . . . . . . . .
     . . . X X . . . . . . . . . . .
```

Left edge of bolt = HIGHLIGHT. Right edge = SHADOW. Center fill = BASE.

---

### `icon_streak.png` (16×16) — Fire/Streak Flame

**What you should see:** A small campfire flame, 3 tongues of fire. This represents the player's daily streak.

```
COLORS NEEDED:
  Outline:    #000000
  Core:       #ffe8a0  (brightest — inner flame, near white-yellow)
  Mid:        #ffb74d  (orange — middle layer)
  Base:       #ff5e2a  (red-orange — outer flame)
  Shadow:     #b83a1a  (dark red — bottom only)
```

#### Flame shading is REVERSED from normal:

Fire is brightest at the CENTER and darkest at the EDGES. This is the opposite of solid objects.

```
Drawing steps:
1. Outline: Draw the flame silhouette — wider at bottom, 3 pointed tips at top
2. Outer layer: Fill with BASE #ff5e2a (red-orange)
3. Middle layer: Inside that, paint MID #ffb74d (orange) — leave 1px of red showing around edges
4. Core: In the very center-bottom, paint CORE #ffe8a0 (bright yellow) — 2-4 pixels only
5. Bottom: Add 2px of SHADOW #b83a1a at the very base
```

The result: yellow center → orange middle → red-orange edge. This gradient of warmth is what makes fire look like fire.

---

### `icon_heart.png` / `icon_bond.png` (16×16) — Classic Pixel Heart

**What you should see:** The iconic pixel heart shape — every retro game has one.

```
COLORS NEEDED:
  Outline:    #000000
  Shadow:     #9a3050  (dark pink)
  Base:       #ff6b8a  (standard pink)
  Highlight:  #ff9eb0  (light pink)
  Shine:      #ffffff  (pure white, 1 pixel)
```

#### The pixel heart shape (this is classic — memorize it):

```
     . . X X X . . . X X X . .
     . X . . . X . X . . . X .
     X . . . . . X . . . . . X
     X . . . . . . . . . . . X
     X . . . . . . . . . . . X
     . X . . . . . . . . . X .
     . . X . . . . . . . X . .
     . . . X . . . . . X . . .
     . . . . X . . . X . . . .
     . . . . . X . X . . . . .
     . . . . . . X . . . . . .
```

1. Fill interior with BASE pink
2. Top-left lobe interior: HIGHLIGHT pink  
3. Bottom-right area: SHADOW pink
4. Place 1 white pixel in the upper-left lobe — the iconic "shine spot" on a heart

For `icon_bondLow.png` (cracked heart): Same shape but draw a jagged 1px black line down the center, and use slightly desaturated colors (mix in some grey).

---

### `icon_hp.png` (16×16) — Heart with Pulse

Same heart shape as above, but add a small 3-pixel ECG/pulse line extending to the right:
```
After the heart shape, add: ─╱╲─  (a small zigzag pulse wave, 4-5 pixels, in green #3ed97a)
```

---

### `icon_death.png` (16×16) — Skull

**What you should see:** A front-facing skull. Classic pixel skull — round head, dark eye sockets, teeth.

```
COLORS NEEDED:
  Outline:    #000000
  Shadow:     #8a7a6a  (grey-brown)
  Base:       #d4c8b0  (light tan / bone)
  Highlight:  #f5efe6  (near-white / bright bone)
  Eyes:       #000000  (pure black voids)
```

#### Shape guide:

```
1. Cranium: Round/oval top half (about 10px wide, 6px tall)
2. Eyes: Two 2×2 black squares, placed symmetrically
3. Nose: One 1×2 pixel black triangle between and below the eyes
4. Jaw: Slightly narrower than cranium, 3px tall
5. Teeth: 3-4 vertical 1px lines in the jaw area (alternating bone/black)
```

Highlight the top of the cranium. Shadow the bottom of the jaw. The eye sockets are pure black — no detail inside, just void.

---

### `icon_crown.png` (16×16) — Royal Crown

**What you should see:** A 3-pointed crown viewed from the front, like a king's crown in chess.

```
COLORS NEEDED:
  Outline:    #000000
  Shadow:     #8a6d20
  Base:       #c89a3e
  Highlight:  #e8c55a
  Gems:       #e85d3a (red center gem), #38b8f5 (blue side gems)
  Shine:      #ffe8a0
```

#### Drawing:

```
1. Base band: Horizontal rectangle across bottom (12px wide, 3px tall)
2. Three points: Rising from the band, 3 triangular points
   - Center point: tallest (5px up)
   - Side points: shorter (3px up)
3. Gems: Place 1 colored pixel at tip of each point
   - Center: red gem #e85d3a
   - Sides: blue gems #38b8f5
4. Shade the band: highlight left edge, shadow right edge
5. Shine: 1 pixel of #ffe8a0 on the center gem
```

---

### `icon_cold.png` (16×16) — Snowflake

**What you should see:** A 6-pointed snowflake crystal.

```
COLORS NEEDED:
  Outline:    #1a8ab5  (dark cyan — NO black outline on snowflakes, they're delicate)
  Base:       #80d4ff  (light cyan)
  Highlight:  #b0e8ff  (lightest cyan)
  Center:     #ffffff  (white center dot)
```

#### Drawing:

Snowflakes are drawn with lines from center:
1. Draw a + (cross) of 2px-wide lines from center
2. Draw an × through center (diagonal lines)
3. Add 1px "branches" off each arm, 2px from center
4. Place white pixel at center
5. Highlight the arm tips with lightest cyan

---

## PART 4 — BOTTOM NAV ICONS (24×24)

These are bigger, giving you more room for detail. They appear in the bottom navigation bar.

### `icon_hub_nav.png` (24×24) — Tavern / House

**What you should see:** A small medieval tavern/house from the front. Door, window, peaked roof. Think Stardew Valley building.

```
COLORS NEEDED:
  Outline:    #000000
  Roof:       #8a6d20 (dark gold), #b8860b (medium), #c89a3e (highlight)
  Walls:      #5a4e40 (dark brown), #8a7a6a (medium brown), #b5a28a (light brown)
  Door:       #3a3028 (dark), #5a4e40 (medium)
  Window:     #e8c55a (warm glow — lit from inside)
  Chimney:    #5a4e40, with 2px grey smoke (#8a7a6a)
```

#### Drawing guide:

```
1. ROOF (top third):
   - Triangle/trapezoid shape, 20px base, peaked top
   - Left slope: highlight gold
   - Right slope: shadow gold
   - Ridge line: dark gold

2. WALLS (middle third):
   - Rectangle, slightly narrower than roof
   - Left half: lighter brown (light side)
   - Right half: darker brown (shadow side)
   - Horizontal line at top (beam/eave)

3. DOOR (center bottom):
   - 4×6 px rectangle, dark brown
   - 1px gold dot for door handle (left-center of door)
   - Arched top if you have room (2 diagonal pixels)

4. WINDOW (left of door):
   - 3×3 px square
   - Fill with warm glow #e8c55a
   - Add 1px cross divider in dark brown (window pane)
   
5. CHIMNEY (top-right):
   - 2×3 px rectangle poking above roof
   - 2-3 single pixels of grey above it (smoke)
```

### `icon_book_nav.png` (24×24) — Open Bestiary

**What you should see:** An open book viewed from slightly above. Pages spread, maybe a monster silhouette drawn on one page.

```
COLORS NEEDED:
  Outline:    #000000
  Cover:      #1a8ab5 (dark cyan — book cover), #38b8f5 (highlight)
  Pages:      #f5efe6 (near-white), #d4c8b0 (page shadow)
  Spine:      #0e5a7a (darkest cyan)
  Text lines: #b5a28a (tiny lines suggesting writing)
  Monster:    #8a7a6a (tiny silhouette on right page)
```

#### Drawing:

```
1. Draw two trapezoids meeting at center (open book shape)
   - Left page: leaning left
   - Right page: leaning right
   - Dark spine line where they meet

2. Fill pages with near-white
   - Left page shadow: slightly darker at the spine edge
   - Right page highlight: slightly brighter at the outer edge

3. Add 3-4 horizontal lines on left page (text) using #b5a28a, 1px each

4. On right page: draw a tiny 5×5 monster silhouette in grey
   (simple: head, body, tail — just a blob shape that reads as "creature")

5. Book covers peek out at top and bottom edges in cyan
```

### `icon_swords_nav.png` (24×24) — Crossed Swords

**What you should see:** Two swords crossed in an X, blades pointing up-left and up-right.

```
COLORS NEEDED:
  Outline:    #000000
  Blade:      #d4c8b0 (base metal), #f5efe6 (highlight edge), #8a7a6a (shadow edge)
  Guard:      #c89a3e (gold crossguard)
  Grip:       #5a4e40 (brown leather)
  Pommel:     #e85d3a (red gem at base)
```

#### Drawing:

```
1. Draw first sword diagonally (bottom-left to top-right):
   - Blade: 2px wide, runs from (~4,20) to (~20,4)
   - Left edge of blade: highlight (catches light)
   - Right edge: shadow
   - Crossguard: 4px horizontal bar where blade meets grip, in gold
   - Grip: 3px below crossguard, dark brown
   - Pommel: 1 red pixel at very bottom

2. Draw second sword diagonally (bottom-right to top-left):
   - Mirror of first sword
   - Where blades cross: the front blade overlaps (draw it on top)

3. At the cross point: add 1px of bright white #ffffff (clash spark)
```

### `icon_scroll_nav.png` (24×24) — Scroll with Seal

**What you should see:** A rolled-up parchment scroll with a small wax seal hanging from it.

```
COLORS NEEDED:
  Outline:    #000000
  Parchment:  #d4c8b0 (base), #f5efe6 (highlight), #b5a28a (shadow)
  Rolls:      #8a7a6a (the rolled edges at top and bottom)
  Seal:       #9b6dff (violet wax), #c4a0ff (highlight)
  Ribbon:     #7a4ecc (thin line from scroll to seal)
```

#### Drawing:

```
1. Main scroll body: Vertical rectangle, 10×16 px
   - Fill with parchment base
   - Left edge: highlight (light hits it)
   - Right edge: shadow

2. Top roll: Horizontal cylinder at top (14px wide, 3px tall)
   - Wider than the scroll body (hangs over edges)
   - Top edge: highlight, bottom edge: shadow (it's round)
   
3. Bottom roll: Same as top, but shifted 1px right (casual look)

4. Wax seal: Small 4×4 circle hanging below-right
   - Fill with violet, highlight top-left
   - 1px dark violet cross inside (seal impression)
   
5. Ribbon: 1px diagonal line connecting bottom-right of scroll to seal
```

---

## PART 5 — PAGE BACKGROUNDS (480×320)

These are the biggest assets. They sit behind everything at LOW OPACITY (10-15%).

### Key principle: **Atmospheric, not detailed**

Since these display at 10-15% opacity with UI on top, they should be:
- **Dark overall** (average brightness ~20-30%)
- **Low contrast** (don't have bright whites next to dark blacks)
- **Recognizable shapes** but not distracting detail
- **Tileable** if possible (edges wrap seamlessly)

### `bg_hub.png` — Warm Tavern

**What you should see when at full opacity:** Interior of a medieval tavern viewed straight on. Wooden plank walls, a notice board, warm candlelight.

```
BASE COLOR: #1a1510 (dark warm brown — fill entire canvas with this first)

COLORS:
  Dark wood:     #2a2018  (plank shadows, gaps between boards)
  Medium wood:   #3a3028  (main plank color)
  Light wood:    #5a4e40  (plank highlights, worn edges)
  Warm glow:     #c89a3e at 15% opacity (scattered warm light spots)
  Candle:        #e8c55a (tiny bright dots where candles sit)
```

#### Drawing guide:

```
LAYER 1 — WOOD PLANKS (fills 100% of canvas)
  - Draw vertical lines every 20-30px in dark wood color
    (these are gaps between planks)
  - Between the lines, alternate medium and slightly-different-medium wood
  - Add tiny 1-2px horizontal scratches and knots randomly
  - This creates the wall texture

LAYER 2 — NOTICE BOARD (center area, ~200×150px)
  - Rectangular darker patch (a wooden board mounted on the wall)
  - 4 tiny rectangles on it (pinned notices/quests) in parchment color #d4c8b0
  - Small nail/pin dots at the top of each notice

LAYER 3 — AMBIENT LIGHT
  - In 2-3 spots, paint soft circles of warm glow
    (just use base color but slightly brighter — #3a3028)
  - At the source of each glow, place 1-2px of candle yellow #e8c55a
  
LAYER 4 — FLOOR (bottom 80px)
  - Slightly lighter horizontal planks (floor boards)
  - Angled slightly for perspective feel
```

### `bg_roster.png` — Armory / Monster Stable

**What you should see:** Stone wall background with weapon racks, shelves, and stable-like elements.

```
BASE COLOR: #1a1812 (dark cool brown)

COLORS:
  Dark stone:    #15161a  (gaps between stones)
  Medium stone:  #2a2822  (main stone color)
  Light stone:   #3a3830  (stone highlights)
  Metal:         #8a7a6a  (weapon rack brackets)
  Shelf:         #3a3028  (wooden shelf)
```

#### Drawing:

```
LAYER 1 — STONE WALL
  - Draw a brick/stone pattern: irregular rectangles, offset each row
  - Each stone: 30-50px wide, 15-25px tall, with 1-2px dark gaps
  - Vary the shade slightly per stone (not all identical)

LAYER 2 — WEAPON RACK (left side, ~120×200px)
  - 2 horizontal metal brackets mounted on wall
  - 3-4 vertical lines between them (swords/spears silhouettes)
  - Keep it dark/silhouette — it's background

LAYER 3 — SHELF (right side)
  - 2-3 horizontal wooden shelves
  - Tiny shapes on shelves suggesting jars, books, orbs
  - All very dark, barely readable — it's atmosphere
```

### `bg_void.png` — Dark Battle Arena

**What you should see:** A dark stone arena floor viewed from above at an angle. Cracks, embers.

```
BASE COLOR: #0e0b07 (near-black)

COLORS:
  Dark crack:    #000000
  Stone dark:    #15161a
  Stone medium:  #1a1812
  Ember:         #ff5e2a at ~8 opacity (tiny scattered dots)
  Void glow:     #9b6dff at ~5 opacity (subtle purple wisps)
```

#### Drawing:

```
This is the DARKEST background. Keep it extremely subtle.

LAYER 1 — STONE FLOOR
  - Large irregular stone tiles, dark on dark
  - Barely visible cracks between them (pure black on near-black)
  - The crack lines form irregular hexagonal/organic shapes

LAYER 2 — EMBERS
  - Scatter 15-20 single-pixel dots of red-orange across the canvas
  - These represent floating ember particles
  - Vary brightness: some #ff5e2a, some #b83a1a

LAYER 3 — VOID ENERGY
  - In 2-3 corners, paint subtle wisps of violet
  - Just a few pixels that are slightly lighter than the base
  - This suggests otherworldly void energy seeping through
```

### `bg_altar.png` — Mystic Summoning Sanctum

**What you should see:** A dark purple-tinted chamber with a magic circle on the floor and floating particles.

```
BASE COLOR: #15101a (dark purple-brown)

COLORS:
  Floor dark:    #0e0b12
  Floor medium:  #1a1520
  Circle line:   #9b6dff at ~15 opacity (magic circle on floor)
  Rune:          #c4a0ff at ~8 opacity (inscribed runes)
  Crystal glow:  #38b8f5 at ~5 opacity (ambient crystal light)
  Particle:      #c89a3e (tiny gold particles, 1px each)
```

---

## PART 6 — ELEMENT SIGILS (32×32)

These appear on monster cards in the Compendium. At 32×32 you have decent room for detail.

### General approach for all sigils:

```
1. Draw a circular border (28px diameter) — 2px thick
   Color the border in the element's DARK shade

2. Fill the interior with a very dark version of the element color
   (just 1-2 steps above black)

3. Draw the element's symbol/glyph in the CENTER using the element's BASE color

4. Add 1-2px of HIGHLIGHT on the glyph's top-left edges

5. Add subtle glow: 2-3 pixels of LIGHT color scattered around the glyph
```

### Fire Sigil — `sigil_fire.png`

```
Border:     #b83a1a (dark red circle)
Background: #1a0808 (near-black red)
Glyph:      Draw a 3-tongue flame shape (12×16px) in the center
  Outer:    #ff5e2a (red-orange)
  Inner:    #ffb74d (orange)
  Core:     #ffe8a0 (bright yellow, 2-3 pixels)
```

The flame glyph: Three pointed tongues rising from a curved base. Tallest in center.

### Water Sigil — `sigil_water.png`

```
Border:     #0e5a7a
Background: #08081c
Glyph:      Teardrop/water drop shape (10×14px)
  Outer:    #38b8f5
  Inner:    #80d4ff
  Shine:    #b0e8ff (2px near top-left of drop)
  Ripple:   Below the drop, draw 2 concentric arc lines (like ripples in water)
```

### Nature Sigil — `sigil_nature.png`

```
Border:     #1a8a3e
Background: #0e1a10
Glyph:      Single leaf shape (12×14px), or sprouting plant
  Stem:     #1a8a3e (dark green, 2px wide, vertical)
  Leaf:     #3ed97a (base green, teardrop shape off stem)
  Vein:     #2ab55e (dark line through leaf center)
  Highlight:#a0ffb0 (1-2px on leaf tip)
```

### Dark/Void Sigil — `sigil_dark.png`

```
Border:     #5a2e99
Background: #06060c
Glyph:      Crescent moon (10×12px)
  Base:     #9b6dff
  Shadow:   #7a4ecc (inner curve)
  Highlight:#c4a0ff (outer curve tip)
  Stars:    3 single-pixel dots of #d4b0ff scattered near the crescent
```

### Death Sigil — `sigil_death.png`

```
Border:     #6a1a35
Background: #120810
Glyph:      Skull and crossbones (14×14px)
  Skull:    #c44f6f (base), #ff6b8a (highlight)
  Eyes:     #000000 (2×2 black squares)
  Bones:    #9a3050 (two crossed lines behind skull)
```

Follow the same pattern for all 14 elements. The key is: **dark circle + centered glyph + element color**.

---

## PART 7 — RARITY CARD FRAMES (128×160)

These are 9-slice borders. That means you design the CORNERS and EDGES, and the code stretches the edge pieces to fit any card size.

### What is 9-slice?

```
┌─────┬───────────────┬─────┐
│ TL  │   TOP EDGE    │ TR  │  ← corners don't stretch
├─────┼───────────────┼─────┤
│     │               │     │
│LEFT │    CENTER     │RIGHT│  ← edges stretch in one direction
│EDGE │   (empty)     │EDGE │
│     │               │     │
├─────┼───────────────┼─────┤
│ BL  │ BOTTOM EDGE   │ BR  │  ← corners don't stretch
└─────┴───────────────┴─────┘

Corner pieces: 16×16 each (don't stretch)
Edge pieces: 1px wide/tall (stretch to fill)
Center: transparent (content goes here)
```

### Common Frame (simplest — start here)

```
Color: #8a7a6a (grey-brown)

Just a simple 2px border around the entire frame.
- Outer line: #5a4e40 (dark brown)
- Inner line: #8a7a6a (medium brown)
- Corners: same as edges, no decoration
```

### Epic Frame (more ornate)

```
Color: #9b6dff (violet)

- 3px border:
  Outer: #5a2e99 (darkest violet)  
  Middle: #9b6dff (standard violet)
  Inner: #c4a0ff (light violet)
  
- Corner decorations: Small diamond or dot at each corner
  (2×2 pixel bright dot inside each corner)

- Top center: Small gem/crest shape (5×5px triangle pointing up)
```

### Mythic Frame (most ornate)

```
Colors: #ff6b8a (rose) + #e8c55a (gold)

- 4px border with alternating colors:
  Outer: #000000 (black)
  Next: #9a3050 (dark rose)
  Next: #ff6b8a (bright rose)
  Inner: #c89a3e (gold inner trim)

- Corner pieces: Wing or scroll motif (8×8px each)
  Small wing shape in each corner using gold

- Top center: Crown or crest (8×6px)

- Bottom center: Small decorative element
```

---

## PART 8 — EXPORT CHECKLIST

When you finish each asset:

1. **Check at 100% zoom** — does it read correctly at actual size?
2. **Check on dark background** — place it on `#0e0b07` to simulate the app
3. **Check transparency** — make sure the background is actually transparent, not white
4. **Export as PNG** — File → Export → PNG
5. **Name correctly** — `icon_gold.png`, not `Gold Icon.png` or `gold.PNG`
6. **2x export** — For retina screens, also export at double size
   - In Aseprite: File → Export → Resize: 200%
   - Name it `icon_gold@2x.png` or just make the base file 2x

### Delivery order (what to make first):

```
BATCH 1 (highest impact — seen on every screen):
  □ icon_gold.png
  □ icon_crystal.png  
  □ icon_seal.png
  □ icon_stamina.png
  □ icon_streak.png
  □ icon_heart.png / icon_bond.png
  □ icon_hub_nav.png (24×24)
  □ icon_book_nav.png (24×24)
  □ icon_swords_nav.png (24×24)
  □ icon_scroll_nav.png (24×24)

BATCH 2 (player header bar):
  □ icon_hp.png
  □ icon_xp.png
  □ icon_crown.png
  □ icon_death.png
  □ icon_cold.png
  □ icon_morning.png
  □ icon_evening.png

BATCH 3 (remaining UI icons):
  □ All remaining 16×16 icons

BATCH 4 (backgrounds):
  □ bg_hub.png
  □ bg_void.png
  □ bg_roster.png
  □ bg_altar.png

BATCH 5 (element sigils):
  □ All 14 sigils at 32×32

BATCH 6 (card frames + page headers):
  □ 7 rarity frames
  □ 12 page header icons
```

---

## QUICK REFERENCE — COMMON PIXEL ART SHAPES

### Circle at different sizes:

```
4×4 circle:          6×6 circle:          8×8 circle:
  . X X .              . X X X X .          . . X X X X . .
  X . . X              X . . . . X          . X . . . . X .
  X . . X              X . . . . X          X . . . . . . X
  . X X .              X . . . . X          X . . . . . . X
                       X . . . . X          X . . . . . . X
                       . X X X X .          X . . . . . . X
                                            . X . . . . X .
                                            . . X X X X . .
```

### Triangle (pointing up):

```
6px tall:
     . . X . .
     . X . X .
     . X . X .
     X . . . X
     X . . . X
     X X X X X
```

### Diamond:

```
     . . X . .
     . X . X .
     X . . . X
     . X . X .
     . . X . .
```

### Sword (vertical, 3px wide):

```
     . X .     ← tip
     X X X     ← blade (repeat 6-8 rows)
     X X X
     X X X
     . X .     ← guard
     X X X     ← crossguard (wider)
     . X .     ← grip
     . X .
     X X X     ← pommel
```

---

## TIPS FROM PIXEL ART PROS

1. **Start with the silhouette** — get the shape right in black before adding any color
2. **Use references** — Google "16x16 pixel art [thing]" and study how others solved the same problem  
3. **Count your pixels** — symmetry matters. If a shape is 7px wide, the center pixel is pixel 4
4. **Avoid "orphan pixels"** — a single isolated pixel that doesn't touch anything looks like a mistake
5. **Avoid pillow shading** — don't highlight the center and darken all edges equally. That looks like a pillow, not a 3D object. Pick a light direction and commit
6. **Dithering** — if you need a gradient between two colors, alternate pixels in a checkerboard pattern instead of adding a third color
7. **Test in context** — paste your icon into the actual app screenshot to see if it fits the vibe
8. **Iterate** — your first version will look off. That's normal. Adjust 2-3 pixels at a time

Good luck — hand me each batch as you finish and I'll wire them into the site immediately.
