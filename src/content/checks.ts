// Content checks with owner-friendly messages (handoff §13.2, §13.5).
// Pure functions: no file access, so they run in Node scripts, unit tests,
// and the dev-mode app alike.
import type { z } from 'zod';

import { RoomSchema, SiteSchema, type Room, type Site } from './schema.ts';

export interface ContentFile {
  /** Repo-relative path, e.g. "content/rooms/kitchen.json". */
  file: string;
  text: string;
}

export interface Problem {
  file: string;
  message: string;
  tip?: string;
}

export interface ContentReport {
  errors: Problem[];
  warnings: Problem[];
  site?: Site;
  rooms: Room[];
}

const COORD_TIP = 'Tip: open the live site with ?edit=1, click the object, and copy the numbers it shows.';
const JSON_TIP = 'Tip: check for a missing comma or quote just before this spot.';
const BLOCK_TYPES = 'paragraph, image, gallery, recipe, links, list, spotify, quote, sound-toggle';
const EFFECT_TYPES = 'steam, flicker, twinkle';

type Path = ReadonlyArray<PropertyKey>;

/** ['objects', 0, 'x'] → "objects[0].x" */
export function formatPath(path: Path): string {
  return path
    .map((p, i) => (typeof p === 'number' ? `[${p}]` : i === 0 ? String(p) : `.${String(p)}`))
    .join('');
}

function valueAt(data: unknown, path: Path): unknown {
  let cur: unknown = data;
  for (const key of path) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<PropertyKey, unknown>)[key];
  }
  return cur;
}

function describeExpected(expected: string): string {
  switch (expected) {
    case 'string':
      return 'text in "quotes"';
    case 'number':
      return 'a number (without quotes)';
    case 'boolean':
      return 'true or false (without quotes)';
    case 'array':
      return 'a list in [ square brackets ]';
    case 'object':
      return 'a { curly-bracket } group';
    default:
      return expected;
  }
}

function describeValue(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'a list';
  if (typeof v === 'object') return 'a { } group';
  if (typeof v === 'string') return `the text ${JSON.stringify(v)}`;
  return String(v);
}

function isCoordinate(path: Path): boolean {
  const last = path[path.length - 1];
  return last === 'x' || last === 'y' || last === 'radius' || last === 'initialFocusX';
}

/** Turn one zod issue into a sentence a non-developer can act on. */
export function describeIssue(issue: z.core.$ZodIssue, data: unknown): { message: string; tip?: string } {
  const where = formatPath(issue.path) || 'The file';
  const value = valueAt(data, issue.path);

  switch (issue.code) {
    case 'invalid_type':
      if (value === undefined) return { message: `${where} is missing.` };
      return {
        message: `${where} should be ${describeExpected(issue.expected)} but is ${describeValue(value)}.`,
      };
    case 'too_big':
    case 'too_small': {
      if (issue.origin === 'number') {
        if (isCoordinate(issue.path)) {
          return {
            message: `${where} is ${String(value)} but must be between 0 and 1.`,
            tip: COORD_TIP,
          };
        }
        if (issue.path[issue.path.length - 1] === 'scale') {
          return { message: `${where} is ${String(value)} but must be between 1.2 and 3.` };
        }
        return {
          message:
            issue.code === 'too_big'
              ? `${where} is ${String(value)} but must be at most ${String(issue.maximum)}.`
              : `${where} is ${String(value)} but must be at least ${String(issue.minimum)}.`,
        };
      }
      if (issue.origin === 'array' && issue.code === 'too_small') {
        return { message: `${where} needs at least ${String(issue.minimum)} item(s).` };
      }
      if (issue.origin === 'string' && issue.code === 'too_small') {
        return { message: `${where} can't be empty.` };
      }
      return { message: `${where}: ${issue.message}.` };
    }
    case 'unrecognized_keys': {
      const keys = issue.keys.map((k) => `"${k}"`).join(', ');
      const base = issue.path.length ? `${where} has` : 'The file has';
      return {
        message: `${base} an unknown field ${keys}. Check the spelling, or remove it.`,
      };
    }
    case 'invalid_value':
      return {
        message: `${where} is ${JSON.stringify(value)} but must be one of: ${issue.values
          .map((v) => JSON.stringify(v))
          .join(', ')}.`,
      };
    case 'invalid_union': {
      // Unknown block/effect "type". Zod points at the type field itself.
      const options = (issue as { options?: unknown[] }).options;
      const type =
        value !== null && typeof value === 'object' ? (value as { type?: unknown }).type : value;
      const typePath = issue.path[issue.path.length - 1] === 'type' ? where : `${where}.type`;
      const allowed = options?.length
        ? options.join(', ')
        : issue.path.includes('effects')
          ? EFFECT_TYPES
          : BLOCK_TYPES;
      return {
        message: `${typePath} is ${type === undefined ? 'missing' : JSON.stringify(type)} but must be one of: ${allowed}.`,
      };
    }
    case 'invalid_format':
      if (issue.format === 'url') {
        return { message: `${where} must be a full web address starting with https://` };
      }
      return { message: `${where} is ${JSON.stringify(value)}: ${issue.message}.` };
    default:
      return { message: `${where} ${issue.message}.` };
  }
}

