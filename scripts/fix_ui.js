const fs = require('fs');
const path = require('path');

const UI_DIR = path.join(__dirname, '../src/components/ui');
const STYLES_DIR = path.join(__dirname, '../src/styles');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Remove neon cyan/magenta shadows
    content = content.replace(/shadow-\[.*?rgba\((?:0,255,255|255,0,255).*?\]/g, 'shadow-lg shadow-black/40');
    content = content.replace(/hover:drop-shadow-\[.*?\]/g, 'hover:drop-shadow-md');
    content = content.replace(/drop-shadow-\[.*?\]/g, 'drop-shadow-sm');

    // Replace other specific glowing shadows
    content = content.replace(/shadow-\[0_0_15px_rgba[^\]]+\]/g, 'shadow-lg shadow-black/40');
    content = content.replace(/shadow-\[0_0_40px_rgba[^\]]+\]/g, 'shadow-lg shadow-black/40');
    content = content.replace(/shadow-\[0_0_10px_rgba[^\]]+\]/g, 'shadow-md shadow-black/40');
    content = content.replace(/shadow-\[0_0_20px_rgba[^\]]+\]/g, 'shadow-lg shadow-black/40');
    content = content.replace(/shadow-\[0_0_5px_rgba[^\]]+\]/g, 'shadow-sm shadow-black/40');
    content = content.replace(/shadow-\[0_4px_15px_rgba[^\]]+\]/g, 'shadow-lg shadow-black/40');
    
    // Inset shadows
    content = content.replace(/inset_0_0_[0-9]+px_rgba[^\]]+\]/g, 'inset_0_2px_4px_rgba(0,0,0,0.4)]');

    // Replace cyan/magenta borders
    content = content.replace(/border-cyan-[0-9]+\/[0-9]+/g, 'border-[#b8973c]/50');
    content = content.replace(/border-cyan-[0-9]+/g, 'border-[#b8973c]');
    content = content.replace(/border-fuchsia-[0-9]+\/[0-9]+/g, 'border-[#8b0000]/50');
    content = content.replace(/border-fuchsia-[0-9]+/g, 'border-[#8b0000]');

    // Dialog / Popover / Card backgrounds to parchment
    // e.g. bg-[#0a0510]/95 -> bg-[#f4ecd8]
    // bg-slate-950 -> bg-[#f4ecd8]
    content = content.replace(/bg-\[#0a0510\](?:\/[0-9]+)?/g, 'bg-[#f4ecd8]');
    content = content.replace(/bg-slate-[89]00(?:\/[0-9]+)?/g, 'bg-[#f4ecd8]');
    content = content.replace(/bg-slate-950(?:\/[0-9]+)?/g, 'bg-[#f4ecd8]');

    // Replace generic dark backgrounds with parchment in UI components
    content = content.replace(/bg-background/g, 'bg-[#f4ecd8]');
    content = content.replace(/bg-popover/g, 'bg-[#f4ecd8]');
    content = content.replace(/bg-card/g, 'bg-[#f4ecd8]');
    
    // Text colors
    content = content.replace(/text-cyan-50/g, 'text-[#1a1a1a]');
    content = content.replace(/text-cyan-100/g, 'text-[#1a1a1a]');
    content = content.replace(/text-cyan-200(?:\/[0-9]+)?/g, 'text-[#3d2e1f]');
    content = content.replace(/text-cyan-300/g, 'text-[#3d2e1f]');
    content = content.replace(/text-cyan-400/g, 'text-[#8b0000]');
    content = content.replace(/text-cyan-500/g, 'text-[#8b0000]');
    content = content.replace(/text-cyan-[0-9]+/g, 'text-[#1a1a1a]');
    
    // Text colors for popover/foreground etc
    content = content.replace(/text-foreground/g, 'text-[#1a1a1a]');
    content = content.replace(/text-muted-foreground/g, 'text-[#3d2e1f]');
    content = content.replace(/text-popover-foreground/g, 'text-[#1a1a1a]');
    content = content.replace(/text-card-foreground/g, 'text-[#1a1a1a]');

    content = content.replace(/hover:text-cyan-[0-9]+/g, 'hover:text-[#8b0000]');
    content = content.replace(/focus:ring-cyan-[0-9]+/g, 'focus:ring-[#b8973c]');
    content = content.replace(/data-\[state=open\]:bg-cyan-[0-9]+/g, 'data-[state=open]:bg-[#e0d4b8]');
    content = content.replace(/data-\[state=open\]:text-cyan-[0-9]+/g, 'data-[state=open]:text-[#8b0000]');

    // Replace ring colors
    content = content.replace(/ring-cyan-[0-9]+/g, 'ring-[#b8973c]');
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated', filePath);
    }
}

function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
            replaceInFile(fullPath);
        }
    }
}

walkDir(UI_DIR);
walkDir(STYLES_DIR);
console.log('Done.');
