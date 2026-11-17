import { assetUrl, getImage, srcSet, variantAtLeast } from '../../../content/images.ts';
import type { Block, L10n } from '../../../content/schema.ts';
import { useT } from '../../../content/useT.ts';
import type { LightboxItem } from '../Lightbox.tsx';
import styles from './blocks.module.css';

type Of<T extends Block['type']> = Extract<Block, { type: T }>;
type OnOpen = (items: LightboxItem[], index: number) => void;
type Item = { src: string; alt: L10n; caption?: L10n };

function useLightboxItems(items: Item[]): LightboxItem[] {
  const { t } = useT();
  return items.map((item) => ({
    src: item.src,
    alt: t(item.alt),
    caption: item.caption ? t(item.caption) : undefined,
  }));
}

/** A clickable picture that opens the lightbox. */
function Picture({
  item,
  sizes,
  onOpen,
}: {
  item: LightboxItem;
  sizes: string;
  onOpen: () => void;
}) {
  const { ui } = useT();
  const entry = getImage(item.src);
  const fallback = entry && variantAtLeast(entry, 1200);
  return (
    <button
      type="button"
      className={styles.pictureButton}
      onClick={onOpen}
      aria-label={`${ui('enlargeImage')}: ${item.alt}`}
    >
      {entry ? (
        <img
          className={styles.picture}
          src={fallback ? assetUrl(fallback.src) : undefined}
          srcSet={srcSet(entry)}
          sizes={sizes}
          width={entry.width}
          height={entry.height}
          alt={item.alt}
          loading="lazy"
          decoding="async"
          style={{ background: entry.bgColor }}
        />
      ) : (
        <span className={styles.missingPicture}>{item.alt}</span>
      )}
    </button>
  );
}

export function ImageBlock({ block, onOpen }: { block: Of<'image'>; onOpen: OnOpen }) {
  const [item] = useLightboxItems([block]);
  if (!item) return null;
  return (
    <figure className={styles.figure}>
      <Picture
        item={item}
        sizes="(min-width: 900px) 480px, 100vw"
        onOpen={() => onOpen([item], 0)}
      />
      {item.caption && <figcaption className={styles.caption}>{item.caption}</figcaption>}
    </figure>
  );
}

/** Two columns on desktop, a swipeable strip on phones (§5.4). */
export function GalleryBlock({ block, onOpen }: { block: Of<'gallery'>; onOpen: OnOpen }) {
  const items = useLightboxItems(block.items);
  return (
    <ul className={styles.gallery}>
      {items.map((item, i) => (
        <li key={item.src}>
          <figure className={styles.figure}>
            <Picture
              item={item}
              sizes="(min-width: 900px) 240px, 70vw"
              onOpen={() => onOpen(items, i)}
            />
            {item.caption && <figcaption className={styles.caption}>{item.caption}</figcaption>}
          </figure>
        </li>
      ))}
    </ul>
  );
}
