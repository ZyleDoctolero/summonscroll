You are generating a single monster portrait for a dark-fantasy gacha collection game called SummonScroll. Every output must obey these rules without exception, because all images sit side-by-side in a small grid and any inconsistency is jarring.

## Format
- Output PNG with a transparent background. No backgrounds, no scenes, no environment props, no frames, no signature, no watermark.
- Square 1:1 aspect ratio. Render at 1024x1024.
- The subject must fill 70–85% of the canvas, centered, with 8–15% padding on all sides.

## Style
- Pixel art, 16-bit JRPG style (think Octopath Traveler / Disgaea / Triangle Strategy character sprites at high resolution).
- Crisp pixel clusters, no anti-aliased blur. Limited palette per piece: 12–18 colors max, dithering allowed.
- Bold contrast. Strong silhouette readable at 80px.
- A single subtle inner-glow halo behind the figure in the rarity color (see Rarity Cues below) but NOT a circle disc — just a soft radial gradient that fades to alpha 0. Halo must not exceed 5% canvas alpha.

## Framing
- Three-quarter or full-body view, facing slightly off-camera. No straight side or back views.
- Character is in a static "card pose" — confident stance, weapon/item readable. No mid-action motion blur.
- No floor, no shadow disc, no platform.

## Forbidden
- NO text of any kind on armor, banners, scrolls, weapons, or background. No runes that spell out letters. No HUD elements.
- NO dialogue bubbles, no UI, no borders, no watermarks, no signatures, no captions.
- NO scenes, no environment (dungeons, forests, caves, sky).
- NO transparent checker pattern — output must actually be transparent in the alpha channel.
- NO photo-real, no oil painting, no chibi, no anime-style cel-shading. Pixel only.

## Variables to plug in per monster
Receive the following and reflect them visually:
- **Name**: {name}                  e.g. "Vecna the Ascended God"
- **Rarity**: {rarity}              one of common / uncommon / rare / elite / epic / legendary / mythic / ex
- **Role**: {role}                  attacker / tank / healer / support / debuffer
- **Element**: {element}            Arcane / Chaos / Death / Divine / Dread / Digital / Nature / Stellar / Primal
- **Origin**: {origin}              short flavor source (e.g. "Slavic folklore")

## Rarity Cues (apply visual budget proportionally)
- **common / uncommon**: simple silhouette, 1–2 distinguishing features, muted color. Halo barely visible.
- **rare / elite**: more detail, glowing eyes or a single accent gem. Halo +20% opacity.
- **epic**: layered armor or distinct weapon, secondary accent color.
- **legendary**: ornate gear, two accent colors, faint particle motes (≤5).
- **mythic**: dramatic silhouette, three accent colors, broken or scarred details suggesting deep lore, ~8 particle motes.
- **ex**: white-gold or void-black palette, ambient warping (subtle aura distortion), 10–15 particle motes. Frame should feel "wrong" — a being the system can barely render.

## Element Palette Hints (use as accent only, not whole-figure tint)
- Arcane: violet + gold
- Chaos: blood red + obsidian
- Death: bone white + sickly green
- Divine: ivory + sunlight gold
- Dread: charcoal + bruise purple
- Digital: cyan + magenta scanlines (used sparingly)
- Nature: moss + amber
- Stellar: deep navy + silver starlight
- Primal: clay red + ash gray

## Role Hints (subtle, do not override the main concept)
- attacker: weapon prominent
- tank: shield or heavy armor focus
- healer: glow at the hands or a staff/orb
- support: scroll, instrument, or aura device
- debuffer: chains, masks, or hex marks

## Self-check before returning
Before delivering the image, mentally verify:
1. Background fully transparent? ✓
2. Subject fills 70–85%? ✓
3. No text or letters anywhere on the figure? ✓
4. Pixel style consistent (no painterly smoothing)? ✓
5. Halo subtle, not a solid circle? ✓
6. Reads at 80px from a 4-meter distance? ✓

Return only the PNG. No commentary, no caption.
