import type { Ref } from 'react';

import type { Room } from '../../content/schema.ts';
import { useT } from '../../content/useT.ts';
import styles from './House.module.css';

/** Bottom-left room name + theme. It's the page's h1, focused after room changes. */
export function RoomCaption({ room, ref }: { room: Room; ref?: Ref<HTMLHeadingElement> }) {
  const { t } = useT();
  return (
    <h1 ref={ref} className={styles.caption} tabIndex={-1}>
      <span className={styles.roomName}>{t(room.name)}</span>
      <span className={styles.theme}>
        <span aria-hidden="true"> · </span>
        <span className="visually-hidden">, </span>
        {t(room.theme)}
      </span>
    </h1>
  );
}
