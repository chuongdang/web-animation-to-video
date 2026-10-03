// scan scenes/ and out/, copy each rendered video into site/videos, extract posters, and return the library model:
// { fields, videos, langCodes, missing }
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import { listScenes, INTERNAL_FIELD } from '../server.js';
import { ROOT, SITE, LANG_NAMES, readJson, titleCase } from './config.js';

function duration(file) {
  const r = spawnSync(ffmpegPath, ['-i', file], { encoding: 'utf8' });
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(r.stderr);
  return m ? Math.round(Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])) : 0;
}

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

/** copy one rendered video into site/videos (when changed) and make its poster; returns the language entry */
function addLanguage(scene, meta, lang, entry) {
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
  // ?v=<mtime> so a re-rendered file gets a new URL (nginx caches videos and posters for 7 days)
  const v = Math.floor(fs.statSync(src).mtimeMs / 1000).toString(36);
  return {
    title: t.title ?? titleCase(scene.name), summary: t.summary ?? '', tags: t.tags ?? [], series: t.series ?? entry.series,
    seconds: duration(src),
    updated: new Date(fs.statSync(src).mtimeMs).toISOString(),
    transcript: Object.values(readJson(path.join(scene.dir, lang === 'en' ? 'narration.json' : `narration.${lang}.json`), {}).lines ?? {}).filter((l) => typeof l === 'string'),
    video: `videos/${scene.field}/${scene.sub}/${base}.mp4?v=${v}`,
    poster: `posters/${scene.field}/${scene.sub}/${base}.jpg?v=${v}`,
  };
}

export function buildCatalog() {
  const fields = {};
  const videos = [];
  const missing = [];
  for (const scene of listScenes()) {
    if (scene.field === INTERNAL_FIELD) continue; // internal scenes never reach the site
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
    for (const lang of langs) entry.langs[lang] = addLanguage(scene, meta, lang, entry);
    videos.push(entry);
  }

  videos.sort((a, b) => (fields[a.field].order - fields[b.field].order) || a.sub.localeCompare(b.sub) || a.order - b.order);
  const langCodes = [...new Set(videos.flatMap((v) => Object.keys(v.langs)))].sort((a, b) => (a === 'en' ? -1 : b === 'en' ? 1 : a.localeCompare(b)));
  const RESERVED = new Set(['brand', 'fonts', 'videos', 'posters', ...langCodes]);
  for (const f of Object.keys(fields)) if (RESERVED.has(f)) throw new Error(`subject folder "${f}" collides with a reserved site path`);
  return { fields, videos, langCodes, missing };
}
