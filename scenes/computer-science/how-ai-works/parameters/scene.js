import { W, H, CX, CY, C, FONT, fontsLoaded, glowDot, label, chapterTag, narration, LEAD } from '/runtime/kit.js';

const { clamp, lerp, range, easeInOut, easeOut, fadeWindow, rng } = Scene;

const fmt = (n) => Math.round(n).toLocaleString('en-US');

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio comes from `npm run narrate -- parameters`.
const TXT = {
  par1: 'A [[parameter]] is one adjustable number: a [[knob]] the model can turn.',
  par2: 'A large model has [[billions:electron]] of them, all set by [[training]].',
  sc1: 'A million seconds is about [[12 days:electron]]. A billion seconds is about [[32 years]].',
  sc2: '70 billion seconds is over [[2,000 years:proton]]: that is how many knobs need setting.',
  mem1: 'Each parameter takes [[2 bytes]], so 70 billion is [[140 gigabytes:proton]].',
  mem2: 'Too big for one laptop, so large models run on racks of [[GPUs:electron]].',
};
const { spoken, capEnd, cue, caption } = await narration('computer-science/how-ai-works/parameters', TXT);

// Timeline (seconds). Caption start times are relative to the start of each chapter.
const CS = { par1: 0.6, sc1: 0.6, mem1: 0.6 };
CS.par2 = capEnd('par1', CS.par1);
CS.sc2 = capEnd('sc1', CS.sc1);
CS.mem2 = capEnd('mem1', CS.mem1);
const LEN = {
  par: capEnd('par2', CS.par2) + 0.3,
  sc: capEnd('sc2', CS.sc2) + 0.3,
  mem: capEnd('mem2', CS.mem2) + 0.3,
};
const T = { title: [0, 4] };
T.par = [T.title[1], T.title[1] + LEN.par];
T.sc = [T.par[1], T.par[1] + LEN.sc];
T.mem = [T.sc[1], T.sc[1] + LEN.mem];
T.outro = [T.mem[1], T.mem[1] + (spoken('outro') ? 0.3 + spoken('outro') + 2.5 : 9)];
const AUDIO = [
  ...cue('par1', T.par[0] + CS.par1), ...cue('par2', T.par[0] + CS.par2),
  ...cue('sc1', T.sc[0] + CS.sc1), ...cue('sc2', T.sc[0] + CS.sc2),
  ...cue('mem1', T.mem[0] + CS.mem1), ...cue('mem2', T.mem[0] + CS.mem2),
  ...cue('outro', T.outro[0] + 0.3 - LEAD),
];
const DURATION = Math.ceil(T.outro[1] * 10) / 10;

// ---- helpers --------------------------------------------------------------
/** a rotary knob; v in 0..1 sets the pointer angle */
function knob(ctx, x, y, r, v, color, alpha = 1) {
  const ang = -Math.PI * 0.75 + v * Math.PI * 1.5 - Math.PI / 2;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = C.dim; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y, r * 1.28, -Math.PI * 1.25, Math.PI * 0.25); ctx.stroke(); // scale arc
  ctx.strokeStyle = color; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(x, y, r * 1.28, -Math.PI * 1.25, ang); ctx.stroke();       // value arc
  ctx.shadowColor = color; ctx.shadowBlur = 18;
  ctx.fillStyle = '#141c3a'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x + Math.cos(ang) * r * 0.25, y + Math.sin(ang) * r * 0.25); ctx.lineTo(x + Math.cos(ang) * r * 0.85, y + Math.sin(ang) * r * 0.85); ctx.stroke();
  ctx.restore();
}

function pill(ctx, x, y, w, h, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha * 0.86; ctx.fillStyle = C.bg;
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, 26); ctx.fill();
  ctx.restore();
}

// ---- state (deterministic) ------------------------------------------------
const COLS = 60, ROWS = 24;

