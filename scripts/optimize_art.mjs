/**
 * Monster art optimizer — one-time cleanup + repeatable for future batches.
 *
 * What it does:
 *  1. Reads every monster's art_url from Supabase (service key from .env).
 *  2. Converts each referenced PNG to a single canonical WebP:
 *       public/monsters/<slug-of-name>.webp   (max 640px, q82)
 *     ~700KB PNG -> ~30-60KB WebP. No timestamps, retakes just overwrite.
 *  3. PATCHes each monster's art_url to the canonical path.
 *  4. Deletes the old full_*.png files (used AND orphaned) once everything
 *     referenced has converted successfully. placeholder.png is kept.
 *
 * Usage:  node scripts/optimize_art.mjs          (dry run — reports only)
 *         node scripts/optimize_art.mjs --apply  (convert + update DB + delete)
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const APPLY = process.argv.includes("--apply");
const ROOT = path.resolve(import.meta.dirname, "..");
const MON_DIR = path.join(ROOT, "public", "monsters");
const MAX_SIZE = 640;
const QUALITY = 82;

// ── env ─────────────────────────────────────────────────────────────────────
const env = Object.fromEntries(
  (await fs.readFile(path.join(ROOT, ".env"), "utf8"))
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);
const URL_BASE = env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_BASE || !KEY) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing in .env");

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

const slug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

// ── 1. fetch monsters ───────────────────────────────────────────────────────
const res = await fetch(`${URL_BASE}/rest/v1/monsters?select=id,name,art_url&order=name`, {
  headers,
});
if (!res.ok) throw new Error(`fetch monsters: ${res.status}`);
const monsters = await res.json();
const withArt = monsters.filter((m) => m.art_url && m.art_url.endsWith(".png"));

console.log(`monsters: ${monsters.length}, png art_urls to convert: ${withArt.length}`);

// ── 2. convert ──────────────────────────────────────────────────────────────
let converted = 0;
let failed = [];
const plannedUpdates = [];

for (const m of withArt) {
  const srcAbs = path.join(ROOT, "public", m.art_url.replace(/^\//, ""));
  const outName = `${slug(m.name)}.webp`;
  const outAbs = path.join(MON_DIR, outName);
  const newUrl = `/monsters/${outName}`;

  try {
    await fs.access(srcAbs);
  } catch {
    failed.push({ name: m.name, reason: `source missing: ${m.art_url}` });
    continue;
  }

  if (APPLY) {
    await sharp(srcAbs)
      .resize(MAX_SIZE, MAX_SIZE, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(outAbs);
  }
  plannedUpdates.push({ id: m.id, name: m.name, from: m.art_url, to: newUrl });
  converted++;
}

console.log(`${APPLY ? "converted" : "would convert"}: ${converted}, failed: ${failed.length}`);
for (const f of failed) console.log("  FAIL", f.name, f.reason);

// ── 3. update art_url in DB ─────────────────────────────────────────────────
if (APPLY) {
  let patched = 0;
  for (const u of plannedUpdates) {
    const r = await fetch(`${URL_BASE}/rest/v1/monsters?id=eq.${u.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ art_url: u.to }),
    });
    if (r.ok) patched++;
    else console.log("  PATCH FAIL", u.name, r.status, (await r.text()).slice(0, 120));
  }
  console.log(`art_url patched: ${patched}/${plannedUpdates.length}`);
}

// ── 4. delete old PNGs (only when everything succeeded) ────────────────────
const pngs = (await fs.readdir(MON_DIR)).filter(
  (f) => f.startsWith("full_") && f.endsWith(".png"),
);
if (APPLY) {
  if (failed.length === 0) {
    for (const f of pngs) await fs.unlink(path.join(MON_DIR, f));
    console.log(`deleted old PNGs: ${pngs.length}`);
  } else {
    console.log(`skipping PNG deletion — ${failed.length} conversions failed`);
  }
} else {
  console.log(`would delete ${pngs.length} full_*.png files (incl. orphans)`);
}

// ── manifest so art is reproducible/auditable ───────────────────────────────
if (APPLY) {
  const manifest = plannedUpdates.map((u) => ({ id: u.id, name: u.name, file: u.to }));
  await fs.writeFile(
    path.join(ROOT, "public", "monsters", "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  console.log("wrote public/monsters/manifest.json");
}
