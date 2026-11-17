// SVG templates for placeholder art (handoff §14.6). Rendered to PNG with sharp
// by make-placeholders.mjs (committed files) and by process-images.mjs (on the
// fly, when an image and its placeholder are both missing).

export const ROOM_W = 3200;
export const ROOM_H = 1800;
export const CARD_W = 1200;
export const CARD_H = 900;

const C = {
  canvas: '#F6EEDF',
  paper: '#FBF6EC',
  paperShade: '#EFE3CF',
  ink: '#3B2A20',
  inkSoft: '#6B5444',
  terracotta: '#C8643B',
  wallLeft: '#EBDDC6',
  wallRight: '#E2CFB4',
  wallTop: '#D9C4A6',
  floor: '#D8C3A5',
  floorLeft: '#C9AF8C',
  floorRight: '#BFA37F',
  door: '#8C6A52',
  doorFrame: '#6E5240',
  window: '#CFE0EA',
  facade: '#F1CDBB',
  roof: '#B9654A',
  ground: '#CBD3B4',
};

const FONT = "Helvetica, Arial, 'Liberation Sans', 'DejaVu Sans', sans-serif";

/** @param {string} s */
export function escapeXml(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Rough text width for Helvetica-ish fonts. @param {string} s @param {number} size */
const textWidth = (s, size) => s.length * size * 0.56;

/** @param {number} x @param {number} y @param {string} text @param {number} size */
function labelPill(x, y, text, size, fill = C.paper, color = C.ink) {
  const w = textWidth(text, size) + size * 1.4;
  const h = size * 1.8;
  return `
    <rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" opacity="0.92"/>
    <text x="${x}" y="${y + size * 0.35}" font-family="${FONT}" font-size="${size}" font-weight="700" fill="${color}" text-anchor="middle">${escapeXml(text)}</text>`;
}

/** An object: a soft rounded block centred on the pin, with its name underneath. */
function objectMarker(cx, cy, label) {
  return `
    <g>
      <rect x="${cx - 80}" y="${cy - 80}" width="160" height="160" rx="36" fill="${C.paper}" stroke="${C.terracotta}" stroke-width="7"/>
      <rect x="${cx - 80}" y="${cy + 60}" width="160" height="22" rx="11" fill="rgba(59,42,32,0.12)"/>
      ${labelPill(cx, cy + 135, label, 40)}
    </g>`;
}

/** A door shape centred on the doorway pin. */
function door(cx, cy) {
  const w = 190;
  const h = 330;
  const x = cx - w / 2;
  const y = cy - h / 2;
  return `
    <path d="M${x} ${y + h} V${y + w / 2} a${w / 2} ${w / 2} 0 0 1 ${w} 0 V${y + h} Z" fill="${C.door}" stroke="${C.doorFrame}" stroke-width="12"/>
    <circle cx="${x + w - 38}" cy="${y + h * 0.6}" r="10" fill="${C.paperShade}"/>`;
}

/** @param {{ x: number, y: number, w?: number, h?: number, radius: number }} light */
function windowShape(light) {
  const cx = light.x * ROOM_W;
  const cy = light.y * ROOM_H;
  const r = light.radius * ROOM_W;
  const w = r * 1.5 * (light.w ?? 1);
  const h = r * 1.5 * (light.h ?? 1);
  return `
    <rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="14" fill="${C.window}" stroke="${C.paper}" stroke-width="14"/>
    <line x1="${cx}" y1="${cy - h / 2}" x2="${cx}" y2="${cy + h / 2}" stroke="${C.paper}" stroke-width="10"/>
    <line x1="${cx - w / 2}" y1="${cy}" x2="${cx + w / 2}" y2="${cy}" stroke="${C.paper}" stroke-width="10"/>`;
}

const interiorShell = `
  <ellipse cx="1600" cy="1650" rx="1300" ry="110" fill="rgba(59,42,32,0.07)"/>
  <polygon points="400,1120 1600,640 1600,120 400,600" fill="${C.wallLeft}"/>
  <polygon points="1600,640 2800,1120 2800,600 1600,120" fill="${C.wallRight}"/>
  <polygon points="400,600 1600,120 1600,90 400,570" fill="${C.wallTop}"/>
  <polygon points="1600,120 2800,600 2800,570 1600,90" fill="${C.wallTop}"/>
  <polygon points="400,1120 1600,640 2800,1120 1600,1600" fill="${C.floor}"/>
  <polygon points="400,1120 1600,1600 1600,1660 400,1180" fill="${C.floorLeft}"/>
  <polygon points="1600,1600 2800,1120 2800,1180 1600,1660" fill="${C.floorRight}"/>
  <polygon points="700,1120 1600,760 2500,1120 1600,1480" fill="rgba(200,100,59,0.10)"/>`;

const exteriorShell = `
  <ellipse cx="1600" cy="1560" rx="1450" ry="190" fill="${C.ground}"/>
  <ellipse cx="1600" cy="1490" rx="1000" ry="60" fill="rgba(59,42,32,0.08)"/>
  <rect x="760" y="560" width="1680" height="900" rx="10" fill="${C.facade}"/>
  <rect x="760" y="1400" width="1680" height="60" fill="rgba(59,42,32,0.10)"/>
  <polygon points="660,600 1600,170 2540,600" fill="${C.roof}"/>
  <polygon points="660,600 2540,600 2540,640 660,640" fill="rgba(59,42,32,0.18)"/>
  <polygon points="1500,1460 1700,1460 1820,1700 1380,1700" fill="${C.paperShade}"/>`;

/**
 * A 3200×1800 isometric diorama generated from the room JSON, so pins line up
 * with the boxes (handoff §14.6).
 * @param {any} room
 */
export function roomPlaceholderSvg(room) {
  const exterior = room.id === 'front';
  const windows = (room.lights ?? []).filter((l) => l.kind === 'window').map(windowShape);
  const doors = room.doorways.map((d) => door(d.x * ROOM_W, d.y * ROOM_H));
  const objects = room.objects
    .filter((o) => o.enabled !== false)
    .map((o) => {
      const label = o.name.en.includes('PLACEHOLDER') ? o.id : o.name.en;
      return objectMarker(o.x * ROOM_W, o.y * ROOM_H, label);
    });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ROOM_W}" height="${ROOM_H}" viewBox="0 0 ${ROOM_W} ${ROOM_H}">
  <rect width="100%" height="100%" fill="${C.canvas}"/>
  ${exterior ? exteriorShell : interiorShell}
  ${windows.join('')}
  ${doors.join('')}
  ${objects.join('')}
  ${labelPill(ROOM_W - 260, ROOM_H - 70, 'placeholder art', 36, C.paperShade, C.inkSoft)}
</svg>`;
}

/**
 * A 1200×900 paper card with an outline picture icon and a name (handoff §14.6).
 * @param {string} title  e.g. the object name
 * @param {string} subtitle  e.g. the file path to upload
 */
export function cardPlaceholderSvg(title, subtitle) {
  const cx = CARD_W / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}">
  <rect width="100%" height="100%" fill="${C.paper}"/>
  <rect x="28" y="28" width="${CARD_W - 56}" height="${CARD_H - 56}" rx="40" fill="none" stroke="${C.paperShade}" stroke-width="8"/>
  <g fill="none" stroke="${C.terracotta}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">
    <rect x="${cx - 150}" y="230" width="300" height="230" rx="30"/>
    <circle cx="${cx + 60}" cy="300" r="26"/>
    <polyline points="${cx - 150},430 ${cx - 50},340 ${cx + 30},410 ${cx + 80},370 ${cx + 150},430"/>
  </g>
  <text x="${cx}" y="580" font-family="${FONT}" font-size="58" font-weight="700" fill="${C.ink}" text-anchor="middle">${escapeXml(title)}</text>
  <text x="${cx}" y="650" font-family="${FONT}" font-size="34" fill="${C.inkSoft}" text-anchor="middle">${escapeXml(subtitle)}</text>
  ${labelPill(CARD_W - 200, CARD_H - 80, 'placeholder', 30, C.paperShade, C.inkSoft)}
</svg>`;
}

/**
 * Who uses each image, so placeholder cards can show a helpful name.
 * @param {any[]} rooms
 * @returns {Map<string, { title: string, room?: any }>}
 */
export function imageOwners(rooms) {
  const owners = new Map();
  for (const room of rooms) {
    owners.set(room.image, { title: room.name.en, room });
    for (const obj of room.objects) {
      const name = obj.name.en.includes('PLACEHOLDER') ? obj.id : obj.name.en;
      for (const block of obj.blocks) {
        if (block.type === 'image') owners.set(block.src, { title: name });
        if (block.type === 'gallery') {
          block.items.forEach((item, i) => owners.set(item.src, { title: `${name} ${i + 1}` }));
        }
      }
    }
  }
  return owners;
}
