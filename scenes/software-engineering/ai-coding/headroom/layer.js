import { C, label, chapterTag, chapterAlpha, chip, arrow, card, token, bar, repeat } from '/runtime/kit.js';

const { range, easeOut, lerp } = Scene;

const SRC = [['tool outputs', 300], ['logs', 400], ['files', 500]];

/** Chapter 1: Headroom sits between the tools and the model and shrinks what flows through. */
export default function layer({ T, CS, sp, caption }) {
  return (ctx, t) => {
    const a = chapterAlpha(T, 'layer', t), lt = t - T.layer[0];
    chapterTag(ctx, '01', 'A layer before the model', a);
    const at = (id, f, d = 0.7) => easeOut(range(lt, sp(id, f), sp(id, f) + d));

    SRC.forEach(([name, y], i) => {
      chip(ctx, name, 100, y, { color: C.electron, size: 32, w: 290, alpha: a * easeOut(range(lt, 0.3 + i * 0.15, 1 + i * 0.15)) });
      arrow(ctx, 400, y, 610, 400, C.dim, a * range(lt, 0.9, 1.4) * 0.6, 3);
    });
    const hk = at('h2', 0.15);
    chip(ctx, 'headroom', 620, 400, { color: C.gold, size: 44, w: 300, weight: 700, alpha: a * Math.max(hk, range(lt, 0.9, 1.4) * 0.35) });
    token(ctx, 'runs locally', 770, 490, C.gold, a * hk, 24);
    arrow(ctx, 930, 400, 1240, 400, C.dim, a * range(lt, 0.9, 1.4) * 0.6);
    chip(ctx, 'model', 1250, 400, { color: C.copper, size: 40, w: 240, weight: 700, alpha: a * easeOut(range(lt, 0.6, 1.3)) });

    // packets: big in, small out (small only once headroom is introduced)
    const p = repeat(lt, 1.2, 2.2, 2.0);
    if (p >= 0 && p < 0.5) card(ctx, lerp(420, 620, p * 2), 400, C.electron, a, 150, 80);
    if (p >= 0.5) card(ctx, lerp(920, 1240, (p - 0.5) * 2), 400, C.electron, a * hk, 44, 28);
    if (p >= 0.5 && hk < 1) card(ctx, lerp(920, 1240, (p - 0.5) * 2), 400, C.electron, a * (1 - hk), 150, 80);

    // example from a debugging session
    const bk = at('h2', 0.55);
    label(ctx, 'example: debugging session', 520, 660, { size: 26, mono: true, color: C.dim, alpha: a * bk, align: 'left', weight: 500 });
    bar(ctx, { x: 520, y: 730, w: 700 * bk, color: C.proton, alpha: a * bk, name: 'before', value: '65.7k tokens' });
    bar(ctx, { x: 520, y: 810, w: 54 * bk, color: C.electron, alpha: a * bk, name: 'after', value: '5.1k tokens' });
    caption(ctx, 'h1', a, lt, CS.h1);
    caption(ctx, 'h2', a, lt, CS.h2);
  };
}
