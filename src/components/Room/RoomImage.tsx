import { useEffect, useRef, useState } from 'react';

import {
  assetUrl,
  getImage,
  srcSet,
  variantAtLeast,
  type ImageEntry,
} from '../../content/images.ts';
import { getLiveRoom } from '../../content/load.ts';
import type { Room } from '../../content/schema.ts';
import { useT } from '../../content/useT.ts';
import styles from './RoomImage.module.css';

interface Props {
  room: Room;
  image: ImageEntry | undefined;
  sceneWidth: number;
}

/** Blurred tiny preview first, then the full image fades in (handoff §6.2). */
export function RoomImage({ room, image, sceneWidth }: Props) {
  const { t } = useT();
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setLoaded(true);
  }, []);

  // Once this room is in, warm up the rooms its doorways lead to (handoff §4.1).
  useEffect(() => {
    if (!loaded) return;
    for (const doorway of room.doorways) {
      const target = getLiveRoom(doorway.to);
      const entry = target && getImage(target.image);
      const variant = entry && variantAtLeast(entry, 1600);
      if (variant) new Image().src = assetUrl(variant.src);
    }
  }, [loaded, room]);

  if (!image) {
    return <div className={styles.missing} role="img" aria-label={t(room.imageAlt)} />;
  }

  const fallback = variantAtLeast(image, 1600);
  return (
    <>
      <img className={styles.lqip} src={image.lqip} alt="" aria-hidden="true" />
      <img
        ref={imgRef}
        className={styles.full}
        src={fallback ? assetUrl(fallback.src) : undefined}
        srcSet={srcSet(image)}
        sizes={sceneWidth ? `${Math.ceil(sceneWidth)}px` : `calc(100vh * ${image.aspect})`}
        width={image.width}
        height={image.height}
        alt={t(room.imageAlt)}
        fetchPriority="high"
        decoding="async"
        draggable={false}
        data-loaded={loaded || undefined}
        onLoad={() => setLoaded(true)}
      />
    </>
  );
}
