import { CX, CY, C, label, chapterTag, glowDot, token, panel, arrow, treeNode, edge, narration, plan, speech, mount, chapterAlpha, titleCard } from '/runtime/kit.js';

const { range, lerp, easeOut, easeInOut, fadeWindow } = Scene;
const GREEN = '#7ee787', VIOLET = '#b48cff', ORANGE = '#ff9f43';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio comes from `npm run narrate -- browser-rendering`.
const TXT = {
  p1: 'The browser receives HTML as [[bytes]], decodes them into [[characters]], then into [[tokens]].',
  p2: 'Tokens become nodes, and the nodes form a tree: the [[DOM]].',
  c1: 'CSS is parsed the same way, into the [[CSSOM]]: a tree of [[style rules]].',
  c2: 'It is [[render-blocking]]: the browser waits for the styles before it paints.',
  r1: 'The DOM and CSSOM combine into the [[render tree]], which holds only what is [[visible]].',
  r2: 'The [[head]], and anything with [[display: none]], is left out.',
  l1: '[[Layout]] works out the [[size]] and [[position]] of every box, in pixels.',
  l2: 'Resize the window, and the browser must lay everything out [[again]].',
  pa1: '[[Paint]] turns boxes into pixels: text, colors, borders and images, in [[layers]].',
  pa2: 'The [[GPU]] then [[composites]] the layers into the final frame.',
  j1: '[[JavaScript]] can change the DOM or styles, and the pipeline runs [[again]] from that step.',
  j2: 'Changing [[transform]] or [[opacity]] only needs compositing, so it is [[cheap]].',
};
const nar = await narration('computer-science/behind-the-scenes/browser-rendering', TXT);
const { caption } = nar;
const P = plan(nar, {
  dom: ['p1', 'p2'], style: ['c1', 'c2'], tree: ['r1', 'r2'], layout: ['l1', 'l2'], paint: ['pa1', 'pa2'], loop: ['j1', 'j2'],
});
const { CS, T } = P;
const sp = speech(nar, CS);

// ---- the page every chapter works on: <h1>Shop</h1> <p>Hello</p> <img> ------------------------------
const DOMN = [
  { id: 'html', t: '<html>', x: 0, y: 0, p: null },
  { id: 'head', t: '<head>', x: -150, y: 120, p: 'html' },
  { id: 'body', t: '<body>', x: 160, y: 120, p: 'html' },
  { id: 'title', t: '<title>', x: -150, y: 240, p: 'head' },
  { id: 'h1', t: '<h1>', x: 60, y: 240, p: 'body' },
  { id: 'p', t: '<p>', x: 180, y: 240, p: 'body' },
  { id: 'img', t: '<img>', x: 310, y: 240, p: 'body' },
];
const byId = Object.fromEntries(DOMN.map((n) => [n.id, n]));

/** draw tree nodes (+ edges) at origin (ox, oy). show(n) -> 0..1, tint(n) -> colour, dashed(n) */
function drawTree(ctx, nodes, ox, oy, alpha, show, { tint = () => C.electron, dashed = () => false, size = 26, dim = () => 1 } = {}) {
  const map = Object.fromEntries(nodes.map((n) => [n.id, n]));
  for (const n of nodes) {
    const k = show(n);
    if (n.p && k > 0) edge(ctx, ox + map[n.p].x, oy + map[n.p].y + size, ox + n.x, oy + n.y - size, alpha * k * 0.8, C.dim);
  }
  for (const n of nodes) {
    const k = show(n);
    if (k > 0) treeNode(ctx, n.t, ox + n.x, oy + n.y + (1 - k) * -14, tint(n), alpha * k * dim(n), { size, dashed: dashed(n) });
  }
}

