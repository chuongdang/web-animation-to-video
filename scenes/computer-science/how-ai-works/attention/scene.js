import { W, H, CX, CY, C, FONT, MONO, fontsLoaded, glowDot, label, chapterTag, narration, LEAD } from '/runtime/kit.js';

const { clamp, lerp, range, easeInOut, easeOut, fadeWindow, rng } = Scene;

const POS = C.gold, NEG = '#b48cff';
const TINTS = [C.electron, C.gold, C.proton, NEG, C.copper];

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio comes from `npm run narrate -- attention`.
const TXT = {
  tok1: 'Text is chopped into [[tokens]], and each token becomes a list of numbers: an [[embedding]].',
  tok2: 'Words with similar meanings get [[similar numbers]], so [[cat:electron]] lands near [[dog:electron]].',
  att1: 'To read a word, the model looks at every other word and decides which ones [[matter]].',
  att2: 'That is [[attention]]: "it" points to [[animal]], but change the ending and it points to [[street]].',
  stack1: 'Dozens of stacked [[layers]] refine the meaning of every word.',
  stack2: 'At the top, it scores the [[next token:electron]], and the loop starts again.',
};
const { spoken, capEnd, cue, caption } = await narration('computer-science/how-ai-works/attention', TXT);

// Timeline (seconds). Caption start times are relative to the start of each chapter.
const CS = { tok1: 0.6, att1: 0.6, stack1: 0.6 };
CS.tok2 = capEnd('tok1', CS.tok1);
CS.att2 = capEnd('att1', CS.att1);
CS.stack2 = capEnd('stack1', CS.stack1);
const LEN = {
  tok: capEnd('tok2', CS.tok2) + 0.3,
  att: capEnd('att2', CS.att2) + 0.3,
  stack: capEnd('stack2', CS.stack2) + 0.3,
};
const T = { title: [0, 4] };
T.tok = [T.title[1], T.title[1] + LEN.tok];
T.att = [T.tok[1], T.tok[1] + LEN.att];
T.stack = [T.att[1], T.att[1] + LEN.stack];
T.outro = [T.stack[1], T.stack[1] + (spoken('outro') ? 0.3 + spoken('outro') + 2.5 : 8)];
const AUDIO = [
  ...cue('tok1', T.tok[0] + CS.tok1), ...cue('tok2', T.tok[0] + CS.tok2),
  ...cue('att1', T.att[0] + CS.att1), ...cue('att2', T.att[0] + CS.att2),
  ...cue('stack1', T.stack[0] + CS.stack1), ...cue('stack2', T.stack[0] + CS.stack2),
  ...cue('outro', T.outro[0] + 0.3 - LEAD),
];
const DURATION = Math.ceil(T.outro[1] * 10) / 10;

// ---- helpers --------------------------------------------------------------
function chip(ctx, text, x, y, { color = C.electron, size = 44, alpha = 1, w = null, weight = 500 } = {}) {
  ctx.save();
  ctx.font = `${weight} ${size}px ${FONT}`;
  const tw = ctx.measureText(text).width;
  const cw = w ?? tw + 36;
  ctx.globalAlpha = alpha * 0.14; ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(x, y - size * 0.85, cw, size * 1.7, 14); ctx.fill();
  ctx.globalAlpha = alpha * 0.8; ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.globalAlpha = alpha; ctx.fillStyle = C.text; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  ctx.fillText(text, x + cw / 2, y);
  ctx.restore();
  return cw;
}
const measure = (ctx, text, size, weight = 500, family = FONT) => {
  ctx.save(); ctx.font = `${weight} ${size}px ${family}`; const w = ctx.measureText(text).width; ctx.restore();
  return w;
};

