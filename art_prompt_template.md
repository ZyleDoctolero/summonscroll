# SummonScroll Monster Art — Gemini Prompt Template

Use this in **Google AI Studio** → **Imagen 3** (or Gemini 2.0 Flash image generation).  
Settings: **1:1 ratio**, **high quality**, generate **4 samples** → pick the best.

---

## Base Prompt (copy this, fill in the brackets)

```
Dark fantasy RPG card game illustration of [MONSTER DESCRIPTION], full body centered, dynamic action-ready pose, [ELEMENT] energy swirling dramatically behind the creature, [ELEMENT COLOR] aura and particle effects, glowing [ELEMENT COLOR] eyes, rim lighting from behind matching the element color, floating runic symbols and magical particles in background, deep dark background fading to near-black at edges, semi-realistic digital art style, bold outline, detailed textures, concept card art similar to Hearthstone and Magic the Gathering Arena, no text, no UI, no borders, single creature focus, 1:1 square composition
```

---

## How to Fill the Template

### Step 1 — Write [MONSTER DESCRIPTION]
Describe **what the creature looks like physically**. Be specific.

**Format:** `[adjective] [creature type] with [key visual features]`

**Examples:**
- `skeletal dragon with crumbling bone wings and exposed ribcage, purple runes carved into its skull`
- `massive armored bear with twisted wooden antlers and corrupted vines growing from its body`
- `ghostly zombie farmer in tattered overalls and a rotting straw hat, dripping with spectral ichor`
- `grey-skinned goblin in a crude tech harness carrying a circuit-board shield, cybernetic implants on its arms`
- `wolf-headed paladin in ornate gold and silver plate armor swinging a blazing longsword overhead`

**Tips:**
- Mention the pose if you want something specific: `roaring with arms spread`, `crouching ready to leap`, `floating with arms outstretched`
- Mention rarity-appropriate grandeur: commons can be "scrappy" or "small", mythics should be "colossal" or "transcendent"
- Don't say the monster's name — describe what it looks like

---

### Step 2 — Choose [ELEMENT] and [ELEMENT COLOR]

| Element | [ELEMENT] phrase | [ELEMENT COLOR] |
|---|---|---|
| **Arcane** | arcane magical | deep gold and violet |
| **Chaos** | chaotic hellfire | crimson red and dark orange |
| **Void** | void rift | deep purple and dark violet |
| **Death** | death spectral | teal cyan and dark purple |
| **Nature** | primal nature | emerald green and warm amber |
| **Divine** | divine radiant | brilliant gold and pure white |
| **Dread** | dread frost | cold teal and icy blue |
| **Digital** | digital matrix | electric cyan and neon green |
| **Primal** | primal earth | burnt orange and deep brown |
| **Stellar** | stellar cosmic | deep blue and silver starlight |

---

### Step 3 — Add Rarity Intensity (add at end of prompt)

| Rarity | Add to end of prompt |
|---|---|
| **Common** | `simple atmospheric background, soft glow, minimal particle effects` |
| **Uncommon** | `moderate energy aura, some floating particles` |
| **Rare** | `vibrant energy swirls, multiple particle layers, intense rim glow` |
| **Elite** | `dramatic energy explosion behind creature, bright particle storm` |
| **Epic** | `massive energy vortex, glowing runes covering body, intense atmospheric contrast` |
| **Legendary** | `full screen energy eruption, golden light rays breaking through, epic cinematic lighting, particle overload` |
| **Mythic** | `transcendent cosmic energy, reality-warping background, extreme contrast, otherworldly atmosphere` |
| **EX** | `void-breaking energy, reality shattered behind creature, multiple energy layers, cosmic horror meets divine light, most dramatic lighting possible` |

---

## Full Example — Dracolich Elder (Legendary, Death element)

```
Dark fantasy RPG card game illustration of a skeletal dragon with crumbling bone wings spread wide, exposed ribcage glowing with purple fire, curved ram horns on a fanged skull, clawed limbs reaching forward mid-flight, full body centered, dynamic action-ready pose, death spectral energy swirling dramatically behind the creature, teal cyan and dark purple aura and particle effects, glowing teal eyes, rim lighting from behind matching the element color, floating runic symbols and magical particles in background, deep dark background fading to near-black at edges, semi-realistic digital art style, bold outline, detailed textures, concept card art similar to Hearthstone and Magic the Gathering Arena, no text, no UI, no borders, single creature focus, 1:1 square composition, full screen energy eruption, golden light rays breaking through, epic cinematic lighting, particle overload
```

---

## Full Example — Code Goblin (Rare, Digital element)

```
Dark fantasy RPG card game illustration of a stocky grey-skinned goblin in crude dark armor carrying a large circuit board shield etched with glowing green code, cybernetic implants bolted onto its forearms, scowling expression with glowing eyes, arms crossed in a defiant pose, full body centered, dynamic action-ready pose, digital matrix energy swirling dramatically behind the creature, electric cyan and neon green aura and particle effects, glowing cyan eyes, rim lighting from behind matching the element color, floating binary runes and data streams in background, deep dark background fading to near-black at edges, semi-realistic digital art style, bold outline, detailed textures, concept card art similar to Hearthstone and Magic the Gathering Arena, no text, no UI, no borders, single creature focus, 1:1 square composition, vibrant energy swirls, multiple particle layers, intense rim glow
```

---

## How to Use in Google AI Studio

1. Go to **aistudio.google.com**
2. Click **"New prompt"** → select model **"Imagen 3"** (or Gemini 2.0 Flash if Imagen isn't available)
3. Set output to **Image** mode
4. Paste your completed prompt
5. Set **aspect ratio to 1:1**
6. Generate **4 samples** and pick the one closest to the existing style
7. Save as: `full_[monster_name_lowercase_underscored]_[unix_timestamp].png`
   - Example: `full_shadow_werewolf_1782100000000.png`
8. Drop the PNG into `SummonScroll-Fresh/public/monsters/`

---

## What Makes a Good Result vs Bad Result

### ✅ Keep if:
- Creature fills 60–70% of the frame height
- Background is dark with clear element-color energy behind creature
- Eyes glow the element color
- Pose feels dynamic, not just standing straight forward
- Style matches the semi-realistic card art look (not anime, not photorealistic, not cartoon)

### ❌ Regenerate if:
- Background is a scene (forest, dungeon, city) instead of energy/smoke
- Creature is too small in frame (looks like a scene painting)
- Art style looks photorealistic or fully anime
- Two or more creatures in the same image
- Text, logos, or UI elements appear
- Lighting is flat (no rim glow, no dramatic contrast)

---

## Quick Reference — All 104 Remaining Monsters

Run this query against the database to get the list of monsters still needing art:

```sql
SELECT bestiary_id, name, rarity, element, role 
FROM monsters 
WHERE art_url IS NULL 
ORDER BY bestiary_id;
```

Then for each: write a `[MONSTER DESCRIPTION]` based on the name + element + role, plug into the template, generate, save.

**Prioritize by rarity** — do Legendary/Mythic/EX first since those are the pull targets players get excited about. Commons can wait.
