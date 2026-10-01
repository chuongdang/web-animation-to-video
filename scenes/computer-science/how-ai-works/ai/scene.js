import { W, H, CX, CY, C, FONT, MONO, fontsLoaded, glowDot, label, chapterTag, narration, LEAD } from '/runtime/kit.js';

const { clamp, lerp, range, easeInOut, easeOut, fadeWindow, rng } = Scene;

const POS = C.gold, NEG = '#b48cff'; // positive / negative weights

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio comes from `npm run narrate -- ai`.
const TXT = {
  net1: 'An AI model is a huge network of simple [[artificial neurons:electron]], arranged in [[layers]].',
  net2: 'Each link has a [[weight]], a number for how strongly one neuron [[influences]] the next.',
  train1: 'It makes a [[guess]], compares it with the [[right answer]], and measures the [[error:proton]].',
  train2: 'Then it nudges every [[weight]] to shrink that error, over [[billions]] of examples.',
  pred1: 'A chat AI is trained on one simple task: predict the [[next word:electron]].',
  pred2: 'Add a likely word, then repeat, and the [[patterns]] it learned become whole [[sentences]].',
};
const { spoken, capEnd, cue, caption } = await narration('computer-science/how-ai-works/ai', TXT);

// Timeline (seconds). Caption start times are relative to the start of each chapter.
const CS = { net1: 0.6, train1: 0.6, pred1: 0.6 };
CS.net2 = capEnd('net1', CS.net1);
CS.train2 = capEnd('train1', CS.train1);
CS.pred2 = capEnd('pred1', CS.pred1);
const LEN = {
  net: capEnd('net2', CS.net2) + 0.3,
  train: capEnd('train2', CS.train2) + 0.3,
  pred: capEnd('pred2', CS.pred2) + 0.3,
};
const T = { title: [0, 4] };
T.net = [T.title[1], T.title[1] + LEN.net];
T.train = [T.net[1], T.net[1] + LEN.train];
T.pred = [T.train[1], T.train[1] + LEN.pred];
T.outro = [T.pred[1], T.pred[1] + (spoken('outro') ? 0.3 + spoken('outro') + 2.5 : 8)];
const AUDIO = [
  ...cue('net1', T.net[0] + CS.net1), ...cue('net2', T.net[0] + CS.net2),
  ...cue('train1', T.train[0] + CS.train1), ...cue('train2', T.train[0] + CS.train2),
  ...cue('pred1', T.pred[0] + CS.pred1), ...cue('pred2', T.pred[0] + CS.pred2),
  ...cue('outro', T.outro[0] + 0.3 - LEAD),
];
const DURATION = Math.ceil(T.outro[1] * 10) / 10;

// ---- neural network -------------------------------------------------------
function makeNet(layers, x0, x1, cy, gap, rand) {
  const nodes = layers.map((n, L) =>
    Array.from({ length: n }, (_, i) => ({ x: lerp(x0, x1, L / (layers.length - 1)), y: cy + (i - (n - 1) / 2) * gap })),
  );
  const edges = [];
  for (let L = 0; L < layers.length - 1; L++) {
    for (const a of nodes[L]) for (const b of nodes[L + 1]) edges.push({ a, b, L, w0: rand() * 2 - 1, w1: rand() * 2 - 1 });
  }
  return { layers, nodes, edges };
}

/**
 * wave: layer coordinate of a signal sweeping left to right (null = none)
 * mix: 0..1 blends each edge from its w0 to its w1 (used while "learning")
 * hot: [{ edge, k }] edges to highlight
 */
