// crawler files: sitemap.xml, robots.txt, llms.txt (index) and llms-full.txt (every transcript, for LLM crawlers / answer engines)
import fs from 'node:fs';
import path from 'node:path';
import { BASE, LANG_NAMES, SITE, abs, clip, esc, fmt } from './config.js';
import { fieldIds, fieldText, inLang, poster, watchPath } from './model.js';
import { alternates } from './pages.js';
import { list } from './text.js';

function writeSitemap(site, pages) {
  const lastmod = (p) => {
    const vs = p.key.startsWith('watch:') ? [site.videos.find((v) => `watch:${v.id}` === p.key)] : inLang(site, p.lang).filter((v) => p.key === 'home' || p.key.startsWith('field:') ? p.key === 'home' || v.field === p.key.slice(6) : `${v.field}/${v.sub}` === p.key.slice(4));
    return vs.map((v) => v.langs[p.lang].updated).sort().at(-1);
  };
  const url = (p) => `  <url>\n    <loc>${abs(p.path)}</loc>\n    <lastmod>${lastmod(p)}</lastmod>\n${alternates(pages, p).length > 1 ? alternates(pages, p).map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${abs(a.path)}"/>`).join('\n') + '\n' : ''}${p.key.startsWith('watch:') ? (() => {
    const v = site.videos.find((x) => `watch:${x.id}` === p.key), t = v.langs[p.lang];
    return `    <video:video>\n      <video:thumbnail_loc>${esc(abs(poster(v, p.lang)))}</video:thumbnail_loc>\n      <video:title>${esc(clip(t.title, 100))}</video:title>\n      <video:description>${esc(clip(t.summary || p.description, 2000))}</video:description>\n      <video:content_loc>${esc(abs(`/${t.video}`))}</video:content_loc>\n      <video:duration>${t.seconds}</video:duration>\n      <video:publication_date>${t.updated}</video:publication_date>\n    </video:video>\n`;
  })() : ''}  </url>`;
  fs.writeFileSync(path.join(SITE, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${pages.map(url).join('\n')}\n</urlset>\n`);
}

function writeLlms(site) {
  const link = (p) => abs(p) || p;
  const fids = fieldIds(site);
  const llms = [`# Knowledge Videos`, '', `> Short animated explainers on ${list('en', fids.map((id) => site.fields[id].text.en.title))}. Every video page has the video and its full transcript.`, ''];
  const full = [...llms];
  for (const lang of site.langCodes) {
    for (const fid of fids) {
      const fv = inLang(site, lang).filter((v) => v.field === fid);
      if (!fv.length) continue;
      const head = `## ${fieldText(site.fields[fid], lang).title}${lang === 'en' ? '' : ` (${LANG_NAMES[lang] ?? lang})`}`;
      llms.push(head, '', ...fv.map((v) => `- [${v.langs[lang].title}](${link(watchPath(lang, v.id))}): ${v.langs[lang].summary}`), '');
      full.push(head, '');
      for (const v of fv) {
        const t = v.langs[lang];
        full.push(`### ${t.title}`, '', `URL: ${link(watchPath(lang, v.id))}`, `Series: ${t.series} · Length: ${fmt(t.seconds)}`, '', t.summary, '', ...(t.transcript.length ? ['Transcript:', '', ...t.transcript.flatMap((l) => [l, ''])] : []));
      }
    }
  }
  fs.writeFileSync(path.join(SITE, 'llms.txt'), llms.join('\n'));
  fs.writeFileSync(path.join(SITE, 'llms-full.txt'), full.join('\n'));
}

export function writeCrawlerFiles(site, pages) {
  if (BASE) writeSitemap(site, pages);
  fs.writeFileSync(path.join(SITE, 'robots.txt'), `User-agent: *\nAllow: /\n${BASE ? `\nSitemap: ${BASE}/sitemap.xml\n` : ''}`);
  writeLlms(site);
}
