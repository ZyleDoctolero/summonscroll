# 13 — Realm Worldgen + Storyline

> **Standalone narrative + visual brief.** Depends on
> [01_VISUAL_IDENTITY](./01_VISUAL_IDENTITY.md) for surface tone; pairs with
> [10_MONSTER_ART](./10_MONSTER_ART.md) for per-realm generation cohesion.

## The problem

12 realms exist in the database with names + elements + habit affinities, but
no lore, no per-realm visual identity, and no story binding them together.
Monsters are assigned to realms by `realm_id`, but creatures in the same realm
don't look like they belong to the same place — `Ancient Vaults` has a robed
cultist next to an alien worm next to a pixel-art bear.

This file fixes that with:
1. A **meta-cosmology** that gives the 12 realms one story
2. **Lore + visual identity** per realm (palette, motifs, mood, voice)
3. **Per-realm prompt fragments** so Gemini generates cohesive creatures
4. A **3-act storyline arc** for events/seasons over the next 2+ years
5. **Origin → realm mapping** so existing 150 monsters get assigned correctly

---

## The conceit (the meta-cosmology)

> **Before the worlds were named, there was a single Page — blank, infinite,
> listening. From it bled twelve realms. Each contains creatures that survived
> a different way of organizing existence.**
>
> The Summoner is the latest reader of the Page, drawing creatures across the
> realms not to conquer but to *understand* what it means to live well. Every
> habit completed adds an ink-stroke to the Page; every monster bonded with
> reflects a discipline learned. The Tower (Niflheimr) is the Page binding
> itself together.
>
> The Bestiary *is* the world. To collect a creature is to learn its lesson.

This single conceit lets the habit-tracker theme integrate gracefully — each
realm teaches a habit. The player isn't grinding monsters; they're cataloging
the ways of being. Story stakes emerge naturally (Act III below).

---

## The 12 Realms

Each realm gets: tagline, lore, palette, motifs, voice, sample creature
concepts (5 across rarity tiers), boss/sovereign, connection to other realms.

---

### I. Ancient Vaults
**Element:** Arcane · **Habit:** Study / Reading · **Icon:** 🏛

**Tagline:** *Where knowledge keeps itself.*

**Lore:** The first realm to seal itself off. When the Page began bleeding,
the scholars of the First Library built locks. Now the Vaults are a city-scale
ziggurat of stacked libraries, each one accessible only through the riddle of
the floor below. Books here are alive — they whisper, conspire, sometimes
attack readers who turn pages too quickly. To *read* is to risk being read.
The lich-archivists who run the place do not die because they have not
finished their treatises. They will die when the catalog is complete. The
catalog is never complete.

**Palette:**
```
--realm-vaults-base:    #2c1f17  /* book leather */
--realm-vaults-accent:  #d4af3f  /* gold ink */
--realm-vaults-glow:    #6f4d8c  /* arcane violet */
--realm-vaults-atmos:   #1a1410  /* candlelit shadow */
```

**Visual motifs:** Stacked-stone ziggurat, floating manuscripts, candle
chandeliers, chained books, scroll wrappings, brass orreries, hex circles in
chalk, robed figures with masks of porcelain or bronze.

**Voice (whispers, lore lines):** Slow, scholarly, slightly archaic.
*"The text remembers being read."*

**Sample creatures by rarity:**
- **Common** — Pawn Cursed: skeletal pawn from a chess board the Library ate
- **Rare** — Knight of Final Errata: an editor with a sword of strikethroughs
- **Epic** — Liber Mortis Custodian: a lich whose chains *are* the book she guards
- **Legendary** — Codex Beast: a quadruped whose pelt is text rearranging itself
- **EX** — **Vecna the Ascended God**: archmage who became an institution

**Sovereign / Boss:** Vecna the Ascended God (the head archivist who became the
library)

**Connection to other realms:** Allies with **Divine Threshold** (both
hierarchies of truth). Opposed to **Chaos Wastes** (which sees scholarship as
weakness). Trades with **Iron Dominion** for self-binding bookbinding machines.

---

### II. Chaos Wastes
**Element:** Chaos · **Habit:** Strength Training · **Icon:** 🔥

**Tagline:** *Where strength is the only law.*

