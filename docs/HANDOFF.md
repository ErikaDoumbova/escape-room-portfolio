# Developer handoff: "Erika's House", an immersive personal website

> **For the AI coding agent (Claude Code, Codex, etc.).** This document is the single source of truth for building v1. Every major design and technical decision has already been made with the owner (see `docs/planning/decisions.md` for the history). Build exactly what is specified here. Where something is marked **`PLACEHOLDER`** or **`ASSUMPTION`**, implement it with the stated fallback and keep going; don't stop to ask. Raise questions only for contradictions inside this document.

**Owner:** Erika Doumbova, graphic designer and content creator.
**Owner's technical profile:** non-developer. Reviews the result in a browser. **Will never run npm or a terminal.** All maintenance happens through the GitHub web UI.
**Budget:** €0. Use only free tiers and open-licence assets.
**Deadline:** v1 should be live as fast as possible (target: same day), built on placeholder art that the owner swaps for real art file by file.

---

## Table of contents

1. [Concept and creative direction](#1-concept-and-creative-direction)
2. [Design system and visual identity](#2-design-system-and-visual-identity)
3. [Site structure and navigation](#3-site-structure-and-navigation)
4. [Room specifications](#4-room-specifications)
5. [Interactive objects and close-up behaviour](#5-interactive-objects-and-close-up-behaviour)
6. [Animations, transitions, and micro-interactions](#6-animations-transitions-and-micro-interactions)
7. [Day/night lighting system](#7-daynight-lighting-system)
8. [Sound](#8-sound)
9. [Languages (EN/BG)](#9-languages-enbg)
10. [Desktop and mobile experiences](#10-desktop-and-mobile-experiences)
11. [Accessibility, privacy, and SEO](#11-accessibility-privacy-and-seo)
12. [Tech stack and architecture](#12-tech-stack-and-architecture)
13. [Content model and data structures](#13-content-model-and-data-structures)
14. [Artwork and asset creation workflow](#14-artwork-and-asset-creation-workflow)
15. [Build, deploy, and hosting (GitHub Pages)](#15-build-deploy-and-hosting-github-pages)
16. [Owner's maintenance guide (no terminal)](#16-owners-maintenance-guide-no-terminal)
17. [Development milestones](#17-development-milestones)
18. [Testing requirements and acceptance criteria](#18-testing-requirements-and-acceptance-criteria)
19. [Assumptions and placeholders](#19-assumptions-and-placeholders)
20. [Out of scope for v1 / future ideas](#20-out-of-scope-for-v1--future-ideas)
- [Appendix A: full room content files (draft copy)](#appendix-a-full-room-content-files-draft-copy)
- [Appendix B: Gemini prompt library](#appendix-b-gemini-prompt-library)

---

## 1. Concept and creative direction

### 1.1 One-line concept
A cozy, warm, soft-3D **dollhouse version of Erika's real home**. Visitors wander from room to room and click on her real belongings to discover who she is: what she makes, what she loves, where she's from, and who she's becoming.

### 1.2 Inspiration and how we differ
Inspired by **Drake Related** (drakerelated.com), which uses pre-rendered isometric rooms with HTML hotspots, a URL per room, doorway arrows, and an "Explore" room menu. We keep its *technique* and change its *spirit*:

| Drake Related | Erika's House |
|---|---|
| Luxury, cold, store-first | Cozy, warm, personal, story-first |
| Objects link to products | Objects open stories, artwork, a recipe, music |
| Hotspots are cryptic arrows | Hotspots are soft, glowing pins **with name labels** |
| One static lighting state | Lighting follows the **visitor's local time** (morning → day → sunset → night) |
| Silent | Optional ambient sound per room (off by default) |
| English only | **English + Bulgarian** |

### 1.3 Audience and tone
- **Primary audience:** curious peers (classmates, creators, followers from Instagram/TikTok) who are happy to spend 5+ minutes exploring.
- **Priority device:** desktop first, but mobile must work well, because many visitors arrive from social bio links.
- **Voice:** first person, warm, casual, short sentences. Erika is talking to a friend who just walked into her home. No corporate language.

### 1.4 Emotional goals (use these to resolve any design doubt)
1. **"I feel welcome."** Soft light, warm colours, gentle motion.
2. **"I want to touch everything."** Objects are obviously clickable and every click pays off.
3. **"Now I actually know her."** Each room answers one question about Erika.

### 1.5 Room-to-story mapping (v1)

| Room | Question it answers | Key objects |
|---|---|---|
| **Front** (exterior, landing) | Who is this? How do I reach her? | Name sign, mailbox (contact), street lamp |
| **Living room** | What does she make, and where is she going? | Her graphic design posters, sketchbook of drawings, ring light (content creation), TV + sports newspaper (sports journalism goal), IE notebook (BCDM studies) |
| **Bedroom** | What does she love? | Shawn Mendes poster (music), headphones, bookshelf |
| **Kitchen** | Where is she from? | Pot of пълнени чушки (recipe), fridge magnet of Alexander Nevsky Cathedral (Sofia) |

---

## 2. Design system and visual identity

> This is Erika's personal site, **not** an IE University-branded asset. Do **not** use IE logos or brand assets. A plain-text mention of being a BCDM student at IE is fine. Accessibility must still meet **WCAG 2.1 AA**.

### 2.1 Colour tokens
Define these in `src/styles/tokens.css` as CSS custom properties on `:root`. **Day mode is the only colour mode.** There's no dark theme, because night is handled by the lighting system (§7), not a UI theme.

```css
:root {
  /* Surfaces */
  --color-canvas:        #F6EEDF; /* page background = room image background (overridden per room, see §4.1) */
  --color-paper:         #FBF6EC; /* panels, menus, cards */
  --color-paper-shade:   #EFE3CF; /* hover fills, dividers on paper */

  /* Text */
  --color-ink:           #3B2A20; /* primary text (cocoa) */
  --color-ink-soft:      #6B5444; /* secondary text — verify ≥4.5:1 on paper */

  /* Accents */
  --color-terracotta:    #C8643B; /* decorative accent, pin dots, illustrations — NOT for body text */
  --color-terracotta-ink:#A44E2B; /* links and accent text (≈4.9:1 on canvas) */
  --color-mustard:       #E0A93B; /* highlights, lamp glow base */
  --color-sage:          #8DA382; /* tags, secondary accent */
  --color-dusk:          #2C3550; /* night grade, focus ring on light surfaces alt */

  /* Functional */
  --color-focus:         #2C3550;
  --color-scrim:         rgba(59, 42, 32, 0.35); /* behind modals/sheets */

  /* Lighting (see §7) */
  --grade-morning: #FFE6C2;
  --grade-sunset-warm: #F2A65A;
  --grade-sunset-cool: #6B4E8C;
  --grade-night: #2C3550;
  --glow-lamp: #FFD58A;
  --glow-screen: #BFD9FF;
}
```

**Contrast rule:** before finishing M4, programmatically check every text/background pair actually used (for example with a small script or axe) and darken a token if anything is under 4.5:1 for body text or 3:1 for large text and UI components.

### 2.2 Typography
Both families **must support Cyrillic** because of the Bulgarian toggle. Self-host them via `@fontsource` packages rather than Google Fonts CDN, which avoids third-party requests (privacy, §11.2).

| Role | Family | Weights | Usage |
|---|---|---|---|
| Display | **Lora** (`@fontsource/lora`, latin + cyrillic subsets) | 500, 600, italic 500 | Room names, close-up titles, name sign, loader wordmark |
| Body / UI | **Nunito** (`@fontsource/nunito`, latin + cyrillic) | 400, 600, 700 | Everything else |

Type scale (rem, 16px base), with fluid sizes via `clamp()`:

| Token | Size | Line height | Use |
|---|---|---|---|
| `--text-xs` | 0.8125rem | 1.4 | Pin labels, captions |
| `--text-sm` | 0.9375rem | 1.5 | UI controls, metadata |
| `--text-md` | 1.0625rem | 1.65 | Body copy in panels |
| `--text-lg` | clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem) | 1.3 | Panel kicker / section titles |
| `--text-xl` | clamp(1.75rem, 1.4rem + 1.4vw, 2.5rem) | 1.15 | Close-up title (Lora) |
| `--text-2xl` | clamp(2.25rem, 1.6rem + 2.6vw, 3.75rem) | 1.05 | Loader wordmark / Quick tour H1 (Lora) |

### 2.3 Spacing, radius, elevation
- Spacing scale: `--space-1: 4px` up to `--space-8: 64px` (4, 8, 12, 16, 24, 32, 48, 64).
- Radius: `--radius-sm: 8px` (chips), `--radius-md: 14px` (cards), `--radius-lg: 22px` (panels and sheets), `--radius-pill: 999px`.
- Shadow, soft and warm only: `--shadow-soft: 0 8px 30px rgba(59,42,32,.14)`, `--shadow-pin: 0 2px 8px rgba(59,42,32,.25)`.

### 2.4 Motion tokens
```css
--ease-cozy: cubic-bezier(0.65, 0, 0.35, 1);    /* camera zoom, room transitions */
--ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1);/* panels, labels */
--dur-fast: 160ms;   /* hover, label reveal */
--dur-base: 320ms;   /* panels, menus */
--dur-camera: 750ms; /* zoom in/out */
--dur-room: 600ms;   /* room crossfade */
--dur-light: 1200ms; /* lighting phase change */
```
All motion must respect `prefers-reduced-motion: reduce` (§6.6).

### 2.5 UI components (visual spec)

**Hotspot pin (object)**
- 28×28px visual circle: `--color-paper` at 90% opacity, 1.5px `--color-ink` ring, 8px `--color-terracotta` centre dot, `--shadow-pin`.
- Invisible hit area of at least **44×44px** (use a pseudo-element).
- Idle: a slow "breathing" ring that scales 1 → 1.35 while its opacity goes 0.5 → 0 every 2.6s. Stagger pins by index × 300ms so they don't pulse in sync.
- Hover or keyboard focus: the pin scales to 1.12, and a **label pill** with the object's name fades in above it (paper bg, `--text-xs`, 600 weight, `--radius-pill`, 6px 10px padding). On touch devices, labels are **always visible at reduced size** (§10.2).
- Visited (object already opened in this browser): the centre dot turns `--color-sage`.

**Doorway pin**
- 36px circle in `--color-ink` with a paper-coloured arrow icon pointing in `direction`, plus a label pill that is **always visible**: "Bedroom →".
- Hover: the arrow nudges 3px in its direction.

**Top bar** (fixed, transparent, sits over the scene)
- Left: wordmark "Erika Doumbova" in Lora 600, linking to Front.
- Right, in order: **Time chip** (sun/moon icon + phase name, §7.4), **Language toggle** (`EN | BG`), **Sound toggle** (speaker icon), **Explore** button.
- Controls are 40px tall pill buttons on a paper background at 85% opacity with `backdrop-filter: blur(8px)`, and a solid paper fallback where that's unsupported.
- Bottom-left (fixed): the current room name in Lora plus its one-line theme ("Kitchen · where I'm from").

**Close-up panel** (§5.3), **Explore menu** (§3.4), and **loader** (§6.1) are specified in their own sections.

**Icons:** use **Lucide** (`lucide-react`, ISC licence). Stroke width 1.75.

---

## 3. Site structure and navigation

### 3.1 Routes

| Path | View | Notes |
|---|---|---|
| `/` | Front room | Landing page |
| `/living-room` | Living room | |
| `/bedroom` | Bedroom | |
| `/kitchen` | Kitchen | |
| `/:room/:object` | Room with that object's close-up open | e.g. `/kitchen/stuffed-peppers`. Must be shareable and must work on a hard refresh. |
| `/tour` | **Quick tour**: an accessible text-and-image version of the whole house | §3.5 |
| anything else | Redirect to `/` with a small toast: "That room doesn't exist (yet)". | |

- Query params: `?lang=en|bg` (§9), `?time=morning|day|sunset|night` (§7), and `?edit=1` (hotspot editor, §13.6).
- All routes are relative to Vite's `base` (§15.2). Use `import.meta.env.BASE_URL` as the router `basename`.
- Set `document.title` per view: "Kitchen · Erika Doumbova" and "Stuffed peppers · Kitchen · Erika Doumbova".

### 3.2 House map (doorways)

```
             ┌──────────┐
             │ Bedroom  │
             └────┬─────┘
                  │
┌────────┐   ┌────┴────────┐   ┌──────────┐
│ Front  ├───┤ Living room ├───┤ Kitchen  │
└────────┘   └─────────────┘   └──────────┘
```

| From | Doorway pins → |
|---|---|
| Front | Living room (pin on the front door, label "Come in →") |
| Living room | Front (exit), Bedroom, Kitchen |
| Bedroom | Living room |
| Kitchen | Living room |

### 3.3 Navigation methods (all must work)
1. **Doorway pins** in the scene.
2. **Explore menu**, which jumps to any room or object.
3. **Keyboard:** Tab through pins in reading order (top-left → bottom-right by y, then x). `Enter`/`Space` activates the focused pin. `Esc` closes the close-up or menu. `←`/`→` pan the room when it's wider than the viewport.
4. **Browser back/forward**, which moves between rooms and opens and closes close-ups (each is a history entry).
5. **Deep links** (any URL from §3.1).

### 3.4 Explore menu
- Opens from the top bar. Desktop: a panel slides in from the right (min(420px, 92vw)). Mobile: a full-screen sheet.
- Contents:
  1. Heading "Explore the house" plus a progress line: **"You've discovered 6 of 15 things"**. The count comes from `localStorage` (§6.5).
  2. One card per room: a 16:9 thumbnail (the room image's smallest variant), the room name, the theme line, and a list of its objects with ✓ for visited ones. Clicking a room navigates there. Clicking an object navigates to `/:room/:object`.
  3. A "Prefer reading? **Take the quick tour**" link to `/tour`.
  4. Contact row: email, Instagram, TikTok icons with text labels (§11.2 covers email obfuscation).
- Focus is trapped inside while open. `Esc` closes it, and focus returns to the Explore button.

### 3.5 Quick tour (`/tour`)
A normal, scrollable, semantic page (`<main>`, `<h1>`, one `<section>` per room, one `<article>` per object) that renders **all the same content** from the room data files as plain text and images. It serves screen-reader users, people in a hurry, people with a slow connection, and search engines. It has its own top bar (wordmark, language toggle, "Back to the house" link). There's no lighting system or sound on this page.

---

## 4. Room specifications

### 4.1 Common rules for every room
- **Art format:** one pre-rendered image per room. The room is a **soft-3D isometric diorama** (cutaway showing the floor and two walls) centred on a **plain, flat background**. Master aspect ratio is **16:9**. Ideally it's ≥ 2400px wide, and the minimum accepted is 1600px. See §14.
- **Background blending:** at build time the image pipeline samples the corner pixels of each room image and stores the median colour as `bgColor` in the generated manifest. The page background behind that room uses this colour, so the diorama blends seamlessly into any viewport shape. Default fallback: `--color-canvas`.
- **Fit rule:** the scene's rendered height = viewport height (`100dvh`), and its width = height × image aspect ratio.
  - If the scene is **narrower** than the viewport (wide desktop windows), centre it and let `bgColor` fill the sides.
  - If the scene is **wider** than the viewport (narrow windows, phones), it **pans horizontally** (§10). The initial pan position centres `initialFocusX`.
  - Minimum scene height is 560px. Below that (very short windows), allow vertical panning too.
- **Coordinates:** every hotspot, doorway, light, and effect position is **normalized 0–1** relative to the room image (x across the width, y down the height). Light radii are normalized to image width.
- **Layer stack inside the scene**, bottom to top. Everything except the UI chrome lives inside one "scene" element, so it all zooms together:
  1. Room image (`<picture>`, responsive `srcset`; LQIP blur-up)
  2. Effects layer (steam, flicker, and so on; §6.4)
  3. Lighting overlay (§7)
  4. Hotspot and doorway pins (not affected by lighting)
- **Preloading:** after the current room's full image has loaded, preload the medium variant of every room that has a doorway in it.

### 4.2 Front (`/`)
- **Concept:** the outside of a small, cosy house with a front path, a door, and a window glowing at night. The architecture is lightly **inspired by old-town Sofia**: pastel facade, tiled roof, wrought-iron details. **`ASSUMPTION`:** this art is AI-generated from a prompt (Appendix B, B.3) rather than a photo, because the owner hasn't specified an exterior to photograph.
- **Theme line:** EN "Hi, I'm Erika" · BG "Здравей, аз съм Ерика"
- **First-visit welcome:** on the very first visit (no `localStorage` flag set), once the loader finishes, show a small paper card near the bottom centre. It says "Welcome in. Click anything that glows. ✦" and has a "Got it" button. It dismisses on click or on the first interaction with any pin. Don't show it again after that.
- **Objects:**
  | id | Name | Close-up content |
  |---|---|---|
  | `name-sign` | Name sign (by the door) | Intro paragraph, "graphic designer and content creator", a 2nd-year BCDM student at IE, and a short "how to explore" hint |
  | `mailbox` | Mailbox | Contact links: email, Instagram @erika.doumbova, TikTok @eri_doumbova |
  | `street-lamp` | Street lamp | **Easter egg:** clicking it **cycles the lighting phase** (morning → day → sunset → night → auto) with a short paragraph: "I'm a night person, honestly. Click me again." It does *not* open a full close-up, only a small speech-bubble tooltip next to the lamp (it auto-dismisses after 3s). |
- **Doorways:** front door → Living room ("Come in →").
- **Lights:** windows (`kind: window`, active at sunset and night), street lamp (`kind: lamp`, active at sunset and night), porch light (`lamp`, night).
- **Ambient sound:** birds (morning and day), crickets (sunset and night).

### 4.3 Living room (`/living-room`)
- **Source:** the owner's photo of her real living space, restyled (§14).
- **Theme line:** EN "What I make & where I'm going" · BG "Какво създавам и накъде вървя"
- **Objects:**
  | id | Name | Close-up content |
  |---|---|---|
  | `poster-1`, `poster-2`, `poster-3` | Framed posters | **The owner's original graphic design poster files (not AI-restyled)**, with title, year, a short story, and an optional tool list. `PLACEHOLDER` titles. There's one hotspot per framed poster. The count is data-driven, so the owner can add `poster-4`. |
  | `sketchbook` | Sketchbook on the coffee table | A **gallery** of her high-school drawings (original scans) with captions. `PLACEHOLDER` captions. |
  | `ring-light` | Ring light + phone tripod | Content creation: what she makes and for which platforms, plus links to IG and TikTok. `PLACEHOLDER` niche description. |
  | `tv-sports` | TV showing a match + sports newspaper | Her goal of becoming a sports journalist. `PLACEHOLDER`: which sports or teams she follows. |
  | `ie-notebook` | Notebook / laptop on the desk | Studies: 2nd year, Bachelor in Communication and Digital Media (BCDM) at IE University. Plain text, no logo. |
- **Doorways:** Front (exit, left), Bedroom (hallway), Kitchen (archway).
- **Lights:** floor lamp (`lamp`, sunset and night), TV screen (`screen`, flickering at night), ring light (`lamp`, night, cool white `#FFF4E0`).
- **Effects:** TV screen flicker at night.
- **Ambient sound:** soft room tone with a very low, distant sports-commentary murmur.

### 4.4 Bedroom (`/bedroom`)
- **Source:** the owner's photo of her real bedroom, restyled. The Shawn Mendes poster appears **small, as part of the room**, the way it is in reality.
- **Theme line:** EN "What I love" · BG "Какво обичам"
- **Objects:**
  | id | Name | Close-up content |
  |---|---|---|
  | `shawn-poster` | Shawn Mendes poster | Why he's her favourite artist, plus a **click-to-load Spotify embed** of her favourite songs (§11.2). The close-up image is the **owner's own photo of her wall**. Never use or reproduce official poster artwork at full resolution (copyright). `PLACEHOLDER` Spotify playlist URL. |
  | `headphones` | Headphones / speaker | Her music taste in general. It has a **button inside the panel to turn on room sound**, which is the same state as the top-bar toggle. |
  | `bookshelf` | Bookshelf | A **list** of favourite books (title, author, a one-line note). `PLACEHOLDER` books. |
- **Doorways:** Living room.
- **Lights:** bedside lamp (`lamp`, sunset and night), fairy lights along the wall or headboard (`candle` kind for twinkle, night). **`ASSUMPTION`:** if her real room has no fairy lights, remove that light entry; the room still works without it.
- **Ambient sound:** soft vinyl crackle plus quiet room tone.

### 4.5 Kitchen (`/kitchen`)
- **Source:** the owner's photo of her real kitchen, restyled.
- **Theme line:** EN "Where I'm from" · BG "Откъде съм"
- **Objects:**
  | id | Name | Close-up content |
  |---|---|---|
  | `stuffed-peppers` | Pot of пълнени чушки on the stove | Short story, then a **recipe card** (ingredients and steps) for Bulgarian stuffed peppers. A draft recipe is in Appendix A, and the owner should confirm it matches her family's version. |
  | `nevsky-magnet` | Alexander Nevsky Cathedral fridge magnet | Sofia, born and raised. Her favourite place in the city and why. Uses the owner's own photo of the cathedral if available. `PLACEHOLDER` personal story. |
  | `kitchen-window` | Window | **Optional, `enabled: false` by default.** A Sofia skyline or Vitosha view, if the owner wants a third kitchen object. |
- **Doorways:** Living room.
- **Lights:** pendant or ceiling lamp (`lamp`, sunset and night), stove hob glow (`lamp`, small, all phases at low opacity).
- **Effects:** **steam** rising from the pot, in every phase.
- **Ambient sound:** a gentle simmering pot plus a faint kitchen ambience.

> **Guestbook:** deferred to a later version. Don't build it. Leave room in the kitchen layout for fridge notes later (§20).

---

## 5. Interactive objects and close-up behaviour

### 5.1 Interaction flow ("zoom to close-up")
1. The visitor clicks or taps an object pin (or presses Enter on it).
2. The URL changes to `/:room/:object` with `history.push`.
3. The **camera zooms**: the whole scene element animates (`transform: translate() scale()`, `--dur-camera`, `--ease-cozy`) so the object's zoom focus lands in the visible part of the screen that isn't covered by the panel (§5.2). All **other pins fade out** (`--dur-fast`), and the selected pin shrinks into a small glowing ring.
4. As the camera reaches about 60% of its motion, the **close-up panel** slides in: from the right on desktop, from the bottom on mobile.
5. Closing (✕ button, `Esc`, a scrim click on mobile, browser back, or clicking empty scene area on desktop) runs this in reverse. The panel leaves first, then the camera returns to its previous pan position, and the pins fade back in. The URL returns to `/:room`.
6. Switching between objects in the same room while a close-up is open (through the Explore menu, or via "Next in this room →" at the bottom of the panel) animates the camera directly from one focus to the next, without zooming out first.
7. The object is marked as visited (§6.5).

### 5.2 Camera math
Let:
- `W`, `H` = rendered (unzoomed) scene size in px
- `ox` = the scene's current left offset relative to the viewport (`-scrollLeft` when panned, or the centring offset when narrower than the viewport)
- `(fx, fy)` = `object.zoom.x ?? object.x`, `object.zoom.y ?? object.y` (normalized)
- `s` = `object.zoom.scale` (default 1.8)
- `(tx, ty)` = the target point in viewport px:
  - **Desktop** (≥ 900px wide): `tx = (viewportW − panelW) / 2`, `ty = viewportH / 2`
  - **Mobile/narrow:** `tx = viewportW / 2`, `ty = viewportH × 0.27` (the sheet covers about the bottom 62%)

Apply `transform-origin: 0 0` and `transform: translate(X px, Y px) scale(s)` to the scene, where:

```
X = tx − ox − s · fx · W
Y = ty − s · fy · H
```

**Clamping:**
- Clamp `s` to `[1.2, maxScale]`, where `maxScale = 1.15 × (sourceImageNaturalWidth / W)`. This means we never upscale the source by more than 15% and the zoomed image stays crisp.
- Before the zoom starts, swap the `<picture>` to the largest available variant (that is, preload it on pin hover/focus).
- Don't clamp X/Y to scene edges. Showing the room's background colour at the edges is fine, because the page background equals `bgColor`.

Implement this with Motion (`motion/react`) `animate()` on transform values, or with CSS transitions on a CSS variable. Interrupting it must be safe: a new target simply retargets from the current values.

### 5.3 Close-up panel
- **Desktop:** a right-side panel, width `clamp(380px, 36vw, 520px)`, full height minus 16px margin on all sides, `--radius-lg`, paper background, `--shadow-soft`. It scrolls internally. There's no scrim, so the room stays visible (the zoom is the focus).
- **Mobile:** a bottom sheet with a default height of 62% of the viewport. It can be dragged up to 92% and dragged down to dismiss. It has a handle bar and a scrim behind it.
- It's a **dialog**: `role="dialog"`, `aria-modal="true"`, labelled by its title. Focus moves to the title when it opens, focus stays trapped inside, and on close focus returns to the pin that opened it.
- **Structure, top to bottom:**
  1. Kicker: the room name and theme in small caps, `--color-terracotta-ink`
  2. Title: Lora, `--text-xl`
  3. Content blocks in order (§13.3 block types)
  4. Footer: "← Previous" / "Next in this room →" buttons (cycling through the room's enabled objects), plus the ✕ close button (which is also pinned at the top-right of the panel)

### 5.4 Content block rendering rules

| Block type | Rendering |
|---|---|
| `paragraph` | `--text-md`, max 62ch |
| `image` | Rounded `--radius-md`, its intrinsic aspect ratio, a caption below in `--text-xs` `--color-ink-soft`. Click opens a **lightbox** (full-screen, Esc to close, pinch-zoom on mobile). |
| `gallery` | Horizontal scroll-snap strip on mobile, 2-column grid on desktop. Each item opens the lightbox, and the lightbox has prev/next. |
| `recipe` | A card with a paper-shade background: servings and time chips, an **Ingredients** list (each line a checkbox the visitor can tick, purely visual and not persisted), and numbered **Steps**, plus an optional tip. Also a "Print recipe" button that calls `window.print()`, with a print stylesheet that shows only the recipe. |
| `links` | A vertical list of pill buttons with an icon and label. External links open in a new tab with `rel="noopener noreferrer"`. Email: §11.2. |
| `list` | Rows with a Lora title, a subtitle, and a note. Used for books. |
| `spotify` | Click-to-load placeholder card: "Play my favourites on Spotify · Loading this shares data with Spotify". A "Load player" button swaps it for the `<iframe>` (§11.2). |
| `quote` | Lora italic, `--text-lg`, with a terracotta left border. |

### 5.5 Special interactions
- **Street lamp (Front):** cycles the lighting phase (see §4.2). It does not open a panel.
- **Headphones (Bedroom):** its panel includes a "Turn on room sound" toggle, bound to global sound state.
- **Visited objects:** the pin's centre dot changes to sage (§2.5).

---

## 6. Animations, transitions, and micro-interactions

### 6.1 Loader (first load only)
- A full-screen `--color-canvas` background with "Erika Doumbova" in Lora (`--text-2xl`), and under it a thin terracotta progress line that tracks how much of the current room image has loaded (use real progress if feasible, otherwise animate it to 90% and complete on load).
- Fade it out (`--dur-base`) once the current room's medium image has decoded **and** fonts are ready, with a **2.5s maximum**. After 2.5s, show the room with the LQIP blur-up instead.
- Navigations between rooms inside the SPA never show the full loader again.

### 6.2 Room transitions
- When the visitor clicks a doorway pin: the current scene scales to 1.04 and blurs (`filter: blur(6px)`) while it fades to the destination's `bgColor` over `--dur-room`. The new scene then fades in from opacity 0 and scale 0.98.
- The new room's LQIP shows instantly and the full image cross-fades in when ready (that's Drake Related's technique).
- Pan position for the new room: centre on `initialFocusX`.

### 6.3 Ambient motion (desktop, pointer devices only)
- **Subtle parallax:** the scene translates up to ±10px opposite to the pointer position, eased with a slow lerp (factor 0.06 per frame). It's disabled while a close-up is open, on touch devices, and under reduced motion.

### 6.4 Effects layer (data-driven, `room.effects[]`)
| type | Look | Implementation |
|---|---|---|
| `steam` | 3 soft white wisps rising and fading over about 3s, looping and staggered | Absolutely positioned SVG paths or blurred divs with CSS keyframes (translateY −40px, opacity 0 → .6 → 0, slight scaleX wobble) |
| `flicker` | A screen or candle light flickering | Animates the opacity of the matching light (`lightId`) through irregular keyframes |
| `twinkle` | Fairy lights | Small dots along a polyline (`points`), with random staggered opacity pulses |

Effects must use only `transform` and `opacity` (GPU-friendly), and must pause when the tab is hidden (`document.visibilityState`).

### 6.5 Discovery progress (light "escape room" flavour)
- Store visited object ids in `localStorage` under the key `eh.visited` (a JSON array). Wrap all storage access in try/catch, since storage may be unavailable. If it is, the site still works but progress doesn't persist.
- Show the progress line in the Explore menu (§3.4).
- **When all enabled objects have been visited:** show a one-time small celebratory toast, "You've seen everything. Thanks for visiting my home 🧡", with a "Say hi" link that points to the mailbox close-up. Store `eh.completed = true`.

### 6.6 Reduced motion (`prefers-reduced-motion: reduce`)
- Camera zoom: **no transform animation**. The panel simply fades in, and the scene stays put (or jumps instantly to the zoomed state; prefer staying put).
- Room transitions become a plain 200ms crossfade.
- Disable pin breathing, parallax, steam, twinkle, and flicker. Lighting phase changes become instant.

---

## 7. Day/night lighting system

### 7.1 Phases (by the visitor's local clock)
| Phase | Local time | Look |
|---|---|---|
| `morning` | 05:00–10:59 | Soft, warm, slightly hazy |
| `day` | 11:00–16:59 | The base image, no grade |
| `sunset` | 17:00–19:59 | Golden-orange warmth with a slight purple in the shadows; lamps begin to glow |
| `night` | 20:00–04:59 | Dark dusky blue; lamps, windows, and screens glow strongly |

Recompute the phase every 60s and also on `visibilitychange`. Phase changes animate over `--dur-light`.

**Overrides,** in priority order: `?time=` query param, then the manual choice from the time chip (stored for the session only, in `sessionStorage` key `eh.time`), then auto.

### 7.2 Overlay layers (inside the scene, above the image, below the pins)
1. **Grade layer:** a full-size div per phase. Values are starting points that can be tuned:
   - morning: bg `--grade-morning`, `mix-blend-mode: soft-light`, opacity .55
   - day: opacity 0
   - sunset: two stacked divs. `--grade-sunset-warm` with `multiply` at .38, plus `--grade-sunset-cool` with `soft-light` at .25
   - night: `--grade-night` with `multiply` at .68
2. **Lights layer:** for each `room.lights[i]` whose `phases` include the current phase, render a div centred at `(x, y)`, with diameter `radius × 2 × W`, background `radial-gradient(circle, color 0%, color/40% 35%, transparent 70%)`, and `mix-blend-mode: screen`. Opacity depends on the phase: sunset .55, night .95, morning and day .3 (only if the light lists those phases).
   - `kind: window` lights should use a soft rectangle-ish gradient (an ellipse with an aspect ratio from optional `w`, `h`) instead of a circle.
3. **Page background:** also tint the page `bgColor` for the current phase (mix it 0–60% toward `--grade-night` at night, and so on), so the area outside the diorama matches.

### 7.3 Implementation notes
- Use a pure function, `getPhase(date: Date): Phase`, and unit-test the boundaries (04:59, 05:00, 10:59, 11:00, 16:59, 17:00, 19:59, 20:00).
- Put the lighting overlay in a `LightingOverlay` component that receives `room` and `phase`. Animate opacity changes only.
- **Performance guard:** on devices where `navigator.hardwareConcurrency <= 4` **and** there's a coarse pointer, render lights without blend modes (plain opacity gradients). The visual difference is acceptable.

### 7.4 Time chip (top bar)
- It shows an icon (sunrise, sun, sunset, moon from Lucide) and the phase name in the current language.
- Click it to cycle through `morning → day → sunset → night → auto`. In auto mode it shows a small "auto" dot.
- Use `aria-label`: "Lighting: night (automatic). Change lighting."

---

## 8. Sound

- **Off by default.** Nothing plays until the visitor turns it on with the top-bar speaker toggle or the headphones panel. This also satisfies browser autoplay policies.
- The preference is remembered in `localStorage` key `eh.sound` (`"on"`/`"off"`). Even when it's stored as "on", start audio only after the first user interaction on a new visit, because of autoplay policy.
- **Library:** Howler.js.
- **Per-room ambient loop** (`room.ambientSound`, with an optional per-phase override `room.ambientSoundByPhase`). Volume 0.35, a crossfade of 800ms between rooms, and the volume ducks to 0.15 while a close-up is open.
- **UI sounds** (only when sound is on): a soft wooden "tap" when a pin opens (volume 0.25), a gentle "whoosh" on room change (0.2), and a paper "rustle" when the sketchbook gallery changes item (0.2).
- **Formats:** `.webm` (Opus) plus an `.mp3` fallback, ≤ 400KB per loop, loopable without clicks, stored in `public/audio/`.
- **Licensing:** **CC0 only**, from Freesound.org with the CC0 filter. Record each file's source URL and author in `public/audio/CREDITS.md`, even though CC0 doesn't require it. `PLACEHOLDER`: the agent ships **silent placeholder files**, or a generated very soft pink-noise loop, and lists the exact sounds to find in CREDITS.md (birds, crickets, room tone, vinyl crackle, simmering pot, distant TV crowd, wood tap, whoosh, paper rustle).

---

## 9. Languages (EN/BG)

- **Languages:** English (`en`, default) and Bulgarian (`bg`).
- **Initial language:** the `?lang=` param if present, then `localStorage` `eh.lang`, then `navigator.language` starting with `bg` → `bg`, then `en`.
- The toggle updates `<html lang>`, `document.title`, all UI strings, and all content **without reloading or losing the current room or close-up**. It also updates the URL `?lang=` with `replaceState`, so shared links keep the language.
- **All user-visible strings live in content files** as `{ "en": "...", "bg": "..." }` objects (§13). No hard-coded UI text in components.
- **Missing translation:** fall back to `en` and log a console warning in dev only. `npm run validate-content` lists missing `bg` strings as **warnings**, not errors, so the build never blocks.
- The Bulgarian UI strings in Appendix A are **drafts**. The owner is a native speaker and will review them (`PLACEHOLDER`).
- Typography already supports Cyrillic (§2.2). Test BG layout for longer strings, because Bulgarian words often run about 15–25% longer.

---

## 10. Desktop and mobile experiences

### 10.1 Desktop (primary; ≥ 900px)
- The scene fits the viewport height. On a 16:9 screen the diorama fills the screen nicely, and on wider screens the background colour fills the sides.
- Pin labels appear on hover or focus.
- Parallax is on (§6.3).
- If the scene is wider than the viewport (a narrow window), pan with a **click-and-drag** (cursor `grab`/`grabbing`), trackpad horizontal scroll or shift+wheel, or the `←`/`→` keys.
- The close-up is a right-side panel, with no scrim.

### 10.2 Mobile and touch (< 900px or `pointer: coarse`)
- The scene fits `100dvh` and pans horizontally through **native scrolling** (`overflow-x: auto`, hidden scrollbar, momentum scrolling). Use native scroll, not custom JS pan, for smoothness and accessibility.
- First visit: show a small hint, "Swipe to look around ↔", that dismisses on the first scroll or after 4s (`localStorage` `eh.swipeHint`).
- **Pin labels are always visible** at `--text-xs` with 90% opacity, so visitors know what to tap. If two labels overlap, hide the one with the lower `labelPriority` (default 0).
- The close-up is a bottom sheet (§5.3). The lightbox supports pinch-zoom.
- The Explore menu is a full-screen sheet.
- The top bar collapses into: wordmark (left), then sound toggle and **Explore** (right). The language toggle and time chip move into the Explore menu's header.
- Test it in portrait **and** landscape. Landscape phones behave like the desktop layout but with touch rules.

### 10.3 Breakpoints
`--bp-narrow: 600px`, `--bp-mid: 900px`, `--bp-wide: 1440px`. Detect input type with `(pointer: coarse)` and `(hover: hover)`, not just width.

---

## 11. Accessibility, privacy, and SEO

### 11.1 Accessibility (WCAG 2.1 AA, required)
- Every pin is a real `<button>` with an `aria-label` such as "Open: Pot of stuffed peppers" or "Go to: Bedroom". Doorways may be `<a href>` links styled as pins.
- The room image's `alt` text describes the room (from `room.imageAlt`). Pins are listed in the DOM in logical order (§3.3).
- Visible focus: a 3px `--color-focus` outline with a 2px offset, plus a paper-coloured halo, so it's visible on both dark and light art.
- **No text baked into images is the only source of information.** All labels are HTML.
- Dialog and menu focus management as described in §3.4 and §5.3.
- The lighting phase must never reduce the contrast of **UI** text: pins and panels sit above the overlay.
- A "Skip to quick tour" link is the first focusable element (visually hidden until focused).
- Respect reduced motion (§6.6). Sound is off by default (§8).
- Target sizes are ≥ 44×44px.
- Run axe (for example `@axe-core/playwright`) in tests with zero serious or critical violations (§18).

### 11.2 Privacy (no tracking in v1)
- **No analytics, no cookies, no third-party requests on load.** Fonts are self-hosted. There are no external scripts.
- **Spotify embed:** **click-to-load only**, with a short notice on the placeholder card. The iframe URL comes from content (`https://open.spotify.com/embed/playlist/<id>`).
- **Instagram and TikTok:** plain links only, no embeds.
- **Email obfuscation:** don't put the raw email address in the static HTML or JS bundle. Store it in content as `{ "user": "erika.doumbova", "domain": "gmail.com" }`, and assemble the `mailto:` link and visible text at runtime when the element mounts. Also give it a "Copy email" button that shows a "Copied" toast.
- `localStorage`/`sessionStorage` keys are all prefixed `eh.` and contain only UI preferences and progress, nothing personal. A footer line in the Explore menu and on `/tour` says: "This site doesn't use cookies or tracking. Your progress and settings stay in your browser."

### 11.3 SEO and sharing
- In `index.html`: title "Erika Doumbova · graphic designer & content creator", a meta description, Open Graph and Twitter tags (`og:image` = `public/og.jpg`, 1200×630, cropped from the Front render; `PLACEHOLDER` until the art exists), `theme-color` = canvas, and a favicon (a simple house icon in terracotta, SVG plus a 180px PNG).
- `/tour` is the crawlable content. Also generate `dist/tour/index.html` (§15.3), and add `public/robots.txt` and `public/sitemap.xml` listing the room and tour URLs. The sitemap base URL is a `PLACEHOLDER` until the repo name is known.

---

## 12. Tech stack and architecture

### 12.1 Stack (decided; don't substitute)
| Concern | Choice |
|---|---|
| Build tool | **Vite** (latest stable) |
| UI | **React** (latest stable) + **TypeScript** (strict) |
| Routing | **React Router** (latest stable, library/declarative mode with `BrowserRouter`) |
| Animation | **Motion** (`motion` package, `motion/react`; formerly Framer Motion) |
| Audio | **Howler.js** |
| Content validation | **Zod** |
| Icons | **lucide-react** |
| Fonts | `@fontsource/lora`, `@fontsource/nunito` |
| Styling | Plain CSS with CSS custom properties + CSS Modules (`*.module.css`). **No Tailwind, no CSS-in-JS runtime.** |
| Image processing (build time) | **sharp** in a Node script |
| Tests | **Vitest** (unit), **Playwright** + `@axe-core/playwright` (e2e/a11y) |
| Lint/format | ESLint (typescript-eslint, react-hooks) + Prettier |
| Node | Current Node.js LTS; pin it in `.nvmrc` and the `engines` field |
| Hosting | **GitHub Pages**, deployed by **GitHub Actions** |

There's no backend, no database, and no CMS in v1. Commit `package-lock.json`.

### 12.2 Repository structure
```
/
├─ .github/
│  └─ workflows/
│     └─ deploy.yml               # build + test + deploy to Pages (§15)
├─ assets-src/                    # ← OWNER uploads originals here via GitHub web UI
│  ├─ rooms/                      # front.png, living-room.png, bedroom.png, kitchen.png
│  ├─ objects/                    # close-up images (restyled object photos)
│  ├─ art/                        # original posters & drawings (NOT restyled)
│  │  ├─ posters/
│  │  └─ drawings/
│  ├─ photos/                     # untouched personal photos (e.g. cathedral, wall)
│  └─ README.md                   # owner instructions: names, sizes, how to upload
├─ content/                       # ← OWNER edits text here via GitHub web UI
│  ├─ site.json                   # name, intro, contact, UI strings (EN/BG)
│  └─ rooms/
│     ├─ front.json
│     ├─ living-room.json
│     ├─ bedroom.json
│     └─ kitchen.json
├─ public/
│  ├─ audio/  (+ CREDITS.md)
│  ├─ favicon.svg, apple-touch-icon.png, og.jpg, robots.txt, sitemap.xml
│  └─ generated/                  # build output of image script (git-ignored)
├─ scripts/
│  ├─ process-images.mjs          # sharp: variants, LQIP, bgColor → src/generated/images.json
│  ├─ make-placeholders.mjs       # generates placeholder room/object art (§14.6)
│  ├─ validate-content.mjs        # zod validation, friendly errors (§13.5)
│  └─ spa-routes.mjs              # writes route index.html copies + 404.html (§15.3)
├─ src/
│  ├─ main.tsx, App.tsx, routes.tsx
│  ├─ content/
│  │  ├─ schema.ts                # zod schemas + inferred TS types (§13)
│  │  ├─ load.ts                  # imports JSON, validates in dev, exposes typed data
│  │  └─ useT.ts                  # localisation helper
│  ├─ state/                      # small React contexts: lang, sound, time, visited
│  ├─ components/
│  │  ├─ TopBar/, ExploreMenu/, Loader/, Toast/
│  │  ├─ Room/ (RoomView, Scene, Pins, DoorwayPin, ObjectPin, EffectsLayer, LightingOverlay)
│  │  ├─ CloseUp/ (CloseUpPanel, blocks/{Paragraph,Image,Gallery,Recipe,Links,List,Spotify,Quote}, Lightbox)
│  │  ├─ QuickTour/
│  │  └─ dev/HotspotEditor/       # ?edit=1 tool (§13.6)
│  ├─ hooks/ (useCamera, usePhase, usePan, usePrefersReducedMotion, useMediaQuery)
│  ├─ lib/ (phase.ts, camera.ts, storage.ts, email.ts, audio.ts)
│  ├─ styles/ (tokens.css, global.css, print.css)
│  └─ generated/                  # images.json from process-images (git-ignored)
├─ tests/ (unit/, e2e/)
├─ docs/ (HANDOFF.md, planning/decisions.md, OWNER-GUIDE.md)
├─ index.html, vite.config.ts, tsconfig.json, package.json, .nvmrc
└─ README.md                       # short: what this is, link to OWNER-GUIDE.md
```

### 12.3 Key architectural rules
- **Content is data.** Components never contain personal copy. Rooms, objects, doorways, lights, and effects all come from `content/rooms/*.json`.
- **Adding a room requires no code:** a new JSON file plus an image produces a route, an Explore entry, and a quick-tour section, as long as the room's `id` is added to the `rooms` order array in `site.json`.
- **State** uses React context with tiny stores; no Redux or Zustand needed. Contexts: `LangContext`, `SoundContext`, `PhaseContext`, `VisitedContext`.
- **Code-split** the Quick tour, Lightbox, and HotspotEditor (`React.lazy`).
- **Image references** in content are paths relative to `assets-src/` (for example `"rooms/kitchen.png"`). The app resolves them through `src/generated/images.json` to responsive variants. **If an image is missing, fall back to its placeholder** and log a build warning (§14.6), never a build failure.

---

## 13. Content model and data structures

### 13.1 Types (zod schemas in `src/content/schema.ts` → inferred TS types)
```ts
type Lang = 'en' | 'bg';
type L10n = { en: string; bg?: string };          // bg optional → falls back to en
type Phase = 'morning' | 'day' | 'sunset' | 'night';
type Point = { x: number; y: number };            // normalized 0–1

interface Site {
  name: L10n;                       // "Erika Doumbova"
  tagline: L10n;                    // "Graphic designer & content creator"
  intro: L10n;
  rooms: string[];                  // order + which rooms are live, e.g. ["front","living-room","bedroom","kitchen"]
  contact: {
    email: { user: string; domain: string };
    instagram: { handle: string; url: string };
    tiktok: { handle: string; url: string };
  };
  spotifyEmbedUrl?: string;         // PLACEHOLDER
  features: { guestbook: boolean }; // false in v1 (§20)
  ui: Record<string, L10n>;         // every UI string (see Appendix A, site.json)
  seo: { title: L10n; description: L10n; siteUrl: string /* PLACEHOLDER */ };
}

interface Room {
  id: string;                       // "kitchen" — also the URL slug
  name: L10n;
  theme: L10n;                      // "Where I'm from"
  image: string;                    // "rooms/kitchen.png" (relative to assets-src)
  imageAlt: L10n;
  initialFocusX?: number;           // 0–1, default 0.5
  ambientSound?: string;            // "audio/kitchen-simmer" (no extension)
  ambientSoundByPhase?: Partial<Record<Phase, string>>;
  doorways: Doorway[];
  objects: RoomObject[];
  lights?: Light[];
  effects?: Effect[];
}

interface Doorway {
  to: string;                       // room id
  x: number; y: number;
  direction: 'left' | 'right' | 'up' | 'down';
  label?: L10n;                     // default: target room name + arrow
}

interface RoomObject {
  id: string;                       // URL slug, unique within room
  enabled?: boolean;                // default true
  name: L10n;                       // pin label + aria
  x: number; y: number;             // pin position
  labelPriority?: number;           // for mobile label collision (§10.2)
  zoom?: { x?: number; y?: number; scale?: number };  // default: pin pos, 1.8
  title: L10n;                      // panel title (can differ from name)
  blocks: Block[];
  special?: 'cycle-lighting';       // street lamp easter egg (§5.5)
  bubble?: L10n;                    // tooltip text for special objects
}

type Block =
  | { type: 'paragraph'; text: L10n }
  | { type: 'image'; src: string; alt: L10n; caption?: L10n }
  | { type: 'gallery'; items: { src: string; alt: L10n; caption?: L10n }[] }
  | { type: 'recipe'; servings: number; time: L10n;
      ingredients: L10n[]; steps: L10n[]; tip?: L10n }
  | { type: 'links'; items: { kind: 'email' | 'instagram' | 'tiktok' | 'external';
      label: L10n; href?: string }[] }                 // email/instagram/tiktok resolve from site.contact
  | { type: 'list'; items: { title: string; subtitle?: L10n; note?: L10n }[] }
  | { type: 'spotify'; title: L10n; embedUrl?: string } // default: site.spotifyEmbedUrl
  | { type: 'quote'; text: L10n; cite?: L10n }
  | { type: 'sound-toggle' };                            // headphones panel

interface Light {
  id: string;
  kind: 'lamp' | 'window' | 'screen' | 'candle';
  x: number; y: number;
  radius: number;                   // normalized to image width
  w?: number; h?: number;           // window ellipse proportions
  color: string;                    // hex
  phases: Phase[];
}

type Effect =
  | { type: 'steam'; x: number; y: number; phases?: Phase[] }
  | { type: 'flicker'; lightId: string; phases?: Phase[] }
  | { type: 'twinkle'; points: Point[]; color?: string; phases?: Phase[] };
```

### 13.2 Validation rules (zod refinements)
- All normalized numbers must be within [0, 1]. `zoom.scale` must be within [1.2, 3].
- Object ids must be unique within a room. Room ids must be unique and match the file name.
- `doorways[].to` must reference a room listed in `site.rooms`. **Warn**, don't error, if it references a room that isn't live.
- Image paths must exist in `assets-src/`, or else a **warning** and a placeholder is used.
- Missing `bg` strings produce a **warning**.
- `blocks` must be non-empty unless the object has a `special` value (for example, the street lamp).
- Any string containing `PLACEHOLDER` produces a **warning**, and the warnings are summarized at the end of the build log so the owner can see what's left to fill in.

### 13.3 Generated image manifest (`src/generated/images.json`)
```json
{
  "rooms/kitchen.png": {
    "width": 2752, "height": 1548, "aspect": 1.7778,
    "bgColor": "#F3EAD9",
    "lqip": "data:image/webp;base64,....",          // ~24px wide, blurred
    "variants": [
      { "w": 800,  "src": "generated/rooms/kitchen-800.webp" },
      { "w": 1600, "src": "generated/rooms/kitchen-1600.webp" },
      { "w": 2752, "src": "generated/rooms/kitchen-2752.webp" }
    ],
    "placeholder": false
  }
}
```
- Room variants: widths `[800, 1600, 2400, 3200]` capped at the source width, plus the source width itself if it's below the next step. WebP at quality 82, plus an AVIF of the 1600 variant if it's quick enough.
- Object, art, and photo variants: widths `[600, 1200, 2000]`, capped.
- Track performance budgets per file (§18.3).

### 13.4 Example: one object (full JSON)
```json
{
  "id": "stuffed-peppers",
  "name": { "en": "Pot of stuffed peppers", "bg": "Тенджера с пълнени чушки" },
  "x": 0.43, "y": 0.47,
  "zoom": { "scale": 2.0 },
  "title": { "en": "Пълнени чушки (stuffed peppers)", "bg": "Пълнени чушки" },
  "blocks": [
    { "type": "image", "src": "objects/stuffed-peppers.png",
      "alt": { "en": "A pot of stuffed peppers baked golden with yogurt sauce", "bg": "Тенджера с пълнени чушки, запечени със сос от кисело мляко" } },
    { "type": "paragraph", "text": { "en": "PLACEHOLDER — the story: who makes them at home, when you eat them.", "bg": "PLACEHOLDER" } },
    { "type": "recipe", "servings": 4, "time": { "en": "About 1 h 30 min", "bg": "Около 1 ч 30 мин" },
      "ingredients": [ { "en": "...", "bg": "..." } ],
      "steps": [ { "en": "...", "bg": "..." } ] }
  ]
}
```
The full drafted content for every room is in **Appendix A**.

### 13.5 Content validation command
`npm run validate-content` runs in CI before the build. On failure it prints **owner-friendly** messages naming the file, the JSON path, and the fix. For example:
```
✖ content/rooms/kitchen.json → objects[0].x is 1.4 but must be between 0 and 1.
  Tip: open the live site with ?edit=1, click the object, and copy the numbers it shows.
```
JSON syntax errors must report the line and column, and suggest "check for a missing comma or quote".

### 13.6 Hotspot editor (`?edit=1`, works in production)
The owner uses this to position pins without code:
- It adds a translucent toolbar: "Edit mode: click the image to get coordinates".
- Clicking anywhere on the scene shows a crosshair and a floating card with `"x": 0.512, "y": 0.433` and a **Copy** button.
- **Existing pins and doorways are draggable.** After dragging, a "Copy room JSON" button copies that room's full updated JSON, with 3-decimal precision, ready to paste into the GitHub editor.
- Lights are shown as dashed circles and are also draggable. Their radius can be resized with the mouse wheel while hovering.
- It never saves anything, only copies. Close it with "Exit edit mode", which removes the param.

---

## 14. Artwork and asset creation workflow

### 14.1 Principles
1. **Rooms and object close-ups:** the owner's own photos, **restyled by Google Gemini** into one consistent soft-3D style.
2. **Erika's posters and drawings are shown as the originals, never AI-restyled.** They are her real work. In the room renders they appear as small framed miniatures, and the close-ups show the original scans and exports.
3. **No text inside AI images.** Gemini garbles text, and all labels are HTML anyway.
4. **Consistency beats perfection.** Always give Gemini the **first approved render** as a style reference for every later image.
5. **No logos or third-party artwork reproduced in close-ups.** For the Shawn Mendes poster, the room render can show it small, and the close-up uses her own wall photo.

### 14.2 Photographing (owner)
- Use landscape orientation, shot from a corner of the room at standing or slightly raised height, to show **two walls and the floor** (this matches the isometric cutaway).
- Use daylight, curtains open, lamps on. Tidy up. Keep the key objects (posters, sketchbook, ring light, TV, bookshelf, pot, fridge) clearly visible.
- For object close-ups, place the object on a plain surface with soft daylight, and shoot from the front or 3/4 view.
- For posters and drawings: export posters from the design file (PNG or JPG, ≥ 2000px on the long side). Scan drawings, or photograph them flat in daylight and crop them square to the paper.

### 14.3 Restyling with Gemini (owner)
Use the prompts in **Appendix B**. Workflow:
1. Restyle the **living room first** (it's the most complex), and iterate until it feels right. That image becomes the **style reference**.
2. For every other room, upload *the room photo* **plus** *the style reference* and use prompt B.2 ("match the style of the second image").
3. For the Front exterior, use prompt B.3 with the style reference.
4. For object close-ups, use prompt B.4 with the object photo plus the style reference.
5. Download the highest resolution available.

### 14.4 Export specs (what to upload)
| Asset | Folder | Name | Format | Size |
|---|---|---|---|---|
| Room render | `assets-src/rooms/` | `front.png`, `living-room.png`, `bedroom.png`, `kitchen.png` | PNG or JPG | 16:9, **≥ 2400px wide ideal**, 1600px minimum |
| Object close-up | `assets-src/objects/` | `<object-id>.png` (e.g. `stuffed-peppers.png`) | PNG/JPG | ≥ 1200px long side |
| Poster | `assets-src/art/posters/` | `poster-1.png` … | PNG/JPG | ≥ 2000px long side |
| Drawing | `assets-src/art/drawings/` | `drawing-1.jpg` … | JPG | ≥ 2000px long side |
| Personal photo | `assets-src/photos/` | `nevsky.jpg`, `wall-poster.jpg` | JPG | ≥ 1600px long side |

**If Gemini's output is under 2400px wide:** upscale it 2× with **Upscayl**, a free, open-source desktop app with a graphical interface and no terminal. It's optional, and the site works at 1600px with less zoom headroom (§5.2 caps the zoom automatically).

### 14.5 Uploading
Owner steps, via the web UI: GitHub repo → open the folder → **Add file → Upload files** → drag the file in, **using exactly the same name** to replace a placeholder → **Commit changes**. GitHub Actions rebuilds and the site updates in about 1–3 minutes. See `docs/OWNER-GUIDE.md`.

### 14.6 Placeholders (agent creates these in M1)
`scripts/make-placeholders.mjs` generates PNGs with sharp from SVG templates, and **commits them under `assets-src/_placeholders/`**:
- **Rooms:** a 3200×1800 isometric placeholder diorama on `#F6EEDF`, with a floor rhombus and two wall planes in muted tones and soft flat shading. It has labelled rounded boxes at each object's coordinates (for example "Sketchbook") and door shapes at each doorway, plus a small "placeholder art" tag in the bottom-right corner. **It's generated from the room JSON**, so the pins line up with the boxes.
- **Objects, art, and photos:** 1200×900 paper-coloured cards with a terracotta outline icon and the object name.
- **Resolution order** in `process-images.mjs`: if `assets-src/<path>` exists, use it, otherwise use `assets-src/_placeholders/<path>`, and mark `"placeholder": true`.

> When real art replaces a placeholder, the object positions in the art won't match the JSON automatically. **Retune each room with the hotspot editor (§13.6) after uploading its real render.** This is a planned step in M5.

---

## 15. Build, deploy, and hosting (GitHub Pages)

### 15.1 npm scripts
```json
{
  "scripts": {
    "dev": "npm run images && vite",
    "images": "node scripts/process-images.mjs",
    "placeholders": "node scripts/make-placeholders.mjs",
    "validate-content": "node scripts/validate-content.mjs",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "build": "npm run validate-content && npm run images && vite build && node scripts/spa-routes.mjs",
    "preview": "vite preview"
  }
}
```

### 15.2 Base path
- If the repo is named `<username>.github.io`, the site is at `https://<username>.github.io/` and `base = '/'`. **This is the recommended setup** (the owner was told this).
- Otherwise the site is at `https://<username>.github.io/<repo>/` and `base = '/<repo>/'`.
- In `vite.config.ts`: `base: process.env.BASE_PATH ?? '/'`. The workflow computes `BASE_PATH` automatically (below). Every asset path must respect `import.meta.env.BASE_URL`, including audio, generated images, and the OG image (which must be absolute: build it from `site.seo.siteUrl`).

### 15.3 Clean URLs on GitHub Pages (`scripts/spa-routes.mjs`)
GitHub Pages has no SPA rewrites. After `vite build`:
- Copy `dist/index.html` to `dist/<room>/index.html` for every live room, to `dist/<room>/<object>/index.html` for every enabled object, and to `dist/tour/index.html`.
- Copy `dist/index.html` to `dist/404.html`, so unknown paths still boot the app, which then redirects (§3.1).
- In each copy, inject the room- or object-specific `<title>` and `<meta name="description">` for nicer sharing.
- Write `dist/.nojekyll`.

### 15.4 GitHub Actions workflow (`.github/workflows/deploy.yml`)
```yaml
name: Build and deploy
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - name: Compute base path
        run: |
          REPO="${GITHUB_REPOSITORY#*/}"
          if [[ "$REPO" == *.github.io ]]; then echo "BASE_PATH=/" >> $GITHUB_ENV
          else echo "BASE_PATH=/$REPO/" >> $GITHUB_ENV; fi
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
      - run: npm run build
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      - name: E2E + accessibility smoke tests
        run: npm run test:e2e
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```
Use the **current major versions** of these actions at build time, since newer ones may exist. Cache `public/generated/` keyed on a hash of `assets-src/**` so image processing is fast on content-only commits.

### 15.5 One-time setup
- **Agent:** create the GitHub repo (preferably named `<username>.github.io`; the username is a `PLACEHOLDER`), push `main`, and confirm the first Actions run is green.
  - If the agent needs GitHub authentication, it should guide the owner through the **browser-based** sign-in flow, which needs no typing in a terminal.
- **Owner,** in the web UI: repo → **Settings → Pages → Build and deployment → Source: "GitHub Actions"**. The agent should tell the owner exactly when to do this.
- **Visibility:** GitHub Pages is free for **public** repos. A private repo needs GitHub Pro, which is free with the GitHub Student Developer Pack. Default to public. The repo will contain the owner's photos, which are published on the site anyway.

---

## 16. Owner's maintenance guide (no terminal)

The agent must write **`docs/OWNER-GUIDE.md`** in friendly, plain language with screenshot-style step lists. At minimum it covers:
1. **Change any text:** open `content/rooms/<room>.json` on GitHub → pencil icon → edit the text between quotes (`"en"` and `"bg"`) → Commit. Include a "don't break the JSON" mini-guide: keep quotes and commas, and how to spot errors.
2. **Replace an image:** upload it with the same file name to the right folder (§14.4 table).
3. **Add a new poster:**
   - Upload `poster-4.png`.
   - Copy the `poster-3` object block in `living-room.json`, change the id, title, and image path.
   - Get the coordinates with `?edit=1`.
4. **Move a pin:** open the live site with `?edit=1`, drag the pin, click "Copy room JSON", paste it over the room file on GitHub, and commit.
5. **Check that the site updated:** the repo's **Actions** tab. A green ✓ means it's live, and a red ✗ means a problem. Click it, and the message explains which file and line to fix (§13.5).
6. **Undo a mistake:** open the commit on GitHub and click **Revert**, or edit the file back.
7. **Turn an object on or off:** `"enabled": false`.
8. **Fill in placeholders:** a checklist mirroring §19.

---

## 17. Development milestones

Build in this order. **Deploy at the end of every milestone.** Each one must leave the live site working.

### M0: scaffold and pipeline (deploy "hello house")
- Vite + React + TS strict, ESLint, Prettier, Vitest, Playwright, `.nvmrc`.
- Tokens, fonts, global CSS.
- The `deploy.yml` workflow, base-path logic, and `spa-routes.mjs`.
- **Done when:** the Actions run is green, the GitHub Pages URL shows "Erika Doumbova" in Lora on the canvas colour, and a hard refresh on `/kitchen` doesn't 404.

### M1: content model, placeholders, rooms, and navigation
- Zod schemas, `validate-content`, `content/` files (Appendix A), `make-placeholders`, and `process-images`.
- `RoomView` with the fit rule, the native horizontal pan, doorway pins, room transitions, the top bar (wordmark plus Explore), the Explore menu (without progress yet), and the 404 redirect.
- **Done when:** all 4 rooms are reachable by doorway pins, the Explore menu, deep links, and back/forward; the placeholder art is aligned with the pins; and invalid JSON fails CI with a friendly message.

### M2: objects and close-ups
- Object pins (all states), the camera zoom (§5.2), the close-up panel/sheet, all block renderers, the lightbox, the recipe card and its print stylesheet, email obfuscation, the click-to-load Spotify embed, prev/next, and `/:room/:object` routing.
- The Street lamp easter egg (with a stub phase cycle until M3).
- **Done when:** every object opens and closes with the zoom on desktop and mobile, deep links to objects work on refresh, and Esc, focus trap, and focus return all work.

### M3: living world (lighting, sound, language)
- Phase logic with unit tests, `LightingOverlay`, the time chip, the `?time=` override, the effects layer (steam, flicker, twinkle), Howler sound with toggles and the headphones block, and placeholder audio plus `CREDITS.md`.
- The EN/BG toggle with persistence and the `?lang=` param, plus the BG drafts from Appendix A.
- **Done when:** `?time=night` visibly darkens each room with glowing lamps; the street lamp cycles phases; sound is silent until toggled; and BG switches every string without losing state.

### M4: polish, accessibility, mobile, and the quick tour
- The loader, first-visit welcome card, swipe hint, parallax, visited state, discovery progress, completion toast, and reduced-motion handling.
- Mobile label rules and the mobile top bar.
- The `/tour` page, SEO meta, OG and favicon, robots and sitemap.
- The contrast check, axe tests, and keyboard-only pass.
- `docs/OWNER-GUIDE.md` and `assets-src/README.md`.
- The `?edit=1` hotspot editor.
- **Done when:** all §18 acceptance criteria pass with placeholder art.

### M5: real art integration (with the owner)
- The owner uploads renders and art (§14). The agent (or the owner, using `?edit=1`) retunes pins, lights, and effects per room.
- Swap in real audio from Freesound CC0 and update CREDITS.md.
- Replace the `og.jpg` with a crop of the real Front render.
- **Done when:** no `"placeholder": true` remains in the manifest for live rooms, or the owner explicitly accepts the remaining placeholders.

> **Same-day target:** M0–M2 deliver a navigable, clickable house on placeholder art. M3–M4 make it feel alive and complete. M5 depends on the owner's art and can happen progressively after launch.

---

## 18. Testing requirements and acceptance criteria

### 18.1 Automated (run in CI on every push; failures block deploy)
- **Unit (Vitest):**
  - `getPhase` boundaries (§7.3)
  - camera math (`computeCameraTransform`) for desktop and mobile targets, including scale clamping
  - localisation fallback
  - email assembly
  - storage helpers when `localStorage` throws
  - zod schema accepts Appendix A and rejects out-of-range coordinates
- **E2E (Playwright, Chromium, desktop 1440×900 and mobile 390×844 emulation):**
  1. `/` loads, the loader disappears in under 3s on CI, and the name is visible.
  2. Each room route loads directly (a hard navigation) and shows the right room name.
  3. Clicking a doorway pin navigates to its room. Browser back returns.
  4. Clicking each enabled object opens a dialog with the right title. Esc closes it, and focus returns to the pin.
  5. `/kitchen/stuffed-peppers` loads directly with the recipe visible.
  6. Language toggle: `<html lang="bg">`, and a known BG string is visible, with the room and close-up state preserved.
  7. `?time=night` puts the night overlay in the DOM with the expected opacity.
  8. No `<iframe>` exists until "Load player" is clicked in the Shawn Mendes panel.
  9. No network requests to third-party domains on initial load (assert from the request log).
  10. **axe:** no serious or critical violations on `/`, each room, an open close-up, the Explore menu, and `/tour`.
  11. `/does-not-exist` redirects to `/` with a toast.

### 18.2 Manual QA checklist (agent documents the results in the PR or commit description)
- [ ] Browsers: Chrome, Safari (macOS), Firefox, iOS Safari, Android Chrome.
- [ ] Keyboard only: can reach and open every object, the menus, and the toggles. Focus is always visible.
- [ ] VoiceOver (macOS or iOS) quick pass: pins are announced with clear names, and dialogs are announced.
- [ ] Reduced motion (OS setting): no zoom animation, no parallax, no steam.
- [ ] All four phases look good in every room (`?time=` each).
- [ ] BG: no overflowing or clipped strings in the top bar, pins, and panels.
- [ ] Mobile portrait and landscape: panning is smooth, labels are readable, and the sheet can be dragged and dismissed.
- [ ] Sound: off on first visit; turns on; crossfades between rooms; ducks during close-ups; the preference persists.
- [ ] Print the recipe: only the recipe prints, and it's clean.
- [ ] Very slow 3G (DevTools): the LQIP blur-up shows, and the loader gives up at 2.5s.

### 18.3 Performance budgets
- Lighthouse (desktop) **Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90** on `/`. Mobile performance ≥ 75.
- LCP < 2.5s on desktop broadband. The LCP element is the room image (use `fetchpriority="high"` for the current room's image).
- JS bundle (initial, gzip) ≤ 180KB.
- Room image at 1600w WebP ≤ 350KB. At 800w, ≤ 120KB. The LQIP is ≤ 1KB.
- Interactions stay at 60fps during the zoom on a mid-range laptop. There's no layout shift when panels open (CLS < 0.05).

### 18.4 Definition of done (v1)
- [ ] All of M0–M4 is complete and deployed on GitHub Pages with clean URLs.
- [ ] All automated tests are green in CI.
- [ ] The §18.2 checklist is executed and results noted.
- [ ] `docs/OWNER-GUIDE.md` exists and is understandable without coding knowledge.
- [ ] Every `PLACEHOLDER` from §19 is either filled or listed in the owner guide's checklist.

---

## 19. Assumptions and placeholders

| # | Item | Status | Fallback used in v1 |
|---|---|---|---|
| P1 | GitHub username / repo name | `PLACEHOLDER` | Agent asks the owner at M0. Recommend `<username>.github.io` |
| P2 | Room renders (4) | `PLACEHOLDER` | Generated placeholder dioramas (§14.6) |
| P3 | Poster files, titles, years, stories (3+) | `PLACEHOLDER` | Placeholder cards titled "Poster 1/2/3" |
| P4 | High-school drawings and captions | `PLACEHOLDER` | 4 placeholder gallery items |
| P5 | Content creation niche/description | `PLACEHOLDER` | Generic draft sentence plus IG and TikTok links |
| P6 | Sports followed / journalism story | `PLACEHOLDER` | Draft sentence about the goal without specifics |
| P7 | Favourite books (titles, authors, notes) | `PLACEHOLDER` | 3 "Book title / Author" rows |
| P8 | Spotify playlist URL | `PLACEHOLDER` | Spotify block shows "Playlist coming soon" (no load button) |
| P9 | Why Shawn Mendes / music story | `PLACEHOLDER` | Short draft sentence |
| P10 | Stuffed peppers recipe | **Draft provided** (Appendix A) | Owner confirms it matches her family's version |
| P11 | Sofia / Alexander Nevsky personal story and photo | `PLACEHOLDER` | Short draft text plus placeholder image |
| P12 | Bulgarian translations | **Drafts provided** for the UI and key strings | Owner reviews. Missing → EN fallback |
| P13 | Ambient and UI audio | `PLACEHOLDER` | Silent or soft-noise placeholders plus a list of sounds to source |
| P14 | OG share image | `PLACEHOLDER` | Generated placeholder (name on canvas colour) |
| P15 | Kitchen window object | Optional, `enabled: false` | Hidden |
| A1 | Front exterior is AI-generated (Sofia-inspired), not a photo | `ASSUMPTION` | Prompt B.3 |
| A2 | Bedroom has fairy lights | `ASSUMPTION` | Remove the light if untrue |
| A3 | Owner's living room has (or can stage) a ring light, TV, and a coffee table for the sketchbook | `ASSUMPTION` | Objects can be added to the scene in Gemini, or moved to other rooms in the JSON |
| A4 | The repo is public | `ASSUMPTION` | Private needs GitHub Pro (free via the Student Pack) |
| A5 | Desktop-first, but mobile is fully supported | Decided | — |
| A6 | No analytics in v1 | Decided | Optional cookieless counter later (§20) |

---

## 20. Out of scope for v1 / future ideas
- **Guestbook:** notes pinned on the kitchen fridge. A previous plan was instant publishing with automatic safeguards (length limit, rate limiting, profanity filter, honeypot, owner delete). It needs a backend, because GitHub Pages is static-only: for example a free Firebase Firestore plus a small serverless function on Cloudflare/Netlify, or a moderated GitHub-Issues-based approach. Keep a `features.guestbook` flag in `site.json` (default `false`).
- **Balcony room** ("Who I'm becoming"), with a skyline that changes with the lighting phase. The sports-journalism and studies objects could move there.
- **Seasonal reskins** (winter, birthday, graduation) via `room.imageBySeason`.
- **Separate lighting renders** per phase (replacing the overlay) if the owner learns Blender later.
- **Custom domain** (about €10/year).
- **Cookieless analytics** (for example GoatCounter's free tier).
- **Visitor "photo booth":** a shareable screenshot postcard of the visitor's favourite room.

---

## Appendix A: full room content files (draft copy)

> The copy below is a **first-person draft** written from the owner's answers. Text marked `PLACEHOLDER` must be replaced by the owner. Bulgarian strings are drafts for native review. Coordinates are **initial guesses that match the generated placeholder art**, and they must be retuned after the real renders arrive (M5).

### A.1 `content/site.json`
```json
{
  "name": { "en": "Erika Doumbova", "bg": "Ерика Думбова" },
  "tagline": { "en": "Graphic designer & content creator", "bg": "Графичен дизайнер и създател на съдържание" },
  "intro": {
    "en": "Hi, I'm Erika — a graphic designer and content creator from Sofia, Bulgaria. Come in and look around: everything that glows has a story.",
    "bg": "Здравей, аз съм Ерика — графичен дизайнер и създател на съдържание от София. Влез и разгледай: всичко, което свети, има своя история."
  },
  "rooms": ["front", "living-room", "bedroom", "kitchen"],
  "contact": {
    "email": { "user": "erika.doumbova", "domain": "gmail.com" },
    "instagram": { "handle": "@erika.doumbova", "url": "https://www.instagram.com/erika.doumbova/" },
    "tiktok": { "handle": "@eri_doumbova", "url": "https://www.tiktok.com/@eri_doumbova" }
  },
  "spotifyEmbedUrl": "",
  "features": { "guestbook": false },
  "seo": {
    "title": { "en": "Erika Doumbova · graphic designer & content creator", "bg": "Ерика Думбова · графичен дизайнер и създател на съдържание" },
    "description": { "en": "Step into Erika's cozy house and click around to discover her design work, what she loves, and where she's from.", "bg": "Влез в уютната къща на Ерика и разгледай нейния дизайн, нещата, които обича, и откъде е." },
    "siteUrl": "https://PLACEHOLDER-USERNAME.github.io"
  },
  "ui": {
    "explore": { "en": "Explore", "bg": "Разгледай" },
    "exploreTitle": { "en": "Explore the house", "bg": "Разгледай къщата" },
    "progress": { "en": "You've discovered {found} of {total} things", "bg": "Откри {found} от {total} неща" },
    "quickTourLink": { "en": "Prefer reading? Take the quick tour", "bg": "Предпочиташ да четеш? Виж бързата обиколка" },
    "quickTourTitle": { "en": "Quick tour", "bg": "Бърза обиколка" },
    "backToHouse": { "en": "Back to the house", "bg": "Обратно в къщата" },
    "skipToTour": { "en": "Skip to the text version", "bg": "Към текстовата версия" },
    "close": { "en": "Close", "bg": "Затвори" },
    "previous": { "en": "Previous", "bg": "Предишно" },
    "nextInRoom": { "en": "Next in this room", "bg": "Следващо в стаята" },
    "open": { "en": "Open", "bg": "Отвори" },
    "goTo": { "en": "Go to", "bg": "Към" },
    "comeIn": { "en": "Come in", "bg": "Влез" },
    "soundOn": { "en": "Turn sound on", "bg": "Включи звука" },
    "soundOff": { "en": "Turn sound off", "bg": "Изключи звука" },
    "lighting": { "en": "Lighting", "bg": "Осветление" },
    "auto": { "en": "auto", "bg": "автоматично" },
    "phase.morning": { "en": "Morning", "bg": "Сутрин" },
    "phase.day": { "en": "Day", "bg": "Ден" },
    "phase.sunset": { "en": "Sunset", "bg": "Залез" },
    "phase.night": { "en": "Night", "bg": "Нощ" },
    "welcome": { "en": "Welcome in. Click anything that glows. ✦", "bg": "Добре дошъл. Кликни върху всичко, което свети. ✦" },
    "gotIt": { "en": "Got it", "bg": "Разбрах" },
    "swipeHint": { "en": "Swipe to look around ↔", "bg": "Плъзни, за да разгледаш ↔" },
    "copyEmail": { "en": "Copy email", "bg": "Копирай имейла" },
    "copied": { "en": "Copied", "bg": "Копирано" },
    "loadPlayer": { "en": "Load player", "bg": "Зареди плейъра" },
    "spotifyNotice": { "en": "Loading this shares data with Spotify.", "bg": "Зареждането споделя данни със Spotify." },
    "playlistSoon": { "en": "Playlist coming soon", "bg": "Плейлистът идва скоро" },
    "ingredients": { "en": "Ingredients", "bg": "Продукти" },
    "steps": { "en": "Method", "bg": "Начин на приготвяне" },
    "servings": { "en": "Serves {n}", "bg": "За {n} порции" },
    "printRecipe": { "en": "Print recipe", "bg": "Принтирай рецептата" },
    "notFound": { "en": "That room doesn't exist (yet)", "bg": "Тази стая (още) не съществува" },
    "allFound": { "en": "You've seen everything. Thanks for visiting my home 🧡", "bg": "Видя всичко. Благодаря, че намина 🧡" },
    "sayHi": { "en": "Say hi", "bg": "Кажи здрасти" },
    "privacyNote": { "en": "This site doesn't use cookies or tracking. Your progress and settings stay in your browser.", "bg": "Сайтът не използва бисквитки или проследяване. Напредъкът и настройките ти остават в браузъра ти." },
    "editModeHint": { "en": "Edit mode: click the image to get coordinates", "bg": "Режим на редакция: кликни върху изображението за координати" }
  }
}
```

### A.2 `content/rooms/front.json`
```json
{
  "id": "front",
  "name": { "en": "Front", "bg": "Входът" },
  "theme": { "en": "Hi, I'm Erika", "bg": "Здравей, аз съм Ерика" },
  "image": "rooms/front.png",
  "imageAlt": { "en": "A cozy pastel house with a tiled roof, a front door, a mailbox and a street lamp", "bg": "Уютна пастелна къща с керемиден покрив, входна врата, пощенска кутия и уличен фенер" },
  "initialFocusX": 0.5,
  "ambientSoundByPhase": { "morning": "audio/birds", "day": "audio/birds", "sunset": "audio/crickets", "night": "audio/crickets" },
  "doorways": [
    { "to": "living-room", "x": 0.52, "y": 0.52, "direction": "up", "label": { "en": "Come in →", "bg": "Влез →" } }
  ],
  "objects": [
    {
      "id": "name-sign",
      "name": { "en": "Name sign", "bg": "Табелка с име" },
      "x": 0.40, "y": 0.50,
      "title": { "en": "Hi, I'm Erika", "bg": "Здравей, аз съм Ерика" },
      "blocks": [
        { "type": "paragraph", "text": { "en": "I'm a graphic designer and content creator, born and raised in Sofia, Bulgaria. Right now I'm in my second year of the Bachelor in Communication and Digital Media at IE University.", "bg": "Графичен дизайнер съм и създавам съдържание. Родена и израснала съм в София. В момента съм втори курс, специалност „Комуникация и дигитални медии“ в IE University." } },
        { "type": "paragraph", "text": { "en": "This is my house — every room tells you something about me. Click anything that glows, and use the arrows to move between rooms.", "bg": "Това е моята къща — всяка стая разказва нещо за мен. Кликни върху всичко, което свети, и използвай стрелките, за да минаваш от стая в стая." } }
      ]
    },
    {
      "id": "mailbox",
      "name": { "en": "Mailbox", "bg": "Пощенска кутия" },
      "x": 0.66, "y": 0.62,
      "title": { "en": "Get in touch", "bg": "Пиши ми" },
      "blocks": [
        { "type": "paragraph", "text": { "en": "Want to collaborate, chat about design, or just say hi? My mailbox is always open.", "bg": "Искаш да работим заедно, да си поговорим за дизайн или просто да кажеш здрасти? Пощенската ми кутия е винаги отворена." } },
        { "type": "links", "items": [
          { "kind": "email", "label": { "en": "Email me", "bg": "Пиши ми имейл" } },
          { "kind": "instagram", "label": { "en": "Instagram @erika.doumbova", "bg": "Instagram @erika.doumbova" } },
          { "kind": "tiktok", "label": { "en": "TikTok @eri_doumbova", "bg": "TikTok @eri_doumbova" } }
        ] }
      ]
    },
    {
      "id": "street-lamp",
      "name": { "en": "Street lamp", "bg": "Уличен фенер" },
      "x": 0.84, "y": 0.40,
      "special": "cycle-lighting",
      "bubble": { "en": "I'm a night person, honestly. Click me again.", "bg": "Честно казано, аз съм нощна птица. Кликни пак." },
      "title": { "en": "Street lamp", "bg": "Уличен фенер" },
      "blocks": []
    }
  ],
  "lights": [
    { "id": "window-left", "kind": "window", "x": 0.33, "y": 0.42, "radius": 0.05, "w": 1, "h": 1.3, "color": "#FFD58A", "phases": ["sunset", "night"] },
    { "id": "street-lamp", "kind": "lamp", "x": 0.84, "y": 0.30, "radius": 0.09, "color": "#FFD58A", "phases": ["sunset", "night"] },
    { "id": "porch", "kind": "lamp", "x": 0.52, "y": 0.44, "radius": 0.05, "color": "#FFE2A8", "phases": ["night"] }
  ]
}
```

### A.3 `content/rooms/living-room.json`
```json
{
  "id": "living-room",
  "name": { "en": "Living room", "bg": "Всекидневна" },
  "theme": { "en": "What I make & where I'm going", "bg": "Какво създавам и накъде вървя" },
  "image": "rooms/living-room.png",
  "imageAlt": { "en": "A warm living room with framed posters on the wall, a sofa, a coffee table with a sketchbook, a ring light, a TV showing a football match and a desk with a notebook", "bg": "Топла всекидневна с рамкирани плакати, диван, масичка със скицник, ринг лампа, телевизор с мач и бюро с тетрадка" },
  "initialFocusX": 0.5,
  "ambientSound": "audio/living-room",
  "doorways": [
    { "to": "front", "x": 0.08, "y": 0.62, "direction": "left" },
    { "to": "bedroom", "x": 0.30, "y": 0.30, "direction": "up" },
    { "to": "kitchen", "x": 0.92, "y": 0.55, "direction": "right" }
  ],
  "objects": [
    {
      "id": "poster-1",
      "name": { "en": "Poster: PLACEHOLDER title", "bg": "Плакат: PLACEHOLDER" },
      "x": 0.42, "y": 0.26, "zoom": { "scale": 2.2 },
      "title": { "en": "PLACEHOLDER poster title", "bg": "PLACEHOLDER" },
      "blocks": [
        { "type": "image", "src": "art/posters/poster-1.png", "alt": { "en": "PLACEHOLDER — describe the poster", "bg": "PLACEHOLDER" }, "caption": { "en": "PLACEHOLDER year · tools", "bg": "PLACEHOLDER" } },
        { "type": "paragraph", "text": { "en": "PLACEHOLDER — what this poster is about, who it was for, and what you're proud of in it.", "bg": "PLACEHOLDER" } }
      ]
    },
    {
      "id": "poster-2",
      "name": { "en": "Poster: PLACEHOLDER title", "bg": "Плакат: PLACEHOLDER" },
      "x": 0.52, "y": 0.24, "zoom": { "scale": 2.2 },
      "title": { "en": "PLACEHOLDER poster title", "bg": "PLACEHOLDER" },
      "blocks": [
        { "type": "image", "src": "art/posters/poster-2.png", "alt": { "en": "PLACEHOLDER", "bg": "PLACEHOLDER" } },
        { "type": "paragraph", "text": { "en": "PLACEHOLDER", "bg": "PLACEHOLDER" } }
      ]
    },
    {
      "id": "poster-3",
      "name": { "en": "Poster: PLACEHOLDER title", "bg": "Плакат: PLACEHOLDER" },
      "x": 0.62, "y": 0.26, "zoom": { "scale": 2.2 },
      "title": { "en": "PLACEHOLDER poster title", "bg": "PLACEHOLDER" },
      "blocks": [
        { "type": "image", "src": "art/posters/poster-3.png", "alt": { "en": "PLACEHOLDER", "bg": "PLACEHOLDER" } },
        { "type": "paragraph", "text": { "en": "PLACEHOLDER", "bg": "PLACEHOLDER" } }
      ]
    },
    {
      "id": "sketchbook",
      "name": { "en": "Sketchbook", "bg": "Скицник" },
      "x": 0.48, "y": 0.66,
      "title": { "en": "Where it started", "bg": "Откъдето започна всичко" },
      "blocks": [
        { "type": "paragraph", "text": { "en": "Before design software, there was this — drawings from my high-school years. PLACEHOLDER: a sentence on what drawing meant to you then.", "bg": "Преди дизайнерските програми беше това — рисунки от гимназията. PLACEHOLDER" } },
        { "type": "gallery", "items": [
          { "src": "art/drawings/drawing-1.jpg", "alt": { "en": "PLACEHOLDER", "bg": "PLACEHOLDER" }, "caption": { "en": "PLACEHOLDER", "bg": "PLACEHOLDER" } },
          { "src": "art/drawings/drawing-2.jpg", "alt": { "en": "PLACEHOLDER", "bg": "PLACEHOLDER" } },
          { "src": "art/drawings/drawing-3.jpg", "alt": { "en": "PLACEHOLDER", "bg": "PLACEHOLDER" } },
          { "src": "art/drawings/drawing-4.jpg", "alt": { "en": "PLACEHOLDER", "bg": "PLACEHOLDER" } }
        ] }
      ]
    },
    {
      "id": "ring-light",
      "name": { "en": "Ring light", "bg": "Ринг лампа" },
      "x": 0.20, "y": 0.50,
      "title": { "en": "Creating content", "bg": "Създаване на съдържание" },
      "blocks": [
        { "type": "paragraph", "text": { "en": "This corner is where a lot of my content gets made. PLACEHOLDER: what you create (topics, formats) and what you love about it.", "bg": "В този ъгъл се ражда голяма част от съдържанието ми. PLACEHOLDER" } },
        { "type": "links", "items": [
          { "kind": "instagram", "label": { "en": "See it on Instagram", "bg": "Виж в Instagram" } },
          { "kind": "tiktok", "label": { "en": "See it on TikTok", "bg": "Виж в TikTok" } }
        ] }
      ]
    },
    {
      "id": "tv-sports",
      "name": { "en": "TV & sports paper", "bg": "Телевизор и спортен вестник" },
      "x": 0.76, "y": 0.42,
      "title": { "en": "Future sports journalist", "bg": "Бъдеща спортна журналистка" },
      "blocks": [
        { "type": "paragraph", "text": { "en": "My big goal: becoming a sports journalist — while keeping my content-creation career growing alongside it. PLACEHOLDER: which sports/teams you follow and the story you'd love to cover one day.", "bg": "Голямата ми цел: да стана спортна журналистка — и паралелно да развивам кариерата си в създаването на съдържание. PLACEHOLDER" } }
      ]
    },
    {
      "id": "ie-notebook",
      "name": { "en": "Notebook", "bg": "Тетрадка" },
      "x": 0.86, "y": 0.70,
      "title": { "en": "Studying communication", "bg": "Уча комуникации" },
      "blocks": [
        { "type": "paragraph", "text": { "en": "I'm in my second year of the Bachelor in Communication and Digital Media (BCDM) at IE University. PLACEHOLDER: a favourite course or project.", "bg": "Втори курс съм в бакалавърската програма „Комуникация и дигитални медии“ (BCDM) в IE University. PLACEHOLDER" } }
      ]
    }
  ],
  "lights": [
    { "id": "floor-lamp", "kind": "lamp", "x": 0.12, "y": 0.34, "radius": 0.08, "color": "#FFD58A", "phases": ["sunset", "night"] },
    { "id": "tv", "kind": "screen", "x": 0.76, "y": 0.38, "radius": 0.07, "color": "#BFD9FF", "phases": ["night"] },
    { "id": "ring", "kind": "lamp", "x": 0.20, "y": 0.44, "radius": 0.05, "color": "#FFF4E0", "phases": ["night"] }
  ],
  "effects": [
    { "type": "flicker", "lightId": "tv", "phases": ["night"] }
  ]
}
```

### A.4 `content/rooms/bedroom.json`
```json
{
  "id": "bedroom",
  "name": { "en": "Bedroom", "bg": "Спалня" },
  "theme": { "en": "What I love", "bg": "Какво обичам" },
  "image": "rooms/bedroom.png",
  "imageAlt": { "en": "A cozy bedroom with a Shawn Mendes poster on the wall, headphones on the nightstand, a bookshelf and soft fairy lights", "bg": "Уютна спалня с плакат на Шон Мендес, слушалки на нощното шкафче, етажерка с книги и светлинки" },
  "initialFocusX": 0.5,
  "ambientSound": "audio/vinyl",
  "doorways": [
    { "to": "living-room", "x": 0.10, "y": 0.60, "direction": "left" }
  ],
  "objects": [
    {
      "id": "shawn-poster",
      "name": { "en": "Shawn Mendes poster", "bg": "Плакат на Шон Мендес" },
      "x": 0.45, "y": 0.26, "zoom": { "scale": 2.0 },
      "title": { "en": "My favourite artist", "bg": "Любимият ми изпълнител" },
      "blocks": [
        { "type": "image", "src": "photos/wall-poster.jpg", "alt": { "en": "My bedroom wall with the Shawn Mendes poster", "bg": "Стената в стаята ми с плаката на Шон Мендес" } },
        { "type": "paragraph", "text": { "en": "Shawn Mendes has been my favourite artist for years — and yes, this poster really is on my wall. PLACEHOLDER: why his music matters to you / a favourite song.", "bg": "Шон Мендес е любимият ми изпълнител от години — и да, този плакат наистина виси на стената ми. PLACEHOLDER" } },
        { "type": "spotify", "title": { "en": "My favourites", "bg": "Любимите ми песни" } }
      ]
    },
    {
      "id": "headphones",
      "name": { "en": "Headphones", "bg": "Слушалки" },
      "x": 0.68, "y": 0.56,
      "title": { "en": "Always listening", "bg": "Винаги с музика" },
      "blocks": [
        { "type": "paragraph", "text": { "en": "Music is on pretty much all day — while I design, edit, study, or walk around the city. PLACEHOLDER: genres / other artists you love.", "bg": "Музиката ми върви почти цял ден — докато правя дизайн, монтирам, уча или се разхождам. PLACEHOLDER" } },
        { "type": "sound-toggle" }
      ]
    },
    {
      "id": "bookshelf",
      "name": { "en": "Bookshelf", "bg": "Етажерка с книги" },
      "x": 0.84, "y": 0.38,
      "title": { "en": "On my shelf", "bg": "На рафта ми" },
      "blocks": [
        { "type": "paragraph", "text": { "en": "When I'm not on a screen, I'm reading. A few I love:", "bg": "Когато не съм пред екран, чета. Ето няколко любими:" } },
        { "type": "list", "items": [
          { "title": "PLACEHOLDER Book title", "subtitle": { "en": "Author", "bg": "Автор" }, "note": { "en": "Why I love it.", "bg": "Защо я обичам." } },
          { "title": "PLACEHOLDER Book title", "subtitle": { "en": "Author", "bg": "Автор" }, "note": { "en": "Why I love it.", "bg": "Защо я обичам." } },
          { "title": "PLACEHOLDER Book title", "subtitle": { "en": "Author", "bg": "Автор" }, "note": { "en": "Why I love it.", "bg": "Защо я обичам." } }
        ] }
      ]
    }
  ],
  "lights": [
    { "id": "bedside", "kind": "lamp", "x": 0.62, "y": 0.46, "radius": 0.08, "color": "#FFD58A", "phases": ["sunset", "night"] }
  ],
  "effects": [
    { "type": "twinkle", "points": [ {"x":0.30,"y":0.18}, {"x":0.40,"y":0.16}, {"x":0.50,"y":0.15}, {"x":0.60,"y":0.16}, {"x":0.70,"y":0.18} ], "color": "#FFE2A8", "phases": ["sunset", "night"] }
  ]
}
```

### A.5 `content/rooms/kitchen.json`
```json
{
  "id": "kitchen",
  "name": { "en": "Kitchen", "bg": "Кухня" },
  "theme": { "en": "Where I'm from", "bg": "Откъде съм" },
  "image": "rooms/kitchen.png",
  "imageAlt": { "en": "A warm kitchen with a steaming pot of stuffed peppers on the stove and a fridge with a magnet of the Alexander Nevsky Cathedral", "bg": "Топла кухня с тенджера пълнени чушки на котлона и хладилник с магнит на храм-паметника „Св. Александър Невски“" },
  "initialFocusX": 0.5,
  "ambientSound": "audio/kitchen-simmer",
  "doorways": [
    { "to": "living-room", "x": 0.08, "y": 0.60, "direction": "left" }
  ],
  "objects": [
    {
      "id": "stuffed-peppers",
      "name": { "en": "Pot of stuffed peppers", "bg": "Тенджера с пълнени чушки" },
      "x": 0.43, "y": 0.47, "zoom": { "scale": 2.0 },
      "title": { "en": "Пълнени чушки — stuffed peppers", "bg": "Пълнени чушки" },
      "blocks": [
        { "type": "image", "src": "objects/stuffed-peppers.png", "alt": { "en": "Stuffed peppers baked golden with a yogurt topping", "bg": "Пълнени чушки, запечени до златисто със заливка от кисело мляко" } },
        { "type": "paragraph", "text": { "en": "My favourite Bulgarian dish — peppers stuffed with rice and minced meat, baked with a golden yogurt topping. It tastes like home. PLACEHOLDER: who makes them in your family / when you eat them.", "bg": "Любимото ми българско ястие — чушки с ориз и кайма, запечени със златиста заливка от кисело мляко. Вкусът на дома. PLACEHOLDER" } },
        {
          "type": "recipe",
          "servings": 4,
          "time": { "en": "About 1 h 30 min", "bg": "Около 1 ч 30 мин" },
          "ingredients": [
            { "en": "8–10 bell peppers", "bg": "8–10 чушки (камби)" },
            { "en": "500 g minced meat (pork and beef mix)", "bg": "500 г смесена кайма" },
            { "en": "150 g (¾ cup) rice", "bg": "150 г ориз" },
            { "en": "1 onion, finely chopped", "bg": "1 глава лук, ситно нарязан" },
            { "en": "1 carrot, grated (optional)", "bg": "1 морков, настърган (по желание)" },
            { "en": "1 grated tomato or 2 tbsp tomato paste", "bg": "1 настърган домат или 2 с. л. доматено пюре" },
            { "en": "1 tsp sweet paprika", "bg": "1 ч. л. червен пипер" },
            { "en": "1 tsp dried savory (чубрица)", "bg": "1 ч. л. чубрица" },
            { "en": "Salt, black pepper, a little fresh parsley", "bg": "Сол, черен пипер, малко пресен магданоз" },
            { "en": "3 tbsp sunflower oil", "bg": "3 с. л. олио" },
            { "en": "For the topping: 400 g Bulgarian yogurt, 1 egg, 1 tbsp flour", "bg": "За заливката: 400 г кисело мляко, 1 яйце, 1 с. л. брашно" }
          ],
          "steps": [
            { "en": "Cut the tops off the peppers and remove the seeds. Keep the tops.", "bg": "Отрежи дръжките на чушките и почисти семките. Запази капачетата." },
            { "en": "Warm the oil in a pan and soften the onion (and carrot) for about 5 minutes.", "bg": "Загрей олиото в тиган и задуши лука (и моркова) около 5 минути." },
            { "en": "Add the minced meat and cook, breaking it up, until it changes colour.", "bg": "Добави каймата и я запържи, като я разбиваш, докато промени цвета си." },
            { "en": "Stir in the paprika, then the rice, tomato, savory, salt and pepper. Add a splash of water and cook for 3–4 minutes. Take off the heat and add the parsley.", "bg": "Добави червения пипер, после ориза, домата, чубрицата, солта и черния пипер. Налей малко вода и остави 3–4 минути. Свали от котлона и добави магданоза." },
            { "en": "Fill the peppers loosely (the rice will grow) and close them with their tops.", "bg": "Напълни чушките, без да ги натъпкваш (оризът набъбва), и ги затвори с капачетата." },
            { "en": "Stand them upright in a baking dish, pour in warm water up to about half their height, and bake at 180 °C for about 60 minutes.", "bg": "Нареди ги изправени в тава, налей топла вода до около половината им височина и печи на 180 °C около 60 минути." },
            { "en": "Whisk the yogurt, egg and flour. Pour over the peppers and bake for another 15 minutes until golden.", "bg": "Разбий киселото мляко с яйцето и брашното. Залей чушките и печи още 15 минути, докато се зачервят." }
          ],
          "tip": { "en": "Even better the next day. Serve with an extra spoon of yogurt.", "bg": "На следващия ден са още по-вкусни. Сервирай с още една лъжица кисело мляко." }
        }
      ]
    },
    {
      "id": "nevsky-magnet",
      "name": { "en": "Fridge magnet", "bg": "Магнит на хладилника" },
      "x": 0.74, "y": 0.36, "zoom": { "scale": 2.4 },
      "title": { "en": "Sofia, my city", "bg": "София, моят град" },
      "blocks": [
        { "type": "image", "src": "photos/nevsky.jpg", "alt": { "en": "The Alexander Nevsky Cathedral in Sofia with its golden domes", "bg": "Храм-паметникът „Св. Александър Невски“ в София със златните си куполи" } },
        { "type": "paragraph", "text": { "en": "I was born and raised in Sofia, Bulgaria. My favourite place in the city is the Alexander Nevsky Cathedral — PLACEHOLDER: why it's special to you / a memory there.", "bg": "Родена и израснала съм в София. Любимото ми място в града е храм-паметникът „Св. Александър Невски“ — PLACEHOLDER" } }
      ]
    },
    {
      "id": "kitchen-window",
      "enabled": false,
      "name": { "en": "Window", "bg": "Прозорец" },
      "x": 0.58, "y": 0.22,
      "title": { "en": "PLACEHOLDER", "bg": "PLACEHOLDER" },
      "blocks": [ { "type": "paragraph", "text": { "en": "PLACEHOLDER", "bg": "PLACEHOLDER" } } ]
    }
  ],
  "lights": [
    { "id": "pendant", "kind": "lamp", "x": 0.50, "y": 0.18, "radius": 0.10, "color": "#FFD58A", "phases": ["sunset", "night"] },
    { "id": "hob", "kind": "lamp", "x": 0.43, "y": 0.52, "radius": 0.035, "color": "#FF9A5A", "phases": ["morning", "day", "sunset", "night"] }
  ],
  "effects": [
    { "type": "steam", "x": 0.43, "y": 0.43 }
  ]
}
```

---

## Appendix B: Gemini prompt library

> For the owner. Use these in Google Gemini with image upload. Paste the prompt, attach the image(s) in the order described, and iterate with short follow-ups such as "warmer light", "less clutter", "keep the posters on the left wall", or "remove the text on the box".

### B.1 Master style: first room (the living room)
*Attach: your living-room photo.*
```
Transform this photo into a cozy isometric 3D diorama of the same room.
Show it as a cutaway miniature: the floor and two walls only, seen from a high three-quarter angle (about 35 degrees), like a dollhouse.
Keep the room's layout, furniture and key objects in the same positions as in the photo: the framed posters on the wall, the sofa, the coffee table with a sketchbook on it, the ring light on a tripod, the TV showing a football match, and the desk with a notebook.
Style: soft clay-like 3D render, slightly rounded edges, subtle matte textures, tidy and a little stylized, warm pastel palette of cream, terracotta, mustard yellow, sage green and warm wood.
Lighting: soft, warm late-morning daylight from the window, gentle soft shadows, no harsh contrast.
Background: a plain flat warm cream colour around the diorama, with empty space on all sides.
Composition: 16:9 landscape, the room centred and filling about 75% of the width.
No people, no text, no letters, no logos, no watermark.
```
Useful follow-ups: "Make the posters simple colour blocks in frames, with no readable text." · "Make it look more like a miniature model." · "Keep the exact same camera angle and style, but make it brighter."

### B.2 Matching rooms (bedroom, kitchen)
*Attach: (1) your room photo, (2) your approved living-room render.*
```
Transform the FIRST image into a cozy isometric 3D diorama that matches the SECOND image exactly in style: same camera angle, same cutaway (floor and two walls), same soft clay-like materials, same warm pastel palette, same soft late-morning lighting, same plain warm cream background with empty space around the room, 16:9 landscape.
Keep the layout and key objects from the first image in the same positions.
Key objects that must be clearly visible: [BEDROOM: a poster of a musician on the wall shown small and simple, headphones on the nightstand, a bookshelf with books, small fairy lights along the wall] / [KITCHEN: a pot on the stove, a fridge with a small magnet, warm wooden counters].
No people, no text, no letters, no logos, no watermark.
```

### B.3 Front exterior (no photo needed)
*Attach: your approved living-room render (as the style reference).*
```
Create a cozy isometric 3D diorama of the outside of a small two-storey house, matching the style of the attached image exactly: same camera angle, soft clay-like materials, warm pastel palette, soft late-morning light, plain warm cream background with empty space around it, 16:9 landscape.
The house is inspired by old-town Sofia, Bulgaria: a pastel facade, a terracotta tiled roof, wrought-iron balcony details, wooden window shutters.
In front: a short path to a wooden front door with a small porch light, a mailbox on a post to the right of the door, a classic street lamp at the right edge, a few potted plants.
No people, no text, no letters, no house numbers, no logos, no watermark.
```

### B.4 Object close-ups
*Attach: (1) your object photo, (2) your approved living-room render.*
```
Turn the object in the FIRST image into a single soft 3D clay-style object that matches the style, materials, palette and lighting of the SECOND image.
Show only this object, centred, at a three-quarter angle, on a plain warm cream background with a soft shadow beneath it.
Square or 4:3 composition. No text, no logos, no watermark.
```
For example, use it for `objects/stuffed-peppers.png`. **Don't** use it for posters, drawings, or personal photos. Those are shown as the originals.

### B.5 Consistency checklist (before uploading)
- [ ] The camera angle matches the living room.
- [ ] The background is plain and flat with empty margins (the site extends this colour to fill the screen).
- [ ] There's no garbled text anywhere in the image.
- [ ] Key objects are clearly visible and not hidden behind furniture.
- [ ] The image is landscape 16:9 and ≥ 1600px wide (upscale with Upscayl if needed).
- [ ] Saved with the exact file name from §14.4.
