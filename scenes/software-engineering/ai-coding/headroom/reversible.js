import { C, label, chapterTag, chapterAlpha, chip, arrow, glowDot, pathAt } from '/runtime/kit.js';
import { cylinder } from '/runtime/widgets.js';

const { range, easeOut } = Scene;

const GREEN = '#7ee787';
const PATH = [[420, 330], [790, 330], [1330, 330]];
const MODES = ['local proxy', 'library', 'MCP server'];

/** Chapter 3: the original sits in a local cache and can be fetched back; then how to run it. */
export default function reversible({ T, CS, sp, caption }) {
  return (ctx, t) => {
    const a = chapterAlpha(T, 'reverse', t), lt = t - T.reverse[0];
    chapterTag(ctx, '03', 'Reversible, and easy to run', a);
    const at = (id, f, d = 0.7) => easeOut(range(lt, sp(id, f), sp(id, f) + d));

    chip(ctx, 'model', 150, 330, { color: C.copper, size: 38, w: 270, weight: 700, alpha: a * easeOut(range(lt, 0.4, 1.1)) });
    chip(ctx, 'headroom', 640, 330, { color: C.gold, size: 38, w: 300, weight: 700, alpha: a * easeOut(range(lt, 0.6, 1.3)) });
    cylinder(ctx, 1450, 330, 200, 200, GREEN, a * at('h4', 0.1), 'cache');
    label(ctx, 'local', 1450, 450, { size: 24, mono: true, color: C.dim, alpha: a * at('h4', 0.1), weight: 500 });
    arrow(ctx, 430, 330, 630, 330, C.dim, a * range(lt, 1, 1.5) * 0.6, 3);
    arrow(ctx, 950, 330, 1340, 330, C.dim, a * at('h4', 0.1, 0.5) * 0.6, 3);

    // ask goes out, the original comes back
    const out = range(lt, sp('h4', 0.5), sp('h4', 0.5) + 1.4), back = range(lt, sp('h4', 0.5) + 1.6, sp('h4', 0.5) + 3.2);
    if (out > 0 && back <= 0) glowDot(ctx, ...pathAt(PATH, out), 12, C.copper, a);
    if (back > 0 && back < 1) glowDot(ctx, ...pathAt([...PATH].reverse(), back), 12, GREEN, a);
    label(ctx, 'need the full row 41?', 600, 250, { size: 30, mono: true, color: C.copper, alpha: a * range(out, 0, 0.3) * (1 - range(back, 0, 0.3)), weight: 600 });
    label(ctx, 'original returned', 600, 410, { size: 30, mono: true, color: GREEN, alpha: a * range(back, 0.3, 0.7), weight: 600 });

    // ways to run it
    label(ctx, 'run it as', CX_MID, 560, { size: 28, mono: true, color: C.dim, alpha: a * at('h5', 0.1), weight: 500 });
    MODES.forEach((m, i) => chip(ctx, m, 190 + i * 560, 650, { color: i === 0 ? C.gold : C.electron, size: 38, w: 400, weight: 600, alpha: a * at('h5', 0.2 + i * 0.15) }));
    label(ctx, 'point Claude Code at it: same workflow', CX_MID, 780, { size: 40, weight: 700, color: C.gold, alpha: a * at('h5', 0.7) });
    caption(ctx, 'h4', a, lt, CS.h4);
    caption(ctx, 'h5', a, lt, CS.h5);
  };
}

const CX_MID = 960;