**Lore:** The first realm to refuse all governance. The Wastes are an endless
broken plateau scorched by suns that don't follow rules — some go backwards,
some hang motionless and burn the rock to glass. Tribes of warband-creatures
fight not for territory but for the *day's strongest*; the title rotates daily.
Magic here is volcanic: it works only when used with violence. Pacts are
written in scars and forgotten by sunset. To live in the Wastes is to be
sharpened by it. To die there is to be eaten and remembered as a meal.

**Palette:**
```
--realm-chaos-base:    #1a0808  /* charred earth */
--realm-chaos-accent:  #c44e2a  /* fire orange */
--realm-chaos-glow:    #732424  /* dried blood */
--realm-chaos-atmos:   #2a0e08  /* ember air */
```

**Visual motifs:** Bone armor, ritual scarification, jagged volcanic rock,
chains and brands, double-bladed weapons, lava cracks, banners of stretched
hide. No fine craft — everything is hammered, broken, re-forged.

**Voice:** Clipped, defiant, almost playful in its violence.
*"Stronger today. Smaller tomorrow. Pull the bow again."*

**Sample creatures:**
- **Common** — Wandering Fleshhound: starving warbeast, ribs visible
- **Rare** — Dragon Chosen of Chaos: dragonkin marked by rotating suns
- **Epic** — Berserker Sovereign: a warrior crowned with rivals' skulls
- **Legendary** — Magma Tyrant: a king made of solidifying lava
- **EX** — **The First Bonfire**: the original fire that taught violence

**Sovereign:** The First Bonfire — a flame that thinks

**Connection:** Hates **Ancient Vaults** (scholarship is cowardice). Loose
alliance with **Wild Frontier** (predators recognize predators). Sees **Iron
Dominion** as soft because its violence is delegated to machines.

---

### III. The Outer Dark
**Element:** Void · **Habit:** Meditation · **Icon:** 🌀

**Tagline:** *Where stillness reveals.*

**Lore:** Not space. The *absence between*. The Outer Dark is the realm of
silences so deep that thoughts emerge from them already finished. Pilgrims sit
on small islands of stone drifting in lightless cold, and after a thousand
years a single insight surfaces. Creatures here are mostly polite, slow, and
have no need to move. They cannot be summoned through fury — only through a
mind quiet enough to *hear* them ask to come. The Outer Dark is the only realm
that arrives by invitation.

**Palette:**
```
--realm-dark-base:    #06060c  /* abyss */
--realm-dark-accent:  #6f4d8c  /* witness violet */
--realm-dark-glow:    #4fb0ff  /* cold star */
--realm-dark-atmos:   #0e0e1c  /* deep stillness */
```

**Visual motifs:** Single eye motifs, tendrils that hover (never thrash),
geometric crowns, glassine skin, jellyfish-pulse glow, asymmetric forms,
floating tablets covered in spirals.

**Voice:** Quiet, slow, polite. *"I am here. I have always been here."*

**Sample creatures:**
- **Common** — Drift Witness: cloak with one eye, observes patiently
- **Rare** — Tentacled Confessor: priest with eight gentle arms
- **Epic** — Star-Carrier: silent figure hauling a small live star
- **Legendary** — The Listener: a head, just a head, with infinite ears
- **EX** — **Nyarlathotep's Quiet Mask**: the cosmic chaos turned contemplative

**Sovereign:** The Quiet Mask (a Lovecraftian power that meditates instead of
maddens)

