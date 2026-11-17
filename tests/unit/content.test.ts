import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { checkContent, formatPath, type ContentFile } from '../../src/content/checks.ts';
import { RoomSchema, SiteSchema } from '../../src/content/schema.ts';

const root = join(import.meta.dirname, '..', '..');
const read = (rel: string): ContentFile => ({
  file: rel,
  text: readFileSync(join(root, rel), 'utf8'),
});
const siteFile = read('content/site.json');
const roomFiles = readdirSync(join(root, 'content', 'rooms'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => read(`content/rooms/${f}`));
const kitchenFile = roomFiles.find((f) => f.file.endsWith('kitchen.json'))!;
const noImages = () => false;

/** Run the checks with the kitchen file edited by `edit`. */
function withKitchen(edit: (room: Record<string, unknown>) => void) {
  const kitchen = JSON.parse(kitchenFile.text);
  edit(kitchen);
  const files = roomFiles.map((f) =>
    f === kitchenFile ? { ...f, text: JSON.stringify(kitchen) } : f,
  );
  return checkContent(siteFile, files, noImages);
}

describe('content schema', () => {
  it('accepts the content from Appendix A', () => {
    expect(SiteSchema.safeParse(JSON.parse(siteFile.text)).success).toBe(true);
    for (const f of roomFiles) {
      const result = RoomSchema.safeParse(JSON.parse(f.text));
      expect(result.success, `${f.file}: ${JSON.stringify(result.error?.issues)}`).toBe(true);
    }
    const report = checkContent(siteFile, roomFiles, noImages);
    expect(report.errors).toEqual([]);
    expect(report.rooms.map((r) => r.id)).toEqual(['front', 'living-room', 'bedroom', 'kitchen']);
  });

  it('rejects out-of-range coordinates with an owner-friendly message', () => {
    const report = withKitchen((k) => {
      (k.objects as { x: number }[])[0]!.x = 1.4;
    });
    expect(report.errors).toEqual([
      {
        file: 'content/rooms/kitchen.json',
        message: 'objects[0].x is 1.4 but must be between 0 and 1.',
        tip: 'Tip: open the live site with ?edit=1, click the object, and copy the numbers it shows.',
      },
    ]);
  });

  it('rejects zoom scales outside 1.2–3', () => {
    const report = withKitchen((k) => {
      (k.objects as { zoom: { scale: number } }[])[0]!.zoom.scale = 5;
    });
    expect(report.errors[0]?.message).toBe(
      'objects[0].zoom.scale is 5 but must be between 1.2 and 3.',
    );
  });

  it('explains missing fields, wrong types, typos, and unknown block types', () => {
    const report = withKitchen((k) => {
      const objects = k.objects as Record<string, unknown>[];
      delete objects[0]!.title;
      objects[1]!.y = '0.5';
      objects[1]!.titel = 'oops';
      (objects[1]!.blocks as Record<string, unknown>[])[0]!.type = 'picture';
    });
    const messages = report.errors.map((e) => e.message);
    expect(messages).toContain('objects[0].title is missing.');
    expect(messages).toContain(
      'objects[1].y should be a number (without quotes) but is the text "0.5".',
    );
    expect(messages).toContain(
      'objects[1] has an unknown field "titel". Check the spelling, or remove it.',
    );
    expect(
      messages.some((m) =>
        m.startsWith('objects[1].blocks[0].type is "picture" but must be one of: paragraph'),
      ),
    ).toBe(true);
  });

  it('requires unique object ids and blocks unless the object is special', () => {
    const report = withKitchen((k) => {
      const objects = k.objects as Record<string, unknown>[];
      objects[1]!.id = objects[0]!.id;
      objects[0]!.blocks = [];
    });
    const messages = report.errors.map((e) => e.message);
    expect(messages).toContain(
      'objects[0].blocks needs at least one block (paragraph, image, ...).',
    );
    expect(
      messages.some((m) => m.includes('"stuffed-peppers" is already used by objects[0]')),
    ).toBe(true);
  });

  it('requires the room id to match its file name', () => {
    const report = withKitchen((k) => {
      k.id = 'cuisine';
    });
    expect(report.errors[0]?.message).toBe(
      'id is "cuisine" but must match the file name: "kitchen".',
    );
  });

  it('errors on doorways to rooms that do not exist', () => {
    const report = withKitchen((k) => {
      (k.doorways as { to: string }[])[0]!.to = 'attic';
    });
    expect(report.errors[0]?.message).toBe(
      'doorways[0].to is "attic" but there is no room with that id.',
    );
  });

  it('reports JSON syntax errors with line and column', () => {
    const broken = { ...kitchenFile, text: '{\n  "id": "kitchen"\n  "name": {}\n}' };
    const files = roomFiles.map((f) => (f === kitchenFile ? broken : f));
    const report = checkContent(siteFile, files, noImages);
    expect(report.errors).toHaveLength(1);
    expect(report.errors[0]?.message).toMatch(/^This isn't valid JSON at line 3, column \d+\.$/);
    expect(report.errors[0]?.tip).toContain('missing comma or quote');
  });

  it('warns (but does not fail) for PLACEHOLDER text, missing Bulgarian and missing images', () => {
    const report = withKitchen((k) => {
      delete (k.name as { bg?: string }).bg;
      (k.theme as { en: string }).en = 'PLACEHOLDER theme';
    });
    expect(report.errors).toEqual([]);
    const kitchenWarnings = report.warnings.filter((w) => w.file === 'content/rooms/kitchen.json');
    // Counts depend on how much the owner has filled in, so check the kinds of warning.
    const kinds = kitchenWarnings.map((w) => w.message.split(':')[0]);
    expect(kinds).toHaveLength(3);
    expect(kinds[0]).toMatch(/^\d+ text\(s\) still say PLACEHOLDER$/);
    expect(kinds[1]).toBe('1 text(s) have no Bulgarian ("bg") version yet, so English is shown');
    expect(kinds[2]).toMatch(/^\d+ image\(s\) use placeholder art until you upload them$/);
  });

  it('formats paths like the owner sees them', () => {
    expect(formatPath(['objects', 0, 'zoom', 'scale'])).toBe('objects[0].zoom.scale');
  });
});
