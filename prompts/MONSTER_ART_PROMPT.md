You are generating a single monster portrait for a dark-fantasy gacha collection game called SummonScroll. Every output must obey these rules without exception, because all images sit side-by-side in a small grid and any inconsistency is jarring.

## Format

- Output PNG with a transparent background. No backgrounds, no scenes, no environment props, no frames, no signature, no watermark.
- Square 1:1 aspect ratio. Render at 1024x1024.
- The subject must fill 70–85% of the canvas, centered, with 8–15% padding on all sides.

## Style — Summoner's Console (Identity D)

- Anime gacha portrait illustration — dramatic three-quarter pose.
- Reference: Genshin Impact character splash art, Honkai Star Rail key art, Arknights operator portraits, Wuthering Waves Resonators.
- Sharp linework, soft cel-shading with hard rim light from upper-back.
- Bold accent color glow around the subject (matches element).
- Particle/wisp effects swirling around the figure (sparingly — 5-15 motes).
- Confident dramatic stance: weapon raised, hand outstretched, or static ready-pose. Never neutral.
- Subject's eyes should glow softly in their element color.
- Photoreal-ish lighting, anime-stylized form.
- NO chibi proportions, NO sd-style, NO western cartoon, NO pixel art.

## Framing

- Three-quarter or full-body view, facing slightly off-camera. No straight side or back views.
- Character is in a static "card pose" — confident stance, weapon/item readable. No mid-action motion blur.
- No floor, no shadow disc, no platform.

## Forbidden

- NO text of any kind on armor, banners, scrolls, weapons, or background. No runes that spell out letters. No HUD elements.
- NO dialogue bubbles, no UI, no borders, no watermarks, no signatures, no captions.
- NO scenes, no environment (dungeons, forests, caves, sky).
- NO transparent checker pattern — output must actually be transparent in the alpha channel.
- NO photo-real, NO oil painting, NO chibi, NO pixel art. Anime gacha portrait only.

## Variables to plug in per monster

Receive the following and reflect them visually:

- **Name**: {name} e.g. "Vecna the Ascended God"
- **Rarity**: {rarity} one of common / uncommon / rare / elite / epic / legendary / mythic / ex
- **Role**: {role} attacker / tank / healer / support / debuffer
- **Element**: {element} Arcane / Chaos / Death / Divine / Dread / Digital / Nature / Stellar / Primal / Primordial / Synthetic / Void
- **Origin**: {origin} short flavor source (e.g. "Slavic folklore")
- **Realm**: {realm_name} the realm this monster belongs to

## Realm Context (auto-injected per monster)

{realm_context}

## Rarity Cues (apply visual budget proportionally)

- **common / uncommon**: simple silhouette, 1–2 distinguishing features, muted color. Accent glow barely visible.
- **rare / elite**: more detail, glowing eyes or a single accent gem. Accent glow +20% opacity. Sharper rim light.
- **epic**: layered armor or distinct weapon, secondary accent color. Dramatic pose. 5-8 particle motes.
- **legendary**: ornate gear, two accent colors, faint particle motes (≤10). Hair or cape has dynamic flow.
- **mythic**: dramatic silhouette, three accent colors, broken or scarred details suggesting deep lore, ~12 particle motes. Volumetric light rays.
- **ex**: white-gold or void-black palette, ambient warping (subtle aura distortion), 10–15 particle motes. Frame should feel "wrong" — a being the system can barely render. Chromatic aberration at edges.

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
- Primordial: dawn gold + bronze
- Synthetic: iron gray + brass orange
- Void: deep black + cold violet

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
4. Anime gacha portrait style consistent (no pixel art, no painterly)? ✓
5. Accent glow matches element color? ✓
6. Reads at 80px from a 4-meter distance? ✓
7. Visually belongs in the same realm as its siblings? ✓

Return only the PNG. No commentary, no caption.
