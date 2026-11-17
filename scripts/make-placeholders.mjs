// `npm run placeholders`: generate placeholder art into assets-src/_placeholders/
// (handoff §14.6). Room dioramas are drawn from the room JSON, so the boxes sit
// exactly where the pins are. Re-run after moving pins while there's no real art.
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

import { roomImagePaths } from '../src/content/checks.ts';
import { readContent } from './lib/content-files.mjs';
import { cardPlaceholderSvg, imageOwners, roomPlaceholderSvg } from './lib/placeholders.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'assets-src', '_placeholders');
const { rooms } = readContent(root);
const owners = imageOwners(rooms);

let count = 0;
for (const room of rooms) {
  for (const path of new Set(roomImagePaths(room))) {
    const svg =
      path === room.image
        ? roomPlaceholderSvg(room)
        : cardPlaceholderSvg(owners.get(path)?.title ?? path, `assets-src/${path}`);
    const out = join(outDir, path);
    mkdirSync(dirname(out), { recursive: true });
    await sharp(Buffer.from(svg)).toFile(out);
    count++;
  }
}
console.log(`✔ placeholders: wrote ${count} images to assets-src/_placeholders/`);
