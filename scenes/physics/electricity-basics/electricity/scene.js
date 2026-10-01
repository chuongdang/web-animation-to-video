import { W, H, CX, CY, C, fontsLoaded, glowDot, label, chapterTag, charge, narration, LEAD, LANG } from '/runtime/kit.js';

const { clamp, lerp, range, easeInOut, easeOut, fadeWindow, rng } = Scene;

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio comes from `npm run narrate -- electricity`
// (add `--lang vi` for the Vietnamese narration; the page picks the language from ?lang=vi).
const STR = {
  en: {
    txt: {
      atom1: 'Everything is made of [[atoms]]: a positive [[nucleus:proton]], and tiny negative [[electrons:electron]].',
      atom2: 'The [[outermost electrons:electron]] are only [[loosely held]].',
      metal1: 'In a [[metal]], outer electrons [[break free]] and wander in every direction.',
      metal2: 'Random wandering means [[no net flow]], so no electricity yet.',
      circuit1: 'A [[battery]] pushes the electrons the same way. That steady flow is a [[current]].',
      circuit2: '[[Voltage]] is the push. [[Current:electron]] is the flow. [[Resistance:proton]] slows it down.',
    },
    title: 'What is electricity?', subtitle: 'explained simply',
    chapters: ['Atoms', 'Metals', 'A circuit'],
    nucleus: 'nucleus (+)', outer: 'loosely held outer electron',
    battery: 'battery', bulb: 'bulb', switchOff: 'switch: OFF', switchOn: 'switch: ON',
    tags: [['Voltage (V)', 'the push'], ['Current (A)', 'the flow'], ['Resistance (Ω)', 'the squeeze']],
    tagSize: 54, tagX: [-240, 30, 320],
    outro: ['Electricity is the flow', 'of electric charge.'],
  },
  vi: {
    txt: {
      atom1: 'Mọi vật đều được tạo nên từ [[nguyên tử]]: một [[hạt nhân:proton]] mang điện dương, và các [[electron:electron]] nhỏ bé mang điện âm.',
      atom2: 'Các [[electron ngoài cùng:electron]] chỉ bị giữ [[rất lỏng lẻo]].',
      metal1: 'Trong [[kim loại]], các electron ngoài cùng [[thoát ra tự do]] và chạy lung tung theo mọi hướng.',
      metal2: 'Chạy hỗn loạn nghĩa là [[không có dòng chảy chung]], nên chưa có điện.',
      circuit1: 'Một [[cục pin]] đẩy các electron cùng về một hướng. Dòng chảy ổn định đó chính là [[dòng điện]].',
      circuit2: '[[Hiệu điện thế]] là lực đẩy. [[Dòng điện:electron]] là dòng chảy. [[Điện trở:proton]] làm dòng chảy chậm lại.',
    },
    title: 'Điện là gì?', subtitle: 'giải thích đơn giản',
    chapters: ['Nguyên tử', 'Kim loại', 'Mạch điện'],
    nucleus: 'hạt nhân (+)', outer: 'electron ngoài cùng bị giữ lỏng lẻo',
    battery: 'pin', bulb: 'bóng đèn', switchOff: 'công tắc: TẮT', switchOn: 'công tắc: BẬT',
    tags: [['Hiệu điện thế (V)', 'lực đẩy'], ['Dòng điện (A)', 'dòng chảy'], ['Điện trở (Ω)', 'lực cản']],
    tagSize: 36, tagX: [-280, 20, 290],
    outro: ['Điện là dòng chuyển động', 'của các điện tích.'],
  },
}[LANG || 'en'];
const TXT = STR.txt;
const { spoken, capEnd, cue, caption } = await narration('physics/electricity-basics/electricity', TXT);

// Timeline (seconds). Caption start times are relative to the start of each chapter.
const CS = { atom1: 0.6, metal1: 0.6, circuit1: 2.4 };
CS.atom2 = capEnd('atom1', CS.atom1);
CS.metal2 = capEnd('metal1', CS.metal1);
CS.circuit2 = capEnd('circuit1', CS.circuit1);
const LEN = {
  atom: capEnd('atom2', CS.atom2) + 0.3,
  metal: capEnd('metal2', CS.metal2) + 0.3,
  circuit: capEnd('circuit2', CS.circuit2) + 0.3,
};
const T = { title: [0, 4] };
T.atom = [T.title[1], T.title[1] + LEN.atom];
T.metal = [T.atom[1], T.atom[1] + LEN.metal];
T.circuit = [T.metal[1], T.metal[1] + LEN.circuit];
T.outro = [T.circuit[1], T.circuit[1] + (spoken('outro') ? 0.3 + spoken('outro') + 2.5 : 6)];
const AUDIO = [
  ...cue('atom1', T.atom[0] + CS.atom1), ...cue('atom2', T.atom[0] + CS.atom2),
  ...cue('metal1', T.metal[0] + CS.metal1), ...cue('metal2', T.metal[0] + CS.metal2),
  ...cue('circuit1', T.circuit[0] + CS.circuit1), ...cue('circuit2', T.circuit[0] + CS.circuit2),
  ...cue('outro', T.outro[0] + 0.3 - LEAD),
];
const DURATION = Math.ceil(T.outro[1] * 10) / 10;

