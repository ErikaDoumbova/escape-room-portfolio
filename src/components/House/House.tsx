import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';

import { getImage } from '../../content/images.ts';
import {
  enabledObjects,
  getLiveRoom,
  getObject,
  objectPath,
  roomPath,
  site,
} from '../../content/load.ts';
import type { Room, RoomObject } from '../../content/schema.ts';
import { useT } from '../../content/useT.ts';
import { useIsDesktop } from '../../hooks/useMediaQuery.ts';
import { useVisited } from '../../state/contexts.ts';
import { CloseUpPanel } from '../CloseUp/CloseUpPanel.tsx';
import { ExploreMenu } from '../ExploreMenu/ExploreMenu.tsx';
import { RoomView } from '../Room/RoomView.tsx';
import { useToast } from '../Toast/toastContext.ts';
import { TopBar } from '../TopBar/TopBar.tsx';
import styles from './House.module.css';
import { RoomCaption } from './RoomCaption.tsx';

const EASE_COZY = [0.65, 0, 0.35, 1] as const;

/** Objects that open a close-up (the street lamp doesn't, §5.5). */
const opensCloseUp = (o: RoomObject) => !o.special && o.blocks.length > 0;

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
  const object = objectId ? getObject(room, objectId) : undefined;
  if (objectId && (!object || !opensCloseUp(object))) {
    return <Navigate to={roomPath(room.id)} replace />;
  }
  return <HouseView room={room} object={object} />;
}

function HouseView({ room, object }: { room: Room; object?: RoomObject }) {
  const { t } = useT();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion() ?? false;
  const isDesktop = useIsDesktop();
  const { markVisited } = useVisited();
  const [exploreOpen, setExploreOpen] = useState(false);
  const exploreButtonRef = useRef<HTMLButtonElement>(null);
  const captionRef = useRef<HTMLHeadingElement>(null);
  const previousRoom = useRef(room.id);
  const previousObject = useRef<string | undefined>(object?.id);

  const siblings = useMemo(() => enabledObjects(room).filter(opensCloseUp), [room]);
  const closeCloseUp = useCallback(() => navigate(roomPath(room.id)), [navigate, room.id]);
  const openObject = useCallback(
    (objectId: string) => navigate(objectPath(room.id, objectId)),
    [navigate, room.id],
  );

  // Page background = the room image's background colour, so wide windows blend in.
  useLayoutEffect(() => {
    document.body.style.backgroundColor = getImage(room.image)?.bgColor ?? '';
  }, [room]);

  // Title per view (handoff §3.1).
  useEffect(() => {
    const siteName = t(site.name);
    const parts = room.id === 'front' && !object ? [t(site.seo.title)] : [t(room.name), siteName];
    if (object) parts.unshift(t(object.name));
    document.title = parts.join(' · ');
  }, [room, object, t]);

  useEffect(() => {
    if (object) markVisited(room.id, object.id);
  }, [room.id, object, markVisited]);

  // Focus: the room name after moving rooms; the pin after closing a close-up.
  useEffect(() => {
    const closedId = previousObject.current;
    previousObject.current = object?.id;
    if (previousRoom.current !== room.id) {
      previousRoom.current = room.id;
      if (!object) captionRef.current?.focus({ preventScroll: true });
      return;
    }
    if (closedId && !object) {
      document
        .querySelector<HTMLElement>(`[data-room="${room.id}"] [data-object="${closedId}"]`)
        ?.focus({ preventScroll: true });
    }
  }, [room.id, object]);

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
            <RoomView
              room={room}
              reducedMotion={reducedMotion}
              activeObject={object}
              onBackgroundClick={isDesktop ? closeCloseUp : undefined}
            />
          </m.div>
        </AnimatePresence>
      </main>
      <AnimatePresence>
        {object && (
          <CloseUpPanel
            key="closeup"
            room={room}
            object={object}
            siblings={siblings}
            isDesktop={isDesktop}
            reducedMotion={reducedMotion}
            enterDelay={reducedMotion ? 0 : 0.45}
            onClose={closeCloseUp}
            onOpenObject={openObject}
          />
        )}
      </AnimatePresence>
      <ExploreMenu
        open={exploreOpen}
        onClose={() => setExploreOpen(false)}
        returnFocusRef={exploreButtonRef}
      />
    </>
  );
}
