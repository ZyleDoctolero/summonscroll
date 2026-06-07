// Post-build: Generate .vercel/output structure from Vite SSR build
// TanStack Start produces dist/client (assets) + dist/server (SSR handler)
// We package them into Vercel's Build Output API v3 format

import { mkdirSync, cpSync, writeFileSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const out = join(root, '.vercel', 'output');

console.log('Generating Vercel output...');

// Clean & create output dirs
mkdirSync(join(out, 'static'), { recursive: true });
mkdirSync(join(out, 'functions', '__nitro.func'), { recursive: true });

// 1. Copy client assets to static/
cpSync(join(root, 'dist', 'client'), join(out, 'static'), { recursive: true });

// 2. Copy server bundle into the serverless function
cpSync(join(root, 'dist', 'server'), join(out, 'functions', '__nitro.func', 'server'), { recursive: true });

// 3. Create the function entry point
const entryCode = `
export default async function handler(request) {
  const mod = await import('./server/server.js');
  const server = mod.default;
  return server.fetch(request, {}, {});
}

export const config = { runtime: 'edge' };
`;
writeFileSync(join(out, 'functions', '__nitro.func', 'index.js'), entryCode);

// 4. Create function config
writeFileSync(join(out, 'functions', '__nitro.func', '.vc-config.json'), JSON.stringify({
  runtime: 'edge',
  entrypoint: 'index.js',
}, null, 2));

// 5. Create output config with proper routing
const config = {
  version: 3,
  routes: [
    // Serve static assets first
    { src: '/assets/(.*)', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
    { handle: 'filesystem' },
    // Everything else goes to the SSR function
    { src: '/(.*)', dest: '/__nitro' },
  ],
};
writeFileSync(join(out, 'config.json'), JSON.stringify(config, null, 2));

console.log('✓ Vercel output generated at .vercel/output');
