import { C, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, chip, token, panel, pathAt } from '/runtime/kit.js';

const { clamp, lerp, range, easeOut, easeInOut, fadeWindow } = Scene;

const GREEN = '#7ee787';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- software-engineering/scrum/why-sprints`.
const TXT = {
  t1: 'A sprint is a fixed [[timebox]] of [[one month or less]].',
  t2: 'Each sprint ends with a usable [[increment]] of the product.',
  f1: 'Short cycles bring [[feedback]] in weeks, not months.',
  f2: 'Small batches mean [[smaller mistakes:green]] and [[less risk:green]].',
  g1: 'During a sprint the [[goal stays fixed:electron]], so the team can focus without constant change.',
  g2: 'New ideas are not lost. They wait in the [[backlog]] for a later sprint.',
};
const nar = await narration('software-engineering/scrum/why-sprints', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { box: ['t1', 't2'], feedback: ['f1', 'f2'], focus: ['g1', 'g2'] });
const { CS, T } = P;
const sp = speech(nar, CS);

const X0 = 240, X1 = 1680;

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      for (let i = 0; i < 6; i++) {
        ctx.save(); ctx.globalAlpha = a * 0.3 * range(t, 0.5 + i * 0.15, 1.1 + i * 0.15); ctx.strokeStyle = GREEN; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(300 + i * 230, 150, 200, 60, 12); ctx.stroke(); ctx.restore();
      }
      titleCard(ctx, t, T, { l1: 'Why short', l2: 'sprints?', sub: 'timeboxes that create feedback', tint: GREEN });
    },

    box(ctx, t) {
      const a = chapterAlpha(T, 'box', t), lt = t - T.box[0];
      chapterTag(ctx, '01', 'The sprint timebox', a);
      const n = 5, gap = 16, bw = (X1 - X0 - (n - 1) * gap) / n;
      for (let i = 0; i < n; i++) {
        const k = easeOut(range(lt, sp('t1', 0.05 + i * 0.12), sp('t1', 0.05 + i * 0.12) + 0.6)), bx = X0 + i * (bw + gap);
        panel(ctx, bx, 240, bw, 90, C.electron, a * k, 0.08, 14);
        label(ctx, `Sprint ${i + 1}`, bx + bw / 2, 285, { size: 30, mono: true, weight: 600, alpha: a * k });
        // increment: the product grows by one layer per sprint
        const ik = easeOut(range(lt, sp('t2', 0.15 + i * 0.14), sp('t2', 0.15 + i * 0.14) + 0.6));
        for (let j = 0; j <= i; j++) {
          const top = 760 - (j + 1) * 78;
          ctx.save(); ctx.globalAlpha = a * ik * (j === i ? 1 : 0.55); ctx.fillStyle = GREEN; ctx.beginPath(); ctx.roundRect(bx + 24, top, bw - 48, 66, 10); ctx.fill(); ctx.restore();
        }
        if (ik > 0) label(ctx, 'working product', bx + bw / 2, 810, { size: 22, mono: true, color: GREEN, alpha: a * ik, weight: 500 });
      }
      // brace: one month or less
      const bk = easeOut(range(lt, sp('t1', 0.7), sp('t1', 0.7) + 0.7)), bx1 = X0 + bw;
      ctx.save(); ctx.globalAlpha = a * bk; ctx.strokeStyle = C.gold; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(X0, 360); ctx.lineTo(X0, 376); ctx.lineTo(bx1, 376); ctx.lineTo(bx1, 360); ctx.stroke(); ctx.restore();
      label(ctx, '1–4 weeks, always the same length', (X0 + bx1) / 2 + 150, 410, { size: 26, mono: true, color: C.gold, alpha: a * bk, weight: 600 });
      caption(ctx, 't1', a, lt, CS.t1);
      caption(ctx, 't2', a, lt, CS.t2);
    },

    feedback(ctx, t) {
      const a = chapterAlpha(T, 'feedback', t), lt = t - T.feedback[0];
      chapterTag(ctx, '02', 'Feedback and risk', a);
      const rows = [{ y: 330, name: 'one big release', col: C.proton, n: 1 }, { y: 600, name: 'sprints', col: GREEN, n: 12 }];
      rows.forEach((r, ri) => {
        const k = easeOut(range(lt, 0.2 + ri * 0.4, 0.9 + ri * 0.4));
        label(ctx, r.name, X0, r.y - 70, { size: 30, mono: true, color: r.col, alpha: a * k, align: 'left', weight: 700 });
        ctx.save(); ctx.globalAlpha = a * k * 0.9; ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.roundRect(X0, r.y - 12, X1 - X0, 24, 12); ctx.fill(); ctx.restore();
        for (let i = 1; i <= r.n; i++) {
          const x = X0 + ((X1 - X0) * i) / r.n;
          const fk = range(lt, sp('f1', 0.1 + (i / r.n) * 0.75 - 0.05), sp('f1', 0.1 + (i / r.n) * 0.75 + 0.1));
          if (fk > 0) { glowDot(ctx, x, r.y, 12 + 14 * (1 - fk), r.col, a * fk); if (i === r.n || i % 3 === 0) label(ctx, 'feedback', x, r.y + 44, { size: 20, mono: true, color: r.col, alpha: a * fk * 0.9, weight: 500 }); }
        }
      });
      label(ctx, 'month 1', X0, 690 + 90, { size: 22, mono: true, color: C.dim, alpha: a, align: 'left', weight: 500 });
      label(ctx, 'month 9', X1, 690 + 90, { size: 22, mono: true, color: C.dim, alpha: a, align: 'right', weight: 500 });
      // risk brackets: how much work waits for the first feedback
      const rk = easeOut(range(lt, sp('f2', 0.0), sp('f2', 0.0) + 0.9)), r2 = easeOut(range(lt, sp('f2', 0.45), sp('f2', 0.45) + 0.9));
      ctx.save(); ctx.globalAlpha = a * rk; ctx.strokeStyle = C.proton; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(X0, 440); ctx.lineTo(lerp(X0, X1, rk), 440); ctx.stroke(); ctx.restore();
      label(ctx, 'everything built is at risk', CX, 485, { size: 28, mono: true, color: C.proton, alpha: a * rk, weight: 700 });
      const w1 = (X1 - X0) / 12;
      ctx.save(); ctx.globalAlpha = a * r2; ctx.strokeStyle = GREEN; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(X0, 710); ctx.lineTo(lerp(X0, X0 + w1, r2), 710); ctx.stroke(); ctx.restore();
      label(ctx, 'only one sprint at risk', X0 + w1 + 24, 710, { size: 28, mono: true, color: GREEN, alpha: a * r2, align: 'left', weight: 700 });
      caption(ctx, 'f1', a, lt, CS.f1);
      caption(ctx, 'f2', a, lt, CS.f2);
    },

    focus(ctx, t) {
      const a = chapterAlpha(T, 'focus', t), lt = t - T.focus[0];
      chapterTag(ctx, '03', 'Protected focus', a);
      // sprint box with a fixed goal
      const bx = 380, by = 330, bw = 700, bh = 400;
      const pk = easeOut(range(lt, 0.2, 0.9));
      panel(ctx, bx, by, bw, bh, C.electron, a * pk, 0.06, 26);
      label(ctx, 'SPRINT', bx + 36, by + 40, { size: 24, mono: true, color: C.dim, alpha: a * pk, align: 'left', weight: 600 });
      chip(ctx, 'Sprint goal', bx + bw / 2 - 170, by + 120, { color: C.electron, size: 40, alpha: a * range(lt, sp('g1', 0.2), sp('g1', 0.2) + 0.7), w: 340, weight: 700 });
      ['task', 'task', 'task'].forEach((n, i) => {
        const k = easeOut(range(lt, sp('g1', 0.45 + i * 0.1), sp('g1', 0.45 + i * 0.1) + 0.6)), done = range(lt, sp('g1', 0.9) + i * 0.5, sp('g1', 0.9) + i * 0.5 + 0.4);
        chip(ctx, n, bx + 70 + i * 200, by + 260, { color: done > 0 ? GREEN : C.dim, size: 30, alpha: a * k, w: 170, family: undefined });
        label(ctx, '✓', bx + 70 + i * 200 + 85, by + 330, { size: 34, color: GREEN, alpha: a * done, weight: 700 });
      });
      // backlog
      const kb = easeOut(range(lt, sp('g2', 0.3), sp('g2', 0.3) + 0.8)), blx = 1380, bly = 330, blw = 340;
      panel(ctx, blx, bly, blw, bh, C.gold, a * kb, 0.06, 26);
      label(ctx, 'BACKLOG', blx + 36, bly + 40, { size: 24, mono: true, color: C.gold, alpha: a * kb, align: 'left', weight: 600 });
      // ideas bounce off the sprint boundary and land in the backlog
      for (let i = 0; i < 3; i++) {
        const sx = bx + 160 + i * 190, route = [[sx, 130], [sx, by - 10], [1230, 250], [blx + blw / 2, by + 110 + i * 90]];
        const start = sp('g2', 0.05 + i * 0.22), u = easeInOut(range(lt, start, start + 1.8));
        if (u <= 0) continue;
        const [x, y] = pathAt(route, u);
        token(ctx, 'new idea', x, y, C.copper, a * (u < 1 ? 1 : 0.9), 24);
        const hit = range(u, 0.28, 0.4) * (1 - range(u, 0.4, 0.55));
        if (hit > 0) { ctx.save(); ctx.globalAlpha = a * hit; ctx.strokeStyle = C.electron; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(sx - 70, by); ctx.lineTo(sx + 70, by); ctx.stroke(); ctx.restore(); }
      }
      caption(ctx, 'g1', a, lt, CS.g1);
      caption(ctx, 'g2', a, lt, CS.g2);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 3;
      label(ctx, 'Short cycles.', CX, CY - 60, { size: 100, weight: 700, color: C.electron, alpha: a * range(lt, 0.5, 1.3) });
      label(ctx, 'Fast learning.', CX, CY + 70, { size: 100, weight: 700, color: GREEN, alpha: a * range(lt, 0.5 + s * 0.5, 1.3 + s * 0.5) });
    },
  },
});
