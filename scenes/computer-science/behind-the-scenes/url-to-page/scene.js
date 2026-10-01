import { CX, CY, C, label, chapterTag, glowDot, token, panel, arrow, treeNode, narration, plan, speech, mount, chapterAlpha, titleCard } from '/runtime/kit.js';

const { range, lerp, easeOut, easeInOut, fadeWindow } = Scene;
const GREEN = '#7ee787', VIOLET = '#b48cff', ORANGE = '#ff9f43', BLUE = '#5aa9ff', GO = '#00add8';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio comes from `npm run narrate -- url-to-page`.
const TXT = {
  u1: 'You type a [[URL]]; the browser splits it into [[scheme]], [[host]] and [[path]], and checks its [[caches]].',
  d1: 'Not cached, so it asks [[DNS]]: the resolver walks [[root]] → [[.com]] → [[authoritative]] server.',
  d2: 'The answer is an [[IP address]], cached at every step.',
  t1: 'A [[TCP]] connection opens: [[SYN]], [[SYN-ACK]], [[ACK]].',
  t2: '[[TLS]] then agrees on keys, so everything after is [[encrypted]].',
  s1: 'The request lands on a [[CDN edge]] near you, which serves the static [[HTML]] from its cache.',
  s2: 'It links to [[CSS]] and [[JS bundles]] with hashed names, cached for [[a year]].',
  r1: 'The browser builds the [[DOM]] and fetches CSS and JS [[in parallel]].',
  r2: '[[First paint]] shows the app shell while the [[data]] is still on its way.',
  g1: 'The JS calls the [[API]]: a [[fetch]] to the [[Go backend]], over the same connection.',
  g2: 'Go routes it to a [[handler]], through [[middleware]], queries the [[database]], and replies with [[JSON]].',
  h1: 'JS turns the [[JSON]] into elements; the browser [[lays out and paints]] the finished page.',
};
const nar = await narration('computer-science/behind-the-scenes/url-to-page', TXT);
const { caption } = nar;
const P = plan(nar, {
  dns: ['u1', 'd1', 'd2'], conn: ['t1', 't2'], edge: ['s1', 's2'], page: ['r1', 'r2'], api: ['g1', 'g2'], done: ['h1'],
});
const { CS, T } = P;
const sp = speech(nar, CS);

// ---- helpers --------------------------------------------------------------------------------------
/** a message arrow between two lifelines that is "sent" at time `at`, with a label above it */
function msg(ctx, lt, y, x0, x1, text, color, at, a, dur = 0.7) {
  const k = range(lt, at, at + dur);
  if (k <= 0) return;
  const xe = lerp(x0, x1, easeOut(k));
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(xe, y); ctx.stroke();
  const d = Math.sign(x1 - x0);
  ctx.beginPath(); ctx.moveTo(xe, y); ctx.lineTo(xe - 20 * d, y - 10); ctx.lineTo(xe - 20 * d, y + 10); ctx.closePath(); ctx.fill();
  ctx.restore();
  label(ctx, text, (x0 + x1) / 2, y - 26, { size: 26, mono: true, color, alpha: a * range(k, 0.3, 1), weight: 600 });
}

function lock(ctx, x, y, s, color, alpha) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3.5 * s;
  ctx.beginPath(); ctx.arc(x, y - 9 * s, 9 * s, Math.PI, 0); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(x - 14 * s, y - 9 * s, 28 * s, 22 * s, 4 * s); ctx.fill();
  ctx.restore();
}

function cylinder(ctx, x, y, w, h, color, alpha, text) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.fillStyle = `${color}33`;
  ctx.beginPath(); ctx.ellipse(x, y - h / 2, w / 2, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - w / 2, y - h / 2); ctx.lineTo(x - w / 2, y + h / 2); ctx.ellipse(x, y + h / 2, w / 2, 18, 0, Math.PI, 0, true); ctx.lineTo(x + w / 2, y - h / 2); ctx.stroke();
  ctx.restore();
  label(ctx, text, x, y + 8, { size: 26, mono: true, weight: 600, alpha });
}

