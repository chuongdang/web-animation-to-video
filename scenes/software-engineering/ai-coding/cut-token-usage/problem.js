import { C, label, chapterTag, chapterAlpha, card } from '/runtime/kit.js';
import { contextMeter } from '/runtime/widgets.js';

const { range, easeOut, lerp } = Scene;

const COLS = 6, N = 30, GX = 150, GY = 270, DX = 118, DY = 92;
const KEEP = [4, 13, 22];
const BAR = { x: 1050, y: 470, w: 680, h: 76 };
const TOKENS = 6200, LIMIT = 200000;

const fileXY = (i) => [GX + (i % COLS) * DX + 45, GY + Math.floor(i / COLS) * DY + 28];

/** Chapter 1: Claude reads files one by one; the context meter fills, and few of them mattered. */
export default function problem({ T, CS, sp, caption }) {
  return (ctx, t) => {
    const a = chapterAlpha(T, 'problem', t), lt = t - T.problem[0];
    chapterTag(ctx, '01', 'The problem', a);
    const t0 = sp('p1', 0.25), t1 = sp('p2', 0.35), hl = range(lt, sp('p2', 0.55), sp('p2', 0.55) + 0.8);
    label(ctx, 'repo: 30 files', GX + 340, 210, { size: 30, mono: true, color: C.dim, alpha: a * range(lt, 0.3, 1), weight: 500 });

    let tokens = 0;
    for (let i = 0; i < N; i++) {
      const [x, y] = fileXY(i), s = t0 + (i / N) * (t1 - t0), k = range(lt, s, s + 0.8), keep = KEEP.includes(i);
      const base = easeOut(range(lt, 0.3 + i * 0.02, 0.9 + i * 0.02));
      const col = keep && hl > 0 ? C.gold : C.dim;
      const ghost = keep ? lerp(0.9 - 0.65 * k, 1, hl) : lerp(0.9 - 0.65 * k, 0.2, hl);
      card(ctx, x, y, col, a * base * ghost, 90, 56);
      if (k > 0 && k < 1) card(ctx, lerp(x, BAR.x, easeOut(k)), lerp(y, BAR.y, easeOut(k)), C.electron, a * (1 - range(k, 0.7, 1)), 90, 56);
      tokens += TOKENS * range(k, 0.6, 1);
    }

    contextMeter(ctx, { x: BAR.x, y: BAR.y, w: BAR.w, h: BAR.h, tokens, limit: LIMIT, alpha: a * easeOut(range(lt, 0.5, 1.2)) });

    label(ctx, 'only 3 of 30 files mattered', BAR.x + BAR.w / 2, 720, { size: 46, weight: 700, color: C.gold, alpha: a * hl });
    label(ctx, '~90% of the tokens were wasted', BAR.x + BAR.w / 2, 790, { size: 36, weight: 600, color: C.proton, alpha: a * range(lt, sp('p2', 0.7), sp('p2', 0.7) + 0.8) });
    caption(ctx, 'p1', a, lt, CS.p1);
    caption(ctx, 'p2', a, lt, CS.p2);
  };
}
