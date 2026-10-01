import { W, H, CX, CY, C, FONT, fontsLoaded, glowDot, label, chapterTag, narration, LEAD, LANG } from '/runtime/kit.js';

const { clamp, lerp, range, easeInOut, easeOut, fadeWindow, rng } = Scene;

const ATP = '#7ee787', NADH = '#b48cff', O2C = '#9ad0ff', CO2C = '#9aa3b8', H2O = '#5aa9ff';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio comes from `npm run narrate -- respiration`.
const VI = {
  'How do cells': 'Tế bào tạo ra',
  'make energy?': 'năng lượng thế nào?',
  'cellular respiration': 'hô hấp tế bào',
  'The big picture': 'Bức tranh tổng thể',
  'oxygen': 'oxi',
  'carbon dioxide': 'khí cacbonic',
  'water': 'nước',
  'energy': 'năng lượng',
  'C₆H₁₂O₆ + 6 O₂  →  6 CO₂ + 6 H₂O + energy': 'C₆H₁₂O₆ + 6 O₂  →  6 CO₂ + 6 H₂O + năng lượng',
  'Glycolysis': 'Đường phân',
  'cytoplasm': 'tế bào chất',
  'mitochondrion': 'ti thể',
  '6 carbons': '6 cacbon',
  '3 carbons each': 'mỗi phân tử 3 cacbon',
  'net gain: 2 ATP': 'lãi ròng: 2 ATP',
  'no O₂ needed': 'không cần O₂',
  'Krebs cycle': 'Chu trình Krebs',
  'matrix': 'chất nền',
  'inner membrane': 'màng trong',
  'Krebs': 'Chu trình',
  'cycle': 'Krebs',
  'high-energy electrons →': 'electron năng lượng cao →',
  'Electron transport chain': 'Chuỗi truyền electron',
  'intermembrane space  (protons pile up here)': 'khoảng giữa hai màng  (proton tích tụ ở đây)',
  'H⁺ protons': 'H⁺ proton',
  'The ATP tally': 'Tổng kết ATP',
  'glycolysis': 'đường phân',
  'electron transport chain': 'chuỗi truyền electron',
  'with oxygen': 'có oxi',
  'without oxygen': 'không có oxi',
  'more energy': 'năng lượng hơn',
  'Glucose + oxygen': 'Glucose + oxi',
  'that is cellular respiration': 'đó là hô hấp tế bào',
};
const tr = (s) => (LANG === 'vi' && VI[s]) || s;
const TXT_EN = {
  ov1: 'Cells burn [[glucose:copper]] with [[oxygen]] and store the energy as [[ATP]].',
  gly1: 'In the cytoplasm, [[glycolysis]] splits [[glucose:copper]] into two [[pyruvate]].',
  gly2: 'It nets [[2 ATP]] and needs [[no oxygen]].',
  kr1: 'In the [[mitochondrion]], pyruvate is broken down by the [[Krebs cycle]].',
  kr2: 'Carbon leaves as [[carbon dioxide]]; carriers pick up [[high-energy electrons:electron]].',
  et1: 'Electrons pass along the [[electron transport chain]], pumping [[protons:proton]] across a membrane.',
  et2: 'Protons flow back through [[ATP synthase]], making most of the [[ATP]], while [[oxygen]] forms [[water]].',
  tal1: 'One glucose yields about [[30 ATP]], roughly [[15 times]] more than without [[oxygen]].',
};
const TXT_VI = {
  ov1: 'Tế bào đốt cháy [[glucose:copper]] cùng với [[oxi]] và lưu năng lượng dưới dạng [[ATP]].',
  gly1: 'Trong tế bào chất, [[đường phân]] tách [[glucose:copper]] thành hai phân tử [[pyruvate]].',
  gly2: 'Quá trình này thu về [[2 ATP]] và [[không cần oxi]].',
  kr1: 'Trong [[ti thể]], pyruvate bị phân giải bởi [[chu trình Krebs]].',
  kr2: 'Cacbon thoát ra dưới dạng [[khí cacbonic]]; các chất mang nhận các [[electron năng lượng cao:electron]].',
  et1: 'Các electron đi dọc theo [[chuỗi truyền electron]], bơm [[proton:proton]] qua màng.',
  et2: 'Proton chảy ngược qua [[ATP synthase]], tạo ra phần lớn [[ATP]], trong khi [[oxi]] tạo thành [[nước]].',
  tal1: 'Một phân tử glucose cho khoảng [[30 ATP]], nhiều hơn khoảng [[15 lần]] so với khi không có [[oxi]].',
};
const TXT = LANG === 'vi' ? TXT_VI : TXT_EN;
const { spoken, capEnd, cue, caption } = await narration('biology/energy-in-cells/respiration', TXT);

