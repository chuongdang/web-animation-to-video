import { $, el } from './dom.js';
import { state } from './state.js';
import { store } from './store.js';
import { fieldById, fieldText, findVideo, tx, videos } from './catalog.js';
import { ui } from './i18n.js';
import { langSwitch, setLang } from './lang.js';
import { syncUrl, watchPath } from './routing.js';
import { render } from './browse.js';

const modal = $('#modal'), player = $('#player');
let lastFocus = null;

export function open(id, { push = true, keepTime = false } = {}) {
  const v = findVideo(id);
  if (!v) return;
  // the requested video may not exist in the current language: fall back to one it does have
  if (!v.langs[state.lang]) state.lang = Object.keys(v.langs)[0];
  const resume = keepTime ? player.currentTime : 0;
  state.current = v;
  lastFocus = document.activeElement;
  const f = fieldById[v.field];
  modal.style.setProperty('--c', f.color);
  $('#m-crumb').textContent = `${fieldText(f).title} · ${tx(v).series}`;
  $('#m-title').textContent = tx(v).title;
  $('#m-summary').textContent = tx(v).summary;
  $('#prev').textContent = ui().prev;
  // share the video's own page (a real page with its own preview image and transcript)
  const share = $('#share');
  share.textContent = ui().share;
  share.onclick = async () => {
    const link = `${location.origin}${watchPath(v.id, state.lang)}`;
    try { await navigator.clipboard.writeText(link); } catch { prompt(ui().share, link); return; }
    share.textContent = ui().copied;
    setTimeout(() => { share.textContent = ui().share; }, 1800);
  };
  $('#next').textContent = ui().next;
  langSwitch($('#m-lang'), Object.keys(v.langs), setLang);
  const lines = tx(v).transcript ?? [], tr = $('#m-transcript');
  tr.hidden = !lines.length;
  tr.open = false;
  tr.querySelector('summary').textContent = ui().transcript;
  tr.querySelector('div').replaceChildren(...lines.map((l) => el('p', {}, l)));
  player.poster = `/${tx(v).poster}`;
  player.src = `/${tx(v).video}`;
  if (resume) player.addEventListener('loadedmetadata', () => { player.currentTime = resume; }, { once: true });
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  const siblings = videos().filter((x) => x.field === v.field && x.sub === v.sub);
  const i = siblings.indexOf(v);
  $('#prev').disabled = i <= 0;
  $('#next').disabled = i >= siblings.length - 1;
  $('#prev').onclick = () => siblings[i - 1] && open(siblings[i - 1].id);
  $('#next').onclick = () => siblings[i + 1] && open(siblings[i + 1].id);
  player.play().catch(() => { /* autoplay may be blocked; the controls are there */ });
  if (push) syncUrl();
}

export function close({ push = true } = {}) {
  if (modal.hidden) return;
  player.pause();
  player.removeAttribute('src');
  player.load();
  modal.hidden = true;
  document.body.style.overflow = '';
  if (state.current) { state.watched = store.get(); render(); }
  lastFocus?.focus?.();
  state.current = null;
  if (push) syncUrl();
}

// mark a video watched once 90% has played
player.addEventListener('timeupdate', () => {
  const v = state.current;
  if (v && player.duration && player.currentTime / player.duration > 0.9 && !state.watched.has(v.id)) { store.add(v.id); state.watched.add(v.id); }
});
modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
