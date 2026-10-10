/* Local preview that behaves like Vercel: serves the static site and runs
 * api/enquiry.js at /api/enquiry.
 *
 *   node tools/dev-server.mjs            dry run: the email is built and shown in the
 *                                         terminal, nothing is sent
 *   node --env-file=.env.local tools/dev-server.mjs
 *                                         sends real mail with the Gmail credentials in
 *                                         .env.local (git-ignored; see .env.example)
 *
 * Then open http://localhost:3000/
 */
import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.env.PORT) || 3000;
if (!process.env.GMAIL_APP_PASSWORD && !process.env.MAIL_DRY_RUN) process.env.MAIL_DRY_RUN = '1';

const { default: enquiry } = await import(pathToFileURL(join(ROOT, 'api', 'enquiry.js')).href);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json',
};
const PRIVATE = ['tools', 'api', 'node_modules', '.git', '.claude', '.env'];

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/enquiry') {
    const end = res.end.bind(res);
    res.end = (body) => {
      if (process.env.MAIL_DRY_RUN === '1' && body) {
        try { const j = JSON.parse(body); if (j.message) console.log('\n[dry run] email that would be sent:\n' + j.message.text + '\n'); } catch { /* not JSON */ }
      }
      return end(body);
    };
    return enquiry(req, res);
  }
  let path = normalize(decodeURIComponent(url.pathname));
  const top = path.split(/[\\/]/).filter(Boolean)[0] || '';
  let file = join(ROOT, path);
  if (!file.startsWith(ROOT + sep) && file !== ROOT || PRIVATE.some((p) => top === p || top.startsWith('.env'))) {
    res.writeHead(404).end('Not found');
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!url.pathname.endsWith('/')) { res.writeHead(308, { Location: url.pathname + '/' + url.search }).end(); return; }
    file = join(file, 'index.html');
  }
  if (!existsSync(file)) { res.writeHead(404).end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`Site: http://localhost:${PORT}/  (${process.env.MAIL_DRY_RUN === '1' ? 'dry run — no email is sent' : 'LIVE — real emails are sent'})`);
});
