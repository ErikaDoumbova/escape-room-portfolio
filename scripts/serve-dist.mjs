// Tiny static server for dist/ that behaves like GitHub Pages, used by
// `npm run preview` and the Playwright tests:
//  - the site lives under BASE_PATH (e.g. /escape-room-portfolio/)
//  - /kitchen redirects to /kitchen/ and serves kitchen/index.html
//  - anything unknown gets dist/404.html with a 404 status
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const base = process.env.BASE_PATH ?? '/';
const portArg = process.argv.indexOf('--port');
const port = Number(portArg > -1 ? process.argv[portArg + 1] : 4173);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

/** @param {import('node:http').ServerResponse} res @param {string} file @param {number} status */
function send(res, file, status = 200) {
  res.writeHead(status, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);
  const notFound = () => send(res, join(dist, '404.html'), 404);

  if (!pathname.startsWith(base) && pathname + '/' !== base) return notFound();
  const rel = pathname.slice(base.length - 1);
  const file = normalize(join(dist, rel));
  if (file !== dist && !file.startsWith(dist + sep)) return notFound();

  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!pathname.endsWith('/')) {
      res.writeHead(301, { location: `${pathname}/${url.search}` });
      return res.end();
    }
    const index = join(file, 'index.html');
    return existsSync(index) ? send(res, index) : notFound();
  }
  if (existsSync(file)) return send(res, file);
  return notFound();
}).listen(port, () => {
  console.log(`Serving dist/ at http://localhost:${port}${base}`);
});