// Timeline (seconds). Caption start times are relative to the start of each chapter.
const CS = { ov1: 0.6, gly1: 0.6, kr1: 0.6, et1: 0.6, tal1: 0.6 };
CS.gly2 = capEnd('gly1', CS.gly1);
CS.kr2 = capEnd('kr1', CS.kr1);
CS.et2 = capEnd('et1', CS.et1);
const LEN = {
  ov: capEnd('ov1', CS.ov1) + 0.3,
  gly: capEnd('gly2', CS.gly2) + 0.3,
  kr: capEnd('kr2', CS.kr2) + 0.3,
  et: capEnd('et2', CS.et2) + 0.3,
  tal: capEnd('tal1', CS.tal1) + 0.3,
};
const T = { title: [0, 4] };
T.ov = [T.title[1], T.title[1] + LEN.ov];
T.gly = [T.ov[1], T.ov[1] + LEN.gly];
T.kr = [T.gly[1], T.gly[1] + LEN.kr];
T.et = [T.kr[1], T.kr[1] + LEN.et];
T.tal = [T.et[1], T.et[1] + LEN.tal];
T.outro = [T.tal[1], T.tal[1] + (spoken('outro') ? 0.3 + spoken('outro') + 2.5 : 9)];
const AUDIO = [
  ...cue('ov1', T.ov[0] + CS.ov1),
  ...cue('gly1', T.gly[0] + CS.gly1), ...cue('gly2', T.gly[0] + CS.gly2),
  ...cue('kr1', T.kr[0] + CS.kr1), ...cue('kr2', T.kr[0] + CS.kr2),
  ...cue('et1', T.et[0] + CS.et1), ...cue('et2', T.et[0] + CS.et2),
  ...cue('tal1', T.tal[0] + CS.tal1),
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

/** small labelled molecule token */
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

/** carbon skeleton: n nodes on a ring (hex) or a small chain */
function carbons(ctx, cx, cy, r, n, color, alpha, { bonds = true, rot = 0, nodeR = 13 } = {}) {
  const pts = Array.from({ length: n }, (_, i) => [cx + Math.cos(rot + (i / n) * Math.PI * 2) * r, cy + Math.sin(rot + (i / n) * Math.PI * 2) * r]);
  if (bonds) {
    ctx.save(); ctx.globalAlpha = alpha * 0.8; ctx.strokeStyle = color; ctx.lineWidth = 4;
    ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); if (n > 2) ctx.closePath(); ctx.stroke();
    ctx.restore();
  }
  pts.forEach((p) => glowDot(ctx, p[0], p[1], nodeR, color, alpha));
}

/** mitochondrion outline; returns geometry of the inner membrane */
function mito(ctx, cx, cy, w, h, alpha, { cristae = true } = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(224,138,90,0.07)'; ctx.strokeStyle = C.copper; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.roundRect(cx - w / 2, cy - h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();
  const iw = w - 70, ih = h - 70;
  ctx.globalAlpha = alpha * 0.7; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.roundRect(cx - iw / 2, cy - ih / 2, iw, ih, ih / 2); ctx.stroke();
  if (cristae) {
    ctx.lineCap = 'round'; ctx.lineWidth = 4;
    for (let i = 0; i < 5; i++) {
      const x = cx - iw / 2 + iw * (0.2 + i * 0.15);
      const top = cy - ih / 2 + 2, bot = cy + ih / 2 - 2, len = ih * 0.36;
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, top + len); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + iw * 0.075, bot); ctx.lineTo(x + iw * 0.075, bot - len); ctx.stroke();
    }
  }
  ctx.restore();
}

