import { $, el } from './dom.js';
import { state } from './state.js';
import { codes, languages, videos } from './catalog.js';
import { FLAGS, flag, ui } from './i18n.js';
import { browsePath, syncUrl } from './routing.js';
import { render } from './browse.js';
import { open } from './player.js';

export function langSwitch(host, available, onPick) {
  host.hidden = available.length < 2;
  host.replaceChildren(...languages.filter((l) => available.includes(l.code)).map((l) => el('button', {
    type: 'button', lang: l.code, 'aria-pressed': String(state.lang === l.code), title: l.name, onclick: () => onPick(l.code),
  }, FLAGS[l.code] ? [flag(l.code), el('span', { class: 'sr' }, l.name)] : l.code.toUpperCase())));
}

export function setLang(code) {
  state.lang = code;
  if (!videos().some((v) => state.field === 'all' || v.field === state.field)) state.field = 'all';
  if (!videos().some((v) => (state.field === 'all' || v.field === state.field) && v.sub === state.series)) state.series = 'all';
  applyLang();
}

export function applyLang({ route = true } = {}) {
  document.documentElement.lang = state.lang;
  langSwitch($('#lang'), codes, setLang);
  $('#tagline').textContent = ui().tagline;
  $('#q').placeholder = ui().search;
  $('#q-label').textContent = ui().searchLabel;
  document.querySelector('.close').setAttribute('aria-label', ui().close);
  document.querySelector('.brand').href = browsePath(state.lang, []);
  render();
  if (state.current) open(state.current.id, { push: false, keepTime: true });
  if (route) syncUrl();
}
