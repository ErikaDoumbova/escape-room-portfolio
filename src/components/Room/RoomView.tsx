import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { getImage } from '../../content/images.ts';
import type { Room, RoomObject } from '../../content/schema.ts';
import { usePan } from '../../hooks/usePan.ts';
import { computeCameraTransform } from '../../lib/camera.ts';
import { Pins } from './Pins.tsx';
import { RoomImage } from './RoomImage.tsx';
import styles from './RoomView.module.css';

interface Props {
  room: Room;
  reducedMotion: boolean;
  /** The object whose close-up is open; the camera zooms to it (§5.1). */
  activeObject?: RoomObject;
  /** Desktop: clicking the room outside the panel closes the close-up. */
  onBackgroundClick?: () => void;
}

const DEFAULT_ZOOM = 1.8;

/**
 * One room: the scene is as tall as the window and as wide as the image's
 * aspect ratio allows (handoff §4.1 fit rule). Narrower than the window → centred;
 * wider → pans horizontally, starting centred on `initialFocusX`.
 */
export function RoomView({ room, reducedMotion, activeObject, onBackgroundClick }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const image = getImage(room.image);
  const aspect = image?.aspect ?? 16 / 9;
  const zoomed = !!activeObject && !reducedMotion;
  const pannable = usePan(viewportRef, reducedMotion, !!activeObject);
  const [sceneWidth, setSceneWidth] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const wasZoomed = useRef(false);

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

  // Camera (§5.2): move the whole scene so the object lands beside the panel.
  // CSS transitions animate it, and a new target simply retargets mid-flight.
  useEffect(() => {
    const viewport = viewportRef.current;
    const scene = sceneRef.current;
    if (!viewport || !scene) return;

    const apply = () => {
      if (!activeObject || reducedMotion) {
        scene.style.transform = '';
        setZoomScale(1);
        return;
      }
      const t = computeCameraTransform({
        sceneW: scene.offsetWidth,
        sceneH: scene.offsetHeight,
        offsetX: scene.offsetLeft - viewport.scrollLeft,
        offsetY: scene.offsetTop - viewport.scrollTop,
        viewportW: viewport.clientWidth,
        viewportH: viewport.clientHeight,
        focusX: activeObject.zoom?.x ?? activeObject.x,
        focusY: activeObject.zoom?.y ?? activeObject.y,
        scale: activeObject.zoom?.scale ?? DEFAULT_ZOOM,
        naturalW: image?.width ?? scene.offsetWidth,
      });
      setZoomScale(t.scale);
      scene.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.scale})`;
    };

    // Closing: the panel leaves first, then the camera returns (§5.1).
    scene.style.transitionDelay = !activeObject && wasZoomed.current ? '200ms' : '0ms';
    wasZoomed.current = !!activeObject;
    // Wait a frame so a deep link animates in from the whole room.
    const frame = requestAnimationFrame(apply);
    window.addEventListener('resize', apply);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', apply);
    };
  }, [activeObject, reducedMotion, room, image]);

  return (
    <div
      ref={viewportRef}
      className={styles.viewport}
      data-pannable={(pannable && !activeObject) || undefined}
      data-zoomed={zoomed || undefined}
      data-locked={!!activeObject || undefined}
      data-testid="room-viewport"
      onClick={(e) => {
        if (activeObject && onBackgroundClick && !(e.target as HTMLElement).closest('button, a')) {
          onBackgroundClick();
        }
      }}
    >
      <div className={styles.track}>
        <div
          ref={sceneRef}
          className={styles.scene}
          style={{ aspectRatio: String(aspect) }}
          data-room={room.id}
        >
          <RoomImage room={room} image={image} sceneWidth={sceneWidth * zoomScale} />
          <Pins room={room} activeObjectId={activeObject?.id} />
        </div>
      </div>
    </div>
  );
}
