// the library: subject tabs, sub-category chips and the card grid
import { $, el, go } from './dom.js';
import { state } from './state.js';
import { fields, fieldById, fieldText, fmt, tx, videos } from './catalog.js';
import { ui } from './i18n.js';
import { browsePath, showBrowse, watchPath } from './routing.js';
import { open } from './player.js';

const matches = (v) => {
  if (state.field !== 'all' && v.field !== state.field) return false;
  if (state.series !== 'all' && v.sub !== state.series) return false;
  const q = state.query.trim().toLowerCase();
  if (!q) return true;
  return [tx(v).title, tx(v).summary, tx(v).series, tx(v).tags.join(' '), fieldText(fieldById[v.field]).title].join(' ').toLowerCase().includes(q);
};

function renderTabs() {
  const tabs = $('#tabs');
  tabs.replaceChildren();
  const mk = (id, title, color, n) => el('a', {
    class: 'tab', href: browsePath(state.lang, id === 'all' ? [] : [id]), 'aria-current': state.field === id ? 'true' : null, style: `--c:${color}`,
    onclick: go(() => showBrowse(id, 'all')),
  }, el('span', { class: 'dot' }), title, el('span', { class: 'n' }, String(n)));
  const vs = videos();
  tabs.append(mk('all', ui().all, '#e8ecf5', vs.length));
  for (const f of fields) {
    const n = vs.filter((v) => v.field === f.id).length;
    if (n) tabs.append(mk(f.id, fieldText(f).title, f.color, n));
  }
}

// sub categories (a field's series): only when one subject is selected and it has more than one
function renderSubtabs() {
  const host = $('#subtabs');
  const f = fieldById[state.field];
  const inField = f ? videos().filter((v) => v.field === f.id) : [];
  const names = [...new Set(inField.map((v) => v.sub))];
  host.hidden = names.length < 2;
  host.replaceChildren();
  if (host.hidden) return;
  host.style.setProperty('--c', f.color);
  const mk = (id, title, n) => el('a', {
    class: 'tab sub', href: browsePath(state.lang, id === 'all' ? [f.id] : [f.id, id]), 'aria-current': state.series === id ? 'true' : null,
    onclick: go(() => showBrowse(f.id, id)),
  }, title, el('span', { class: 'n' }, String(n)));
  host.append(mk('all', ui().allSub, inField.length));
  for (const s of names) {
    const list = inField.filter((v) => v.sub === s);
    host.append(mk(s, tx(list[0]).series, list.length));
  }
}

function card(v) {
  const f = fieldById[v.field];
  return el('a', { class: 'card', href: watchPath(v.id, state.lang), style: `--c:${f.color}`, 'data-id': v.id, onclick: go(() => open(v.id)) },
    el('div', { class: 'thumb' },
      el('img', { src: `/${tx(v).poster}`, alt: '', loading: 'lazy', width: 960, height: 540 }),
      el('span', { class: 'play' }),
      state.watched.has(v.id) ? el('span', { class: 'seen' }, ui().watched) : null,
      el('span', { class: 'dur' }, fmt(tx(v).seconds))),
    el('div', { class: 'info' },
      el('h4', {}, tx(v).title),
      el('p', {}, tx(v).summary),
      el('div', { class: 'tags' }, tx(v).tags.map((t) => el('span', { class: 'tag' }, t)))));
}

export function render() {
  renderTabs();
  renderSubtabs();
  const lib = $('#library');
  lib.replaceChildren();
  const shown = videos().filter(matches);
  const subjects = new Set(videos().map((v) => v.field)).size;
  $('#stats').textContent = ui().stats(shown.length, videos().length, subjects, fmt(shown.reduce((s, v) => s + tx(v).seconds, 0)));
  if (!shown.length) {
    lib.append(el('p', { class: 'empty' }, ui().none));
    return;
  }
  for (const f of fields) {
    const inField = shown.filter((v) => v.field === f.id);
    if (!inField.length) continue;
    const section = el('section', { class: 'field', id: f.id, style: `--c:${f.color}` },
      el('div', { class: 'field-head' }, el('h2', {}, el('a', { href: browsePath(state.lang, [f.id]), onclick: go(() => showBrowse(f.id, 'all', { top: true })) }, fieldText(f).title)), el('span', { class: 'count' }, ui().count(inField.length)), el('p', {}, fieldText(f).blurb)));
    const seriesNames = [...new Set(inField.map((v) => v.sub))];
    const manySubs = new Set(videos().filter((v) => v.field === f.id).map((v) => v.sub)).size > 1;
    for (const s of seriesNames) {
      const list = inField.filter((v) => v.sub === s);
      section.append(el('div', { class: 'series' },
        seriesNames.length > 1 || tx(list[0]).series !== 'General' ? el('h3', {}, manySubs
          ? el('a', { href: browsePath(state.lang, [f.id, s]), onclick: go(() => showBrowse(f.id, s, { top: true })) }, tx(list[0]).series)
          : tx(list[0]).series) : null,
        el('div', { class: 'grid' }, list.map(card))));
    }
    lib.append(section);
  }
}
