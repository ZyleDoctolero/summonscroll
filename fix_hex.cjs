const fs = require("fs");
const path = require("path");

const dir = "src/routes/_authenticated";
const map = {
  "#050a14": "var(--bg-deep)",
  "#d4af3f": "var(--gold-primary)",
  "#fcd34d": "var(--gold-bright)",
  "#3a205a": "var(--primary)",
  "#8a2be2": "var(--primary)",
};

function processDir(d) {
  const files = fs.readdirSync(d);
  for (const file of files) {
    const fullPath = path.join(d, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith(".tsx")) {
      let content = fs.readFileSync(fullPath, "utf8");
      let changed = false;
      for (const [hex, cssVar] of Object.entries(map)) {
        const regex = new RegExp(`\\[${hex}\\]`, "gi");
        if (regex.test(content)) {
          content = content.replace(regex, `[${cssVar}]`);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log("Fixed", fullPath);
      }
    }
  }
}

processDir(dir);
