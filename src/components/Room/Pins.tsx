import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router';

import { enabledObjects, getLiveRoom, objectPath, roomPath } from '../../content/load.ts';
import type { Doorway, Room, RoomObject } from '../../content/schema.ts';
import { useT } from '../../content/useT.ts';
import styles from './Pins.module.css';

type PinItem = { kind: 'object'; item: RoomObject } | { kind: 'doorway'; item: Doorway };

const ARROWS = { left: ArrowLeft, right: ArrowRight, up: ArrowUp, down: ArrowDown } as const;

/** Reading order for keyboard users: top to bottom, then left to right (§3.3). */
function readingOrder(a: PinItem, b: PinItem) {
  return a.item.y - b.item.y || a.item.x - b.item.x;
}

const position = (x: number, y: number): CSSProperties => ({
  left: `${x * 100}%`,
  top: `${y * 100}%`,
});

export function Pins({ room }: { room: Room }) {
  const items: PinItem[] = [
    ...enabledObjects(room).map((item) => ({ kind: 'object' as const, item })),
    ...room.doorways
      .filter((d) => getLiveRoom(d.to))
      .map((item) => ({ kind: 'doorway' as const, item })),
  ].sort(readingOrder);

  let objectIndex = 0;
  return (
    <div className={styles.layer}>
      {items.map((pin) =>
        pin.kind === 'object' ? (
          <ObjectPin key={`o-${pin.item.id}`} room={room} object={pin.item} index={objectIndex++} />
        ) : (
          <DoorwayPin key={`d-${pin.item.to}`} doorway={pin.item} />
        ),
      )}
    </div>
  );
}

function ObjectPin({ room, object, index }: { room: Room; object: RoomObject; index: number }) {
  const { t, ui } = useT();
  const navigate = useNavigate();
  const name = t(object.name);
  return (
    <button
      type="button"
      className={styles.objectPin}
      style={
        { ...position(object.x, object.y), '--pin-delay': `${index * 300}ms` } as CSSProperties
      }
      aria-label={`${ui('open')}: ${name}`}
      data-object={object.id}
      onClick={() => navigate(objectPath(room.id, object.id))}
    >
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.label} aria-hidden="true">
        {name}
      </span>
    </button>
  );
}

function DoorwayPin({ doorway }: { doorway: Doorway }) {
  const { t, ui } = useT();
  const target = getLiveRoom(doorway.to);
  if (!target) return null;
  const roomName = t(target.name);
  const label = doorway.label
    ? t(doorway.label)
    : doorway.direction === 'left'
      ? `← ${roomName}`
      : `${roomName} →`;
  const goTo = `${ui('goTo')}: ${roomName}`;
  // Keep the visible words in the accessible name (WCAG 2.5.3).
  const ariaLabel = doorway.label ? `${label.replace(/[←→↑↓]/g, '').trim()}. ${goTo}` : goTo;
  const Arrow = ARROWS[doorway.direction];

  return (
    <Link
      to={roomPath(target.id)}
      className={styles.doorPin}
      style={position(doorway.x, doorway.y)}
      aria-label={ariaLabel}
      data-direction={doorway.direction}
      data-doorway={target.id}
    >
      <span className={styles.door} aria-hidden="true">
        <Arrow className={styles.arrow} size={20} strokeWidth={2.25} />
      </span>
      <span className={`${styles.label} ${styles.doorLabel}`} aria-hidden="true">
        {label}
      </span>
    </Link>
  );
}