function makeState() {
  const rand = rng(70);
  const glyphs = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = CX + (c - (COLS - 1) / 2) * 30, y = 520 + (r - (ROWS - 1) / 2) * 30;
      glyphs.push({ x, y, d: Math.hypot((x - CX) / 900, (y - 520) / 360), ph: rand() * 6.28, sp: 0.5 + rand() * 1.2, b: (r + c) % 3 });
    }
  }
  return { glyphs };
}

// ---- chapters -------------------------------------------------------------
function drawTitle(ctx, t, S) {
  const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
  // background: a faint field of knobs slowly turning
  for (const g of S.glyphs) {
    if (g.d > 1.1 || (g.ph * 10) % 3 > 1.2) continue;
    const v = 0.5 + 0.5 * Math.sin(t * g.sp + g.ph);
    const ang = -Math.PI * 0.75 + v * Math.PI * 1.5 - Math.PI / 2;
    ctx.save();
    ctx.globalAlpha = a * 0.22; ctx.strokeStyle = C.electron; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(g.x, g.y, 9, 0, Math.PI * 2);
    ctx.moveTo(g.x, g.y); ctx.lineTo(g.x + Math.cos(ang) * 9, g.y + Math.sin(ang) * 9); ctx.stroke();
    ctx.restore();
  }
  const rise = (1 - easeOut(range(t, 0.3, 1.5))) * 30;
  pill(ctx, CX, CY + 20, 1200, 420, a);
  label(ctx, 'What are billions', CX, CY - 50 + rise, { size: 104, weight: 700, alpha: a * range(t, 0.4, 1.3) });
  label(ctx, 'of parameters?', CX, CY + 70 + rise, { size: 104, weight: 700, alpha: a * range(t, 0.6, 1.5), color: C.electron });
  label(ctx, 'the knobs inside AI', CX, CY + 175 + rise, { size: 36, mono: true, weight: 500, color: C.gold, alpha: a * range(t, 1.3, 2.2) });
}

function drawParams(ctx, t, S) {
  const [a0, a1] = T.par, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.6, 0.6);
  chapterTag(ctx, '01', 'Parameters', a);

  // part 1: five knobs
  const toGrid = range(lt, CS.par2 + 0.2, CS.par2 + 1.0);
  const p1 = a * (1 - toGrid);
  if (p1 > 0) {
    for (let i = 0; i < 5; i++) {
      const k = easeOut(range(lt, 0.5 + i * 0.25, 1.1 + i * 0.25));
      const v = 0.5 + 0.4 * Math.sin(lt * 0.9 + i * 1.3);
      const x = CX + (i - 2) * 280;
      knob(ctx, x, 470, 76, v, C.electron, p1 * k);
      label(ctx, `w${i + 1}`, x, 600, { size: 30, mono: true, color: C.dim, alpha: p1 * k, weight: 500 });
      label(ctx, v.toFixed(2), x, 645, { size: 40, mono: true, color: C.gold, alpha: p1 * k, weight: 600 });
    }
    label(ctx, 'one parameter = one number', CX, 250, { size: 34, mono: true, color: C.dim, alpha: p1 * range(lt, 1.8, 2.6), weight: 500 });
  }

  // part 2: the same knobs, billions of times over
  const reveal = easeInOut(range(lt, CS.par2 + 0.2, CS.par2 + 2.6)) * 1.25;
  const p2 = a * range(lt, CS.par2, CS.par2 + 0.4);
  if (p2 > 0) {
    const cols = [C.electron, '#7fe4ff', '#3fb8e0'];
    for (let b = 0; b < 3; b++) {
      ctx.save();
      ctx.globalAlpha = p2 * 0.75; ctx.strokeStyle = cols[b]; ctx.lineWidth = 2;
      ctx.beginPath();
      for (const g of S.glyphs) {
        if (g.b !== b || g.d > reveal) continue;
        const ang = -Math.PI * 0.75 + (0.5 + 0.5 * Math.sin(lt * g.sp + g.ph)) * Math.PI * 1.5 - Math.PI / 2;
        ctx.moveTo(g.x + 9, g.y); ctx.arc(g.x, g.y, 9, 0, Math.PI * 2);
        ctx.moveTo(g.x, g.y); ctx.lineTo(g.x + Math.cos(ang) * 9, g.y + Math.sin(ang) * 9);
      }
      ctx.stroke();
      ctx.restore();
    }
    const cnt = range(lt, CS.par2 + LEAD, CS.par2 + LEAD + (spoken('par2') ?? 4) * 0.8);
    const n = Math.pow(10, lerp(0.7, 10.85, easeOut(cnt)));
    pill(ctx, CX, 520, 1180, 190, p2 * range(lt, CS.par2 + LEAD - 0.2, CS.par2 + LEAD + 0.4));
    label(ctx, fmt(n), CX, 500, { size: 96, mono: true, weight: 600, color: C.gold, alpha: p2 * range(lt, CS.par2 + LEAD, CS.par2 + LEAD + 0.5) });
    label(ctx, 'parameters  ·  each dial is a knob', CX, 585, { size: 28, mono: true, color: C.dim, alpha: p2 * range(lt, CS.par2 + LEAD, CS.par2 + LEAD + 0.5), weight: 500 });
  }

  caption(ctx, 'par1', a, lt, CS.par1);
  caption(ctx, 'par2', a, lt, CS.par2);
}

