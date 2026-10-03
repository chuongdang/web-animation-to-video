import { C, label, chapterTag, chapterAlpha, chip, arrow, panel, bar } from '/runtime/kit.js';

const { range, easeOut } = Scene;

const GREEN = '#7ee787';
const STEPS = ['1  add token column to schema', '2  new /api/usage endpoint', '3  usage chart on the dashboard', '4  tests for every step', '5  mobile layout for the chart'];

/** Chapter 3: graph + requirements -> plan -> user confirms -> refine -> approved; then the cost of fixing a plan vs code. */
export default function planning({ T, CS, sp, caption }) {
  return (ctx, t) => {
    const a = chapterAlpha(T, 'planning', t), lt = t - T.planning[0];
    chapterTag(ctx, '03', 'Plan before code', a);
    const at = (id, f, d = 0.7) => easeOut(range(lt, sp(id, f), sp(id, f) + d));
    const keep = 1 - range(lt, CS.pl3, CS.pl3 + 0.6), b = a * keep;

    // inputs -> claude -> plan
    chip(ctx, 'graphify MCP', 120, 300, { color: C.electron, size: 34, w: 330, alpha: b * easeOut(range(lt, 0.4, 1.1)) });
    chip(ctx, 'requirements', 120, 430, { color: C.copper, size: 34, w: 330, alpha: b * easeOut(range(lt, 0.6, 1.3)) });
    arrow(ctx, 460, 305, 555, 350, C.dim, b * range(lt, 1.0, 1.6));
    arrow(ctx, 460, 425, 555, 380, C.dim, b * range(lt, 1.2, 1.8));
    chip(ctx, 'Claude', 560, 365, { color: C.gold, size: 42, w: 200, weight: 700, alpha: b * range(lt, 1.0, 1.6) });
    arrow(ctx, 770, 365, 870, 365, C.gold, b * range(lt, sp('pl1', 0.3), sp('pl1', 0.3) + 0.6));

    panel(ctx, 880, 200, 900, 520, C.electron, b * at('pl1', 0.3), 0.04);
    label(ctx, 'execution plan', 920, 245, { size: 28, mono: true, color: C.dim, alpha: b * at('pl1', 0.3), align: 'left', weight: 600 });
    STEPS.forEach((s, i) => {
      const late = i === 4, k = late ? at('pl2', 0.6) : at('pl1', 0.45 + i * 0.12), flash = late ? 1 - range(lt, sp('pl2', 0.6) + 0.8, sp('pl2', 0.6) + 2) : 0;
      label(ctx, s, 930, 310 + i * 70 + (1 - k) * 16, { size: 34, mono: true, weight: 500, color: late ? C.gold : C.text, alpha: b * k, align: 'left' });
      if (late) {
        ctx.save(); ctx.globalAlpha = b * k * flash * 0.25; ctx.fillStyle = C.gold;
        ctx.beginPath(); ctx.roundRect(910, 310 + i * 70 - 30, 840, 60, 10); ctx.fill(); ctx.restore();
      }
    });

    // you confirm / refine / approve
    const uk = at('pl2', 0.3);
    label(ctx, 'you:', 120, 590, { size: 26, mono: true, color: C.dim, alpha: b * uk, align: 'left', weight: 600 });
    chip(ctx, 'also cover mobile', 120, 650, { color: C.copper, size: 32, w: 430, alpha: b * uk });
    arrow(ctx, 340, 610, 620, 410, C.copper, b * uk * 0.9, 3);
    label(ctx, 'refine', 400, 520, { size: 24, mono: true, color: C.copper, alpha: b * uk, weight: 600 });
    label(ctx, 'approved', 1740, 680, { size: 44, weight: 700, color: GREEN, alpha: b * at('pl2', 0.85), align: 'right' });

    // cost of a fix
    const c = (1 - keep) * a, w = easeOut(range(lt, CS.pl3 + 0.6, CS.pl3 + 1.6));
    bar(ctx, { x: 520, y: 430, w: 40 * w, color: C.electron, alpha: c, name: 'fix the plan', value: '~0.3k tokens' });
    bar(ctx, { x: 520, y: 560, w: 820 * w, color: C.proton, alpha: c, name: 'fix the code', value: '~25k tokens' });
    caption(ctx, 'pl1', a, lt, CS.pl1);
    caption(ctx, 'pl2', a, lt, CS.pl2);
    caption(ctx, 'pl3', a, lt, CS.pl3);
  };
}
