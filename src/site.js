// Build the video library website in site/:  npm run site   (then: npm run site:serve)
//   - copies rendered videos from out/ into site/videos/<field>/<sub>/<name>[.<lang>].mp4 (one per language)
//   - extracts a poster frame for each video
//   - copies web/ (app.js, style.css, brand/, ...) and renders web/index.html into site/
//   - writes site/data.js from scenes/**/meta.json and scenes/<field>/field.json
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import { ROOT, listScenes } from './server.js';

const SITE = path.join(ROOT, 'site');
const WEB = path.join(ROOT, 'web'); // hand-written site source (app.js, style.css, brand/, index.html template); site/ is build output
const readJson = (f, fallback) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : fallback);
const titleCase = (s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function duration(file) {
  const r = spawnSync(ffmpegPath, ['-i', file], { encoding: 'utf8' });
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(r.stderr);
  return m ? Math.round(Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])) : 0;
}

// public origin of the deployed site (absolute og: URLs need it); set SITE_URL in .env (git-ignored, see .env.example)
try { process.loadEnvFile(path.join(ROOT, '.env')); } catch { /* no .env: fine */ }
const BASE = (process.env.SITE_URL ?? '').replace(/\/$/, '');
if (!BASE) console.warn('SITE_URL is not set: link previews will not work (crawlers need absolute URLs). Copy .env.example to .env.');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const LANG_NAMES = { en: 'English', vi: 'Tiếng Việt' };

/** language codes rendered for a scene: out/<field>/<sub>/<name>.mp4 is English, <name>.<lang>.mp4 the others */
function renderedLangs(scene) {
  const dir = path.join(ROOT, 'out', scene.field, scene.sub);
  if (!fs.existsSync(dir)) return [];
  const langs = [];
  if (fs.existsSync(path.join(dir, `${scene.name}.mp4`))) langs.push('en');
  for (const f of fs.readdirSync(dir)) {
    const m = f.startsWith(`${scene.name}.`) && f.match(/\.([a-z]{2,3})\.mp4$/);
    if (m && f === `${scene.name}.${m[1]}.mp4`) langs.push(m[1]);
  }
  return langs;
}

const fields = {};
const videos = [];
const missing = [];
for (const scene of listScenes()) {
  const langs = renderedLangs(scene);
  if (!langs.length) { missing.push(scene.id); continue; }
  const fieldMeta = readJson(path.join(ROOT, 'scenes', scene.field, 'field.json'), {});
  fields[scene.field] ??= {
    id: scene.field, color: fieldMeta.color ?? '#4dd8ff', order: fieldMeta.order ?? 99,
    text: { en: { title: fieldMeta.title ?? titleCase(scene.field), blurb: fieldMeta.blurb ?? '' } },
  };
  for (const l of Object.keys(fieldMeta).filter((k) => LANG_NAMES[k] && k !== 'en')) fields[scene.field].text[l] = { ...fields[scene.field].text.en, ...fieldMeta[l] };
  const meta = readJson(path.join(scene.dir, 'meta.json'), {});

  const entry = { id: scene.id, field: scene.field, sub: scene.sub, name: scene.name, series: meta.series ?? 'General', order: meta.order ?? 99, langs: {} };
  for (const lang of langs) {
    const base = lang === 'en' ? scene.name : `${scene.name}.${lang}`;
    const src = path.join(ROOT, 'out', scene.field, scene.sub, `${base}.mp4`);
    const video = path.join(SITE, 'videos', scene.field, scene.sub, `${base}.mp4`);
    const poster = path.join(SITE, 'posters', scene.field, scene.sub, `${base}.jpg`);
    fs.mkdirSync(path.dirname(video), { recursive: true });
    fs.mkdirSync(path.dirname(poster), { recursive: true });
    const stale = !fs.existsSync(video) || fs.statSync(video).mtimeMs < fs.statSync(src).mtimeMs;
    if (stale) {
      fs.copyFileSync(src, video);
      fs.rmSync(poster, { force: true });
    }
    if (!fs.existsSync(poster)) {
      spawnSync(ffmpegPath, ['-y', '-loglevel', 'error', '-ss', '2.8', '-i', src, '-frames:v', '1', '-vf', 'scale=960:-1', '-q:v', '4', poster]);
    }
    // text: the top-level meta fields are English; meta.<lang> overrides them for that language
    const t = lang === 'en' ? meta : { ...meta, ...meta[lang] };
    entry.langs[lang] = {
      title: t.title ?? titleCase(scene.name), summary: t.summary ?? '', tags: t.tags ?? [], series: t.series ?? entry.series,
      seconds: duration(src),
      // ?v=<mtime> so a re-rendered file gets a new URL (nginx caches videos and posters for 7 days)
      video: `videos/${scene.field}/${scene.sub}/${base}.mp4?v=${Math.floor(fs.statSync(src).mtimeMs / 1000).toString(36)}`,
      poster: `posters/${scene.field}/${scene.sub}/${base}.jpg?v=${Math.floor(fs.statSync(src).mtimeMs / 1000).toString(36)}`,
    };
  }
  videos.push(entry);
}

