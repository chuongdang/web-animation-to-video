// render web/index.html into one HTML file per page, and write data.js for the app
import fs from 'node:fs';
import path from 'node:path';
import { BASE, LANG_NAMES, SITE, WEB, abs, esc } from './config.js';
import { homePath } from './model.js';
import { alternates } from './pages.js';
import { T } from './text.js';

function headHtml(pages, p) {
  const url = abs(p.path), tx = T(p.lang), alts = alternates(pages, p), image = abs(p.image);
  const meta = [
    `<title>${esc(p.title)}</title>`,
    `<meta name="description" content="${esc(p.description)}">`,
    BASE && `<link rel="canonical" href="${url}">`,
    ...(BASE ? alts.map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${abs(a.path)}">`) : []),
    BASE && `<link rel="alternate" hreflang="x-default" href="${abs((alts.find((a) => a.lang === 'en') ?? alts[0]).path)}">`,
    `<meta property="og:type" content="${p.type}">`,
    `<meta property="og:site_name" content="${tx.home}">`,
    `<meta property="og:locale" content="${tx.locale}">`,
    ...alts.filter((a) => a.lang !== p.lang).map((a) => `<meta property="og:locale:alternate" content="${T(a.lang).locale}">`),
    `<meta property="og:title" content="${esc(p.h1)}">`,
    `<meta property="og:description" content="${esc(p.description)}">`,
    BASE && `<meta property="og:url" content="${url}">`,
    BASE && `<meta property="og:image" content="${image}">`,
    BASE && `<meta property="og:image:width" content="${p.type === 'website' ? 1200 : 960}">`,
    BASE && `<meta property="og:image:height" content="${p.type === 'website' ? 630 : 540}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(p.h1)}">`,
    `<meta name="twitter:description" content="${esc(p.description)}">`,
    BASE && `<meta name="twitter:image" content="${image}">`,
    ...p.ld.map((o) => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...o }).replace(/</g, '\\u003c')}</script>`),
  ];
  return meta.filter(Boolean).join('\n  ');
}

export function writePages(pages) {
  // cache-bust the page's own assets so browsers that cached an older build fetch the new ones together
  const version = Date.now().toString(36);
  const template = fs.readFileSync(path.join(WEB, 'index.html'), 'utf8').replace(/(href|src)="\/(style\.css|data\.js|js\/main\.js)(\?v=\w+)?"/g, `$1="/$2?v=${version}"`);
  for (const p of pages) {
    const file = path.join(SITE, p.path, 'index.html');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, template.replaceAll('__LANG__', p.lang).replaceAll('__HOME__', homePath(p.lang))
      .replace('<!--SEO-->', () => headHtml(pages, p)).replace('<!--H1-->', () => esc(p.h1)).replace('<!--MAIN-->', () => p.main));
  }
}

/** data.js: the app's data, plus each page's head text so the app can keep <title>/<h1> in step with the route */
export function writeData(site, pages) {
  const data = {
    built: new Date().toISOString(),
    languages: site.langCodes.map((code) => ({ code, name: LANG_NAMES[code] ?? code.toUpperCase() })),
    fields: Object.values(site.fields).sort((a, b) => a.order - b.order),
    videos: site.videos,
    pages: Object.fromEntries(pages.map((p) => [p.path, { title: p.title, description: p.description, h1: p.h1 }])),
  };
  fs.writeFileSync(path.join(SITE, 'data.js'), `window.SITE = ${JSON.stringify(data, null, 2)};\n`);
}
