// Shared building blocks for the explainer scenes: palette, fonts, canvas helpers, and narrated
// captions with keyword highlights. Import from a module scene: import { ... } from '/runtime/kit.js'.
const { range, easeOut } = Scene;

export const W = 1920, H = 1080, CX = W / 2, CY = H / 2;

// IBM Plex: a technical / lab-notebook look. Sans for headlines and captions, Mono for labels and readouts.
export const FONT = '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif';
export const MONO = '"IBM Plex Mono", "SF Mono", Menlo, monospace';
export const C = {
  bg: '#0b1020', text: '#e8ecf5', dim: '#7d88a8',
  electron: '#4dd8ff', proton: '#ff6b6b', neutron: '#9aa3b8',
  wire: '#c9d3ee', gold: '#ffd166', copper: '#e08a5a',
};

/** language variant of the scene, from ?lang=vi ('' = default English) */
export const LANG = new URLSearchParams(location.search).get('lang') ?? '';

const VI_RANGE = 'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB';
const FONT_FILES = [
  ['IBM Plex Sans', 500, 'ibm-plex-sans'], ['IBM Plex Sans', 600, 'ibm-plex-sans'], ['IBM Plex Sans', 700, 'ibm-plex-sans'],
  ['IBM Plex Mono', 500, 'ibm-plex-mono'], ['IBM Plex Mono', 600, 'ibm-plex-mono'],
];
export const fontsLoaded = Promise.all(
  FONT_FILES.map(async ([family, weight, pkg]) => {
    const url = (subset) => `/node_modules/@fontsource/${pkg}/files/${pkg}-${subset}-${weight}-normal.woff2`;
    const faces = [new FontFace(family, `url(${url('latin')})`, { weight: String(weight) })];
    if (LANG === 'vi') faces.push(new FontFace(family, `url(${url('vietnamese')})`, { weight: String(weight), unicodeRange: VI_RANGE }));
    for (const f of faces) document.fonts.add(await f.load());
  }),
);