// ---- state (deterministic) ------------------------------------------------
function makeState() {
  const rand = rng(6);
  const sparks = Array.from({ length: 50 }, () => ({ x: rand() * W, y: rand() * H, r: 2 + rand() * 4, sp: 0.2 + rand() * 0.5, ph: rand() * 6.28 }));
  const cloud = Array.from({ length: 70 }, () => ({ x: 380 + rand() * 900, y: 390 + rand() * 110, ph: rand() * 6.28, f: 1 + rand() * 2 }));
  return { sparks, cloud };
}

// ---- chapters -------------------------------------------------------------
function drawTitle(ctx, t, S) {
  const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
  for (const p of S.sparks) glowDot(ctx, (p.x + t * 40 * p.sp) % W, p.y + Math.sin(t * p.sp * 2 + p.ph) * 20, p.r, ATP, a * 0.25);
  carbons(ctx, CX, CY - 250, 62, 6, C.copper, a * range(t, 0.3, 1.1), { rot: t * 0.5 });
  const rise = (1 - easeOut(range(t, 0.3, 1.5))) * 30;
  label(ctx, tr('How do cells'), CX, CY - 70 + rise, { size: 108, weight: 700, alpha: a * range(t, 0.4, 1.3) });
  label(ctx, tr('make energy?'), CX, CY + 55 + rise, { size: 108, weight: 700, alpha: a * range(t, 0.6, 1.5), color: ATP });
  label(ctx, tr('cellular respiration'), CX, CY + 165 + rise, { size: 38, mono: true, weight: 500, color: C.gold, alpha: a * range(t, 1.3, 2.2) });
}

function icon(ctx, kind, x, y, alpha) {
  if (kind === 'glucose') carbons(ctx, x, y, 44, 6, C.copper, alpha, { nodeR: 10 });
  if (kind === 'o2') { glowDot(ctx, x - 22, y, 20, O2C, alpha); glowDot(ctx, x + 22, y, 20, O2C, alpha); }
  if (kind === 'co2') { glowDot(ctx, x, y, 16, CO2C, alpha); glowDot(ctx, x - 40, y, 20, O2C, alpha); glowDot(ctx, x + 40, y, 20, O2C, alpha); }
  if (kind === 'h2o') { glowDot(ctx, x, y - 6, 22, H2O, alpha); glowDot(ctx, x - 28, y + 18, 11, C.text, alpha); glowDot(ctx, x + 28, y + 18, 11, C.text, alpha); }
  if (kind === 'atp') token(ctx, 'ATP', x, y, ATP, alpha, 44);
}

function drawOverview(ctx, t) {
  const [a0, a1] = T.ov, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.6, 0.6);
  chapterTag(ctx, '01', tr('The big picture'), a);
  const items = [
    { k: 'glucose', name: 'glucose', sub: 'C₆H₁₂O₆', at: sp('ov1', 0.2), x: 250 },
    { k: 'o2', name: tr('oxygen'), sub: '6 O₂', at: sp('ov1', 0.45), x: 610 },
    { k: 'co2', name: tr('carbon dioxide'), sub: '6 CO₂', at: sp('ov1', 0.62) + 1.2, x: 1050 },
    { k: 'h2o', name: tr('water'), sub: '6 H₂O', at: sp('ov1', 0.62) + 1.8, x: 1380 },
    { k: 'atp', name: tr('energy'), sub: '≈ 30 ATP', at: sp('ov1', 0.85), x: 1680 },
  ];
  const y = 470;
  items.forEach((it, i) => {
    const k = easeOut(range(lt, it.at, it.at + 0.8));
    icon(ctx, it.k, it.x, y - (1 - k) * 24, a * k);
    label(ctx, it.name, it.x, y + 100, { size: 30, weight: 600, alpha: a * k });
    label(ctx, it.sub, it.x, y + 148, { size: 28, mono: true, weight: 500, color: it.k === 'atp' ? ATP : C.dim, alpha: a * k });
  });
  const sym = (s, x, at) => label(ctx, s, x, y, { size: 64, weight: 500, color: C.dim, alpha: a * range(lt, at, at + 0.5) });
  sym('+', 430, items[1].at);
  sym('→', 830, items[2].at - 0.5);
  sym('+', 1215, items[3].at);
  sym('+', 1530, items[4].at - 0.2);
  label(ctx, tr('C₆H₁₂O₆ + 6 O₂  →  6 CO₂ + 6 H₂O + energy'), CX, 760, { size: 38, mono: true, weight: 500, color: C.gold, alpha: a * range(lt, items[4].at + 0.6, items[4].at + 1.4) });
  caption(ctx, 'ov1', a, lt, CS.ov1);
}

