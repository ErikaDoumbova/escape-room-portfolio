import { useLayoutEffect, useRef, useState } from 'react';

import { getImage } from '../../content/images.ts';
import type { Room } from '../../content/schema.ts';
import { usePan } from '../../hooks/usePan.ts';
import { Pins } from './Pins.tsx';
import { RoomImage } from './RoomImage.tsx';
import styles from './RoomView.module.css';

interface Props {
  room: Room;
  reducedMotion: boolean;
}

/**
 * One room: the scene is as tall as the window and as wide as the image's
 * aspect ratio allows (handoff §4.1 fit rule). Narrower than the window → centred;
 * wider → pans horizontally, starting centred on `initialFocusX`.
 */
export function RoomView({ room, reducedMotion }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const image = getImage(room.image);
  const aspect = image?.aspect ?? 16 / 9;
  const pannable = usePan(viewportRef, reducedMotion);
  const [sceneWidth, setSceneWidth] = useState(0);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const scene = sceneRef.current;
    if (!viewport || !scene) return;
    const focusX = room.initialFocusX ?? 0.5;
    viewport.scrollLeft = focusX * scene.offsetWidth - viewport.clientWidth / 2;
    viewport.scrollTop = (scene.offsetHeight - viewport.clientHeight) / 2;

    const ro = new ResizeObserver(() => setSceneWidth(scene.offsetWidth));
    ro.observe(scene);
    return () => ro.disconnect();
  }, [room]);

  return (
    <div
      ref={viewportRef}
      className={styles.viewport}
      data-pannable={pannable || undefined}
      data-testid="room-viewport"
    >
      <div className={styles.track}>
        <div
          ref={sceneRef}
          className={styles.scene}
          style={{ aspectRatio: String(aspect) }}
          data-room={room.id}
        >
          <RoomImage room={room} image={image} sceneWidth={sceneWidth} />
          <Pins room={room} />
        </div>
      </div>
    </div>
  );
}
