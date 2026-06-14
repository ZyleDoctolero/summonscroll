import fs from 'fs';

const QUEUE_FILE = 'C:\\Users\\Zyle\\.gemini\\antigravity\\]brain\\8f9b32f9-22ec-41ce-b87c-2a7822c24190\\monster_queue_500.json'.replace('\\]', '\\');

try {
  const data = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
  let count = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i].status === 'processing') {
      data[i].status = 'pending';
      count++;
    }
  }
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(data, null, 2));
  console.log(`Successfully reset ${count} processing monsters to pending.`);
} catch (e) {
  console.error('Error resetting queue:', e);
}
