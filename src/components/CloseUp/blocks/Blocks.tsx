import { lazy, Suspense, useState } from 'react';

import type { Block } from '../../../content/schema.ts';
import type { LightboxItem } from '../Lightbox.tsx';
import { GalleryBlock, ImageBlock } from './ImageBlocks.tsx';
import { LinksBlock } from './LinksBlock.tsx';
import { RecipeBlock } from './RecipeBlock.tsx';
import { ListBlock, ParagraphBlock, QuoteBlock, SoundToggleBlock } from './TextBlocks.tsx';
import { SpotifyBlock } from './SpotifyBlock.tsx';

const Lightbox = lazy(() => import('../Lightbox.tsx'));

/** Render an object's content blocks in order (handoff §5.4). */
export function Blocks({ blocks, title }: { blocks: Block[]; title: string }) {
  const [lightbox, setLightbox] = useState<{ items: LightboxItem[]; index: number } | null>(null);
  const open = (items: LightboxItem[], index: number) => setLightbox({ items, index });

  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'paragraph':
            return <ParagraphBlock key={i} block={block} />;
          case 'image':
            return <ImageBlock key={i} block={block} onOpen={open} />;
          case 'gallery':
            return <GalleryBlock key={i} block={block} onOpen={open} />;
          case 'recipe':
            return <RecipeBlock key={i} block={block} title={title} />;
          case 'links':
            return <LinksBlock key={i} block={block} />;
          case 'list':
            return <ListBlock key={i} block={block} />;
          case 'spotify':
            return <SpotifyBlock key={i} block={block} />;
          case 'quote':
            return <QuoteBlock key={i} block={block} />;
          case 'sound-toggle':
            return <SoundToggleBlock key={i} />;
          default:
            return null;
        }
      })}
      {lightbox && (
        <Suspense fallback={null}>
          <Lightbox
            items={lightbox.items}
            index={lightbox.index}
            onIndexChange={(index) => setLightbox({ ...lightbox, index })}
            onClose={() => setLightbox(null)}
          />
        </Suspense>
      )}
    </>
  );
}