function cell(ctx, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(126,231,135,0.04)'; ctx.strokeStyle = 'rgba(126,231,135,0.5)'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.roundRect(120, 230, 1680, 580, 220); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function drawGlycolysis(ctx, t) {
  const [a0, a1] = T.gly, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.6, 0.6);
  chapterTag(ctx, '02', tr('Glycolysis'), a);
  cell(ctx, a);
  label(ctx, tr('cytoplasm'), 220, 290, { size: 26, mono: true, color: C.dim, alpha: a, align: 'left', weight: 500 });
  mito(ctx, 1520, 520, 420, 200, a * 0.9, { cristae: false });
  label(ctx, tr('mitochondrion'), 1520, 660, { size: 24, mono: true, color: C.copper, alpha: a, weight: 500 });

  // glucose (6 carbons) splits into two pyruvate (3 carbons each)
  const split = easeInOut(range(lt, sp('gly1', 0.5), sp('gly1', 0.5) + 1.4));
  const gx = 470, gy = 520, r = 78;
  const appear = easeOut(range(lt, 0.6, 1.4));
  const hex = Array.from({ length: 6 }, (_, i) => [Math.cos((i / 6) * Math.PI * 2 - Math.PI / 2) * r, Math.sin((i / 6) * Math.PI * 2 - Math.PI / 2) * r]);
  const travel = easeInOut(range(lt, sp('gly2', 0.55), sp('gly2', 0.55) + 2.4));
  [[0, 1, 2], [3, 4, 5]].forEach((grp, gi) => {
    const dy = (gi ? 1 : -1) * 105 * split;
    const off = [gx + 210 * split + 640 * travel, gy + dy * (1 - travel * 0.85)];
    const al = a * appear * (1 - range(travel, 0.85, 1));
    ctx.save(); ctx.globalAlpha = al * 0.85; ctx.strokeStyle = C.copper; ctx.lineWidth = 5;
    ctx.beginPath(); grp.forEach((idx, j) => (j ? ctx.lineTo(off[0] + hex[idx][0], off[1] + hex[idx][1]) : ctx.moveTo(off[0] + hex[idx][0], off[1] + hex[idx][1]))); ctx.stroke();
    ctx.restore();
    grp.forEach((idx) => glowDot(ctx, off[0] + hex[idx][0], off[1] + hex[idx][1], 14, split > 0.5 ? C.gold : C.copper, al));
    if (split > 0.7) label(ctx, 'pyruvate', off[0], off[1] + (gi ? 120 : -120), { size: 26, mono: true, color: C.gold, alpha: al * range(split, 0.7, 1), weight: 500 });
  });
  // the closing bonds of glucose fade as it splits
  ctx.save(); ctx.globalAlpha = a * appear * (1 - split) * 0.85; ctx.strokeStyle = C.copper; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(gx + hex[2][0], gy + hex[2][1]); ctx.lineTo(gx + hex[3][0], gy + hex[3][1]); ctx.moveTo(gx + hex[5][0], gy + hex[5][1]); ctx.lineTo(gx + hex[0][0], gy + hex[0][1]); ctx.stroke(); ctx.restore();
  label(ctx, 'glucose', gx, gy + 150, { size: 28, mono: true, color: C.copper, alpha: a * appear * (1 - split), weight: 500 });
  label(ctx, tr('6 carbons'), gx, gy + 190, { size: 24, mono: true, color: C.dim, alpha: a * appear * (1 - split), weight: 500 });
  label(ctx, tr('3 carbons each'), 900, 760, { size: 24, mono: true, color: C.dim, alpha: a * range(split, 0.8, 1) * (1 - travel), weight: 500 });

  // energy payoff: 2 ATP + 2 NADH, no oxygen
  const pay = sp('gly2', 0.1);
  for (let i = 0; i < 2; i++) {
    const k = easeOut(range(lt, pay + i * 0.5, pay + i * 0.5 + 0.7));
    token(ctx, 'ATP', 960 + i * 130, 350 - (1 - k) * 30, ATP, a * k, 30);
    token(ctx, 'NADH', 960 + i * 130, 425 - (1 - k) * 30, NADH, a * k * 0.9, 22);
  }
  label(ctx, tr('net gain: 2 ATP'), 1090, 290, { size: 30, mono: true, weight: 600, color: ATP, alpha: a * range(lt, pay + 0.3, pay + 1.1) });
  const no = range(lt, sp('gly2', 0.55), sp('gly2', 0.55) + 0.8);
  if (no > 0) {
    glowDot(ctx, 700, 745, 14, O2C, a * no); glowDot(ctx, 738, 745, 14, O2C, a * no);
    ctx.save(); ctx.globalAlpha = a * no; ctx.strokeStyle = C.proton; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(670, 775); ctx.lineTo(768, 715); ctx.stroke(); ctx.restore();
    label(ctx, tr('no O₂ needed'), 800, 745, { size: 26, mono: true, color: C.proton, alpha: a * no, align: 'left', weight: 600 });
  }
  caption(ctx, 'gly1', a, lt, CS.gly1);
  caption(ctx, 'gly2', a, lt, CS.gly2);
}