// ---- canvas helpers ---------------------------------------------------------
export function glowDot(ctx, x, y, r, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = color;
  ctx.shadowBlur = r * 2.2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function label(ctx, text, x, y, { size = 40, color = C.text, alpha = 1, align = 'center', weight = 600, mono = false } = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${mono ? MONO : FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function chapterTag(ctx, n, text, alpha) {
  label(ctx, `${n}  ·  ${text.toUpperCase()}`, 90, 90, { size: 26, color: C.dim, alpha, align: 'left', weight: 600, mono: true });
}

/** A glowing charge with a + / − (sign 0 = neutral) mark. */
export function charge(ctx, x, y, r, sign, color, alpha = 1) {
  glowDot(ctx, x, y, r, color, alpha);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = C.bg;
  ctx.lineWidth = Math.max(2, r * 0.18);
  ctx.beginPath();
  ctx.moveTo(x - r * 0.5, y); ctx.lineTo(x + r * 0.5, y);
  if (sign > 0) { ctx.moveTo(x, y - r * 0.5); ctx.lineTo(x, y + r * 0.5); }
  ctx.stroke();
  ctx.restore();
}

// ---- narrated captions --------------------------------------------------------
const KEY_TINT = { electron: C.electron, proton: C.proton, gold: C.gold, copper: C.copper, green: '#7ee787' };
export const LEAD = 0.5;       // narrator starts this long after the caption appears
const HOLD_AFTER = 3.5;        // caption stays this long after the last word, so viewers can digest it
const HOLD = 5;                // silent fallback: hold after the keywords are highlighted
const kwCount = (text) => (text.match(/\[\[/g) ?? []).length;

/**
 * Captions for a scene. `texts` maps id -> caption markup: [[word]] highlights a keyword in gold,
 * [[word:electron]] uses another palette colour. If `npm run narrate -- <scene>` has produced
 * audio/timing.json, captions are timed to the speech and keywords highlight as they are spoken.
 */
export async function narration(scene, texts, { hold = HOLD_AFTER } = {}) {
  const dir = `/scenes/${scene}/audio${LANG ? `/${LANG}` : ''}`;
  const dur = await fetch(`${dir}/timing.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  const spoken = (id) => dur[id]?.duration;

  /** absolute end (fade-out finished) of caption `id` that appears at `start` */
  const capEnd = (id, start) =>
    spoken(id)
      ? start + LEAD + spoken(id) + hold + 0.4
      : start + 1.0 + 0.35 * Math.max(0, kwCount(texts[id]) - 1) + HOLD + 0.4;

  /** audio clip entry for Scene.define({ audio }) — narrator speaks LEAD seconds after `captionStart` */
  const cue = (id, captionStart) => (spoken(id) ? [{ src: `${dir}/${id}.wav`, start: captionStart + LEAD }] : []);

  function caption(ctx, id, chapterAlpha, lt, start) {
    const since = lt - start;
    const end = capEnd(id, start);
    const alpha = chapterAlpha * range(since, 0, 0.5) * (1 - range(lt, end - 0.4, end));
    if (alpha <= 0) return;
    const size = 46, y = H - 110;
    const parts = [];
    for (const m of texts[id].matchAll(/\[\[(.+?)(?::(\w+))?\]\]|([^[]+)/g)) {
      parts.push(m[3] ? { text: m[3] } : { text: m[1], key: true, color: KEY_TINT[m[2]] ?? C.gold });
    }
    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    for (const p of parts) {
      ctx.font = `${p.key ? 700 : 500} ${size}px ${FONT}`;
      p.w = ctx.measureText(p.text).width;
    }
    // shrink captions that would not fit the frame
    const fit = Math.min(1, (W - 160) / parts.reduce((n, p) => n + p.w, 0));
    if (fit < 1) {
      for (const p of parts) p.w *= fit;
    }
    const fs = size * fit;
    let x = CX - parts.reduce((n, p) => n + p.w, 0) / 2;
    const total = parts.reduce((n, p) => n + p.text.length, 0);
    let k = 0, before = 0;
    for (const p of parts) {
      if (p.key) {
        // narrated: sweep in when the word is spoken (estimated from its position in the sentence)
        const at = spoken(id) ? Math.max(0.3, LEAD + spoken(id) * (before / total) - 0.2) : 0.5 + k * 0.35;
        const sweep = easeOut(range(since, at, at + 0.5));
        ctx.globalAlpha = alpha * 0.22;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.roundRect(x - 10, y - size * 0.68, (p.w + 20) * sweep, size * 1.36, 10);
        ctx.fill();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 18 * sweep;
        k++;
      } else {
        ctx.globalAlpha = alpha * 0.95;
        ctx.fillStyle = C.text;
        ctx.shadowBlur = 0;
      }
      ctx.font = `${p.key ? 700 : 500} ${fs}px ${FONT}`;
      ctx.fillText(p.text, x, y);
      x += p.w;
      before += p.text.length;
    }
    ctx.restore();
  }

  return { spoken, capEnd, cue, caption };
}

// ---- scene assembly helpers ---------------------------------------------------
/**
 * Lay out a scene from its narration. `chapters` maps chapter name -> caption ids (in order), or
 * { ids, first } to start the first caption later. Returns { CS, T, AUDIO, DURATION }:
 *   CS[id]   caption start, relative to its chapter
 *   T[name]  [start, end] of each chapter; T.title and T.outro are added
 */
export function plan(nar, chapters, { title = 4 } = {}) {
  const { spoken, capEnd, cue } = nar;
  const CS = {}, T = { title: [0, title] }, AUDIO = [];
  let cursor = title;
  for (const [name, spec] of Object.entries(chapters)) {
    const ids = Array.isArray(spec) ? spec : spec.ids;
    let start = Array.isArray(spec) ? 0.6 : spec.first ?? 0.6;
    for (const id of ids) { CS[id] = start; start = capEnd(id, start); }
    const len = start + 0.3;
    T[name] = [cursor, cursor + len];
    for (const id of ids) AUDIO.push(...cue(id, cursor + CS[id]));
    cursor += len;
  }
  T.outro = [cursor, cursor + (spoken('outro') ? 0.3 + spoken('outro') + 2.5 : 8)];
  AUDIO.push(...cue('outro', T.outro[0] + 0.3 - LEAD));
  return { CS, T, AUDIO, DURATION: Math.ceil(T.outro[1] * 10) / 10 };
}

/** sp(id, f): chapter-relative time at fraction f of the spoken line `id` (e.g. when a keyword is said) */
export const speech = (nar, CS) => (id, f = 0) => CS[id] + LEAD + (nar.spoken(id) ?? 5) * f;

/** Register the scene: draws maps 'title' | <chapter> | 'outro' to (ctx, t, state) => void. */
export function mount({ plan: p, init, draws }) {
  fontsLoaded.then(() => Scene.define({
    width: W, height: H, duration: p.DURATION, background: C.bg, audio: p.AUDIO, init,
    draw(ctx, t, S) {
      const v = ctx.createRadialGradient(CX, CY, 200, CX, CY, 1200);
      v.addColorStop(0, '#141c38'); v.addColorStop(1, C.bg);
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
      for (const [name, fn] of Object.entries(draws)) {
        const span = p.T[name];
        if (name === 'outro' ? t >= span[0] - 1 : t >= span[0] - 1 && t < span[1]) fn(ctx, t, S);
      }
    },
  }));
}

/** fade-in/out opacity of a chapter at time t */
export const chapterAlpha = (T, name, t) => Scene.fadeWindow(t, T[name][0], T[name][1], 0.6, 0.6);

/** Standard title card: two headline lines (second one tinted) and a mono subtitle. */
export function titleCard(ctx, t, T, { l1, l2, sub, tint = C.electron, size = 108 }) {
  const a = Scene.fadeWindow(t, 0, T.title[1], 0.6, 0.6);
  const rise = (1 - Scene.easeOut(range(t, 0.4, 1.6))) * 30;
  label(ctx, l1, CX, CY - 60 + rise, { size, weight: 700, alpha: a * range(t, 0.4, 1.3) });
  label(ctx, l2, CX, CY + 65 + rise, { size, weight: 700, alpha: a * range(t, 0.6, 1.5), color: tint });
  label(ctx, sub, CX, CY + 175 + rise, { size: 36, mono: true, weight: 500, color: C.gold, alpha: a * range(t, 1.3, 2.2) });
  return a;
}

// ---- small drawing utilities shared by scenes ---------------------------------
/** point at fraction u (0..1) along a polyline of [x, y] points */
export function pathAt(pts, u) {
  u = Math.min(1, Math.max(0, u));
  const lens = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lens.push(l); total += l; }
  let d = u * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i]) { const k = d / lens[i]; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]; }
    d -= lens[i];
  }
  return pts[pts.length - 1];
}

/** repeating event: progress 0..1 of the run in flight at time lt, or -1 when idle */
export function repeat(lt, t0, period, dur, count = 99) {
  if (lt < t0) return -1;
  const k = Math.floor((lt - t0) / period);
  if (k >= count) return -1;
  const age = lt - t0 - k * period;
  return age <= dur ? age / dur : -1;
}

/** rounded label pill, centred on (x, y) */
export function token(ctx, text, x, y, color, alpha = 1, size = 24) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.font = `600 ${size}px ${MONO}`;
  const w = ctx.measureText(text).width + 22;
  ctx.globalAlpha = alpha * 0.2; ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - size * 0.8, w, size * 1.6, size * 0.8); ctx.fill();
  ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = C.text; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
  ctx.restore();
}

/** rounded text box with left edge at x; returns its width */
export function chip(ctx, text, x, y, { color = C.electron, size = 44, alpha = 1, w = null, weight = 500, family = FONT } = {}) {
  ctx.save();
  ctx.font = `${weight} ${size}px ${family}`;
  const cw = w ?? ctx.measureText(text).width + 36;
  ctx.globalAlpha = alpha * 0.14; ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(x, y - size * 0.85, cw, size * 1.7, 14); ctx.fill();
  ctx.globalAlpha = alpha * 0.8; ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.globalAlpha = alpha; ctx.fillStyle = C.text; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  ctx.fillText(text, x + cw / 2, y);
  ctx.restore();
  return cw;
}

export const measure = (ctx, text, size, weight = 500, family = FONT) => {
  ctx.save(); ctx.font = `${weight} ${size}px ${family}`; const w = ctx.measureText(text).width; ctx.restore();
  return w;
};

/** horizontal bar with a mono label on the left and a value on the right */
export function bar(ctx, { x, y, w, h = 44, color, alpha = 1, name = '', value = '', nameSize = 34, glow = 0 }) {
  label(ctx, name, x - 24, y, { size: nameSize, mono: true, weight: 500, alpha, align: 'right' });
  ctx.save();
  ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = glow;
  ctx.beginPath(); ctx.roundRect(x, y - h / 2, Math.max(4, w), h, 8); ctx.fill();
  ctx.restore();
  label(ctx, value, x + Math.max(4, w) + 18, y, { size: 30, mono: true, weight: 600, alpha, align: 'left' });
}

/** straight arrow from (x0, y0) to (x1, y1) */
export function arrow(ctx, x0, y0, x1, y1, color, alpha = 1, width = 4) {
  const ang = Math.atan2(y1 - y0, x1 - x0);
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - 18 * Math.cos(ang - 0.45), y1 - 18 * Math.sin(ang - 0.45)); ctx.lineTo(x1 - 18 * Math.cos(ang + 0.45), y1 - 18 * Math.sin(ang + 0.45)); ctx.closePath(); ctx.fill(); ctx.restore();
}

/** translucent rounded box with a coloured outline (x, y = top-left) */
export function panel(ctx, x, y, w, h, color, alpha = 1, fill = 0.05, r = 22) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = `rgba(255,255,255,${fill})`; ctx.strokeStyle = color; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); ctx.stroke(); ctx.restore();
}

/** rounded node box centred on (x, y), e.g. for tree diagrams; returns its width */
export function treeNode(ctx, text, x, y, color, alpha = 1, { w = null, size = 28, dashed = false, fill = 0.16 } = {}) {
  if (alpha <= 0) return 0;
  ctx.save();
  ctx.font = `600 ${size}px ${MONO}`;
  const bw = w ?? ctx.measureText(text).width + 36, bh = size * 1.9;
  ctx.globalAlpha = alpha * fill; ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(x - bw / 2, y - bh / 2, bw, bh, 12); ctx.fill();
  ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 3;
  if (dashed) ctx.setLineDash([8, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = C.text; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
  ctx.restore();
  return bw;
}

/** smooth connector from a parent's bottom (x0, y0) to a child's top (x1, y1) */
export function edge(ctx, x0, y0, x1, y1, alpha = 1, color = C.dim, width = 3) {
  if (alpha <= 0) return;
  const my = (y0 + y1) / 2;
  ctx.save();
  ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.bezierCurveTo(x0, my, x1, my, x1, y1); ctx.stroke();
  ctx.restore();
}

/**
 * Cycle diagram: `items` ([{ text, color }]) on an ellipse with arrows running clockwise from the top.
 * `reveal` is how many nodes are shown so far (fractions fade a node in); `active` highlights one node.
 * Returns the node centre for index i: pos(i) -> [x, y].
 */
export function cycle(ctx, cx, cy, rx, ry, items, { alpha = 1, reveal = items.length, active = -1, size = 30, gap = 0.5 } = {}) {
  const n = items.length;
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pos = (i) => [cx + Math.cos(ang(i)) * rx, cy + Math.sin(ang(i)) * ry];
  for (let i = 0; i < n; i++) {
    const k = Math.min(1, Math.max(0, reveal - i - 0.5));
    if (k <= 0) continue;
    const a0 = ang(i) + gap, a1 = ang(i) + (2 * Math.PI) / n - gap, e = a0 + (a1 - a0) * k;
    ctx.save(); ctx.globalAlpha = alpha * 0.9; ctx.strokeStyle = items[i].color; ctx.fillStyle = items[i].color; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, a0, e); ctx.stroke();
    if (k > 0.98) {
      const hx = cx + Math.cos(e) * rx, hy = cy + Math.sin(e) * ry, dir = Math.atan2(ry * Math.cos(e), -rx * Math.sin(e));
      ctx.beginPath(); ctx.moveTo(hx, hy);
      ctx.lineTo(hx - 20 * Math.cos(dir - 0.45), hy - 20 * Math.sin(dir - 0.45)); ctx.lineTo(hx - 20 * Math.cos(dir + 0.45), hy - 20 * Math.sin(dir + 0.45)); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  items.forEach((it, i) => {
    const k = Math.min(1, Math.max(0, reveal - i)), [x, y] = pos(i);
    treeNode(ctx, it.text, x, y, it.color, alpha * k, { size, fill: active === i ? 0.45 : 0.16 });
  });
  return pos;
}
