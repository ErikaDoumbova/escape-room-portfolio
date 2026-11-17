// Read content/ for build scripts (validation errors are reported by validate-content.mjs).
import { readdirSync, readFileSync } from 'node:fs';
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