function drawKrebs(ctx, t) {
  const [a0, a1] = T.kr, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.6, 0.6);
  chapterTag(ctx, '03', tr('Krebs cycle'), a);
  mito(ctx, CX, 510, 1560, 560, a);
  label(ctx, tr('matrix'), CX - 620, 300, { size: 24, mono: true, color: C.dim, alpha: a, align: 'left', weight: 500 });
  label(ctx, tr('inner membrane'), CX + 620, 720, { size: 22, mono: true, color: C.copper, alpha: a * 0.8, align: 'right', weight: 500 });

  const rx = CX + 60, ry = 510, R = 150;
  const ring = easeOut(range(lt, 0.5, 1.3));
  ctx.save(); ctx.globalAlpha = a * ring * 0.6; ctx.strokeStyle = C.gold; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(rx, ry, R, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2 - Math.PI / 2;
    glowDot(ctx, rx + Math.cos(ang) * R, ry + Math.sin(ang) * R, 9, C.gold, a * ring * 0.7);
  }
  label(ctx, tr('Krebs'), rx, ry - 16, { size: 34, weight: 700, alpha: a * ring }); label(ctx, tr('cycle'), rx, ry + 22, { size: 34, weight: 700, alpha: a * ring });
  // a molecule circling the cycle
  const spin = lt * 0.9;
  glowDot(ctx, rx + Math.cos(spin) * R, ry + Math.sin(spin) * R, 16, C.copper, a * ring);

  // pyruvate enters, drops a carbon as CO2, acetyl joins the cycle
  const enter = range(lt, 0.8, 0.8 + 2.4);
  if (enter > 0 && enter < 1) {
    const [px, py] = pathAt([[CX - 730, ry], [CX - 300, ry], [rx - R, ry]], easeInOut(enter));
    carbons(ctx, px, py, 24, 3, C.gold, a * (1 - range(enter, 0.9, 1)), { nodeR: 9 });
    label(ctx, 'pyruvate', px, py - 50, { size: 22, mono: true, color: C.gold, alpha: a, weight: 500 });
  }

  // outputs: CO2 drifts out, carriers head for the membrane, ATP is released
  const outs = [];
  const start = sp('kr2', 0.0) - 0.5;
  for (let k = 0; k < 14; k++) {
    const t0 = 2.2 + k * ((start + (spoken('kr2') ?? 5) + 2.5 - 2.2) / 14);
    const kind = ['co2', 'nadh', 'nadh', 'co2', 'fadh', 'atp', 'nadh'][k % 7];
    const ang = (k * 0.9) % (Math.PI * 2);
    outs.push({ t0, kind, ang });
  }
  for (const o of outs) {
    const age = lt - o.t0;
    if (age < 0 || age > 3.4) continue;
    const u = age / 3.4;
    const fx = rx + Math.cos(o.ang) * R, fy = ry + Math.sin(o.ang) * R;
    const al = a * Math.sin(Math.min(1, u * 1.4) * Math.PI * 0.5) * (1 - range(u, 0.8, 1));
    if (o.kind === 'co2') token(ctx, 'CO₂', fx + 320 * u * Math.cos(o.ang * 0.4), fy - 240 * u, CO2C, al, 22);
    if (o.kind === 'nadh') token(ctx, 'NADH', fx + (rx - fx) * 0.2 * u, fy + (300 - (fy - ry)) * u, NADH, al, 22);
    if (o.kind === 'fadh') token(ctx, 'FADH₂', fx, fy + (300 - (fy - ry)) * u, C.copper, al, 22);
    if (o.kind === 'atp') token(ctx, 'ATP', fx + 380 * u, fy, ATP, al, 26);
  }
  label(ctx, tr('high-energy electrons →'), rx - 20, 820, { size: 24, mono: true, color: NADH, alpha: a * range(lt, CS.kr2 + LEAD + 1.6, CS.kr2 + LEAD + 2.4), weight: 500 });
  caption(ctx, 'kr1', a, lt, CS.kr1);
  caption(ctx, 'kr2', a, lt, CS.kr2);
}

