import { W, H, CX, CY, C, fontsLoaded, glowDot, label, chapterTag, narration, LEAD, LANG } from '/runtime/kit.js';

const { clamp, lerp, range, easeInOut, easeOut, fadeWindow, rng } = Scene;

const GREEN = '#7ee787', ATP = GREEN, NADPH = '#b48cff', O2C = '#9ad0ff', CO2C = '#9aa3b8', H2O = '#5aa9ff', WAX = '#e6d36a';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio comes from `npm run narrate -- biology/photosynthesis`.
const VI = {
  'chloroplasts': 'lục lạp',
  'stoma': 'khí khổng',
  'xylem: water up': 'mạch gỗ: nước đi lên',
  'phloem: sugar away': 'mạch rây: đường đi khỏi lá',
  'chloroplast': 'lục lạp',
  'thylakoid stacks': 'chồng thylakoid',
  'Calvin': 'Chu trình',
  'cycle': 'Calvin',
  'stroma': 'chất nền',
  'light': 'ánh sáng',
  'oxygen released': 'oxi được giải phóng',
  'from the air, through a stoma': 'từ không khí, qua khí khổng',
  '6 CO₂ + 6 H₂O + light  →  C₆H₁₂O₆ + 6 O₂': '6 CO₂ + 6 H₂O + ánh sáng  →  C₆H₁₂O₆ + 6 O₂',
  'Inside a leaf:': 'Bên trong chiếc lá:',
  'how photosynthesis works': 'quang hợp diễn ra thế nào',
  'from leaf anatomy to glucose': 'từ cấu tạo lá đến glucose',
  'together, they power life': 'cùng nhau, chúng duy trì sự sống',
  'Light reactions': 'Phản ứng sáng',
  'Calvin cycle': 'Chu trình Calvin',
  'The whole picture': 'Bức tranh tổng thể',
  'Leaf anatomy': 'Cấu tạo của lá',
  'cuticle': 'lớp cutin',
  'upper epidermis': 'biểu bì trên',
  'palisade mesophyll': 'mô giậu',
  'spongy mesophyll': 'mô xốp',
  'lower epidermis': 'biểu bì dưới',
  'Photosynthesis': 'Quang hợp',
  'chloroplasts · light → sugar': 'lục lạp · ánh sáng → đường',
  'Respiration': 'Hô hấp',
  'mitochondria · sugar → ATP': 'ti thể · đường → ATP',
};
const tr = (s) => (LANG === 'vi' && VI[s]) || s;
const TXT_EN = {
  an1: 'A leaf is layered: a waxy [[cuticle]] and the [[epidermis]] protect it from above.',
  an2: 'Below, [[palisade]] cells full of [[chloroplasts:green]] catch light, and [[stomata]] let gases in and out.',
  an3: 'Veins carry [[water:electron]] up in the [[xylem]] and [[sugar:copper]] away in the [[phloem]].',
  lr1: 'In a [[chloroplast:green]], [[chlorophyll:green]] absorbs light and splits [[water:electron]], releasing [[oxygen]].',
  lr2: 'The energy is stored as [[ATP:green]] and [[NADPH]] for the next stage.',
  ca1: 'In the [[Calvin cycle]], [[carbon dioxide]] is captured and built up using that energy.',
  ca2: 'The result is [[glucose:copper]], a sugar the plant uses for energy and growth.',
  sum1: 'In total, [[light]], [[water:electron]] and [[carbon dioxide]] become [[glucose:copper]] and [[oxygen]].',
};
const TXT_VI = {
  an1: 'Chiếc lá có nhiều lớp: [[lớp cutin]] phủ sáp và [[biểu bì]] bảo vệ lá từ phía trên.',
  an2: 'Bên dưới, các tế bào [[mô giậu]] chứa đầy [[lục lạp:green]] hấp thụ ánh sáng, và các [[khí khổng]] cho khí ra vào.',
  an3: 'Các gân lá dẫn [[nước:electron]] đi lên trong [[mạch gỗ]] và dẫn [[đường:copper]] đi khỏi lá trong [[mạch rây]].',
  lr1: 'Trong [[lục lạp:green]], [[diệp lục:green]] hấp thụ ánh sáng và tách [[nước:electron]], giải phóng [[oxi]].',
  lr2: 'Năng lượng được lưu trữ dưới dạng [[ATP:green]] và [[NADPH]] cho giai đoạn tiếp theo.',
  ca1: 'Trong [[chu trình Calvin]], [[khí cacbonic]] được cố định và tổng hợp nhờ năng lượng đó.',
  ca2: 'Kết quả là [[glucose:copper]], một loại đường mà cây dùng để lấy năng lượng và phát triển.',
  sum1: 'Tổng cộng, [[ánh sáng]], [[nước:electron]] và [[khí cacbonic]] trở thành [[glucose:copper]] và [[oxi]].',
};
const TXT = LANG === 'vi' ? TXT_VI : TXT_EN;
const { spoken, capEnd, cue, caption } = await narration('biology/energy-in-cells/photosynthesis', TXT);

