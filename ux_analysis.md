# SummonScroll UX & Visual Design Analysis
## Would a Real User (or Gamer) Be Excited by This?

> Research-backed critique of SummonScroll's current state, benchmarked against top gacha games.  
> Goal: identify what creates excitement, what's missing, and what to prioritize.

---

## 1. What Makes Gacha Games Addictive — The Psychology

Before critiquing the UI, we need to understand the emotional engine underneath every successful gacha game.

### The Dopamine Loop
The core hook isn't the reward — it's **the anticipation of the reward**. Dopamine spikes *before* the result is revealed, not after. This is why pull animations exist: not to show you the monster, but to make you feel the *possibility* before you know the outcome.

> *"The brain begins to anticipate the next win, releasing dopamine in anticipation. This creates a state of 'near-miss' excitement: almost getting a five-star unit feels tantalizingly close, tricking the mind into believing the next pull might be the one."*

### Sensory Reinforcement
Top gacha games (Genshin Impact, Honkai: Star Rail, Arknights) amplify the reward signal through **all senses simultaneously**:
- Screen flash + color shift (visual)
- Rising orchestral sting (audio)
- Haptic feedback (tactile)
- Slow-motion reveal animation (temporal — makes the moment feel important)

### The Pity System as Psychological Anchor
Knowing a 5-star is guaranteed within X pulls creates a **target to march toward**. Players who aren't excited by a single pull stay engaged because they're counting toward the pity threshold.

### Collection as Identity
The Pokédex effect: seeing 487/493 doesn't feel complete — it feels like an itch. Incomplete collections psychologically demand closure. Every locked silhouette is a pull reason.

---

## 2. Benchmark: What Top Gacha Games Do That SummonScroll Doesn't Yet

### Genshin Impact (MiHoYo)
| Element | Implementation |
|---|---|
| Pull animation | Comet trails → color shifts blue → purple → **gold explosion** for 5★ |
| Character reveal | Full-screen splash art, voice line, name title card |
| Bestiary/profile | Full character story, relationships, exploration quotes |
| Card in collection | Animated idle pose, not a static image |
| Rarity signal | Gold = everyone stops what they're doing to watch |
| Pity counter | Visible "X pulls until guaranteed" shown on banner screen |

**What creates excitement:** The color escalation (blue → purple → gold) is the reveal hook. You *read* the rarity from the light color before you see the character. That color moment = the dopamine spike.

### Honkai: Star Rail (HoYoverse)
| Element | Implementation |
|---|---|
| Pull screen | Space opera aesthetic, starfields, parallax backgrounds |
| 5★ reveal | Full screen takeover, character walks toward camera |
| Team building | Clear role icons (Hunt/Erudition/Harmony) make collection feel strategic |
| Codex | Unlocks enemy intel as you defeat them, not just collect |
| Voice acting | Every character has voiced lines on the pull screen |

**What creates excitement:** The pull screen itself is beautiful — you want to visit it even without pulling. The aesthetic sells the world.

### Arknights (Hypergryph)
| Element | Implementation |
|---|---|
| Art style | Operator art is detailed, semi-realistic, memorable |
| Pull result | Cards fanned out → flip one-by-one, foil effect on rare+ |
| Recruitment | Alternative slow-but-free recruitment system |
| Trust system (Bond) | Unlocking character backstory at 100% trust feels earned |
| Operators in collection | Silhouetted until obtained — every unknown is a mystery |

**What creates excitement:** The silhouette approach means every unowned operator is a target. The art quality is high enough that seeing the real art after a pull feels genuinely rewarding.

### Pokémon TCG Pocket (2024)
| Element | Implementation |
|---|---|
| Pack opening | Hands slowly separate pack seams — physical tactile feel |
| Rare reveal | Screen dims, card glows, wavy holographic shimmer |
| Collection | Pokédex-style completion with % visible at all times |
| Wonder Pick | Social mechanic: pick one card from another player's pack |

**What creates excitement:** The pack-opening *ritual* is the product. The sound of tearing + the slow reveal makes even a common feel special. The social dimension (Wonder Pick) gives every pull a PvP angle.

### Reverse: 1999 (Bluepoch)
| Element | Implementation |
|---|---|
| Art style | Pop art + Art Deco + oil painting — visually unique |
| Resonance reveal | Tarot-card flip aesthetic, era-appropriate visuals |
| Character profiles | Full illustrated "case files" with personality, history |
| UI chrome | Period-accurate typography, ornate borders, warm sepia tones |

**What creates excitement:** The art is *so distinctive* that collecting a new character feels like getting a real piece of art. Quality >> quantity.

---

## 3. Honest Assessment: SummonScroll's Current State

### The Pull Experience (Altar)

