import { C, label, chapterTag, chapterAlpha, chip, arrow } from '/runtime/kit.js';

const { range, easeOut } = Scene;

const LANES = [
  { name: 'JSON', note: 'repeated keys folded', color: C.electron, widths: [380, 330, 360, 300, 370, 340] },
  { name: 'code', note: 'signatures kept', color: C.gold, widths: [320, 400, 280, 360, 340, 300] },
  { name: 'logs', note: 'errors kept', color: C.copper, widths: [400, 360, 320, 380, 300, 350] },
];
const KEPT = [1, 4];

/** Chapter 2: each content type has its own compressor that keeps the lines that matter. */
export default function compress({ T, CS, sp, caption }) {
  return (ctx, t) => {
    const a = chapterAlpha(T, 'compress', t), lt = t - T.compress[0];
    chapterTag(ctx, '02', 'Content-aware compression', a);
    LANES.forEach((l, i) => {
      const y = 300 + i * 190, k = easeOut(range(lt, sp('h3', 0.05 + i * 0.2), sp('h3', 0.05 + i * 0.2) + 0.8));
      const sq = easeOut(range(lt, sp('h3', 0.45 + i * 0.15), sp('h3', 0.45 + i * 0.15) + 0.9));
      chip(ctx, l.name, 100, y, { color: l.color, size: 36, w: 200, weight: 700, alpha: a * k });
      l.widths.forEach((w, j) => {
        const kept = KEPT.includes(j);
        ctx.save(); ctx.globalAlpha = a * k * (kept ? 0.9 : 0.6 - 0.35 * sq); ctx.fillStyle = kept ? l.color : C.dim;
        ctx.beginPath(); ctx.roundRect(360, y - 60 + j * 22, w, 12, 6); ctx.fill(); ctx.restore();
      });
      arrow(ctx, 790, y, 930, y, C.dim, a * sq * 0.8);
      KEPT.forEach((j, n) => {
        ctx.save(); ctx.globalAlpha = a * sq; ctx.fillStyle = l.color;
        ctx.beginPath(); ctx.roundRect(960, y - 20 + n * 30, l.widths[j] * 0.7, 12, 6); ctx.fill(); ctx.restore();
      });
      label(ctx, l.note, 1330, y, { size: 30, mono: true, color: l.color, alpha: a * sq, align: 'left', weight: 600 });
    });
    caption(ctx, 'h3', a, lt, CS.h3);
  };
}
