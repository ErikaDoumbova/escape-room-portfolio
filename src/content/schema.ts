// Content schemas (handoff §13). Shared by the app (dev-time validation, types)
// and scripts/validate-content.mjs (CI), which runs this file directly in Node.
// Keep imports to `zod` only and use erasable TypeScript syntax.
import { z } from 'zod';

/** A normalized coordinate: 0 = left/top edge of the room image, 1 = right/bottom. */
const unit = z.number().min(0).max(1);

const slug = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'use lowercase letters, numbers and dashes only');

export const L10nSchema = z.strictObject({ en: z.string(), bg: z.string().optional() });

export const PhaseSchema = z.enum(['morning', 'day', 'sunset', 'night']);

const PointSchema = z.strictObject({ x: unit, y: unit });

const ImageItem = {
  src: z.string().min(1),
  alt: L10nSchema,
  caption: L10nSchema.optional(),
};

export const BlockSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('paragraph'), text: L10nSchema }),
  z.strictObject({ type: z.literal('image'), ...ImageItem }),
  z.strictObject({
    type: z.literal('gallery'),
    items: z.array(z.strictObject(ImageItem)).min(1),
  }),
  z.strictObject({
    type: z.literal('recipe'),
    servings: z.number().int().positive(),
    time: L10nSchema,
    ingredients: z.array(L10nSchema).min(1),
    steps: z.array(L10nSchema).min(1),
    tip: L10nSchema.optional(),
  }),
  z.strictObject({
    type: z.literal('links'),
    items: z
      .array(
        z.strictObject({
          kind: z.enum(['email', 'instagram', 'tiktok', 'external']),
          label: L10nSchema,
          href: z.string().optional(),
        }),
      )
      .min(1),
  }),
  z.strictObject({
    type: z.literal('list'),
    items: z
      .array(
        z.strictObject({
          title: z.string(),
          subtitle: L10nSchema.optional(),
          note: L10nSchema.optional(),
        }),
      )
      .min(1),
  }),
  z.strictObject({
    type: z.literal('spotify'),
    title: L10nSchema,
    embedUrl: z.string().optional(),
  }),
  z.strictObject({ type: z.literal('quote'), text: L10nSchema, cite: L10nSchema.optional() }),
  z.strictObject({ type: z.literal('sound-toggle') }),
]);

export const DoorwaySchema = z.strictObject({
  to: slug,
  x: unit,
  y: unit,
  direction: z.enum(['left', 'right', 'up', 'down']),
  label: L10nSchema.optional(),
});

export const RoomObjectSchema = z
  .strictObject({
    id: slug,
    enabled: z.boolean().optional(),
    name: L10nSchema,
    x: unit,
    y: unit,
    labelPriority: z.number().optional(),
    zoom: z
      .strictObject({
        x: unit.optional(),
        y: unit.optional(),
        scale: z.number().min(1.2).max(3).optional(),
      })
      .optional(),
    title: L10nSchema,
    blocks: z.array(BlockSchema),
    special: z.enum(['cycle-lighting']).optional(),
    bubble: L10nSchema.optional(),
  })
  .refine((o) => o.blocks.length > 0 || o.special !== undefined, {
    path: ['blocks'],
    message: 'needs at least one block (paragraph, image, ...)',
  });

export const LightSchema = z.strictObject({
  id: z.string().min(1),
  kind: z.enum(['lamp', 'window', 'screen', 'candle']),
  x: unit,
  y: unit,
  radius: unit,
  w: z.number().positive().optional(),
  h: z.number().positive().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a hex colour like #FFD58A'),
  phases: z.array(PhaseSchema).min(1),
});

export const EffectSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('steam'), x: unit, y: unit, phases: z.array(PhaseSchema).optional() }),
  z.strictObject({
    type: z.literal('flicker'),
    lightId: z.string().min(1),
    phases: z.array(PhaseSchema).optional(),
  }),
  z.strictObject({
    type: z.literal('twinkle'),
    points: z.array(PointSchema).min(1),
    color: z.string().optional(),
    phases: z.array(PhaseSchema).optional(),
  }),
]);

export const RoomSchema = z
  .strictObject({
    id: slug,
    name: L10nSchema,
    theme: L10nSchema,
    image: z.string().min(1),
    imageAlt: L10nSchema,
    initialFocusX: unit.optional(),
    ambientSound: z.string().optional(),
    ambientSoundByPhase: z.partialRecord(PhaseSchema, z.string()).optional(),
    doorways: z.array(DoorwaySchema),
    objects: z.array(RoomObjectSchema),
    lights: z.array(LightSchema).optional(),
    effects: z.array(EffectSchema).optional(),
  })
  .superRefine((room, ctx) => {
    const seen = new Map<string, number>();
    room.objects.forEach((o, i) => {
      const first = seen.get(o.id);
      if (first !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['objects', i, 'id'],
          message: `"${o.id}" is already used by objects[${first}]. Each object needs its own id`,
        });
      } else seen.set(o.id, i);
    });
    const lightIds = new Set((room.lights ?? []).map((l) => l.id));
    (room.effects ?? []).forEach((e, i) => {
      if (e.type === 'flicker' && !lightIds.has(e.lightId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['effects', i, 'lightId'],
          message: `"${e.lightId}" doesn't match any light id in this room`,
        });
      }
    });
  });

export const SiteSchema = z.strictObject({
  name: L10nSchema,
  tagline: L10nSchema,
  intro: L10nSchema,
  rooms: z.array(slug).min(1),
  contact: z.strictObject({
    email: z.strictObject({ user: z.string().min(1), domain: z.string().min(1) }),
    instagram: z.strictObject({ handle: z.string(), url: z.url() }),
    tiktok: z.strictObject({ handle: z.string(), url: z.url() }),
  }),
  spotifyEmbedUrl: z.string().optional(),
  features: z.strictObject({ guestbook: z.boolean() }),
  seo: z.strictObject({ title: L10nSchema, description: L10nSchema, siteUrl: z.string() }),
  ui: z.record(z.string(), L10nSchema),
});

export type L10n = z.infer<typeof L10nSchema>;
export type Phase = z.infer<typeof PhaseSchema>;
export type Block = z.infer<typeof BlockSchema>;
export type Doorway = z.infer<typeof DoorwaySchema>;
export type RoomObject = z.infer<typeof RoomObjectSchema>;
export type Light = z.infer<typeof LightSchema>;
export type Effect = z.infer<typeof EffectSchema>;
export type Room = z.infer<typeof RoomSchema>;
export type Site = z.infer<typeof SiteSchema>;
export type Lang = 'en' | 'bg';