function drawNet(ctx, net, { alpha = 1, wave = null, mix = 0, hot = [], r = 24, glow = 1 }) {
  const w = (e) => lerp(e.w0, e.w1, mix);
  for (const e of net.edges) {
    const v = w(e);
    ctx.save();
    ctx.globalAlpha = alpha * (0.08 + 0.55 * Math.abs(v));
    ctx.strokeStyle = v >= 0 ? POS : NEG;
    ctx.lineWidth = 1 + 4.5 * Math.abs(v);
    ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
    ctx.restore();
    if (wave !== null && Math.abs(v) > 0.25) {
      const f = wave - e.L;
      if (f > 0 && f < 1) glowDot(ctx, lerp(e.a.x, e.b.x, f), lerp(e.a.y, e.b.y, f), 3.5 + 3 * Math.abs(v), C.electron, alpha * 0.9 * Math.sin(f * Math.PI));
    }
  }
  for (const h of hot) {
    const e = h.edge, v = w(e);
    ctx.save();
    ctx.globalAlpha = alpha * h.k;
    ctx.strokeStyle = v >= 0 ? POS : NEG;
    ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 24;
    ctx.lineWidth = 3 + 7 * Math.abs(v);
    ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
    ctx.restore();
  }
  net.nodes.forEach((layer, L) => {
    const act = (wave === null ? 0 : clamp(1 - Math.abs(wave - L), 0, 1)) * glow;
    for (const n of layer) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = C.electron; ctx.shadowBlur = 30 * act;
      ctx.fillStyle = `rgba(77,216,255,${0.10 + 0.75 * act})`;
      ctx.strokeStyle = C.electron; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  });
}

const fmtW = (v) => `w = ${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}`;

// ---- state (deterministic) ------------------------------------------------
function makeState() {
  const rand = rng(2024);
  const drift = Array.from({ length: 46 }, () => ({
    x: rand() * W, y: rand() * H, vx: (rand() - 0.5) * 24, vy: (rand() - 0.5) * 24, r: 2 + rand() * 3,
  }));

  const bigNet = makeNet([4, 6, 6, 3], 360, 1560, 470, 90, rand);
  const trainNet = makeNet([3, 5, 2], 200, 700, 470, 100, rand);
  const pos = bigNet.edges.find((e) => e.L === 1 && e.w0 > 0.6);
  const neg = bigNet.edges.find((e) => e.L === 1 && e.w0 < -0.6);
  return { drift, bigNet, trainNet, labelled: [pos, neg].filter(Boolean) };
}

// ---- chapters -------------------------------------------------------------
function drawTitle(ctx, t, S) {
  const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
  const pts = S.drift.map((p) => ({ x: (p.x + p.vx * t + W * 3) % W, y: (p.y + p.vy * t + H * 3) % H, r: p.r }));
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      if (d < 260) {
        ctx.save();
        ctx.globalAlpha = a * 0.22 * (1 - d / 260);
        ctx.strokeStyle = C.electron; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
        ctx.restore();
      }
    }
  }
  for (const p of pts) glowDot(ctx, p.x, p.y, p.r, C.electron, a * 0.5);

  const rise = (1 - easeOut(range(t, 0.3, 1.5))) * 30;
  label(ctx, 'How does', CX, CY - 70 + rise, { size: 120, weight: 700, alpha: a * range(t, 0.4, 1.3) });
  label(ctx, 'AI work?', CX, CY + 60 + rise, { size: 120, weight: 700, alpha: a * range(t, 0.6, 1.5), color: C.electron });
  label(ctx, 'in plain words', CX, CY + 175 + rise, { size: 38, mono: true, weight: 500, color: C.gold, alpha: a * range(t, 1.3, 2.2) });
}

function drawNetChapter(ctx, t, S) {
  const [a0, a1] = T.net, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.6, 0.6);
  chapterTag(ctx, '01', 'Neurons and weights', a);
  const net = S.bigNet;
  const build = easeOut(range(lt, 0.3, 1.8));
  const wave = range(lt, 1.5, 1.6) > 0 ? ((lt - 1.5) * 0.7) % 4.6 - 0.6 : null;

  // net2: two labelled weights
  const k2 = range(lt, CS.net2 + LEAD, CS.net2 + LEAD + 0.8);
  const hot = S.labelled.map((edge, i) => ({ edge, k: k2 * (0.6 + 0.4 * Math.sin(lt * 4 + i * 2)) }));
  drawNet(ctx, net, { alpha: a * build, wave, hot });

  label(ctx, 'input', net.nodes[0][0].x, 760, { size: 28, mono: true, color: C.dim, alpha: a * range(lt, 1.6, 2.4), weight: 500 });
  label(ctx, 'hidden layers', (net.nodes[1][0].x + net.nodes[2][0].x) / 2, 760, { size: 28, mono: true, color: C.dim, alpha: a * range(lt, 1.8, 2.6), weight: 500 });
  label(ctx, 'output', net.nodes[3][0].x, 760, { size: 28, mono: true, color: C.dim, alpha: a * range(lt, 2.0, 2.8), weight: 500 });

  S.labelled.forEach((e) => {
    const v = e.w0;
    label(ctx, fmtW(v), (e.a.x + e.b.x) / 2, (e.a.y + e.b.y) / 2 - 34, { size: 30, mono: true, color: v >= 0 ? POS : NEG, alpha: a * k2, weight: 600 });
  });
  label(ctx, 'positive weight = strengthens', 1340, 190, { size: 24, mono: true, color: POS, alpha: a * k2, align: 'left', weight: 500 });
  label(ctx, 'negative weight = weakens', 1340, 230, { size: 24, mono: true, color: NEG, alpha: a * k2, align: 'left', weight: 500 });

  caption(ctx, 'net1', a, lt, CS.net1);
  caption(ctx, 'net2', a, lt, CS.net2);
}

