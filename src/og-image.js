// Regenerate the site-wide link-preview card:  npm run og   ->  web/brand/og.png (1200x630)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { ROOT } from './server.js';

const WEB = path.join(ROOT, 'web');
const FONTS = path.join(ROOT, 'node_modules', '@fontsource', 'ibm-plex-sans', 'files');
const file = (...p) => pathToFileURL(path.join(...p)).href;

const html = `<style>
@font-face{font-family:P;font-weight:700;src:url(${file(FONTS, 'ibm-plex-sans-latin-700-normal.woff2')})}
@font-face{font-family:P;font-weight:400;src:url(${file(FONTS, 'ibm-plex-sans-latin-400-normal.woff2')})}
body{margin:0;width:1200px;height:630px;background:radial-gradient(circle at 80% 20%,#1b2a5c,#0b1020 60%);font-family:P;color:#e8ecf5;display:flex;align-items:center;padding:0 90px;box-sizing:border-box;gap:60px}
img{width:300px;height:300px;border-radius:60px}
h1{font-size:84px;margin:0 0 20px;line-height:1.05}
p{font-size:34px;margin:0;color:#8b96b4;line-height:1.35}
b{color:#4dd8ff}
</style>
<img src="${file(WEB, 'brand', 'logo-1024.png')}">
<div><h1>Knowledge <b>Videos</b></h1><p>Short animated explainers on physics, biology and computer science.</p></div>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
// file:// subresources only load from a file:// page, not setContent()
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'og-')), 'card.html');
fs.writeFileSync(tmp, html);
await page.goto(pathToFileURL(tmp).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(WEB, 'brand', 'og.png') });
await browser.close();
fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
console.log('wrote web/brand/og.png');