// ---- state (deterministic) ------------------------------------------------
const TOKENS = ['Cats', 'are', 'un', 'believ', 'ably', 'clever', '.'];
const IDS = [17402, 527, 1652, 41056, 1291, 23611, 13];
const SENT = ['The', 'animal', "didn't", 'cross', 'the', 'street', 'because', 'it', 'was', 'too'];
// attention of "it" (index 7) towards each earlier/later word
const ATT_TIRED = [0.02, 0.58, 0.03, 0.05, 0.02, 0.12, 0.04, 0, 0.02, 0.03, 0.09];
const ATT_WIDE = [0.02, 0.14, 0.03, 0.05, 0.02, 0.55, 0.04, 0, 0.03, 0.05, 0.07];
const UNIFORM = ATT_TIRED.map((_, i) => (i === 7 ? 0 : 0.1));
const MAP = [
  { word: 'cat', x: -300, y: -100, g: 0 }, { word: 'dog', x: -190, y: -160, g: 0 },
  { word: 'kitten', x: -360, y: -190, g: 0 }, { word: 'puppy', x: -250, y: -30, g: 0 },
  { word: 'apple', x: 230, y: -150, g: 1 }, { word: 'banana', x: 330, y: -80, g: 1 }, { word: 'orange', x: 190, y: -40, g: 1 },
  { word: 'car', x: -70, y: 150, g: 2 }, { word: 'truck', x: 60, y: 200, g: 2 }, { word: 'bus', x: -150, y: 210, g: 2 },
];
const GROUPS = [{ color: C.electron, cx: -290, cy: -110 }, { color: C.gold, cx: 250, cy: -90 }, { color: C.proton, cx: -50, cy: 190 }];
const NEXT = [['tired', 47], ['wide', 31], ['cold', 12], ['big', 6], ['late', 4]];

function makeState() {
  const rand = rng(77);
  const floaters = Array.from({ length: 22 }, () => ({
    text: ['the', 'un', 'believ', 'able', 'cat', 'ing', 'is', 'AI', 'read', 'token', 'a', 'er'][Math.floor(rand() * 12)],
    x: rand() * W, y: rand() * H, vx: 10 + rand() * 30, size: 28 + rand() * 20, c: TINTS[Math.floor(rand() * TINTS.length)],
  }));
  const vecs = TOKENS.map(() => Array.from({ length: 8 }, () => rand() * 2 - 1));
  // stack mesh
  const cols = 7, layers = 6;
  const mesh = [];
  for (let L = 0; L < layers - 1; L++) for (let a = 0; a < cols; a++) for (let b = 0; b < cols; b++) if (rand() > 0.55) mesh.push({ L, a, b, w: rand() });
  return { floaters, vecs, mesh, cols, layers };
}

// ---- chapters -------------------------------------------------------------
function drawTitle(ctx, t, S) {
  const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
  for (const f of S.floaters) {
    const x = ((f.x + f.vx * t) % (W + 300)) - 150;
    chip(ctx, f.text, x, f.y, { color: f.c, size: f.size, alpha: a * 0.13 });
  }
  const rise = (1 - easeOut(range(t, 0.3, 1.5))) * 30;
  label(ctx, 'How does AI', CX, CY - 70 + rise, { size: 116, weight: 700, alpha: a * range(t, 0.4, 1.3) });
  label(ctx, 'read a sentence?', CX, CY + 60 + rise, { size: 116, weight: 700, alpha: a * range(t, 0.6, 1.5), color: C.electron });
  label(ctx, 'tokens, embeddings and attention', CX, CY + 175 + rise, { size: 36, mono: true, weight: 500, color: C.gold, alpha: a * range(t, 1.3, 2.2) });
}