function drawTrain(ctx, t, S) {
  const [a0, a1] = T.train, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.6, 0.6);
  chapterTag(ctx, '02', 'Learning from mistakes', a);

  // learning progress starts with the second caption
  const prog = range(lt, CS.train2 + LEAD, LEN.train - 1.2);
  const flutter = Math.sin(lt * 5) * 0.03 * (1 - prog);
  const guess = clamp(0.28 + 0.68 * (1 - Math.exp(-3.4 * prog)) + flutter, 0, 1);
  const err = 1 - guess;

  // network with weights that settle as it learns
  const net = S.trainNet;
  const nudging = range(lt, CS.train2 + LEAD, CS.train2 + LEAD + 0.8) * (1 - range(prog, 0.9, 1));
  const wave = ((lt * 0.9) % 3) - 0.5;
  drawNet(ctx, net, { alpha: a, wave, mix: easeOut(prog), r: 22, glow: 0.9 });
  const outs = net.nodes[2];
  [['cat', guess], ['dog', 1 - guess]].forEach(([name, p], i) => {
    label(ctx, name, outs[i].x + 46, outs[i].y - 14, { size: 30, weight: 600, alpha: a, align: 'left', color: i === 0 ? C.text : C.dim });
    label(ctx, `${Math.round(p * 100)}%`, outs[i].x + 46, outs[i].y + 20, { size: 26, mono: true, alpha: a, align: 'left', color: i === 0 ? C.electron : C.dim, weight: 500 });
  });
  label(ctx, 'input: a photo of a cat', 200, 200, { size: 26, mono: true, color: C.dim, alpha: a * range(lt, 0.4, 1), align: 'left', weight: 500 });
  label(ctx, '↻ nudging weights', 200, 740, { size: 30, mono: true, color: POS, alpha: a * nudging * (0.6 + 0.4 * Math.sin(lt * 6)), align: 'left', weight: 600 });

  // guess / answer / error bars
  const bx = 1250, bw = 460;
  const rows = [
    { name: 'guess', v: guess, color: C.electron, at: CS.train1 + 0.8, y: 290 },
    { name: 'right answer', v: 1, color: C.gold, at: CS.train1 + 2.4, y: 365 },
    { name: 'error', v: err, color: C.proton, at: CS.train1 + 4.0, y: 440 },
  ];
  for (const r of rows) {
    const k = range(lt, r.at, r.at + 0.6);
    label(ctx, r.name, bx - 24, r.y, { size: 28, mono: true, color: r.color, alpha: a * k, align: 'right', weight: 600 });
    ctx.save();
    ctx.globalAlpha = a * k * 0.15; ctx.fillStyle = r.color;
    ctx.beginPath(); ctx.roundRect(bx, r.y - 20, bw, 40, 8); ctx.fill();
    ctx.globalAlpha = a * k; ctx.shadowColor = r.color; ctx.shadowBlur = r.name === 'error' ? 18 : 0;
    ctx.beginPath(); ctx.roundRect(bx, r.y - 20, Math.max(4, bw * r.v * easeOut(k)), 40, 8); ctx.fill();
    ctx.restore();
    label(ctx, `${Math.round(r.v * 100)}%`, bx + bw + 20, r.y, { size: 28, mono: true, alpha: a * k, align: 'left', weight: 600 });
  }

  // error-over-time curve
  const cx0 = 1000, cy0 = 560, cw = 760, ch = 230;
  const lossAt = (p) => 0.72 * Math.exp(-3.4 * p) + 0.04 + 0.03 * Math.sin(p * 70) * (1 - p);
  const shown = range(lt, CS.train2 - 0.2, CS.train2 + 0.6);
  ctx.save();
  ctx.globalAlpha = a * shown;
  ctx.strokeStyle = C.dim; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.lineTo(cx0, cy0 + ch); ctx.lineTo(cx0 + cw, cy0 + ch); ctx.stroke();
  ctx.strokeStyle = C.proton; ctx.lineWidth = 5; ctx.lineJoin = 'round';
  ctx.beginPath();
  const n = Math.max(1, Math.floor(prog * 200));
  for (let i = 0; i <= n; i++) {
    const p = (i / 200);
    const x = cx0 + p * cw, y = cy0 + ch - clamp(lossAt(p) / 0.8, 0, 1) * ch;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
  label(ctx, 'error over time', cx0, cy0 - 26, { size: 26, mono: true, color: C.dim, alpha: a * shown, align: 'left', weight: 500 });
  const seen = Math.round(Math.pow(10, lerp(2, 9.5, prog)));
  label(ctx, `examples seen: ${seen.toLocaleString('en-US')}`, cx0, cy0 + ch + 50, { size: 30, mono: true, color: C.gold, alpha: a * shown, align: 'left', weight: 600 });

  caption(ctx, 'train1', a, lt, CS.train1);
  caption(ctx, 'train2', a, lt, CS.train2);
}