// ---- state (deterministic) ------------------------------------------------
function makeState() {
  const rand = rng(42);

  // background sparkles for the title
  const sparks = Array.from({ length: 70 }, () => ({
    x: rand() * W, y: rand() * H, r: 2 + rand() * 4, sp: 0.2 + rand() * 0.6, ph: rand() * 6.28,
  }));

  // nucleus: golden-angle spiral of protons / neutrons
  const nucleus = Array.from({ length: 9 }, (_, i) => {
    const a = i * 2.4, d = Math.sqrt(i) * 17;
    return { x: Math.cos(a) * d, y: Math.sin(a) * d, proton: i % 2 === 0 };
  });

  // orbits: [rx, ry, tilt, electrons[{phase, speed}]]
  const orbits = [
    { rx: 130, ry: 52, tilt: 0.0, e: [{ p: 0, s: 2.6 }, { p: Math.PI, s: 2.6 }] },
    { rx: 220, ry: 90, tilt: 1.05, e: [{ p: 1, s: 1.7 }, { p: 4.1, s: 1.7 }, { p: 2.5, s: 1.7 }] },
    { rx: 320, ry: 140, tilt: 2.1, e: [{ p: 0.4, s: 1.1 }] }, // the loosely held outer electron
  ];

  // metal lattice
  const lattice = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) lattice.push({ x: 330 + c * 180 + (r % 2) * 90, y: 300 + r * 150 });
  const free = Array.from({ length: 46 }, () => ({
    bx: 240 + rand() * 1440, by: 250 + rand() * 500,
    ax: 30 + rand() * 50, ay: 30 + rand() * 50,
    f1: 0.6 + rand() * 1.4, f2: 1.1 + rand() * 2.2, f3: 0.7 + rand() * 1.5, f4: 1.3 + rand() * 2.1,
    p1: rand() * 6.28, p2: rand() * 6.28, p3: rand() * 6.28, p4: rand() * 6.28,
  }));

  // circuit
  const box = { x0: 470, y0: 330, x1: 1450, y1: 800 };
  const perim = 2 * (box.x1 - box.x0) + 2 * (box.y1 - box.y0);
  const carriers = Array.from({ length: 64 }, (_, i) => ({
    s: (i / 64) * perim + (rand() - 0.5) * 6,
    jx: rand() * 6.28, jy: rand() * 6.28, jf: 1 + rand() * 2,
  }));

  return { sparks, nucleus, orbits, lattice, free, box, perim, carriers };
}

// Counter-clockwise loop starting bottom-left: right along the bottom, up the right, left along the top, down the left.
function loopPoint(box, perim, s) {
  const w = box.x1 - box.x0, h = box.y1 - box.y0;
  s = ((s % perim) + perim) % perim;
  if (s < w) return [box.x0 + s, box.y1];
  if ((s -= w) < h) return [box.x1, box.y1 - s];
  if ((s -= h) < w) return [box.x1 - s, box.y0];
  s -= w;
  return [box.x0, box.y0 + s];
}

