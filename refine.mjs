import fs from 'fs';
import path from 'path';

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let originalContent = fs.readFileSync(fullPath, 'utf8');
      let content = originalContent;

      content = content.replace(/var\(--cyan\)/g, '#b89047');
      content = content.replace(/var\(--gold-glow\)/g, '#b89047');
      content = content.replace(/rgba\(26,\s*11,\s*46,\s*0\.9\)/g, '#f4ecd8');
      content = content.replace(/rgba\(10,\s*5,\s*18,\s*0\.95\)/g, '#f4ecd8');
      content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.1\)/g, 'rgba(61,46,31,0.1)'); 
      content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.08\)/g, 'rgba(61,46,31,0.08)');
      content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.06\)/g, 'rgba(61,46,31,0.06)');
      
      content = content.replace(/bg-black/g, 'bg-[#f4ecd8]');
      content = content.replace(/bg-\[#000\]/g, 'bg-[#f4ecd8]');
      content = content.replace(/bg-atmos/g, 'bg-[#f4ecd8]');
      content = content.replace(/bg-white\/10/g, 'bg-[#3d2e1f]/10');
      content = content.replace(/bg-white\/5/g, 'bg-[#3d2e1f]/5');
      content = content.replace(/bg-white\/20/g, 'bg-[#3d2e1f]/20');
      content = content.replace(/bg-white\/30/g, 'bg-[#3d2e1f]/30');
      
      content = content.replace(/text-white/g, 'text-[#3d2e1f]');
      content = content.replace(/border-white/g, 'border-[#3d2e1f]');
      
      content = content.replace(/background:\s*"black"/g, 'background: "#f4ecd8"');
      content = content.replace(/color:\s*"white"/g, 'color: "#3d2e1f"');
      
      content = content.replace(/var\(--ink-primary\)/g, '#2a1e12'); 
      content = content.replace(/var\(--ink-secondary\)/g, '#3d2e1f'); 
      content = content.replace(/var\(--ink-tertiary\)/g, '#3d2e1f'); 
      content = content.replace(/var\(--gold-bright\)/g, '#b89047'); 
      content = content.replace(/var\(--gold-muted\)/g, '#8a6d3b');
      content = content.replace(/var\(--gold-primary\)/g, '#b89047');
      
      content = content.replace(/font-mono/g, 'font-serif');
      content = content.replace(/t-mono/g, 'font-serif');
      content = content.replace(/font-pixel/g, 'font-serif');
      content = content.replace(/font-black/g, 'font-serif font-bold');
      
      content = content.replace(/mixBlendMode:\s*["']screen["']/g, 'mixBlendMode: "multiply"');
      content = content.replace(/mix-blend-screen/g, 'mix-blend-multiply');
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDir('C:/Users/Zyle/Downloads/Portfolio/SummonScroll-Fresh/src/routes');
console.log('Done modifying SummonScroll-Fresh');

// also process the other one just in case
if (fs.existsSync('C:/Users/Zyle/Downloads/Portfolio/SummonScroll/src/routes')) {
    processDir('C:/Users/Zyle/Downloads/Portfolio/SummonScroll/src/routes');
    console.log('Done modifying SummonScroll');
}

