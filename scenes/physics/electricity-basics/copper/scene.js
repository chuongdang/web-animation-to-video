import { W, H, CX, CY, C, fontsLoaded, glowDot, label, chapterTag, charge, narration, LEAD, LANG } from '/runtime/kit.js';

const { lerp, range, easeInOut, easeOut, fadeWindow, rng } = Scene;

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio comes from `npm run narrate -- copper`
// (add `--lang vi` for the Vietnamese narration; the page picks the language from ?lang=vi).
const STR = {
  en: {
    txt: {
      cu1: 'A [[copper:copper]] atom has [[29 electrons:electron]], but only [[one]] in its outer shell.',
      cu2: 'That lone electron is [[weakly bound]], so it is easy to [[pull free]].',
      sea1: 'In solid copper, every atom shares its electron, forming a [[sea of free electrons:electron]].',
      sea2: 'About [[one free electron per atom]]: a huge number of [[charge carriers]].',
      comp1: 'In [[rubber]], electrons stay [[bound]] to their atoms, so nothing flows.',
      comp2: 'In [[copper:copper]], electrons drift through a tidy [[lattice]] with [[few collisions]].',
      rank1: 'Only [[silver]] beats it, but [[copper:copper]] is cheaper and easy to draw into [[wire]].',
    },
    copperWord: 'copper', title: ['Why is copper', 'a good conductor?'], subtitle: 'the free-electron story',
    chapters: ['The copper atom', 'Solid copper', 'Conductor vs insulator', 'How good is it?'],
    outerE: 'outer electron', freeE: 'free electron', shells: 'Cu  ·  Z = 29  ·  shells 2 · 8 · 18 · 1',
    sea: 'sea of free electrons', density: '≈ 8.5 × 10²⁸ free electrons per m³',
    field: 'electric field  →', currentBig: 'current: large', currentZero: 'current: ≈ 0',
    rubber: 'rubber (insulator)', rankTitle: "electrical conductivity, % of copper's (approx.)",
    metals: { silver: 'Silver', copper: 'Copper', gold: 'Gold', aluminium: 'Aluminium', iron: 'Iron' },
    outro: ['Lots of free electrons,', 'flowing through an orderly lattice.'],
  },
  vi: {
    txt: {
      cu1: 'Một nguyên tử [[đồng:copper]] có [[29 electron:electron]], nhưng chỉ có [[một]] electron ở lớp ngoài cùng.',
      cu2: 'Electron đơn lẻ đó [[liên kết yếu]], nên rất dễ [[bị kéo ra]].',
      sea1: 'Trong đồng đặc, mỗi nguyên tử đều chia sẻ electron của mình, tạo thành một [[biển electron tự do:electron]].',
      sea2: 'Khoảng [[một electron tự do trên mỗi nguyên tử]]: một lượng khổng lồ [[hạt mang điện]].',
      comp1: 'Trong [[cao su]], các electron bị [[giữ chặt]] vào nguyên tử, nên không có gì chảy.',
      comp2: 'Trong [[đồng:copper]], các electron trôi qua một [[mạng tinh thể]] ngăn nắp, với [[rất ít va chạm]].',
      rank1: 'Chỉ có [[bạc]] dẫn điện tốt hơn, nhưng [[đồng:copper]] rẻ hơn và dễ kéo thành [[dây]].',
    },
    copperWord: 'đồng', title: ['Vì sao đồng', 'dẫn điện tốt?'], subtitle: 'câu chuyện về electron tự do',
    chapters: ['Nguyên tử đồng', 'Đồng đặc', 'Chất dẫn điện và cách điện', 'Tốt đến mức nào?'],
    outerE: 'electron ngoài cùng', freeE: 'electron tự do', shells: 'Cu  ·  Z = 29  ·  các lớp 2 · 8 · 18 · 1',
    sea: 'biển electron tự do', density: '≈ 8,5 × 10²⁸ electron tự do trên m³',
    field: 'điện trường  →', currentBig: 'dòng điện: lớn', currentZero: 'dòng điện: ≈ 0',
    rubber: 'cao su (cách điện)', rankTitle: 'độ dẫn điện, % so với đồng (xấp xỉ)',
    metals: { silver: 'Bạc', copper: 'Đồng', gold: 'Vàng', aluminium: 'Nhôm', iron: 'Sắt' },
    outro: ['Nhiều electron tự do,', 'chảy qua một mạng tinh thể ngăn nắp.'],
  },
}[LANG || 'en'];
const TXT = STR.txt;
const { spoken, capEnd, cue, caption } = await narration('physics/electricity-basics/copper', TXT);

