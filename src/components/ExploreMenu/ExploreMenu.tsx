import { X } from 'lucide-react';
import { useEffect, useRef, type RefObject } from 'react';
import { Link } from 'react-router';

import { assetUrl, getImage } from '../../content/images.ts';
import { enabledObjects, liveRooms, objectPath, roomPath } from '../../content/load.ts';
import { useT } from '../../content/useT.ts';
import { ContactRow } from './ContactRow.tsx';
import styles from './ExploreMenu.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}

/**
 * Every room and object in one place (handoff §3.4). A native modal <dialog>
 * keeps focus inside and closes on Esc; focus then returns to Explore.
 * M4 adds discovery progress and the quick tour link.
 */
export function ExploreMenu({ open, onClose, returnFocusRef }: Props) {
  const { t, ui } = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const wasOpen = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      wasOpen.current = true;
      return;
    }
    if (dialog.open) dialog.close();
    if (wasOpen.current) {
      wasOpen.current = false;
      returnFocusRef.current?.focus();
    }
  }, [open, returnFocusRef]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="explore-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // click on the backdrop
      }}
    >
      <div className={styles.inner}>
        <header className={styles.header}>
          <h2 id="explore-title" className={styles.title}>
            {ui('exploreTitle')}
          </h2>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onClose}
            aria-label={ui('close')}
          >
            <X size={22} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </header>

        <ul className={styles.rooms}>
          {liveRooms.map((room) => {
            const image = getImage(room.image);
            const thumb = image?.variants[0];
            return (
              <li key={room.id} className={styles.card}>
                <Link to={roomPath(room.id)} className={styles.roomLink} onClick={onClose}>
                  {thumb && (
                    <img
                      className={styles.thumb}
                      src={assetUrl(thumb.src)}
                      alt=""
                      width={thumb.w}
                      height={Math.round(thumb.w / (image.aspect || 16 / 9))}
                      loading="lazy"
                      style={{ background: image.bgColor }}
                    />
                  )}
                  <span className={styles.roomName}>{t(room.name)}</span>
                  <span className={styles.theme}>{t(room.theme)}</span>
                </Link>
                <ul className={styles.objects} aria-label={t(room.name)}>
                  {enabledObjects(room)
                    .filter((o) => o.blocks.length > 0)
                    .map((obj) => (
                      <li key={obj.id}>
                        <Link
                          to={objectPath(room.id, obj.id)}
                          className={styles.objectLink}
                          onClick={onClose}
                        >
                          {t(obj.name)}
                        </Link>
                      </li>
                    ))}
                </ul>
              </li>
            );
          })}
        </ul>

        <ContactRow />
        <p className={styles.privacy}>{ui('privacyNote')}</p>
      </div>
    </dialog>
  );
}
