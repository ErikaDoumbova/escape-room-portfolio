// `npm run images`: turn the images that content/ references into responsive
// WebP variants + a tiny blurred preview, and write src/generated/images.json
// (handoff §13.3). Missing images fall back to placeholder art with a warning;
// they never fail the build.
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

import { roomImagePaths } from '../src/content/checks.ts';
import { findImageFiles, readContent } from './lib/content-files.mjs';
import { cardPlaceholderSvg, imageOwners, roomPlaceholderSvg } from './lib/placeholders.mjs';

const VERSION = 1; // bump to force regeneration when the processing below changes
const ROOM_WIDTHS = [800, 1600, 2400, 3200];
const OTHER_WIDTHS = [600, 1200, 2000];
const QUALITY = 82;
const BUDGET = { room1600: 350_000, room800: 120_000, lqip: 1024 };

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const genDir = join(root, 'public', 'generated');
const cacheFile = join(root, '.cache', 'images.json');
const manifestFile = join(root, 'src', 'generated', 'images.json');

const { rooms } = readContent(root);
const owners = imageOwners(rooms);
const warnings = [];

/** Widths capped at the source width, plus the source width if it falls between steps. */
export function variantWidths(steps, sourceWidth) {
  const widths = steps.filter((w) => w <= sourceWidth);
  if (sourceWidth < steps[steps.length - 1] && !widths.includes(sourceWidth))
    widths.push(sourceWidth);
  return widths;
}

/** Resolve an image: real upload → committed placeholder → placeholder drawn now. */
function resolveSource(path) {
  const [real] = findImageFiles(join(root, 'assets-src'), path);
  if (real) return { buffer: readFileSync(real), placeholder: false };
  const [ph] = findImageFiles(join(root, 'assets-src', '_placeholders'), path);
  if (ph) return { buffer: readFileSync(ph), placeholder: true };
  warnings.push(`no file or placeholder for assets-src/${path}; drew a temporary placeholder`);
  const owner = owners.get(path);
  const svg = owner?.room
    ? roomPlaceholderSvg(owner.room)
    : cardPlaceholderSvg(owner?.title ?? path, `assets-src/${path}`);
  return { buffer: Buffer.from(svg), placeholder: true };
}

/** Median colour of the four 8×8 corner patches, as #RRGGBB. */
async function cornerColor(image, width, height) {
  const size = 8;
  const corners = [
    [0, 0],
    [width - size, 0],
    [0, height - size],
    [width - size, height - size],
  ];
  const r = [];
  const g = [];
  const b = [];
  for (const [left, top] of corners) {
    const { data, info } = await image
      .clone()
      .extract({ left, top, width: size, height: size })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += info.channels) {
      r.push(data[i]);
      g.push(data[i + 1]);
      b.push(data[i + 2]);
    }
  }
  const median = (a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)];
  return `#${[median(r), median(g), median(b)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

async function processImage(path, cached) {
  const { buffer, placeholder } = resolveSource(path);
  const isRoom = path.startsWith('rooms/');
  const hash = createHash('sha1').update(`${VERSION}:${isRoom}:`).update(buffer).digest('hex');
  if (
    cached?.hash === hash &&
    cached.entry.variants.every((v) => existsSync(join(root, 'public', v.src)))
  ) {
    return { hash, entry: cached.entry };
  }

  const image = sharp(buffer).rotate(); // respect phone-photo orientation
  const { width, height } = await image
    .clone()
    .toBuffer({ resolveWithObject: true })
    .then((r) => r.info);
  const base = path.replace(/\.[^.]+$/, '');
  const variants = [];
  for (const w of variantWidths(isRoom ? ROOM_WIDTHS : OTHER_WIDTHS, width)) {
    const src = `generated/${base}-${w}.webp`;
    const out = join(root, 'public', src);
    mkdirSync(dirname(out), { recursive: true });
    const info = await image.clone().resize({ width: w }).webp({ quality: QUALITY }).toFile(out);
    variants.push({ w, src });
    if (isRoom && w === 1600 && info.size > BUDGET.room1600) {
      warnings.push(`${src} is ${Math.round(info.size / 1000)} KB (budget 350 KB)`);
    }
    if (isRoom && w === 800 && info.size > BUDGET.room800) {
      warnings.push(`${src} is ${Math.round(info.size / 1000)} KB (budget 120 KB)`);
    }
  }
  const lqipBuf = await image.clone().resize({ width: 24 }).webp({ quality: 40 }).toBuffer();
  if (lqipBuf.length > BUDGET.lqip)
    warnings.push(`blur preview for ${path} is ${lqipBuf.length} bytes (budget 1 KB)`);

  const entry = {
    width,
    height,
    aspect: Math.round((width / height) * 10000) / 10000,
    bgColor: await cornerColor(image, width, height),
    lqip: `data:image/webp;base64,${lqipBuf.toString('base64')}`,
    variants,
    placeholder,
  };
  return { hash, entry };
}

const cache = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, 'utf8')) : {};
const paths = [...new Set(rooms.flatMap((r) => roomImagePaths(r)))].sort();
const manifest = {};
const nextCache = {};
let reused = 0;

for (const path of paths) {
  const result = await processImage(path, cache[path]);
  if (result.entry === cache[path]?.entry) reused++;
  manifest[path] = result.entry;
  nextCache[path] = result;
}

// Remove generated files that nothing references any more.
const keep = new Set(
  Object.values(manifest).flatMap((e) => e.variants.map((v) => join(root, 'public', v.src))),
);
const sweep = (dir) => {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) sweep(p);
    else if (!keep.has(p)) rmSync(p);
  }
};
sweep(genDir);

mkdirSync(dirname(manifestFile), { recursive: true });
writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
mkdirSync(dirname(cacheFile), { recursive: true });
writeFileSync(cacheFile, JSON.stringify(nextCache));

const placeholders = Object.values(manifest).filter((e) => e.placeholder).length;
for (const w of warnings) console.warn(`⚠ images: ${w}`);
console.log(
  `✔ images: ${paths.length} images (${reused} unchanged, ${placeholders} using placeholder art) → ${relative(root, manifestFile)}`,
);
