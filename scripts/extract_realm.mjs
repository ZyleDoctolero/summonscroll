#!/usr/bin/env node
import fs from "fs";
import readline from "readline";
const CSV = "C:\\Users\\Zyle\\Downloads\\summonscroll_10000_monsters.csv";
const realm = process.argv[2];
if (!realm) {
  console.error("Usage: node extract_realm.mjs <realm_name>");
  process.exit(1);
}
const rl = readline.createInterface({ input: fs.createReadStream(CSV), crlfDelay: Infinity });
let first = true;
const monsters = [];
for await (const line of rl) {
  if (first) {
    first = false;
    continue;
  }
  const [id, name, rarity, role, realmCol, element] = line.split(",").map((s) => s.trim());
  if (realmCol === realm)
    monsters.push({ id: parseInt(id), name, rarity, role, realm: realmCol, element });
}
console.log(JSON.stringify(monsters, null, 2));
console.error("Found " + monsters.length + " monsters in " + realm);
