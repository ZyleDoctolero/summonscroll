import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SPRITES_DIR = "public/sprites/monsters";
const REPORT = "triage_report.csv";

async function triage() {
  const files = await fs.readdir(SPRITES_DIR);
  const rows = ["filename,format,size_kb,has_alpha,square,verdict,reason"];

  for (const file of files) {
    const filepath = path.join(SPRITES_DIR, file);
    const ext = path.extname(file).toLowerCase().slice(1);
    const stat = await fs.stat(filepath);
    const sizeKb = Math.round(stat.size / 1024);

    let hasAlpha = false;
    let square = false;
    let verdict = "regen";
    let reason = "";

    try {
      const img = sharp(filepath);
      const meta = await img.metadata();
      hasAlpha = meta.hasAlpha ?? false;
      square = meta.width === meta.height;

      // Rules — adjust thresholds for your set
      if (ext !== "png") {
        reason = "wrong format (JPG)";
      } else if (!hasAlpha) {
        reason = "no alpha channel";
      } else if (!square) {
        reason = `not square (${meta.width}x${meta.height})`;
      } else if (sizeKb > 300) {
        reason = `oversized (${sizeKb}kb)`;
      } else if (sizeKb < 15) {
        reason = `suspiciously small (${sizeKb}kb)`;
      } else {
        // Heuristic: if it's a PNG, square, has alpha, reasonable size, keep
        verdict = "keep";
        reason = "passes baseline checks";
      }
    } catch (e) {
      reason = `read error: ${e.message}`;
    }

    rows.push([file, ext, sizeKb, hasAlpha, square, verdict, reason].join(","));
  }

  await fs.writeFile(REPORT, rows.join("\n"));
  console.log(`Wrote ${REPORT} (${rows.length - 1} files)`);
}

triage().catch(console.error);
