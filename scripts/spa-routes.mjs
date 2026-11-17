// After `vite build`: give every route its own index.html so GitHub Pages serves
// clean URLs (/kitchen, /kitchen/stuffed-peppers, /tour) on a hard refresh,
// plus a 404.html that boots the app for unknown paths (handoff §15.3).
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { computeRoutes, injectMeta } from './lib/routes.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const contentDir = join(root, 'content');

const indexPath = join(dist, 'index.html');
if (!existsSync(indexPath)) {
  console.error('✖ dist/index.html not found. Run `vite build` first.');
  process.exit(1);
}

const site = JSON.parse(await readFile(join(contentDir, 'site.json'), 'utf8'));

/** @type {Record<string, any>} */
const roomsById = {};
const missing = [];
for (const id of site.rooms) {
  const file = join(contentDir, 'rooms', `${id}.json`);
  if (existsSync(file)) roomsById[id] = JSON.parse(await readFile(file, 'utf8'));
  else missing.push(`content/rooms/${id}.json`);
}

const template = await readFile(indexPath, 'utf8');
const routes = computeRoutes(site, roomsById);

for (const route of routes) {
  const outFile = route.path ? join(dist, route.path, 'index.html') : indexPath;
  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, injectMeta(template, route));
}

// Unknown paths: boot the app, which redirects to the front door with a toast.
const home = routes.find((r) => r.path === '');
await writeFile(join(dist, '404.html'), injectMeta(template, home ?? routes[0]));
// Serve files as-is (no Jekyll processing on GitHub Pages).
await writeFile(join(dist, '.nojekyll'), '');

console.log(`✔ spa-routes: wrote ${routes.length} pages + 404.html + .nojekyll`);
if (missing.length) {
  console.warn(
    `⚠ spa-routes: no room file yet for ${missing.join(', ')} (page uses the site title)`,
  );
}

// Owner-facing summary of what's left to fill in (written by validate-content.mjs).
const warningsFile = join(root, '.cache', 'content-warnings.json');
if (existsSync(warningsFile)) {
  const warnings = JSON.parse(await readFile(warningsFile, 'utf8'));
  if (warnings.length) {
    console.log(`\nStill to fill in (${warnings.length} note(s); the site works without them):`);
    for (const w of warnings) console.log(`  • ${w.file}: ${w.message.split(':')[0]}`);
  }
}
