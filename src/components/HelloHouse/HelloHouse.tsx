import { site } from '../../content/site.ts';
import styles from './HelloHouse.module.css';

/** M0 "hello house": proves fonts, tokens, routing, and deploy work.
 *  Replaced by RoomView in M1. */
export function HelloHouse() {
  return (
    <main className={styles.hello}>
      <svg className={styles.house} viewBox="0 0 64 64" aria-hidden="true">
        <path d="M10 30 32 12l22 18" />
        <path d="M16 26v26h32V26" />
        <path d="M27 52V39h10v13" />
      </svg>
      <h1 className={styles.name}>{site.name.en}</h1>
      <p className={styles.tagline}>{site.tagline.en}</p>
    </main>
  );
}