function drawTokens(ctx, t, S) {
  const [a0, a1] = T.tok, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.6, 0.6);
  chapterTag(ctx, '01', 'Tokens and embeddings', a);

  // ---- part 1: text -> tokens -> ids -> vectors
  const p1 = a * (1 - range(lt, CS.tok2 - 0.4, CS.tok2 + 0.2));
  if (p1 > 0) {
    const size = 60, y = 330, gap = 18;
    const split = easeInOut(range(lt, 2.2, 3.0));
    const widths = TOKENS.map((tk) => measure(ctx, tk, size) + 36);
    const total = widths.reduce((n, w) => n + w, 0) + gap * (TOKENS.length - 1);
    const rawW = measure(ctx, 'Cats are unbelievably clever.', size);
    let x = CX - total / 2;
    const idAt = 3.4, embAt = CS.tok1 + LEAD + (spoken('tok1') ?? 5) * 0.6;
    TOKENS.forEach((tk, i) => {
      const cx = x + widths[i] / 2;
      chip(ctx, tk, x, y, { color: TINTS[i % TINTS.length], size, alpha: p1 * split, w: widths[i] });
      const ik = range(lt, idAt + i * 0.12, idAt + i * 0.12 + 0.5);
      label(ctx, String(IDS[i]), cx, y + 90, { size: 30, mono: true, color: C.dim, alpha: p1 * ik, weight: 500 });
      const ek = range(lt, embAt + i * 0.1, embAt + i * 0.1 + 0.5);
      S.vecs[i].forEach((v, r) => {
        ctx.save();
        ctx.globalAlpha = p1 * ek * (0.15 + 0.85 * Math.abs(v));
        ctx.fillStyle = v >= 0 ? POS : NEG;
        ctx.beginPath(); ctx.roundRect(cx - 34, y + 150 + r * 34, 68, 26, 6); ctx.fill();
        ctx.restore();
      });
      x += widths[i] + gap;
    });
    // raw sentence, before it is split
    label(ctx, 'Cats are unbelievably clever.', CX, y, { size, weight: 500, alpha: p1 * (1 - split) * range(lt, 0.6, 1.4) });
    label(ctx, 'token IDs', CX - total / 2 - 30, y + 90, { size: 24, mono: true, color: C.dim, alpha: p1 * range(lt, idAt, idAt + 0.6), align: 'right', weight: 500 });
    label(ctx, 'embedding', CX - total / 2 - 30, y + 280, { size: 24, mono: true, color: C.dim, alpha: p1 * range(lt, embAt, embAt + 0.6), align: 'right', weight: 500 });
    label(ctx, '0.4  −0.9  0.1  0.7  …', CX, y + 440, { size: 26, mono: true, color: C.dim, alpha: p1 * range(lt, embAt + 0.6, embAt + 1.2), weight: 500 });
    void rawW;
  }

  // ---- part 2: similar meanings sit close together
  const p2 = a * range(lt, CS.tok2, CS.tok2 + 0.6);
  if (p2 > 0) {
    const ox = CX, oy = 500;
    label(ctx, 'embedding space (a 2-D slice)', ox, 215, { size: 26, mono: true, color: C.dim, alpha: p2, weight: 500 });
    GROUPS.forEach((g, i) => {
      const k = easeOut(range(lt, CS.tok2 + 0.8 + i * 0.4, CS.tok2 + 1.8 + i * 0.4));
      const grad = ctx.createRadialGradient(ox + g.cx, oy + g.cy, 10, ox + g.cx, oy + g.cy, 150);
      grad.addColorStop(0, g.color + '33'); grad.addColorStop(1, g.color + '00');
      ctx.save(); ctx.globalAlpha = p2 * k; ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(ox + g.cx, oy + g.cy, 150, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });
    MAP.forEach((m, i) => {
      const k = easeOut(range(lt, CS.tok2 + 0.6 + i * 0.18, CS.tok2 + 1.2 + i * 0.18));
      const color = GROUPS[m.g].color;
      glowDot(ctx, ox + m.x, oy + m.y, 10 * k, color, p2);
      label(ctx, m.word, ox + m.x + 18, oy + m.y - 22, { size: 30, mono: true, color: C.text, alpha: p2 * k, align: 'left', weight: 500 });
    });
    const near = range(lt, CS.tok2 + LEAD + (spoken('tok2') ?? 5) * 0.7, CS.tok2 + LEAD + (spoken('tok2') ?? 5) * 0.7 + 0.8);
    if (near > 0) {
      const c = MAP[0], d = MAP[1];
      ctx.save();
      ctx.globalAlpha = p2 * near; ctx.strokeStyle = C.gold; ctx.lineWidth = 4; ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.moveTo(ox + c.x, oy + c.y); ctx.lineTo(ox + d.x, oy + d.y); ctx.stroke();
      ctx.restore();
      label(ctx, 'close', ox + (c.x + d.x) / 2 + 40, oy + (c.y + d.y) / 2 - 22, { size: 28, mono: true, color: C.gold, alpha: p2 * near, weight: 600 });
    }
  }

  caption(ctx, 'tok1', a, lt, CS.tok1);
  caption(ctx, 'tok2', a, lt, CS.tok2);
}

