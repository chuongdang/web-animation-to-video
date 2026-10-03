import { C, label, chapterTag, chapterAlpha, chip, arrow, card } from '/runtime/kit.js';
import { contextMeter } from '/runtime/widgets.js';

const { range, easeOut, lerp } = Scene;

const SRC = [['npm test', 48000, C.electron, 300], ['cat app.log', 62000, C.copper, 470], ['fetch docs', 35000, C.gold, 640]];

/** Chapter 1: three ordinary tool calls pour their raw output into the context window. */
export default function drain({ T, CS, sp, caption }) {
  return (ctx, t) => {
    const a = chapterAlpha(T, 'drain', t), lt = t - T.drain[0];
    chapterTag(ctx, '01', 'Tool output is the drain', a);
    let tokens = 0;
    SRC.forEach(([name, tok, col, y], i) => {
      const at = 0.3 + i * 0.25, s = sp('c1', at), pk = easeOut(range(lt, at, at + 0.7));
      chip(ctx, name, 120, y, { color: col, size: 34, w: 330, alpha: a * pk });
      arrow(ctx, 460, y, 920, 470, C.dim, a * range(lt, s - 0.2, s + 0.3) * 0.6, 3);
      for (let j = 0; j < 4; j++) {
        const k = range(lt, s + j * 0.25, s + j * 0.25 + 1.0);
        if (k > 0 && k < 1) card(ctx, lerp(480, 960, easeOut(k)), lerp(y, 470, easeOut(k)), col, a * (1 - range(k, 0.7, 1)), 110, 60);
      }
      tokens += tok * easeOut(range(lt, s + 0.6, s + 1.8));
    });
    contextMeter(ctx, { x: 1000, y: 470, w: 700, tokens, alpha: a * easeOut(range(lt, 0.5, 1.2)) });
    label(ctx, 'most of it is never used', 1350, 740, { size: 44, weight: 700, color: C.proton, alpha: a * range(lt, sp('c1', 0.8), sp('c1', 0.8) + 0.8) });
    caption(ctx, 'c1', a, lt, CS.c1);
  };
}