// A tiny "language model": probabilities for the next word, sampled step by step.
const STEPS = [
  { dist: [['mat', 55], ['sofa', 20], ['floor', 15], ['roof', 6], ['moon', 4]] },
  { dist: [['and', 38], ['.', 27], ['while', 15], ['because', 12], ['quietly', 8]] },
  { dist: [['purred', 44], ['slept', 26], ['watched', 18], ['ran', 8], ['sang', 4]] },
  { dist: [['softly', 40], ['loudly', 25], ['happily', 20], ['.', 10], ['twice', 5]] },
];
const PREFIX = ['The', 'cat', 'sat', 'on', 'the'];

function drawPredict(ctx, t) {
  const [a0, a1] = T.pred, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.6, 0.6);
  chapterTag(ctx, '03', 'Predicting the next word', a);

  const first = 0.8, dt = (LEN.pred - first - 1.2) / STEPS.length;
  const start = (k) => first + k * dt;
  const PICK = 2.3, FLY0 = 3.0, FLY1 = 3.7;

  // sentence
  const fs = 64, sx = 250, sy = 330;
  ctx.save();
  ctx.font = `500 ${fs}px ${FONT}`;
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const space = ctx.measureText(' ').width;
  let x = sx;
  let newest = -1;
  const words = [...PREFIX];
  STEPS.forEach((s, k) => { if (lt >= start(k) + FLY1) { words.push(s.dist[0][0]); newest = words.length - 1; } });
  words.forEach((wd, i) => {
    const isNew = i === newest;
    const fresh = isNew ? 1 - range(lt, start(newest - PREFIX.length) + FLY1, start(newest - PREFIX.length) + FLY1 + 1.2) : 0;
    ctx.globalAlpha = a;
    ctx.fillStyle = fresh > 0 ? C.gold : C.text;
    ctx.fillText(wd, x, sy);
    x += ctx.measureText(wd).width + (wd === '.' ? 0 : space);
  });
  const endX = x;
  ctx.restore();
  // blinking cursor
  ctx.save();
  ctx.globalAlpha = a * (0.55 + 0.45 * Math.sin(lt * 7));
  ctx.fillStyle = C.electron;
  ctx.fillRect(endX + 4, sy - fs * 0.5, 5, fs);
  ctx.restore();
  label(ctx, 'prompt: "The cat sat on the …"', sx, 250, { size: 24, mono: true, color: C.dim, alpha: a * range(lt, 0.2, 0.8), align: 'left', weight: 500 });

  // current step's probabilities
  const k = clamp(Math.floor((lt - first) / dt), 0, STEPS.length - 1);
  const sl = lt - start(k);
  const step = STEPS[k];
  const lastStep = k === STEPS.length - 1;
  const barsA = a * range(lt, first, first + 0.3) * (lastStep ? 1 : 1 - range(sl, dt - 0.4, dt - 0.05));
  label(ctx, 'probability of the next word', 810, 470, { size: 26, mono: true, color: C.dim, alpha: barsA, align: 'left', weight: 500 });
  step.dist.forEach(([word, pct], i) => {
    const y = 545 + i * 78;
    const grow = easeOut(range(sl, 0.2 + i * 0.12, 0.9 + i * 0.12));
    const picked = i === 0 && sl >= PICK;
    const flying = i === 0 && sl >= FLY0;
    const dim = sl >= PICK && !picked ? 0.35 : 1;
    const col = picked ? C.gold : C.electron;
    label(ctx, word, 780, y, { size: 38, mono: true, weight: 500, alpha: barsA * dim * (flying ? 1 - range(sl, FLY0, FLY0 + 0.2) : 1), align: 'right', color: picked ? C.gold : C.text });
    ctx.save();
    ctx.globalAlpha = barsA * dim;
    ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = picked ? 22 : 0;
    ctx.beginPath(); ctx.roundRect(810, y - 22, Math.max(4, pct * 10 * grow), 44, 8); ctx.fill();
    ctx.restore();
    label(ctx, `${Math.round(pct * grow)}%`, 810 + pct * 10 * grow + 20, y, { size: 30, mono: true, alpha: barsA * dim, align: 'left', weight: 600 });
    if (flying && sl < FLY1) {
      const f = easeInOut(range(sl, FLY0, FLY1));
      label(ctx, word, lerp(700, endX, f), lerp(y, sy, f), { size: lerp(38, fs, f), weight: 500, color: C.gold, alpha: a, align: 'left', mono: f < 0.5 });
    }
  });

  caption(ctx, 'pred1', a, lt, CS.pred1);
  caption(ctx, 'pred2', a, lt, CS.pred2);
}