const HEX = '3C 68 31 3E 53 68 6F 70 3C 2F 68 31 3E 3C 70 3E';
const CODE = ['<html>', '  <body>', '    <h1>Shop</h1>', '    <p>Hello</p>', '    <img src="a.png">', '  </body>', '</html>'];
const TOKS = [
  [['StartTag  html', C.electron]],
  [['StartTag  body', C.electron]],
  [['StartTag  h1', C.electron], ['Text  "Shop"', C.gold], ['EndTag  h1', C.dim]],
  [['StartTag  p', C.electron], ['Text  "Hello"', C.gold], ['EndTag  p', C.dim]],
  [['StartTag  img', C.electron]],
  [['EndTag  body', C.dim]],
  [['EndTag  html', C.dim]],
];

/** pipeline stage names / colours (loop chapter) */
const STAGES = [['DOM', C.electron], ['CSSOM', C.gold], ['Render tree', GREEN], ['Layout', ORANGE], ['Paint', VIOLET], ['Composite', C.proton]];

// page wireframe layouts, in viewport coordinates: [x, y, w, h]
const LAYOUT = {
  wide: { vp: 800, h1: [40, 30, 720, 70], p: [40, 130, 440, 200], img: [500, 130, 260, 200] },
  narrow: { vp: 500, h1: [40, 30, 420, 70], p: [40, 130, 420, 140], img: [40, 290, 420, 160] },
};

