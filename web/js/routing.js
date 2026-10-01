// Real URLs, and each one also exists as static HTML (for crawlers), so the app only takes over a page:
//   /   /<subject>/   /<subject>/<sub-category>/   /<subject>/<sub-category>/<video>/
// Languages other than English add a /<lang> prefix. Old #hash links and ?lang= still resolve and are
// rewritten to the new form (old /v/<id>/ URLs are redirected by nginx).
import { $ } from './dom.js';
import { state } from './state.js';
import { allVideos, codes, fieldById, findVideo, pages, videos } from './catalog.js';
import { applyLang } from './lang.js';
import { render } from './browse.js';
import { open, close } from './player.js';

export const browsePath = (lang, parts) => `${lang === 'en' ? '' : `/${lang}`}/${parts.length ? `${parts.join('/')}/` : ''}`;
export const watchPath = (id, lang) => `${lang === 'en' ? '' : `/${lang}`}/${id}/`;
const currentPath = () => (state.current ? watchPath(state.current.id, state.lang)
  : browsePath(state.lang, state.field === 'all' ? [] : [state.field, ...(state.series === 'all' ? [] : [state.series])]));

/** what the address bar says: { lang, parts: [subject, sub], vid: video id }. No language in the URL means English. */
export function parseUrl() {
  let parts = location.pathname.split('/').filter(Boolean).map(decodeURIComponent), vid = null;
  const q = new URLSearchParams(location.search).get('lang');
  let lang = codes.includes(q) ? q : codes.includes('en') ? 'en' : codes[0];
  if (codes.includes(parts[0]) && !fieldById[parts[0]]) lang = parts.shift();
  if (parts.length === 3 && findVideo(parts.join('/'))) { vid = parts.join('/'); parts = []; }
  const h = decodeURIComponent(location.hash.slice(1)).split('/').filter(Boolean);
  if (h.length) { if (h.length >= 2 && findVideo(h.join('/'))) vid = h.join('/'); else parts = h; }
  return { lang, parts, vid };
}

export function syncUrl({ replace = false } = {}) {
  const url = currentPath();
  if (url !== location.pathname + location.search + location.hash) history[replace ? 'replaceState' : 'pushState'](null, '', url);
  updateHead();
}

/** keep <title>, description and the (visually hidden) <h1> in step with the screen */
function updateHead() {
  const p = pages?.[currentPath()];
  if (!p) return;
  document.title = p.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', p.description);
  $('#page-h1').textContent = p.h1;
}

/** make the screen match the URL (initial load, back / forward) */
export function applyRoute() {
  const r = parseUrl();
  const vid = r.vid && findVideo(r.vid);
  if (r.lang && r.lang !== state.lang) { state.lang = r.lang; applyLang({ route: false }); }
  const f = fieldById[vid ? vid.field : r.parts[0]];
  if (f && (vid ? !vid.langs[state.lang] : !videos().some((v) => v.field === f.id))) {
    // the video / subject doesn't exist in this language: switch to one that has it
    const l = codes.find((c) => allVideos.some((v) => (vid ? v === vid : v.field === f.id) && v.langs[c]));
    if (l) { state.lang = l; applyLang({ route: false }); }
  }
  state.field = f ? f.id : 'all';
  // a video link shows its own sub-category behind the player
  const sub = vid ? vid.sub : r.parts[1];
  state.series = f && sub && allVideos.some((v) => v.field === f.id && v.sub === sub) ? sub : 'all';
  if (vid) { render(); open(vid.id, { push: false }); }
  else { close({ push: false }); render(); }
  updateHead();
}

export const showBrowse = (field, series, { top = false } = {}) => {
  state.field = field; state.series = series; render(); syncUrl();
  if (top) scrollTo({ top: 0, behavior: 'smooth' });
};