// copy the hand-written site source (everything except the index.html template, which is rendered below)
fs.mkdirSync(SITE, { recursive: true });
fs.cpSync(WEB, SITE, { recursive: true, force: true, filter: (src) => src !== path.join(WEB, 'index.html') });

// site fonts (self-hosted)
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

videos.sort((a, b) => (fields[a.field].order - fields[b.field].order) || a.sub.localeCompare(b.sub) || a.order - b.order);
const langCodes = [...new Set(videos.flatMap((v) => Object.keys(v.langs)))].sort((a, b) => (a === 'en' ? -1 : b === 'en' ? 1 : a.localeCompare(b)));
const data = {
  built: new Date().toISOString(),
  languages: langCodes.map((code) => ({ code, name: LANG_NAMES[code] ?? code.toUpperCase() })),
  fields: Object.values(fields).sort((a, b) => a.order - b.order),
  videos,
};
// share pages: crawlers don't run JS or read #hash routes, so each video gets /v/<id>/ (English) and
// /v/<id>/<lang>/ with its own og:title / og:image (the poster); browsers are redirected into the app
fs.rmSync(path.join(SITE, 'v'), { recursive: true, force: true });
for (const v of videos) {
  for (const [lang, t] of Object.entries(v.langs)) {
    const dir = path.join(SITE, 'v', v.id, ...(lang === 'en' ? [] : [lang]));
    const url = `${BASE}/v/${v.id}/${lang === 'en' ? '' : `${lang}/`}`;
    const image = `${BASE}/${t.poster}`;
    const title = esc(`${t.title} · Knowledge Videos`);
    const desc = esc(t.summary || 'Short animated explainers, organised by subject.');
    const target = `/${lang === 'en' ? '' : `?lang=${lang}`}#${v.id}`;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="video.other">
  <meta property="og:site_name" content="Knowledge Videos">
  <meta property="og:title" content="${esc(t.title)}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="960">
  <meta property="og:image:height" content="540">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(t.title)}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${image}">
  <meta http-equiv="refresh" content="0; url=${target}">
  <script>location.replace(${JSON.stringify(target)});</script>
</head>
<body><a href="${target}">${title}</a></body>
</html>
`);
  }
}
// cache-bust the page's own assets so browsers that cached an older build fetch the new ones together
// web/index.html is the template; site/index.html is generated (the __SITE_URL__ tags are dropped when SITE_URL is unset)
const version = Date.now().toString(36);
const template = fs.readFileSync(path.join(WEB, 'index.html'), 'utf8')
  .split('\n').filter((l) => BASE || !l.includes('__SITE_URL__')).join('\n').replaceAll('__SITE_URL__', BASE);
fs.writeFileSync(path.join(SITE, 'index.html'), template.replace(/(href|src)="(style\.css|data\.js|app\.js)(\?v=\w+)?"/g, `$1="$2?v=${version}"`));
fs.writeFileSync(path.join(SITE, 'data.js'), `window.SITE = ${JSON.stringify(data, null, 2)};\n`);
console.log(`site/: ${videos.length} videos in ${data.fields.length} subjects, languages: ${langCodes.join(', ')}`);
if (missing.length) console.log(`not rendered yet (skipped): ${missing.join(', ')}`);
