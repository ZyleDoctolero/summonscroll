import fs from 'fs';
import readline from 'readline';
import path from 'path';

const CSV_FILE = 'c:\\Users\\Zyle\\Downloads\\summonscroll_10000_monsters.csv';
const QUEUE_FILE = 'C:\\Users\\Zyle\\.gemini\\antigravity\\brain\\8f9b32f9-22ec-41ce-b87c-2a7822c24190\\monster_queue_500.json';

async function createQueue() {
  const fileStream = fs.createReadStream(CSV_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const queue = [];
  let isFirstLine = true;
  let count = 0;

  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }
    const parts = line.split(',');
    if (parts.length < 6) continue;
    
    let name = parts[1].trim();
    let rarity = parts[2].trim();
    let role = parts[3].trim();
    let element = parts[5].trim();
    
    // Skip the ones we already did
    const alreadyDone = [
      "Fallen Abyssal Knight", "Cataclysm Ancient Green Dragon", "Infernal Crota Son Scout",
      "Cataclysm Leviathan Sea", "Forbidden Gug Alpha", "World The Witness Final Shape",
      "Cataclysm Dracolich Elder", "Apocalypse Old God Fragment", "Primordial Zoth-Ommog Sunken",
      "Absolute Hanami Forest Arms", "Lightning Dark Angel", "Jade Undead Giant", "Twilight Templar Champion"
    ];
    if (alreadyDone.includes(name)) continue;

    queue.push({ name, rarity, role, element, status: 'pending' });
    count++;

    if (count >= 500) break;
  }

  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  console.log(`Created queue with ${queue.length} monsters.`);
}

createQueue().catch(console.error);
