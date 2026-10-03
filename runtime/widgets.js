// Larger reusable diagram pieces shared by scenes (kit.js keeps the primitives).
import { C, label } from '/runtime/kit.js';

const { lerp } = Scene;

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
export const mix = (a, b, k) => `rgb(${hex(a).map((v, i) => Math.round(lerp(v, hex(b)[i], k))).join(',')})`;
/** electron -> gold -> proton as a meter fills */
export const meterColor = (f) => (f < 0.5 ? mix(C.electron, C.gold, f / 0.5) : mix(C.gold, C.proton, Math.min(1, (f - 0.5) / 0.4)));

const kfmt = (n) => { const k = n / 1000; return k >= 10 ? `${Math.round(k)}k` : `${k.toFixed(1).replace(/\.0$/, '')}k`; };

/** "context window" bar with a token readout; (x, y) = left edge, vertical centre of the bar */
export function contextMeter(ctx, { x, y, w = 680, h = 76, tokens, limit = 200000, alpha = 1, showLimit = true }) {
  const f = tokens / limit;
  label(ctx, 'context window', x, y - h / 2 - 32, { size: 30, mono: true, color: C.dim, alpha, align: 'left', weight: 500 });
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = C.dim; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.roundRect(x, y - h / 2, w, h, 14); ctx.stroke();
  ctx.fillStyle = meterColor(f);
  if (f > 0) { ctx.beginPath(); ctx.roundRect(x, y - h / 2, Math.max(14, w * Math.min(1, f)), h, 14); ctx.fill(); }
  ctx.restore();
  label(ctx, `${kfmt(tokens)} tokens`, x, y + h / 2 + 52, { size: 56, mono: true, weight: 600, color: meterColor(f), alpha, align: 'left' });
  if (showLimit) label(ctx, `limit ${kfmt(limit)}`, x + w, y + h / 2 + 52, { size: 26, mono: true, color: C.dim, alpha, align: 'right', weight: 500 });
}

/** database cylinder centred on (x, y) with an optional mono caption inside */
export function cylinder(ctx, x, y, w, h, color, alpha = 1, text = '') {
  if (alpha <= 0) return;
  const ry = Math.min(26, h * 0.14), top = y - h / 2 + ry, bot = y + h / 2 - ry;
  ctx.save();
  ctx.globalAlpha = alpha; ctx.lineWidth = 4; ctx.strokeStyle = color; ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.beginPath();
  ctx.moveTo(x - w / 2, top); ctx.lineTo(x - w / 2, bot);
  ctx.ellipse(x, bot, w / 2, ry, 0, Math.PI, 0, true);
  ctx.lineTo(x + w / 2, top);
  ctx.ellipse(x, top, w / 2, ry, 0, 0, Math.PI, true);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x, top, w / 2, ry, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  if (text) label(ctx, text, x, y + ry * 0.6, { size: 28, mono: true, weight: 600, alpha });
}
