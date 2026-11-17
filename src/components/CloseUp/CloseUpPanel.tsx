import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { m, useIsPresent } from 'motion/react';
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

import type { Room, RoomObject } from '../../content/schema.ts';
import { useT } from '../../content/useT.ts';
import { useFocusTrap } from '../../hooks/useFocusTrap.ts';
import { Blocks } from './blocks/Blocks.tsx';
import styles from './CloseUpPanel.module.css';

interface Props {
  room: Room;
  object: RoomObject;
  /** Objects that open a panel, in room order, for previous/next. */
  siblings: RoomObject[];
  isDesktop: boolean;
  reducedMotion: boolean;
  /** Seconds to wait before sliding in (lets the camera move first, §5.1). */
  enterDelay: number;
  onClose: () => void;
  onOpenObject: (objectId: string) => void;
}

const EASE_OUT_SOFT = [0.22, 1, 0.36, 1] as const;

/**
 * The close-up (handoff §5.3): a right-side panel on desktop, a draggable
 * bottom sheet on phones. It's a modal dialog: focus starts on the title,
 * stays inside, and Esc closes it.
 */
export function CloseUpPanel(props: Props) {
  const { room, object, siblings, isDesktop, reducedMotion, enterDelay, onClose, onOpenObject } =
    props;
  const { t, ui } = useT();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [dragY, setDragY] = useState(0);
  const drag = useRef<{ startY: number; id: number } | null>(null);

  // While the panel animates out, it no longer holds focus or listens for Esc.
  const isPresent = useIsPresent();
  useFocusTrap(panelRef, isPresent);

  // New object: start at the top and move focus to its title.
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
    titleRef.current?.focus({ preventScroll: true });
  }, [object.id]);

  // Esc closes, unless a menu or lightbox on top handles it first.
  useEffect(() => {
    if (!isPresent) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (document.querySelector('dialog[open]')) return;
      e.preventDefault();
      onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, isPresent]);

  const index = siblings.findIndex((o) => o.id === object.id);
  const prev =
    siblings.length > 1 ? siblings[(index - 1 + siblings.length) % siblings.length] : undefined;
  const next = siblings.length > 1 ? siblings[(index + 1) % siblings.length] : undefined;

  // Bottom sheet: drag the handle up to expand, down to dismiss (§5.3).
  const onHandleDown = (e: ReactPointerEvent) => {
    drag.current = { startY: e.clientY, id: e.pointerId };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onHandleMove = (e: ReactPointerEvent) => {
    if (drag.current?.id !== e.pointerId) return;
    setDragY(e.clientY - drag.current.startY);
  };
  const onHandleUp = (e: ReactPointerEvent) => {
    if (drag.current?.id !== e.pointerId) return;
    const dy = e.clientY - drag.current.startY;
    drag.current = null;
    setDragY(0);
    if (dy > 120) {
      if (expanded) setExpanded(false);
      else onClose();
    } else if (dy < -60) setExpanded(true);
  };

  const hidden = reducedMotion ? { opacity: 0 } : isDesktop ? { x: '110%' } : { y: '100%' };
  const shown = reducedMotion ? { opacity: 1 } : isDesktop ? { x: 0 } : { y: 0 };
  const titleId = 'closeup-title';

  return (
    <>
      {!isDesktop && (
        <m.div
          className={styles.scrim}
          aria-hidden="true"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.32, delay: enterDelay } }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
        />
      )}
      <m.div
        ref={panelRef}
        className={isDesktop ? styles.panel : styles.sheet}
        data-expanded={expanded || undefined}
        style={dragY ? { translate: `0 ${Math.max(dragY, expanded ? 0 : -200)}px` } : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="closeup"
        initial={hidden}
        animate={{
          ...shown,
          transition: { duration: 0.42, ease: EASE_OUT_SOFT, delay: enterDelay },
        }}
        exit={{ ...hidden, transition: { duration: 0.28, ease: EASE_OUT_SOFT } }}
      >
        {!isDesktop && (
          <div
            className={styles.handleArea}
            onPointerDown={onHandleDown}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
            onPointerCancel={onHandleUp}
            aria-hidden="true"
          >
            <span className={styles.handle} />
          </div>
        )}
        <button type="button" className={styles.close} onClick={onClose} aria-label={ui('close')}>
          <X size={22} strokeWidth={1.75} aria-hidden="true" />
        </button>

        <m.div
          key={object.id}
          className={styles.body}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <p className={styles.kicker}>
            {t(room.name)} · {t(room.theme)}
          </p>
          <h2 ref={titleRef} id={titleId} className={styles.title} tabIndex={-1} data-autofocus>
            {t(object.title)}
          </h2>
          <Blocks blocks={object.blocks} title={t(object.title)} />
        </m.div>

        {prev && next && (
          <nav className={styles.footer} aria-label={t(room.name)}>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => onOpenObject(prev.id)}
            >
              <ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" />
              {ui('previous')}
            </button>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => onOpenObject(next.id)}
            >
              {ui('nextInRoom')}
              <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </nav>
        )}
      </m.div>
    </>
  );
}