/** the shop page: skeleton (loading) or filled with product cards */
function shopPage(ctx, x, y, w, h, alpha, fill, t) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.fillStyle = '#0e1530'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill();
  ctx.strokeStyle = C.dim; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = C.electron; ctx.fillRect(x + 24, y + 24, w * 0.3, 26);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x + w * 0.62, y + 30, w * 0.1, 14); ctx.fillRect(x + w * 0.76, y + 30, w * 0.1, 14);
  const cw = (w - 24 * 4) / 3, ch = h - 130;
  const names = ['Lamp', 'Chair', 'Desk'], prices = ['$29', '$89', '$149'], cols = [C.gold, GREEN, C.copper];
  for (let i = 0; i < 3; i++) {
    const cx0 = x + 24 + i * (cw + 24), cy0 = y + 90;
    const f = range(fill, i * 0.18, i * 0.18 + 0.5);
    const pulse = 0.12 + 0.05 * Math.sin(t * 5 + i);
    ctx.fillStyle = `rgba(255,255,255,${pulse * (1 - f) + 0.06 * f})`;
    ctx.beginPath(); ctx.roundRect(cx0, cy0, cw, ch, 10); ctx.fill();
    if (f > 0) {
      ctx.globalAlpha = alpha * f; ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.roundRect(cx0 + 14, cy0 + 14, cw - 28, ch * 0.5, 8); ctx.fill();
      ctx.globalAlpha = alpha;
      label(ctx, names[i], cx0 + cw / 2, cy0 + ch * 0.74, { size: 26, weight: 700, alpha: alpha * f });
      label(ctx, prices[i], cx0 + cw / 2, cy0 + ch * 0.9, { size: 24, mono: true, color: C.gold, alpha: alpha * f, weight: 600 });
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(cx0 + 14, cy0 + ch * 0.68, cw * 0.6, 12); ctx.fillRect(cx0 + 14, cy0 + ch * 0.82, cw * 0.4, 12);
    }
  }
  ctx.restore();
}

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      titleCard(ctx, t, T, { l1: 'From typing a URL', l2: 'to seeing the page', sub: 'static frontend · Go backend', tint: GO, size: 100 });
    },

    // ------------------------------------------------------------------ 01 URL + DNS
    dns(ctx, t) {
      const a = chapterAlpha(T, 'dns', t), lt = t - T.dns[0];
      chapterTag(ctx, '01', 'URL and DNS', a);
      // address bar
      const k0 = range(lt, 0.4, 1.0);
      panel(ctx, 330, 190, 1260, 84, C.dim, a * k0, 0.06, 42);
      lock(ctx, 378, 232, 1, GREEN, a * k0);
      const parts = [['https', VIOLET, 'scheme'], ['://', C.dim, ''], ['shop.example.com', C.electron, 'host'], ['/products', C.gold, 'path']];
      let x = 430;
      ctx.save(); ctx.font = '500 40px "IBM Plex Mono", monospace';
      parts.forEach(([txt, col, name], i) => {
        const w = ctx.measureText(txt).width;
        label(ctx, txt, x, 232, { size: 40, mono: true, color: col, alpha: a * k0, align: 'left', weight: 500 });
        if (name) {
          const nk = range(lt, sp('u1', 0.28 + i * 0.12), sp('u1', 0.28 + i * 0.12) + 0.5);
          ctx.save(); ctx.globalAlpha = a * nk; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 262); ctx.lineTo(x + w, 262); ctx.stroke(); ctx.restore();
          label(ctx, name, x + w / 2, 300, { size: 24, mono: true, color: col, alpha: a * nk, weight: 600 });
        }
        x += w;
      });
      ctx.restore();
      // caches
      ['browser cache', 'OS cache', 'router cache'].forEach((n, i) => {
        const k = range(lt, sp('u1', 0.62 + i * 0.1), sp('u1', 0.62 + i * 0.1) + 0.5);
        treeNode(ctx, n, 640 + i * 320, 380, C.dim, a * k, { size: 24, w: 270 });
        label(ctx, 'miss ✕', 640 + i * 320, 430, { size: 22, mono: true, color: C.proton, alpha: a * k, weight: 600 });
      });
      // resolver walk
      const dk = range(lt, sp('d1', 0.0), sp('d1', 0.0) + 0.7);
      const rx = 380, ry = 650, servers = [['root  .', 880, 'ask .com'], ['.com TLD', 1220, 'ask ns1.example.com'], ['authoritative', 1560, '203.0.113.7']];
      treeNode(ctx, 'resolver', rx, ry, BLUE, a * dk, { size: 28, w: 190 });
      label(ctx, 'browser → ISP / 1.1.1.1', rx, ry + 62, { size: 20, mono: true, color: C.dim, alpha: a * dk, weight: 500 });
      servers.forEach(([name, sx, answer], i) => {
        const at = sp('d1', 0.25 + i * 0.22), k = range(lt, at, at + 0.6);
        treeNode(ctx, name, sx, ry - 70, [C.gold, ORANGE, GREEN][i], a * k, { size: 26, w: 260 });
        const e = easeOut(range(lt, at + 0.2, at + 0.9));
        ctx.save(); ctx.globalAlpha = a * k * 0.9; ctx.strokeStyle = [C.gold, ORANGE, GREEN][i]; ctx.lineWidth = 3.5; ctx.setLineDash([10, 8]);
        ctx.beginPath(); ctx.moveTo(rx + 100, ry - 10); ctx.quadraticCurveTo((rx + sx) / 2, ry + 40 + i * 55, lerp(rx + 100, sx - 130, e), lerp(ry - 10, ry - 70, e)); ctx.stroke(); ctx.restore();
        label(ctx, `→ ${answer}`, sx, ry - 128, { size: 22, mono: true, color: i === 2 ? GREEN : C.dim, alpha: a * range(lt, at + 0.7, at + 1.3), weight: 600 });
      });
      // answer
      const ak = range(lt, sp('d2', 0.2), sp('d2', 0.2) + 0.7);
      token(ctx, 'shop.example.com = 203.0.113.7', 880, 800, GREEN, a * ak, 30);
      label(ctx, 'cached at each step · TTL 300 s', 1470, 800, { size: 24, mono: true, color: C.dim, alpha: a * range(lt, sp('d2', 0.5), sp('d2', 0.5) + 0.6), weight: 500 });
      caption(ctx, 'u1', a, lt, CS.u1);
      caption(ctx, 'd1', a, lt, CS.d1);
      caption(ctx, 'd2', a, lt, CS.d2);
    },

    // ------------------------------------------------------------------ 02 TCP + TLS
    conn(ctx, t) {
      const a = chapterAlpha(T, 'conn', t), lt = t - T.conn[0];
      chapterTag(ctx, '02', 'TCP and TLS', a);
      const bx = 500, sx = 1420, top = 210, bot = 870, on = range(lt, 0.3, 1.0);
      [[bx, 'browser', C.electron], [sx, 'server (edge)', GREEN]].forEach(([x, name, col]) => {
        treeNode(ctx, name, x, top, col, a * on, { size: 28, w: 260 });
        ctx.save(); ctx.globalAlpha = a * on * 0.5; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash([10, 10]);
        ctx.beginPath(); ctx.moveTo(x, top + 30); ctx.lineTo(x, bot); ctx.stroke(); ctx.restore();
      });
      label(ctx, 'TCP handshake', 140, 380, { size: 26, mono: true, color: C.gold, alpha: a * range(lt, sp('t1', 0.1), sp('t1', 0.1) + 0.5), align: 'left', weight: 600 });
      msg(ctx, lt, 330, bx, sx, 'SYN', C.gold, sp('t1', 0.12), a);
      msg(ctx, lt, 420, sx, bx, 'SYN-ACK', C.gold, sp('t1', 0.38), a);
      msg(ctx, lt, 510, bx, sx, 'ACK', C.gold, sp('t1', 0.64), a);
      label(ctx, 'connected ✓', CX, 560, { size: 24, mono: true, color: C.gold, alpha: a * range(lt, sp('t1', 0.9), sp('t1', 0.9) + 0.5), weight: 600 });
      label(ctx, 'TLS 1.3 handshake', 140, 640, { size: 26, mono: true, color: VIOLET, alpha: a * range(lt, sp('t2', 0.05), sp('t2', 0.05) + 0.5), align: 'left', weight: 600 });
      msg(ctx, lt, 650, bx, sx, 'ClientHello  (ciphers, key share)', VIOLET, sp('t2', 0.08), a);
      msg(ctx, lt, 740, sx, bx, 'ServerHello  + certificate', VIOLET, sp('t2', 0.34), a);
      msg(ctx, lt, 830, bx, sx, 'Finished  → encrypted', VIOLET, sp('t2', 0.6), a);
      const lk = range(lt, sp('t2', 0.85), sp('t2', 0.85) + 0.5);
      lock(ctx, bx, 735, 1.4, GREEN, a * lk);
      lock(ctx, sx, 735, 1.4, GREEN, a * lk);
      label(ctx, 'HTTPS ready', CX, 905, { size: 24, mono: true, color: GREEN, alpha: a * lk, weight: 600 });
      caption(ctx, 't1', a, lt, CS.t1);
      caption(ctx, 't2', a, lt, CS.t2);
    },

    // ------------------------------------------------------------------ 03 static frontend from the CDN
    edge(ctx, t) {
      const a = chapterAlpha(T, 'edge', t), lt = t - T.edge[0];
      chapterTag(ctx, '03', 'Static frontend from a CDN', a);
      const on = range(lt, 0.3, 1.0);
      treeNode(ctx, 'browser', 250, 360, C.electron, a * on, { size: 28, w: 190 });
      // three edge nodes, the nearest lights up
      [[860, 250], [960, 400], [860, 520]].forEach(([x, y], i) => {
        const near = i === 1;
        treeNode(ctx, near ? 'edge · nearest' : 'edge', x, y, near ? GREEN : C.dim, a * on, { size: 24, w: near ? 250 : 150, dashed: !near });
      });
      treeNode(ctx, 'origin storage', 1560, 400, C.dim, a * on * 0.7, { size: 26, w: 280, dashed: true });
      label(ctx, 'not needed on a hit', 1560, 450, { size: 20, mono: true, color: C.dim, alpha: a * range(lt, sp('s1', 0.6), sp('s1', 0.6) + 0.6), weight: 500 });
      const req = easeOut(range(lt, sp('s1', 0.1), sp('s1', 0.1) + 0.8));
      arrow(ctx, 360, 366, lerp(360, 820, req), lerp(366, 394, req), C.electron, a * req);
      label(ctx, 'GET /', 560, 330, { size: 26, mono: true, color: C.electron, alpha: a * req, weight: 600 });
      token(ctx, 'cache HIT', 1130, 330, GREEN, a * range(lt, sp('s1', 0.45), sp('s1', 0.45) + 0.5), 26);
      const rsp = easeOut(range(lt, sp('s1', 0.6), sp('s1', 0.6) + 0.8));
      arrow(ctx, lerp(820, 360, rsp), lerp(412, 386, rsp), 360, 386, GREEN, a * rsp);
      label(ctx, 'index.html · 1 KB', 580, 440, { size: 26, mono: true, color: GREEN, alpha: a * rsp, weight: 600 });
      // files with cache headers
      const rows = [['index.html', 'no-cache  (always revalidate)', C.electron], ['app.4f9a2c.js', 'max-age=31536000, immutable', C.gold], ['style.7c21b0.css', 'max-age=31536000, immutable', C.copper]];
      const fk = range(lt, sp('s2', 0.05), sp('s2', 0.05) + 0.6);
      panel(ctx, 300, 600, 1320, 250, C.dim, a * fk, 0.04);
      label(ctx, 'files in the build', 360, 640, { size: 24, mono: true, color: C.dim, alpha: a * fk, align: 'left', weight: 600 });
      rows.forEach(([n, h, col], i) => {
        const k = range(lt, sp('s2', 0.15 + i * 0.18), sp('s2', 0.15 + i * 0.18) + 0.5);
        label(ctx, n, 360, 700 + i * 52, { size: 30, mono: true, color: col, alpha: a * k, align: 'left', weight: 600 });
        label(ctx, `Cache-Control: ${h}`, 790, 700 + i * 52, { size: 26, mono: true, color: C.dim, alpha: a * k, align: 'left', weight: 500 });
      });
      label(ctx, 'new deploy → new hash → new URL', 1560, 640, { size: 22, mono: true, color: GREEN, alpha: a * range(lt, sp('s2', 0.7), sp('s2', 0.7) + 0.6), align: 'right', weight: 600 });
      caption(ctx, 's1', a, lt, CS.s1);
      caption(ctx, 's2', a, lt, CS.s2);
    },

    // ------------------------------------------------------------------ 04 parse, fetch, first paint
    page(ctx, t) {
      const a = chapterAlpha(T, 'page', t), lt = t - T.page[0];
      chapterTag(ctx, '04', 'Parse and first paint', a);
      const ax = 470, aw = 760, ms = (v) => ax + (v / 400) * aw;
      const rows = [['index.html', 0, 60, C.electron], ['style.css', 70, 130, C.copper], ['app.js', 70, 215, C.gold], ['logo.svg', 90, 150, GREEN]];
      const on = range(lt, 0.3, 0.9);
      ctx.save(); ctx.globalAlpha = a * on * 0.4; ctx.strokeStyle = C.dim; ctx.lineWidth = 2;
      for (let v = 0; v <= 400; v += 100) { ctx.beginPath(); ctx.moveTo(ms(v), 240); ctx.lineTo(ms(v), 640); ctx.stroke(); }
      ctx.restore();
      for (let v = 0; v <= 400; v += 100) label(ctx, `${v} ms`, ms(v), 668, { size: 20, mono: true, color: C.dim, alpha: a * on, weight: 500 });
      const play = range(lt, sp('r1', 0.1), sp('r1', 0.1) + 3.4);
      rows.forEach(([n, s0, s1, col], i) => {
        const y = 300 + i * 80;
        label(ctx, n, ax - 20, y, { size: 28, mono: true, color: col, alpha: a * on, align: 'right', weight: 600 });
        const w = Math.max(0, Math.min(ms(s1), ms(400 * play)) - ms(s0));
        ctx.save(); ctx.globalAlpha = a * on; ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(ms(s0), y - 17, Math.max(0, w), 34, 8); ctx.fill(); ctx.restore();
      });
      // milestones
      const m = [['DOM ready', 215, C.electron, 0], ['first paint', 240, GREEN, 1]];
      m.forEach(([n, v, col, i]) => {
        const k = range(lt, sp(i ? 'r2' : 'r1', 0.35), sp(i ? 'r2' : 'r1', 0.35) + 0.6);
        ctx.save(); ctx.globalAlpha = a * k; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.moveTo(ms(v), 250); ctx.lineTo(ms(v), 640); ctx.stroke(); ctx.restore();
        label(ctx, n, ms(v) + (i ? 14 : -14), 722 + i * 0, { size: 24, mono: true, color: col, alpha: a * k, align: i ? 'left' : 'right', weight: 600 });
      });
      // page preview
      const fk = range(lt, sp('r2', 0.3), sp('r2', 0.3) + 0.8);
      label(ctx, 'what you see', 1560, 215, { size: 24, mono: true, color: C.dim, alpha: a * fk, weight: 600 });
      shopPage(ctx, 1330, 250, 460, 400, a * fk, 0, t);
      label(ctx, 'app shell + loading placeholders', 1560, 690, { size: 22, mono: true, color: C.dim, alpha: a * fk, weight: 500 });
      caption(ctx, 'r1', a, lt, CS.r1);
      caption(ctx, 'r2', a, lt, CS.r2);
    },

    // ------------------------------------------------------------------ 05 the Go API
    api(ctx, t) {
      const a = chapterAlpha(T, 'api', t), lt = t - T.api[0];
      chapterTag(ctx, '05', 'The Go backend', a);
      const on = range(lt, 0.3, 1.0), y = 430;
      treeNode(ctx, 'browser', 220, y, C.electron, a * on, { size: 28, w: 190 });
      treeNode(ctx, 'proxy / TLS', 520, y, C.dim, a * on, { size: 26, w: 220 });
      // Go server panel
      panel(ctx, 700, 280, 700, 300, GO, a * on, 0.05, 24);
      label(ctx, 'Go server  (net/http)', 1050, 316, { size: 26, mono: true, color: GO, alpha: a * on, weight: 600 });
      const steps = [['router', 800], ['middleware', 1050], ['handler', 1300]];
      steps.forEach(([n, x], i) => {
        const k = range(lt, sp('g2', 0.0 + i * 0.16), sp('g2', 0.0 + i * 0.16) + 0.5);
        treeNode(ctx, n, x, y, GO, a * Math.max(on * 0.5, k), { size: 26, w: i === 1 ? 210 : 160 });
        if (i < 2) arrow(ctx, x + (i === 1 ? 108 : 82), y, steps[i + 1][1] - (i === 0 ? 112 : 84), y, C.dim, a * on * 0.8);
      });
      label(ctx, 'auth · logging · CORS', 1050, y + 62, { size: 20, mono: true, color: C.dim, alpha: a * range(lt, sp('g2', 0.2), sp('g2', 0.2) + 0.5), weight: 500 });
      cylinder(ctx, 1640, y, 150, 120, ORANGE, a * on, 'DB');
      // request path
      const q = easeOut(range(lt, sp('g1', 0.1), sp('g1', 0.1) + 0.9));
      arrow(ctx, 320, y, lerp(320, 400, Math.min(1, q * 2.4)), y, C.electron, a * Math.min(1, q * 2.4));
      arrow(ctx, 640, y, lerp(640, 700, range(q, 0.55, 1)), y, C.electron, a * range(q, 0.5, 1));
      label(ctx, 'GET /api/products', 520, y - 52, { size: 24, mono: true, color: C.electron, alpha: a * q, weight: 600 });
      token(ctx, 'fetch()', 220, y - 100, C.gold, a * range(lt, sp('g1', 0.05), sp('g1', 0.05) + 0.5), 26);
      const dq = range(lt, sp('g2', 0.5), sp('g2', 0.5) + 0.7);
      arrow(ctx, 1390, y, 1560, y, ORANGE, a * dq);
      label(ctx, 'SELECT … FROM products', 1640, y + 100, { size: 20, mono: true, color: ORANGE, alpha: a * dq, weight: 600 });
      // JSON response
      const jk = range(lt, sp('g2', 0.75), sp('g2', 0.75) + 0.8);
      panel(ctx, 560, 650, 800, 190, GREEN, a * jk, 0.05);
      ['{ "products": [', '  { "id": 1, "name": "Lamp",  "price": 29 },', '  { "id": 2, "name": "Chair", "price": 89 }, … ] }'].forEach((l, i) => label(ctx, l, 600, 690 + i * 48, { size: 27, mono: true, alpha: a * jk, align: 'left', weight: 500 }));
      label(ctx, '200 OK · application/json · 12 ms', 960, 880, { size: 22, mono: true, color: GREEN, alpha: a * jk, weight: 600 });
      caption(ctx, 'g1', a, lt, CS.g1);
      caption(ctx, 'g2', a, lt, CS.g2);
    },

    // ------------------------------------------------------------------ 06 render the data
    done(ctx, t) {
      const a = chapterAlpha(T, 'done', t), lt = t - T.done[0];
      chapterTag(ctx, '06', 'Render', a);
      const fill = range(lt, sp('h1', 0.25), sp('h1', 0.25) + 1.6);
      shopPage(ctx, 600, 200, 720, 440, a * range(lt, 0.3, 0.9), fill, t);
      // JSON chips flying into the cards
      ['Lamp', 'Chair', 'Desk'].forEach((n, i) => {
        const at = sp('h1', 0.1 + i * 0.1), k = range(lt, at, at + 0.9);
        if (k > 0 && k < 1) token(ctx, `{ ${n} }`, lerp(260, 740 + i * 220, easeInOut(k)), lerp(300, 450, easeInOut(k)), GREEN, a * (1 - range(k, 0.8, 1)), 26);
      });
      // timeline
      const tk = range(lt, sp('h1', 0.6), sp('h1', 0.6) + 0.8);
      const segs = [['DNS', 20, C.gold], ['TCP+TLS', 60, VIOLET], ['HTML', 40, C.electron], ['JS+CSS', 80, C.copper], ['API', 50, GO], ['render', 30, GREEN]];
      const total = segs.reduce((n, s) => n + s[1], 0), x0 = 260, W0 = 1400;
      let x = x0;
      segs.forEach(([n, v, col], i) => {
        const w = (v / total) * W0 * easeOut(range(lt, sp('h1', 0.65 + i * 0.05), sp('h1', 0.65 + i * 0.05) + 0.6));
        ctx.save(); ctx.globalAlpha = a * tk; ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x, 725, Math.max(0, w - 4), 54, 8); ctx.fill(); ctx.restore();
        label(ctx, n, x + (v / total) * W0 / 2, 810, { size: 22, mono: true, color: col, alpha: a * tk, weight: 600 });
        label(ctx, `${v}`, x + (v / total) * W0 / 2, 752, { size: 24, mono: true, color: C.bg, alpha: a * tk * range(w, 40, 60), weight: 700 });
        x += (v / total) * W0;
      });
      label(ctx, `≈ ${total} ms in total  (typical, with a warm CDN)`, CX, 690, { size: 26, mono: true, color: C.gold, alpha: a * tk, weight: 600 });
      caption(ctx, 'h1', a, lt, CS.h1);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, ...T.outro, 0.7, 0.8), lt = t - T.outro[0];
      label(ctx, 'A name becomes an address,', CX, CY - 130, { size: 74, weight: 700, alpha: a * range(lt, 0.3, 1.1) });
      label(ctx, 'an address becomes a secure connection,', CX, CY - 40, { size: 74, weight: 700, alpha: a * range(lt, 1.6, 2.4), color: VIOLET });
      label(ctx, 'and a few requests become a page.', CX, CY + 50, { size: 74, weight: 700, alpha: a * range(lt, 3.0, 3.8), color: GREEN });
      const k = range(lt, 4.2, 5.0);
      ['DNS', 'TCP + TLS', 'CDN', 'Go API', 'pixels'].forEach((s, i) => {
        const x = CX - 640 + i * 320;
        token(ctx, s, x, CY + 240, [C.gold, VIOLET, GREEN, GO, C.electron][i], a * k, 28);
        if (i < 4) arrow(ctx, x + 110, CY + 240, x + 210, CY + 240, C.dim, a * k);
      });
    },
  },
});
