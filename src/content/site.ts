// M0: typed access to content/site.json. M1 replaces this with zod-validated
// loading in src/content/load.ts (handoff §13).
import siteJson from '../../content/site.json';

export type L10n = { en: string; bg?: string };

export type Site = typeof siteJson;

export const site: Site = siteJson;

/** Room ids that are live, in house order. */
export const liveRoomIds: readonly string[] = site.rooms;