// Timeline (seconds). Caption start times are relative to the start of each chapter.
const CS = { an1: 0.6, lr1: 0.6, ca1: 0.6, sum1: 0.6 };
CS.an2 = capEnd('an1', CS.an1);
CS.an3 = capEnd('an2', CS.an2);
CS.lr2 = capEnd('lr1', CS.lr1);
CS.ca2 = capEnd('ca1', CS.ca1);
const LEN = {
  an: capEnd('an3', CS.an3) + 0.3,
  lr: capEnd('lr2', CS.lr2) + 0.3,
  ca: capEnd('ca2', CS.ca2) + 0.3,
  sum: capEnd('sum1', CS.sum1) + 0.3,
};
const T = { title: [0, 4] };
T.an = [T.title[1], T.title[1] + LEN.an];
T.lr = [T.an[1], T.an[1] + LEN.lr];
T.ca = [T.lr[1], T.lr[1] + LEN.ca];
T.sum = [T.ca[1], T.ca[1] + LEN.sum];
T.outro = [T.sum[1], T.sum[1] + (spoken('outro') ? 0.3 + spoken('outro') + 2.5 : 9)];
const AUDIO = [
  ...cue('an1', T.an[0] + CS.an1), ...cue('an2', T.an[0] + CS.an2), ...cue('an3', T.an[0] + CS.an3),
  ...cue('lr1', T.lr[0] + CS.lr1), ...cue('lr2', T.lr[0] + CS.lr2),
  ...cue('ca1', T.ca[0] + CS.ca1), ...cue('ca2', T.ca[0] + CS.ca2),
  ...cue('sum1', T.sum[0] + CS.sum1),
  ...cue('outro', T.outro[0] + 0.3 - LEAD),
];
const DURATION = Math.ceil(T.outro[1] * 10) / 10;

// ---- helpers --------------------------------------------------------------
const sp = (id, f) => CS[id] + LEAD + (spoken(id) ?? 5) * f; // chapter-relative time at fraction f of a spoken line

function pathAt(pts, u) {
  u = clamp(u, 0, 1);
  const lens = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lens.push(l); total += l; }
  let d = u * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i]) { const k = d / lens[i]; return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]; }
    d -= lens[i];
  }
  return pts[pts.length - 1];
}

function token(ctx, text, x, y, color, alpha = 1, size = 24) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.font = `600 ${size}px "IBM Plex Mono", monospace`;
  const w = ctx.measureText(text).width + 22;
  ctx.globalAlpha = alpha * 0.2; ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - size * 0.8, w, size * 1.6, size * 0.8); ctx.fill();
  ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = C.text; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
  ctx.restore();
}

/** repeating event: returns progress 0..1 of the run in flight at time lt (or -1 when idle) */
function repeat(lt, t0, period, dur, count = 99) {
  if (lt < t0) return -1;
  const k = Math.floor((lt - t0) / period);
  if (k >= count) return -1;
  const age = lt - t0 - k * period;
  return age <= dur ? age / dur : -1;
}

function hexSugar(ctx, x, y, r, alpha) {
  const pts = Array.from({ length: 6 }, (_, i) => [x + Math.cos((i / 6) * Math.PI * 2) * r, y + Math.sin((i / 6) * Math.PI * 2) * r]);
  ctx.save(); ctx.globalAlpha = alpha * 0.85; ctx.strokeStyle = C.copper; ctx.lineWidth = 4;
  ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.stroke(); ctx.restore();
  pts.forEach((p) => glowDot(ctx, p[0], p[1], r * 0.2, C.copper, alpha));
}

// ---- state (deterministic) ------------------------------------------------
const LX0 = 470, LX1 = 1710;                         // leaf cross-section extent
const Y = { cut: 250, epi: [262, 312], pal: [312, 472], spo: [472, 632], low: [632, 682] };
const STOMATA = [700, 1330];
const VEIN = [1090, 552];

