import { C, label, chapterTag, chapterAlpha, chip, arrow, panel } from '/runtime/kit.js';
import { cylinder } from '/runtime/widgets.js';

const { range, easeOut } = Scene;

const GREEN = '#7ee787';
const EVENTS = [['edit auth.js', C.electron], ['task: add login', C.gold], ['decision: use JWT', GREEN], ['error: test failed', C.proton]];
const ROWS = [330, 280, 360, 300, 340, 270, 350, 310];

/** Chapter 4: session events are stored; after compaction only the relevant ones come back. */
export default function memory({ T, CS, sp, caption }) {
  return (ctx, t) => {
    const a = chapterAlpha(T, 'memory', t), lt = t - T.memory[0];
    chapterTag(ctx, '04', 'Memory that survives compaction', a);
    const at = (id, f, d = 0.7) => easeOut(range(lt, sp(id, f), sp(id, f) + d));

    EVENTS.forEach(([text, col], i) => {
      const k = at('c5', 0.3 + i * 0.15);
      chip(ctx, text, 100, 290 + i * 100, { color: col, size: 30, w: 380, alpha: a * k });
      arrow(ctx, 490, 290 + i * 100, 590, 440, C.dim, a * k * 0.6, 3);
    });
    cylinder(ctx, 700, 440, 220, 250, C.electron, a * at('c5', 0.1), 'events');

    const wipe = at('c6', 0.05, 0.6), back = at('c6', 0.5);
    panel(ctx, 1000, 230, 780, 480, C.dim, a * at('c5', 0.1), 0.04);
    label(ctx, 'context window', 1030, 268, { size: 28, mono: true, color: C.dim, alpha: a * at('c5', 0.1), align: 'left', weight: 600 });
    ROWS.forEach((w, i) => {
      const k = range(lt, 0.8 + i * 0.12, 1.2 + i * 0.12);
      ctx.save(); ctx.globalAlpha = a * k * (1 - wipe) * 0.5; ctx.fillStyle = C.dim;
      ctx.beginPath(); ctx.roundRect(1040, 310 + i * 44, w + 200, 22, 8); ctx.fill(); ctx.restore();
    });
    label(ctx, 'compaction', 1390, 470, { size: 56, weight: 700, color: C.proton, alpha: a * wipe * (1 - back) });
    arrow(ctx, 830, 440, 990, 440, C.gold, a * back, 4);
    chip(ctx, 'decision: use JWT', 1040, 380, { color: GREEN, size: 32, w: 500, alpha: a * back });
    chip(ctx, 'error: test failed', 1040, 480, { color: C.proton, size: 32, w: 500, alpha: a * at('c6', 0.65) });
    label(ctx, 'only what is relevant', 1390, 790, { size: 42, weight: 700, color: C.gold, alpha: a * at('c6', 0.8) });
    caption(ctx, 'c5', a, lt, CS.c5);
    caption(ctx, 'c6', a, lt, CS.c6);
  };
}
