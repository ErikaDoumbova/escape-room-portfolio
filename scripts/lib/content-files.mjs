// Read content/ for build scripts (validation errors are reported by validate-content.mjs).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** @param {string} root repo root */
export function readContent(root) {
  const site = JSON.parse(readFileSync(join(root, 'content', 'site.json'), 'utf8'));
  const dir = join(root, 'content', 'rooms');
  /** @type {any[]} */
  const rooms = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
  /** @type {Record<string, any>} */
  const roomsById = Object.fromEntries(rooms.map((r) => [r.id, r]));
  return { site, rooms, roomsById };
}

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];

/**
 * All files in `dir` that match an image path regardless of extension, the
 * exact name first: "rooms/kitchen.png" also finds "rooms/kitchen.jpg", so the
 * owner can upload PNG or JPG without editing the room file.
 * @param {string} dir  e.g. <root>/assets-src
 * @param {string} path e.g. "rooms/kitchen.png"
 * @returns {string[]} absolute paths
 */
export function findImageFiles(dir, path) {
  const exact = join(dir, path);
  const base = path.replace(/\.[^./]+$/, '');
  const candidates = [exact, ...IMAGE_EXTENSIONS.map((ext) => join(dir, base + ext))];
  return [...new Set(candidates)].filter((p) => existsSync(p));
}
