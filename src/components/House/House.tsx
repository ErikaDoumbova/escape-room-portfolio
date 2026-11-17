import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router';

import { getImage } from '../../content/images.ts';
import { getLiveRoom, getObject, roomPath, site } from '../../content/load.ts';
import type { Room } from '../../content/schema.ts';
import { useT } from '../../content/useT.ts';
import { ExploreMenu } from '../ExploreMenu/ExploreMenu.tsx';
import { RoomView } from '../Room/RoomView.tsx';
import { useToast } from '../Toast/toastContext.ts';
import { TopBar } from '../TopBar/TopBar.tsx';
import styles from './House.module.css';
import { RoomCaption } from './RoomCaption.tsx';

const EASE_COZY = [0.65, 0, 0.35, 1] as const;

/** Parse "/", "/kitchen", "/kitchen/stuffed-peppers" (handoff §3.1). */
function useHouseRoute() {
  const { pathname } = useLocation();
  const parts = pathname.split('/').filter(Boolean);
  const [roomId = 'front', objectId, ...rest] = parts;
  const room = rest.length ? undefined : getLiveRoom(roomId);
  return { parts, room, objectId };
}

/** Unknown address: back to the front door with a small note. */
function NotFound() {
  const toast = useToast();
  const { ui } = useT();
  useEffect(() => toast(ui('notFound')), [toast, ui]);
  return <Navigate to="/" replace />;
}

export function House() {
  const { parts, room, objectId } = useHouseRoute();

  if (!room) return <NotFound />;
  if (parts.length === 1 && room.id === 'front') return <Navigate to="/" replace />;
  if (objectId && !getObject(room, objectId)) return <Navigate to={roomPath(room.id)} replace />;
  return <HouseView room={room} objectId={objectId} />;
}

function HouseView({ room, objectId }: { room: Room; objectId?: string }) {
  const { t } = useT();
  const reducedMotion = useReducedMotion() ?? false;
  const [exploreOpen, setExploreOpen] = useState(false);
  const exploreButtonRef = useRef<HTMLButtonElement>(null);
  const captionRef = useRef<HTMLHeadingElement>(null);
  const previousRoom = useRef(room.id);

  // Page background = the room image's background colour, so wide windows blend in.
  useLayoutEffect(() => {
    document.body.style.backgroundColor = getImage(room.image)?.bgColor ?? '';
  }, [room]);

  // Title per view (handoff §3.1).
  const object = objectId ? getObject(room, objectId) : undefined;
  useEffect(() => {
    const siteName = t(site.name);
    const parts = room.id === 'front' && !object ? [t(site.seo.title)] : [t(room.name), siteName];
    if (object) parts.unshift(t(object.name));
    document.title = parts.join(' · ');
  }, [room, object, t]);

  // After moving to another room, put keyboard/screen-reader focus on its name.
  useEffect(() => {
    if (previousRoom.current === room.id) return;
    previousRoom.current = room.id;
    captionRef.current?.focus({ preventScroll: true });
  }, [room.id]);

  const transition = reducedMotion ? { duration: 0.2 } : { duration: 0.6, ease: EASE_COZY };

  return (
    <>
      <TopBar
        onExplore={() => setExploreOpen(true)}
        exploreOpen={exploreOpen}
        exploreButtonRef={exploreButtonRef}
      />
      <RoomCaption ref={captionRef} room={room} />
      <main className={styles.stage}>
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={room.id}
            className={styles.roomLayer}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04, filter: 'blur(6px)' }}
            transition={transition}
          >
            <RoomView room={room} reducedMotion={reducedMotion} />
          </m.div>
        </AnimatePresence>
      </main>
      <ExploreMenu
        open={exploreOpen}
        onClose={() => setExploreOpen(false)}
        returnFocusRef={exploreButtonRef}
      />
    </>
  );
}
