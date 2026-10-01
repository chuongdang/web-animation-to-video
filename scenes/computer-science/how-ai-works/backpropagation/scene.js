import { C, W, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, token, measure, chip, bar } from '/runtime/kit.js';

const { clamp, lerp, range, easeInOut, easeOut, fadeWindow, rng } = Scene;

const POS = C.gold, NEG = '#b48cff', GREEN = '#7ee787';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- computer-science/backpropagation`.
const TXT = {
  ls1: "The model's error is one number: the [[loss:proton]]. Learning means making it smaller.",
  ls2: 'Picture the loss as a [[landscape]] over the weights. Low ground means a [[better model]].',
  gd1: 'At any point, the [[gradient]] is the slope. It points uphill, so we step the [[opposite way]].',
  gd2: 'The step size is the [[learning rate]]: too small is slow, too large [[overshoots:proton]].',
  bp1: 'A forward pass makes a [[prediction]]; comparing it with the answer gives the [[error:proton]].',
  bp2: '[[Backpropagation]] sends the error backwards, finding each weight\'s share of the [[blame:proton]].',
  bp3: 'Every weight then takes a small step [[downhill]]. Repeat, [[millions]] of times.',
};
const nar = await narration('computer-science/how-ai-works/backpropagation', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { loss: ['ls1', 'ls2'], descent: ['gd1', 'gd2'], backprop: ['bp1', 'bp2', 'bp3'] });
const { CS, T } = P;
const sp = speech(nar, CS);

// ---- the loss landscape ------------------------------------------------------
const f = (w) => 0.16 * (w - 3) ** 2 + 0.25 * Math.sin(2 * w);
const df = (w) => 0.32 * (w - 3) + 0.5 * Math.cos(2 * w);
const WMIN = 2.51; // global minimum of f
const LX = (w) => 300 + ((w + 5) / 10) * 1320;
const LY = (v) => 780 - v * 52;
const RATES = [
  { lr: 0.12, name: 'too small', color: C.dim },
  { lr: 0.7, name: 'just right', color: GREEN },
  { lr: 6.6, name: 'too large', color: C.proton },
];
const traj = (lr, n = 60, w0 = -4.2) => {
  const out = [w0];
  for (let i = 0; i < n; i++) out.push(clamp(out[i] - lr * df(out[i]), -4.9, 4.9));
  return out;
};
const TRAJ = RATES.map((r) => traj(r.lr));
const SPS = 1.5; // gradient steps per second
const at = (tr, tau) => {
  const s = Math.max(0, tau) * SPS, i = Math.min(Math.floor(s), tr.length - 2);
  return lerp(tr[i], tr[i + 1], easeInOut(s - i));
};

function landscape(ctx, a, draw = 1) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = C.dim; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(300, 810); ctx.lineTo(1620, 810); ctx.moveTo(300, 810); ctx.lineTo(300, 260); ctx.stroke();
  ctx.strokeStyle = C.electron; ctx.lineWidth = 6; ctx.lineJoin = 'round';
  ctx.beginPath();
  const n = Math.floor(200 * draw);
  for (let i = 0; i <= n; i++) { const w = -5 + (i / 200) * 10; i ? ctx.lineTo(LX(w), LY(f(w))) : ctx.moveTo(LX(w), LY(f(w))); }
  ctx.stroke();
  ctx.restore();
  label(ctx, 'weights →', 1620, 850, { size: 26, mono: true, color: C.dim, alpha: a, align: 'right', weight: 500 });
  label(ctx, 'loss ↑', 300, 235, { size: 26, mono: true, color: C.dim, alpha: a, align: 'center', weight: 500 });
}

function ball(ctx, w, color, a, r = 16) {
  glowDot(ctx, LX(w), LY(f(w)) - r, r, color, a);
}

// ---- the network -------------------------------------------------------------
function makeState() {
  const rand = rng(31);
  const layers = [3, 4, 4, 1];
  const nodes = layers.map((n, L) => Array.from({ length: n }, (_, i) => ({ x: lerp(380, 1540, L / (layers.length - 1)), y: 470 + (i - (n - 1) / 2) * 92 })));
  const edges = [];
  for (let L = 0; L < layers.length - 1; L++) for (const a of nodes[L]) for (const b of nodes[L + 1]) edges.push({ a, b, L, w0: rand() * 2 - 1, w1: rand() * 2 - 1, g: rand() * 2 - 1 });
  return { layers, nodes, edges };
}

function drawNet(ctx, S, a, { wave = null, mix = 0, gradShow = [], back = null }) {
  for (const e of S.edges) {
    const v = lerp(e.w0, e.w1, mix);
    ctx.save();
    ctx.globalAlpha = a * (0.10 + 0.5 * Math.abs(v)); ctx.strokeStyle = v >= 0 ? POS : NEG; ctx.lineWidth = 1 + 4.5 * Math.abs(v);
    ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
    ctx.restore();
    const gs = gradShow[e.L] ?? 0;
    if (gs > 0) {
      ctx.save();
      ctx.globalAlpha = a * gs * (0.25 + 0.6 * Math.abs(e.g)); ctx.strokeStyle = C.proton; ctx.shadowColor = C.proton; ctx.shadowBlur = 14;
      ctx.lineWidth = 2 + 9 * Math.abs(e.g);
      ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
      ctx.restore();
    }
    if (wave !== null && Math.abs(v) > 0.25) {
      const k = wave - e.L;
      if (k > 0 && k < 1) glowDot(ctx, lerp(e.a.x, e.b.x, k), lerp(e.a.y, e.b.y, k), 4 + 3 * Math.abs(v), C.electron, a * Math.sin(k * Math.PI));
    }
    if (back !== null && Math.abs(e.g) > 0.2) {
      const k = back - (S.layers.length - 2 - e.L);
      if (k > 0 && k < 1) glowDot(ctx, lerp(e.b.x, e.a.x, k), lerp(e.b.y, e.a.y, k), 4 + 3 * Math.abs(e.g), C.proton, a * Math.sin(k * Math.PI));
    }
  }
  S.nodes.forEach((layer, L) => {
    const act = wave === null ? 0 : clamp(1 - Math.abs(wave - L), 0, 1);
    for (const n of layer) {
      ctx.save();
      ctx.globalAlpha = a; ctx.shadowColor = C.electron; ctx.shadowBlur = 26 * act;
      ctx.fillStyle = `rgba(77,216,255,${0.10 + 0.7 * act})`; ctx.strokeStyle = C.electron; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(n.x, n.y, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  });
}

// ---- chapters ----------------------------------------------------------------
mount({
  plan: P,
  init: makeState,
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      landscape(ctx, a * 0.22 * range(t, 0.2, 1), range(t, 0.2, 2.4));
      ball(ctx, at(TRAJ[1], t - 1), GREEN, a * 0.5 * range(t, 1, 1.6));
      titleCard(ctx, t, T, { l1: 'How do networks', l2: 'learn from errors?', sub: 'backpropagation and gradient descent', tint: C.electron, size: 96 });
    },

    loss(ctx, t) {
      const a = chapterAlpha(T, 'loss', t), lt = t - T.loss[0];
      chapterTag(ctx, '01', 'The loss', a);
      // prediction vs answer -> loss number
      const bars = a * (1 - range(lt, CS.ls2 - 0.3, CS.ls2 + 0.3));
      if (bars > 0) {
        const k = easeOut(range(lt, 0.8, 1.6)), k2 = easeOut(range(lt, sp('ls1', 0.25), sp('ls1', 0.25) + 0.8));
        bar(ctx, { x: 700, y: 360, w: 560 * 0.3 * k, color: C.electron, alpha: bars * k, name: 'prediction', value: '0.30' });
        bar(ctx, { x: 700, y: 450, w: 560 * k, color: GREEN, alpha: bars * k, name: 'answer', value: '1.00' });
        bar(ctx, { x: 700, y: 540, w: 560 * 0.7 * k2, color: C.proton, alpha: bars * k2, name: 'error', value: '0.70', glow: 16 });
        const lk = easeOut(range(lt, sp('ls1', 0.55), sp('ls1', 0.55) + 0.8));
        label(ctx, 'loss = (error)² = 0.49', CX, 690, { size: 64, mono: true, weight: 600, color: C.proton, alpha: bars * lk });
      }
      // the same loss, as height in a landscape
      const land = a * range(lt, CS.ls2, CS.ls2 + 0.6);
      if (land > 0) {
        landscape(ctx, land, easeInOut(range(lt, CS.ls2 + 0.2, CS.ls2 + 2.0)));
        const bk = range(lt, CS.ls2 + 2.0, CS.ls2 + 2.6);
        ball(ctx, -4.2, C.gold, land * bk);
        label(ctx, 'high loss: a bad model', LX(-4.2) + 30, LY(f(-4.2)) - 50, { size: 26, mono: true, color: C.gold, alpha: land * bk, align: 'left', weight: 600 });
        const lo = range(lt, sp('ls2', 0.7), sp('ls2', 0.7) + 0.8);
        label(ctx, 'low loss: a good model', LX(WMIN), LY(f(WMIN)) - 90, { size: 26, mono: true, color: GREEN, alpha: land * lo, weight: 600 });
      }
      caption(ctx, 'ls1', a, lt, CS.ls1);
      caption(ctx, 'ls2', a, lt, CS.ls2);
    },

    descent(ctx, t) {
      const a = chapterAlpha(T, 'descent', t), lt = t - T.descent[0];
      chapterTag(ctx, '02', 'Gradient descent', a);
      landscape(ctx, a);
      const phase2 = range(lt, CS.gd2 - 0.3, CS.gd2 + 0.3);

      // phase 1: slope, gradient arrow and the opposite step
      const p1 = a * (1 - phase2);
      if (p1 > 0) {
        const start = sp('gd1', 0.75);
        const w = at(TRAJ[1], lt - start);
        const slope = df(w), x = LX(w), y = LY(f(w)) - 16;
        const k = range(lt, 0.6, 1.2);
        ball(ctx, w, GREEN, p1 * k);
        // tangent
        const dx = 150, dy = -slope * 52 * (dx / (1320 / 10));
        ctx.save(); ctx.globalAlpha = p1 * k * 0.8; ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
        ctx.beginPath(); ctx.moveTo(x - dx, y + dy); ctx.lineTo(x + dx, y - dy); ctx.stroke(); ctx.restore();
        const ga = range(lt, sp('gd1', 0.3), sp('gd1', 0.3) + 0.7) * (lt < start + 0.5 ? 1 : 0.5);
        const dir = Math.sign(slope) || 1;
        const arrow = (sign, color, text, off) => {
          const x0 = x, x1 = x + sign * 150;
          ctx.save(); ctx.globalAlpha = p1 * ga; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 7; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x0, y + off); ctx.lineTo(x1, y + off); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x1 + sign * 22, y + off); ctx.lineTo(x1, y + off - 14); ctx.lineTo(x1, y + off + 14); ctx.closePath(); ctx.fill(); ctx.restore();
          label(ctx, text, (x0 + x1) / 2, y + off - 34, { size: 26, mono: true, color, alpha: p1 * ga, weight: 600 });
        };
        arrow(dir, C.proton, 'gradient (uphill)', -110);
        arrow(-dir, GREEN, 'step (downhill)', -200);
        label(ctx, `loss = ${f(w).toFixed(2)}`, W - 300, 260, { size: 44, mono: true, weight: 600, color: C.gold, alpha: p1 * k, align: 'right' });
        // trail
        for (let i = 0; i < 12; i++) { const tw = at(TRAJ[1], lt - start - i * 0.35); if (lt - start - i * 0.35 > 0) glowDot(ctx, LX(tw), LY(f(tw)) - 6, 5, GREEN, p1 * 0.5 * (1 - i / 12)); }
      }

      // phase 2: three learning rates side by side
      if (phase2 > 0) {
        const p2 = a * phase2, start = sp('gd2', 0.15);
        RATES.forEach((r, i) => {
          const tr = TRAJ[i], tau = lt - start;
          const w = at(tr, tau);
          for (let k = 0; k < 14; k++) { const tt = tau - k * 0.3; if (tt > 0) { const tw = at(tr, tt); glowDot(ctx, LX(tw), LY(f(tw)) - 6, 4, r.color, p2 * 0.45 * (1 - k / 14)); } }
          ball(ctx, w, r.color, p2, 15);
          token(ctx, r.name, W - 330, 300 + i * 70, r.color, p2 * range(lt, sp('gd2', 0.2 + i * 0.25), sp('gd2', 0.2 + i * 0.25) + 0.6), 26);
        });
      }
      caption(ctx, 'gd1', a, lt, CS.gd1);
      caption(ctx, 'gd2', a, lt, CS.gd2);
    },

    backprop(ctx, t, S) {
      const a = chapterAlpha(T, 'backprop', t), lt = t - T.backprop[0];
      chapterTag(ctx, '03', 'Backpropagation', a);
      const nL = S.layers.length;
      const fwd = (lt - sp('bp1', 0.05)) * 0.9 - 0.4;
      const wave = fwd > -0.4 && fwd < nL + 0.3 ? fwd : null;
      const back = lt >= sp('bp2', 0.05) ? (lt - sp('bp2', 0.05)) * 1.0 : null;
      const gradShow = Array.from({ length: nL - 1 }, (_, L) => (back === null ? 0 : range(back - (nL - 2 - L), 0, 0.6) * (1 - range(lt, CS.bp3 + 3.2, CS.bp3 + 4))));
      const mix = easeInOut(range(lt, sp('bp3', 0.15), sp('bp3', 0.15) + 2.2));
      drawNet(ctx, S, a, { wave, mix, gradShow, back: back !== null && back < nL ? back : null });

      const out = S.nodes[nL - 1][0];
      const pk = easeOut(range(lt, sp('bp1', 0.45), sp('bp1', 0.45) + 0.7));
      label(ctx, `prediction ${lerp(0.3, 0.9, mix).toFixed(2)}`, out.x + 60, out.y - 34, { size: 28, mono: true, color: C.electron, alpha: a * pk, align: 'left', weight: 600 });
      label(ctx, 'answer 1.00', out.x + 60, out.y + 4, { size: 28, mono: true, color: GREEN, alpha: a * pk, align: 'left', weight: 600 });
      label(ctx, `error ${(1 - lerp(0.3, 0.9, mix)).toFixed(2)}`, out.x + 60, out.y + 42, { size: 28, mono: true, color: C.proton, alpha: a * range(lt, sp('bp1', 0.75), sp('bp1', 0.75) + 0.6), align: 'left', weight: 600 });
      label(ctx, 'input', S.nodes[0][0].x, 720, { size: 24, mono: true, color: C.dim, alpha: a, weight: 500 });
      label(ctx, 'hidden layers', (S.nodes[1][0].x + S.nodes[2][0].x) / 2, 720, { size: 24, mono: true, color: C.dim, alpha: a, weight: 500 });
      label(ctx, 'output', out.x, 720, { size: 24, mono: true, color: C.dim, alpha: a, weight: 500 });
      if (back !== null) label(ctx, '← error flows backwards', CX, 240, { size: 30, mono: true, color: C.proton, alpha: a * range(lt, sp('bp2', 0.05), sp('bp2', 0.05) + 0.6) * (1 - range(lt, CS.bp3, CS.bp3 + 0.6)), weight: 600 });
      label(ctx, 'each weight steps downhill  ×  millions', CX, 240, { size: 30, mono: true, color: GREEN, alpha: a * range(lt, sp('bp3', 0.1), sp('bp3', 0.1) + 0.6), weight: 600 });
      caption(ctx, 'bp1', a, lt, CS.bp1);
      caption(ctx, 'bp2', a, lt, CS.bp2);
      caption(ctx, 'bp3', a, lt, CS.bp3);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 6;
      const items = [
        { text: 'predict', x: CX - 330, y: CY - 90, color: C.electron },
        { text: 'measure the error', x: CX + 330, y: CY - 90, color: C.proton },
        { text: 'send it backwards', x: CX + 330, y: CY + 110, color: C.gold },
        { text: 'step downhill', x: CX - 330, y: CY + 110, color: GREEN },
      ];
      items.forEach((it, i) => {
        const k = easeOut(range(lt, 0.4 + (s * i) / 5, 1.0 + (s * i) / 5));
        const w = measure(ctx, it.text, 46, 700) + 60;
        chip(ctx, it.text, it.x - w / 2, it.y, { color: it.color, size: 46, alpha: a * k, w, weight: 700 });
        const nx = items[(i + 1) % 4];
        const nk = range(lt, 0.4 + (s * ((i + 1) % 4 || 4)) / 5, 1.0 + (s * ((i + 1) % 4 || 4)) / 5);
        ctx.save(); ctx.globalAlpha = a * Math.min(k, i === 3 ? range(lt, s * 0.85, s * 0.85 + 0.6) : nk) * 0.7; ctx.strokeStyle = C.dim; ctx.fillStyle = C.dim; ctx.lineWidth = 4;
        const dx = Math.sign(nx.x - it.x), dy = Math.sign(nx.y - it.y);
        const [x0, y0] = dy === 0 ? [it.x + dx * (w / 2 + 14), it.y] : [it.x, it.y + dy * 56];
        const [x1, y1] = dy === 0 ? [nx.x - dx * (measure(ctx, nx.text, 46, 700) / 2 + 44), nx.y] : [nx.x, nx.y - dy * 56];
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        const ang = Math.atan2(y1 - y0, x1 - x0);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - 18 * Math.cos(ang - 0.5), y1 - 18 * Math.sin(ang - 0.5)); ctx.lineTo(x1 - 18 * Math.cos(ang + 0.5), y1 - 18 * Math.sin(ang + 0.5)); ctx.closePath(); ctx.fill();
        ctx.restore();
      });
      label(ctx, 'repeat, and the network learns', CX, CY + 260, { size: 40, mono: true, weight: 500, color: C.gold, alpha: a * range(lt, s * 0.85, s * 0.85 + 0.8) });
    },
  },
});
