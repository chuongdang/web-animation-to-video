import { C, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, chip, token, arrow } from '/runtime/kit.js';

const { lerp, range, easeOut, easeInOut, fadeWindow, rng } = Scene;

const GREEN = '#7ee787';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- software-engineering/scrum/empirical-process`.
const TXT = {
  e1: 'Scrum assumes we cannot predict a [[complex]] project, so it asks us to learn from [[experience]].',
  e2: 'Steering by [[evidence:green]] beats following a plan that was only a [[guess:proton]].',
  e3: '[[Transparency:electron]]: everyone sees the [[real state]] of the work.',
  e4: '[[Inspection:gold]]: we check progress [[often enough]] to catch problems early.',
  e5: '[[Adaptation:green]]: when something is off, we [[change course]] straight away.',
  d1: 'Without transparency, inspection is [[misleading:proton]]. Without inspection, adaptation is [[blind:proton]].',
  d2: 'Together they let a team [[learn fast:green]] and [[reduce risk:green]].',
};
const nar = await narration('software-engineering/scrum/empirical-process', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { steer: ['e1', 'e2'], pillars: ['e3', 'e4', 'e5'], chain: ['d1', 'd2'] });
const { CS, T } = P;
const sp = speech(nar, CS);

// ---- chapter 1: steering a course ----------------------------------------------------
const S0 = [260, 700], G0 = [1660, 330];
const lineAt = (u) => [lerp(S0[0], G0[0], u), lerp(S0[1], G0[1], u)];
const drift = (u) => 260 * u * u;                                   // the plan, pushed off course by the wind
const FIX = [0, 70, 22, 64, 18, 44, 10, 24, 0];                     // evidence-steered path: drifts, then corrects at each check
const steered = (u) => {
  const x = u * 8, i = Math.min(7, Math.floor(x)), f = x - i;
  return [lerp(S0[0], G0[0], u), lerp(S0[1], G0[1], u) + lerp(FIX[i], FIX[i + 1], f)];
};
const wind = (() => { const r = rng(5); return Array.from({ length: 14 }, () => [300 + r() * 1400, 280 + r() * 440]); })();

// ---- chapter 2/3: three pillars --------------------------------------------------------
const COLS = [{ x: 400, color: C.electron, name: 'Transparency', d1: 'everyone sees the', d2: 'real state of the work' },
  { x: 960, color: C.gold, name: 'Inspection', d1: 'check progress often', d2: 'to catch problems early' },
  { x: 1520, color: GREEN, name: 'Adaptation', d1: 'when something is off,', d2: 'change course right away' }];

function icon(ctx, kind, x, y, s, color, alpha) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 7 * s; ctx.lineCap = 'round';
  ctx.shadowColor = color; ctx.shadowBlur = 18;
  if (kind === 0) { // eye
    ctx.beginPath(); ctx.moveTo(x - 90 * s, y); ctx.quadraticCurveTo(x, y - 90 * s, x + 90 * s, y); ctx.quadraticCurveTo(x, y + 90 * s, x - 90 * s, y); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, 26 * s, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 1) { // magnifier
    ctx.beginPath(); ctx.arc(x - 12 * s, y - 12 * s, 48 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 24 * s, y + 24 * s); ctx.lineTo(x + 70 * s, y + 70 * s); ctx.stroke();
  } else { // turning arrow
    const a0 = -0.4, a1 = Math.PI * 1.35;
    ctx.beginPath(); ctx.arc(x, y, 58 * s, a0, a1); ctx.stroke();
    const hx = x + Math.cos(a1) * 58 * s, hy = y + Math.sin(a1) * 58 * s, d = a1 + Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(hx + 26 * s * Math.cos(d), hy + 26 * s * Math.sin(d));
    ctx.lineTo(hx + 22 * s * Math.cos(d + 2.2), hy + 22 * s * Math.sin(d + 2.2)); ctx.lineTo(hx + 22 * s * Math.cos(d - 2.2), hy + 22 * s * Math.sin(d - 2.2)); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      COLS.forEach((c, i) => icon(ctx, i, c.x + (i - 1) * 40, 200, 0.8, c.color, a * 0.3 * range(t, 0.5 + i * 0.2, 1.2 + i * 0.2)));
      titleCard(ctx, t, T, { l1: 'Why Scrum is', l2: 'empirical', sub: 'transparency · inspection · adaptation', tint: GREEN });
    },

    steer(ctx, t) {
      const a = chapterAlpha(T, 'steer', t), lt = t - T.steer[0];
      chapterTag(ctx, '01', 'Plan vs evidence', a);
      glowDot(ctx, ...S0, 13, C.text, a); label(ctx, 'start', S0[0], S0[1] + 44, { size: 24, mono: true, color: C.dim, alpha: a, weight: 500 });
      const gk = easeOut(range(lt, 0.4, 1.2));
      glowDot(ctx, ...G0, 18, GREEN, a * gk); label(ctx, 'goal', G0[0], G0[1] - 44, { size: 24, mono: true, color: GREEN, alpha: a * gk, weight: 500 });
      // the plan: a straight dashed line, drawn at the start
      const pk = easeInOut(range(lt, 0.9, 2.2));
      ctx.save(); ctx.globalAlpha = a * 0.9; ctx.strokeStyle = C.gold; ctx.lineWidth = 4; ctx.setLineDash([14, 10]);
      ctx.beginPath(); ctx.moveTo(...S0); ctx.lineTo(lerp(S0[0], G0[0], pk), lerp(S0[1], G0[1], pk)); ctx.stroke(); ctx.restore();
      label(ctx, 'the plan (a guess)', 760, 470, { size: 28, mono: true, color: C.gold, alpha: a * range(pk, 0.7, 1), weight: 700 });
      // wind: the unpredictable part
      const wk = range(lt, sp('e1', 0.35), sp('e1', 0.35) + 0.8);
      wind.forEach(([x, y], i) => {
        const k = range(wk, i / 20, i / 20 + 0.3), sway = Math.sin(lt * 1.5 + i) * 10;
        arrow(ctx, x, y + sway, x + 54, y + 30 + sway, C.dim, a * k * 0.55, 3);
      });
      label(ctx, 'complex: surprises we cannot see coming', CX, 215, { size: 28, mono: true, color: C.dim, alpha: a * wk, weight: 500 });
      // plan drifts off course
      const dk = easeInOut(range(lt, sp('e2', 0.0), sp('e2', 0.5)));
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = C.proton; ctx.lineWidth = 6; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i <= Math.floor(80 * dk); i++) { const u = i / 80, [x, y] = lineAt(u); i ? ctx.lineTo(x, y + drift(u)) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.restore();
      if (dk > 0) { const [x, y] = lineAt(dk); glowDot(ctx, x, y + drift(dk), 11, C.proton, a); }
      label(ctx, 'misses', G0[0] - 20, G0[1] + drift(1) + 50, { size: 28, mono: true, color: C.proton, alpha: a * range(dk, 0.9, 1), weight: 700 });
      // steered by evidence: checks and corrections
      const ek = easeInOut(range(lt, sp('e2', 0.5), sp('e2', 0.98)));
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = GREEN; ctx.lineWidth = 6; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i <= Math.floor(120 * ek); i++) { const p = steered(i / 120); i ? ctx.lineTo(...p) : ctx.moveTo(...p); }
      ctx.stroke(); ctx.restore();
      if (ek > 0) glowDot(ctx, ...steered(ek), 11, GREEN, a);
      [0.25, 0.5, 0.75].forEach((u) => {
        const k = range(ek, u, u + 0.04);
        if (k <= 0) return;
        const [x, y] = steered(u);
        ctx.save(); ctx.globalAlpha = a * k; ctx.strokeStyle = C.text; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      });
      label(ctx, 'check → correct', 1000, 850, { size: 28, mono: true, color: GREEN, alpha: a * range(ek, 0.3, 0.5), weight: 700 });
      caption(ctx, 'e1', a, lt, CS.e1);
      caption(ctx, 'e2', a, lt, CS.e2);
    },

    pillars(ctx, t) {
      const a = chapterAlpha(T, 'pillars', t), lt = t - T.pillars[0];
      chapterTag(ctx, '02', 'The three pillars', a);
      ['e3', 'e4', 'e5'].forEach((id, i) => {
        const c = COLS[i], k = easeOut(range(lt, sp(id, 0.0), sp(id, 0.0) + 0.7));
        icon(ctx, i, c.x, 340, 1.5, c.color, a * k);
        chip(ctx, c.name, c.x - 190, 520, { color: c.color, size: 42, alpha: a * k, w: 380, weight: 700 });
        label(ctx, c.d1, c.x, 620, { size: 28, mono: true, alpha: a * range(k, 0.4, 1), weight: 500 });
        label(ctx, c.d2, c.x, 662, { size: 28, mono: true, alpha: a * range(k, 0.4, 1), weight: 500 });
      });
      caption(ctx, 'e3', a, lt, CS.e3);
      caption(ctx, 'e4', a, lt, CS.e4);
      caption(ctx, 'e5', a, lt, CS.e5);
    },

    chain(ctx, t) {
      const a = chapterAlpha(T, 'chain', t), lt = t - T.chain[0];
      chapterTag(ctx, '03', 'They need each other', a);
      COLS.forEach((c, i) => {
        icon(ctx, i, c.x, 340, 1.5, c.color, a);
        chip(ctx, c.name, c.x - 190, 520, { color: c.color, size: 42, alpha: a, w: 380, weight: 700 });
      });
      const good = easeInOut(range(lt, sp('d2', 0.0), sp('d2', 0.0) + 0.8));
      [[0, 'misleading', 'd1', 0.15], [1, 'blind', 'd1', 0.62]].forEach(([i, word, id, f]) => {
        const k = easeOut(range(lt, sp(id, f), sp(id, f) + 0.6)), x0 = COLS[i].x + 210, x1 = COLS[i + 1].x - 210, y = 340;
        const col = good > 0.5 ? GREEN : C.proton;
        arrow(ctx, x0, y, lerp(x0, x1, k), y, col, a * k, 5);
        label(ctx, good > 0.5 ? 'feeds' : word, (x0 + x1) / 2, y - 46, { size: 28, mono: true, color: col, alpha: a * k, weight: 700 });
        if (good < 0.5 && k > 0.7) {
          ctx.save(); ctx.globalAlpha = a * range(k, 0.7, 1); ctx.strokeStyle = C.proton; ctx.lineWidth = 6; ctx.lineCap = 'round';
          const mx = (x0 + x1) / 2; ctx.beginPath(); ctx.moveTo(mx - 16, y + 14); ctx.lineTo(mx + 16, y + 46); ctx.moveTo(mx + 16, y + 14); ctx.lineTo(mx - 16, y + 46); ctx.stroke(); ctx.restore();
        }
      });
      // loop back: adapt -> new transparency
      const lk = range(lt, sp('d2', 0.2), sp('d2', 0.2) + 1.0);
      if (lk > 0) {
        ctx.save(); ctx.globalAlpha = a * lk * 0.8; ctx.strokeStyle = GREEN; ctx.lineWidth = 4; ctx.setLineDash([12, 8]);
        ctx.beginPath(); ctx.moveTo(COLS[2].x, 740); ctx.bezierCurveTo(COLS[2].x, 840, COLS[0].x, 840, COLS[0].x, 740); ctx.stroke(); ctx.restore();
      }
      const ck = range(lt, sp('d2', 0.25), sp('d2', 0.25) + 0.7), rk = range(lt, sp('d2', 0.7), sp('d2', 0.7) + 0.7);
      chip(ctx, 'learn fast', CX - 400, 630, { color: GREEN, size: 36, alpha: a * ck, w: 300 });
      chip(ctx, 'reduce risk', CX + 100, 630, { color: GREEN, size: 36, alpha: a * rk, w: 300 });
      caption(ctx, 'd1', a, lt, CS.d1);
      caption(ctx, 'd2', a, lt, CS.d2);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 3;
      [['See it.', C.electron], ['Check it.', C.gold], ['Change it.', GREEN]].forEach(([w, col], i) =>
        label(ctx, w, CX, CY - 150 + i * 150, { size: 100, weight: 700, color: col, alpha: a * range(lt, 0.5 + s * 0.3 * i, 1.3 + s * 0.3 * i) }));
    },
  },
});
