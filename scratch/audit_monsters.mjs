import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY; // Using publishable anon key

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing Supabase env variables");
  process.exit(1);
}

const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const ORIGIN_TO_REALM = {
  "D&D": "Ancient Vaults",
  "Cthulhu": "The Outer Dark",
  "Slavic folklore": "Blighted Expanse",
  "Celtic folklore": "Wild Frontier",
  "Greek mythology": "Myth Eternal",
  "Norse mythology": "Myth Eternal",
  "Egyptian mythology": "Myth Eternal",
  "Japanese mythology": "Myth Eternal",
  "Chinese mythology": "Myth Eternal",
  "Arthurian legend": "Myth Eternal",
  "Christian mythology": "Divine Threshold",
  "Jewish mythology": "Divine Threshold",
  "Hinduism": "Divine Threshold",
  "Mesopotamian mythology": "Myth Eternal",
  "Persian mythology": "Myth Eternal",
  "Aztec mythology": "Myth Eternal",
  "Mayan mythology": "Myth Eternal",
  "Hawaiian mythology": "Wild Frontier",
  "Voodoo": "Haunted Veil",
  "Inuit folklore": "Wild Frontier",
  "Australian Aboriginal mythology": "Wild Frontier",
  "Korean mythology": "Myth Eternal",
  "Philippine mythology": "Wild Frontier",
  "Roman mythology": "Myth Eternal",
  "Finnish mythology": "Myth Eternal",
  "Guarani mythology": "Wild Frontier",
  "Mapuche mythology": "Wild Frontier",
  "Muisca mythology": "Wild Frontier",
  "Yoruba religion": "Wild Frontier",
  "Polynesian mythology": "Wild Frontier",
  "Mesoamerican mythology": "Myth Eternal",
  "North American folklore": "Wild Frontier",
  "South American folklore": "Wild Frontier",
  "African folklore": "Wild Frontier",
  "Middle Eastern folklore": "Myth Eternal",
  "European folklore": "Myth Eternal",
  "British folklore": "Myth Eternal",
  "French folklore": "Myth Eternal",
  "Germanic folklore": "Myth Eternal",
  "Spanish folklore": "Myth Eternal",
  "Italian folklore": "Myth Eternal",
  "Greek folklore": "Myth Eternal",
  "Irish folklore": "Myth Eternal",
  "Scottish folklore": "Myth Eternal",
  "Welsh folklore": "Myth Eternal",
  "Scandinavian folklore": "Myth Eternal",
  "Baltic folklore": "Myth Eternal",
  "Balkan folklore": "Myth Eternal",
  "Armenian folklore": "Myth Eternal",
  "Georgian folklore": "Myth Eternal",
  "Turkish folklore": "Myth Eternal",
  "Arabic folklore": "Myth Eternal",
  "Persian folklore": "Myth Eternal",
  "Indian folklore": "Myth Eternal",
  "Chinese folklore": "Myth Eternal",
  "Japanese folklore": "Myth Eternal",
  "Korean folklore": "Myth Eternal",
  "Vietnamese folklore": "Myth Eternal",
  "Thai folklore": "Myth Eternal",
  "Indonesian folklore": "Myth Eternal",
  "Filipino folklore": "Myth Eternal",
  "Melanesian folklore": "Wild Frontier",
  "Micronesian folklore": "Wild Frontier",
  "Polynesian folklore": "Wild Frontier",
  "Native American folklore": "Wild Frontier",
  "Inuit mythology": "Wild Frontier",
  "Mayan religion": "Myth Eternal",
  "Aztec religion": "Myth Eternal",
  "Inca mythology": "Wild Frontier",
  "Inca religion": "Wild Frontier",
  "Muisca religion": "Wild Frontier",
  "Caribbean folklore": "Wild Frontier",
  "Brazilian folklore": "Wild Frontier",
  "Argentinian folklore": "Wild Frontier",
  "Chilean folklore": "Wild Frontier",
  "Peruvian folklore": "Wild Frontier",
  "Ecuadorian folklore": "Wild Frontier",
  "Colombian folklore": "Wild Frontier",
  "Venezuelan folklore": "Wild Frontier",
  "Central American folklore": "Wild Frontier",
  "Mexican folklore": "Wild Frontier",
  "North American mythology": "Wild Frontier",
  "South American mythology": "Wild Frontier",
  "African mythology": "Wild Frontier",
  "Oceanic mythology": "Wild Frontier",
  "Australian Aboriginal religion": "Wild Frontier",
  "Maori mythology": "Wild Frontier",
  "Hawaiian religion": "Wild Frontier",
  "Samoan mythology": "Wild Frontier",
  "Tongan mythology": "Wild Frontier",
  "Tahitian mythology": "Wild Frontier",
  "Fijian mythology": "Wild Frontier",
  "Micronesian mythology": "Wild Frontier",
  "Melanesian mythology": "Wild Frontier",
  "Modern fiction": "Digital Nexus",
  "Science fiction": "Void Frontier",
  "Steampunk": "Iron Dominion",
  "Cyberpunk": "Digital Nexus",
  "Space opera": "Void Frontier",
  "Dark fantasy": "Haunted Veil",
  "Gothic horror": "Haunted Veil",
  "Lovecraftian horror": "The Outer Dark",
  "Cosmic horror": "The Outer Dark",
  "Ghost story": "Haunted Veil",
  "Vampire literature": "Haunted Veil",
  "Werewolf fiction": "Wild Frontier",
  "Witchcraft": "Haunted Veil",
  "Alchemy": "Ancient Vaults",
  "Demons": "Chaos Wastes",
  "Angels": "Divine Threshold",
  "Arthurian": "Myth Eternal",
  "Robin Hood": "Wild Frontier",
  "Nursery rhyme": "Myth Eternal",
  "Fairy tale": "Myth Eternal",
  "Fable": "Myth Eternal",
  "Tall tale": "Wild Frontier",
  "Urban legend": "Digital Nexus",
  "Conspiracy theory": "Digital Nexus",
  "Internet culture": "Digital Nexus",
  "Gaming culture": "Digital Nexus",
  "Cryptid": "Wild Frontier",
  "Extraterrestrial": "Void Frontier",
  "Time travel": "Void Frontier",
  "Alternate history": "Void Frontier",
  "Post-apocalyptic": "Chaos Wastes",
  "Dystopian": "Digital Nexus"
};

