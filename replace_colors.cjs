const fs = require('fs');
const path = require('path');

const replacements = [
  // Backgrounds
  { regex: /#f4ecd8/g, replacement: "var(--bg-stage)" },
  { regex: /bg-\[#f4ecd8\]/g, replacement: "bg-[var(--bg-stage)]" },
  { regex: /#2a1e12/g, replacement: "var(--bg-panel)" },
  { regex: /bg-\[#2a1e12\]/g, replacement: "bg-[var(--bg-panel)]" },
  
  // Texts / Accents
  { regex: /#b89047/g, replacement: "var(--gold-bright)" },
  { regex: /#b8973c/g, replacement: "var(--gold-glow)" },
  { regex: /#3d2e1f/g, replacement: "var(--ink-secondary)" },
  { regex: /#1a1a1a/g, replacement: "var(--ink-primary)" },
  
  // Danger
  { regex: /#8b0000/g, replacement: "var(--danger)" }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      for (const { regex, replacement } of replacements) {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory('./src/components');
processDirectory('./src/routes');
