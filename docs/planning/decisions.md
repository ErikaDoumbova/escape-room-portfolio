# Planning log — immersive personal website

Living record of decisions made during planning. Any decision can be revisited; the final developer handoff will be generated from this file.

## Reference analysis — Drake Related (drakerelated.com/rooms/front), Nov 2026

- 8 rooms (Front, Studio, Bedroom, Closet, El Chico Studios, Air Drake, Pool, Kitchen), each at its own URL `/rooms/<slug>`.
- Each room = **one pre-rendered isometric image** (~1672×941) wider than the viewport; pans horizontally. No WebGL/canvas.
- Navigation: circular arrow pins placed at doorways ("Enter Kitchen") + persistent "Explore" menu listing all rooms + minimal fixed top bar.
- Loading: white full-screen loader with wordmark → blurred low-res placeholder → full image fades in.
- Mobile: enlarged invisible tap targets on hotspots; image pans.
- Seasonal reskin currently live ("frozen" versions of every room).
- Weaknesses to avoid: commerce-first objects, hotspots not self-explanatory, little personality/sound/delight.

## Decisions

| # | Topic | Decision | Round |
|---|-------|----------|-------|
| 1 | Purpose | Personal brand / story (who I am > CV) | 1 |
| 2 | Structure | Explorable house — free roaming, all rooms open (no gating) | 1 |
| 3 | Primary audience | Curious peers, 5+ minutes, happy to explore | 1 |
| 4 | Atmosphere | Cozy & warm | 1 |
| 5 | Art style | Soft 3D isometric render look | 2 |
| 6 | Room themes | What I make · What I love · Where I'm from · Who I'm becoming | 2 |
| 7 | Discovery layer | Guestbook (visitor notes appear in the house) | 2 |
| 8 | Living world | Day/night based on visitor's local time | 2 |
| 9 | Art production | Owner's own images (room photos, object photos, own drawings/art) restyled by AI into soft 3D | 3–4 |
| 10 | Code | AI coding agent builds, owner reviews (low coding experience) | 3 |
| 11 | Budget | €0 — free tiers and CC0 assets only | 3 |
| 12 | v1 scope / timeline | 2–5 rooms, ship ~today; placeholder art swappable file-by-file | 3 |
| 13 | Object click | Zoom to close-up (camera zooms into region of room image; object's own restyled photo/art + story shown beside) | 4 |
| 14 | Day/night implementation | One image per room + code-driven lighting overlay (morning / sunset / night grading + glowing lamp/window layers) | 4 |
| 15 | Sound | Ambient room tone + subtle UI sounds, off by default, speaker toggle, CC0 | 4 |

| 16 | Object map | Confirmed (see "Object map" below); titles/books may be placeholders | 6 |
| 17 | Device priority | Desktop-first (mobile must still work well: swipe-pan, tap, sheet close-ups) | 6 |
| 18 | Language | English default + Bulgarian toggle (EN/BG) | 6 |
| 19 | AI restyle tool | Google Gemini (free tier) — handoff includes prompts | 6 |
| 20 | Framework | Vite + React + TypeScript (React Router, Framer Motion, Howler.js; content in typed EN/BG JSON) | 7 |
| 21 | Hosting | GitHub Pages, built and deployed by a GitHub Actions workflow on every push to `main` | 7 |
| 22 | Guestbook | **Dropped for v1** (supersedes #7). Kitchen fridge keeps the Sofia magnet; guestbook can return later behind a feature flag | 7 |
| 23 | Owner workflow | Owner never needs npm/terminal: edits content JSON and uploads images via GitHub's web UI → Actions rebuilds and deploys. Only the AI agent runs npm during development | 7 |
| 24 | URLs on GitHub Pages | Clean room URLs (`/kitchen`) via build step that writes `<room>/index.html` copies + `404.html` fallback; Vite `base` set from repo name | 7 |

## Object map (confirmed Round 6)

- **Front:** name sign (welcome) · mailbox (contact: email, IG, TikTok) · street lamp (ambient, day/night)
- **Living room:** framed graphic design posters (one hotspot each) · sketchbook (high-school drawings) · ring light + tripod (content creation, IG/TikTok) · TV with match + sports newspaper (sports journalism goal) · IE notebook/laptop (BCDM, 2nd year)
- **Bedroom:** Shawn Mendes poster (Spotify embed; close-up uses owner's own wall photo / styled frame, not official poster art) · headphones/speaker (music + sound toggle) · bookshelf (favourite books)
- **Kitchen:** pot of пълнени чушки (recipe card) · fridge magnet of Alexander Nevsky Cathedral (Sofia story) · ~~fridge notes = guestbook~~ (deferred, see #22)

## Owner content (Round 5)

- **Name:** Erika Doumbova
- **Intro:** "I'm Erika, a graphic designer and content creator."
- **Studies:** 2nd-year BCDM student at IE University
- **Goal:** become a sports journalist and keep growing a content-creation career
- **Makes:** high-school drawings (a few) + graphic design posters (a few) — owner will upload
- **Loves:** music (favourite artist: Shawn Mendes; real poster on bedroom wall), reading books, creating social media content
- **Roots:** born and raised in Sofia, Bulgaria; favourite dish пълнени чушки (stuffed peppers) → clicking shows a recipe; favourite place: Alexander Nevsky Cathedral
- **v1 rooms:** Front, Living room, Bedroom, Kitchen (guestbook lives in the kitchen)
- **Contact:** erika.doumbova@gmail.com · Instagram @erika.doumbova · TikTok @eri_doumbova
- **Guestbook moderation:** none — notes publish instantly (needs automatic safeguards: length limit, rate limit, profanity filter, honeypot; owner can delete)

> **Status (2026-11-17):** planning complete. The full developer handoff is in [`docs/HANDOFF.md`](../HANDOFF.md). The guestbook-moderation note above is superseded by decision #22 (no guestbook in v1).

## Defaults adopted in the handoff

- House layout: Front entrance (landing) → Studio (make) · Living room (love) · Kitchen (roots; guestbook on the fridge) · Balcony/rooftop (becoming).
- Navigation: doorway arrow pins + "Explore" room menu + accessible text-only "Quick tour" view.
- Mobile: drag/swipe to pan rooms, larger hotspot targets, close-up story as bottom sheet.

## Open questions

- Book titles; poster/drawing titles and captions; favourite songs for Spotify embed (placeholders OK).
- GitHub username / repo name (decides the site URL; placeholder OK).
