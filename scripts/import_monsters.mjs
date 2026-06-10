import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_FILE = 'c:\\Users\\Zyle\\Downloads\\summonscroll_10000_monsters.csv';
const OUTPUT_FILE = path.join(__dirname, '../supabase/migrations/20260608130000_massive_bestiary.sql');

const rarityBase = {
  common: { hp: 100, atk: 30, def: 20, spd: 10 },
  uncommon: { hp: 150, atk: 45, def: 30, spd: 15 },
  rare: { hp: 250, atk: 75, def: 50, spd: 25 },
  elite: { hp: 350, atk: 105, def: 70, spd: 35 },
  epic: { hp: 500, atk: 150, def: 100, spd: 50 },
  legendary: { hp: 800, atk: 240, def: 160, spd: 80 },
  mythic: { hp: 1200, atk: 360, def: 240, spd: 120 },
  ex: { hp: 2000, atk: 600, def: 400, spd: 200 },
};

const roleMods = {
  Attacker: { hp: 0.8, atk: 1.5, def: 0.8, spd: 1.1 },
  Tank: { hp: 1.5, atk: 0.6, def: 1.5, spd: 0.8 },
  Support: { hp: 1.1, atk: 0.8, def: 1.0, spd: 1.3 },
  Debuffer: { hp: 0.9, atk: 0.9, def: 1.0, spd: 1.4 },
  Healer: { hp: 1.2, atk: 0.7, def: 1.1, spd: 1.1 },
};

async function processCSV() {
  const fileStream = fs.createReadStream(CSV_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const writeStream = fs.createWriteStream(OUTPUT_FILE);
  writeStream.write(`-- Massive Bestiary Seeding (10,000 Monsters)\n`);

  let isFirstLine = true;
  let batch = [];
  const BATCH_SIZE = 500;
  let count = 0;

  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }
    
    // Parse CSV line handling potential quotes. Simple split since no complex commas expected.
    // id,name,rarity,role,realm,element
    const parts = line.split(',');
    if (parts.length < 6) continue;
    
    const idStr = parts[0].trim();
    let name = parts[1].trim().replace(/'/g, "''");
    let rarity = parts[2].trim().toLowerCase();
    let role = parts[3].trim();
    let realmName = parts[4].trim().replace(/'/g, "''");
    let element = parts[5].trim().replace(/'/g, "''");

    if (!rarityBase[rarity]) rarity = 'common';
    if (!roleMods[role]) role = 'Attacker';

    const base = rarityBase[rarity];
    const mod = roleMods[role];
    const hp = Math.round(base.hp * mod.hp);
    const atk = Math.round(base.atk * mod.atk);
    const def = Math.round(base.def * mod.def);
    const spd = Math.round(base.spd * mod.spd);

    const bestiaryId = count + 1;
    const releaseSet = Math.floor(count / 100) + 1;
    
    // Every 500th monster is forced to EX tier
    if (bestiaryId % 500 === 0) {
      rarity = 'ex';
    }
    const isEx = (rarity === 'ex') ? 'true' : 'false';

    const sqlVal = `(${bestiaryId}, ${releaseSet}, (SELECT id FROM public.realms WHERE name = '${realmName}' LIMIT 1), '${name}', '${rarity}'::public.monster_rarity, '${role.toLowerCase()}'::public.monster_role, '${element}', ${hp}, ${atk}, ${def}, ${spd}, '${isEx}')`;
    batch.push(sqlVal);
    count++;

    if (batch.length >= BATCH_SIZE) {
      writeStream.write(`INSERT INTO public.monsters (bestiary_id, release_set, realm_id, name, rarity, role, element, base_hp, base_atk, base_def, base_spd, is_ex) VALUES\n`);
      writeStream.write(batch.join(',\n') + ';\n\n');
      batch = [];
    }
  }

  if (batch.length > 0) {
    writeStream.write(`INSERT INTO public.monsters (bestiary_id, release_set, realm_id, name, rarity, role, element, base_hp, base_atk, base_def, base_spd, is_ex) VALUES\n`);
    writeStream.write(batch.join(',\n') + ';\n\n');
  }

  writeStream.end();
  console.log(`Successfully generated SQL for ${count} monsters!`);
}

processCSV().catch(console.error);
