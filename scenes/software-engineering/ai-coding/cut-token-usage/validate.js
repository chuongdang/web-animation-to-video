import { C, label, chapterTag, chapterAlpha, chip, arrow } from '/runtime/kit.js';

const { range, easeOut } = Scene;

const GREEN = '#7ee787';
const ROWS = [
  { text: 'tests pass', at: ['v1', 0.35] },
  { text: 'types and lint clean', at: ['v1', 0.6] },
  { text: 'matches requirements', at: ['v1', 0.9], failFirst: true, fixAt: ['v2', 0.75] },
];

function mark(ctx, x, y, ok, color, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  if (ok) { ctx.moveTo(x - 20, y); ctx.lineTo(x - 6, y + 16); ctx.lineTo(x + 22, y - 16); }
  else { ctx.moveTo(x - 16, y - 16); ctx.lineTo(x + 16, y + 16); ctx.moveTo(x + 16, y - 16); ctx.lineTo(x - 16, y + 16); }
  ctx.stroke(); ctx.restore();
}

/** Chapter 5: validate against tests and requirements; a miss goes back to a subagent. */
export default function validate({ T, CS, sp, caption }) {
  return (ctx, t) => {
    const a = chapterAlpha(T, 'validate', t), lt = t - T.validate[0];
    chapterTag(ctx, '05', 'Validate at the end', a);
    label(ctx, 'checks', 220, 235, { size: 28, mono: true, color: C.dim, alpha: a * range(lt, 0.3, 1), align: 'left', weight: 600 });
    ROWS.forEach((r, i) => {
      const y = 340 + i * 130, pk = easeOut(range(lt, 0.4 + i * 0.2, 1.1 + i * 0.2));
      const done = range(lt, sp(...r.at), sp(...r.at) + 0.5), fixed = r.fixAt ? range(lt, sp(...r.fixAt), sp(...r.fixAt) + 0.5) : 0;
      const bad = r.failFirst && fixed < 1;
      const col = done <= 0 ? C.dim : bad ? C.proton : GREEN;
      chip(ctx, r.text, 220, y, { color: col, size: 36, w: 780, alpha: a * pk });
      if (done > 0) mark(ctx, 1065, y, !bad, col, a * (bad ? done : Math.max(done, fixed)) * (r.failFirst && fixed > 0 && fixed < 1 ? fixed : 1));
    });

    // the miss goes back to a subagent
    const fy = 340 + 2 * 130, back = range(lt, sp('v2', 0.2), sp('v2', 0.2) + 0.7);
    chip(ctx, 'subagent C', 1280, fy, { color: GREEN, size: 36, w: 330, weight: 700, alpha: a * back });
    arrow(ctx, 1120, fy, 1100 + 160 * back, fy, C.proton, a * back, 4);
    label(ctx, 'fix', 1190, fy - 40, { size: 26, mono: true, color: C.proton, alpha: a * back, weight: 600 });
    caption(ctx, 'v1', a, lt, CS.v1);
    caption(ctx, 'v2', a, lt, CS.v2);
  };
}
