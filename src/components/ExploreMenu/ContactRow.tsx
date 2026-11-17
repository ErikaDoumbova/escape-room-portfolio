import { Camera, Copy, Mail, Music2 } from 'lucide-react';
import { site } from '../../content/load.ts';
import { useT } from '../../content/useT.ts';
import { assembleEmail, mailtoHref } from '../../lib/email.ts';
import { useToast } from '../Toast/toastContext.ts';
import styles from './ExploreMenu.module.css';

/** Email (assembled at runtime, §11.2), Instagram and TikTok as plain links. */
export function ContactRow() {
  const { ui } = useT();
  const toast = useToast();
  // Joined here at runtime; the bundle only holds the two halves.
  const email = assembleEmail(site.contact.email);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      toast(ui('copied'));
    } catch {
      // Clipboard can be blocked; the address is visible to copy by hand.
    }
  };

  const { instagram, tiktok } = site.contact;
  return (
    <ul className={styles.contact}>
      <li className={styles.emailRow}>
        <a className={styles.contactLink} href={mailtoHref(site.contact.email)}>
          <Mail size={18} strokeWidth={1.75} aria-hidden="true" />
          {email}
        </a>
        <button
          type="button"
          className={styles.iconButton}
          onClick={copy}
          aria-label={ui('copyEmail')}
        >
          <Copy size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </li>
      <li>
        <a
          className={styles.contactLink}
          href={instagram.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Camera size={18} strokeWidth={1.75} aria-hidden="true" />
          Instagram {instagram.handle}
        </a>
      </li>
      <li>
        <a
          className={styles.contactLink}
          href={tiktok.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Music2 size={18} strokeWidth={1.75} aria-hidden="true" />
          TikTok {tiktok.handle}
        </a>
      </li>
    </ul>
  );
}
