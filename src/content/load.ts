// Typed content for the app (handoff §13). JSON is validated in CI by
// scripts/validate-content.mjs, and again here in dev for quick feedback.
import siteJson from '../../content/site.json';
import type { Room, RoomObject, Site } from './schema.ts';

const roomModules = import.meta.glob<Room>('../../content/rooms/*.json', {
  eager: true,
  import: 'default',
});

export const site = siteJson as Site;

const allRooms = Object.values(roomModules);
const roomsById = new Map(allRooms.map((r) => [r.id, r]));

/** Live rooms, in the order of site.rooms (handoff §12.3). */
export const liveRooms: Room[] = site.rooms.flatMap((id) => {
  const room = roomsById.get(id);
  return room ? [room] : [];
});

export function getLiveRoom(id: string | undefined): Room | undefined {
  return id && site.rooms.includes(id) ? roomsById.get(id) : undefined;
}

export function enabledObjects(room: Room): RoomObject[] {
  return room.objects.filter((o) => o.enabled !== false);
}

export function getObject(room: Room, id: string | undefined): RoomObject | undefined {
  return enabledObjects(room).find((o) => o.id === id);
}

/** The front room lives at "/"; every other room at "/<id>". */
export function roomPath(roomId: string): string {
  return roomId === 'front' ? '/' : `/${roomId}`;
}

export function objectPath(roomId: string, objectId: string): string {
  return `/${roomId}/${objectId}`;
}

if (import.meta.env.DEV) {
  void import('./devCheck.ts').then((m) => m.devCheck(siteJson, roomModules));
}
