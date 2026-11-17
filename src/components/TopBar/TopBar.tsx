import { Compass } from 'lucide-react';
import type { Ref } from 'react';
import { Link } from 'react-router';

import { site } from '../../content/load.ts';
import { useT } from '../../content/useT.ts';
import styles from './TopBar.module.css';

interface Props {
  onExplore: () => void;
  exploreOpen: boolean;
  exploreButtonRef: Ref<HTMLButtonElement>;
}

/** Fixed bar over the scene (handoff §2.5). M3 adds the time, language and sound controls. */
export function TopBar({ onExplore, exploreOpen, exploreButtonRef }: Props) {
  const { t, ui } = useT();
  return (
    <header className={styles.bar}>
      <Link to="/" className={`${styles.pill} ${styles.wordmark}`}>
        {t(site.name)}
      </Link>
      <div className={styles.controls}>
        <button
          ref={exploreButtonRef}
          type="button"
          className={styles.pill}
          aria-haspopup="dialog"
          aria-expanded={exploreOpen}
          onClick={onExplore}
        >
          <Compass size={18} strokeWidth={1.75} aria-hidden="true" />
          {ui('explore')}
        </button>
      </div>
    </header>
  );
}