function drawAttention(ctx, t) {
  const [a0, a1] = T.att, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.6, 0.6);
  chapterTag(ctx, '02', 'Attention', a);

  const swapAt = CS.att2 + LEAD + (spoken('att2') ?? 5) * 0.55;
  const m = easeInOut(range(lt, swapAt, swapAt + 1.2));
  const sharpen = easeInOut(range(lt, CS.att2 + LEAD - 0.2, CS.att2 + LEAD + 1.0));
  const arcsOn = range(lt, CS.att1 + 1.6, CS.att1 + 2.4);

  const words = [...SENT, m < 0.5 ? 'tired' : 'wide', '.'];
  const size = 44, gap = 28, y = 650;
  const widths = words.map((wd) => measure(ctx, wd, size));
  const gapAfter = (i) => (words[i + 1] === '.' ? 4 : gap);
  const total = widths.reduce((n, w, i) => n + w + (i < words.length - 1 ? gapAfter(i) : 0), 0);
  const pos = [];
  let x = CX - total / 2;
  words.forEach((wd, i) => { pos.push({ x, cx: x + widths[i] / 2, w: widths[i] }); x += widths[i] + gapAfter(i); });

  const wts = words.map((_, i) => lerp(lerp(UNIFORM[i] ?? 0, ATT_TIRED[i] ?? 0, sharpen), ATT_WIDE[i] ?? 0, m));
  const src = pos[7];

  // arcs from "it"
  words.forEach((wd, i) => {
    if (i === 7) return;
    const w = wts[i];
    const dx = pos[i].cx - src.cx;
    const rise = Math.min(330, 70 + Math.abs(dx) * 0.42);
    ctx.save();
    ctx.globalAlpha = a * arcsOn * (0.18 + 0.82 * Math.min(1, w * 2.2));
    ctx.strokeStyle = C.gold; ctx.shadowColor = C.gold; ctx.shadowBlur = w > 0.3 ? 22 : 0;
    ctx.lineWidth = 2 + 26 * w;
    ctx.beginPath(); ctx.moveTo(src.cx, y - 40); ctx.quadraticCurveTo((src.cx + pos[i].cx) / 2, y - 40 - rise * 2, pos[i].cx, y - 40); ctx.stroke();
    ctx.restore();
    if (w >= 0.1) label(ctx, `${Math.round(w * 100)}%`, pos[i].cx - 40, y - 74, { size: 28, mono: true, color: C.gold, alpha: a * arcsOn * sharpen, weight: 600 });
  });

  words.forEach((wd, i) => {
    const strong = wts[i] > 0.3;
    label(ctx, wd, pos[i].x, y, { size, weight: i === 7 || strong ? 700 : 500, align: 'left', alpha: a * range(lt, 0.3 + i * 0.05, 0.9 + i * 0.05), color: i === 7 ? C.electron : strong ? C.gold : C.text });
  });
  ctx.save();
  ctx.globalAlpha = a * arcsOn; ctx.fillStyle = C.electron;
  ctx.fillRect(src.x, y + 34, src.w, 5);
  ctx.restore();
  label(ctx, 'which word does "it" mean?', CX, 200, { size: 28, mono: true, color: C.dim, alpha: a * range(lt, 1, 1.8), weight: 500 });

  caption(ctx, 'att1', a, lt, CS.att1);
  caption(ctx, 'att2', a, lt, CS.att2);
}

