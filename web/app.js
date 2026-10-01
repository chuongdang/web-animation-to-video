(() => {
  const { fields, videos: allVideos, languages, built } = window.SITE;
  const $ = (sel) => document.querySelector(sel);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') n.className = v;
      else if (k === 'style') n.style.cssText = v;
      else if (k === 'innerHTML') n.innerHTML = v; // trusted, static markup only
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) n.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null) n.append(kid.nodeType ? kid : document.createTextNode(kid));
    return n;
  };

  // "watched" marks live in localStorage; the site works without them
  const store = {
    get() { try { return new Set(JSON.parse(localStorage.getItem('kv-watched') ?? '[]')); } catch { return new Set(); } },
    add(id) { try { const s = store.get(); s.add(id); localStorage.setItem('kv-watched', JSON.stringify([...s])); } catch { /* ignore */ } },
  };
  let watched = store.get();

  // ---- language ----------------------------------------------------------------
  // A video is listed in a language only if it has been rendered in it.
  const UI = {
    en: {
      tagline: 'Short animated explainers, organised by subject.', search: 'Search videos, topics, tags…', searchLabel: 'Search videos',
      all: 'All subjects', allSub: 'All', watched: 'Watched', none: 'No videos match your search.',
      share: 'Copy link', copied: 'Link copied', prev: '← Previous in series', next: 'Next in series →', close: 'Close video',
      stats: (n, total, subjects, time) => `${n} of ${total} videos · ${subjects} subjects · ${time} total`,
      count: (n) => `${n} video${n > 1 ? 's' : ''}`,
    },
    vi: {
      tagline: 'Những video hoạt hình ngắn giải thích kiến thức, sắp xếp theo môn học.', search: 'Tìm video, chủ đề, thẻ…', searchLabel: 'Tìm video',
      all: 'Tất cả môn học', allSub: 'Tất cả', watched: 'Đã xem', none: 'Không có video nào phù hợp.',
      share: 'Sao chép liên kết', copied: 'Đã sao chép', prev: '← Bài trước', next: 'Bài tiếp theo →', close: 'Đóng video',
      stats: (n, total, subjects, time) => `${n} / ${total} video · ${subjects} môn học · tổng ${time}`,
      count: (n) => `${n} video`,
    },
  };
  // inline SVG flags (emoji flags don't render on Windows); unknown languages fall back to the code
  const FLAGS = {
    en: '<svg viewBox="0 0 60 40"><rect width="60" height="40" fill="#012169"/><path d="M0 0L60 40M60 0L0 40" stroke="#fff" stroke-width="8"/><path d="M0 0L60 40M60 0L0 40" stroke="#c8102e" stroke-width="3"/><path d="M30 0V40M0 20H60" stroke="#fff" stroke-width="13"/><path d="M30 0V40M0 20H60" stroke="#c8102e" stroke-width="7"/></svg>',
    vi: '<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#da251d"/><polygon fill="#ff0" points="15.00,4.00 16.35,8.15 20.71,8.15 17.18,10.71 18.53,14.85 15.00,12.29 11.47,14.85 12.82,10.71 9.29,8.15 13.65,8.15"/></svg>',
  };
  const flag = (code) => el('span', { class: 'flag', 'aria-hidden': 'true', innerHTML: FLAGS[code] ?? '' });
  const codes = languages.map((l) => l.code);
  const pickLang = () => {
    let saved = null;
    try { saved = localStorage.getItem('kv-lang'); } catch { /* ignore */ }
    const wanted = [new URLSearchParams(location.search).get('lang'), saved, ...navigator.languages.map((l) => l.slice(0, 2)), 'en'];
    return wanted.find((l) => codes.includes(l)) ?? codes[0];
  };
  const state = { field: 'all', series: 'all', query: '', lang: pickLang() };
  const ui = () => UI[state.lang] ?? UI.en;

  // ---- routing -----------------------------------------------------------------
  // The URL mirrors what is on screen, so refresh / back / shared links land in the same place:
  //   #<subject>   #<subject>/<sub-category>   #<subject>/<sub-category>/<video>   (+ ?lang=vi)
  const hashParts = () => decodeURIComponent(location.hash.slice(1)).split('/').filter(Boolean);
  function syncUrl() {
    const parts = current ? [current.id] : state.field === 'all' ? [] : [state.field, ...(state.series === 'all' ? [] : [state.series])];
    const search = languages.length > 1 ? `?lang=${state.lang}` : '';
    const url = `${location.pathname}${search}${parts.length ? `#${parts.join('/')}` : ''}`;
    if (url !== location.pathname + location.search + location.hash) history.pushState(null, '', url);
  }
  /** make the screen match the URL (initial load, back / forward, edited hash) */
  function applyRoute() {
    const parts = hashParts();
    // legacy links: #field/name, and g9 scenes that had a g9- prefix
    const vid = parts.length >= 2 && allVideos.find((x) => x.id === parts.join('/') || [`${x.field}/${x.name}`, `${x.field}/g9-${x.name}`].includes(parts.join('/')));
    const f = fieldById[vid ? vid.field : parts[0]];
    if (f && (vid ? !vid.langs[state.lang] : !videos().some((v) => v.field === f.id))) {
      // the video / subject doesn't exist in this language: switch to one that has it
      const l = codes.find((c) => allVideos.some((v) => (vid ? v === vid : v.field === f.id) && v.langs[c]));
      if (l) { state.lang = l; applyLang({ route: false }); }
    }
    state.field = f ? f.id : 'all';
    // a video link shows its own sub-category behind the player
    const sub = vid ? vid.sub : parts[1];
    state.series = f && sub && allVideos.some((v) => v.field === f.id && v.sub === sub) ? sub : 'all';
    if (vid) { render(); open(vid.id, { push: false }); }
    else { close({ push: false }); render(); }
  }
  const videos = () => allVideos.filter((v) => v.langs[state.lang]);
  const tx = (v) => v.langs[state.lang];
  const fieldText = (f) => f.text[state.lang] ?? f.text.en;
  const fieldById = Object.fromEntries(fields.map((f) => [f.id, f]));
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  function setLang(code) {
    state.lang = code;
    try { localStorage.setItem('kv-lang', code); } catch { /* ignore */ }
    if (!videos().some((v) => state.field === 'all' || v.field === state.field)) state.field = 'all';
    if (!videos().some((v) => (state.field === 'all' || v.field === state.field) && v.sub === state.series)) state.series = 'all';
    applyLang();
  }
  function langSwitch(host, available, onPick) {
    host.hidden = available.length < 2;
    host.replaceChildren(...languages.filter((l) => available.includes(l.code)).map((l) => el('button', {
      type: 'button', lang: l.code, 'aria-pressed': String(state.lang === l.code), title: l.name, onclick: () => onPick(l.code),
    }, FLAGS[l.code] ? [flag(l.code), el('span', { class: 'sr' }, l.name)] : l.code.toUpperCase())));
  }
  function applyLang({ route = true } = {}) {
    document.documentElement.lang = state.lang;
    langSwitch($('#lang'), codes, setLang);
    $('#tagline').textContent = ui().tagline;
    $('#q').placeholder = ui().search;
    $('#q-label').textContent = ui().searchLabel;
    document.querySelector('.close').setAttribute('aria-label', ui().close);
    render();
    if (current) open(current.id, { push: false, keepTime: true });
    if (route) syncUrl();
  }

  const matches = (v) => {
    if (state.field !== 'all' && v.field !== state.field) return false;
    if (state.series !== 'all' && v.sub !== state.series) return false;
    const q = state.query.trim().toLowerCase();
    if (!q) return true;
    return [tx(v).title, tx(v).summary, tx(v).series, tx(v).tags.join(' '), fieldText(fieldById[v.field]).title].join(' ').toLowerCase().includes(q);
  };

  // ---- tabs ------------------------------------------------------------------
  function renderTabs() {
    const tabs = $('#tabs');
    tabs.replaceChildren();
    const mk = (id, title, color, n) => el('button', {
      class: 'tab', type: 'button', 'aria-pressed': String(state.field === id), style: `--c:${color}`,
      onclick: () => { state.field = id; state.series = 'all'; render(); syncUrl(); },
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
    const mk = (id, title, n) => el('button', {
      class: 'tab sub', type: 'button', 'aria-pressed': String(state.series === id),
      onclick: () => { state.series = id; render(); syncUrl(); },
    }, title, el('span', { class: 'n' }, String(n)));
    host.append(mk('all', ui().allSub, inField.length));
    for (const s of names) {
      const list = inField.filter((v) => v.sub === s);
      host.append(mk(s, tx(list[0]).series, list.length));
    }
  }

  // ---- cards -----------------------------------------------------------------
  function card(v) {
    const f = fieldById[v.field];
    return el('button', { class: 'card', type: 'button', style: `--c:${f.color}`, 'data-id': v.id, onclick: () => open(v.id) },
      el('div', { class: 'thumb' },
        el('img', { src: tx(v).poster, alt: '', loading: 'lazy', width: 960, height: 540 }),
        el('span', { class: 'play' }),
        watched.has(v.id) ? el('span', { class: 'seen' }, ui().watched) : null,
        el('span', { class: 'dur' }, fmt(tx(v).seconds))),
      el('div', { class: 'info' },
        el('h4', {}, tx(v).title),
        el('p', {}, tx(v).summary),
        el('div', { class: 'tags' }, tx(v).tags.map((t) => el('span', { class: 'tag' }, t)))));
  }

  function render() {
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
        el('div', { class: 'field-head' }, el('h2', {}, fieldText(f).title), el('span', { class: 'count' }, ui().count(inField.length)), el('p', {}, fieldText(f).blurb)));
      const seriesNames = [...new Set(inField.map((v) => v.sub))];
      for (const s of seriesNames) {
        const list = inField.filter((v) => v.sub === s);
        section.append(el('div', { class: 'series' },
          seriesNames.length > 1 || tx(list[0]).series !== 'General' ? el('h3', {}, tx(list[0]).series) : null,
          el('div', { class: 'grid' }, list.map(card))));
      }
      lib.append(section);
    }
  }

  // ---- player ----------------------------------------------------------------
  const modal = $('#modal'), player = $('#player');
  let current = null, lastFocus = null;

  function open(id, { push = true, keepTime = false } = {}) {
    // old links used field/name (before sub-category folders; g9 scenes had a g9- prefix)
    const v = allVideos.find((x) => x.id === id) ?? allVideos.find((x) => [`${x.field}/${x.name}`, `${x.field}/g9-${x.name}`].includes(id));
    if (!v) return;
    // the requested video may not exist in the current language: fall back to one it does have
    if (!v.langs[state.lang]) state.lang = Object.keys(v.langs)[0];
    const resume = keepTime ? player.currentTime : 0;
    current = v;
    lastFocus = document.activeElement;
    const f = fieldById[v.field];
    modal.style.setProperty('--c', f.color);
    $('#m-crumb').textContent = `${fieldText(f).title} · ${tx(v).series}`;
    $('#m-title').textContent = tx(v).title;
    $('#m-summary').textContent = tx(v).summary;
    $('#prev').textContent = ui().prev;
    // share the /v/<id>/ page (carries the preview image for link unfurls), not the #hash URL
    const share = $('#share');
    share.textContent = ui().share;
    share.onclick = async () => {
      const link = `${location.origin}/v/${v.id}/${state.lang === 'en' ? '' : `${state.lang}/`}`;
      try { await navigator.clipboard.writeText(link); } catch { prompt(ui().share, link); return; }
      share.textContent = ui().copied;
      setTimeout(() => { share.textContent = ui().share; }, 1800);
    };
    $('#next').textContent = ui().next;
    langSwitch($('#m-lang'), Object.keys(v.langs), setLang);
    player.poster = tx(v).poster;
    player.src = tx(v).video;
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

  function close({ push = true } = {}) {
    if (modal.hidden) return;
    player.pause();
    player.removeAttribute('src');
    player.load();
    modal.hidden = true;
    document.body.style.overflow = '';
    if (current) { watched = store.get(); render(); }
    lastFocus?.focus?.();
    current = null;
    if (push) syncUrl();
  }

  player.addEventListener('timeupdate', () => {
    if (current && player.duration && player.currentTime / player.duration > 0.9 && !watched.has(current.id)) { store.add(current.id); watched.add(current.id); }
  });
  modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  // ---- wiring ----------------------------------------------------------------
  $('#q').addEventListener('input', (e) => { state.query = e.target.value; render(); });
  // the header logo goes back to the homepage: close the player, clear filters and search, scroll to top
  document.querySelector('.brand').addEventListener('click', (e) => {
    e.preventDefault();
    close({ push: false });
    state.field = 'all';
    state.series = 'all';
    state.query = '';
    $('#q').value = '';
    render();
    syncUrl();
    scrollTo({ top: 0, behavior: 'smooth' });
  });
  addEventListener('popstate', applyRoute);
  applyLang({ route: false });
  applyRoute();
})();
