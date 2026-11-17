import { Headphones } from 'lucide-react';

import type { Block } from '../../../content/schema.ts';
import { useT } from '../../../content/useT.ts';
import { useSound } from '../../../state/contexts.ts';
import styles from './blocks.module.css';

type Of<T extends Block['type']> = Extract<Block, { type: T }>;

export function ParagraphBlock({ block }: { block: Of<'paragraph'> }) {
  const { t } = useT();
  return <p className={styles.paragraph}>{t(block.text)}</p>;
}

export function QuoteBlock({ block }: { block: Of<'quote'> }) {
  const { t } = useT();
  return (
    <figure className={styles.quote}>
      <blockquote>{t(block.text)}</blockquote>
      {block.cite && <figcaption>{t(block.cite)}</figcaption>}
    </figure>
  );
}

export function ListBlock({ block }: { block: Of<'list'> }) {
  const { t } = useT();
  return (
    <ul className={styles.list}>
      {block.items.map((item, i) => (
        <li key={i}>
          <span className={styles.listTitle}>{item.title}</span>
          {item.subtitle && <span className={styles.listSubtitle}>{t(item.subtitle)}</span>}
          {item.note && <span className={styles.listNote}>{t(item.note)}</span>}
        </li>
      ))}
    </ul>
  );
}

/** The headphones' "turn on room sound" switch: same state as the top bar (§5.5). */
export function SoundToggleBlock() {
  const { ui } = useT();
  const { soundOn, setSoundOn } = useSound();
  return (
    <div className={styles.soundRow}>
      <button
        type="button"
        className={styles.pillButton}
        aria-pressed={soundOn}
        onClick={() => setSoundOn(!soundOn)}
      >
        <Headphones size={18} strokeWidth={1.75} aria-hidden="true" />
        {soundOn ? ui('soundOff') : ui('soundOn')}
      </button>
      <span className={styles.soundState}>{soundOn ? ui('soundIsOn') : ui('soundIsOff')}</span>
    </div>
  );
}