function drawStack(ctx, t, S) {
  const [a0, a1] = T.stack, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.6, 0.6);
  chapterTag(ctx, '03', 'Stacking layers', a);
  const { cols, layers } = S;
  const X = (c) => 330 + c * 130, Y = (L) => 720 - L * 85;
  const words = ['cross', 'the', 'street', 'because', 'it', 'was', 'too'];

  for (let L = 0; L < layers; L++) {
    const show = range(lt, 0.3 + L * 0.25, 0.9 + L * 0.25);
    ctx.save();
    ctx.globalAlpha = a * show * 0.6;
    ctx.fillStyle = 'rgba(77,216,255,0.05)'; ctx.strokeStyle = 'rgba(77,216,255,0.25)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(X(0) - 70, Y(L) - 30, X(cols - 1) - X(0) + 140, 60, 16); ctx.fill(); ctx.stroke();
    ctx.restore();
    label(ctx, `layer ${L + 1}`, X(0) - 90, Y(L), { size: 24, mono: true, color: C.dim, alpha: a * show, align: 'right', weight: 500 });
  }
  label(ctx, '⋮  × dozens of layers', X(cols - 1) + 100, Y(0), { size: 26, mono: true, color: C.dim, alpha: a * range(lt, 2, 2.8), align: 'left', weight: 500 });

  for (const e of S.mesh) {
    const show = range(lt, 0.6 + e.L * 0.25, 1.2 + e.L * 0.25);
    ctx.save();
    ctx.globalAlpha = a * show * (0.05 + 0.2 * e.w);
    ctx.strokeStyle = C.gold; ctx.lineWidth = 1 + 2 * e.w;
    ctx.beginPath(); ctx.moveTo(X(e.a), Y(e.L)); ctx.lineTo(X(e.b), Y(e.L + 1)); ctx.stroke();
    ctx.restore();
  }
  for (let c = 0; c < cols; c++) {
    for (let L = 0; L < layers; L++) {
      const p = (lt * 0.9 + c * 0.35) % (layers + 2) - 0.5;
      const act = clamp(1 - Math.abs(p - L), 0, 1);
      const show = range(lt, 0.3 + L * 0.25, 0.9 + L * 0.25);
      glowDot(ctx, X(c), Y(L), 11 + 3 * act, C.electron, a * show * (0.35 + 0.65 * act));
    }
    chip(ctx, words[c], X(c) - 55, 810, { size: 25, alpha: a * range(lt, 0.2, 0.8), w: 110, color: TINTS[c % TINTS.length] });
  }

  // next-token scores
  const k = range(lt, CS.stack2 + LEAD, CS.stack2 + LEAD + 0.8);
  const tx = X(cols - 1), ty = Y(layers - 1);
  ctx.save();
  ctx.globalAlpha = a * k * 0.8; ctx.strokeStyle = C.gold; ctx.lineWidth = 4; ctx.setLineDash([10, 8]);
  ctx.beginPath(); ctx.moveTo(tx + 20, ty - 10); ctx.bezierCurveTo(tx + 200, ty - 60, 1200, 260, 1290, 320); ctx.stroke();
  ctx.restore();
  glowDot(ctx, tx, ty, 16, C.gold, a * k);
  label(ctx, '"…because it was too ___"', 1290, 260, { size: 26, mono: true, color: C.dim, alpha: a * k, align: 'left', weight: 500 });
  NEXT.forEach(([word, pct], i) => {
    const y = 340 + i * 74;
    const grow = easeOut(range(lt, CS.stack2 + LEAD + 0.4 + i * 0.12, CS.stack2 + LEAD + 1.1 + i * 0.12));
    label(ctx, word, 1400, y, { size: 36, mono: true, weight: 500, alpha: a * grow, align: 'right', color: i === 0 ? C.gold : C.text });
    ctx.save();
    ctx.globalAlpha = a * grow; ctx.fillStyle = i === 0 ? C.gold : C.electron;
    ctx.beginPath(); ctx.roundRect(1425, y - 20, Math.max(4, pct * 6.5 * grow), 40, 8); ctx.fill();
    ctx.restore();
    label(ctx, `${Math.round(pct * grow)}%`, 1425 + pct * 6.5 * grow + 16, y, { size: 28, mono: true, alpha: a * grow, align: 'left', weight: 600 });
  });

  caption(ctx, 'stack1', a, lt, CS.stack1);
  caption(ctx, 'stack2', a, lt, CS.stack2);
}

function drawOutro(ctx, t) {
  const [a0, a1] = T.outro, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.7, 0.8);
  const items = [
    { text: 'Tokens in', color: C.electron, at: 0.4 },
    { text: 'Attention across them', color: C.gold, at: 1.5 },
    { text: 'One next word out', color: C.proton, at: 3.0 },
  ];
  const size = 54, gap = 110;
  const widths = items.map((it) => measure(ctx, it.text, size, 700));
  let x = CX - (widths.reduce((n, w) => n + w, 0) + gap * (items.length - 1)) / 2;
  items.forEach((it, i) => {
    const k = range(lt, it.at, it.at + 0.7);
    label(ctx, it.text, x, CY - 30 + (1 - easeOut(k)) * 24, { size, weight: 700, color: it.color, alpha: a * k, align: 'left' });
    if (i < items.length - 1) label(ctx, '→', x + widths[i] + gap / 2, CY - 30, { size: 52, color: C.dim, alpha: a * range(lt, items[i + 1].at, items[i + 1].at + 0.7), weight: 500 });
    x += widths[i] + gap;
  });
  label(ctx, '↻  repeat, and you get a conversation', CX, CY + 100, { size: 38, mono: true, weight: 500, color: C.dim, alpha: a * range(lt, 4.4, 5.2) });
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
    if (on(T.tok)) drawTokens(ctx, t, S);
    if (on(T.att)) drawAttention(ctx, t);
    if (on(T.stack)) drawStack(ctx, t, S);
    if (t >= T.outro[0] - 1) drawOutro(ctx, t);
  },
}));