/** Parse JSON, reporting syntax errors with line and column. */
export function parseJson(file: ContentFile): { data?: unknown; error?: Problem } {
  try {
    return { data: JSON.parse(file.text) as unknown };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    let line: number | undefined;
    let column: number | undefined;
    const lc = /line (\d+) column (\d+)/.exec(msg);
    const pos = /position (\d+)/.exec(msg);
    if (lc) {
      line = Number(lc[1]);
      column = Number(lc[2]);
    } else if (pos) {
      const before = file.text.slice(0, Number(pos[1]));
      line = before.split('\n').length;
      column = before.length - before.lastIndexOf('\n');
    }
    const where = line ? ` at line ${line}, column ${column}` : '';
    return {
      error: {
        file: file.file,
        message: `This isn't valid JSON${where}.`,
        tip: JSON_TIP,
      },
    };
  }
}

function walkStrings(
  node: unknown,
  path: (string | number)[],
  visit: (value: string, path: (string | number)[]) => void,
) {
  if (typeof node === 'string') visit(node, path);
  else if (Array.isArray(node)) node.forEach((n, i) => walkStrings(n, [...path, i], visit));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) walkStrings(v, [...path, k], visit);
  }
}

function walkL10n(node: unknown, path: (string | number)[], visit: (path: (string | number)[]) => void) {
  if (Array.isArray(node)) node.forEach((n, i) => walkL10n(n, [...path, i], visit));
  else if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if (typeof obj.en === 'string' && !('bg' in obj)) visit(path);
    for (const [k, v] of Object.entries(obj)) walkL10n(v, [...path, k], visit);
  }
}

/** Group paths by top-level object for compact warnings: "poster-1 → name.en, title.en". */
function groupByObject(room: Room | undefined, paths: (string | number)[][]): string[] {
  const groups = new Map<string, string[]>();
  for (const p of paths) {
    let key = '';
    let rest = p;
    if (p[0] === 'objects' && typeof p[1] === 'number') {
      key = room?.objects[p[1]]?.id ?? `objects[${p[1]}]`;
      rest = p.slice(2);
    } else if (p[0] === 'ui' && typeof p[1] === 'string') {
      key = `ui "${p[1]}"`;
      rest = p.slice(2);
    }
    const list = groups.get(key) ?? [];
    list.push(formatPath(rest) || formatPath(p));
    groups.set(key, list);
  }
  return [...groups].map(([k, v]) => (k ? `${k} → ${v.join(', ')}` : v.join(', ')));
}

/** Every image path a room references (room render + close-up images). */
export function roomImagePaths(room: Room): string[] {
  const paths = [room.image];
  for (const obj of room.objects) {
    for (const block of obj.blocks) {
      if (block.type === 'image') paths.push(block.src);
      if (block.type === 'gallery') paths.push(...block.items.map((i) => i.src));
    }
  }
  return paths;
}