function drawChain(ctx, t, S) {
  const [a0, a1] = T.et, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.6, 0.6);
  chapterTag(ctx, '04', tr('Electron transport chain'), a);
  const my = 560; // membrane centre line
  // lipid membrane
  ctx.save(); ctx.globalAlpha = a * 0.9;
  for (let x = 160; x < 1780; x += 26) {
    glowDot(ctx, x, my - 20, 8, C.copper, a * 0.55); glowDot(ctx, x, my + 20, 8, C.copper, a * 0.55);
  }
  ctx.restore();
  label(ctx, tr('intermembrane space  (protons pile up here)'), 160, 300, { size: 24, mono: true, color: C.dim, alpha: a, align: 'left', weight: 500 });
  label(ctx, tr('matrix'), 160, 800, { size: 24, mono: true, color: C.dim, alpha: a, align: 'left', weight: 500 });

  // protein complexes I - IV and ATP synthase
  const cx = { I: 470, II: 640, III: 810, IV: 990 };
  Object.entries(cx).forEach(([name, x], i) => {
    const k = easeOut(range(lt, 0.3 + i * 0.25, 0.9 + i * 0.25));
    ctx.save(); ctx.globalAlpha = a * k;
    ctx.fillStyle = 'rgba(77,216,255,0.16)'; ctx.strokeStyle = C.electron; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.roundRect(x - 54, my - 66, 108, 132, 26); ctx.fill(); ctx.stroke();
    ctx.restore();
    label(ctx, name, x, my, { size: 34, weight: 700, alpha: a * k });
  });
  const sx = 1440;
  const sk = easeOut(range(lt, 1.6, 2.4));
  const spinOn = range(lt, CS.et2 + LEAD - 0.3, CS.et2 + LEAD + 0.7);
  ctx.save(); ctx.globalAlpha = a * sk;
  ctx.fillStyle = 'rgba(126,231,135,0.16)'; ctx.strokeStyle = ATP; ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.roundRect(sx - 44, my - 62, 88, 124, 20); ctx.fill(); ctx.stroke();       // channel in membrane
  ctx.beginPath(); ctx.roundRect(sx - 26, my + 62, 52, 60, 8); ctx.fill(); ctx.stroke();          // stalk
  ctx.translate(sx, my + 160); ctx.rotate(lt * 3.2 * spinOn);
  ctx.beginPath(); ctx.arc(0, 0, 52, 0, Math.PI * 2); ctx.fill(); ctx.stroke();                   // rotating head
  for (let i = 0; i < 3; i++) { ctx.rotate((Math.PI * 2) / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 46); ctx.stroke(); }
  ctx.restore();
  label(ctx, 'ATP synthase', sx, my - 110, { size: 26, mono: true, color: ATP, alpha: a * sk, weight: 600 });

  // carriers hand over electrons
  token(ctx, 'NADH', 330, 700, NADH, a * (1 - range(lt, 5, 5.6)), 24);
  token(ctx, 'FADH₂', 560, 720, C.copper, a * 0.9, 22);
  const pI = [[340, 690], [470, 585], [640, 470], [810, 585], [900, 470], [990, 585]];
  const pII = [[560, 705], [640, 590], [720, 470], [810, 585]];
  const pumps = [];
  for (let k = 0; k < 9; k++) {
    const t0 = 1.0 + k * 1.15, dur = 4.4;
    const u = (lt - t0) / dur;
    if (u < 0 || u > 1) continue;
    const [ex, ey] = pathAt(k % 3 === 1 ? pII : pI, easeInOut(u));
    glowDot(ctx, ex, ey, 9, C.electron, a * Math.sin(Math.min(1, u * 5) * Math.PI / 2) * (1 - range(u, 0.94, 1)));
    // pump a proton at each complex (u passes 0.2, 0.6, 1)
    for (const f of [0.2, 0.6, 0.95]) pumps.push({ t0: t0 + f * dur, x: k % 3 === 1 ? [640, 810, 990][[0.2, 0.6, 0.95].indexOf(f)] : [470, 810, 990][[0.2, 0.6, 0.95].indexOf(f)] });
  }
  for (const p of pumps) {
    const age = lt - p.t0;
    if (age < 0 || age > 1.2) continue;
    const u = age / 1.2;
    glowDot(ctx, p.x + Math.sin(u * 6) * 6, lerp(my + 60, my - 110, easeOut(u)), 8, C.proton, a * (1 - range(u, 0.85, 1)));
  }
  // proton reservoir builds up, then drains through ATP synthase
  const fill = range(lt, 1.2, CS.et2 + LEAD);
  const drain = range(lt, CS.et2 + LEAD + 0.6, LEN.et - 1.2);
  const n = Math.floor(S.cloud.length * fill * (1 - 0.55 * drain));
  S.cloud.slice(0, n).forEach((c) => {
    glowDot(ctx, c.x + Math.sin(lt * c.f + c.ph) * 10, c.y + Math.cos(lt * c.f * 0.8 + c.ph) * 8, 6, C.proton, a * 0.85);
  });
  label(ctx, tr('H⁺ protons'), 620, 340, { size: 26, mono: true, color: C.proton, alpha: a * range(fill, 0.3, 0.6), weight: 600 });
  if (spinOn > 0) {
    for (let k = 0; k < 10; k++) {
      const t0 = CS.et2 + LEAD + 0.4 + k * 0.85, age = lt - t0;
      if (age < 0 || age > 2.2) continue;
      const u = age / 2.2;
      const [px, py] = pathAt([[1290, 440], [sx, my - 90], [sx, my + 30], [sx, my + 130]], easeInOut(Math.min(1, u * 1.6)));
      glowDot(ctx, px, py, 8, C.proton, a * (1 - range(u, 0.6, 0.8)));
      if (u > 0.55) token(ctx, 'ATP', sx + (u - 0.55) * 500, my + 250 + (u - 0.55) * 90, ATP, a * (1 - range(u, 0.85, 1)), 26);
    }
  }
  // oxygen accepts the electrons at complex IV and becomes water
  for (let k = 0; k < 5; k++) {
    const t0 = CS.et2 + LEAD + 1.6 + k * 1.7, age = lt - t0;
    if (age < 0 || age > 3.4) continue;
    if (age < 1.2) {
      const [ox, oy] = pathAt([[1200, 380], [1050, 440]], age / 1.2);
      glowDot(ctx, ox - 12, oy, 13, O2C, a); glowDot(ctx, ox + 12, oy, 13, O2C, a);
      if (k === 0) label(ctx, 'O₂', ox + 30, oy - 30, { size: 26, mono: true, color: O2C, alpha: a, align: 'left', weight: 600 });
    } else {
      const u = (age - 1.2) / 2.2;
      token(ctx, 'H₂O', 990 - 60 * u, my + 110 + 130 * u, H2O, a * (1 - range(u, 0.7, 1)), 24);
    }
  }
  caption(ctx, 'et1', a, lt, CS.et1);
  caption(ctx, 'et2', a, lt, CS.et2);
}

