import { C, label, chapterTag, chapterAlpha, chip, arrow, panel } from '/runtime/kit.js';
import { contextMeter } from '/runtime/widgets.js';

const { range, easeOut } = Scene;

const GREEN = '#7ee787';
const WIDTHS = [380, 300, 420, 340, 400, 280, 430, 360, 310, 390, 330, 410];

/** Chapter 2: the command runs in a sandbox; only its printed answer reaches the context. */
export default function sandbox({ T, CS, sp, caption }) {
  return (ctx, t) => {
    const a = chapterAlpha(T, 'sandbox', t), lt = t - T.sandbox[0];
    chapterTag(ctx, '02', 'Run it in a sandbox', a);
    const at = (f, d = 0.7) => easeOut(range(lt, sp('c2', f), sp('c2', f) + d));

    chip(ctx, 'ctx_execute', 100, 470, { color: C.gold, size: 34, w: 330, weight: 700, alpha: a * easeOut(range(lt, 0.4, 1.1)) });
    arrow(ctx, 440, 470, 520, 470, C.dim, a * range(lt, 0.9, 1.4));
    panel(ctx, 530, 230, 620, 480, C.dim, a * easeOut(range(lt, 0.6, 1.3)), 0.04);
    label(ctx, 'sandbox', 560, 268, { size: 28, mono: true, color: C.dim, alpha: a * range(lt, 0.8, 1.4), align: 'left', weight: 600 });
    WIDTHS.forEach((w, i) => {
      const k = range(lt, sp('c2', 0.1 + i * 0.03), sp('c2', 0.1 + i * 0.03) + 0.4);
      ctx.save(); ctx.globalAlpha = a * k * 0.55; ctx.fillStyle = C.proton;
      ctx.beginPath(); ctx.roundRect(570, 310 + i * 28, w, 14, 7); ctx.fill(); ctx.restore();
    });
    label(ctx, 'raw output: 48k tokens', 840, 670, { size: 28, mono: true, weight: 600, color: C.proton, alpha: a * at(0.35), });

    arrow(ctx, 1160, 470, 1240, 470, C.gold, a * at(0.6, 0.5));
    chip(ctx, 'answer: 3 tests failed', 1250, 470, { color: GREEN, size: 32, w: 500, weight: 600, alpha: a * at(0.65) });
    arrow(ctx, 1500, 520, 1500, 600, GREEN, a * at(0.8, 0.5));
    contextMeter(ctx, { x: 1250, y: 680, w: 500, tokens: 400 * at(0.85), showLimit: false, alpha: a * at(0.8) });
    label(ctx, 'stays outside', 840, 740, { size: 34, weight: 700, color: C.dim, alpha: a * at(0.4) });
    caption(ctx, 'c2', a, lt, CS.c2);
  };
}
