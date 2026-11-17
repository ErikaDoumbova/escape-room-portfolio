/** Only https://open.spotify.com/embed/... URLs may load in the player iframe. */
export function safeSpotifyUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' &&
      u.hostname === 'open.spotify.com' &&
      u.pathname.startsWith('/embed/')
      ? u.toString()
      : undefined;
  } catch {
    return undefined;
  }
}