function drawTally(ctx, t) {
  const [a0, a1] = T.tal, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.6, 0.6);
  chapterTag(ctx, '05', tr('The ATP tally'), a);
  const x0 = 400, u = 36; // px per ATP
  const seg = [
    { name: tr('glycolysis'), v: 2, color: C.gold, at: 0.8 },
    { name: tr('Krebs cycle'), v: 2, color: C.copper, at: 1.6 },
    { name: tr('electron transport chain'), v: 26, color: C.electron, at: 2.4 },
  ];
  label(ctx, tr('with oxygen'), x0 - 26, 400, { size: 32, weight: 600, align: 'right', alpha: a * range(lt, 0.5, 1) });
  let x = x0;
  seg.forEach((s, i) => {
    const k = easeOut(range(lt, s.at, s.at + 0.9));
    const w = s.v * u * k;
    ctx.save(); ctx.globalAlpha = a * range(lt, s.at, s.at + 0.3); ctx.fillStyle = s.color; ctx.shadowColor = s.color; ctx.shadowBlur = i === 2 ? 24 : 0;
    ctx.beginPath(); ctx.roundRect(x, 360, Math.max(4, w - 3), 80, 8); ctx.fill(); ctx.restore();
    if (i < 2) label(ctx, `${s.name} ${s.v}`, x + (s.v * u) / 2 + (i === 0 ? -40 : 30), i === 0 ? 320 : 480, { size: 24, mono: true, color: s.color, alpha: a * k, weight: 600, align: i === 0 ? 'right' : 'left' });
    else label(ctx, `${s.name}  ≈ ${s.v}`, x + (s.v * u) / 2, 400, { size: 28, mono: true, color: C.bg, alpha: a * k, weight: 700 });
    x += s.v * u;
  });
  label(ctx, '≈ 30 ATP', x + 30, 400, { size: 52, mono: true, weight: 700, color: ATP, alpha: a * range(lt, 3.6, 4.4), align: 'left' });

  const y2 = 640;
  const nk = easeOut(range(lt, CS.tal1 + LEAD + (spoken('tal1') ?? 6) * 0.55, CS.tal1 + LEAD + (spoken('tal1') ?? 6) * 0.55 + 1));
  label(ctx, tr('without oxygen'), x0 - 26, y2, { size: 32, weight: 600, align: 'right', alpha: a * nk });
  ctx.save(); ctx.globalAlpha = a * nk; ctx.fillStyle = C.gold;
  ctx.beginPath(); ctx.roundRect(x0, y2 - 40, 2 * u - 3, 80, 8); ctx.fill(); ctx.restore();
  label(ctx, '2 ATP', x0 + 2 * u + 24, y2, { size: 40, mono: true, weight: 700, color: C.gold, alpha: a * nk, align: 'left' });
  label(ctx, '≈ 15×', 1420, y2, { size: 92, weight: 700, color: ATP, alpha: a * range(nk, 0.6, 1) });
  label(ctx, tr('more energy'), 1420, y2 + 66, { size: 30, mono: true, color: C.dim, alpha: a * range(nk, 0.6, 1), weight: 500 });
  caption(ctx, 'tal1', a, lt, CS.tal1);
}

