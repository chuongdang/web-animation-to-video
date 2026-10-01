import { C, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, token, chip, measure } from '/runtime/kit.js';

const { clamp, lerp, range, easeInOut, easeOut, fadeWindow, rng } = Scene;

const GREEN = '#7ee787';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- computer-science/overfitting`.
const TXT = {
  o1: 'A model tries to fit a [[curve]] through the [[training points]].',
  o2: 'Too simple [[underfits:electron]]. Too flexible [[overfits:proton]], chasing every wiggle of [[noise]].',
  o3: 'The real test is [[new data]] the model has not seen.',
  o4: 'The overfit curve is perfect on the training set but [[fails on test data:proton]].',
  o5: 'As complexity grows, training error keeps falling, but test error [[turns upward:proton]].',
  o6: 'Fixes: more [[data]], simpler models, [[regularisation]] and [[early stopping]].',
};
const nar = await narration('computer-science/how-ai-works/overfitting', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { fit: ['o1', 'o2'], test: ['o3', 'o4'], curve: ['o5', 'o6'] });
const { CS, T } = P;
const sp = speech(nar, CS);

// ---- data and models ------------------------------------------------------------
const truth = (x) => 0.5 + 0.34 * Math.sin(2 * Math.PI * (x * 0.85 + 0.05));
function solve(A, b) {
  const n = b.length;
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]];
    for (let r = i + 1; r < n; r++) { const f = A[r][i] / A[i][i]; for (let c = i; c < n; c++) A[r][c] -= f * A[i][c]; b[r] -= f * b[i]; }
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = b[i]; for (let c = i + 1; c < n; c++) s -= A[i][c] * x[c]; x[i] = s / A[i][i]; }
  return x;
}
const polyfit = (xs, ys, deg) => {
  const A = Array.from({ length: deg + 1 }, (_, i) => Array.from({ length: deg + 1 }, (_, j) => xs.reduce((s, x) => s + x ** (i + j), 0)));
  const b = Array.from({ length: deg + 1 }, (_, i) => xs.reduce((s, x, k) => s + ys[k] * x ** i, 0));
  const c = solve(A, b);
  return (x) => c.reduce((s, ci, i) => s + ci * x ** i, 0);
};
const lagrange = (xs, ys) => (x) => xs.reduce((s, xi, i) => s + ys[i] * xs.reduce((p, xj, j) => (j === i ? p : p * (x - xj) / (xi - xj)), 1), 0);

const rand = rng(21);
const TRAIN_X = Array.from({ length: 10 }, (_, i) => (i + 0.2 + rand() * 0.6) / 10);
const TRAIN_Y = TRAIN_X.map((x) => truth(x) + (rand() - 0.5) * 0.3);
const TEST_X = Array.from({ length: 8 }, (_, i) => (i + 0.1 + rand() * 0.8) / 8);
const TEST_Y = TEST_X.map((x) => truth(x) + (rand() - 0.5) * 0.3);
const MODELS = [
  { name: 'underfit', sub: 'too simple', f: polyfit(TRAIN_X, TRAIN_Y, 1), color: C.electron },
  { name: 'good fit', sub: 'just right', f: polyfit(TRAIN_X, TRAIN_Y, 3), color: GREEN },
  { name: 'overfit', sub: 'too flexible', f: lagrange(TRAIN_X, TRAIN_Y), color: C.proton },
];
const mse = (f, xs, ys) => xs.reduce((s, x, i) => s + (f(x) - ys[i]) ** 2, 0) / xs.length;
MODELS.forEach((m) => { m.train = mse(m.f, TRAIN_X, TRAIN_Y); m.test = mse(m.f, TEST_X, TEST_Y); });

// plot geometry
const PX = 240, PY = 250, PW = 1000, PH = 520;
const sx = (x) => PX + x * PW;
const sy = (y) => PY + PH - ((y + 0.1) / 1.3) * PH;

function axes(ctx, a) {
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = C.dim; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(PX, PY + PH); ctx.lineTo(PX + PW, PY + PH); ctx.moveTo(PX, PY + PH); ctx.lineTo(PX, PY); ctx.stroke(); ctx.restore();
}
function curve(ctx, m, a, draw = 1, width = 6) {
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = m.color; ctx.lineWidth = width; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.rect(PX, PY - 10, PW, PH + 10); ctx.clip();
  ctx.beginPath();
  const n = Math.floor(240 * draw);
  for (let i = 0; i <= n; i++) { const x = i / 240; i ? ctx.lineTo(sx(x), sy(m.f(x))) : ctx.moveTo(sx(x), sy(m.f(x))); }
  ctx.stroke(); ctx.restore();
}
function points(ctx, xs, ys, a, kind, k = 1) {
  xs.forEach((x, i) => {
    const kk = clamp(k * xs.length - i, 0, 1);
    if (kk <= 0) return;
    if (kind === 'train') glowDot(ctx, sx(x), sy(ys[i]), 9 * kk, C.text, a * kk);
    else {
      ctx.save(); ctx.globalAlpha = a * kk; ctx.strokeStyle = C.gold; ctx.lineWidth = 4;
      ctx.strokeRect(sx(x) - 8 * kk, sy(ys[i]) - 8 * kk, 16 * kk, 16 * kk); ctx.restore();
    }
  });
}

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      ctx.save(); ctx.translate(0, 120); axes(ctx, 0);
      points(ctx, TRAIN_X, TRAIN_Y, a * 0.25, 'train', range(t, 0.3, 1.5));
      curve(ctx, MODELS[2], a * 0.22 * range(t, 1, 1.4), range(t, 1, 3));
      ctx.restore();
      titleCard(ctx, t, T, { l1: 'What is', l2: 'overfitting?', sub: 'learning the pattern, not the noise', tint: C.proton, size: 112 });
    },

    fit(ctx, t) {
      const a = chapterAlpha(T, 'fit', t), lt = t - T.fit[0];
      chapterTag(ctx, '01', 'Fitting a curve', a);
      axes(ctx, a);
      points(ctx, TRAIN_X, TRAIN_Y, a, 'train', easeOut(range(lt, 0.4, 1.8)));
      label(ctx, 'training data', PX + PW / 2, PY - 20, { size: 26, mono: true, color: C.text, alpha: a * range(lt, 1.2, 1.9), weight: 600 });
      MODELS.forEach((m, i) => {
        const at = sp('o2', 0.05 + i * 0.25);
        const k = range(lt, at, at + 1.6);
        curve(ctx, m, a * range(lt, at, at + 0.3), easeInOut(k));
        const ck = range(lt, at + 0.6, at + 1.3);
        chip(ctx, m.name, 1330, 350 + i * 140, { color: m.color, size: 36, alpha: a * ck, w: 300, weight: 700 });
        label(ctx, m.sub, 1480, 350 + i * 140 + 62, { size: 24, mono: true, color: m.color, alpha: a * ck, weight: 500 });
      });
      caption(ctx, 'o1', a, lt, CS.o1);
      caption(ctx, 'o2', a, lt, CS.o2);
    },

    test(ctx, t) {
      const a = chapterAlpha(T, 'test', t), lt = t - T.test[0];
      chapterTag(ctx, '02', 'Testing on new data', a);
      axes(ctx, a);
      points(ctx, TRAIN_X, TRAIN_Y, a * 0.6, 'train');
      const tk = easeOut(range(lt, 0.5, 1.8));
      points(ctx, TEST_X, TEST_Y, a, 'test', tk);
      label(ctx, 'new test data', PX + PW / 2, PY - 20, { size: 26, mono: true, color: C.gold, alpha: a * range(lt, 1, 1.7), weight: 600 });
      // focus: good fit during o3, overfit during o4
      const toOver = easeInOut(range(lt, CS.o4 - 0.2, CS.o4 + 0.6));
      MODELS.forEach((m, i) => {
        const focus = i === 1 ? 1 - toOver : i === 2 ? toOver : 0.12;
        curve(ctx, m, a * (0.12 + 0.88 * focus) * range(lt, 0.2, 0.8), 1, 3 + 4 * focus);
        if (focus > 0.5) {
          TEST_X.forEach((x, k) => {
            const ek = range(lt, 1.4 + k * 0.08, 2.0 + k * 0.08) * (i === 1 ? 1 : range(lt, CS.o4 + 0.4, CS.o4 + 1.4));
            ctx.save(); ctx.globalAlpha = a * ek * focus; ctx.strokeStyle = C.proton; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.rect(PX, PY - 10, PW, PH + 10); ctx.clip();
            ctx.beginPath(); ctx.moveTo(sx(x), sy(TEST_Y[k])); ctx.lineTo(sx(x), sy(m.f(x))); ctx.stroke(); ctx.restore();
          });
        }
      });
      // error table
      const rows = [[MODELS[0], sp('o3', 0.55)], [MODELS[1], sp('o3', 0.8)], [MODELS[2], sp('o4', 0.35)]];
      label(ctx, 'error', 1500, 300, { size: 24, mono: true, color: C.dim, alpha: a * range(lt, sp('o3', 0.5), sp('o3', 0.5) + 0.7), weight: 500 });
      label(ctx, 'train', 1420, 340, { size: 22, mono: true, color: C.electron, alpha: a * range(lt, sp('o3', 0.5), sp('o3', 0.5) + 0.7), weight: 600 });
      label(ctx, 'test', 1600, 340, { size: 22, mono: true, color: C.gold, alpha: a * range(lt, sp('o3', 0.5), sp('o3', 0.5) + 0.7), weight: 600 });
      rows.forEach(([m, at], i) => {
        const y = 420 + i * 120, k = easeOut(range(lt, at, at + 0.8));
        label(ctx, m.name, 1330, y - 26, { size: 26, mono: true, color: m.color, alpha: a * k, align: 'left', weight: 700 });
        [['train', 1420, C.electron], ['test', 1600, C.gold]].forEach(([key, x, col]) => {
          const v = m[key], w = Math.min(150, (v / 0.06) * 150) * k;
          ctx.save(); ctx.globalAlpha = a * k; ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x - 75, y + 4, Math.max(4, w), 30, 6); ctx.fill(); ctx.restore();
          label(ctx, v.toFixed(3), x, y + 56, { size: 22, mono: true, alpha: a * k, weight: 500 });
        });
      });
      caption(ctx, 'o3', a, lt, CS.o3);
      caption(ctx, 'o4', a, lt, CS.o4);
    },

    curve(ctx, t) {
      const a = chapterAlpha(T, 'curve', t), lt = t - T.curve[0];
      chapterTag(ctx, '03', 'Complexity vs error', a);
      const trainE = (c) => 0.55 * Math.exp(-0.5 * c) + 0.02;
      const testE = (c) => 0.55 * Math.exp(-0.5 * c) + 0.04 + 0.0032 * c * c;
      const gx = (c) => 280 + (c / 10) * 900, gy = (e) => 760 - (e / 0.55) * 460;
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = C.dim; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(280, 760); ctx.lineTo(1180, 760); ctx.moveTo(280, 760); ctx.lineTo(280, 260); ctx.stroke(); ctx.restore();
      label(ctx, 'model complexity →', 1180, 805, { size: 24, mono: true, color: C.dim, alpha: a, align: 'right', weight: 500 });
      label(ctx, 'error ↑', 280, 235, { size: 24, mono: true, color: C.dim, alpha: a, weight: 500 });
      const dk = easeInOut(range(lt, 0.5, sp('o5', 0.8)));
      [[trainE, C.electron, 'training error'], [testE, C.proton, 'test error']].forEach(([fn, col, name], i) => {
        ctx.save(); ctx.globalAlpha = a * range(lt, 0.4, 0.9); ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.lineJoin = 'round';
        ctx.beginPath(); const n = Math.floor(100 * dk);
        for (let k = 0; k <= n; k++) { const c = 0.4 + (k / 100) * 9.6; k ? ctx.lineTo(gx(c), gy(fn(c))) : ctx.moveTo(gx(c), gy(fn(c))); }
        ctx.stroke(); ctx.restore();
        label(ctx, name, 1210, i ? 470 : 690, { size: 26, mono: true, color: col, alpha: a * range(dk, 0.9, 1), align: 'left', weight: 600 });
      });
      const sk = range(lt, sp('o5', 0.6), sp('o5', 0.6) + 0.8);
      ctx.save(); ctx.globalAlpha = a * sk * 0.8; ctx.strokeStyle = GREEN; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.moveTo(gx(4.3), 760); ctx.lineTo(gx(4.3), 300); ctx.stroke(); ctx.restore();
      label(ctx, 'sweet spot', gx(4.3), 270, { size: 26, mono: true, color: GREEN, alpha: a * sk, weight: 700 });
      label(ctx, 'underfit', gx(1.6), 700, { size: 26, mono: true, color: C.electron, alpha: a * sk, weight: 600 });
      label(ctx, 'overfit', gx(8), 300, { size: 26, mono: true, color: C.proton, alpha: a * sk, weight: 600 });
      ['more data', 'simpler model', 'regularisation', 'early stopping'].forEach((f, i) => {
        const k = easeOut(range(lt, sp('o6', 0.1 + i * 0.2), sp('o6', 0.1 + i * 0.2) + 0.7));
        chip(ctx, f, 1400, 330 + i * 100, { color: GREEN, size: 34, alpha: a * k, w: 360 });
      });
      caption(ctx, 'o5', a, lt, CS.o5);
      caption(ctx, 'o6', a, lt, CS.o6);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 3;
      ctx.save(); ctx.translate(CX - 500, 220); axes(ctx, 0); ctx.restore();
      label(ctx, 'Learn the pattern,', CX, CY - 40, { size: 96, weight: 700, color: GREEN, alpha: a * range(lt, 0.5, 1.3) });
      label(ctx, 'not the noise.', CX, CY + 85, { size: 96, weight: 700, color: C.proton, alpha: a * range(lt, 0.5 + s * 0.5, 1.3 + s * 0.5) });
    },
  },
});
