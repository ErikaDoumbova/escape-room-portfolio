import { Camera, Copy, ExternalLink, Mail, Music2 } from 'lucide-react';

import { site } from '../../../content/load.ts';
import type { Block } from '../../../content/schema.ts';
import { useT } from '../../../content/useT.ts';
import { assembleEmail, mailtoHref } from '../../../lib/email.ts';
import { useToast } from '../../Toast/toastContext.ts';
import styles from './blocks.module.css';

type Of<T extends Block['type']> = Extract<Block, { type: T }>;

const ICONS = { email: Mail, instagram: Camera, tiktok: Music2, external: ExternalLink };

/** Pill links; email/Instagram/TikTok addresses come from site.json (§5.4, §11.2). */
export function LinksBlock({ block }: { block: Of<'links'> }) {
  const { t, ui } = useT();
  const toast = useToast();
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(assembleEmail(site.contact.email));
      toast(ui('copied'));
    } catch {
      // Clipboard blocked: the mailto link still works.
    }
  };

  return (
    <ul className={styles.links}>
      {block.items.map((item, i) => {
        const Icon = ICONS[item.kind];
        const label = t(item.label);
        if (item.kind === 'email') {
          return (
            <li key={i} className={styles.linkRow}>
              <a className={styles.pillButton} href={mailtoHref(site.contact.email)}>
                <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                {label}
              </a>
              <button type="button" className={styles.pillButton} onClick={copyEmail}>
                <Copy size={18} strokeWidth={1.75} aria-hidden="true" />
                {ui('copyEmail')}
              </button>
            </li>
          );
        }
        const href =
          item.kind === 'instagram'
            ? site.contact.instagram.url
            : item.kind === 'tiktok'
              ? site.contact.tiktok.url
              : item.href;
        if (!href) return null;
        return (
          <li key={i}>
            <a className={styles.pillButton} href={href} target="_blank" rel="noopener noreferrer">
              <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
              {label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
