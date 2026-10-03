import { C, label, chapterTag, chapterAlpha, chip, arrow, card } from '/runtime/kit.js';
import { cylinder } from '/runtime/widgets.js';

const { range, easeOut, lerp } = Scene;

const GREEN = '#7ee787';
const HITS = ['#1  auth.md: session timeout', '#2  login.js: retry limit', '#3  CHANGELOG: v2 timeout fix'];

/** Chapter 3: large content goes into a local full-text index; a query returns a few ranked snippets. */
export default function index({ T, CS, sp, caption }) {
  return (ctx, t) => {
    const a = chapterAlpha(T, 'index', t), lt = t - T.index[0];
    chapterTag(ctx, '03', 'Index, then search', a);
    const at = (id, f, d = 0.7) => easeOut(range(lt, sp(id, f), sp(id, f) + d));

    label(ctx, 'docs, logs, pages', 230, 215, { size: 28, mono: true, color: C.dim, alpha: a * at('c3', 0.05), weight: 500 });
    for (let i = 0; i < 4; i++) {
      const s = sp('c3', 0.3 + i * 0.12), k = range(lt, s, s + 0.9);
      card(ctx, 230, 300 + i * 90, C.dim, a * at('c3', 0.05) * (1 - 0.7 * k), 170, 56);
      if (k > 0 && k < 1) card(ctx, lerp(230, 700, easeOut(k)), lerp(300 + i * 90, 450, easeOut(k)), C.electron, a * (1 - range(k, 0.75, 1)), 110, 44);
    }
    arrow(ctx, 330, 450, 540, 450, C.dim, a * at('c3', 0.2, 0.5));
    cylinder(ctx, 700, 450, 240, 260, C.electron, a * at('c3', 0.15), 'index');
    label(ctx, 'local database', 700, 625, { size: 26, mono: true, color: C.dim, alpha: a * at('c3', 0.4), weight: 500 });

    chip(ctx, 'login timeout', 530, 245, { color: C.copper, size: 32, w: 340, alpha: a * at('c4', 0.1) });
    arrow(ctx, 700, 285, 700, 315, C.copper, a * at('c4', 0.2, 0.4), 3);
    arrow(ctx, 830, 450, 1090, 450, GREEN, a * at('c4', 0.4, 0.5));
    HITS.forEach((h, i) => chip(ctx, h, 1110, 330 + i * 120, { color: GREEN, size: 28, w: 620, family: undefined, alpha: a * at('c4', 0.45 + i * 0.12) }));
    label(ctx, 'ranked', 1420, 255, { size: 26, mono: true, color: C.dim, alpha: a * at('c4', 0.45), weight: 500 });
    label(ctx, '3 snippets, not the whole docs', 1420, 720, { size: 42, weight: 700, color: C.gold, alpha: a * at('c4', 0.8) });
    caption(ctx, 'c3', a, lt, CS.c3);
    caption(ctx, 'c4', a, lt, CS.c4);
  };
}
