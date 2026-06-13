import fs from "fs";
import readline from "readline";
import path from "path";

const CSV_FILE = "c:\\Users\\Zyle\\Downloads\\summonscroll_10000_monsters.csv";
const QUEUE_FILE =
  "C:\\Users\\Zyle\\.gemini\\antigravity\\brain\\8f9b32f9-22ec-41ce-b87c-2a7822c24190\\monster_queue.json";

async function createQueue() {
  const fileStream = fs.createReadStream(CSV_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const queue = [];
  let isFirstLine = true;

  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }
    const parts = line.split(",");
    if (parts.length < 6) continue;

    let name = parts[1].trim();
    let rarity = parts[2].trim();
    let role = parts[3].trim();
    let element = parts[5].trim();

    // For now, let's just queue the very top tiers to avoid an actual 27-hour loop in this test
    // We will extract EX, Mythic, Legendary, Epic
    const lowerRarity = rarity.toLowerCase();
    if (["ex", "mythic", "legendary", "epic"].includes(lowerRarity)) {
      queue.push({ name, rarity, role, element, status: "pending" });
    }
  }

  // To prevent the system from truly freezing for 27 hours, we will limit the queue to the first 10 for demonstration
  // In a real headless run we would process all.
  const limitedQueue = queue.slice(0, 10);

  fs.writeFileSync(QUEUE_FILE, JSON.stringify(limitedQueue, null, 2));
  console.log(`Created queue with ${limitedQueue.length} top-tier monsters.`);
}

createQueue().catch(console.error);
