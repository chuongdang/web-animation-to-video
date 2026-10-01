// the list of pages to generate: path, head text, body HTML and JSON-LD for every screen in every language.
// The app is a single-page app, but every screen also exists as real HTML so crawlers (and AI bots that do
// not run JS) get full content: / and /vi/ (home), /<field>/ and /<field>/<sub>/ and
// /<field>/<sub>/<name>/ (watch page with the video and its transcript), plus /vi/ twins of all of them. The app takes over once it loads.
import { BASE, abs, clip, fmt } from './config.js';
import { fieldIds, fieldPath, fieldText, hasSubPages, homePath, inLang, poster, subPath, subsOf, watchPath } from './model.js';
import { T, list } from './text.js';
import { sectionHtml, watchHtml } from './html.js';

const crumbLd = (items) => ({ '@type': 'BreadcrumbList', itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(p) })) });
const listLd = (vs, lang) => ({ '@type': 'ItemList', itemListElement: vs.map((v, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(watchPath(lang, v.id)), name: v.langs[lang].title })) });
const isoDur = (s) => `PT${Math.floor(s / 60)}M${s % 60}S`;

export function buildPages(site) {
  const { fields, langCodes } = site;
  const pages = [];
  for (const lang of langCodes) {
    const tx = T(lang), vs = inLang(site, lang), fids = fieldIds(site).filter((id) => vs.some((v) => v.field === id));
    const names = list(lang, fids.map((id) => fieldText(fields[id], lang).title));
    pages.push({
      key: 'home', lang, path: homePath(lang), title: tx.homeTitle, description: tx.homeDesc(names), h1: tx.homeH1, image: '/brand/og.png', type: 'website',
      main: fids.map((id) => sectionHtml(site, lang, id)).join(''),
      ld: BASE ? [{ '@type': 'WebSite', name: tx.home, url: abs(homePath(lang)), inLanguage: lang, description: tx.homeDesc(names) }, listLd(vs, lang)] : [],
    });
    for (const fid of fids) {
      const f = fields[fid], ft = fieldText(f, lang).title, fv = vs.filter((v) => v.field === fid);
      const desc = clip(`${fieldText(f, lang).blurb} ${list(lang, fv.map((v) => v.langs[lang].title))}.`.trim(), 300);
      pages.push({
        key: `field:${fid}`, lang, path: fieldPath(lang, fid), title: `${tx.fieldTitle(ft)} · ${tx.home}`, description: desc, h1: tx.fieldTitle(ft), image: '/brand/og.png', type: 'website',
        main: sectionHtml(site, lang, fid),
        ld: BASE ? [{ '@type': 'CollectionPage', name: ft, url: abs(fieldPath(lang, fid)), inLanguage: lang, description: desc }, listLd(fv, lang), crumbLd([[tx.home, homePath(lang)], [ft, fieldPath(lang, fid)]])] : [],
      });
      if (!hasSubPages(site, lang, fid)) continue;
      for (const s of subsOf(site, lang, fid)) {
        const sv = fv.filter((v) => v.sub === s), name = sv[0].langs[lang].series;
        const sdesc = clip(`${name}: ${list(lang, sv.map((v) => v.langs[lang].title))}.`, 300);
        pages.push({
          key: `sub:${fid}/${s}`, lang, path: subPath(lang, fid, s), title: `${name} – ${ft} · ${tx.home}`, description: sdesc, h1: `${name} · ${ft}`, image: '/brand/og.png', type: 'website',
          main: sectionHtml(site, lang, fid, s),
          ld: BASE ? [{ '@type': 'CollectionPage', name, url: abs(subPath(lang, fid, s)), inLanguage: lang, description: sdesc }, listLd(sv, lang), crumbLd([[tx.home, homePath(lang)], [ft, fieldPath(lang, fid)], [name, subPath(lang, fid, s)]])] : [],
        });
      }
    }
    for (const v of vs) {
      const t = v.langs[lang], ft = fieldText(fields[v.field], lang).title, p = watchPath(lang, v.id);
      const desc = clip(`${t.summary} ${tx.watchDesc(fmt(t.seconds))}`.trim(), 300);
      pages.push({
        key: `watch:${v.id}`, lang, path: p, title: `${t.title} – ${tx.explainer} · ${tx.home}`, description: desc, h1: t.title, image: poster(v, lang), type: 'video.other',
        main: watchHtml(site, v, lang),
        ld: BASE ? [{
          '@type': 'VideoObject', name: t.title, description: t.summary || desc, thumbnailUrl: [abs(poster(v, lang))], uploadDate: t.updated, duration: isoDur(t.seconds),
          contentUrl: abs(`/${t.video}`), inLanguage: lang, keywords: t.tags.join(', '), url: abs(p), ...(t.transcript.length ? { transcript: t.transcript.join(' ') } : {}),
        }, crumbLd([[tx.home, homePath(lang)], [ft, fieldPath(lang, v.field)], [t.title, p]])] : [],
      });
    }
  }
  return pages;
}

/** the same page in every language (hreflang alternates) */
export const alternates = (pages, p) => pages.filter((x) => x.key === p.key);
