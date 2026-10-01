import { C, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, chip, token, treeNode, arrow, cycle } from '/runtime/kit.js';

const { clamp, lerp, range, easeOut, easeInOut, fadeWindow, rng } = Scene;

const GREEN = '#7ee787';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- software-engineering/scrum/why-scrum`.
const TXT = {
  p1: 'The traditional way: [[plan everything up front]], then build, test and deliver.',
  p2: 'Months pass before anyone sees [[working software]].',
  p3: 'Meanwhile [[requirements change:proton]], and the customer only reacts at the very end.',
  p4: 'The later we find a mistake, the [[more it costs:proton]] to fix.',
  p5: 'And software work is [[complex]]: we cannot predict everything in advance.',
  s1: 'Scrum replaces one big bet with [[many small ones:green]].',
  s2: '[[Build]] a little, [[show]] it, [[learn]], and [[adjust:green]].',
};
const nar = await narration('software-engineering/scrum/why-scrum', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { waterfall: ['p1', 'p2', 'p3'], cost: ['p4', 'p5'], small: ['s1', 's2'] });
const { CS, T } = P;
const sp = speech(nar, CS);

// ---- chapter 1: the stages of a plan-first project ---------------------------------
const STAGES = ['Requirements', 'Design', 'Build', 'Test', 'Release'];
const sxs = (i) => 240 + i * 360;

// ---- chapter 2: cost curve and the plan vs reality paths ------------------------------
const PX = 200, PY = 250, PW = 760, PH = 480;
const costY = (u) => PY + PH - PH * (Math.exp(3.2 * u) - 1) / (Math.exp(3.2) - 1);
const S0 = [1100, 700], G0 = [1760, 300];
const nrm = (() => { const dx = G0[0] - S0[0], dy = G0[1] - S0[1], l = Math.hypot(dx, dy); return [-dy / l, dx / l]; })();
const real = (u) => {
  const off = (95 * Math.sin(u * 7) + 55 * Math.sin(u * 13 + 1)) * Math.sqrt(Math.sin(Math.PI * u));
  return [lerp(S0[0], G0[0], u) + nrm[0] * off, lerp(S0[1], G0[1], u) + nrm[1] * off];
};

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      STAGES.forEach((n, i) => treeNode(ctx, n, sxs(i), 190, C.dim, a * 0.35 * range(t, 0.6 + i * 0.2, 1.2 + i * 0.2), { w: 300, size: 30 }));
      titleCard(ctx, t, T, { l1: 'Why do we', l2: 'need Scrum?', sub: 'from big plans to small steps', tint: GREEN });
    },

    waterfall(ctx, t) {
      const a = chapterAlpha(T, 'waterfall', t), lt = t - T.waterfall[0];
      chapterTag(ctx, '01', 'The big-plan problem', a);
      const changeAt = sp('p3', 0.25), fix = range(lt, changeAt, changeAt + 0.6);
      STAGES.forEach((n, i) => {
        const k = easeOut(range(lt, sp('p1', 0.05 + i * 0.17), sp('p1', 0.05 + i * 0.17) + 0.6));
        const col = i === 4 ? GREEN : i === 0 && fix > 0 ? C.proton : C.electron;
        treeNode(ctx, n, sxs(i), 300, col, a * k, { w: 300, size: 30 });
        if (i) arrow(ctx, sxs(i - 1) + 158, 300, sxs(i) - 158, 300, C.dim, a * k, 3);
      });
      // timeline: months pass with nothing shown
      const k2 = easeInOut(range(lt, CS.p2 + 0.4, sp('p2', 0.95)));
      const x0 = 240, x1 = 1680;
      ctx.save(); ctx.globalAlpha = a * range(lt, CS.p2, CS.p2 + 0.5); ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath(); ctx.roundRect(x0, 500, x1 - x0, 24, 12); ctx.fill();
      ctx.fillStyle = C.gold; ctx.beginPath(); ctx.roundRect(x0, 500, Math.max(0.01, (x1 - x0) * k2), 24, 12); ctx.fill(); ctx.restore();
      label(ctx, 'month 1', x0, 560, { size: 26, mono: true, color: C.dim, alpha: a * range(lt, CS.p2, CS.p2 + 0.5), align: 'left', weight: 500 });
      label(ctx, 'month 9', x1, 560, { size: 26, mono: true, color: C.dim, alpha: a * range(lt, CS.p2, CS.p2 + 0.5), align: 'right', weight: 500 });
      if (k2 > 0) glowDot(ctx, lerp(x0, x1, k2), 512, 16, C.gold, a);
      label(ctx, `working software shown: ${k2 >= 1 ? '1st time' : '0'}`, CX, 640, { size: 34, mono: true, color: k2 >= 1 ? GREEN : C.gold, alpha: a * range(lt, CS.p2 + 0.3, CS.p2 + 0.9), weight: 600 });
      // requirements change, customer reacts
      if (fix > 0) {
        const pulse = 0.75 + 0.25 * Math.sin(lt * 7);
        token(ctx, 'requirements changed!', sxs(0), 190, C.proton, a * fix * pulse, 28);
        ctx.save(); ctx.globalAlpha = a * fix * 0.8; ctx.strokeStyle = C.proton; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.moveTo(sxs(0), 222); ctx.lineTo(sxs(0), 258); ctx.stroke(); ctx.restore();
      }
      const bk = easeOut(range(lt, sp('p3', 0.7), sp('p3', 0.7) + 0.7));
      chip(ctx, '"This is not what I needed."', 1020, 770, { color: C.proton, size: 40, alpha: a * bk, w: 700 });
      caption(ctx, 'p1', a, lt, CS.p1);
      caption(ctx, 'p2', a, lt, CS.p2);
      caption(ctx, 'p3', a, lt, CS.p3);
    },

    cost(ctx, t) {
      const a = chapterAlpha(T, 'cost', t), lt = t - T.cost[0];
      chapterTag(ctx, '02', 'Why the plan fails', a);
      const dimCurve = 1 - 0.55 * range(lt, CS.p5, CS.p5 + 0.6);
      ctx.save(); ctx.globalAlpha = a * dimCurve; ctx.strokeStyle = C.dim; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(PX, PY + PH); ctx.lineTo(PX + PW, PY + PH); ctx.moveTo(PX, PY + PH); ctx.lineTo(PX, PY - 20); ctx.stroke(); ctx.restore();
      label(ctx, 'cost of a change', PX, PY - 50, { size: 26, mono: true, color: C.dim, alpha: a * dimCurve, align: 'left', weight: 500 });
      ['idea', 'design', 'build', 'test', 'live'].forEach((n, i) => label(ctx, n, PX + (i + 0.5) * (PW / 5), PY + PH + 40, { size: 24, mono: true, color: C.dim, alpha: a * dimCurve, weight: 500 }));
      const dk = easeInOut(range(lt, 0.5, sp('p4', 0.95)));
      ctx.save(); ctx.globalAlpha = a * dimCurve; ctx.strokeStyle = C.proton; ctx.lineWidth = 7; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i <= Math.floor(100 * dk); i++) { const u = i / 100; i ? ctx.lineTo(PX + u * PW, costY(u)) : ctx.moveTo(PX, costY(0)); }
      ctx.stroke(); ctx.restore();
      if (dk > 0) glowDot(ctx, PX + dk * PW, costY(dk), 14, C.proton, a * dimCurve);
      // plan vs reality
      const k = range(lt, CS.p5 + 0.2, CS.p5 + 0.8);
      if (k > 0) {
        ctx.save(); ctx.globalAlpha = a * k * 0.9; ctx.strokeStyle = C.gold; ctx.lineWidth = 4; ctx.setLineDash([14, 10]);
        ctx.beginPath(); ctx.moveTo(...S0); ctx.lineTo(...G0); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
        glowDot(ctx, ...S0, 12, C.text, a * k);
        glowDot(ctx, ...G0, 16, GREEN, a * k);
        label(ctx, 'the plan', 1360, 560, { size: 28, mono: true, color: C.gold, alpha: a * k, weight: 700 });
        const pk = easeInOut(range(lt, CS.p5 + 0.7, sp('p5', 0.95)));
        ctx.save(); ctx.globalAlpha = a * k; ctx.strokeStyle = C.proton; ctx.lineWidth = 6; ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i <= Math.floor(120 * pk); i++) { const p = real(i / 120); i ? ctx.lineTo(...p) : ctx.moveTo(...p); }
        ctx.stroke(); ctx.restore();
        if (pk > 0) glowDot(ctx, ...real(pk), 11, C.proton, a);
        [0.25, 0.5, 0.75].forEach((u, i) => {
          const sk = range(pk, u, u + 0.05);
          if (sk <= 0) return;
          const [x, y] = real(u);
          token(ctx, '!', x + nrm[0] * 40, y + nrm[1] * 40, C.proton, a * sk, 26);
        });
        label(ctx, 'reality', 1130, 360, { size: 28, mono: true, color: C.proton, alpha: a * range(pk, 0.5, 0.8), weight: 700 });
      }
      caption(ctx, 'p4', a, lt, CS.p4);
      caption(ctx, 'p5', a, lt, CS.p5);
    },

    small(ctx, t) {
      const a = chapterAlpha(T, 'small', t), lt = t - T.small[0];
      chapterTag(ctx, '03', 'The Scrum answer', a);
      const x0 = 240, w = 1440, h = 70, y = 300;
      const split = easeInOut(range(lt, sp('s1', 0.35), sp('s1', 0.35) + 1.2));
      label(ctx, 'one big bet', CX, y - 70, { size: 30, mono: true, color: C.proton, alpha: a * (1 - split), weight: 600 });
      label(ctx, 'many small bets', CX, y - 70, { size: 30, mono: true, color: GREEN, alpha: a * split, weight: 600 });
      ctx.save(); ctx.globalAlpha = a * (1 - split) * easeOut(range(lt, 0.2, 0.9)); ctx.fillStyle = C.proton;
      ctx.beginPath(); ctx.roundRect(x0, y - h / 2, w, h, 12); ctx.fill(); ctx.restore();
      const n = 8, gap = split * 22, bw = (w - (n - 1) * gap) / n;
      for (let i = 0; i < n; i++) {
        const bx = x0 + i * (bw + gap);
        ctx.save(); ctx.globalAlpha = a * split; ctx.fillStyle = GREEN; ctx.beginPath(); ctx.roundRect(bx, y - h / 2, bw, h, 10); ctx.fill(); ctx.restore();
        label(ctx, '✓', bx + bw / 2, y, { size: 38, color: C.bg, alpha: a * easeOut(range(lt, sp('s1', 0.7) + i * 0.12, sp('s1', 0.7) + i * 0.12 + 0.4)), weight: 700 });
      }
      const reveal = [0.05, 0.3, 0.55, 0.78].reduce((s, f) => s + easeOut(range(lt, sp('s2', f), sp('s2', f) + 0.5)), 0);
      const items = [{ text: 'Build', color: C.electron }, { text: 'Show', color: C.gold }, { text: 'Learn', color: GREEN }, { text: 'Adjust', color: C.copper }];
      const done = range(lt, sp('s2', 0.9), sp('s2', 0.9) + 0.5);
      cycle(ctx, CX, 640, 420, 150, items, { alpha: a * range(lt, CS.s2 - 0.2, CS.s2 + 0.4), reveal, size: 34 });
      if (done > 0) {
        const ang = -Math.PI / 2 + (lt - sp('s2', 0.9)) * 1.3;
        glowDot(ctx, CX + Math.cos(ang) * 420, 640 + Math.sin(ang) * 150, 11, C.text, a * done);
      }
      caption(ctx, 's1', a, lt, CS.s1);
      caption(ctx, 's2', a, lt, CS.s2);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 3;
      label(ctx, 'Plan a little.', CX, CY - 60, { size: 100, weight: 700, color: C.gold, alpha: a * range(lt, 0.5, 1.3) });
      label(ctx, 'Learn a lot.', CX, CY + 70, { size: 100, weight: 700, color: GREEN, alpha: a * range(lt, 0.5 + s * 0.5, 1.3 + s * 0.5) });
    },
  },
});
