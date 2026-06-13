-- ────────────────────────────────────────────────────────────────────────────
-- File 13 task #2: seed realm lore (tagline + first paragraph) into
-- realms.description. Idempotent — safe to re-run.
-- ────────────────────────────────────────────────────────────────────────────

BEGIN;

UPDATE public.realms SET description =
'Where knowledge keeps itself. The first realm to seal itself off. When the Page began bleeding, the scholars of the First Library built locks. Now the Vaults are a city-scale ziggurat of stacked libraries, each accessible only through the riddle of the floor below. Books here are alive — they whisper, conspire, sometimes attack readers who turn pages too quickly. To read is to risk being read.'
WHERE name = 'Ancient Vaults';

UPDATE public.realms SET description =
'Where strength is the only law. The Wastes are an endless broken plateau scorched by suns that do not follow rules. Tribes of warband-creatures fight not for territory but for the day''s strongest; the title rotates daily. Magic here is volcanic — it works only when used with violence. To live in the Wastes is to be sharpened by it.'
WHERE name = 'Chaos Wastes';

UPDATE public.realms SET description =
'Where stillness reveals. Not space — the absence between. The Outer Dark is the realm of silences so deep that thoughts emerge from them already finished. Creatures here are polite, slow, and have no need to move. They cannot be summoned through fury, only through a mind quiet enough to hear them ask to come. The only realm that arrives by invitation.'
WHERE name = 'The Outer Dark';

UPDATE public.realms SET description =
'Where rest is sacred. Death here is not punishment — it is the world''s rest. A vast peaceful swamp under a permanent green-grey sky. The dead walk slowly, undriven by hunger; they tend graves and sing low songs. The realm understands what living things forget: that resting is a discipline, and the dead have mastered it.'
WHERE name = 'Blighted Expanse';

UPDATE public.realms SET description =
'Where the body remembers. The unwalled, untamed land, extending in all directions with no maps because they would be wrong by tomorrow. Forests pull up roots and walk; rivers cut new courses overnight. Creatures here are wholly of place — bodies that learned how to be themselves before they learned anything else. They will protect a Summoner who runs with them.'
WHERE name = 'Wild Frontier';

UPDATE public.realms SET description =
'Where attention is prayer. A staircase of marble that rises above clouds toward a light that keeps being just there. There is no god at the top; the climb itself is the god. Monsters from the Threshold are summoned through stillness and gratitude. They will refuse a Summoner who attempts to skip a step.'
WHERE name = 'Divine Threshold';

UPDATE public.realms SET description =
'Where the night is honest. A gothic country eternal in its dusk, villages of slate roofs and black-iron gates connected by carriage paths through bramble. Here the night reveals what the day hides — fears and griefs and quieter joys. Vampires are honest about their hunger; ghosts speak plainly about their regrets. The realm hates haste.'
WHERE name = 'Haunted Veil';

UPDATE public.realms SET description =
'Where intention compiles. The youngest realm — a lattice of neon-lit infinite servers where data has accreted into being. Creatures here are processes given form: search algorithms with claws, encryption guardians, a daemon that loves filing. The Nexus is patient with imperfection because it knows updates are coming. It responds to novelty.'
WHERE name = 'Digital Nexus';

UPDATE public.realms SET description =
'Where the first lives still live. The deep-water world, a sea older than the surface had time to name. Realm of dragons, serpents, leviathans, and mer-people who never invented war because they had food enough. Creatures here are huge, patient, and old in a way that makes them often kind. They will not be hurried.'
WHERE name = 'Elder Realm';

UPDATE public.realms SET description =
'Where the next horizon is the only horizon. Open sky, no ceiling. The realm of those who chose outward — starships of crystal and prayer, astral knights who sleep in constellations. Creatures here are oriented toward the impossible thing ahead. They will follow a Summoner who is aiming high.'
WHERE name = 'Void Frontier';

UPDATE public.realms SET description =
'Where the world remembers being born. The first realm, from which all others were copied. Golden and small — a single dawn-lit field with a road that bends out of sight. Here live the original creatures who taught the other realms what creatures were. They come only to a Summoner who has been consistent, because only consistency reaches back to the beginning.'
WHERE name = 'Myth Eternal';

UPDATE public.realms SET description =
'Where intention becomes leverage. The realm of systems — a single endless factory that produces not goods but processes. Gears that turn for their own sake; steam pipes that organize themselves. Creatures here are automatons given the smallest sliver of will. They follow a Summoner who finishes things, and grow listless when tasks are left half-done.'
WHERE name = 'Iron Dominion';

COMMIT;