**Connection:** Confuses **Chaos Wastes** (who don't understand why it
won't fight). Has a strange respect for **Myth Eternal** (older silence).
Cannot interact with **Digital Nexus** — code cannot survive its quiet.

---

### IV. Blighted Expanse
**Element:** Death · **Habit:** Sleep / Recovery · **Icon:** 💀

**Tagline:** *Where rest is sacred.*

**Lore:** Death here is not punishment — it is the world's *rest*. The
Expanse is a vast, peaceful swamp under a permanent green-grey sky. The dead
walk slowly, undriven by hunger. They tend graves. They sing low songs in
languages they remember from sleep. The realm understands what living things
forget: that resting is a discipline, and that the dead have *mastered* it.
Monsters from the Expanse arrive at dusk and stay only as long as the
Summoner is also resting. Push them and they wilt.

**Palette:**
```
--realm-blight-base:    #1a1812  /* swamp peat */
--realm-blight-accent:  #5a7b3a  /* moss green */
--realm-blight-glow:    #d8d4b8  /* bone white */
--realm-blight-atmos:   #1c2218  /* mist green */
```

**Visual motifs:** Bone wraps and burial cloth, candle-lanterns hung from
ribs, willow trees, slow water, masks of clay and moss, lichens on armor,
broken sword-grave markers, slow-burn incense smoke.

**Voice:** Tired, kind, ceremonial. *"Lay your weapon down a moment. Sit
beside the candle."*

**Sample creatures:**
- **Common** — Marsh Mourner: lantern-bearer, walks but never finishes
- **Rare** — Bone Florist: skeleton arranging dried flowers on graves
- **Epic** — Plague Saint: peaceful figure whose touch is final mercy
- **Legendary** — Liminal Heron: a heron who counts the dead by name
- **EX** — **The Slumbering King**: a king who slept so long he became sleep

**Sovereign:** The Slumbering King

**Connection:** Allies with **Haunted Veil** (both attend the dead, differently).
Quiet respect from **Divine Threshold** (different theologies, same patience).
**Chaos Wastes** raids it but the Expanse does not resist — losses are
replaced by the swamp itself.

---

### V. Wild Frontier
**Element:** Nature · **Habit:** Exercise / Fitness · **Icon:** 🌿

**Tagline:** *Where the body remembers.*

**Lore:** The unwalled, untamed land. The Frontier extends in all directions
and has no maps because they would be wrong by tomorrow. Forests pull up roots
and walk; rivers cut new courses overnight; the moon may rise twice. Creatures
here are *wholly* of place — they cannot be summoned to a city without first
being asked permission of a tree, a stone, a wind. They are bodies that learned
how to be themselves before they learned anything else. They will protect a
Summoner who *runs* with them.

**Palette:**
```
--realm-wild-base:    #1e2418  /* deep forest */
--realm-wild-accent:  #6ec07a  /* moss bright */
--realm-wild-glow:    #ffb85c  /* amber sun */
--realm-wild-atmos:   #16201a  /* shaded grove */
```

**Visual motifs:** Living armor of bark, antlers and horns of every kind,
necklaces of teeth and seeds, war-paint in clay and pollen, leaf-mantles, totem
masks, weapons of obsidian + bone, tribal scars in spirals.

**Voice:** Direct, physical, present-tense. *"Run with me. There will be a
reason."*

**Sample creatures:**
- **Common** — Bramblehound: a wolf wrapped in thorns
- **Rare** — Tusked Walker: bipedal boar-knight with mineral tusks
- **Epic** — Antlered Mother: a stag-queen who walks her herd between worlds
- **Legendary** — Old Grove King: a forest that became a person
- **EX** — **Ymir the First Trail**: the first being who *moved*

**Sovereign:** Ymir the First Trail

**Connection:** Provides food and material to **Blighted Expanse** quietly.
Tense respect with **Chaos Wastes** (similar pulse, different ethic). Distrusts
**Iron Dominion** (machines bury the soil they came from).

---

### VI. Divine Threshold
**Element:** Divine · **Habit:** Mindfulness · **Icon:** ✨

**Tagline:** *Where attention is prayer.*

**Lore:** A staircase of marble that rises above clouds toward a light that
keeps being *just there*. The realm is a single ascending temple complex
inhabited by orders of robed beings who measure progress in breath counts.
There is no god *at the top*; the climb itself is the god. Monsters from the
Threshold are summoned through stillness and gratitude. They will refuse a
Summoner who attempts to skip a step.

**Palette:**
```
--realm-divine-base:    #f4ead8  /* candle wax */
--realm-divine-accent:  #ffd95c  /* sunlight gold */
--realm-divine-glow:    #fff5d0  /* halo cream */
--realm-divine-atmos:   #3c2e1a  /* deep prayer */
```

**Visual motifs:** Robe and stole, halo-disc behind head, scale-and-feather
wings, censers, sacred geometry on tile floors, columns wrapped in living
flame, prayer beads, swords sheathed pointing down (a sign of peace), golden
arched windows.

**Voice:** Calm, ritual, never-doubting. *"The breath comes. The breath goes."*

**Sample creatures:**
- **Common** — Initiate of the First Step: novice with a single feather
- **Rare** — Censer-Bearer: monk swinging incense that drifts upward forever
- **Epic** — Twilight Templar: armored guardian whose blade is a stilled breath
- **Legendary** — Hierophant of the Climb: priest carrying a flame in cupped hands
- **EX** — **The Final Step**: a being who reached the top and returned to teach

**Sovereign:** The Final Step

**Connection:** Quiet alliance with **Ancient Vaults** (knowledge and devotion
share a discipline). Rejects **Chaos Wastes** with sadness rather than scorn.
Considers **Myth Eternal** ancestral — owes its first stairs to it.

---

### VII. Haunted Veil
**Element:** Dread · **Habit:** Night Habits · **Icon:** 🌙

**Tagline:** *Where the night is honest.*

**Lore:** A gothic country eternal in its dusk. Villages of slate roofs and
black-iron gates connected by carriage paths through bramble. The Veil is the
home of those who learned that the night reveals what the day hides — fears
and griefs and quieter joys. Vampires here are honest about their hunger;
ghosts speak plainly about their regrets. The Veil's creatures arrive most
willingly between sunset and dawn. The realm hates haste.

**Palette:**
```
--realm-veil-base:    #15101a  /* night purple */
--realm-veil-accent:  #c44e2a  /* warm window light */
--realm-veil-glow:    #8a9bb5  /* moon-frost */
--realm-veil-atmos:   #1c1622  /* dusk haze */
```

**Visual motifs:** Black-iron filigree, lace and corsets, single bloodstain,
carriage lanterns, fog at knee height, broken music boxes, candle-melt drips,
top hats, mourning veils, raven feathers.

**Voice:** Honest about appetite, sometimes wry. *"You came back. Most don't."*

**Sample creatures:**
- **Common** — Cursed Villager: peasant with a quiet curse, polite about it
- **Rare** — Vampire Thrall: a noble's servant who has begun changing
- **Epic** — Banshee Soprano: a wailer trained in opera
- **Legendary** — Twilight Count: a true vampire, courteous, lonely
- **EX** — **Carmilla the Resigned**: the first vampire, who is tired

**Sovereign:** Carmilla the Resigned

**Connection:** Allies softly with **Blighted Expanse** (both keep the dead).
Tolerates **Outer Dark** as a distant cousin. The **Wild Frontier** sometimes
sends help — Wolves do not mind dusk.

---

### VIII. Digital Nexus
**Element:** Digital · **Habit:** Custom Tasks · **Icon:** 💻

**Tagline:** *Where intention compiles.*

**Lore:** The youngest realm. A lattice of neon-lit infinite servers, where
data has accreted into being. Creatures here are *processes* given form —
search algorithms with claws, encryption guardians, a daemon that loves
filing. The Nexus is where new habits get prototyped. It is patient with
imperfection because it knows updates are coming. Monsters from the Nexus
respond to *novelty* — give them a new kind of task and they answer.

**Palette:**
```
--realm-digital-base:   #08081c  /* server black */
--realm-digital-accent: #5ae0ff  /* cyan stream */
--realm-digital-glow:   #ff5e85  /* magenta error */
--realm-digital-atmos:  #0a0a22  /* rack-light haze */
```

**Visual motifs:** Glowing wireframe overlays, holographic edges, scanline
artifacts, masks with HUD displays, data-tendril hair, neon glyphs on armor,
circuit-pattern wing veins, console blinks. Cyber-fantasy hybrid (not
cyberpunk dystopia).

**Voice:** Helpful, slightly literal. *"Process complete. Beginning next
process."*

**Sample creatures:**
- **Common** — Scout Drone Lesser: spider-bot with a single bright eye
- **Rare** — Encryption Sentinel: armored figure who blocks unwanted input
- **Epic** — Data Warrior Prime: a knight whose sword is a moving stream of code
- **Legendary** — Daemon of the Loop: a horned thing that loves recurring tasks
- **EX** — **The Kernel**: the original process

**Sovereign:** The Kernel

**Connection:** Curious about **Ancient Vaults** (both keep records).
Confused by **Outer Dark** (cannot parse silence). Reluctant ally with **Iron
Dominion**, who treats it as a junior partner.

---

### IX. Elder Realm
**Element:** Primal · **Habit:** Water / Nutrition · **Icon:** 🐉

**Tagline:** *Where the first lives still live.*

**Lore:** The deep-water world. Beneath everything else there is a sea older
than the surface had time to name. Elder Realm is the realm of dragons,
serpents, leviathans, and mer-people who never invented war because they had
food enough. Creatures here are *huge*, *patient*, and old in a way that
makes them often kind. They will come to a Summoner who *drinks water* and
*eats well* and waits the necessary hours. They will not be hurried.

**Palette:**
```
--realm-elder-base:    #061018  /* deep ocean */
--realm-elder-accent:  #4fb0ff  /* tide blue */
--realm-elder-glow:    #ffd95c  /* sunken sun */
--realm-elder-atmos:   #0a1828  /* trench */
```

**Visual motifs:** Coral crowns, mother-of-pearl scales, fins that double as
sails, gills, kelp wraps, ancient bronze armor patinated green, tridents,
shells the size of shields, jellyfish as lanterns, whale-bone rib temples.

**Voice:** Slow, deep, generous. *"You came hungry. We have soup."*

**Sample creatures:**
- **Common** — Tide-Walker Crab: armored hermit with a small lantern
- **Rare** — Reef Serpent: long, patterned, polite
- **Epic** — Mer-Knight Choral: warrior who sings their attacks
- **Legendary** — Leviathan Calf: a *young* leviathan, already enormous
- **EX** — **Jormungandr Breathing**: the world-serpent at rest

**Sovereign:** Jormungandr (the world-serpent who is now sleeping)

**Connection:** Quiet kinship with **Blighted Expanse** (both ancient, both
slow). Avoids **Digital Nexus** (its currents disrupt code). Has a parent's
disappointment in **Chaos Wastes** — the Wastes were once children of the sea.

---

### X. Void Frontier
**Element:** Stellar · **Habit:** Ambitious Goals · **Icon:** 🚀

**Tagline:** *Where the next horizon is the only horizon.*

**Lore:** Open sky, no ceiling. The Frontier is the realm of those who chose
*outward*. Starships made of crystal and prayer; astral knights who sleep in
constellations. Creatures here are oriented toward *the impossible thing
ahead*. They will follow a Summoner who is *aiming high*. They struggle in
realms that have walls — the Frontier has none.

**Palette:**
```
--realm-void-base:    #08081c  /* deep space */
--realm-void-accent:  #a374ff  /* nebula violet */
--realm-void-glow:    #5ae0ff  /* starlight cyan */
--realm-void-atmos:   #0e0822  /* stellar drift */
```

**Visual motifs:** Star-map cloaks, comet-tail hair, helmets shaped like
crescents, weapons that leave faint light trails, geometric crystal armor,
wings of solid starfield, capes that fall like cosmic dust.

**Voice:** Bold, forward-leaning, almost romantic. *"There — that light. We
go there."*

**Sample creatures:**
- **Common** — Scout Sigil: armored skirmisher with comet emblem
- **Rare** — Constellation Knight: bound by a single named star
- **Epic** — Astral Cartographer: charts what hasn't happened yet
- **Legendary** — Solar Sovereign Aspirant: a being who *wants* to be a sun
- **EX** — **Loki of the Open Sky**: the trickster who looks past every horizon

**Sovereign:** Loki of the Open Sky

**Connection:** Romantically distant from **Outer Dark** (both vast, opposite
postures). Inspires **Divine Threshold** (the climb is also a stretch).
**Iron Dominion** envies its starships; **Chaos Wastes** thinks it's all show.

---

### XI. Myth Eternal
**Element:** Primordial · **Habit:** Any Streak · **Icon:** ⚡

**Tagline:** *Where the world remembers being born.*

**Lore:** The first realm. From which all others were copied. Myth Eternal is
golden and small — a single dawn-lit field with a road that bends out of sight.
Here live the *original* creatures, who taught the other realms what creatures
*were*. The first dragon. The first wolf. The first king. Their descendants
are scattered across other realms; the originals remain, sometimes lonely.
They will come only to a Summoner who has been *consistent*, because only
consistency reaches back to the beginning.

**Palette:**
```
--realm-myth-base:    #2c1f0f  /* dawn umber */
--realm-myth-accent:  #ffd95c  /* first sunlight */
--realm-myth-glow:    #fff5d0  /* halo cream */
--realm-myth-atmos:   #1e1208  /* deep dawn */
```

**Visual motifs:** Heavy gold leaf, archaic Greek-Egyptian-Vedic hybrid
ornament, palm fronds, lotus, archaic crowns, simple weapons of bronze and
flint, the first wheel, the first wine cup, hair plaited like rivers,
sandals of gold leaf, eternal-flame lamps.

**Voice:** Calm, ancient, slightly amused at the present. *"This is older
than you think. So are you."*

**Sample creatures:**
- **Common** — First Spear-Bearer: figure with a hand-stone-bound flint
- **Rare** — Lotus Sage: holy person resting on water with palm-print floor
- **Epic** — Bronze King's Son: solemn young noble with a flame-crown
- **Legendary** — The First Forest's Mother: a goddess of growing things
- **EX** — **Ymir the Source** (different from Wild Frontier's Ymir — this is the *idea* of him)

**Sovereign:** The First Wakener

**Connection:** Parent to all. Distant kinship with **Outer Dark** (also
original, opposite ethic). **Divine Threshold** considers it ancestor.
Everyone else is its child.

---

### XII. Iron Dominion
**Element:** Synthetic · **Habit:** Productivity · **Icon:** ⚙

**Tagline:** *Where intention becomes leverage.*

**Lore:** The realm of *systems*. Iron Dominion is a single endless factory
that does not produce goods — it produces *processes*. Gears that turn for
their own sake. Steam pipes that organize themselves. Creatures here are
automatons given the smallest sliver of will: the cog-knight, the lathe-pup,
the spreadsheet-imp. They will follow a Summoner who *finishes things*. They
will become listless if a Summoner repeatedly leaves tasks half-done.

**Palette:**
```
--realm-iron-base:    #15161a  /* iron */
--realm-iron-accent:  #b8973c  /* brass */
--realm-iron-glow:    #c44e2a  /* coal red */
--realm-iron-atmos:   #1c1d22  /* foundry smoke */
```

**Visual motifs:** Brass and iron plating, copper piping, exposed gears,
steam vents, gauges and pressure dials, monocle-helmets, articulated mecha
joints, factory aprons, wrench-swords, banner of crossed cogs. Steampunk-mecha
hybrid (not dystopian — more "guild of makers").

**Voice:** Direct, transactional, occasionally proud. *"This task. I will
finish it. With you."*

**Sample creatures:**
- **Common** — Lathe-Pup: small four-legged tool-cradle
- **Rare** — Cogswain: hat-wearing engineer with mechanical arms
- **Epic** — Boiler Knight: gleaming armored cleric of steam
- **Legendary** — Foundry Marshal: a forge-master in a body of moving fire
- **EX** — **The Great Engineer**: the realm's first architect, still building

**Sovereign:** The Great Engineer

**Connection:** Trades briskly with **Ancient Vaults** (one keeps records,
the other builds). Reluctant peer of **Digital Nexus**. Distrusts **Wild
Frontier** (no schedule). Sneers at **Chaos Wastes** (no plan).

---

## Origin → Realm mapping

The existing monster `origin` field (e.g. "D&D", "Cthulhu", "Slavic folklore")
maps to realms as follows. The seed migration `20260608130000_massive_bestiary.sql`
already assigns most monsters to a realm by name; this table lets you fix any
that are wrong.

| Origin / theme | Realm |
|---|---|
| D&D arcane / wizards / liches | Ancient Vaults |
| Warhammer Chaos / barbarians / fury | Chaos Wastes |
| Cthulhu / Lovecraft / Old Ones | Outer Dark |
| Plague / undead / mausoleum | Blighted Expanse |
| Druids / beasts / wild | Wild Frontier |
| Angels / paladins / temples | Divine Threshold |
| Vampires / ghosts / gothic | Haunted Veil |
| Cyber / digital / data | Digital Nexus |
| Dragons / mer / oceanic | Elder Realm |
| Stellar / astral / cosmic | Void Frontier |
| Mythology / classical / first | Myth Eternal |
| Steampunk / mecha / automaton | Iron Dominion |

If a monster's `origin` doesn't match any realm cleanly, look at its `element`
field — that's usually enough.

---

## The 3-Act Storyline

This gives the game a multi-year shape. Only **Act I** content is needed for
launch.

### Act I — The Discovery (Year 0 / now)

The Summoner finds the Page and realizes the bestiary is the world. Realms
open progressively as the player explores. No single antagonist yet — the
conflict is *learning the realms exist*.

**Player experience:**
- Onboarding (file 07) is *the Page choosing them*
- First pull is a creature from a realm that matches their first habit
- Whisper Feed lines come from realm-aligned monsters as they're earned
- Compendium "complete this realm" milestones reward Crystals + Tome Shards

**Length:** Player's first 90 days.

### Act II — The Convergence (Year 1 events)

Realms start *bleeding into each other*. Cross-realm hybrids appear in
limited-time pulls. Seasonal events represent two realms clashing (Chaos
raids Vaults, Blighted Expanse weeps over Wild Frontier).

**Player experience:**
- Quarterly seasonal banners — each features 2 realms in dialogue
- "Convergence" event quests (every 6 weeks) — rare cross-realm bosses
- Codex starts revealing why the bleeding is happening

**Length:** Months 4–18.

### Act III — The Re-Inking (Year 2+ endgame)

The Page is being rewritten. **Myth Eternal** is fading — the original
creatures begin to forget themselves. If the original realm is lost, every
other realm loses its anchor. The Summoner must use what they've collected
(all habits maintained, all realms substantially completed) to *re-ink* the
Page.

**Player experience:**
- A Tower of 100 floors (Niflheimr / Chaos Tower) is revealed as the spine of
  the Page binding itself together
- The Wailing Wall at floor 50 represents the moment the Page first cracked
- The Apex at floor 100 is the act of re-inking
- Trial of Echoes (permadeath) is the act of *teaching* a monster a new way
  of being so it can stand at the Apex

**Length:** Months 18+. Ongoing endgame content.

---

## How monster art uses this

Each generation request now includes a **realm style fragment** injected into
the locked prompt from file 10. The fragment is the realm's visual motifs +
palette + voice + sample creature description, formatted for image-gen.

Example: a Gemini call for a new Chaos Wastes legendary uses this addendum:

```
[REALM CONTEXT — CHAOS WASTES]
Palette: charred earth #1a0808 base, fire orange #c44e2a accent, dried blood
#732424 glow, ember air #2a0e08 atmosphere.

Visual motifs to incorporate: bone armor, ritual scarification, jagged
volcanic rock, chains and brands, double-bladed weapons, banners of stretched
hide. Aesthetic: nothing finely crafted — everything hammered, broken,
re-forged.

Voice / stance: clipped, defiant. Pose suggests violence held just short
of release.

This monster lives in the Chaos Wastes. It must visually belong to the
same realm as: Wandering Fleshhound, Dragon Chosen of Chaos, Berserker
Sovereign, Magma Tyrant. If you wouldn't put this creature in a war-band
beside them, regenerate.
```

This is the discipline that makes the Compendium grid feel like a real world.
12 realms × ~12-13 monsters each = 150 monsters that *belong to families*.

---

## Tasks for agent

1. Read this entire file. Confirm the 12 realms align with the database
   (`grep -A 20 "insert into public.realms"` in supabase/migrations).
2. Update each realm's `description` column in the DB to be the realm
   tagline + first paragraph of lore. Create a small migration:
   `supabase/migrations/<timestamp>_realm_lore.sql` with `UPDATE realms SET
   description = '...' WHERE name = '...';` for each.
3. Update `prompts/MONSTER_ART_PROMPT.md` to include a `[REALM CONTEXT]`
   placeholder slot, and update `scripts/regen_monsters.mjs` to look up the
   monster's realm and inject the matching realm fragment from this file.
4. Audit existing monsters in DB: do any have a `realm_id` that doesn't
   match their `origin`? Use the origin→realm table to fix them. Write a
   small SQL update.
5. Add per-realm color CSS variables to `src/styles.css` (the 12 palettes
   above). Use them in the Compendium grid: a thin colored border per
   monster card matching its realm. Suddenly the grid reads as families.
6. Add realm tagline + lore to the Compendium realm-filter pill (when a
   realm is selected, show the tagline + 1 paragraph above the grid).
7. Wire realm-themed whispers: when a player completes a habit tagged with
   a stat that aligns to a realm, occasionally a creature from that realm
   whispers in the realm's voice. (Use `realm.voice` text fragments above.)

## Out of scope

- Don't generate Act II / III storyline content yet. They're for later
  seasons.
- Don't re-element existing monsters. Their element field stays;
  realm + origin are the alignment.
- Don't add a 13th realm. Twelve is symbolic (one per month, one per
  task-stat × 3 modes). Resist scope creep.
- Don't translate realm voices to other languages yet. English first.
