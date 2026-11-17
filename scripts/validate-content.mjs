// `npm run validate-content` (runs first in `npm run build`, handoff §13.5).
// Errors stop the build with a message that names the file, the place in it,
// and how to fix it. Warnings never stop the build; they list what's left to fill in.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkContent } from '../src/content/checks.ts';
import { findImageFiles } from './lib/content-files.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// In CI this runs twice (its own step, then inside `npm run build`); annotate once.
const annotatedMarker = join(root, '.cache', 'content-annotated');
const inCI = !!process.env.GITHUB_ACTIONS && !existsSync(annotatedMarker);

const read = (rel) => ({ file: rel, text: readFileSync(join(root, rel), 'utf8') });
const roomsDir = join(root, 'content', 'rooms');
const roomFiles = readdirSync(roomsDir)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((f) => read(`content/rooms/${f}`));

const assetsDir = join(root, 'assets-src');
const imageExists = (p) => findImageFiles(assetsDir, p).length > 0;
const report = checkContent(read('content/site.json'), roomFiles, imageExists);

// Two uploads for the same picture (e.g. kitchen.jpg and kitchen.png): say which one is used.
for (const room of report.rooms) {
  for (const p of new Set([
    room.image,
    ...room.objects.flatMap((o) =>
      o.blocks.flatMap((b) =>
        b.type === 'image' ? [b.src] : b.type === 'gallery' ? b.items.map((i) => i.src) : [],
      ),
    ),
  ])) {
    const files = findImageFiles(assetsDir, p);
    if (files.length > 1) {
      const names = files.map((f) => f.slice(assetsDir.length + 1));
      report.warnings.push({
        file: `content/rooms/${room.id}.json`,
        message: `there are ${files.length} files for ${p}: ${names.join(', ')}. Using ${names[0]}; delete the others to avoid confusion.`,
      });
    }
  }
}

/** GitHub shows these on the run's summary page. */
const annotate = (level, p) => {
  if (!inCI) return;
  const text = `${p.message}${p.tip ? ` ${p.tip}` : ''}`.replaceAll('\n', '%0A');
  console.log(`::${level} file=${p.file},title=${p.file}::${text}`);
};

for (const w of report.warnings) {
  console.warn(`⚠ ${w.file} → ${w.message}`);
  annotate('warning', w);
}

for (const e of report.errors) {
  console.error(`✖ ${e.file} → ${e.message}`);
  if (e.tip) console.error(`  ${e.tip}`);
  annotate('error', e);
}

// spa-routes.mjs prints a summary of these at the very end of the build log.
mkdirSync(join(root, '.cache'), { recursive: true });
writeFileSync(
  join(root, '.cache', 'content-warnings.json'),
  JSON.stringify(report.warnings, null, 2),
);

if (report.errors.length) {
  console.error(
    `\n✖ Content check failed: ${report.errors.length} problem(s) to fix. The site was not updated; the live site still shows the previous version.`,
  );
  process.exit(1);
}
console.log(
  `✔ Content OK: ${report.rooms.length} rooms, ${report.rooms.reduce((n, r) => n + r.objects.length, 0)} objects` +
    (report.warnings.length
      ? ` (${report.warnings.length} warning(s) above; they don't block the site).`
      : '.'),
);