// Timeline (seconds). Caption start times are relative to the start of each chapter.
const CS = { cu1: 0.6, sea1: 0.6, comp1: 0.6, rank1: 0.6 };
CS.cu2 = capEnd('cu1', CS.cu1);
CS.sea2 = capEnd('sea1', CS.sea1);
CS.comp2 = capEnd('comp1', CS.comp1);
const LEN = {
  shells: capEnd('cu2', CS.cu2) + 0.3,
  sea: capEnd('sea2', CS.sea2) + 0.3,
  compare: capEnd('comp2', CS.comp2) + 0.3,
  rank: capEnd('rank1', CS.rank1) + 0.3,
};
const T = { title: [0, 4] };
T.shells = [T.title[1], T.title[1] + LEN.shells];
T.sea = [T.shells[1], T.shells[1] + LEN.sea];
T.compare = [T.sea[1], T.sea[1] + LEN.compare];
T.rank = [T.compare[1], T.compare[1] + LEN.rank];
T.outro = [T.rank[1], T.rank[1] + (spoken('outro') ? 0.3 + spoken('outro') + 2.5 : 7)];
const AUDIO = [
  ...cue('cu1', T.shells[0] + CS.cu1), ...cue('cu2', T.shells[0] + CS.cu2),
  ...cue('sea1', T.sea[0] + CS.sea1), ...cue('sea2', T.sea[0] + CS.sea2),
  ...cue('comp1', T.compare[0] + CS.comp1), ...cue('comp2', T.compare[0] + CS.comp2),
  ...cue('rank1', T.rank[0] + CS.rank1),
  ...cue('outro', T.outro[0] + 0.3 - LEAD),
];
const DURATION = Math.ceil(T.outro[1] * 10) / 10;

// ---- state (deterministic) ------------------------------------------------
function makeState() {
  const rand = rng(29);
  const sparks = Array.from({ length: 60 }, () => ({
    x: rand() * W, y: rand() * H, r: 2 + rand() * 4, sp: 0.2 + rand() * 0.6, ph: rand() * 6.28,
  }));

  // copper atom: electron shells 2 / 8 / 18 / 1
  const shells = [
    { r: 68, n: 2, w: 1.5 }, { r: 126, n: 8, w: 1.0 }, { r: 196, n: 18, w: 0.65 }, { r: 300, n: 1, w: 0.45 },
  ];

  // solid copper: ions on a lattice, one free electron per ion
  const ions = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) ions.push({ x: 400 + c * 185 + (r % 2) * 92, y: 300 + r * 135 });
  const sea = ions.map((ion) => ({
    ion,
    bw: 2 + rand() * 1.5, bp: rand() * 6.28, // bound orbit
    bx: 340 + rand() * 1240, by: 250 + rand() * 500,
    ax: 30 + rand() * 60, ay: 30 + rand() * 50,
    f1: 0.6 + rand() * 1.4, f2: 1.1 + rand() * 2.2, f3: 0.7 + rand() * 1.5, f4: 1.3 + rand() * 2.1,
    p1: rand() * 6.28, p2: rand() * 6.28, p3: rand() * 6.28, p4: rand() * 6.28,
  }));

  // compare panels: 5 x 3 atoms; copper gets free electrons in the lanes between rows
  const grid = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) grid.push({ x: 90 + c * 150, y: 100 + r * 120 });
  const lanes = Array.from({ length: 16 }, (_, i) => ({
    lane: i % 2, base: (i >> 1) * (780 / 8) + rand() * 30, jp: rand() * 6.28, jf: 2 + rand() * 3,
  }));
  const orbit = grid.map(() => ({ p: rand() * 6.28, w: 2.5 + rand() * 1.5 }));

  return { sparks, shells, ions, sea, grid, lanes, orbit };
}

