// Builds the site into the temp test dir (run by `npm test` before the tests).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from '../src/server.js';
import { SITE_DIR, ORIGIN } from './helpers.js';

const rendered = (dir) => fs.existsSync(dir) && fs.readdirSync(dir, { withFileTypes: true }).some((e) => (e.isDirectory() ? rendered(path.join(dir, e.name)) : e.name.endsWith('.mp4')));
if (!rendered(path.join(ROOT, 'out'))) {
  console.log('No rendered videos in out/: skipping the site tests (run `npm run make -- --all` first).');
  process.exit(0);
}
const r = spawnSync(process.execPath, ['src/site.js'], { cwd: ROOT, stdio: 'inherit', env: { ...process.env, SITE_DIR, SITE_URL: ORIGIN } });
process.exit(r.status ?? 1);
