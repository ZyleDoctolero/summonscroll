const fs = require('fs');
const file = 'C:/Users/Zyle/Downloads/Portfolio/SummonScroll-Fresh/src/routes/_authenticated/compendium.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$\{/g, '${');
fs.writeFileSync(file, content);
