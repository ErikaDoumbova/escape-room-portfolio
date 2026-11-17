// Responsive image lookup from src/generated/images.json (handoff §13.3),
// written by scripts/process-images.mjs. Loaded through a glob so the app
// still compiles (with no images) before the script has run.
export interface ImageVariant {
  w: number;
  src: string;
}

export interface ImageEntry {
  width: number;
  height: number;
  aspect: number;
  bgColor: string;
  lqip: string;
  variants: ImageVariant[];
  placeholder: boolean;
}

const manifests = import.meta.glob<Record<string, ImageEntry>>('../generated/images.json', {
  eager: true,
  import: 'default',
});
const manifest: Record<string, ImageEntry> = Object.values(manifests)[0] ?? {};

export function getImage(path: string): ImageEntry | undefined {
  return manifest[path];
}

/** Public URL for a generated file, respecting Vite's base path. */
export function assetUrl(src: string): string {
  return `${import.meta.env.BASE_URL}${src}`;
}

export function srcSet(entry: ImageEntry): string {
  return entry.variants.map((v) => `${assetUrl(v.src)} ${v.w}w`).join(', ');
}

/** The smallest variant at least `minWidth` wide (or the largest available). */
export function variantAtLeast(entry: ImageEntry, minWidth: number): ImageVariant | undefined {
  return entry.variants.find((v) => v.w >= minWidth) ?? entry.variants[entry.variants.length - 1];
}