async function audit() {
  const { data: realms, error: realmsErr } = await supa.from("realms").select("id, name");
  if (realmsErr) {
    console.error("❌ Error fetching realms:", realmsErr);
    process.exit(1);
  }
  
  const realmsMap = realms.reduce((acc, r) => ({ ...acc, [r.name]: r.id }), {});

  const { data: monsters, error: monstersErr } = await supa
    .from("monsters")
    .select("id, name, origin, element, realm_id, realms(name)");
    
  if (monstersErr) {
    console.error("❌ Error fetching monsters:", monstersErr);
    process.exit(1);
  }

  console.log(`Auditing ${monsters.length} monsters...`);
  const mismatches = [];

  for (const m of monsters) {
    const origin = m.origin;
    const element = m.element;
    const currentRealmName = m.realms?.name;

    // Determine expected realm
    let expectedRealmName = null;
    
    // 1. Map via origin keyword mapping
    if (origin) {
      for (const [key, val] of Object.entries(ORIGIN_TO_REALM)) {
        if (origin.toLowerCase().includes(key.toLowerCase())) {
          expectedRealmName = val;
          break;
        }
      }
    }

    // 2. If no origin match, map via element
    if (!expectedRealmName && element) {
      if (element === "Arcane") expectedRealmName = "Ancient Vaults";
      else if (element === "Chaos") expectedRealmName = "Chaos Wastes";
      else if (element === "Void") expectedRealmName = "The Outer Dark";
      else if (element === "Death") expectedRealmName = "Blighted Expanse";
      else if (element === "Nature") expectedRealmName = "Wild Frontier";
      else if (element === "Divine") expectedRealmName = "Divine Threshold";
      else if (element === "Dread") expectedRealmName = "Haunted Veil";
      else if (element === "Digital") expectedRealmName = "Digital Nexus";
      else if (element === "Primal") expectedRealmName = "Elder Realm";
      else if (element === "Stellar") expectedRealmName = "Void Frontier";
      else if (element === "Primordial") expectedRealmName = "Myth Eternal";
      else if (element === "Synthetic") expectedRealmName = "Iron Dominion";
    }

    if (expectedRealmName && currentRealmName !== expectedRealmName) {
      const expectedId = realmsMap[expectedRealmName];
      mismatches.push({
        id: m.id,
        name: m.name,
        origin,
        element,
        current: currentRealmName,
        expected: expectedRealmName,
        expectedId
      });
    }
  }

  console.log(`Found ${mismatches.length} mismatches.`);
  if (mismatches.length > 0) {
    console.log("Sample mismatches:");
    mismatches.slice(0, 10).forEach(m => {
      console.log(`- ${m.name}: Origin '${m.origin}', Element '${m.element}'. Current realm: '${m.current}', Expected: '${m.expected}'`);
    });
    
    // Write out SQL update statements to a file
    const sql = mismatches.map(m => {
      return `UPDATE public.monsters SET realm_id = '${m.expectedId}' WHERE id = '${m.id}'; -- ${m.name} (${m.origin} / ${m.element})`;
    }).join("\n");
    
    console.log("\nSQL updates generated.");
    return { mismatches, sql };
  }
}

audit().catch(console.error);
