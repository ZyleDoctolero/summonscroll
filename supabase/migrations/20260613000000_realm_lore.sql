-- Realm Lore Migration
-- Adds tagline + first paragraph of lore from 13_REALM_WORLDGEN.md to each realm's description

UPDATE public.realms SET description = 'Where knowledge keeps itself. The first realm to seal itself off. When the Page began bleeding, the scholars of the First Library built locks. Now the Vaults are a city-scale ziggurat of stacked libraries, each one accessible only through the riddle of the floor below. Books here are alive — they whisper, conspire, sometimes attack readers who turn pages too quickly.' WHERE name = 'Ancient Vaults';

UPDATE public.realms SET description = 'Where strength is the only law. The first realm to refuse all governance. The Wastes are an endless broken plateau scorched by suns that don''t follow rules — some go backwards, some hang motionless and burn the rock to glass. Tribes of warband-creatures fight not for territory but for the day''s strongest; the title rotates daily.' WHERE name = 'Chaos Wastes';

UPDATE public.realms SET description = 'Where stillness reveals. Not space. The absence between. The Outer Dark is the realm of silences so deep that thoughts emerge from them already finished. Pilgrims sit on small islands of stone drifting in lightless cold, and after a thousand years a single insight surfaces. Creatures here are mostly polite, slow, and have no need to move.' WHERE name = 'The Outer Dark';

UPDATE public.realms SET description = 'Where rest is sacred. Death here is not punishment — it is the world''s rest. The Expanse is a vast, peaceful swamp under a permanent green-grey sky. The dead walk slowly, undriven by hunger. They tend graves. They sing low songs in languages they remember from sleep. The realm understands what living things forget: that resting is a discipline.' WHERE name = 'Blighted Expanse';

UPDATE public.realms SET description = 'Where the body remembers. The unwalled, untamed land. The Frontier extends in all directions and has no maps because they would be wrong by tomorrow. Forests pull up roots and walk; rivers cut new courses overnight; the moon may rise twice. Creatures here are wholly of place — they cannot be summoned to a city without first being asked permission of a tree, a stone, a wind.' WHERE name = 'Wild Frontier';

UPDATE public.realms SET description = 'Where attention is prayer. A staircase of marble that rises above clouds toward a light that keeps being just there. The realm is a single ascending temple complex inhabited by orders of robed beings who measure progress in breath counts. There is no god at the top; the climb itself is the god.' WHERE name = 'Divine Threshold';

UPDATE public.realms SET description = 'Where the night is honest. A gothic country eternal in its dusk. Villages of slate roofs and black-iron gates connected by carriage paths through bramble. The Veil is the home of those who learned that the night reveals what the day hides — fears and griefs and quieter joys. Vampires here are honest about their hunger; ghosts speak plainly about their regrets.' WHERE name = 'Haunted Veil';

UPDATE public.realms SET description = 'Where intention compiles. The youngest realm. A lattice of neon-lit infinite servers, where data has accreted into being. Creatures here are processes given form — search algorithms with claws, encryption guardians, a daemon that loves filing. The Nexus is where new habits get prototyped. It is patient with imperfection because it knows updates are coming.' WHERE name = 'Digital Nexus';

UPDATE public.realms SET description = 'Where the first lives still live. The deep-water world. Beneath everything else there is a sea older than the surface had time to name. Elder Realm is the realm of dragons, serpents, leviathans, and mer-people who never invented war because they had food enough. Creatures here are huge, patient, and old in a way that makes them often kind.' WHERE name = 'Elder Realm';

UPDATE public.realms SET description = 'Where the next horizon is the only horizon. Open sky, no ceiling. The Frontier is the realm of those who chose outward. Starships made of crystal and prayer; astral knights who sleep in constellations. Creatures here are oriented toward the impossible thing ahead. They will follow a Summoner who is aiming high.' WHERE name = 'Void Frontier';

UPDATE public.realms SET description = 'Where the world remembers being born. The first realm. From which all others were copied. Myth Eternal is golden and small — a single dawn-lit field with a road that bends out of sight. Here live the original creatures, who taught the other realms what creatures were. The first dragon. The first wolf. The first king.' WHERE name = 'Myth Eternal';

UPDATE public.realms SET description = 'Where intention becomes leverage. The realm of systems. Iron Dominion is a single endless factory that does not produce goods — it produces processes. Gears that turn for their own sake. Steam pipes that organize themselves. Creatures here are automatons given the smallest sliver of will: the cog-knight, the lathe-pup, the spreadsheet-imp.' WHERE name = 'Iron Dominion';
