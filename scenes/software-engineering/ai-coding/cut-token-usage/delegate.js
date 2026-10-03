import { C, label, chapterTag, chapterAlpha, chip, arrow, panel, glowDot, token } from '/runtime/kit.js';

const { range, easeOut, lerp } = Scene;

const GREEN = '#7ee787';
const SUBS = [
  { name: 'subagent A', job: 'database schema', color: C.electron, x: 380 },
  { name: 'subagent B', job: 'usage API', color: C.gold, x: 960 },
  { name: 'subagent C', job: 'dashboard UI', color: GREEN, x: 1540 },
];
const MAIN = { x: 960, y: 280 };

/** Chapter 4: the main agent hands each step to a subagent with its own small context. */
export default function delegate({ T, CS, sp, caption }) {
  return (ctx, t) => {
    const a = chapterAlpha(T, 'delegate', t), lt = t - T.delegate[0];
    chapterTag(ctx, '04', 'Delegate to subagents', a);
    chip(ctx, 'main agent', MAIN.x - 150, MAIN.y, { color: C.copper, size: 42, w: 300, weight: 700, alpha: a * easeOut(range(lt, 0.3, 1)) });

    SUBS.forEach((s, i) => {
      const pk = easeOut(range(lt, 0.6 + i * 0.2, 1.3 + i * 0.2)), go = sp('d1', 0.35 + i * 0.15), run = range(lt, go, go + 1.0);
      const back = sp('d2', 0.6 + i * 0.1), bk = range(lt, back, back + 1.0);
      const ctxk = easeOut(range(lt, sp('d2', 0.15), sp('d2', 0.15) + 1.2));
      panel(ctx, s.x - 240, 480, 480, 300, s.color, a * pk, 0.05);
      label(ctx, s.name, s.x, 535, { size: 38, weight: 700, color: s.color, alpha: a * pk });
      label(ctx, s.job, s.x, 590, { size: 28, mono: true, alpha: a * pk, weight: 500 });

      // its own context meter: small and clean
      label(ctx, 'context', s.x - 210, 660, { size: 22, mono: true, color: C.dim, alpha: a * pk, align: 'left', weight: 500 });
      ctx.save(); ctx.globalAlpha = a * pk; ctx.strokeStyle = C.dim; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(s.x - 210, 685, 420, 28, 8); ctx.stroke();
      ctx.fillStyle = s.color; ctx.beginPath(); ctx.roundRect(s.x - 210, 685, 420 * 0.1 * ctxk, 28, 8); ctx.fill(); ctx.restore();
      label(ctx, '~8k tokens', s.x + 210, 740, { size: 24, mono: true, color: s.color, alpha: a * pk * ctxk, align: 'right', weight: 600 });

      // task goes down, summary comes back
      const [x0, y0, x1, y1] = [MAIN.x - 40, MAIN.y + 50, s.x - 40, 470];
      arrow(ctx, x0, y0, lerp(x0, x1, run), lerp(y0, y1, run), C.dim, a * run * 0.8, 3);
      if (run > 0 && run < 1) glowDot(ctx, lerp(x0, x1, run), lerp(y0, y1, run), 10, s.color, a);
      if (bk > 0) {
        const [bx0, by0, bx1, by1] = [s.x + 40, 470, MAIN.x + 40, MAIN.y + 50];
        arrow(ctx, bx0, by0, lerp(bx0, bx1, bk), lerp(by0, by1, bk), GREEN, a * 0.8, 3);
        token(ctx, 'summary', lerp(bx0, bx1, 0.5), lerp(by0, by1, 0.5) + (i - 1) * 4, GREEN, a * range(bk, 0.4, 0.8), 22);
      }
    });
    label(ctx, 'main context stays small', CX_MAIN, 860, { size: 40, weight: 700, color: GREEN, alpha: a * range(lt, sp('d2', 0.85), sp('d2', 0.85) + 0.8) });
    caption(ctx, 'd1', a, lt, CS.d1);
    caption(ctx, 'd2', a, lt, CS.d2);
  };
}

const CX_MAIN = 960;