function drawOutro(ctx, t) {
  const [a0, a1] = T.outro, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.7, 0.8);
  const s = spoken('outro') ?? 7;
  label(ctx, tr('Glucose + oxygen'), CX, CY - 110, { size: 88, weight: 700, color: C.copper, alpha: a * range(lt, LEAD, LEAD + 0.8) });
  label(ctx, '↓', CX, CY - 10, { size: 70, color: C.dim, alpha: a * range(lt, LEAD + s * 0.3, LEAD + s * 0.3 + 0.5), weight: 500 });
  label(ctx, 'CO₂ + H₂O + ATP', CX, CY + 100, { size: 88, weight: 700, color: ATP, alpha: a * range(lt, LEAD + s * 0.35, LEAD + s * 0.35 + 0.8) });
  label(ctx, tr('that is cellular respiration'), CX, CY + 215, { size: 38, mono: true, weight: 500, color: C.dim, alpha: a * range(lt, LEAD + s * 0.7, LEAD + s * 0.7 + 0.8) });
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
    if (on(T.ov)) drawOverview(ctx, t);
    if (on(T.gly)) drawGlycolysis(ctx, t);
    if (on(T.kr)) drawKrebs(ctx, t);
    if (on(T.et)) drawChain(ctx, t, S);
    if (on(T.tal)) drawTally(ctx, t);
    if (t >= T.outro[0] - 1) drawOutro(ctx, t);
  },
}));