// ---- scenes ---------------------------------------------------------------
function drawTitle(ctx, t, S) {
  const a = fadeWindow(t, ...T.title, 0.6, 0.6);
  for (const p of S.sparks) {
    const x = (p.x + t * 60 * p.sp) % W;
    glowDot(ctx, x, p.y + Math.sin(t * p.sp * 2 + p.ph) * 20, p.r, C.electron, a * 0.35);
  }
  const rise = (1 - easeOut(range(t, 0.2, 1.4))) * 30;
  label(ctx, STR.title, CX, CY - 20 + rise, { size: 120, weight: 700, alpha: a * range(t, 0.2, 1.2) });
  label(ctx, STR.subtitle, CX, CY + 90 + rise, { size: 40, mono: true, color: C.electron, alpha: a * range(t, 1.0, 2.0), weight: 500 });
  // bolt
  ctx.save();
  ctx.globalAlpha = a * range(t, 0.6, 1.4);
  ctx.translate(CX, CY - 220);
  ctx.fillStyle = C.gold;
  ctx.shadowColor = C.gold; ctx.shadowBlur = 40;
  ctx.beginPath();
  ctx.moveTo(20, -70); ctx.lineTo(-34, 12); ctx.lineTo(-2, 12); ctx.lineTo(-20, 70); ctx.lineTo(34, -14); ctx.lineTo(2, -14);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawAtom(ctx, t, S) {
  const [a0, a1] = T.atom, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.6, 0.6);
  chapterTag(ctx, '01', STR.chapters[0], a);

  ctx.save();
  ctx.translate(CX, CY - 30);
  ctx.scale(lerp(0.85, 1, easeOut(range(lt, 0, 1.5))), lerp(0.85, 1, easeOut(range(lt, 0, 1.5))));

  // orbits + electrons
  const outerHighlight = range(lt, CS.atom2 + 0.3, CS.atom2 + 1.3);
  S.orbits.forEach((o, oi) => {
    ctx.save();
    ctx.rotate(o.tilt);
    ctx.globalAlpha = a * 0.35;
    ctx.strokeStyle = C.dim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, o.rx, o.ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    for (const e of o.e) {
      const ang = e.p + lt * e.s;
      const ex = Math.cos(o.tilt) * o.rx * Math.cos(ang) - Math.sin(o.tilt) * o.ry * Math.sin(ang);
      const ey = Math.sin(o.tilt) * o.rx * Math.cos(ang) + Math.cos(o.tilt) * o.ry * Math.sin(ang);
      const outer = oi === 2;
      if (outer && outerHighlight > 0) {
        ctx.save();
        ctx.globalAlpha = a * outerHighlight * 0.8;
        ctx.strokeStyle = C.gold; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(ex, ey, 26 + Math.sin(lt * 8) * 3, 0, 7); ctx.stroke();
        ctx.restore();
      }
      charge(ctx, ex, ey, 13, -1, C.electron, a);
    }
  });

  // nucleus
  for (const n of S.nucleus) charge(ctx, n.x, n.y, 15, n.proton ? 1 : 0, n.proton ? C.proton : C.neutron, a);
  ctx.restore();

  label(ctx, STR.nucleus, CX + 4, CY + 110, { size: 28, mono: true, weight: 500, color: C.proton, alpha: a * range(lt, 1.2, 2) * (1 - range(lt, CS.atom2 - 0.4, CS.atom2)) });
  label(ctx, STR.outer, CX + 300, CY - 330, { size: 30, mono: true, weight: 500, color: C.gold, alpha: a * outerHighlight });
  caption(ctx, 'atom1', a, lt, CS.atom1);
  caption(ctx, 'atom2', a, lt, CS.atom2);
}

function drawMetal(ctx, t, S) {
  const [a0, a1] = T.metal, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.6, 0.6);
  chapterTag(ctx, '02', STR.chapters[1], a);

  for (const p of S.lattice) {
    ctx.save();
    ctx.globalAlpha = a * 0.9;
    ctx.fillStyle = 'rgba(255,107,107,0.14)';
    ctx.beginPath(); ctx.arc(p.x, p.y, 46, 0, 7); ctx.fill();
    ctx.restore();
    charge(ctx, p.x, p.y, 20, 1, C.proton, a * 0.85);
  }
  for (const e of S.free) {
    const x = e.bx + e.ax * Math.sin(e.f1 * lt + e.p1) + e.ax * 0.6 * Math.sin(e.f2 * lt + e.p2);
    const y = e.by + e.ay * Math.sin(e.f3 * lt + e.p3) + e.ay * 0.6 * Math.sin(e.f4 * lt + e.p4);
    glowDot(ctx, x, y, 9, C.electron, a * range(lt, 0.3, 1));
  }
  caption(ctx, 'metal1', a, lt, CS.metal1);
  caption(ctx, 'metal2', a, lt, CS.metal2);
}

