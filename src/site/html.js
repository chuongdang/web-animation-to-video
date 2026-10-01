// the crawlable HTML for each screen, matching what web/js/browse.js renders client-side
import { esc, fmt } from './config.js';
import { fieldPath, fieldText, hasSubPages, homePath, inLang, poster, subPath, watchPath } from './model.js';
import { T } from './text.js';

export const cardHtml = (site, v, lang) => {
  const t = v.langs[lang];
  return `<a class="card" href="${watchPath(lang, v.id)}" data-id="${esc(v.id)}" style="--c:${site.fields[v.field].color}"><div class="thumb"><img src="${poster(v, lang)}" alt="" loading="lazy" width="960" height="540"><span class="play"></span><span class="dur">${fmt(t.seconds)}</span></div><div class="info"><h4>${esc(t.title)}</h4><p>${esc(t.summary)}</p><div class="tags">${t.tags.map((g) => `<span class="tag">${esc(g)}</span>`).join('')}</div></div></a>`;
};

/** one subject section (as the app renders it), limited to `only` sub when given */
export function sectionHtml(site, lang, fid, only) {
  const f = site.fields[fid], vs = inLang(site, lang).filter((v) => v.field === fid && (!only || v.sub === only));
  const subs = [...new Set(vs.map((v) => v.sub))];
  const series = subs.map((s) => {
    const sv = vs.filter((v) => v.sub === s), name = sv[0].langs[lang].series;
    const h3 = subs.length > 1 || name !== 'General' ? `<h3>${hasSubPages(site, lang, fid) ? `<a href="${subPath(lang, fid, s)}">${esc(name)}</a>` : esc(name)}</h3>` : '';
    return `<div class="series">${h3}<div class="grid">${sv.map((v) => cardHtml(site, v, lang)).join('')}</div></div>`;
  }).join('');
  return `<section class="field" id="${fid}" style="--c:${f.color}"><div class="field-head"><h2><a href="${fieldPath(lang, fid)}">${esc(fieldText(f, lang).title)}</a></h2><span class="count">${T(lang).count(vs.length)}</span><p>${esc(fieldText(f, lang).blurb)}</p></div>${series}</section>`;
}

export function watchHtml(site, v, lang) {
  const t = v.langs[lang], f = site.fields[v.field], tx = T(lang), ft = fieldText(f, lang).title;
  const crumbs = [`<a href="${homePath(lang)}">${esc(tx.home)}</a>`, `<a href="${fieldPath(lang, v.field)}">${esc(ft)}</a>`];
  if (hasSubPages(site, lang, v.field)) crumbs.push(`<a href="${subPath(lang, v.field, v.sub)}">${esc(t.series)}</a>`);
  const more = inLang(site, lang).filter((x) => x.field === v.field && x.sub === v.sub && x !== v);
  return `<article class="watch" style="--c:${f.color}"><nav class="crumbs" aria-label="Breadcrumb">${crumbs.join(' › ')}</nav><h2>${esc(t.title)}</h2><p class="lead">${esc(t.summary)}</p>`
    + `<video controls preload="none" playsinline poster="${poster(v, lang)}" src="/${t.video}" width="1920" height="1080"></video>`
    + (t.transcript.length ? `<h3>${esc(tx.transcript)}</h3>${t.transcript.map((l) => `<p>${esc(l)}</p>`).join('')}` : '')
    + (more.length ? `<h3>${esc(tx.related)}</h3><div class="grid">${more.map((x) => cardHtml(site, x, lang)).join('')}</div>` : '') + '</article>';
}
