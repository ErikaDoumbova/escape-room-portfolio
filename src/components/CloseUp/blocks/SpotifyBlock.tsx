import { Music } from 'lucide-react';
import { useState } from 'react';

import { site } from '../../../content/load.ts';
import type { Block } from '../../../content/schema.ts';
import { useT } from '../../../content/useT.ts';
import { safeSpotifyUrl } from '../../../lib/spotify.ts';
import styles from './blocks.module.css';

type Of<T extends Block['type']> = Extract<Block, { type: T }>;

/** Click-to-load: nothing is requested from Spotify until the visitor asks (§11.2). */
export function SpotifyBlock({ block }: { block: Of<'spotify'> }) {
  const { t, ui } = useT();
  const [loaded, setLoaded] = useState(false);
  const url = safeSpotifyUrl(block.embedUrl ?? site.spotifyEmbedUrl);
  const title = t(block.title);

  if (loaded && url) {
    return (
      <iframe
        className={styles.spotifyFrame}
        src={url}
        title={title}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    );
  }
  return (
    <div className={styles.spotifyCard}>
      <Music size={22} strokeWidth={1.75} aria-hidden="true" className={styles.spotifyIcon} />
      <div className={styles.spotifyText}>
        <p className={styles.spotifyTitle}>{title}</p>
        <p className={styles.spotifyNotice}>{url ? ui('spotifyNotice') : ui('playlistSoon')}</p>
      </div>
      {url && (
        <button type="button" className={styles.pillButton} onClick={() => setLoaded(true)}>
          {ui('loadPlayer')}
        </button>
      )}
    </div>
  );
}
