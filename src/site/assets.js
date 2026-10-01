// static assets: the hand-written web/ source and the self-hosted fonts
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, SITE, WEB } from './config.js';

/** everything in web/ except the index.html template, which is rendered per page */
export function copyWeb() {
  fs.mkdirSync(SITE, { recursive: true });
  fs.cpSync(WEB, SITE, { recursive: true, force: true, filter: (src) => src !== path.join(WEB, 'index.html') });
}

export function copyFonts() {
  const fontDir = path.join(SITE, 'fonts');
  fs.mkdirSync(fontDir, { recursive: true });
  for (const [pkg, weights] of [['ibm-plex-sans', [400, 500, 600, 700]], ['ibm-plex-mono', [500, 600]]]) {
    for (const w of weights) {
      for (const subset of ['latin', 'vietnamese']) {
        const f = `${pkg}-${subset}-${w}-normal.woff2`;
        const from = path.join(ROOT, 'node_modules', '@fontsource', pkg, 'files', f);
        if (fs.existsSync(from)) fs.copyFileSync(from, path.join(fontDir, f));
      }
    }
  }
}
