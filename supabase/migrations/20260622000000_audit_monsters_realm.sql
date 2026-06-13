-- Migration to align monsters' realm_id with their origin and element
-- Aligned with 13_REALM_WORLDGEN.md origin -> realm mapping

-- 1. Divine Threshold (realm 6) - Angels / Paladins / Temples or Divine element
UPDATE public.monsters SET realm_id = 6 WHERE origin ILIKE '%angel%' OR origin ILIKE '%paladin%' OR origin ILIKE '%temple%' OR origin ILIKE '%christian%' OR origin ILIKE '%jewish%' OR origin ILIKE '%hindu%';
UPDATE public.monsters SET realm_id = 6 WHERE element = 'Divine' AND realm_id != 6;

-- 2. Chaos Wastes (realm 2) - Warhammer Chaos / Barbarians / Fury / Demons or Chaos element
UPDATE public.monsters SET realm_id = 2 WHERE origin ILIKE '%warhammer%' OR origin ILIKE '%barbarian%' OR origin ILIKE '%fury%' OR origin ILIKE '%demon%';
UPDATE public.monsters SET realm_id = 2 WHERE element = 'Chaos' AND realm_id != 2;

-- 3. The Outer Dark (realm 3) - Cthulhu / Lovecraft / Old Ones or Void element
UPDATE public.monsters SET realm_id = 3 WHERE origin ILIKE '%cthulhu%' OR origin ILIKE '%lovecraft%' OR origin ILIKE '%old one%' OR origin ILIKE '%cosmic%';
UPDATE public.monsters SET realm_id = 3 WHERE element = 'Void' AND realm_id != 3;

-- 4. Blighted Expanse (realm 4) - Plague / Undead / Mausoleum or Death element
UPDATE public.monsters SET realm_id = 4 WHERE origin ILIKE '%plague%' OR origin ILIKE '%undead%' OR origin ILIKE '%mausoleum%' OR origin ILIKE '%slavic%';
UPDATE public.monsters SET realm_id = 4 WHERE element = 'Death' AND realm_id != 4;

-- 5. Wild Frontier (realm 5) - Druids / Beasts / Wild or Nature element
UPDATE public.monsters SET realm_id = 5 WHERE origin ILIKE '%druid%' OR origin ILIKE '%beast%' OR origin ILIKE '%wild%' OR origin ILIKE '%celtic%' OR origin ILIKE '%hawaiian%' OR origin ILIKE '%inuit%' OR origin ILIKE '%aboriginal%' OR origin ILIKE '%philippine%' OR origin ILIKE '%guarani%' OR origin ILIKE '%mapuche%' OR origin ILIKE '%muisca%' OR origin ILIKE '%yoruba%' OR origin ILIKE '%polynesian%';
UPDATE public.monsters SET realm_id = 5 WHERE element = 'Nature' AND realm_id != 5;

-- 6. Ancient Vaults (realm 1) - D&D Arcane / Wizards / Liches or Arcane element
UPDATE public.monsters SET realm_id = 1 WHERE origin ILIKE '%d&d%' OR origin ILIKE '%wizard%' OR origin ILIKE '%lich%' OR origin ILIKE '%alchemy%';
UPDATE public.monsters SET realm_id = 1 WHERE element = 'Arcane' AND realm_id != 1;

-- 7. Haunted Veil (realm 7) - Vampires / Ghosts / Gothic or Dread element
UPDATE public.monsters SET realm_id = 7 WHERE origin ILIKE '%vampire%' OR origin ILIKE '%ghost%' OR origin ILIKE '%gothic%' OR origin ILIKE '%dread%' OR origin ILIKE '%voodoo%' OR origin ILIKE '%witch%';
UPDATE public.monsters SET realm_id = 7 WHERE element = 'Dread' AND realm_id != 7;

-- 8. Digital Nexus (realm 8) - Cyber / Digital / Data or Digital element
UPDATE public.monsters SET realm_id = 8 WHERE origin ILIKE '%cyber%' OR origin ILIKE '%digital%' OR origin ILIKE '%data%' OR origin ILIKE '%internet%' OR origin ILIKE '%nexus%' OR origin ILIKE '%daemon%';
UPDATE public.monsters SET realm_id = 8 WHERE element = 'Digital' AND realm_id != 8;

-- 9. Elder Realm (realm 9) - Dragons / Mer / Oceanic or Primal element
UPDATE public.monsters SET realm_id = 9 WHERE origin ILIKE '%dragon%' OR origin ILIKE '%mer%' OR origin ILIKE '%ocean%' OR origin ILIKE '%trench%' OR origin ILIKE '%serpent%' OR origin ILIKE '%crab%';
UPDATE public.monsters SET realm_id = 9 WHERE element = 'Primal' AND realm_id != 9;

-- 10. Void Frontier (realm 10) - Stellar / Astral / Cosmic or Stellar element
UPDATE public.monsters SET realm_id = 10 WHERE origin ILIKE '%stellar%' OR origin ILIKE '%astral%' OR origin ILIKE '%star%' OR origin ILIKE '%nebula%' OR origin ILIKE '%space%' OR origin ILIKE '%comet%';
UPDATE public.monsters SET realm_id = 10 WHERE element = 'Stellar' AND realm_id != 10;

-- 11. Myth Eternal (realm 11) - Mythology / Classical / First or Primordial element
UPDATE public.monsters SET realm_id = 11 WHERE origin ILIKE '%mythology%' OR origin ILIKE '%greek%' OR origin ILIKE '%norse%' OR origin ILIKE '%egyptian%' OR origin ILIKE '%roman%' OR origin ILIKE '%classical%';
UPDATE public.monsters SET realm_id = 11 WHERE element = 'Primordial' AND realm_id != 11;

-- 12. Iron Dominion (realm 12) - Steampunk / Mecha / Automaton or Synthetic element
UPDATE public.monsters SET realm_id = 12 WHERE origin ILIKE '%steampunk%' OR origin ILIKE '%mecha%' OR origin ILIKE '%automaton%' OR origin ILIKE '%synthetic%' OR origin ILIKE '%gear%' OR origin ILIKE '%boiler%';
UPDATE public.monsters SET realm_id = 12 WHERE element = 'Synthetic' AND realm_id != 12;
