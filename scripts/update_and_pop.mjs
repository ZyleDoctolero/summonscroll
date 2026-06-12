import fs from 'fs';
import path from 'path';

const QUEUE_FILE = 'C:\\Users\\Zyle\\.gemini\\antigravity\\brain\\8f9b32f9-22ec-41ce-b87c-2a7822c24190\\monster_queue_500.json';
const SPRITES_DIR = 'C:\\Users\\Zyle\\Downloads\\Portfolio\\SummonScroll-Fresh\\public\\sprites\\monsters';
const REALM_FRAGMENTS_FILE = 'C:\\Users\\Zyle\\Downloads\\Portfolio\\SummonScroll-Fresh\\data\\realm_fragments.json';
const ELEMENT_MAP_FILE = 'C:\\Users\\Zyle\\Downloads\\Portfolio\\SummonScroll-Fresh\\data\\element_realm_map.json';

function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '');
}

function loadRealmData() {
  try {
    const fragments = JSON.parse(fs.readFileSync(REALM_FRAGMENTS_FILE, 'utf8'));
    const elementMap = JSON.parse(fs.readFileSync(ELEMENT_MAP_FILE, 'utf8'));
    return { fragments, elementMap };
  } catch (e) {
    console.error('Warning: Could not load realm data:', e.message);
    return { fragments: [], elementMap: null };
  }
}

function getRealmForMonster(monster, elementMap) {
  if (!elementMap) return null;

  const name = monster.name.toLowerCase();

  // Check name overrides first (Iron Dominion and Myth Eternal patterns)
  if (elementMap.name_overrides) {
    for (const [realmName, patterns] of Object.entries(elementMap.name_overrides)) {
      for (const pattern of patterns) {
        if (name.includes(pattern.toLowerCase())) {
          return realmName;
        }
      }
    }
  }

  // Check if monster already has a realm_name assigned
  if (monster.realm_name) return monster.realm_name;

  // Fall back to element → realm mapping
  if (elementMap.element_to_realm && monster.element) {
    return elementMap.element_to_realm[monster.element] || null;
  }

  return null;
}

function getRealmFragment(realmName, fragments) {
  if (!fragments || !realmName) return null;
  return fragments.find(f => f.realm_name === realmName) || null;
}

function buildRealmContext(fragment) {
  if (!fragment) return '';

  return `[REALM CONTEXT — ${fragment.realm_name.toUpperCase()}]
Palette: ${fragment.palette}

Visual motifs to incorporate: ${fragment.motifs}

Voice / stance: ${fragment.voice}

This monster lives in the ${fragment.realm_name}. It must visually belong to the
same realm as: ${fragment.sample_siblings.join(', ')}. If you wouldn't put this
creature beside them in a single illustrated plate, regenerate.`;
}

function popQueue() {
  const data = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
  const { fragments, elementMap } = loadRealmData();
  const toGenerate = [];
  
  // Read all existing sprites
  let existingFiles = [];
  if (fs.existsSync(SPRITES_DIR)) {
    existingFiles = fs.readdirSync(SPRITES_DIR);
  }

  // Reset processing to pending initially
  for (let i = 0; i < data.length; i++) {
    if (data[i].status === 'processing') {
      data[i].status = 'pending'; 
    } 
  }

  // Auto-detect completed based on actual files
  for (let i = 0; i < data.length; i++) {
    const norm = normalizeName(data[i].name);
    const exists = existingFiles.some(f => f.startsWith(norm + '_') || f.startsWith(norm + '.'));
    if (exists) {
      data[i].status = 'complete';
    }
  }

  const limit = parseInt(process.argv[2]) || 5;
  // Grab the next batch
  for (let i = 0; i < data.length; i++) {
    if (data[i].status === 'pending' && toGenerate.length < limit) {
      data[i].status = 'processing';

      // Resolve realm and inject context
      const realmName = getRealmForMonster(data[i], elementMap);
      const fragment = getRealmFragment(realmName, fragments);
      const realmContext = buildRealmContext(fragment);

      toGenerate.push({
        ...data[i],
        realm_name: realmName || 'Unknown',
        realm_context: realmContext,
        realm_palette: fragment?.palette || '',
        realm_motifs: fragment?.motifs || '',
        realm_voice: fragment?.voice || '',
        realm_siblings: fragment?.sample_siblings || []
      });
    }
  }
  
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(data, null, 2));
  console.log(JSON.stringify(toGenerate));
}

popQueue();
