// Post-build: Generate .vercel/output from Vite SSR build
// Uses Node.js runtime (not Edge) since we need full Node.js APIs for SSR

import { mkdirSync, cpSync, writeFileSync, existsSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const out = join(root, ".vercel", "output");

console.log("Generating Vercel output...");

// Clean previous output (keep .vercel/project.json)
if (existsSync(join(out, "static"))) rmSync(join(out, "static"), { recursive: true });
if (existsSync(join(out, "functions"))) rmSync(join(out, "functions"), { recursive: true });

mkdirSync(join(out, "static"), { recursive: true });
const funcDir = join(out, "functions", "__nitro.func");
mkdirSync(funcDir, { recursive: true });

// 1. Copy client assets to static/
cpSync(join(root, "dist", "client"), join(out, "static"), { recursive: true });

// 2. Copy server bundle into the serverless function
cpSync(join(root, "dist", "server"), join(funcDir, "server"), { recursive: true });

// 3. Copy node_modules needed at runtime
// The server bundle uses dynamic imports so we need the deps
cpSync(join(root, "node_modules"), join(funcDir, "node_modules"), { recursive: true });

// 4. Create the function entry point (Node.js runtime, NOT Edge)
const entryCode = `
export default async function handler(request) {
  const mod = await import('./server/server.js');
  const server = mod.default;
  return server.fetch(request, {}, {});
}
`;
writeFileSync(join(funcDir, "index.mjs"), entryCode);

// 5. Create function config — Node.js runtime (supports all modules)
writeFileSync(
  join(funcDir, ".vc-config.json"),
  JSON.stringify(
    {
      runtime: "nodejs22.x",
      handler: "index.mjs",
      launcherType: "Nodejs",
      supportsResponseStreaming: true,
      maxDuration: 30,
    },
    null,
    2,
  ),
);

// 6. Create package.json for the function
writeFileSync(join(funcDir, "package.json"), JSON.stringify({ type: "module" }, null, 2));

// 7. Create output config
const config = {
  version: 3,
  routes: [
    { src: "/assets/(.*)", headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
    { handle: "filesystem" },
    { src: "/(.*)", dest: "/__nitro" },
  ],
};
writeFileSync(join(out, "config.json"), JSON.stringify(config, null, 2));

console.log("✓ Vercel output generated (Node.js runtime)");
