# Erika's House

A cozy, explorable dollhouse version of Erika Doumbova's home: a personal website where visitors
wander from room to room and click on her belongings to discover who she is.

- **Live site:** <https://erikadoumbova.github.io/escape-room-portfolio/>
- **How to edit text and images without code:** `docs/OWNER-GUIDE.md` (coming in milestone M4)
- **Full specification:** [`docs/HANDOFF.md`](docs/HANDOFF.md)

Every push to `main` is built, tested, and deployed to GitHub Pages by
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Check the repo's **Actions** tab:
a green ✓ means the site is live.

**Branches:** `main` is the live site. Development happens on `dev`, where every push runs the same
checks and tests without deploying; publishing means merging `dev` into `main`. Edits made directly
on `main` in the GitHub web editor (text, images) still go live straight away, so merge `main` back
into `dev` before starting new work.

## For developers

Requires Node.js (version in `.nvmrc`).

```bash
npm install
npm run dev          # local dev server
npm run typecheck && npm run lint && npm test
npm run validate-content  # check content/*.json (friendly errors + "still to fill in" warnings)
npm run placeholders # redraw placeholder art in assets-src/_placeholders/ from the room JSON
npm run build        # validate + process images + vite build + per-route pages (spa-routes.mjs)
npm run preview      # serve dist/ the way GitHub Pages does
npm run test:e2e     # Playwright + axe against dist/ (PW_CHANNEL=chrome to use installed Chrome)
```

To build for a project page locally, set the base path: `BASE_PATH=/escape-room-portfolio/ npm run build`.