/** one flat picture of the page, used on the "screen" at the end */
function pageImage(ctx, x, y, w, h, alpha) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.fillStyle = '#0e1530'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill();
  ctx.fillStyle = C.electron; ctx.fillRect(x + w * 0.06, y + h * 0.1, w * 0.4, h * 0.1);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 4; i++) ctx.fillRect(x + w * 0.06, y + h * (0.34 + i * 0.1), w * (0.5 - (i === 3 ? 0.15 : 0)), h * 0.04);
  ctx.fillStyle = 'rgba(224,138,90,0.7)'; ctx.beginPath(); ctx.roundRect(x + w * 0.62, y + h * 0.34, w * 0.3, h * 0.4, 8); ctx.fill();
  ctx.restore();
}

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      titleCard(ctx, t, T, { l1: 'How a browser', l2: 'renders a page', sub: 'from bytes to pixels', tint: ORANGE });
    },

    // ------------------------------------------------------------------ 01 HTML -> DOM
    dom(ctx, t) {
      const a = chapterAlpha(T, 'dom', t), lt = t - T.dom[0];
      chapterTag(ctx, '01', 'HTML → DOM', a);
      const tp = sp('p1', 0.3), STEP = 0.7;
      const line = Math.min(CODE.length - 1, Math.max(-1, Math.floor((lt - tp) / STEP)));
      const on = range(lt, 0.4, 1.0);
      label(ctx, 'bytes', 130, 200, { size: 24, mono: true, color: C.dim, alpha: a * on, align: 'left', weight: 600 });
      label(ctx, HEX, 130, 245, { size: 28, mono: true, color: C.gold, alpha: a * on, align: 'left', weight: 500 });
      label(ctx, 'characters', 130, 320, { size: 24, mono: true, color: C.dim, alpha: a * range(lt, sp('p1', 0.12), sp('p1', 0.12) + 0.5), align: 'left', weight: 600 });
      CODE.forEach((txt, i) => {
        const k = range(lt, sp('p1', 0.15) + i * 0.08, sp('p1', 0.15) + i * 0.08 + 0.5);
        if (i === line) { ctx.save(); ctx.globalAlpha = a * 0.18; ctx.fillStyle = C.electron; ctx.fillRect(110, 355 + i * 50 - 22, 560, 44); ctx.restore(); }
        label(ctx, txt, 130, 355 + i * 50, { size: 30, mono: true, color: i === line ? C.text : C.dim, alpha: a * k, align: 'left', weight: 500 });
      });
      // tokens of the line being parsed
      label(ctx, 'tokens', 780, 320, { size: 24, mono: true, color: C.dim, alpha: a * range(lt, sp('p1', 0.5), sp('p1', 0.5) + 0.5), align: 'left', weight: 600 });
      if (line >= 0) TOKS[line].forEach(([txt, col], j) => treeNode(ctx, txt, 960, 380 + j * 76, col, a, { w: 330, size: 26 }));
      if (line >= 0) arrow(ctx, 690, 370 + line * 0, 780, 380, C.dim, a * 0.8);
      // DOM tree grows as start tags are parsed
      const at = { html: 0, body: 1, h1: 2, p: 3, img: 4 };
      const tHead = sp('p2', 0.45);
      const shown = (n) => (n.id in at ? easeOut(range(lt, tp + at[n.id] * STEP + 0.2, tp + at[n.id] * STEP + 0.7)) : easeOut(range(lt, tHead + (n.id === 'title' ? 0.4 : 0), tHead + 0.6 + (n.id === 'title' ? 0.4 : 0))));
      label(ctx, 'DOM', 1480, 195, { size: 26, mono: true, color: GREEN, alpha: a * range(lt, tp, tp + 0.6), weight: 600 });
      drawTree(ctx, DOMN, 1480, 270, a, shown, { tint: () => GREEN, size: 26 });
      label(ctx, 'the parser adds <head> by itself', 1480, 560, { size: 22, mono: true, color: C.dim, alpha: a * range(lt, tHead + 0.6, tHead + 1.2), weight: 500 });
      caption(ctx, 'p1', a, lt, CS.p1);
      caption(ctx, 'p2', a, lt, CS.p2);
    },

    // ------------------------------------------------------------------ 02 CSS -> CSSOM
    style(ctx, t) {
      const a = chapterAlpha(T, 'style', t), lt = t - T.style[0];
      chapterTag(ctx, '02', 'CSS → CSSOM', a);
      const rules = ['body { font-size: 16px }', 'h1   { color: #4dd8ff }', 'p    { margin: 8px }', 'img  { display: none }'];
      const k1 = range(lt, 0.4, 1.0);
      label(ctx, 'style.css', 130, 215, { size: 24, mono: true, color: C.dim, alpha: a * k1, align: 'left', weight: 600 });
      rules.forEach((r, i) => label(ctx, r, 130, 275 + i * 56, { size: 30, mono: true, alpha: a * range(lt, sp('c1', 0.1 + i * 0.12), sp('c1', 0.1 + i * 0.12) + 0.5), align: 'left', weight: 500 }));
      // CSSOM tree
      const ox = 1130, oy = 300, N = [
        { id: 'body', t: 'body', x: 0, y: 0, p: null, s: ['font: 16px'] },
        { id: 'h1', t: 'h1', x: -230, y: 190, p: 'body', s: ['font: 16px', 'color: #4dd8ff'] },
        { id: 'p', t: 'p', x: 0, y: 190, p: 'body', s: ['font: 16px', 'margin: 8px'] },
        { id: 'img', t: 'img', x: 230, y: 190, p: 'body', s: ['display: none'] },
      ];
      const dim = 1 - range(lt, sp('c2', 0.0), sp('c2', 0.0) + 0.6) * 0.6;
      label(ctx, 'CSSOM', ox, 215, { size: 26, mono: true, color: C.gold, alpha: a * dim * range(lt, sp('c1', 0.2), sp('c1', 0.2) + 0.5), weight: 600 });
      const shown = (n) => easeOut(range(lt, sp('c1', 0.3 + N.indexOf(n) * 0.14), sp('c1', 0.3 + N.indexOf(n) * 0.14) + 0.6));
      drawTree(ctx, N, ox, oy, a * dim, shown, { tint: () => C.gold, size: 28 });
      N.forEach((n) => n.s.forEach((s, i) => label(ctx, s, ox + n.x, oy + n.y + 62 + i * 30, { size: 22, mono: true, color: i === 0 && n.id !== 'body' && n.s[0] === 'font: 16px' ? C.dim : C.text, alpha: a * dim * shown(n), weight: 500 })));
      label(ctx, 'styles cascade down the tree', ox, oy + 330, { size: 22, mono: true, color: C.dim, alpha: a * dim * range(lt, sp('c1', 0.8), sp('c1', 1.0)), weight: 500 });
      // render-blocking timeline
      const bk = range(lt, sp('c2', 0.05), sp('c2', 0.05) + 0.7);
      const bx = 420, by = 700;
      label(ctx, 'HTML parsing', bx - 24, by, { size: 26, mono: true, color: C.electron, alpha: a * bk, align: 'right', weight: 600 });
      label(ctx, 'CSS download', bx - 24, by + 62, { size: 26, mono: true, color: C.gold, alpha: a * bk, align: 'right', weight: 600 });
      label(ctx, 'first paint', bx - 24, by + 124, { size: 26, mono: true, color: C.proton, alpha: a * bk, align: 'right', weight: 600 });
      const grow = (x0, w, y, col, at) => { ctx.save(); ctx.globalAlpha = a * bk; ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x0, y - 18, w * easeOut(range(lt, at, at + 1.0)), 36, 8); ctx.fill(); ctx.restore(); };
      grow(bx, 560, by, C.electron, sp('c2', 0.1));
      grow(bx, 860, by + 62, C.gold, sp('c2', 0.2));
      const wait = range(lt, sp('c2', 0.45), sp('c2', 0.45) + 0.8);
      ctx.save(); ctx.globalAlpha = a * wait * 0.5; ctx.strokeStyle = C.proton; ctx.lineWidth = 3; ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(bx, by + 124); ctx.lineTo(bx + 860, by + 124); ctx.stroke(); ctx.restore();
      glowDot(ctx, bx + 860 + 40, by + 124, 16, C.proton, a * range(lt, sp('c2', 0.7), sp('c2', 0.7) + 0.5));
      label(ctx, 'waits for the CSS', bx + 430, by + 103, { size: 24, mono: true, color: C.proton, alpha: a * wait, weight: 600 });
      caption(ctx, 'c1', a, lt, CS.c1);
      caption(ctx, 'c2', a, lt, CS.c2);
    },

    // ------------------------------------------------------------------ 03 render tree
    tree(ctx, t) {
      const a = chapterAlpha(T, 'tree', t), lt = t - T.tree[0];
      chapterTag(ctx, '03', 'Render tree', a);
      const k0 = range(lt, 0.4, 1.0);
      label(ctx, 'DOM', 330, 195, { size: 26, mono: true, color: GREEN, alpha: a * k0, weight: 600 });
      const out = (n) => ['head', 'title', 'img'].includes(n.id);
      const x2 = range(lt, sp('r2', 0.2), sp('r2', 0.2) + 0.8);
      drawTree(ctx, DOMN, 330, 260, a, () => k0, {
        tint: (n) => (out(n) && x2 > 0 ? C.proton : GREEN), size: 24, dashed: (n) => out(n) && x2 > 0.3, dim: (n) => (out(n) ? 1 - 0.45 * x2 : 1),
      });
      ['head', 'img'].forEach((id) => {
        const n = byId[id];
        if (id === 'head') label(ctx, '✕ not rendered', 330 + n.x + 70, 260 + n.y - 6, { size: 20, mono: true, color: C.proton, alpha: a * x2, align: 'left', weight: 600 });
        else label(ctx, '✕ display: none', 330 + n.x, 260 + n.y + 60, { size: 20, mono: true, color: C.proton, alpha: a * x2, weight: 600 });
      });
      // + CSSOM
      label(ctx, '+', 790, 360, { size: 60, color: C.dim, alpha: a * range(lt, sp('r1', 0.1), sp('r1', 0.1) + 0.5), weight: 500 });
      panel(ctx, 850, 250, 250, 220, C.gold, a * range(lt, sp('r1', 0.1), sp('r1', 0.1) + 0.6), 0.05);
      label(ctx, 'CSSOM', 975, 292, { size: 26, mono: true, color: C.gold, alpha: a * range(lt, sp('r1', 0.1), sp('r1', 0.1) + 0.6), weight: 600 });
      ['body', 'h1', 'p', 'img'].forEach((s, i) => label(ctx, s, 975, 345 + i * 36, { size: 24, mono: true, alpha: a * range(lt, sp('r1', 0.15 + i * 0.05), sp('r1', 0.15 + i * 0.05) + 0.5), weight: 500 }));
      arrow(ctx, 1130, 360, 1230, 360, C.dim, a * range(lt, sp('r1', 0.4), sp('r1', 0.4) + 0.5));
      // render tree
      const R = [
        { id: 'body', t: 'body', x: 0, y: 0, p: null, s: 'font 16px' },
        { id: 'h1', t: 'h1', x: -110, y: 150, p: 'body', s: 'color #4dd8ff' },
        { id: 'p', t: 'p', x: 110, y: 150, p: 'body', s: 'margin 8px' },
      ];
      const rk = (n) => easeOut(range(lt, sp('r1', 0.5 + R.indexOf(n) * 0.15), sp('r1', 0.5 + R.indexOf(n) * 0.15) + 0.6));
      label(ctx, 'render tree', 1500, 195, { size: 26, mono: true, color: ORANGE, alpha: a * range(lt, sp('r1', 0.4), sp('r1', 0.4) + 0.6), weight: 600 });
      drawTree(ctx, R, 1500, 290, a, rk, { tint: () => ORANGE, size: 28 });
      R.forEach((n) => label(ctx, n.s, 1500 + n.x, 290 + n.y + 62, { size: 22, mono: true, color: C.dim, alpha: a * rk(n), weight: 500 }));
      caption(ctx, 'r1', a, lt, CS.r1);
      caption(ctx, 'r2', a, lt, CS.r2);
    },

    // ------------------------------------------------------------------ 04 layout
    layout(ctx, t) {
      const a = chapterAlpha(T, 'layout', t), lt = t - T.layout[0];
      chapterTag(ctx, '04', 'Layout', a);
      const k = easeInOut(range(lt, sp('l2', 0.25), sp('l2', 0.25) + 1.8));
      const vp = lerp(LAYOUT.wide.vp, LAYOUT.narrow.vp, k), vx = 150, vy = 210, vh = 480;
      ctx.save(); ctx.globalAlpha = a * range(lt, 0.3, 0.9); ctx.strokeStyle = C.dim; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(vx, vy, vp, vh, 14); ctx.stroke(); ctx.restore();
      label(ctx, `viewport ${Math.round(vp)}px`, vx + vp / 2, vy + vh + 40, { size: 26, mono: true, color: C.gold, alpha: a * range(lt, 0.3, 0.9), weight: 600 });
      const names = [['h1', C.electron, 'Shop'], ['p', GREEN, 'Hello…'], ['img', C.copper, '']];
      names.forEach(([id, col, txt], i) => {
        const r = LAYOUT.wide[id].map((v, j) => lerp(v, LAYOUT.narrow[id][j], k));
        const show = easeOut(range(lt, sp('l1', 0.15 + i * 0.22), sp('l1', 0.15 + i * 0.22) + 0.6));
        ctx.save(); ctx.globalAlpha = a * show * 0.2; ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(vx + r[0], vy + r[1], r[2], r[3], 10); ctx.fill();
        ctx.globalAlpha = a * show; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
        label(ctx, id, vx + r[0] + r[2] / 2, vy + r[1] + r[3] / 2, { size: 28, mono: true, alpha: a * show, weight: 600 });
        label(ctx, `<${id}>`, 1130, 290 + i * 100, { size: 28, mono: true, color: col, alpha: a * show, align: 'left', weight: 600 });
        label(ctx, `x ${String(Math.round(r[0])).padStart(3)}  y ${String(Math.round(r[1])).padStart(3)}`, 1260, 280 + i * 100, { size: 26, mono: true, alpha: a * show, align: 'left', weight: 500 });
        label(ctx, `w ${String(Math.round(r[2])).padStart(3)}  h ${String(Math.round(r[3])).padStart(3)}`, 1260, 316 + i * 100, { size: 26, mono: true, alpha: a * show, align: 'left', weight: 500 });
      });
      const rf = range(lt, sp('l2', 0.25), sp('l2', 0.25) + 0.5) * (1 - range(lt, sp('l2', 0.25) + 2.0, sp('l2', 0.25) + 2.6));
      token(ctx, 'reflow!', 1500, 210, ORANGE, a * rf, 30);
      caption(ctx, 'l1', a, lt, CS.l1);
      caption(ctx, 'l2', a, lt, CS.l2);
    },

    // ------------------------------------------------------------------ 05 paint + composite
    paint(ctx, t) {
      const a = chapterAlpha(T, 'paint', t), lt = t - T.paint[0];
      chapterTag(ctx, '05', 'Paint and composite', a);
      const gap = 1 - easeInOut(range(lt, sp('pa2', 0.0), sp('pa2', 0.0) + 1.2));
      const ox = 380, base = 440;
      const layers = [['background', '#5aa9ff', 0], ['content', GREEN, 1], ['fixed header', ORANGE, 2]];
      layers.forEach(([name, col, i]) => {
        const reveal = easeOut(range(lt, sp('pa1', 0.15 + i * 0.25), sp('pa1', 0.15 + i * 0.25) + 0.8));
        const y = base + (1 - i) * 150 * gap + (1 - i) * 10;
        ctx.save();
        ctx.translate(ox, y);
        ctx.transform(1, 0, -0.55, 0.45, 0, 0);
        ctx.globalAlpha = a * reveal;
        ctx.fillStyle = i === 0 ? 'rgba(90,169,255,0.18)' : 'rgba(14,21,48,0.75)';
        ctx.beginPath(); ctx.roundRect(0, 0, 520, 300, 14); ctx.fill();
        ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.stroke();
        ctx.beginPath(); ctx.roundRect(0, 0, 520, 300, 14); ctx.clip();
        if (i === 0) { ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2; for (let g = 40; g < 520; g += 40) { ctx.beginPath(); ctx.moveTo(g, 0); ctx.lineTo(g, 300); ctx.stroke(); } }
        if (i === 1) {
          ctx.fillStyle = C.electron; ctx.fillRect(40, 80, 200, 34);
          ctx.fillStyle = 'rgba(255,255,255,0.4)'; for (let l = 0; l < 4; l++) ctx.fillRect(40, 140 + l * 30, 260 - (l === 3 ? 70 : 0), 12);
          ctx.fillStyle = C.copper; ctx.beginPath(); ctx.roundRect(340, 130, 140, 120, 10); ctx.fill();
        }
        if (i === 2) { ctx.fillStyle = ORANGE; ctx.fillRect(0, 0, 520, 52); ctx.fillStyle = C.bg; for (let d = 0; d < 3; d++) { ctx.beginPath(); ctx.arc(34 + d * 120, 26, 9, 0, 6.3); ctx.fill(); } }
        ctx.restore();
        label(ctx, name, ox + 600, y + 70, { size: 28, mono: true, color: col, alpha: a * reveal * gap, align: 'left', weight: 600 });
      });
      label(ctx, 'text · colors · borders · images', 380, 800, { size: 24, mono: true, color: C.dim, alpha: a * range(lt, sp('pa1', 0.7), sp('pa1', 0.7) + 0.6), weight: 500 });
      // screen
      const sk = range(lt, sp('pa2', 0.35), sp('pa2', 0.35) + 0.8);
      arrow(ctx, 1130, 450, 1260, 450, C.dim, a * sk);
      token(ctx, 'GPU', 1195, 400, VIOLET, a * sk, 28);
      panel(ctx, 1290, 290, 520, 340, C.text, a * sk, 0.03);
      pageImage(ctx, 1310, 310, 480, 300, a * sk);
      label(ctx, 'your screen', 1550, 690, { size: 26, mono: true, color: C.dim, alpha: a * sk, weight: 500 });
      caption(ctx, 'pa1', a, lt, CS.pa1);
      caption(ctx, 'pa2', a, lt, CS.pa2);
    },

    // ------------------------------------------------------------------ 06 JavaScript and the loop
    loop(ctx, t) {
      const a = chapterAlpha(T, 'loop', t), lt = t - T.loop[0];
      chapterTag(ctx, '06', 'Changing the page', a);
      const bw = 230, gap = 44, x0 = 160, by = 480, bh = 110;
      const sx = (i) => x0 + i * (bw + gap) + bw / 2;
      const on = range(lt, 0.3, 1.0);
      STAGES.forEach(([name, col], i) => {
        const j1 = i >= 3 ? range(lt, sp('j1', 0.45 + (i - 3) * 0.12), sp('j1', 0.45 + (i - 3) * 0.12) + 0.4) * (1 - range(lt, sp('j2', 0.1), sp('j2', 0.1) + 0.6) * 0.8) : 0;
        const j2 = i === 5 ? range(lt, sp('j2', 0.45), sp('j2', 0.45) + 0.4) : 0;
        const lit = Math.max(j1, j2);
        panel(ctx, sx(i) - bw / 2, by, bw, bh, col, a * on * (0.45 + 0.55 * lit), 0.05 + lit * 0.12);
        label(ctx, name, sx(i), by + bh / 2, { size: 32, weight: 700, alpha: a * on * (0.55 + 0.45 * lit) });
        if (i < 5) arrow(ctx, sx(i) + bw / 2 + 4, by + bh / 2, sx(i) + bw / 2 + gap - 4, by + bh / 2, C.dim, a * on * 0.8);
      });
      // scenario 1: width change -> layout
      const k1 = range(lt, sp('j1', 0.1), sp('j1', 0.1) + 0.6);
      token(ctx, "el.style.width = '50%'", sx(3) - 40, 290, C.gold, a * k1, 28);
      arrow(ctx, sx(3) - 40, 325, sx(3), by - 6, C.gold, a * k1, 4);
      label(ctx, 'layout → paint → composite', sx(4) - 40, by + bh + 70, { size: 28, mono: true, color: ORANGE, alpha: a * range(lt, sp('j1', 0.6), sp('j1', 0.6) + 0.6), weight: 600 });
      label(ctx, 'expensive', sx(4) - 40, by + bh + 112, { size: 24, mono: true, color: C.dim, alpha: a * range(lt, sp('j1', 0.6), sp('j1', 0.6) + 0.6), weight: 500 });
      // scenario 2: transform -> composite only
      const k2 = range(lt, sp('j2', 0.1), sp('j2', 0.1) + 0.6);
      token(ctx, "el.style.transform = 'scale(1.1)'", sx(5) - 90, 200, C.gold, a * k2, 28);
      arrow(ctx, sx(5), 235, sx(5), by - 6, C.gold, a * k2, 4);
      label(ctx, 'composite only', sx(5), by + bh + 180, { size: 28, mono: true, color: GREEN, alpha: a * range(lt, sp('j2', 0.55), sp('j2', 0.55) + 0.6), weight: 600 });
      label(ctx, 'cheap', sx(5), by + bh + 222, { size: 24, mono: true, color: C.dim, alpha: a * range(lt, sp('j2', 0.55), sp('j2', 0.55) + 0.6), weight: 500 });
      caption(ctx, 'j1', a, lt, CS.j1);
      caption(ctx, 'j2', a, lt, CS.j2);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, ...T.outro, 0.7, 0.8), lt = t - T.outro[0];
      label(ctx, 'HTML and CSS become trees,', CX, CY - 120, { size: 80, weight: 700, alpha: a * range(lt, 0.3, 1.1) });
      label(ctx, 'trees become boxes,', CX, CY - 20, { size: 80, weight: 700, alpha: a * range(lt, 1.4, 2.2), color: ORANGE });
      label(ctx, 'boxes become pixels.', CX, CY + 80, { size: 80, weight: 700, alpha: a * range(lt, 2.5, 3.3), color: GREEN });
      const k = range(lt, 3.5, 4.3);
      ['DOM', 'Render tree', 'Layout', 'Paint'].forEach((s, i) => {
        token(ctx, s, CX - 450 + i * 300, CY + 250, [C.electron, GREEN, ORANGE, VIOLET][i], a * k, 28);
        if (i < 3) arrow(ctx, CX - 450 + i * 300 + (i === 1 ? 90 : 70), CY + 250, CX - 450 + (i + 1) * 300 - 80, CY + 250, C.dim, a * k);
      });
    },
  },
});