// ---- chapters -------------------------------------------------------------
function drawTitle(ctx, t, S) {
  const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
  for (const p of S.sparks) {
    glowDot(ctx, (p.x + t * 50 * p.sp) % W, p.y + Math.sin(t * p.sp * 2 + p.ph) * 20, p.r, C.copper, a * 0.3);
  }
  // periodic-table tile
  const k = range(t, 0.3, 1.2);
  ctx.save();
  ctx.globalAlpha = a * k;
  ctx.translate(CX, CY - 250);
  ctx.fillStyle = 'rgba(224,138,90,0.12)';
  ctx.strokeStyle = C.copper; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.roundRect(-80, -90, 160, 180, 14); ctx.fill(); ctx.stroke();
  ctx.restore();
  label(ctx, '29', CX - 62, CY - 322, { size: 28, mono: true, color: C.copper, alpha: a * k, align: 'left', weight: 600 });
  label(ctx, 'Cu', CX, CY - 250, { size: 86, color: C.text, alpha: a * k, weight: 700 });
  label(ctx, STR.copperWord, CX, CY - 188, { size: 24, mono: true, color: C.copper, alpha: a * k, weight: 500 });

  const rise = (1 - easeOut(range(t, 0.4, 1.6))) * 30;
  label(ctx, STR.title[0], CX, CY - 20 + rise, { size: 112, weight: 700, alpha: a * range(t, 0.5, 1.4) });
  label(ctx, STR.title[1], CX, CY + 105 + rise, { size: 112, weight: 700, alpha: a * range(t, 0.7, 1.6), color: C.copper });
  label(ctx, STR.subtitle, CX, CY + 220 + rise, { size: 38, mono: true, weight: 500, color: C.electron, alpha: a * range(t, 1.3, 2.2) });
}

function drawShells(ctx, t, S) {
  const [a0, a1] = T.shells, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.6, 0.6);
  chapterTag(ctx, '01', STR.chapters[0], a);
  const cx = CX, cy = CY - 50;

  glowDot(ctx, cx, cy, 34, C.copper, a);
  label(ctx, '29+', cx, cy, { size: 24, mono: true, color: C.bg, alpha: a, weight: 600 });

  const esc = easeInOut(range(lt, CS.cu2 + 2.2, CS.cu2 + 4.2)); // the outer electron leaves
  const hl = range(lt, CS.cu2 + 0.3, CS.cu2 + 1.1) * (1 - esc);
  S.shells.forEach((sh, i) => {
    const show = range(lt, 0.4 + i * 0.5, 1.0 + i * 0.5);
    ctx.save();
    ctx.globalAlpha = a * 0.4 * show;
    ctx.strokeStyle = C.dim; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, sh.r * (0.9 + 0.1 * show), 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    label(ctx, String(sh.n), cx + sh.r * 0.707 + 18, cy - sh.r * 0.707 - 18, { size: 26, mono: true, color: i === 3 ? C.gold : C.dim, alpha: a * show, weight: 600 });

    for (let j = 0; j < sh.n; j++) {
      const ang = (j / sh.n) * Math.PI * 2 + i * 0.7 + lt * sh.w;
      let x = cx + Math.cos(ang) * sh.r, y = cy + Math.sin(ang) * sh.r;
      if (i === 3) {
        const tx = cx + 570 + Math.sin(lt * 2.3) * 14, ty = cy - 150 + Math.cos(lt * 1.9) * 14;
        x = lerp(x, tx, esc); y = lerp(y, ty, esc);
        if (hl > 0) {
          ctx.save();
          ctx.globalAlpha = a * hl * 0.85;
          ctx.strokeStyle = C.gold; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(x, y, 30 + Math.sin(lt * 8) * 3, 0, 7); ctx.stroke();
          ctx.restore();
          label(ctx, STR.outerE, x, y - 56, { size: 26, mono: true, color: C.gold, alpha: a * hl, weight: 500 });
        }
        if (esc > 0.85) label(ctx, STR.freeE, x, y - 44, { size: 26, mono: true, color: C.electron, alpha: a * range(esc, 0.85, 1), weight: 500 });
        charge(ctx, x, y, 14, -1, C.electron, a * show);
      } else {
        charge(ctx, x, y, 10, -1, C.electron, a * show);
      }
    }
  });
  label(ctx, STR.shells, W - 90, 90, { size: 24, mono: true, color: C.dim, alpha: a * range(lt, 2, 3), align: 'right', weight: 500 });

  caption(ctx, 'cu1', a, lt, CS.cu1);
  caption(ctx, 'cu2', a, lt, CS.cu2);
}