function drawOutro(ctx, t) {
  const [a0, a1] = T.outro, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.7, 0.8);
  const items = [
    { text: 'Data in', color: C.electron, at: 0.4 },
    { text: 'Patterns learned', color: C.gold, at: 1.3 },
    { text: 'Predictions out', color: C.proton, at: 2.5 },
  ];
  const size = 64, gap = 130;
  ctx.save();
  ctx.font = `700 ${size}px ${FONT}`;
  const widths = items.map((it) => ctx.measureText(it.text).width);
  ctx.restore();
  let x = CX - (widths.reduce((n, w) => n + w, 0) + gap * (items.length - 1)) / 2;
  items.forEach((it, i) => {
    const k = range(lt, it.at, it.at + 0.7);
    label(ctx, it.text, x, CY - 20 + (1 - easeOut(k)) * 24, { size, weight: 700, color: it.color, alpha: a * k, align: 'left' });
    if (i < items.length - 1) label(ctx, '→', x + widths[i] + gap / 2, CY - 20, { size: 56, color: C.dim, alpha: a * range(lt, items[i + 1].at, items[i + 1].at + 0.7), weight: 500 });
    x += widths[i] + gap;
  });
  label(ctx, 'That is how AI works.', CX, CY + 110, { size: 44, mono: true, weight: 500, color: C.dim, alpha: a * range(lt, 3.6, 4.4) });
}

fontsLoaded.then(() => Scene.define({
  width: W, height: H, duration: DURATION, background: C.bg, audio: AUDIO,
  init: makeState,
  draw(ctx, t, S) {
    const v = ctx.createRadialGradient(CX, CY, 200, CX, CY, 1200);
    v.addColorStop(0, '#141c38'); v.addColorStop(1, C.bg);
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);

    const on = (span) => t >= span[0] - 1 && t < span[1];
    if (on(T.title)) drawTitle(ctx, t, S);
    if (on(T.net)) drawNetChapter(ctx, t, S);
    if (on(T.train)) drawTrain(ctx, t, S);
    if (on(T.pred)) drawPredict(ctx, t);
    if (t >= T.outro[0] - 1) drawOutro(ctx, t);
  },
}));