const SECONDS = [
  { name: '1 million seconds', unit: '≈ 12 days', logv: 1.06, color: C.electron },
  { name: '1 billion seconds', unit: '≈ 32 years', logv: 4.06, color: C.gold },
  { name: '70 billion seconds', unit: '≈ 2,200 years', logv: 5.91, color: C.proton },
];

function drawScale(ctx, t) {
  const [a0, a1] = T.sc, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.6, 0.6);
  chapterTag(ctx, '02', 'How big is a billion?', a);
  const x0 = 620, scale = 140;
  const at = [CS.sc1 + LEAD + 0.6, CS.sc1 + LEAD + (spoken('sc1') ?? 5) * 0.55, CS.sc2 + LEAD + 0.5];
  label(ctx, 'time it would take to count them, one per second (log scale)', CX, 215, { size: 26, mono: true, color: C.dim, alpha: a * range(lt, 0.3, 1), weight: 500 });
  SECONDS.forEach((s, i) => {
    const y = 360 + i * 140;
    const k = easeOut(range(lt, at[i], at[i] + 1.2));
    const w = Math.max(6, s.logv * scale * k);
    label(ctx, s.name, x0 - 30, y, { size: 34, weight: 600, color: C.text, alpha: a * range(lt, at[i], at[i] + 0.5), align: 'right' });
    ctx.save();
    ctx.globalAlpha = a * range(lt, at[i], at[i] + 0.4);
    ctx.fillStyle = s.color; ctx.shadowColor = s.color; ctx.shadowBlur = i === 2 ? 26 : 0;
    ctx.beginPath(); ctx.roundRect(x0, y - 34, w, 68, 12); ctx.fill();
    ctx.restore();
    label(ctx, s.unit, x0 + w + 24, y, { size: 44, mono: true, weight: 600, color: s.color, alpha: a * range(lt, at[i] + 0.9, at[i] + 1.5), align: 'left' });
  });
  caption(ctx, 'sc1', a, lt, CS.sc1);
  caption(ctx, 'sc2', a, lt, CS.sc2);
}

