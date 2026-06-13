import fs from "fs";
import path from "path";

const SRC_DIR = "C:/Users/Zyle/Downloads/Portfolio/SummonScroll-Fresh/src";

const EMOJI_REGEX =
  /[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g;

// Ignore standard symbols like ✓, ★, ☆, etc. if they aren't emojis, but we should audit them
const CHECKS = [
  { name: "Emoji literals", regex: EMOJI_REGEX },
  { name: "Material symbols", regex: /material-symbols-outlined/g },
  {
    name: "Hardcoded legacy background overrides",
    regex: /#(13161F|1A1E2A|1B1F2A|15181F|0C0E14)/gi,
  },
  { name: "Legacy Gold colors", regex: /#(C89A3E|FFD54F)/gi },
];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      const content = fs.readFileSync(fullPath, "utf8");
      CHECKS.forEach((check) => {
        let match;
        const matches = [];
        // Reset regex state for global regexes
        check.regex.lastIndex = 0;
        while ((match = check.regex.exec(content)) !== null) {
          const lineNum = content.substring(0, match.index).split("\n").length;
          matches.push({ line: lineNum, text: match[0] });
        }
        if (matches.length > 0) {
          console.log(`[${check.name}] in ${path.relative(SRC_DIR, fullPath)}:`);
          matches.forEach((m) => console.log(`  Line ${m.line}: ${m.text}`));
        }
      });
    }
  }
}

console.log("Starting scan of src/ directory...");
scanDir(SRC_DIR);
console.log("Scan complete.");