**What's there:**
- `CEREMONY_CONFIG` rarity tiers: common through EX with escalating duration/effects
- Confetti on legendary+
- `ExtractionModal` for rare+ cards
- Gold rain for legendary, void rift for EX

**What's missing / what a gamer would notice:**
- ❌ **No pull animation build-up** — the 3-second synthesizing delay is a loading state, not a ceremony. Genshin's magic is the *journey* from spark to reveal, not a loader.
- ❌ **No color escalation** — the rarity isn't telegraphed through visual buildup. You go from waiting → result. The dopamine spike needs to happen *during* the reveal, not before or after.
- ❌ **No sound design** — without audio, the visual ceremony is half an experience. Rising strings → crescendo → reveal is the formula.
- ❌ **No 10-pull fan/grid reveal** — a 10-pull showing all cards simultaneously with one glowing is a classic pattern (Arknights card fan, Genshin 10-wish grid)
- ⚠️ **Monster art in pull reveal** — currently using `artUrl` which may be null for many monsters. A grey placeholder on a pull reveal kills the moment.

**Verdict for a gamer:** It's functional but not thrilling. The ceremony config shows the intent but the execution is missing the sensory buildup that makes pulls memorable.

---

### The Compendium / Bestiary

**What's there:**
- 46 monsters with real art
- Filter by realm/rarity, sort options
- MonsterDetailPanel with lore, stats, skills, realm passive
- Animated stat bars
- Lock overlay on unowned monsters

**What's missing / what a gamer would notice:**
- ❌ **"???" on all unowned cards** — cards show `???` as the name. In Pokemon, you see the silhouette of the creature — you *know* it exists and want it. In SummonScroll, `???` tells you nothing about what you're missing. Silhouettes + element color would create desire.
- ❌ **No completion counter / collection progress bar** — a visible "23/46 collected" at the top with a progress bar is the number one driver of collection behavior. Right now it shows `0 / 46` in small mono text that doesn't feel like an achievement goal.
- ❌ **Rarity glow / shimmer on cards** — owned rare+ cards should feel special in the grid. Right now all cards look the same weight visually.
- ❌ **Greyscale + desaturation on unowned** — the grey overlay on unowned images makes the grid feel dull overall. Better: keep element color tinting, remove only the saturation of the art itself.
- ❌ **No animated idle on owned cards** — even a subtle float animation on owned monster cards vs. static unowned would signal ownership viscerally.
- ❌ **The art itself: 46 PNG images** — the images range in quality/style. Some are clearly AI-generated in different styles. A gacha game's *entire* value proposition is "you want this art." Inconsistent art styles break that.
- ❌ **No "NEW" badge** — when you get a monster, there's no visual pop in the compendium showing which ones are newly acquired.
- ⚠️ **No pull-to-collection transition** — after a pull, going to the compendium and seeing the new monster highlighted would close the reward loop.

**Verdict for a gamer:** The bones are solid but the emotional reward loop isn't closed. Getting a monster and then seeing it in the bestiary should feel like a moment. Right now it's a database entry.

---

### The Monster Art (Core Visual Asset)

**What's there:**
- 46 PNG images stored in `/public/monsters/`
- Elemental sigil fallback (new — much better than cartoon blobs)

**What a gamer/designer would say:**
- ❌ **Inconsistent art style** — some monsters look like detailed RPG art, others look like quick generations. Top gacha games (Arknights, Reverse: 1999) have a *unified* art direction. Every character feels like it belongs in the same world.
- ❌ **No consistent framing** — monster images have different crops, backgrounds, and lighting. A card collection needs consistent composition: same pose zone, same background treatment, same scale.
- ❌ **No rarity-appropriate prestige** — a Mythic or EX monster should *look* more impressive than a Common. The art should escalate with rarity. Right now all 46 images are the same format.
- ⚠️ **No animated/particle art** — at minimum, legendary+ should have a subtle shimmer/particle overlay on their card portrait. Even a CSS animation on the image frame elevates this.

**What Genshin Impact does:** Every 5-star has a dedicated "splash art" that's a painting-quality full-body illustration. The art *is* the product. Players tweet about splash art before the character releases.

---

## 4. What's Needed to Create Excitement (Priority Order)

### 🔴 Critical — Without These, a Gamer Won't Feel the Pull

1. **Pull ceremony animation** — needs: a sequential reveal flow for 10-pulls, color-coded rarity buildup (element color particles flood screen → rarity color explosion → monster art appears), subtle camera shake on epic+
2. **Monster silhouettes instead of `???`** — unowned cards should show a dark silhouette of the actual monster with element glow. Creates desire. `???` creates nothing.
3. **Collection progress bar** — prominent, always visible, animated fill. "23 / 46 Discovered" with a visual bar is the #1 engagement driver.
4. **Consistent art direction** — all future monster art needs: same background treatment (dark gradient), same framing (3/4 body, centered), same level of detail. Even 10 consistently-styled monsters are better than 46 inconsistent ones.