function drawSea(ctx, t, S) {
  const [a0, a1] = T.sea, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.6, 0.6);
  chapterTag(ctx, '02', STR.chapters[1], a);

  // electrons are released about when "sea of free electrons" is spoken
  const rel0 = CS.sea1 + LEAD + (spoken('sea1') ?? 4) * 0.5, rel1 = rel0 + 2;
  const free = easeInOut(range(lt, rel0, rel1));
  const seaGlow = range(lt, rel0 + 0.6, rel1 + 1);

  ctx.save();
  ctx.globalAlpha = a * seaGlow * 0.10;
  ctx.fillStyle = C.electron;
  ctx.beginPath(); ctx.roundRect(300, 235, 1320, 520, 40); ctx.fill();
  ctx.restore();
  label(ctx, STR.sea, CX, 790, { size: 28, mono: true, color: C.electron, alpha: a * seaGlow, weight: 500 });

  for (const e of S.sea) {
    ctx.save();
    ctx.globalAlpha = a * 0.14;
    ctx.fillStyle = C.copper;
    ctx.beginPath(); ctx.arc(e.ion.x, e.ion.y, 50, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    charge(ctx, e.ion.x, e.ion.y, 22, 1, C.copper, a * 0.95);
  }
  for (const e of S.sea) {
    const bx = e.ion.x + Math.cos(e.bw * lt + e.bp) * 52, by = e.ion.y + Math.sin(e.bw * lt + e.bp) * 52;
    const wx = e.bx + e.ax * Math.sin(e.f1 * lt + e.p1) + e.ax * 0.6 * Math.sin(e.f2 * lt + e.p2);
    const wy = e.by + e.ay * Math.sin(e.f3 * lt + e.p3) + e.ay * 0.6 * Math.sin(e.f4 * lt + e.p4);
    glowDot(ctx, lerp(bx, wx, free), lerp(by, wy, free), 9, C.electron, a * range(lt, 0.5, 1));
  }

  const count = range(lt, CS.sea2 + LEAD, CS.sea2 + LEAD + 0.8);
  label(ctx, STR.density, CX, 860, { size: 40, mono: true, color: C.gold, alpha: a * count, weight: 600 });

  caption(ctx, 'sea1', a, lt, CS.sea1);
  caption(ctx, 'sea2', a, lt, CS.sea2);
}

function drawPanel(ctx, S, lt, a, { x0, y0, title, tint, copper, focus }) {
  const A = a * focus;
  ctx.save();
  ctx.translate(x0, y0);
  ctx.globalAlpha = A * 0.5;
  ctx.strokeStyle = tint; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(0, 0, 780, 430, 24); ctx.stroke();
  label(ctx, title, 0, -36, { size: 36, color: tint, alpha: A, align: 'left', weight: 700 });

  const fieldOn = range(lt, 1.0, 1.8);
  for (let i = 0; i < S.grid.length; i++) {
    const g = S.grid[i];
    if (copper) {
      ctx.globalAlpha = A * 0.14; ctx.fillStyle = C.copper;
      ctx.beginPath(); ctx.arc(g.x, g.y, 42, 0, Math.PI * 2); ctx.fill();
      charge(ctx, g.x, g.y, 20, 1, C.copper, A);
    } else {
      ctx.globalAlpha = A * 0.9; ctx.fillStyle = 'rgba(125,136,168,0.25)';
      ctx.beginPath(); ctx.arc(g.x, g.y, 30, 0, Math.PI * 2); ctx.fill();
      const o = S.orbit[i];
      const push = fieldOn * -7; // bound electrons are only nudged, never released
      charge(ctx, g.x + Math.cos(o.w * lt + o.p) * 44 + push, g.y + Math.sin(o.w * lt + o.p) * 44, 9, -1, C.electron, A);
    }
  }
  if (copper) {
    const drift = fieldOn * 150 * (lt - 1.0) * 0.6;
    for (const e of S.lanes) {
      const x = (((e.base + drift * (0.8 + (e.lane ? 0.25 : 0))) % 780) + 780) % 780;
      const y = 160 + e.lane * 120 + Math.sin(lt * e.jf + e.jp) * 9;
      glowDot(ctx, x, y + 0, 8, C.electron, A);
    }
  }
  label(ctx, STR.field, 780, 470, { size: 26, mono: true, color: C.dim, alpha: A * fieldOn, align: 'right', weight: 500 });
  label(ctx, copper ? STR.currentBig : STR.currentZero, 0, 470, { size: 30, mono: true, color: copper ? C.gold : C.dim, alpha: A * fieldOn, align: 'left', weight: 600 });
  ctx.restore();
}

