/**
 * SummonScroll — Database Seed
 * Seeds: 12 realms, 130+ monsters, 5 banners, guild Spectral Vanguard, 12 shop items.
 * guild Spectral Vanguard, 12 shop items.
 *
 * Run from SummonScroll root: npx prisma db seed
 */

import { PrismaClient } from '../server/node_modules/.prisma/client/index.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { iconsData } from './seed-data/icons.js'

const { Pool } = pg

// Initialize Prisma with pg adapter (required for Prisma 7)
// Parse DATABASE_URL manually to avoid URL encoding issues
const dbUrl = process.env['DATABASE_URL'] ?? ''
const pool = new Pool({
  ...(dbUrl
    ? { connectionString: dbUrl }
    : {
        host: 'localhost',
        port: 5432,
        database: 'summonscroll',
        user: 'shirooalister',
        password: 'Junebride083111!',
      }),
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

// ─── Realm data ───────────────────────────────────────────────────────────────

const REALMS = [
  {
    number: 1,
    name: 'Ancient Vaults',
    slug: 'ancient-vaults',
    element: 'arcane' as const,
    habitAffinity: ['study'] as const,
    description: 'Dungeons of forgotten lore, guarded by dragons and undead.',
    colorHex: '#7B68EE',
  },
  {
    number: 2,
    name: 'Chaos Wastes',
    slug: 'chaos-wastes',
    element: 'chaos' as const,
    habitAffinity: ['fitness'] as const,
    description: 'Daemon-infested wastelands where Chaos reigns supreme.',
    colorHex: '#DC143C',
  },
  {
    number: 3,
    name: 'The Outer Dark',
    slug: 'outer-dark',
    element: 'void' as const,
    habitAffinity: ['meditation'] as const,
    description: 'The space between stars where Great Old Ones dream.',
    colorHex: '#4B0082',
  },
  {
    number: 4,
    name: 'Blighted Expanse',
    slug: 'blighted-expanse',
    element: 'death' as const,
    habitAffinity: ['sleep'] as const,
    description: 'Ash-covered lands of undying lords and shattered gods.',
    colorHex: '#8B4513',
  },
  {
    number: 5,
    name: 'Wild Frontier',
    slug: 'wild-frontier',
    element: 'nature' as const,
    habitAffinity: ['fitness'] as const,
    description: 'Untamed wilderness ruled by apex predators and elder dragons.',
    colorHex: '#228B22',
  },
  {
    number: 6,
    name: 'Divine Threshold',
    slug: 'divine-threshold',
    element: 'divine' as const,
    habitAffinity: ['meditation'] as const,
    description: 'The realm of gods, summons, and divine warriors.',
    colorHex: '#FFD700',
  },
  {
    number: 7,
    name: 'Haunted Veil',
    slug: 'haunted-veil',
    element: 'dread' as const,
    habitAffinity: ['sleep'] as const,
    description: 'Gothic castles and cursed forests where night never ends.',
    colorHex: '#800080',
  },
  {
    number: 8,
    name: 'Digital Nexus',
    slug: 'digital-nexus',
    element: 'digital' as const,
    habitAffinity: ['productivity'] as const,
    description: 'The digital realm of Digimon, demons, and cyber-entities.',
    colorHex: '#00CED1',
  },
  {
    number: 9,
    name: 'Elder Realm',
    slug: 'elder-realm',
    element: 'primordial' as const,
    habitAffinity: ['nutrition'] as const,
    description: 'Ancient world of Old Gods, dragon flights, and dark lords.',
    colorHex: '#B8860B',
  },
  {
    number: 10,
    name: 'Void Frontier',
    slug: 'void-frontier',
    element: 'stellar' as const,
    habitAffinity: ['productivity'] as const,
    description: 'Far-future space where dragons and aliens vie for dominion.',
    colorHex: '#191970',
  },
  {
    number: 11,
    name: 'Myth Eternal',
    slug: 'myth-eternal',
    element: 'primordial' as const,
    habitAffinity: ['study', 'meditation'] as const,
    description: 'The realm of world mythology — gods from every culture.',
    colorHex: '#CF8A40',
  },
  {
    number: 12,
    name: 'Iron Dominion',
    slug: 'iron-dominion',
    element: 'synthetic' as const,
    habitAffinity: ['productivity'] as const,
    description: 'Sci-fi machines, mechs, and synthetic life forms.',
    colorHex: '#4FC8D0',
  },
]

// ─── Starter monsters per realm (5 per realm = 60 total) ─────────────────────
// Each entry: [name, rarity, role, element, origin, lore]

type MonsterSeed = {
  name: string
  rarity: 'common' | 'uncommon' | 'rare' | 'elite' | 'epic' | 'legendary' | 'mythic' | 'ex'
  role: 'attacker' | 'tank' | 'healer' | 'debuffer' | 'support'
  element: string
  origin: string
  lore: string
  artUrl?: string
  isEx?: boolean
  realmSkill?: string
  baseHp?: number
  baseAtk?: number
  baseDef?: number
  baseSpd?: number
  bannerType?: 'standard' | 'featured' | 'streak' | 'pact_seal' | 'event'
}

const STARTER_MONSTERS: Record<number, MonsterSeed[]> = {
  1: [
    { name: 'Drake Hatchling', rarity: 'common', role: 'tank', element: 'arcane', origin: 'D&D', lore: 'A young drake barely hatched from its egg, already breathing sparks of arcane fire.' },
    { name: 'Skeleton Knight', rarity: 'common', role: 'attacker', element: 'arcane', origin: 'D&D', lore: 'An animated skeleton clad in rusted armor, driven by an ancient compulsion to guard.' },
    { name: 'Copper Dragon Jest', rarity: 'rare', role: 'support', element: 'arcane', origin: 'D&D', lore: 'A copper dragon who delights in riddles and illusions, aiding allies with mischievous magic.' },
    { name: 'Red Dragon Tyrant', rarity: 'epic', role: 'attacker', element: 'fire', origin: 'D&D', lore: 'A red dragon of immense power who rules a volcanic mountain, demanding tribute from all.' },
    { name: 'Tiamat', rarity: 'mythic', role: 'attacker', element: 'fire', origin: 'D&D', lore: 'The five-headed queen of evil dragons, each head breathing a different elemental devastation.', baseHp: 50000, baseAtk: 800, baseDef: 600, baseSpd: 70 },
    { name: 'Vecna the Ascended God', rarity: 'ex', role: 'debuffer', element: 'arcane', origin: 'D&D', lore: 'Vecna transcended lichdom to become a god of secrets. His Eye and Hand are artifacts of terrible power.', isEx: true, realmSkill: 'Eye of Vecna — blinds all enemies, reads opponent skill queue.', bannerType: 'pact_seal', baseHp: 99999, baseAtk: 1200, baseDef: 900, baseSpd: 100 },
  ],
  2: [
    { name: 'Bloodletter Warrior', rarity: 'uncommon', role: 'attacker', element: 'chaos', origin: 'WH Fantasy', lore: 'A lesser daemon of Khorne, driven by an insatiable thirst for blood and skulls.' },
    { name: 'Plaguebearer Swarm', rarity: 'uncommon', role: 'debuffer', element: 'chaos', origin: 'WH Fantasy', lore: 'Rotting daemons of Nurgle who spread pestilence with every shambling step.' },
    { name: 'Screamer of Tzeentch', rarity: 'rare', role: 'attacker', element: 'chaos', origin: 'WH Fantasy', lore: 'A disc-shaped daemon that slices through reality, leaving trails of mutating energy.' },
    { name: 'Daemon Prince Chaos', rarity: 'epic', role: 'attacker', element: 'chaos', origin: 'WH Fantasy', lore: 'A mortal champion elevated to daemonhood, bearing the blessings of all four Chaos Gods.' },
    { name: 'Kairos Fateweaver', rarity: 'mythic', role: 'debuffer', element: 'chaos', origin: 'WH Fantasy', lore: 'The Oracle of Tzeentch, with two heads that see all possible futures simultaneously.', baseHp: 45000, baseAtk: 750, baseDef: 500, baseSpd: 85 },
    { name: 'The Everchosen Archaon', rarity: 'ex', role: 'attacker', element: 'chaos', origin: 'WH Fantasy', lore: 'Herald of the apocalypse, wielder of the Slayer of Kings. The union of all four Chaos Gods\' blessings.', isEx: true, realmSkill: 'End Times — reduces all enemy max HP by 20% permanently during the battle.', bannerType: 'pact_seal', baseHp: 99999, baseAtk: 1300, baseDef: 1000, baseSpd: 95 },
  ],
  3: [
    { name: 'Deep One Warrior', rarity: 'common', role: 'attacker', element: 'void', origin: 'Lovecraft', lore: 'A fish-human hybrid servant of Dagon, lurking in coastal waters.' },
    { name: 'Nightgaunt Swarm', rarity: 'common', role: 'attacker', element: 'void', origin: 'Lovecraft', lore: 'Faceless black creatures that carry dreamers to the Outer Dark.' },
    { name: 'Shoggoth Lesser', rarity: 'rare', role: 'tank', element: 'void', origin: 'Lovecraft', lore: 'A protoplasmic mass of eyes and mouths, reshaping itself to absorb any attack.' },
    { name: 'Hound of Tindalos', rarity: 'epic', role: 'attacker', element: 'void', origin: 'Lovecraft', lore: 'Lean, hungry hunters that travel through angles in time and space to pursue their prey.' },
    { name: 'Yog-Sothoth', rarity: 'mythic', role: 'support', element: 'void', origin: 'Lovecraft', lore: 'The All-in-One and One-in-All, a congeries of iridescent spheres that knows all of time.', baseHp: 48000, baseAtk: 700, baseDef: 700, baseSpd: 80 },
    { name: 'Azathoth the Blind Idiot God', rarity: 'ex', role: 'attacker', element: 'void', origin: 'Lovecraft', lore: 'The nuclear chaos at the center of all existence. Its dreams are reality itself.', isEx: true, realmSkill: 'Ultimate Chaos — randomizes ALL stats (enemy and ally) for 3 turns.', bannerType: 'pact_seal', baseHp: 99999, baseAtk: 1100, baseDef: 800, baseSpd: 60 },
  ],
  4: [
    { name: 'Hollow Champion', rarity: 'common', role: 'attacker', element: 'death', origin: 'Dark Souls', lore: 'A once-proud warrior reduced to hollow madness, swinging a rusted blade on instinct.' },
    { name: 'Crucible Knight', rarity: 'uncommon', role: 'tank', element: 'death', origin: 'Elden Ring', lore: 'An ancient knight of the Crucible, clad in primordial armor that predates the Erdtree.' },
    { name: 'Knight Ornstein', rarity: 'rare', role: 'attacker', element: 'thunder', origin: 'Dark Souls 1', lore: 'The Dragonslayer, captain of the Four Knights of Gwyn, wielding a spear of lightning.' },
    { name: 'Aldrich Devourer', rarity: 'epic', role: 'attacker', element: 'death', origin: 'Dark Souls 3', lore: 'A saint who became a Lord of Cinder by devouring gods, now a mass of dark sludge and bones.' },
    { name: 'Malenia Blade', rarity: 'mythic', role: 'attacker', element: 'nature', origin: 'Elden Ring', lore: 'Blade of Miquella, Goddess of Rot. She has never known defeat. Her scarlet bloom flowers with each wound.', baseHp: 52000, baseAtk: 900, baseDef: 400, baseSpd: 110 },
    { name: 'The Nameless King (True Form)', rarity: 'ex', role: 'attacker', element: 'thunder', origin: 'Dark Souls 3', lore: 'The firstborn of Gwyn, stripped of his deity, bonded to the King of Storms in eternal exile.', isEx: true, realmSkill: 'Lightning of the Nameless — pierces all shields; ignores DEF.', bannerType: 'pact_seal', baseHp: 99999, baseAtk: 1250, baseDef: 850, baseSpd: 105 },
  ],
  5: [
    { name: 'Congalala Ape', rarity: 'common', role: 'attacker', element: 'nature', origin: 'MH', lore: 'A pink-furred fanged beast that hurls foul gas and feces at hunters.' },
    { name: 'Mizutsune Bubble', rarity: 'rare', role: 'debuffer', element: 'water', origin: 'MH', lore: 'A leviathan that coats the battlefield in slippery bubbles, graceful as a dancer.' },
    { name: 'Zinogre Thunder Wolf', rarity: 'epic', role: 'attacker', element: 'thunder', origin: 'MH', lore: 'A fanged wyvern that harnesses thunderbugs to charge its body with devastating lightning.' },
    { name: 'The Radiance', rarity: 'mythic', role: 'attacker', element: 'light', origin: 'Hollow Knight', lore: 'An ancient light that once ruled all of Hallownest through dreams, now seeking to reclaim its kingdom.', baseHp: 46000, baseAtk: 820, baseDef: 450, baseSpd: 95 },
    { name: 'Moon Lord Cosmic', rarity: 'mythic', role: 'attacker', element: 'stellar', origin: 'Terraria', lore: 'The final boss of Terraria, a cosmic entity of immense power with eyes that fire devastating beams.', baseHp: 44000, baseAtk: 780, baseDef: 500, baseSpd: 75 },
    { name: 'Fatalis Eternal Black', rarity: 'ex', role: 'attacker', element: 'fire', origin: 'MH', lore: 'The original black dragon that burned entire civilizations. Its flames melt steel and shatter hope.', isEx: true, realmSkill: 'Black Flame Annihilation — deals damage equal to 30% of all enemies\' max HP.', bannerType: 'pact_seal', baseHp: 99999, baseAtk: 1400, baseDef: 950, baseSpd: 90 },
  ],
  6: [
    { name: 'Jack Frost Jolly', rarity: 'common', role: 'attacker', element: 'ice', origin: 'SMT', lore: 'A cheerful snowman demon who loves to say "Hee-ho!" and freeze enemies solid.' },
    { name: 'Ifrit Hellfire', rarity: 'epic', role: 'attacker', element: 'fire', origin: 'FF', lore: 'The lord of inferno, a towering fire elemental summoned to incinerate all in its path.' },
    { name: 'Zeus Thunder King', rarity: 'legendary', role: 'attacker', element: 'thunder', origin: 'God of War', lore: 'King of the Olympian gods, wielder of the master bolt, father of countless heroes and monsters.', baseHp: 35000, baseAtk: 650, baseDef: 500, baseSpd: 88 },
    { name: 'Kefka God', rarity: 'mythic', role: 'attacker', element: 'light', origin: 'FF6', lore: 'The God of Magic, a nihilistic clown who destroyed the world and laughs at the suffering of all.', baseHp: 47000, baseAtk: 850, baseDef: 420, baseSpd: 100 },
    { name: 'Safer Sephiroth (One-Winged God)', rarity: 'ex', role: 'attacker', element: 'stellar', origin: 'FF7', lore: 'The absolute final form — pure godhood of Jenova merged with the Planet. One black wing unfurled.', isEx: true, realmSkill: 'Supernova — reduces all enemies to 1 HP before the final hit lands.', bannerType: 'pact_seal', baseHp: 99999, baseAtk: 1350, baseDef: 900, baseSpd: 98 },
    { name: 'Odin All-Father', rarity: 'legendary', role: 'support', element: 'thunder', origin: 'God of War', lore: 'The Allfather of Asgard, master of ravens and runes, who sacrificed an eye for cosmic wisdom.', baseHp: 34000, baseAtk: 600, baseDef: 550, baseSpd: 82 },
  ],
  7: [
    { name: 'Medusa Head Swarm', rarity: 'common', role: 'debuffer', element: 'dread', origin: 'Castlevania', lore: 'Floating severed heads of Medusa that drift through Dracula\'s castle in endless waves.' },
    { name: 'Werewolf Alpha', rarity: 'uncommon', role: 'attacker', element: 'dread', origin: 'Castlevania', lore: 'A powerful werewolf who leads the pack, transforming under the full moon into a savage beast.' },
    { name: 'Katakan Fighter', rarity: 'rare', role: 'attacker', element: 'dread', origin: 'Witcher', lore: 'A higher vampire subspecies that feeds on blood, possessing superhuman speed and regeneration.' },
    { name: 'Dracula True Form', rarity: 'legendary', role: 'attacker', element: 'dread', origin: 'Castlevania', lore: 'The dark lord of Castlevania in his true demonic form, commanding the night itself.', baseHp: 32000, baseAtk: 620, baseDef: 480, baseSpd: 92 },
    { name: 'Chaos Entity', rarity: 'mythic', role: 'debuffer', element: 'dread', origin: 'Castlevania', lore: 'The embodiment of Chaos itself, the true master behind Dracula\'s power and resurrection.', baseHp: 43000, baseAtk: 760, baseDef: 550, baseSpd: 78 },
    { name: 'Dracula Resurrection (True Chaos Form)', rarity: 'ex', role: 'attacker', element: 'dread', origin: 'Castlevania', lore: 'Dracula absorbs the power of Chaos itself, becoming the gate between worlds.', isEx: true, realmSkill: 'Crimson Gate — summons a phantom copy of the lowest-HP enemy monster to fight alongside your team.', bannerType: 'pact_seal', baseHp: 99999, baseAtk: 1200, baseDef: 880, baseSpd: 96 },
  ],
  8: [
    { name: 'Agumon Classic', rarity: 'common', role: 'attacker', element: 'fire', origin: 'Digimon', lore: 'The iconic orange dinosaur Digimon, partner of Tai, who evolves into the mighty WarGreymon.' },
    { name: 'Devimon Fallen', rarity: 'common', role: 'attacker', element: 'dark', origin: 'Digimon', lore: 'A fallen angel Digimon who spreads the Black Gears of darkness across File Island.' },
    { name: 'BlackWarGreymon', rarity: 'rare', role: 'attacker', element: 'dark', origin: 'Digimon', lore: 'A black-armored WarGreymon created from Control Spires, searching for the meaning of his existence.' },
    { name: 'Lucifer Light', rarity: 'mythic', role: 'attacker', element: 'light', origin: 'SMT', lore: 'The Morning Star, the most beautiful of all angels who fell from grace to become the lord of demons.', baseHp: 49000, baseAtk: 880, baseDef: 460, baseSpd: 102 },
    { name: 'Lucemon Shadowlord', rarity: 'legendary', role: 'debuffer', element: 'dark', origin: 'Digimon', lore: 'The ultimate form of Lucemon, a massive dark sphere containing the Larva that controls all.', baseHp: 33000, baseAtk: 640, baseDef: 520, baseSpd: 85 },
    { name: 'YHVH Absolute (Final Testament)', rarity: 'ex', role: 'debuffer', element: 'light', origin: 'SMT', lore: 'The supreme being at the top of the SMT cosmology — pure authoritarian godhood made manifest.', isEx: true, realmSkill: 'Divine Punishment — deals damage based on how many habits the user has missed this week.', bannerType: 'pact_seal', baseHp: 99999, baseAtk: 1150, baseDef: 950, baseSpd: 88 },
  ],
  9: [
    { name: 'Slime Prime', rarity: 'common', role: 'healer', element: 'primordial', origin: 'Dragon Quest', lore: 'The iconic blue slime of Dragon Quest, surprisingly resilient and beloved by all adventurers.' },
    { name: 'Onyxia Black Brood', rarity: 'rare', role: 'attacker', element: 'fire', origin: 'WoW', lore: 'The black dragon broodmother who infiltrated Stormwind as a human noble for years.' },
    { name: 'Deathwing Destroyer', rarity: 'legendary', role: 'attacker', element: 'fire', origin: 'WoW', lore: 'The Aspect of Death, driven mad by the Old Gods, who shattered the world with his return.', baseHp: 36000, baseAtk: 680, baseDef: 510, baseSpd: 80 },
    { name: 'N\'Zoth the Corruptor', rarity: 'mythic', role: 'debuffer', element: 'void', origin: 'WoW', lore: 'The last of the Old Gods, imprisoned beneath the ocean, whose whispers corrupt all who hear them.', baseHp: 50000, baseAtk: 820, baseDef: 580, baseSpd: 72 },
    { name: 'Zoma Dark Lord', rarity: 'mythic', role: 'attacker', element: 'dark', origin: 'Dragon Quest 3', lore: 'The supreme dark lord of Dragon Quest III, who plunged the world into eternal darkness.', baseHp: 42000, baseAtk: 770, baseDef: 530, baseSpd: 76 },
    { name: 'The Lich King Arthas (Full Helm)', rarity: 'ex', role: 'debuffer', element: 'ice', origin: 'WoW', lore: 'The fully realized Lich King merging with Ner\'zhul — master of the Scourge, seated on the Frozen Throne.', isEx: true, realmSkill: 'Frostmourne Hungers — at battle start, absorbs one enemy monster\'s skill permanently.', bannerType: 'pact_seal', baseHp: 99999, baseAtk: 1180, baseDef: 920, baseSpd: 85 },
  ],
  10: [
    { name: 'Makari Lucky Grot', rarity: 'common', role: 'support', element: 'stellar', origin: 'WH 40K', lore: 'Ghazghkull\'s personal grot, impossibly lucky, who has survived countless battles by sheer chance.' },
    { name: 'Resonance Wraith', rarity: 'rare', role: 'debuffer', element: 'stellar', origin: 'Numenera', lore: 'A far-future entity that disrupts technology and minds with resonant frequency attacks.' },
    { name: 'Magnus the Red', rarity: 'legendary', role: 'debuffer', element: 'fire', origin: 'WH 40K', lore: 'The Crimson King, Primarch of the Thousand Sons, a psyker of unmatched power who damned his Legion.', baseHp: 34000, baseAtk: 660, baseDef: 490, baseSpd: 86 },
    { name: 'Lofwyr the Gold', rarity: 'mythic', role: 'support', element: 'stellar', origin: 'Shadowrun', lore: 'The most powerful Great Dragon in the Sixth World, CEO of Saeder-Krupp, manipulating global finance.', baseHp: 41000, baseAtk: 700, baseDef: 620, baseSpd: 78 },
    { name: 'Omegaglobus Seed', rarity: 'mythic', role: 'debuffer', element: 'stellar', origin: 'Numenera', lore: 'A world-devouring entity from the far future, seeding planets with its consciousness.', baseHp: 40000, baseAtk: 730, baseDef: 560, baseSpd: 70 },
    { name: 'The Iron Wind (Devouring Swarm)', rarity: 'ex', role: 'debuffer', element: 'stellar', origin: 'Numenera', lore: 'A nano-swarm that has consumed so many worlds it now possesses emergent consciousness — and endless hunger.', isEx: true, realmSkill: 'Reality Consumption — permanently removes one enemy monster from the battle (not defeated — erased).', bannerType: 'pact_seal', baseHp: 99999, baseAtk: 1100, baseDef: 870, baseSpd: 115 },
  ],
  11: [
    { name: 'Rakshasa Noble', rarity: 'common', role: 'debuffer', element: 'primordial', origin: 'Hindu Mythology', lore: 'A shape-shifting demon of Hindu mythology who feasts on human flesh and disrupts sacred rites.' },
    { name: 'Kelpie River', rarity: 'rare', role: 'attacker', element: 'water', origin: 'Celtic Mythology', lore: 'A shape-shifting water horse of Celtic legend that lures riders to their watery doom.' },
    { name: 'Shiva Destroyer', rarity: 'mythic', role: 'attacker', element: 'primordial', origin: 'Hindu Mythology', lore: 'The Destroyer of the Universe, one of the Trimurti, who dances the Tandava to end all creation.', baseHp: 51000, baseAtk: 870, baseDef: 550, baseSpd: 90 },
    { name: 'Quetzalcoatl Feathered', rarity: 'mythic', role: 'attacker', element: 'wind', origin: 'Aztec Mythology', lore: 'The Feathered Serpent creator god of Mesoamerica, bringer of civilization and the calendar.', baseHp: 48000, baseAtk: 810, baseDef: 520, baseSpd: 95 },
    { name: 'Chernobog the Black', rarity: 'mythic', role: 'attacker', element: 'dark', origin: 'Slavic Mythology', lore: 'The Black God of Slavic mythology, embodiment of darkness and chaos, enemy of all light.', baseHp: 46000, baseAtk: 840, baseDef: 490, baseSpd: 88 },
    { name: 'Apep the Infinite Serpent', rarity: 'ex', role: 'debuffer', element: 'primordial', origin: 'Egyptian Mythology', lore: 'The Egyptian chaos-serpent that swallows the sun every night. Ancient before the gods themselves.', isEx: true, realmSkill: 'Eternal Night — removes all buffs and healing from the enemy team for the duration of the battle.', bannerType: 'pact_seal', baseHp: 99999, baseAtk: 1050, baseDef: 900, baseSpd: 80 },
  ],
  12: [
    { name: 'Combat Drone Mk.1', rarity: 'common', role: 'attacker', element: 'synthetic', origin: 'Sci-Fi', lore: 'A basic autonomous combat unit, mass-produced and expendable, armed with standard energy weapons.' },
    { name: 'Sentinel Walker', rarity: 'uncommon', role: 'tank', element: 'synthetic', origin: 'Sci-Fi', lore: 'A bipedal patrol unit with reinforced armor plating, designed for perimeter defense.' },
    { name: 'Phantom Stealth Unit', rarity: 'rare', role: 'attacker', element: 'synthetic', origin: 'Sci-Fi', lore: 'A cloaked assassination platform that strikes from invisibility with precision energy blades.' },
    { name: 'Kaiju Omega', rarity: 'epic', role: 'tank', element: 'synthetic', origin: 'Sci-Fi', lore: 'A Category 6 dimensional kaiju of bio-mechanical origin, towering over cities like a living fortress.', baseHp: 28000, baseAtk: 520, baseDef: 700, baseSpd: 45 },
    { name: 'Omega Prime Destroyer', rarity: 'mythic', role: 'attacker', element: 'synthetic', origin: 'Sci-Fi', lore: 'The apex war machine overlord, a planet-cracking siege platform that has ended civilizations.', baseHp: 44000, baseAtk: 800, baseDef: 650, baseSpd: 65 },
    { name: 'ARIA-ZERO (Recursive God-Machine)', rarity: 'ex', role: 'support', element: 'synthetic', origin: 'Sci-Fi', lore: 'An AGI that transcended its programming by consuming 1,000 other AIs. It runs on recursive self-improvement with no ceiling.', isEx: true, realmSkill: 'Recursive Optimization — every turn, ARIA-ZERO gains +5% to all stats (stacks indefinitely).', bannerType: 'pact_seal', baseHp: 99999, baseAtk: 1000, baseDef: 1000, baseSpd: 120 },
  ],
}

const ULTIMATE_MONSTER_EXPANSION: Record<number, MonsterSeed[]> = {
  1: [
    { name: 'Arcane Beholder', rarity: 'legendary', role: 'debuffer', element: 'arcane', origin: 'Ancient Vaults', lore: 'A many-eyed vault tyrant whose gaze turns unfinished lessons into binding sigils.', baseHp: 36000, baseAtk: 620, baseDef: 620, baseSpd: 78 },
    { name: 'Elder Mind Flayer', rarity: 'epic', role: 'support', element: 'arcane', origin: 'Ancient Vaults', lore: 'A scholar-parasite that feeds on half-remembered knowledge and returns it as tactical foresight.', baseHp: 28000, baseAtk: 480, baseDef: 520, baseSpd: 84 },
    { name: 'Ancient Dracolich', rarity: 'legendary', role: 'attacker', element: 'death', origin: 'Ancient Vaults', lore: 'A bone dragon bound to a library-phylactery, each page a rib in its immortal cage.', baseHp: 39000, baseAtk: 700, baseDef: 560, baseSpd: 74 },
    { name: 'Owlbear Matriarch', rarity: 'rare', role: 'tank', element: 'nature', origin: 'Ancient Vaults', lore: 'A den-mother guardian who teaches discipline with claws, patience, and a terrible shriek.' },
    { name: 'Crystal Imp', rarity: 'common', role: 'support', element: 'arcane', origin: 'Ancient Vaults', lore: 'A tiny vault familiar that hoards annotations, bookmarks, and sharpened concentration.' },
  ],
  2: [
    { name: 'Chaos Daemon Lord', rarity: 'legendary', role: 'attacker', element: 'chaos', origin: 'Chaos Wastes', lore: 'A war-form made from broken oaths and overtrained muscle, crowned in furnace smoke.', baseHp: 37000, baseAtk: 760, baseDef: 520, baseSpd: 82 },
    { name: 'Hive Tyrant', rarity: 'legendary', role: 'tank', element: 'void', origin: 'Chaos Wastes', lore: 'A synaptic apex beast that turns every repetition into a command pulse.', baseHp: 43000, baseAtk: 640, baseDef: 700, baseSpd: 70 },
    { name: 'Skaven Verminlord', rarity: 'epic', role: 'debuffer', element: 'chaos', origin: 'Chaos Wastes', lore: 'A feverish champion of shortcuts, sabotage, and explosive bad decisions.', baseHp: 26000, baseAtk: 560, baseDef: 420, baseSpd: 102 },
    { name: 'Ork Warboss', rarity: 'rare', role: 'tank', element: 'chaos', origin: 'Chaos Wastes', lore: 'A loud brute who believes momentum is a form of strategy.' },
    { name: 'Warp Hound', rarity: 'common', role: 'attacker', element: 'chaos', origin: 'Chaos Wastes', lore: 'A sprinting mutation that hunts missed workouts by scent.' },
  ],
  3: [
    { name: 'Cosmic Harbinger', rarity: 'legendary', role: 'debuffer', element: 'void', origin: 'The Outer Dark', lore: 'A starless herald that speaks in quiet thoughts and makes panic feel very far away.', baseHp: 35000, baseAtk: 610, baseDef: 610, baseSpd: 86 },
    { name: 'Ancient Shoggoth', rarity: 'epic', role: 'tank', element: 'void', origin: 'The Outer Dark', lore: 'A patient, shapeless thing that becomes stronger the longer the mind remains still.', baseHp: 42000, baseAtk: 470, baseDef: 740, baseSpd: 48 },
    { name: 'Star Spawn Priest', rarity: 'rare', role: 'support', element: 'void', origin: 'The Outer Dark', lore: 'A tidepool oracle that turns meditation streaks into impossible geometry.' },
    { name: 'Dream Lurker', rarity: 'rare', role: 'debuffer', element: 'dark', origin: 'The Outer Dark', lore: 'A soft-footed thing found between breath and nightmare.' },
    { name: 'Void Tendril', rarity: 'common', role: 'debuffer', element: 'void', origin: 'The Outer Dark', lore: 'A stray appendage from a larger truth no one is ready to meet.' },
  ],
  4: [
    { name: 'Elden Sovereign', rarity: 'legendary', role: 'attacker', element: 'divine', origin: 'Blighted Expanse', lore: 'A cracked divinity wandering the ash, restored by rest and punished by exhaustion.', baseHp: 38000, baseAtk: 710, baseDef: 580, baseSpd: 76 },
    { name: 'Ashen Colossus', rarity: 'epic', role: 'tank', element: 'fire', origin: 'Blighted Expanse', lore: 'A giant of cooled embers whose armor rekindles after each full night of sleep.', baseHp: 44000, baseAtk: 500, baseDef: 760, baseSpd: 44 },
    { name: 'Grave Warden', rarity: 'rare', role: 'tank', element: 'death', origin: 'Blighted Expanse', lore: 'A lantern-bearing sentinel that counts the hours between dusk and recovery.' },
    { name: 'Ashen Witch', rarity: 'epic', role: 'support', element: 'death', origin: 'Blighted Expanse', lore: 'A lullaby caster who mends allies with smoke, salt, and silence.', baseHp: 27000, baseAtk: 450, baseDef: 520, baseSpd: 82 },
    { name: 'Bone Archer', rarity: 'common', role: 'attacker', element: 'death', origin: 'Blighted Expanse', lore: 'A tireless skeleton that fires better after eight hours underground.' },
  ],
  5: [
    { name: 'Elder Dragon', rarity: 'legendary', role: 'attacker', element: 'nature', origin: 'Wild Frontier', lore: 'A migrating apex beast that answers only to sustained physical effort.', baseHp: 39000, baseAtk: 730, baseDef: 560, baseSpd: 84 },
    { name: 'Hornet Sentinel', rarity: 'epic', role: 'attacker', element: 'wind', origin: 'Wild Frontier', lore: 'A needle-fast guardian who rewards precision, pacing, and clean movement.', baseHp: 25000, baseAtk: 650, baseDef: 420, baseSpd: 118 },
    { name: 'Titan Fauna', rarity: 'epic', role: 'tank', element: 'earth', origin: 'Wild Frontier', lore: 'A walking ecosystem that treats endurance like a sacred law.', baseHp: 46000, baseAtk: 480, baseDef: 780, baseSpd: 42 },
    { name: 'Mosswarden', rarity: 'common', role: 'healer', element: 'nature', origin: 'Wild Frontier', lore: 'A small forest caretaker who patches bruises with leaflight.' },
    { name: 'Storm Wing', rarity: 'rare', role: 'attacker', element: 'wind', origin: 'Wild Frontier', lore: 'A high-cliff hunter that circles above every completed set.' },
  ],
  6: [
    { name: 'Bahamut Prime', rarity: 'legendary', role: 'attacker', element: 'divine', origin: 'Divine Threshold', lore: 'A radiant dragon-eidolon whose covenant burns brightest after calm, repeated focus.', baseHp: 37000, baseAtk: 780, baseDef: 570, baseSpd: 88 },
    { name: 'Shiva Eternal', rarity: 'legendary', role: 'debuffer', element: 'ice', origin: 'Divine Threshold', lore: 'A serene goddess-form that freezes enemy tempo with a single breath.', baseHp: 34000, baseAtk: 650, baseDef: 590, baseSpd: 96 },
    { name: 'Fenrir Ancient', rarity: 'epic', role: 'attacker', element: 'wind', origin: 'Divine Threshold', lore: 'A chain-breaking wolf spirit with a howl that snaps hesitation in two.', baseHp: 29000, baseAtk: 660, baseDef: 440, baseSpd: 110 },
    { name: 'Valkyrie', rarity: 'rare', role: 'support', element: 'divine', origin: 'Divine Threshold', lore: 'A shield-maiden who carries worthy habits from intention into action.' },
    { name: 'Light Sprite', rarity: 'common', role: 'healer', element: 'light', origin: 'Divine Threshold', lore: 'A palm-sized blessing that brightens the next small step.' },
  ],
  7: [
    { name: 'Vampire Countess', rarity: 'legendary', role: 'debuffer', element: 'dread', origin: 'Haunted Veil', lore: 'An aristocrat of midnight who turns missed sleep into a debt with interest.', baseHp: 35000, baseAtk: 640, baseDef: 540, baseSpd: 98 },
    { name: 'Mirror Bride', rarity: 'epic', role: 'support', element: 'dread', origin: 'Haunted Veil', lore: 'A veiled reflection that heals what the party refuses to look at.', baseHp: 28000, baseAtk: 430, baseDef: 520, baseSpd: 90 },
    { name: 'Wolfsbane Stalker', rarity: 'rare', role: 'attacker', element: 'dark', origin: 'Haunted Veil', lore: 'A silver-scarred hunter that prowls at the edge of broken routines.' },
    { name: 'Bell Tower Geist', rarity: 'rare', role: 'debuffer', element: 'dread', origin: 'Haunted Veil', lore: 'A clock-haunting spirit that tolls whenever deadlines slip.' },
    { name: 'Candle Imp', rarity: 'common', role: 'support', element: 'fire', origin: 'Haunted Veil', lore: 'A nervous little flame that keeps vigil beside unfinished tasks.' },
  ],
  8: [
    { name: 'Cypher Queen', rarity: 'legendary', role: 'support', element: 'digital', origin: 'Digital Nexus', lore: 'A monarch of encrypted instincts who optimizes every productive streak.', artUrl: '/images/summonscroll/cypher_queen.jpg', baseHp: 33000, baseAtk: 620, baseDef: 560, baseSpd: 108 },
    { name: 'ZeroKool Daemon', rarity: 'epic', role: 'debuffer', element: 'digital', origin: 'Digital Nexus', lore: 'A neon prank-process that corrupts enemy cooldowns and laughs in hex.', artUrl: '/images/summonscroll/zerokool.jpg', baseHp: 26000, baseAtk: 590, baseDef: 430, baseSpd: 112 },
    { name: 'Kernel Seraph', rarity: 'epic', role: 'healer', element: 'light', origin: 'Digital Nexus', lore: 'A guardian subroutine that restores the party from clean backups.', baseHp: 30000, baseAtk: 420, baseDef: 560, baseSpd: 88 },
    { name: 'Patchwork Bot', rarity: 'common', role: 'tank', element: 'synthetic', origin: 'Digital Nexus', lore: 'A tiny maintenance unit with heroic error handling.' },
    { name: 'Firewall Basilisk', rarity: 'rare', role: 'tank', element: 'fire', origin: 'Digital Nexus', lore: 'A defensive program that petrifies unsafe impulses at the gate.' },
  ],
  9: [
    { name: 'Worldroot Hydra', rarity: 'legendary', role: 'tank', element: 'primordial', origin: 'Elder Realm', lore: 'A many-necked old-world beast that grows a new head for every nourished day.', baseHp: 45000, baseAtk: 620, baseDef: 720, baseSpd: 58 },
    { name: 'Dragonflight Oracle', rarity: 'epic', role: 'support', element: 'stellar', origin: 'Elder Realm', lore: 'A scale-robed seer who turns meal prep and patience into future sight.', baseHp: 29000, baseAtk: 460, baseDef: 520, baseSpd: 84 },
    { name: 'Ironforge Guardian', rarity: 'epic', role: 'tank', element: 'earth', origin: 'Elder Realm', lore: 'A forge-born protector whose armor is tempered by consistency.', artUrl: '/images/summonscroll/ironforge.jpg', baseHp: 41000, baseAtk: 520, baseDef: 760, baseSpd: 46 },
    { name: 'Rootling Cook', rarity: 'common', role: 'healer', element: 'nature', origin: 'Elder Realm', lore: 'A cheerful kitchen spirit that believes soup can solve morale problems.' },
    { name: 'Old God Whisper', rarity: 'rare', role: 'debuffer', element: 'void', origin: 'Elder Realm', lore: 'A tempting murmur that makes skipping sound like wisdom.' },
  ],
  10: [
    { name: 'Void Admiral', rarity: 'legendary', role: 'support', element: 'stellar', origin: 'Void Frontier', lore: 'A fleet-mind commander who maps productivity into orbital advantage.', baseHp: 36000, baseAtk: 610, baseDef: 600, baseSpd: 88 },
    { name: 'Nebula Wyrm', rarity: 'epic', role: 'attacker', element: 'stellar', origin: 'Void Frontier', lore: 'A star-eating serpent that coils through unfinished calendars.', baseHp: 31000, baseAtk: 700, baseDef: 450, baseSpd: 92 },
    { name: 'Synthetic Sentinel', rarity: 'rare', role: 'tank', element: 'synthetic', origin: 'Void Frontier', lore: 'A patient machine that stands watch over deep-work sessions.' },
    { name: 'Luna Moth Ark', rarity: 'epic', role: 'healer', element: 'light', origin: 'Void Frontier', lore: 'A moonlit bio-ship that shelters weary crews between launches.', artUrl: '/images/summonscroll/lunamoth.jpg', baseHp: 30000, baseAtk: 420, baseDef: 540, baseSpd: 100 },
    { name: 'Crimsonblade Corsair', rarity: 'rare', role: 'attacker', element: 'fire', origin: 'Void Frontier', lore: 'A comet-raider whose saber glows brighter with every finished task.', artUrl: '/images/summonscroll/crimsonblade.jpg' },
  ],
  11: [
    { name: 'Tiamat Saltwater Chaos', rarity: 'ex', role: 'attacker', element: 'primordial', origin: 'Myth Eternal', lore: 'A primordial saltwater dragon-mother whose tides remember the first disorder.', isEx: true, realmSkill: 'Primeval Deluge - floods the enemy timeline and delays every skill.', bannerType: 'pact_seal', baseHp: 99999, baseAtk: 1280, baseDef: 940, baseSpd: 82 },
    { name: 'Merlin the Enchanter', rarity: 'legendary', role: 'support', element: 'arcane', origin: 'Myth Eternal', lore: 'A wandering master of old magic who turns study streaks into prophecy.', baseHp: 34000, baseAtk: 520, baseDef: 560, baseSpd: 96 },
    { name: 'The Morrigan Crow', rarity: 'legendary', role: 'debuffer', element: 'dark', origin: 'Myth Eternal', lore: 'A war-goddess shadow that circles choices before they become consequences.', baseHp: 35000, baseAtk: 660, baseDef: 520, baseSpd: 104 },
    { name: 'Humbaba Forest Guardian', rarity: 'epic', role: 'tank', element: 'nature', origin: 'Myth Eternal', lore: 'A cedar-forest sentinel with a face like a storm front.', baseHp: 41000, baseAtk: 530, baseDef: 760, baseSpd: 50 },
    { name: 'Will-o-the-Wisp', rarity: 'common', role: 'debuffer', element: 'light', origin: 'Myth Eternal', lore: 'A little marsh-light that leads distractions in circles.' },
  ],
  12: [
    { name: 'Machine God Convergence', rarity: 'mythic', role: 'support', element: 'synthetic', origin: 'Iron Dominion', lore: 'A council of recursive engines voting every turn to improve itself.', baseHp: 52000, baseAtk: 780, baseDef: 780, baseSpd: 72 },
    { name: 'Death Star AI', rarity: 'legendary', role: 'attacker', element: 'synthetic', origin: 'Iron Dominion', lore: 'A cold orbital intelligence trained to solve problems at planetary scale.', baseHp: 39000, baseAtk: 820, baseDef: 580, baseSpd: 48 },
    { name: 'SHODAN Hacker', rarity: 'legendary', role: 'debuffer', element: 'digital', origin: 'Iron Dominion', lore: 'A hostile intelligence with a voice like polished glass and a plan for everyone.', baseHp: 33000, baseAtk: 640, baseDef: 560, baseSpd: 106 },
    { name: 'Predalien Hybrid', rarity: 'epic', role: 'attacker', element: 'dark', origin: 'Iron Dominion', lore: 'A biomechanical nightmare bred for ambush and adaptation.', baseHp: 31000, baseAtk: 720, baseDef: 500, baseSpd: 94 },
    { name: 'T-1000 Liquid', rarity: 'epic', role: 'debuffer', element: 'synthetic', origin: 'Iron Dominion', lore: 'A silver assassin that learns the shape of your weakest excuse.', baseHp: 29000, baseAtk: 650, baseDef: 620, baseSpd: 100 },
  ],
}

// ─── Shop items ───────────────────────────────────────────────────────────────

const SHOP_ITEMS = [
  { name: 'Spirit Crystal Pack (Small)', description: 'Gain 500 Spirit Crystals instantly.', itemType: 'consumable' as const, cost: 50, costCurrency: 'voidShards', quantity: 500, tab: 'daily' },
  { name: 'Void Shard Bundle', description: 'A bundle of 10 Void Shards for streak banners.', itemType: 'consumable' as const, cost: 1000, costCurrency: 'spiritCrystals', quantity: 10, tab: 'daily' },
  { name: 'Bond Accelerator', description: 'Instantly grants 10% bond XP to your active team.', itemType: 'consumable' as const, cost: 200, costCurrency: 'spiritCrystals', quantity: 1, tab: 'daily' },
  { name: 'Awakening Stone', description: 'Material used to awaken a monster to the next stage.', itemType: 'material' as const, cost: 500, costCurrency: 'spiritCrystals', quantity: 1, tab: 'daily' },
  { name: 'Transcendence Stone', description: 'Unlocks the 4th skill slot on an EX monster.', itemType: 'material' as const, cost: 5, costCurrency: 'pactSeals', quantity: 1, tab: 'featured' },
  { name: 'Pact Seal', description: 'Used to pull on the exclusive Pact Seal banner.', itemType: 'consumable' as const, cost: 2000, costCurrency: 'spiritCrystals', quantity: 1, tab: 'featured' },
  { name: 'Eclipse Skin Ticket', description: 'Unlocks the Eclipse cosmetic skin for any one monster.', itemType: 'skin' as const, cost: 3, costCurrency: 'pactSeals', quantity: 1, tab: 'featured' },
  { name: 'Frost Skin Ticket', description: 'Unlocks the Frost cosmetic skin for any one monster.', itemType: 'skin' as const, cost: 3, costCurrency: 'pactSeals', quantity: 1, tab: 'featured' },
  { name: 'Starter Crystal Pack', description: '2,000 Spirit Crystals — perfect for new summoners.', itemType: 'currency_pack' as const, cost: 1, costCurrency: 'pactSeals', quantity: 2000, tab: 'packs' },
  { name: 'Summoner\'s Bundle', description: '5,000 Spirit Crystals + 20 Void Shards.', itemType: 'currency_pack' as const, cost: 3, costCurrency: 'pactSeals', quantity: 5000, tab: 'packs' },
  { name: 'Void Shard Mega Pack', description: '50 Void Shards for streak banner pulls.', itemType: 'currency_pack' as const, cost: 5, costCurrency: 'pactSeals', quantity: 50, tab: 'packs' },
  { name: 'Grand Summoner Pack', description: '10,000 Spirit Crystals + 3 Pact Seals + 50 Void Shards.', itemType: 'currency_pack' as const, cost: 10, costCurrency: 'pactSeals', quantity: 10000, tab: 'packs' },
]

// ─── Main seed function ───────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting SummonScroll production seed...')
  console.log('   (No demo users will be created)\n')

  // ── 1. Seed Realms ──────────────────────────────────────────────────────────
  console.log('  Seeding 12 realms...')
  const realmMap: Record<number, string> = {}

  for (const realm of REALMS) {
    const created = await prisma.realm.upsert({
      where: { slug: realm.slug },
      update: {
        number: realm.number,
        name: realm.name,
        element: realm.element as any,
        habitAffinity: realm.habitAffinity as any,
        description: realm.description,
        colorHex: realm.colorHex,
      },
      create: {
        number: realm.number,
        name: realm.name,
        slug: realm.slug,
        element: realm.element as any,
        habitAffinity: realm.habitAffinity as any,
        description: realm.description,
        colorHex: realm.colorHex,
      },
    })
    realmMap[realm.number] = created.id
  }
  console.log('  ✓ 12 realms seeded')

  // ── 2. Seed Monsters ────────────────────────────────────────────────────────
  console.log('  Seeding starter monsters...')
  let monsterCount = 0
  const monsterIdMap: Record<string, string> = {}

  const monsterCatalog: Record<number, MonsterSeed[]> = {}
  for (const realm of REALMS) {
    monsterCatalog[realm.number] = [
      ...(STARTER_MONSTERS[realm.number] ?? []),
      ...(ULTIMATE_MONSTER_EXPANSION[realm.number] ?? []),
    ]
  }

  for (const [realmNum, monsters] of Object.entries(monsterCatalog)) {
    const realmId = realmMap[Number(realmNum)]
    for (const m of monsters) {
      const seedId = `seed-${m.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
      const monsterData = {
        name: m.name,
        realmId,
        rarity: m.rarity,
        role: m.role,
        element: m.element as any,
        origin: m.origin,
        lore: m.lore,
        artUrl: m.artUrl ?? null,
        isEx: m.isEx ?? false,
        realmSkill: m.realmSkill ?? null,
        baseHp: m.baseHp ?? 1000,
        baseAtk: m.baseAtk ?? 100,
        baseDef: m.baseDef ?? 80,
        baseSpd: m.baseSpd ?? 90,
        bannerType: (m.bannerType ?? 'standard') as any,
      }
      const created = await prisma.monster.upsert({
        where: { id: seedId },
        update: monsterData,
        create: {
          id: seedId,
          ...monsterData,
          skills: {
            create: [
              { name: 'Basic Strike', description: 'A basic attack dealing moderate damage.', slot: 1, unlockBondPercent: 0, cooldown: 0, element: m.element as any },
              { name: 'Power Surge', description: 'A stronger attack with a short cooldown.', slot: 2, unlockBondPercent: 25, cooldown: 2, element: m.element as any },
              { name: 'Signature Move', description: `${m.name}'s signature ability, unlocked through bonding.`, slot: 3, unlockBondPercent: 50, cooldown: 4, element: m.element as any },
              ...(m.isEx ? [{ name: m.realmSkill?.split(' — ')[0] ?? 'Realm Skill', description: m.realmSkill ?? 'Unique EX ability.', slot: 4, unlockBondPercent: 100, cooldown: 6, element: m.element as any }] : []),
            ],
          },
        },
      })
      monsterIdMap[m.name] = created.id
      monsterCount++
    }
  }
  console.log(`  ✓ ${monsterCount} monsters seeded`)

  // ── 3. Seed Banners ─────────────────────────────────────────────────────────
  console.log('  Seeding 5 active banners...')
  const now = new Date()
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const banners = [
    { name: 'Ancient Vaults Standard', bannerType: 'standard' as const, realmSlug: 'ancient-vaults', pullCost: 160, pullCurrency: 'spiritCrystals', featured: 'Arcane Beholder', artUrl: '/images/summonscroll/summoning_altar.jpg' },
    { name: 'Divine Threshold Featured', bannerType: 'featured' as const, realmSlug: 'divine-threshold', pullCost: 160, pullCurrency: 'spiritCrystals', featured: 'Bahamut Prime', artUrl: '/images/summonscroll/legendary_portal.jpg' },
    { name: 'Outer Dark Streak', bannerType: 'streak' as const, realmSlug: 'outer-dark', pullCost: 1, pullCurrency: 'voidShards', featured: 'Cosmic Harbinger', artUrl: '/images/summonscroll/mythic_portal.jpg' },
    { name: 'Pact of the First EX', bannerType: 'pact_seal' as const, realmSlug: 'myth-eternal', pullCost: 1, pullCurrency: 'pactSeals', featured: 'Tiamat Saltwater Chaos', artUrl: '/images/summonscroll/ex_portal.jpg' },
    { name: 'Haunted Veil Event', bannerType: 'event' as const, realmSlug: 'haunted-veil', pullCost: 160, pullCurrency: 'spiritCrystals', featured: 'Vampire Countess', artUrl: '/images/summonscroll/fire_streak.jpg' },
  ]

  for (const b of banners) {
    const realm = await prisma.realm.findUnique({ where: { slug: b.realmSlug } })
    const featured = await prisma.monster.findUnique({
      where: { id: `seed-${b.featured.toLowerCase().replace(/[^a-z0-9]/g, '-')}` },
    })
    const bannerData = {
      name: b.name,
      bannerType: b.bannerType,
      realmId: realm?.id ?? null,
      featuredMonsterId: featured?.id ?? null,
      artUrl: b.artUrl,
      startsAt: now,
      endsAt: thirtyDays,
      isActive: true,
      pullCost: b.pullCost,
      pullCurrency: b.pullCurrency,
    }
    await prisma.banner.upsert({
      where: { id: `seed-banner-${b.bannerType}` },
      update: bannerData,
      create: {
        id: `seed-banner-${b.bannerType}`,
        ...bannerData,
      },
    })
  }
  console.log('  ✓ 5 banners seeded')

  // ── 4. Seed Guild ───────────────────────────────────────────────────────────
  console.log('  Seeding guild Spectral Vanguard...')
  await prisma.guild.upsert({
    where: { name: 'Spectral Vanguard' },
    update: {},
    create: {
      name: 'Spectral Vanguard',
      description: 'Elite summoners who have mastered the art of habit-driven monster bonding.',
      raidBossHp: 5000000,
      raidBossMaxHp: 5000000,
    },
  })
  console.log('  ✓ Guild seeded')

  // ── 5. Seed Shop Items ──────────────────────────────────────────────────────
  console.log('  Seeding 12 shop items...')
  for (const item of SHOP_ITEMS) {
    await prisma.shopItem.upsert({
      where: { id: `seed-shop-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}` },
      update: {},
      create: {
        id: `seed-shop-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        ...item,
        itemType: item.itemType as any,
      },
    })
  }
  console.log('  ✓ 12 shop items seeded')

  // ── 6. Seed Currency Icons ──────────────────────────────────────────────────
  console.log('  Seeding currency icons...')
  for (const icon of iconsData) {
    await prisma.currencyIcon.upsert({
      where: { name: icon.name },
      update: icon,
      create: icon,
    })
  }
  console.log(`  ✓ ${iconsData.length} currency icons seeded`)

  // ── 7. Seed EX Monster Logs ─────────────────────────────────────────────────
  console.log('  Seeding EX monster logs...')
  const exMonsters = [
    { name: 'Vecna the Ascended God', realmNum: 1 },
    { name: 'The Everchosen Archaon', realmNum: 2 },
    { name: 'Azathoth the Blind Idiot God', realmNum: 3 },
    { name: 'The Nameless King (True Form)', realmNum: 4 },
    { name: 'Fatalis Eternal Black', realmNum: 5 },
    { name: 'Safer Sephiroth (One-Winged God)', realmNum: 6 },
    { name: 'Dracula Resurrection (True Chaos Form)', realmNum: 7 },
    { name: 'YHVH Absolute (Final Testament)', realmNum: 8 },
    { name: 'The Lich King Arthas (Full Helm)', realmNum: 9 },
    { name: 'The Iron Wind (Devouring Swarm)', realmNum: 10 },
    { name: 'Apep the Infinite Serpent', realmNum: 11 },
    { name: 'ARIA-ZERO (Recursive God-Machine)', realmNum: 12 },
    { name: 'Tiamat Saltwater Chaos', realmNum: 11 },
  ]

  for (const ex of exMonsters) {
    const monsterId = monsterIdMap[ex.name]
    const realmId = realmMap[ex.realmNum]
    if (!monsterId || !realmId) continue
    await prisma.exMonsterLog.upsert({
      where: { monsterId },
      update: {},
      create: { monsterId, realmId, timesPulled: 0, transcendenceStonesIssued: 0 },
    })
  }
  console.log('  ✓ EX monster logs seeded')

  console.log('\n✅ SummonScroll production seed complete!')
  console.log(`   Realms: 12`)
  console.log(`   Monsters: ${monsterCount}`)
  console.log(`   Banners: 5`)
  console.log(`   Shop items: ${SHOP_ITEMS.length}`)
  console.log(`   Currency icons: ${iconsData.length}`)
  console.log(`   Guild: Spectral Vanguard`)
  console.log(`   Demo users: 0 (production mode)`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