/**
 * Validate site.json plus every room file. Errors block the build; warnings
 * don't (missing translations, PLACEHOLDER text, missing images, ...).
 */
export function checkContent(
  siteFile: ContentFile,
  roomFiles: ContentFile[],
  imageExists: (path: string) => boolean,
): ContentReport {
  const errors: Problem[] = [];
  const warnings: Problem[] = [];
  const rooms: Room[] = [];

  const validate = <T>(file: ContentFile, schema: z.ZodType<T>): T | undefined => {
    const { data, error } = parseJson(file);
    if (error) {
      errors.push(error);
      return undefined;
    }
    const result = schema.safeParse(data);
    if (!result.success) {
      for (const issue of result.error.issues) errors.push({ file: file.file, ...describeIssue(issue, data) });
      return undefined;
    }
    return result.data;
  };

  const site: Site | undefined = validate(siteFile, SiteSchema);

  const fileIds = new Map<string, string>();
  for (const rf of roomFiles) {
    const expectedId = rf.file.replace(/^.*\//, '').replace(/\.json$/, '');
    fileIds.set(expectedId, rf.file);
    const room = validate(rf, RoomSchema);
    if (!room) continue;
    if (room.id !== expectedId) {
      errors.push({
        file: rf.file,
        message: `id is "${room.id}" but must match the file name: "${expectedId}".`,
      });
      continue;
    }
    rooms.push(room);
  }

  if (site) {
    for (const id of site.rooms) {
      if (!fileIds.has(id)) {
        errors.push({
          file: siteFile.file,
          message: `rooms lists "${id}" but there is no content/rooms/${id}.json file.`,
          tip: `Tip: create that file, or remove "${id}" from the rooms list.`,
        });
      }
    }
    const live = new Set(site.rooms);
    for (const room of rooms) {
      room.doorways.forEach((d, i) => {
        const file = fileIds.get(room.id) ?? '';
        if (!fileIds.has(d.to)) {
          errors.push({
            file,
            message: `doorways[${i}].to is "${d.to}" but there is no room with that id.`,
            tip: `Tip: use one of: ${[...fileIds.keys()].join(', ')}.`,
          });
        } else if (!live.has(d.to)) {
          warnings.push({
            file,
            message: `doorways[${i}] leads to "${d.to}", which isn't in the rooms list in site.json, so it's hidden.`,
          });
        }
      });
    }
  }

  // Warnings: PLACEHOLDER text, missing Bulgarian, images still using placeholder art.
  const scan = (file: string, data: unknown, room?: Room) => {
    const placeholders: (string | number)[][] = [];
    walkStrings(data, [], (value, path) => {
      if (value.includes('PLACEHOLDER')) placeholders.push(path);
    });
    if (placeholders.length) {
      warnings.push({
        file,
        message: `${placeholders.length} text(s) still say PLACEHOLDER: ${groupByObject(room, placeholders).join('; ')}`,
      });
    }
    const missingBg: (string | number)[][] = [];
    walkL10n(data, [], (path) => missingBg.push(path));
    if (missingBg.length) {
      warnings.push({
        file,
        message: `${missingBg.length} text(s) have no Bulgarian ("bg") version yet, so English is shown: ${groupByObject(room, missingBg).join('; ')}`,
      });
    }
  };
  if (site) scan(siteFile.file, site);
  for (const room of rooms) {
    const file = fileIds.get(room.id) ?? '';
    scan(file, room, room);
    const missing = roomImagePaths(room).filter((p) => !imageExists(p));
    if (missing.length) {
      warnings.push({
        file,
        message: `${missing.length} image(s) use placeholder art until you upload them: ${missing
          .map((p) => `assets-src/${p}`)
          .join(', ')}`,
      });
    }
  }

  // Keep the order of site.rooms for live rooms; other rooms after.
  if (site) {
    const order = site.rooms;
    rooms.sort((a, b) => {
      const ia = order.indexOf(a.id);
      const ib = order.indexOf(b.id);
      return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
    });
  }

  return { errors, warnings, site, rooms };
}