function drawMemory(ctx, t) {
  const [a0, a1] = T.mem, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.6, 0.6);
  chapterTag(ctx, '03', 'The memory bill', a);
  const x0 = 560, scale = 6.6; // px per GB

  const eq = range(lt, CS.mem1 + LEAD + 0.8, CS.mem1 + LEAD + 1.6);
  label(ctx, '70,000,000,000  ×  2 bytes  =  140 GB', CX, 235, { size: 44, mono: true, weight: 600, color: C.gold, alpha: a * eq });

  const rows = [
    { name: 'laptop memory', gb: 16, color: C.dim, y: 360, at: CS.mem2 + LEAD + 0.2 },
    { name: 'one big GPU', gb: 80, color: C.electron, y: 470, at: CS.mem2 + LEAD + 0.9 },
    { name: '70B-parameter model', gb: 140, color: C.gold, y: 600, at: CS.mem1 + LEAD + 1.8 },
  ];
  rows.forEach((r) => {
    const k = easeOut(range(lt, r.at, r.at + 1.0));
    label(ctx, r.name, x0 - 26, r.y, { size: 32, weight: 600, alpha: a * range(lt, r.at, r.at + 0.4), align: 'right' });
    ctx.save();
    ctx.globalAlpha = a * range(lt, r.at, r.at + 0.4);
    ctx.fillStyle = r.color; ctx.shadowColor = r.color; ctx.shadowBlur = r.gb === 140 ? 24 : 0;
    ctx.beginPath(); ctx.roundRect(x0, r.y - 30, Math.max(6, r.gb * scale * k), 60, 10); ctx.fill();
    ctx.restore();
    label(ctx, `${r.gb} GB`, x0 + r.gb * scale * k + 20, r.y, { size: 34, mono: true, weight: 600, alpha: a * range(lt, r.at + 0.6, r.at + 1.2), align: 'left', color: r.color === C.dim ? C.text : r.color });
  });

  // the model does not fit in one GPU: show the limit and the second GPU it spills into
  const spill = range(lt, CS.mem2 + LEAD + 2.6, CS.mem2 + LEAD + 3.4);
  ctx.save();
  ctx.globalAlpha = a * spill; ctx.strokeStyle = C.proton; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
  ctx.beginPath(); ctx.moveTo(x0 + 80 * scale, 545); ctx.lineTo(x0 + 80 * scale, 660); ctx.stroke();
  ctx.restore();
  label(ctx, 'does not fit in one GPU', x0 + 80 * scale + 16, 690, { size: 26, mono: true, color: C.proton, alpha: a * spill, align: 'left', weight: 500 });

  const gpuK = range(lt, CS.mem2 + LEAD + (spoken('mem2') ?? 5) * 0.6, CS.mem2 + LEAD + (spoken('mem2') ?? 5) * 0.6 + 0.8);
  for (let i = 0; i < 2; i++) {
    const gx = CX - 170 + i * 340;
    ctx.save();
    ctx.globalAlpha = a * gpuK; ctx.strokeStyle = C.electron; ctx.fillStyle = 'rgba(77,216,255,0.10)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(gx - 150, 745, 300, 70, 12); ctx.fill(); ctx.stroke();
    ctx.restore();
    label(ctx, `GPU ${i + 1}  ·  80 GB`, gx, 780, { size: 28, mono: true, weight: 600, alpha: a * gpuK });
  }

  caption(ctx, 'mem1', a, lt, CS.mem1);
  caption(ctx, 'mem2', a, lt, CS.mem2);
}

function drawOutro(ctx, t) {
  const [a0, a1] = T.outro, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.7, 0.8);
  const sp = spoken('outro') ?? 8;
  label(ctx, 'more parameters = more room for patterns', CX, CY - 190, { size: 38, mono: true, weight: 500, color: C.dim, alpha: a * range(lt, 0.4, 1.2) });
  label(ctx, 'but good data and training matter too', CX, CY - 135, { size: 38, mono: true, weight: 500, color: C.dim, alpha: a * range(lt, 2.2, 3.0) });
  const big = LEAD + sp * 0.62;
  label(ctx, 'Billions of knobs,', CX, CY + 10, { size: 96, weight: 700, color: C.electron, alpha: a * range(lt, big, big + 0.8) });
  label(ctx, 'tuned by learning.', CX, CY + 130, { size: 96, weight: 700, color: C.gold, alpha: a * range(lt, big + 1.0, big + 1.8) });
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
    if (on(T.par)) drawParams(ctx, t, S);
    if (on(T.sc)) drawScale(ctx, t);
    if (on(T.mem)) drawMemory(ctx, t);
    if (t >= T.outro[0] - 1) drawOutro(ctx, t);
  },
}));
