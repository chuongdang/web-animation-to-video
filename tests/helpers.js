// Shared by the tests: the site is built once (tests/build.js) into a temp dir, never into the real site/.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const SITE_DIR = path.join(os.tmpdir(), 'video-creator-test-site');
export const ORIGIN = 'https://example.test'; // SITE_URL used for the test build, so absolute URLs are predictable
export const SKIP = !fs.existsSync(path.join(SITE_DIR, 'index.html')) && 'no test site: run `npm test` (needs rendered videos in out/)';

export const read = (rel) => fs.readFileSync(path.join(SITE_DIR, rel), 'utf8');
/** window.SITE from data.js */
export const siteData = () => new Function('window', `${read('data.js')}\nreturn window.SITE;`)({});

const ASSET_DIRS = new Set(['videos', 'posters', 'fonts', 'brand']);
/** every generated page as { file, path } where path is its URL path ("/", "/physics/", ...) */
export function pages() {
  const out = [];
  const walk = (dir, rel) => {
    for (const e of fs.readdirSync(path.join(SITE_DIR, dir), { withFileTypes: true })) {
      if (e.isDirectory() && !(dir === '' && ASSET_DIRS.has(e.name))) walk(path.join(dir, e.name), `${rel}${e.name}/`);
      else if (e.name === 'index.html') out.push({ file: path.join(dir, e.name), path: rel });
    }
  };
  walk('', '/');
  return out;
}
