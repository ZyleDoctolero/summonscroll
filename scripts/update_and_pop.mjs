import fs from 'fs';
import path from 'path';

const QUEUE_FILE = 'C:\\Users\\Zyle\\.gemini\\antigravity\\brain\\8f9b32f9-22ec-41ce-b87c-2a7822c24190\\monster_queue_500.json';
const SPRITES_DIR = 'C:\\Users\\Zyle\\Downloads\\Portfolio\\SummonScroll-Fresh\\public\\sprites\\monsters';

function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '');
}

function popQueue() {
  const data = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
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

  // Grab the next 5
  for (let i = 0; i < data.length; i++) {
    if (data[i].status === 'pending' && toGenerate.length < 5) {
      data[i].status = 'processing';
      toGenerate.push(data[i]);
    }
  }
  
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(data, null, 2));
  console.log(JSON.stringify(toGenerate));
}

popQueue();