### 🟡 High — These Create the "This Game is Polished" Feeling

5. **Rarity glow + shimmer on cards** — owned epic+ cards pulse with their rarity color. CSS animation, no JS needed.
6. **NEW badge** — 24-hour badge on newly obtained monsters in the compendium grid.
7. **Sound design hooks** — even simple royalty-free audio cues for pull reveal, rare+ discovery, and milestone completion transform the feel.
8. **Pull-to-bestiary transition** — after a pull, a "View in Codex" button that navigates to that monster's highlighted card.
9. **Owned card idle float animation** — owned cards gently float. Unowned are static. Visual ownership signal.

### 🟢 Medium — Depth and Replayability

10. **Pity counter visible on altar** — "42 pulls until guaranteed Legendary" makes every pull feel like progress.
11. **Lore unlock progression** — lore locked until owned, skills locked until 25% bond. Creates progression within the bestiary itself.
12. **Realm completion banners** — "Ancient Vaults: 4/4 Complete — Realm Master" with visual reward when a realm is complete.
13. **Monster compare mode** — select 2 monsters, see side-by-side stats. Encourages team-building thought.

---

## 5. The Core Diagnosis

> **The app is a productivity tool wearing a gacha game costume.** The gacha mechanics are present but the *feeling* of a gacha game — the excitement, the desire to collect, the ceremony of receiving something rare — isn't fully realized yet.

The gap between SummonScroll and a game a real gamer would call "exciting":

| Dimension | Top Gacha Game | SummonScroll Now |
|---|---|---|
| Pull moment | Orchestrated ceremony, seconds of suspense | 3-sec loading delay → result |
| Rare reveal | Full-screen takeover, voice, particles | ExtractionModal (good start) |
| Collection grid | Silhouettes create desire, glows show status | `???` text, flat grey overlay |
| Art consistency | Unified style, rarity-appropriate prestige | 46 images, mixed styles |
| Progress feedback | Visible pity counter, completion % everywhere | Small `0/46` counter |
| Sound design | Rising music, character voice lines | Silent |
| Reward closure | Pull → reveal → highlight in collection | Pull → result only |

---

## 6. What To Build Next (Immediate Impact)

The single highest-ROI change: **replace `???` with silhouettes and add a visible completion bar.**

This turns the compendium from "a list of things you don't have" into "a gallery of things you *want*." It's the Pokédex effect — the psychological pull of completion that makes gacha games work even between sessions.

Second: **the pull animation ceremony.** Currently the Altar has the config but not the execution. Even a 5-second CSS animation — particle burst → flash → art reveal — would transform the feel of a pull from transactional to theatrical.

---

## Sources

- [Genshin Impact: Gacha games and their element of design](https://medium.com/design-bootcamp/genshin-impact-gacha-games-and-their-element-of-design-67610569e040) — Joedi Ho, UX Design Bootcamp
- [A study of gacha games: the UX of the Pokémon TCG Pocket app](https://uxdesign.cc/a-study-of-gatcha-games-the-ux-of-the-pokemon-tcg-pocket-app-b291c78db86f) — Daley Wilhelm, UX Collective
- [Why Gacha Games Are So Addictive: Psychology, Rewards, and Player Behavior](https://www.gamenguide.com/articles/108013/20260515/why-gacha-games-are-so-addictive-psychology-rewards-player-behavior.htm) — GameNGuide
- [The Gacha Effect: How Random Rolls Reshaped Modern Gaming](https://medium.com/@kaloymunoz/the-gacha-effect-how-random-rolls-reshaped-modern-gaming-0660520c9271) — Kaloy Muñoz, Medium
- [The Complete Game UX Guide for 2025](https://game-ace.com/blog/the-complete-game-ux-guide/) — Game-Ace
- [The Complete Guide to Mobile Game Gachas](https://www.gamerefinery.com/the-complete-guide-to-mobile-game-gachas-in-2022/) — GameRefinery
- [Best Gacha Games 2025](https://www.pockettactics.com/best-gacha-games) — Pocket Tactics
- [Top UI/UX Game Design Trends 2024](https://medium.com/@devstreestudio/top-ui-ux-game-design-trends-for-2024-f123ca3d9ee6) — Devstree Studio
- [Product design and psychology: Exploring Gacha Mechanics](https://www.academia.edu/105465335/Product_design_and_psychology_Exploring_Gacha_Mechanics_in_Video_Game_Design) — Academia.edu
- [Wish system explained — Genshin Impact](https://www.hoyolab.com/article/32354402) — HoYoLAB
