// paths, env and small helpers shared by every build step
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../server.js';

export { ROOT };
export const SITE = process.env.SITE_DIR ? path.resolve(process.env.SITE_DIR) : path.join(ROOT, 'site'); // SITE_DIR: tests build elsewhere
if (ROOT.startsWith(SITE)) throw new Error(`refusing to use ${SITE} as the site directory`); // it is wiped on every build
export const WEB = path.join(ROOT, 'web'); // hand-written site source (js/, style.css, brand/, index.html template); site/ is build output

// public origin of the deployed site (absolute og: URLs need it); set SITE_URL in .env (git-ignored, see .env.example)
try { process.loadEnvFile(path.join(ROOT, '.env')); } catch { /* no .env: fine */ }
export const BASE = (process.env.SITE_URL ?? '').replace(/\/$/, '');
if (!BASE) console.warn('SITE_URL is not set: link previews will not work (crawlers need absolute URLs). Copy .env.example to .env.');

export const LANG_NAMES = { en: 'English', vi: 'Tiếng Việt' };

export const readJson = (f, fallback) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : fallback);
export const titleCase = (s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
export const clip = (s, n) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…`);
export const abs = (p) => (BASE ? `${BASE}${p.startsWith('/') ? p : `/${p}`}` : '');
