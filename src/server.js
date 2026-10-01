import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

/**
 * Scenes live in scenes/<field>/<sub>/<name>/index.html
 * (field = subject, e.g. physics; sub = sub-category / series folder, e.g. electricity-basics).
 */
export function listScenes() {
  const root = path.join(ROOT, 'scenes');
  const dirs = (d) => fs.readdirSync(d, { withFileTypes: true }).filter((e) => e.isDirectory() && !e.name.startsWith('_'));
  const scenes = [];
  for (const field of dirs(root)) {
    for (const sub of dirs(path.join(root, field.name))) {
      for (const s of dirs(path.join(root, field.name, sub.name))) {
        const dir = path.join(root, field.name, sub.name, s.name);
        if (fs.existsSync(path.join(dir, 'index.html'))) scenes.push({ field: field.name, sub: sub.name, name: s.name, id: `${field.name}/${sub.name}/${s.name}`, dir });
      }
    }
  }
  return scenes;
}

/** Accepts the full id (physics/electricity-basics/electricity) or any unique tail of it: "electricity-basics/electricity", "electricity". */
export function resolveScene(ref) {
  const all = listScenes();
  const hits = all.filter((s) => s.id === ref || s.id.endsWith(`/${ref}`));
  if (hits.length === 1) return hits[0];
  const list = all.map((s) => `  ${s.id}`).join('\n');
  throw new Error(hits.length ? `"${ref}" is ambiguous, use the full id:\n${hits.map((s) => `  ${s.id}`).join('\n')}` : `Scene "${ref}" not found. Available:\n${list}`);
}

function indexPage() {
  const byField = {};
  for (const s of listScenes()) (byField[s.field] ??= []).push(s);
  const body = Object.entries(byField)
    .map(([f, ss]) => {
      const subs = [...new Set(ss.map((s) => s.sub))];
      return `<h2>${f}</h2>${subs.map((sub) => `<h3>${sub}</h3><ul>${ss.filter((s) => s.sub === sub).map((s) => `<li><a href="/scenes/${s.id}/index.html">${s.name}</a></li>`).join('')}</ul>`).join('')}`;
    })
    .join('');
  return `<!doctype html><meta charset="utf-8"><title>Scenes</title>
<body style="font:18px system-ui;background:#0b1020;color:#e8ecf5;padding:40px">
<h1>Scenes</h1>${body}`;
}

/** Static file server rooted at the project directory. Resolves with { url, close }. */
export function startServer(port = 0, root = ROOT) {
  const server = http.createServer((req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    if (pathname === '/' && root === ROOT) {
      res.writeHead(200, { 'content-type': MIME['.html'] });
      return res.end(indexPage());
    }
    const file = path.join(root, decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(403);
      return res.end('forbidden');
    }
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) {
        res.writeHead(404);
        return res.end('not found');
      }
      const headers = {
        'content-type': MIME[path.extname(file)] ?? 'application/octet-stream',
        'cache-control': 'no-store',
        'accept-ranges': 'bytes',
      };
      // Range support so browsers can seek inside videos
      const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? '');
      if (m) {
        const start = m[1] ? Number(m[1]) : Math.max(0, st.size - Number(m[2]));
        const end = m[1] && m[2] ? Math.min(Number(m[2]), st.size - 1) : st.size - 1;
        if (start > end || start >= st.size) {
          res.writeHead(416, { 'content-range': `bytes */${st.size}` });
          return res.end();
        }
        res.writeHead(206, { ...headers, 'content-range': `bytes ${start}-${end}/${st.size}`, 'content-length': end - start + 1 });
        return fs.createReadStream(file, { start, end }).pipe(res);
      }
      res.writeHead(200, { ...headers, 'content-length': st.size });
      fs.createReadStream(file).pipe(res);
    });
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const { port: p } = server.address();
      resolve({ url: `http://127.0.0.1:${p}`, close: () => new Promise((r) => server.close(r)) });
    });
  });
}