function drawCompare(ctx, t, S) {
  const [a0, a1] = T.compare, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.6, 0.6);
  chapterTag(ctx, '03', STR.chapters[2], a);
  const toCopper = easeInOut(range(lt, CS.comp2 - 0.4, CS.comp2 + 0.4));
  drawPanel(ctx, S, lt, a, { x0: 120, y0: 290, title: STR.rubber, tint: C.dim, copper: false, focus: lerp(1, 0.35, toCopper) });
  drawPanel(ctx, S, lt, a, { x0: 1020, y0: 290, title: STR.copperWord, tint: C.copper, copper: true, focus: lerp(0.35, 1, toCopper) });
  caption(ctx, 'comp1', a, lt, CS.comp1);
  caption(ctx, 'comp2', a, lt, CS.comp2);
}

const RANK = [
  { id: 'silver', name: 'Silver', v: 106, color: '#cfd8ea' },
  { id: 'copper', name: 'Copper', v: 100, color: C.copper },
  { id: 'gold', name: 'Gold', v: 70, color: C.gold },
  { id: 'aluminium', name: 'Aluminium', v: 61, color: '#8fa3c8' },
  { id: 'iron', name: 'Iron', v: 17, color: '#6b7796' },
];

function drawRank(ctx, t) {
  const [a0, a1] = T.rank, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.6, 0.6);
  chapterTag(ctx, '04', STR.chapters[3], a);
  const x0 = 620, scale = 8;
  label(ctx, STR.rankTitle, CX, 215, { size: 28, mono: true, color: C.dim, alpha: a * range(lt, 0.2, 0.8), weight: 500 });

  ctx.save();
  ctx.globalAlpha = a * 0.5 * range(lt, 1, 1.6);
  ctx.strokeStyle = C.copper; ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
  ctx.beginPath(); ctx.moveTo(x0 + 100 * scale, 275); ctx.lineTo(x0 + 100 * scale, 790); ctx.stroke();
  ctx.restore();

  RANK.forEach((r, i) => {
    const y = 340 + i * 105;
    const grow = easeOut(range(lt, 0.9 + i * 0.35, 1.7 + i * 0.35));
    const emph = r.id === 'copper' ? 1 : 0.85;
    label(ctx, STR.metals[r.id], x0 - 30, y, { size: 38, alpha: a * grow, align: 'right', weight: 600, color: r.id === 'copper' ? C.copper : C.text });
    ctx.save();
    ctx.globalAlpha = a * grow * emph;
    ctx.fillStyle = r.color;
    ctx.shadowColor = r.color; ctx.shadowBlur = r.id === 'copper' ? 24 : 0;
    ctx.beginPath(); ctx.roundRect(x0, y - 28, Math.max(2, r.v * scale * grow), 56, 10); ctx.fill();
    ctx.restore();
    label(ctx, `≈ ${Math.round(r.v * grow)}%`, x0 + r.v * scale * grow + 24, y, { size: 32, mono: true, alpha: a * grow, align: 'left', weight: 600, color: C.text });
  });
  caption(ctx, 'rank1', a, lt, CS.rank1);
}

function drawOutro(ctx, t, S) {
  const [a0, a1] = T.outro, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.7, 0.8);
  label(ctx, STR.outro[0], CX, CY - 70, { size: 92, weight: 700, alpha: a * range(lt, 0.2, 1), color: C.electron });
  label(ctx, STR.outro[1], CX, CY + 50, { size: 92, weight: 700, alpha: a * range(lt, 1.6, 2.4), color: C.copper });
  for (let i = 0; i < 24; i++) {
    const x = ((i * 90 + lt * 240) % (W + 200)) - 100;
    glowDot(ctx, x, CY + 200 + Math.sin(i + lt * 2) * 8, 9, C.electron, a * range(lt, 2.4, 3.2));
  }
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
    if (on(T.shells)) drawShells(ctx, t, S);
    if (on(T.sea)) drawSea(ctx, t, S);
    if (on(T.compare)) drawCompare(ctx, t, S);
    if (on(T.rank)) drawRank(ctx, t);
    if (t >= T.outro[0] - 1) drawOutro(ctx, t, S);
  },
}));
