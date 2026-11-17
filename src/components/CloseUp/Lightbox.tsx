import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { assetUrl, getImage, srcSet } from '../../content/images.ts';
import { useT } from '../../content/useT.ts';
import styles from './Lightbox.module.css';

export interface LightboxItem {
  src: string;
  alt: string;
  caption?: string;
}

interface Props {
  items: LightboxItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/** Full-screen image viewer (§5.4): Esc closes, arrows/buttons step through galleries,
 *  pinch-zoom works on phones. Loaded only when first opened. */
export default function Lightbox({ items, index, onIndexChange, onClose }: Props) {
  const { ui } = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const item = items[index];
  const entry = item && getImage(item.src);
  const many = items.length > 1;
  const step = (d: number) => onIndexChange((index + d + items.length) % items.length);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = document.activeElement as HTMLElement | null;
    if (!dialog.open) dialog.showModal();
    // Unmounting removes the dialog without firing "close"; just hand focus back.
    return () => opener?.focus({ preventScroll: true });
  }, []);

  if (!item) return null;
  return (
    <dialog
      ref={dialogRef}
      className={styles.lightbox}
      aria-label={item.alt}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (!many) return;
        if (e.key === 'ArrowLeft') step(-1);
        if (e.key === 'ArrowRight') step(1);
      }}
    >
      <figure className={styles.figure} onClick={(e) => e.target === e.currentTarget && onClose()}>
        {entry ? (
          <img
            className={styles.image}
            src={assetUrl(entry.variants[entry.variants.length - 1]!.src)}
            srcSet={srcSet(entry)}
            sizes="100vw"
            alt={item.alt}
          />
        ) : (
          <p className={styles.missing}>{item.alt}</p>
        )}
        <figcaption className={styles.caption}>
          {item.caption}
          {many && (
            <span className={styles.counter}>
              {ui('counter', { n: index + 1, total: items.length })}
            </span>
          )}
        </figcaption>
      </figure>
      <button
        type="button"
        className={`${styles.button} ${styles.close}`}
        onClick={onClose}
        aria-label={ui('close')}
        autoFocus
      >
        <X size={24} strokeWidth={1.75} aria-hidden="true" />
      </button>
      {many && (
        <>
          <button
            type="button"
            className={`${styles.button} ${styles.prev}`}
            onClick={() => step(-1)}
            aria-label={ui('previous')}
          >
            <ChevronLeft size={26} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.next}`}
            onClick={() => step(1)}
            aria-label={ui('next')}
          >
            <ChevronRight size={26} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </>
      )}
    </dialog>
  );
}
