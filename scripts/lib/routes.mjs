// Pure helpers for scripts/spa-routes.mjs (kept separate so they can be unit-tested).

/**
 * @typedef {{ en: string, bg?: string }} L10n
 * @typedef {{ id: string, enabled?: boolean, name: L10n, blocks?: Array<{ type: string, text?: L10n }> }} RoomObjectLike
 * @typedef {{ id: string, name: L10n, theme: L10n, objects?: RoomObjectLike[] }} RoomLike
 * @typedef {{ name: L10n, rooms: string[], seo: { title: L10n, description: L10n } }} SiteLike
 * @typedef {{ path: string, title: string, description: string }} PageRoute
 */

/**
 * Every static page GitHub Pages needs so a hard refresh never 404s (handoff §15.3).
 * `path` is relative to dist/ ("" is the home page).
 *
 * @param {SiteLike} site
 * @param {Record<string, RoomLike | undefined>} roomsById  room JSON by id; a room
 *   may be missing (its file isn't written yet), in which case it still gets a page.
 * @returns {PageRoute[]}
 */
export function computeRoutes(site, roomsById) {
  const siteName = site.name.en;
  const defaults = { title: site.seo.title.en, description: site.seo.description.en };

  /** @type {PageRoute[]} */
  const routes = [{ path: '', ...defaults }];

  for (const roomId of site.rooms) {
    const room = roomsById[roomId];
    // The front room is the home page (path ""), which is already in the list.
    if (roomId !== 'front') {
      routes.push({
        path: roomId,
        title: room ? `${room.name.en} · ${siteName}` : defaults.title,
        description: room ? room.theme.en : defaults.description,
      });
    }
    if (!room) continue;

    for (const obj of room.objects ?? []) {
      if (obj.enabled === false) continue;
      const firstParagraph = obj.blocks?.find((b) => b.type === 'paragraph' && b.text)?.text?.en;
      routes.push({
        path: `${roomId}/${obj.id}`,
        title: `${obj.name.en} · ${room.name.en} · ${siteName}`,
        description:
          firstParagraph && !firstParagraph.includes('PLACEHOLDER')
            ? truncate(firstParagraph, 160)
            : room.theme.en,
      });
    }
  }

  routes.push({
    path: 'tour',
    title: `Quick tour · ${siteName}`,
    description: defaults.description,
  });

  return routes;
}

/**
 * Replace <title> and <meta name="description"> in an HTML document.
 * @param {string} html
 * @param {{ title: string, description: string }} meta
 */
export function injectMeta(html, { title, description }) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(
      /<meta\s+name="description"[\s\S]*?\/?>/,
      `<meta name="description" content="${escapeHtml(description)}" />`,
    );
}

/** @param {string} s */
export function escapeHtml(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** @param {string} s @param {number} max */
function truncate(s, max) {
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}