function drawCircuit(ctx, t, S) {
  const [a0, a1] = T.circuit, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.7, 0.7);
  const { box, perim, carriers } = S;
  const midY = (box.y0 + box.y1) / 2;
  const batt = { y0: midY - 60, y1: midY + 60 };
  chapterTag(ctx, '03', STR.chapters[2], a);

  // drift distance: ramps up when the switch closes at lt = 2
  const tau = Math.max(0, lt - 2);
  const drift = 130 * (tau < 1 ? tau * tau / 2 : 0.5 + (tau - 1));
  const on = range(lt, 2, 3.2); // 0..1 current strength

  // wire
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = C.wire; ctx.lineWidth = 8; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(box.x0, batt.y0); ctx.lineTo(box.x0, box.y0); ctx.lineTo(box.x1, box.y0);
  ctx.lineTo(box.x1, box.y1); ctx.lineTo(box.x0, box.y1); ctx.lineTo(box.x0, batt.y1);
  ctx.stroke();
  ctx.restore();

  // electrons (drift + thermal jitter that keeps going)
  for (const c of carriers) {
    const [x, y] = loopPoint(box, perim, c.s + drift);
    const jx = Math.sin(lt * c.jf * 3 + c.jx) * 7, jy = Math.cos(lt * c.jf * 3.3 + c.jy) * 7;
    const inBattery = x === box.x0 && y > batt.y0 && y < batt.y1;
    if (!inBattery) glowDot(ctx, x + jx, y + jy, 8, C.electron, a);
  }

  // battery (+ on top)
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = '#1a2340'; ctx.strokeStyle = C.wire; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.roundRect(box.x0 - 46, batt.y0, 92, batt.y1 - batt.y0, 12); ctx.fill(); ctx.stroke();
  ctx.restore();
  label(ctx, '+', box.x0, batt.y0 + 32, { size: 48, color: C.proton, alpha: a, weight: 700 });
  label(ctx, '−', box.x0, batt.y1 - 32, { size: 48, color: C.electron, alpha: a, weight: 700 });
  label(ctx, STR.battery, box.x0 - 90, midY, { size: 30, mono: true, weight: 500, color: C.dim, alpha: a, align: 'right' });

  // bulb (top middle)
  const bx = (box.x0 + box.x1) / 2, by = box.y0;
  const glowR = 60 + on * 90;
  ctx.save();
  ctx.globalAlpha = a;
  const g = ctx.createRadialGradient(bx, by, 10, bx, by, glowR * 2.2);
  g.addColorStop(0, `rgba(255,209,102,${0.75 * on})`);
  g.addColorStop(1, 'rgba(255,209,102,0)');
  ctx.fillStyle = g;
  ctx.fillRect(bx - glowR * 2.2, by - glowR * 2.2, glowR * 4.4, glowR * 4.4);
  ctx.fillStyle = on > 0 ? `rgb(255,${Math.round(170 + 60 * on)},${Math.round(80 + 60 * on)})` : '#232c4a';
  ctx.strokeStyle = C.wire; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(bx, by, 52, 0, 7); ctx.fill(); ctx.stroke();
  ctx.restore();
  label(ctx, STR.bulb, bx, by - 100, { size: 30, mono: true, weight: 500, color: C.dim, alpha: a });

  // switch label
  label(ctx, lt < 2 ? STR.switchOff : STR.switchOn, box.x1 + 30, midY, { size: 30, mono: true, weight: 500, color: lt < 2 ? C.dim : C.gold, alpha: a, align: 'left' });

  // explanations
  caption(ctx, 'circuit1', a, lt, CS.circuit1);
  caption(ctx, 'circuit2', a, lt, CS.circuit2);
  const tag = (txt, sub, x, k) => {
    label(ctx, txt, x, midY - 20, { size: STR.tagSize, weight: 700, alpha: a * k, color: C.gold });
    label(ctx, sub, x, midY + 34, { size: 28, alpha: a * k, color: C.dim, weight: 500, mono: true });
  };
  tag(...STR.tags[0], CX + STR.tagX[0], range(lt, CS.circuit2, CS.circuit2 + 0.6));
  tag(...STR.tags[1], CX + STR.tagX[1], range(lt, CS.circuit2 + 0.4, CS.circuit2 + 1.0));
  tag(...STR.tags[2], CX + STR.tagX[2], range(lt, CS.circuit2 + 0.8, CS.circuit2 + 1.4));
}

function drawOutro(ctx, t) {
  const [a0, a1] = T.outro, lt = t - a0;
  const a = fadeWindow(t, a0, a1, 0.7, 0.8);
  label(ctx, STR.outro[0], CX, CY - 80, { size: 104, weight: 700, alpha: a * range(lt, 0.2, 1) });
  label(ctx, STR.outro[1], CX, CY + 50, { size: 104, weight: 700, alpha: a * range(lt, 0.8, 1.6), color: C.electron });
  // electrons streaming underneath
  for (let i = 0; i < 24; i++) {
    const x = ((i * 90 + lt * 240) % (W + 200)) - 100;
    glowDot(ctx, x, CY + 200 + Math.sin(i + lt * 2) * 8, 9, C.electron, a * range(lt, 1.4, 2.2));
  }
}

fontsLoaded.then(() => Scene.define({
  width: W, height: H, duration: DURATION, audio: AUDIO, background: C.bg,
  init: makeState,
  draw(ctx, t, S) {
    // soft vignette
    const v = ctx.createRadialGradient(CX, CY, 200, CX, CY, 1200);
    v.addColorStop(0, '#141c38'); v.addColorStop(1, C.bg);
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);

    if (t < T.title[1]) drawTitle(ctx, t, S);
    if (t >= T.atom[0] - 1 && t < T.atom[1]) drawAtom(ctx, t, S);
    if (t >= T.metal[0] - 1 && t < T.metal[1]) drawMetal(ctx, t, S);
    if (t >= T.circuit[0] - 1 && t < T.circuit[1]) drawCircuit(ctx, t, S);
    if (t >= T.outro[0] - 1) drawOutro(ctx, t);
  },
}));
