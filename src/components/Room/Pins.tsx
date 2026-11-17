import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router';

import { assetUrl, getImage } from '../../content/images.ts';
import { enabledObjects, getLiveRoom, objectPath, roomPath } from '../../content/load.ts';
import type { Doorway, Room, RoomObject } from '../../content/schema.ts';
import { useT } from '../../content/useT.ts';
import { usePhase, useVisited, visitedKey } from '../../state/contexts.ts';
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

/** Warm the largest room image before zooming, so the close-up stays crisp (§5.2). */
const preloaded = new Set<string>();
function preloadLargest(room: Room) {
  const entry = getImage(room.image);
  const largest = entry?.variants[entry.variants.length - 1];
  if (!largest || preloaded.has(largest.src)) return;
  preloaded.add(largest.src);
  new Image().src = assetUrl(largest.src);
}

interface PinsProps {
  room: Room;
  /** Set while a close-up is open: other pins fade out, this one becomes a ring. */
  activeObjectId?: string;
}

export function Pins({ room, activeObjectId }: PinsProps) {
  const { visited } = useVisited();
  const [bubble, setBubble] = useState<{ id: string; n: number } | null>(null);

  // The street lamp's speech bubble disappears after 3 seconds (§4.2).
  useEffect(() => {
    if (!bubble) return;
    const timer = window.setTimeout(() => setBubble(null), 3000);
    return () => window.clearTimeout(timer);
  }, [bubble]);

  const items: PinItem[] = [
    ...enabledObjects(room).map((item) => ({ kind: 'object' as const, item })),
    ...room.doorways
      .filter((d) => getLiveRoom(d.to))
      .map((item) => ({ kind: 'doorway' as const, item })),
  ].sort(readingOrder);

  let objectIndex = 0;
  return (
    <div
      className={styles.layer}
      data-zoomed={activeObjectId ? true : undefined}
      inert={!!activeObjectId}
    >
      {items.map((pin) =>
        pin.kind === 'object' ? (
          <ObjectPin
            key={`o-${pin.item.id}`}
            room={room}
            object={pin.item}
            index={objectIndex++}
            active={pin.item.id === activeObjectId}
            visited={visited.has(visitedKey(room.id, pin.item.id))}
            onSpecial={() => setBubble((b) => ({ id: pin.item.id, n: (b?.n ?? 0) + 1 }))}
          />
        ) : (
          <DoorwayPin key={`d-${pin.item.to}`} doorway={pin.item} />
        ),
      )}
      {bubble && <Bubble key={bubble.n} object={room.objects.find((o) => o.id === bubble.id)} />}
    </div>
  );
}

interface ObjectPinProps {
  room: Room;
  object: RoomObject;
  index: number;
  active: boolean;
  visited: boolean;
  onSpecial: () => void;
}

function ObjectPin({ room, object, index, active, visited, onSpecial }: ObjectPinProps) {
  const { t, ui } = useT();
  const { cycle } = usePhase();
  const navigate = useNavigate();
  const name = t(object.name);
  const special = object.special === 'cycle-lighting';
  return (
    <button
      type="button"
      className={styles.objectPin}
      style={
        { ...position(object.x, object.y), '--pin-delay': `${index * 300}ms` } as CSSProperties
      }
      aria-label={special ? `${name}: ${ui('lighting')}` : `${ui('open')}: ${name}`}
      data-object={object.id}
      data-active={active || undefined}
      data-visited={visited || undefined}
      onPointerEnter={() => preloadLargest(room)}
      onFocus={() => preloadLargest(room)}
      onClick={() => {
        if (special) {
          cycle();
          onSpecial();
        } else {
          navigate(objectPath(room.id, object.id));
        }
      }}
    >
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.label} aria-hidden="true">
        {name}
      </span>
    </button>
  );
}

/** Speech bubble beside the street lamp; announced politely to screen readers. */
function Bubble({ object }: { object: RoomObject | undefined }) {
  const { t, ui } = useT();
  const { override } = usePhase();
  if (!object?.bubble) return null;
  const right = object.x > 0.5;
  return (
    <div
      className={styles.bubble}
      data-side={right ? 'left' : 'right'}
      style={position(object.x, object.y)}
      role="status"
    >
      <p>{t(object.bubble)}</p>
      <p className={styles.bubblePhase}>
        {ui('lighting')}: {override ? ui(`phase.${override}`) : ui('auto')}
      </p>
    </div>
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