function makeState() {
  const rand = rng(11);
  const sparks = Array.from({ length: 40 }, () => ({ x: rand() * W, y: rand() * H, r: 2 + rand() * 4, sp: 0.2 + rand() * 0.5, ph: rand() * 6.28 }));
  const palCells = 18, cw = (LX1 - LX0) / palCells;
  const chloro = [];
  for (let c = 0; c < palCells; c++) for (let k = 0; k < 5; k++) chloro.push({ x: LX0 + c * cw + cw * (0.25 + rand() * 0.5), y: Y.pal[0] + 24 + k * 27 + rand() * 6, r: 0.8 + rand() * 0.4, ph: rand() * 6.28 });
  const spongy = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++) spongy.push({ x: LX0 + 60 + c * 122 + (r % 2) * 55 + rand() * 12, y: Y.spo[0] + 32 + r * 50 + rand() * 10, rr: 32 + rand() * 8 });
  // chloroplast interior: grana (stacks of thylakoid discs) on the left, stroma on the right
  const grana = [[CX - 560, 470], [CX - 400, 585], [CX - 250, 450], [CX - 120, 570]];
  return { sparks, palCells, chloro, spongy, grana };
}

// ---- leaf cross-section ----------------------------------------------------
function leafSection(ctx, S, lt, a) {
  // focus groups: 0 = cuticle + epidermis, 1 = mesophyll + stomata, 2 = vein
  const g1 = range(lt, CS.an2 - 0.3, CS.an2 + 0.3), g2 = range(lt, CS.an3 - 0.3, CS.an3 + 0.3);
  const w = [1 - g1, g1 * (1 - g2), g2];
  const started = range(lt, CS.an1, CS.an1 + 0.4);
  const al = (group) => a * lerp(1, 0.25 + 0.75 * w[group], started);
  const build = (i) => easeOut(range(lt, 0.2 + i * 0.25, 0.9 + i * 0.25));
  const cw = (LX1 - LX0) / S.palCells;

  // cuticle
  ctx.save(); ctx.globalAlpha = al(0) * build(0); ctx.strokeStyle = WAX; ctx.lineWidth = 10; ctx.lineCap = 'round';
  ctx.shadowColor = WAX; ctx.shadowBlur = 14 * w[0];
  ctx.beginPath(); ctx.moveTo(LX0, Y.cut); ctx.lineTo(LX0 + (LX1 - LX0) * build(0), Y.cut); ctx.stroke(); ctx.restore();

  // upper + lower epidermis
  const epi = (y0, y1, group, b, stomata) => {
    const n = 14, ew = (LX1 - LX0) / n;
    ctx.save(); ctx.globalAlpha = al(group) * b; ctx.strokeStyle = 'rgba(126,231,135,0.7)'; ctx.fillStyle = 'rgba(126,231,135,0.10)'; ctx.lineWidth = 3;
    for (let i = 0; i < n; i++) {
      const x = LX0 + i * ew;
      if (stomata && STOMATA.some((s) => Math.abs(x + ew / 2 - s) < ew * 0.9)) continue;
      ctx.beginPath(); ctx.roundRect(x + 2, y0, ew - 4, y1 - y0, 10); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  };
  epi(Y.epi[0], Y.epi[1], 0, build(1), false);

  // palisade mesophyll with chloroplasts
  ctx.save(); ctx.globalAlpha = al(1) * build(2); ctx.strokeStyle = 'rgba(126,231,135,0.55)'; ctx.fillStyle = 'rgba(126,231,135,0.07)'; ctx.lineWidth = 2.5;
  for (let c = 0; c < S.palCells; c++) { ctx.beginPath(); ctx.roundRect(LX0 + c * cw + 3, Y.pal[0] + 2, cw - 6, Y.pal[1] - Y.pal[0] - 4, 14); ctx.fill(); ctx.stroke(); }
  ctx.restore();
  for (const c of S.chloro) {
    ctx.save(); ctx.globalAlpha = al(1) * build(2); ctx.fillStyle = GREEN; ctx.shadowColor = GREEN; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.ellipse(c.x, c.y, 10 * c.r, 6.5 * c.r, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  // spongy mesophyll (loose cells, air spaces between)
  ctx.save(); ctx.globalAlpha = al(1) * build(3); ctx.strokeStyle = 'rgba(126,231,135,0.5)'; ctx.fillStyle = 'rgba(126,231,135,0.06)'; ctx.lineWidth = 2.5;
  for (const s of S.spongy) { ctx.beginPath(); ctx.arc(s.x, s.y, s.rr, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  ctx.restore();

  // lower epidermis with stomata (guard cells open and close)
  epi(Y.low[0], Y.low[1], 1, build(4), true);
  STOMATA.forEach((sx, i) => {
    const open = 0.5 + 0.5 * Math.sin(lt * 0.8 + i * 1.6);
    const gap = 8 + open * 16, cy = (Y.low[0] + Y.low[1]) / 2;
    ctx.save(); ctx.globalAlpha = al(1) * build(4); ctx.fillStyle = 'rgba(126,231,135,0.35)'; ctx.strokeStyle = GREEN; ctx.lineWidth = 3;
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx + d * (gap / 2 + 15), cy, 15, 26, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  });

  // vein bundle: xylem (blue) and phloem (gold)
  const [vx, vy] = VEIN, vk = build(3);
  ctx.save(); ctx.globalAlpha = al(2) * vk; ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.strokeStyle = C.wire; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(vx, vy, 62, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
  [[-24, -16], [4, -26], [-8, 4]].forEach(([dx, dy]) => glowDot(ctx, vx + dx, vy + dy, 12, H2O, al(2) * vk));
  [[22, 14], [-2, 28], [30, -4]].forEach(([dx, dy]) => glowDot(ctx, vx + dx, vy + dy, 9, C.copper, al(2) * vk));

  // labels on the left with leader lines
  const lab = (text, y, at, group, color = C.text, tx = LX0 + 24) => {
    const k = range(lt, at, at + 0.6);
    const A = a * k * lerp(1, 0.25 + 0.75 * w[group], started);
    ctx.save(); ctx.globalAlpha = A * 0.6; ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(LX0 - 78, y); ctx.lineTo(tx, y); ctx.stroke(); ctx.restore();
    label(ctx, text, LX0 - 92, y, { size: 26, mono: true, color, alpha: A, align: 'right', weight: 600 });
  };
  lab(tr('cuticle'), Y.cut, sp('an1', 0.1), 0, WAX, LX0 + 10);
  lab(tr('upper epidermis'), 287, sp('an1', 0.45), 0);
  lab(tr('palisade mesophyll'), 392, sp('an2', 0.1), 1, GREEN);
  lab(tr('spongy mesophyll'), 552, sp('an2', 0.3), 1, GREEN);
  lab(tr('lower epidermis'), 657, sp('an2', 0.62), 1);
  const chl = range(lt, sp('an2', 0.28), sp('an2', 0.28) + 0.6);
  label(ctx, tr('chloroplasts'), LX0 + 120, Y.pal[0] - 26 + 0, { size: 24, mono: true, color: GREEN, alpha: al(1) * chl, weight: 600, align: 'left' });
  STOMATA.forEach((sx, i) => label(ctx, tr('stoma'), sx, Y.low[1] + 40, { size: 24, mono: true, color: GREEN, alpha: al(1) * range(lt, sp('an2', 0.55), sp('an2', 0.55) + 0.6), weight: 600 }));
  label(ctx, tr('xylem: water up'), vx - 90, vy - 100, { size: 24, mono: true, color: H2O, alpha: al(2) * range(lt, sp('an3', 0.35), sp('an3', 0.35) + 0.6), weight: 600, align: 'right' });
  label(ctx, tr('phloem: sugar away'), vx + 90, vy + 100, { size: 24, mono: true, color: C.copper, alpha: al(2) * range(lt, sp('an3', 0.7), sp('an3', 0.7) + 0.6), weight: 600, align: 'left' });

  // an2: photons in, gas exchange through the stomata
  const light = range(lt, CS.an2 + LEAD, CS.an2 + LEAD + 0.6) * (1 - g2);
  for (let k = 0; k < 4; k++) {
    const u = repeat(lt, CS.an2 + LEAD + k * 0.45, 1.8, 1.1);
    if (u < 0) continue;
    const x = 700 + k * 190, [px, py] = [x + 90 * u, 130 + (Y.pal[0] + 60 - 130) * u];
    glowDot(ctx, px, py, 8, C.gold, a * light * (1 - range(u, 0.85, 1)));
    ctx.save(); ctx.globalAlpha = a * light * 0.3 * (1 - u); ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px - 60 * u, py - (py - 130) * 0.9); ctx.lineTo(px, py); ctx.stroke(); ctx.restore();
  }
  const gas = range(lt, sp('an2', 0.6), sp('an2', 0.6) + 0.6) * (1 - g2);
  let u = repeat(lt, sp('an2', 0.6), 2.4, 1.8);
  if (u >= 0) token(ctx, 'CO₂', STOMATA[0], lerp(780, 600, easeInOut(u)), CO2C, a * gas * (1 - range(u, 0.85, 1)), 22);
  u = repeat(lt, sp('an2', 0.6) + 1.0, 2.4, 1.8);
  if (u >= 0) token(ctx, 'O₂', STOMATA[1], lerp(610, 790, easeInOut(u)), O2C, a * gas * (1 - range(u, 0.85, 1)), 22);

  // an3: water rises through the xylem, sugar leaves through the phloem
  u = repeat(lt, CS.an3 + LEAD, 2.6, 2.0);
  if (u >= 0) token(ctx, 'H₂O', vx - 30, lerp(850, vy - 30, easeInOut(u)), H2O, a * range(lt, CS.an3 + LEAD, CS.an3 + LEAD + 0.5) * (1 - range(u, 0.85, 1)), 22);
  u = repeat(lt, CS.an3 + LEAD + 1.3, 2.6, 2.0);
  if (u >= 0) token(ctx, 'sugar', vx + 30, lerp(vy + 40, 850, easeInOut(u)), C.copper, a * range(lt, CS.an3 + LEAD, CS.an3 + LEAD + 0.5) * (1 - range(u, 0.85, 1)), 22);
}

// ---- chloroplast (light reactions + Calvin cycle) ---------------------------
const RING = [CX + 340, 520], RING_R = 135;

function chloroplast(ctx, S, lt, a, focus) {
  // focus: 0 = grana lit (light reactions), 1 = Calvin cycle lit
  const grow = easeOut(range(lt, 0.2, 1.4));
  const ga = a * grow * lerp(1, 0.3, focus), ra = a * grow * lerp(0.28, 1, focus);
  ctx.save(); ctx.globalAlpha = a * grow;
  ctx.fillStyle = 'rgba(126,231,135,0.06)'; ctx.strokeStyle = GREEN; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.ellipse(CX, 520, 790, 300, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.globalAlpha = a * grow * 0.5; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(CX, 520, 760, 274, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  label(ctx, tr('chloroplast'), CX, 250, { size: 26, mono: true, color: GREEN, alpha: a * grow, weight: 600 });

  // grana: stacks of thylakoid discs
  S.grana.forEach(([gx, gy]) => {
    for (let i = 0; i < 5; i++) {
      ctx.save(); ctx.globalAlpha = ga; ctx.fillStyle = 'rgba(126,231,135,0.28)'; ctx.strokeStyle = GREEN; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(gx - 70, gy - 55 + i * 25, 140, 20, 10); ctx.fill(); ctx.stroke(); ctx.restore();
    }
  });
  label(ctx, tr('thylakoid stacks'), CX - 400, 705, { size: 24, mono: true, color: GREEN, alpha: ga * range(lt, 1.6, 2.4), weight: 500 });

  // stroma / Calvin cycle
  ctx.save(); ctx.globalAlpha = ra * 0.7; ctx.strokeStyle = C.gold; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(RING[0], RING[1], RING_R, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 - Math.PI / 2;
    glowDot(ctx, RING[0] + Math.cos(ang) * RING_R, RING[1] + Math.sin(ang) * RING_R, 10, C.gold, ra * 0.8);
  }
  label(ctx, tr('Calvin'), RING[0], RING[1] - 16, { size: 32, weight: 700, alpha: ra }); label(ctx, tr('cycle'), RING[0], RING[1] + 22, { size: 32, weight: 700, alpha: ra });
  label(ctx, tr('stroma'), RING[0], 300, { size: 24, mono: true, color: C.dim, alpha: a * grow * 0.9, weight: 500 });
  glowDot(ctx, RING[0] + Math.cos(lt * 1.1) * RING_R, RING[1] + Math.sin(lt * 1.1) * RING_R, 14, C.copper, ra * range(lt, 1.2, 1.8));
}

function drawLight(ctx, S, t) {
  const [a0, a1] = T.lr, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.6, 0.6);
  chapterTag(ctx, '02', tr('Light reactions'), a);
  chloroplast(ctx, S, lt, a, 0);
  const target = S.grana[1];

  // photons hit the thylakoids
  const on = range(lt, CS.lr1 + LEAD, CS.lr1 + LEAD + 0.6);
  for (let k = 0; k < 5; k++) {
    const u = repeat(lt, CS.lr1 + LEAD + k * 0.35, 1.7, 1.0);
    if (u < 0) continue;
    const sx = CX - 720 + k * 45, sy = 130;
    const [px, py] = [lerp(sx, target[0] - 30 + k * 12, u), lerp(sy, target[1] - 40, u)];
    glowDot(ctx, px, py, 9, C.gold, a * on * (1 - range(u, 0.85, 1)));
    ctx.save(); ctx.globalAlpha = a * on * 0.35 * (1 - u); ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(px, py); ctx.stroke(); ctx.restore();
  }
  label(ctx, tr('light'), CX - 700, 175, { size: 28, mono: true, color: C.gold, alpha: a * on, weight: 600 });
  // the granum glows while it absorbs
  glowDot(ctx, target[0], target[1] + 8, 90, GREEN, a * on * 0.12 * (0.6 + 0.4 * Math.sin(lt * 6)));

  // water splits: oxygen escapes, protons and electrons are used
  const wAt = sp('lr1', 0.55);
  let u = repeat(lt, wAt, 3.2, 1.4, 3);
  if (u >= 0) token(ctx, 'H₂O', lerp(CX - 800, target[0] - 100, easeInOut(u)), lerp(620, target[1] + 30, easeInOut(u)), H2O, a * (1 - range(u, 0.85, 1)), 24);
  u = repeat(lt, wAt + 1.4, 3.2, 2.2, 3);
  if (u >= 0) {
    token(ctx, 'O₂', lerp(target[0] - 70, CX - 560, easeOut(u)), lerp(target[1] - 60, 190, easeOut(u)), O2C, a * (1 - range(u, 0.8, 1)), 26);
    glowDot(ctx, target[0] + 10 + u * 60, target[1] + 10 - u * 25, 6, C.proton, a * (1 - u));
    glowDot(ctx, target[0] + 30 + u * 40, target[1] - 5 + u * 30, 4, C.electron, a * (1 - u));
  }
  label(ctx, tr('oxygen released'), CX - 470, 215, { size: 26, mono: true, color: O2C, alpha: a * range(lt, wAt + 1.6, wAt + 2.4), weight: 600 });

  // ATP and NADPH are made and sent on to the Calvin cycle
  const eAt = CS.lr2 + LEAD;
  for (const [name, color, dy, off] of [['ATP', ATP, -30, 0], ['NADPH', NADPH, 30, 0.9]]) {
    for (let k = 0; k < 3; k++) {
      const uu = repeat(lt, eAt + off + k * 1.8, 5.4, 2.6);
      if (uu < 0 || uu > 1) continue;
      const [px, py] = pathAt([[target[0] + 90, target[1] - 10 + dy], [CX + 100, 540 + dy], [RING[0] - RING_R - 40, RING[1] + dy * 0.6]], easeInOut(uu));
      token(ctx, name, px, py, color, a * range(lt, eAt, eAt + 0.5) * (1 - range(uu, 0.85, 1)), 24);
    }
  }
  caption(ctx, 'lr1', a, lt, CS.lr1);
  caption(ctx, 'lr2', a, lt, CS.lr2);
}

function drawCalvin(ctx, S, t) {
  const [a0, a1] = T.ca, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.6, 0.6);
  chapterTag(ctx, '03', tr('Calvin cycle'), a);
  chloroplast(ctx, S, lt, a, easeInOut(range(lt, 0.3, 1.2)));
  const cAt = CS.ca1 + LEAD;

  // CO2 arrives through the stomata; ATP and NADPH arrive from the thylakoids
  for (let k = 0; k < 5; k++) {
    const u = repeat(lt, cAt + k * 1.4, 7, 2.2);
    if (u < 0) continue;
    const [px, py] = pathAt([[RING[0] + 20, 150], [RING[0] + 20, RING[1] - RING_R - 30]], easeInOut(u));
    token(ctx, 'CO₂', px, py, CO2C, a * range(lt, cAt, cAt + 0.5) * (1 - range(u, 0.85, 1)), 24);
  }
  label(ctx, tr('from the air, through a stoma'), RING[0] + 50, 118, { size: 24, mono: true, color: CO2C, alpha: a * range(lt, cAt, cAt + 0.8), weight: 500, align: 'left' });
  for (const [name, color, dy, off] of [['ATP', ATP, -30, 0], ['NADPH', NADPH, 30, 0.7]]) {
    const uu = repeat(lt, cAt + 0.5 + off, 2.4, 1.8);
    if (uu < 0) continue;
    const [px, py] = pathAt([[CX - 200, 540 + dy], [RING[0] - RING_R - 30, RING[1] + dy * 0.6]], easeInOut(uu));
    token(ctx, name, px, py, color, a * range(lt, cAt, cAt + 0.5) * (1 - range(uu, 0.85, 1)), 22);
  }
  // sugar comes out
  const gAt = sp('ca2', 0.35);
  const gk = easeOut(range(lt, gAt, gAt + 1.2));
  if (gk > 0) {
    const x = lerp(RING[0] + RING_R, RING[0] + RING_R + 300, gk);
    hexSugar(ctx, x, RING[1], 34, a * gk);
    label(ctx, 'glucose', x, RING[1] + 80, { size: 30, mono: true, weight: 600, color: C.copper, alpha: a * gk });
  }
  caption(ctx, 'ca1', a, lt, CS.ca1);
  caption(ctx, 'ca2', a, lt, CS.ca2);
}

function drawSummary(ctx, t) {
  const [a0, a1] = T.sum, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.6, 0.6);
  chapterTag(ctx, '04', tr('The whole picture'), a);
  // stylised leaf
  const lx = CX, ly = 480;
  const grow = easeOut(range(lt, 0.2, 1.2));
  ctx.save(); ctx.globalAlpha = a * grow;
  ctx.fillStyle = 'rgba(126,231,135,0.16)'; ctx.strokeStyle = GREEN; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(lx - 300, ly + 40); ctx.bezierCurveTo(lx - 200, ly - 240, lx + 160, ly - 260, lx + 320, ly - 40); ctx.bezierCurveTo(lx + 160, ly + 200, lx - 180, ly + 200, lx - 300, ly + 40); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(126,231,135,0.6)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(lx - 300, ly + 40); ctx.quadraticCurveTo(lx, ly - 50, lx + 320, ly - 40); ctx.stroke();
  ctx.restore();

  const s = spoken('sum1') ?? 5;
  const arrow = (x0, y0, x1, y1, color, at, text, tx, ty, align) => {
    const k = easeOut(range(lt, at, at + 0.9));
    ctx.save(); ctx.globalAlpha = a * k; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 6; ctx.lineCap = 'round';
    const ex = lerp(x0, x1, k), ey = lerp(y0, y1, k), ang = Math.atan2(y1 - y0, x1 - x0);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - 22 * Math.cos(ang - 0.45), ey - 22 * Math.sin(ang - 0.45)); ctx.lineTo(ex - 22 * Math.cos(ang + 0.45), ey - 22 * Math.sin(ang + 0.45)); ctx.closePath(); ctx.fill();
    ctx.restore();
    label(ctx, text, tx, ty, { size: 34, mono: true, weight: 600, color, alpha: a * k, align });
  };
  arrow(lx - 560, 190, lx - 210, ly - 100, C.gold, sp('sum1', 0.15) - 0.5 + LEAD * 0, 'light', lx - 590, 175, 'right');
  arrow(lx - 380, ly + 260, lx - 200, ly + 110, H2O, sp('sum1', 0.4), 'water', lx - 410, ly + 285, 'right');
  arrow(lx + 380, ly + 250, lx + 200, ly + 110, CO2C, sp('sum1', 0.7), 'CO₂', lx + 410, ly + 275, 'left');
  arrow(lx + 260, ly - 130, lx + 560, ly - 260, O2C, sp('sum1', 0.9) + 0.6, 'O₂', lx + 590, ly - 275, 'left');
  const sk = easeOut(range(lt, sp('sum1', 0.9) + 0.9, sp('sum1', 0.9) + 1.9));
  hexSugar(ctx, lx + 60, ly - 4, 30, a * sk);
  label(ctx, 'glucose', lx + 60, ly + 60, { size: 28, mono: true, color: C.copper, weight: 600, alpha: a * sk });
  label(ctx, tr('6 CO₂ + 6 H₂O + light  →  C₆H₁₂O₆ + 6 O₂'), CX, 810, { size: 36, mono: true, weight: 500, color: C.gold, alpha: a * range(lt, sp('sum1', 0.95) + 1.2, sp('sum1', 0.95) + 2.0) });
  caption(ctx, 'sum1', a, lt, CS.sum1);
}

function drawTitle(ctx, t, S) {
  const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
  for (const p of S.sparks) glowDot(ctx, (p.x + t * 30 * p.sp) % W, p.y + Math.sin(t * p.sp * 2 + p.ph) * 20, p.r, C.gold, a * 0.22);
  const k = easeOut(range(t, 0.2, 1.2));
  ctx.save(); ctx.globalAlpha = a * k; ctx.translate(CX, CY - 260); ctx.scale(0.55, 0.55);
  ctx.fillStyle = 'rgba(126,231,135,0.2)'; ctx.strokeStyle = GREEN; ctx.lineWidth = 8; ctx.shadowColor = GREEN; ctx.shadowBlur = 24;
  ctx.beginPath(); ctx.moveTo(-160, 60); ctx.bezierCurveTo(-120, -160, 80, -170, 170, -20); ctx.bezierCurveTo(80, 120, -100, 130, -160, 60); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0; ctx.beginPath(); ctx.moveTo(-160, 60); ctx.quadraticCurveTo(0, -30, 170, -20); ctx.stroke();
  ctx.restore();
  const rise = (1 - easeOut(range(t, 0.4, 1.6))) * 30;
  label(ctx, tr('Inside a leaf:'), CX, CY - 60 + rise, { size: 100, weight: 700, alpha: a * range(t, 0.5, 1.4) });
  label(ctx, tr('how photosynthesis works'), CX, CY + 60 + rise, { size: 100, weight: 700, alpha: a * range(t, 0.7, 1.6), color: GREEN });
  label(ctx, tr('from leaf anatomy to glucose'), CX, CY + 170 + rise, { size: 36, mono: true, weight: 500, color: C.gold, alpha: a * range(t, 1.3, 2.2) });
}

function drawAnatomy(ctx, S, t) {
  const [a0, a1] = T.an, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.6, 0.6);
  chapterTag(ctx, '01', tr('Leaf anatomy'), a);
  leafSection(ctx, S, lt, a);
  caption(ctx, 'an1', a, lt, CS.an1);
  caption(ctx, 'an2', a, lt, CS.an2);
  caption(ctx, 'an3', a, lt, CS.an3);
}

function drawOutro(ctx, t) {
  const [a0, a1] = T.outro, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.7, 0.8);
  const s = spoken('outro') ?? 7;
  const box = (x, title, sub, color, at) => {
    const k = easeOut(range(lt, at, at + 0.8));
    ctx.save(); ctx.globalAlpha = a * k; ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.strokeStyle = color; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.roundRect(x - 290, CY - 140, 580, 280, 30); ctx.fill(); ctx.stroke(); ctx.restore();
    label(ctx, title, x, CY - 45, { size: 56, weight: 700, color, alpha: a * k });
    label(ctx, sub, x, CY + 35, { size: 28, mono: true, weight: 500, color: C.dim, alpha: a * k });
  };
  box(CX - 470, tr('Photosynthesis'), tr('chloroplasts · light → sugar'), GREEN, LEAD);
  box(CX + 470, tr('Respiration'), tr('mitochondria · sugar → ATP'), C.copper, LEAD + s * 0.35);
  const link = (y, text, dir, at) => {
    const k = range(lt, at, at + 0.8);
    ctx.save(); ctx.globalAlpha = a * k; ctx.strokeStyle = C.dim; ctx.fillStyle = C.dim; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(CX - 150 * dir, y); ctx.lineTo(CX + 150 * dir, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(CX + 170 * dir, y); ctx.lineTo(CX + 140 * dir, y - 16); ctx.lineTo(CX + 140 * dir, y + 16); ctx.closePath(); ctx.fill(); ctx.restore();
    label(ctx, text, CX, y + (dir > 0 ? -34 : 40), { size: 24, mono: true, color: C.dim, alpha: a * k, weight: 500 });
  };
  link(CY - 40, 'glucose + O₂', 1, LEAD + s * 0.35 + 0.6);
  link(CY + 60, 'CO₂ + H₂O', -1, LEAD + s * 0.5 + 0.6);
  label(ctx, tr('together, they power life'), CX, CY + 250, { size: 40, mono: true, weight: 500, color: C.gold, alpha: a * range(lt, LEAD + s * 0.75, LEAD + s * 0.75 + 0.8) });
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
    if (on(T.an)) drawAnatomy(ctx, S, t);
    if (on(T.lr)) drawLight(ctx, S, t);
    if (on(T.ca)) drawCalvin(ctx, S, t);
    if (on(T.sum)) drawSummary(ctx, t);
    if (t >= T.outro[0] - 1) drawOutro(ctx, t);
  },
}));
