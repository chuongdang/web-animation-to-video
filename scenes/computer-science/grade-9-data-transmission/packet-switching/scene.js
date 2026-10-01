import { C, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, chip, panel, arrow, pathAt } from '/runtime/kit.js';

const { clamp, lerp, range, easeOut, easeInOut, fadeWindow } = Scene;

const GREEN = '#7ee787', VIOLET = '#b48cff';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- computer-science/g9-packet-switching`.
const TXT = {
  pk1: 'Data sent over a long distance is broken into [[data packets]] (datagrams).',
  pk2: 'Each packet has a [[header]], the [[payload]] and a [[trailer]].',
  pk3: 'The header holds the [[sender IP]], the [[receiver IP]], the [[sequence number]] and the [[packet size]].',
  ps1: 'In [[packet switching]], each packet travels independently, and [[routers]] decide its route.',
  ps2: 'A router picks the [[shortest available]] path, avoiding routes that are [[broken or busy]].',
  ps3: 'Packets can arrive [[out of order]], so the receiver [[reassembles]] them using the sequence numbers.',
  ps4: '[[Benefit:green]]: alternative routes if one is broken or overloaded. [[Drawback:proton]]: the data must be reassembled.',
};
const nar = await narration('computer-science/grade-9-data-transmission/packet-switching', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { packets: ['pk1', 'pk2', 'pk3'], switching: ['ps1', 'ps2', 'ps3'], summary: ['ps4'] });
const { CS, T } = P;
const sp = speech(nar, CS);

const PAYLOAD = ['HEL', 'LO ', 'WOR', 'LD!'];

/** a packet card: header | payload | trailer. (x, y) is the centre. */
function packet(ctx, x, y, w, seq, alpha, { labels = false, dim = 1, hr = 0.3 } = {}) {
  const h = w * hr, hx = x - w / 2, f = [0.34, 0.4, 0.26];
  const cols = [C.electron, C.gold, VIOLET];
  let cx = hx;
  f.forEach((fr, i) => {
    ctx.save(); ctx.globalAlpha = alpha * dim;
    ctx.fillStyle = cols[i] + '33'; ctx.strokeStyle = cols[i]; ctx.lineWidth = Math.max(2, w * 0.012);
    ctx.beginPath(); ctx.roundRect(cx, y - h / 2, w * fr, h, [i === 0 ? 10 : 0, i === 2 ? 10 : 0, i === 2 ? 10 : 0, i === 0 ? 10 : 0]); ctx.fill(); ctx.stroke(); ctx.restore();
    const text = i === 0 ? (labels ? 'header' : `#${seq + 1}`) : i === 1 ? (labels ? 'payload' : PAYLOAD[seq]) : (labels ? 'trailer' : 'T');
    label(ctx, text, cx + (w * fr) / 2, y, { size: Math.max(14, w * (labels ? 0.038 : 0.085)), mono: true, weight: 700, alpha: alpha * dim, color: cols[i] === C.gold ? C.gold : C.text });
    cx += w * fr;
  });
}

// ---- the network ------------------------------------------------------------------
const N = { S: [250, 560], A: [610, 370], B: [610, 750], C: [970, 560], D: [1330, 370], E: [1330, 750], R: [1690, 560] };
const LINKS = [['S', 'A'], ['S', 'B'], ['A', 'C'], ['B', 'C'], ['A', 'D'], ['B', 'E'], ['C', 'D'], ['C', 'E'], ['D', 'R'], ['E', 'R']];
const ROUTES = [['S', 'A', 'C', 'D', 'R'], ['S', 'B', 'E', 'R'], ['S', 'A', 'D', 'R'], ['S', 'B', 'C', 'E', 'R']];
const SPEED = 560, STAGGER = 0.15;
const routeLen = (r) => r.slice(1).reduce((s, k, i) => s + Math.hypot(N[k][0] - N[r[i]][0], N[k][1] - N[r[i]][1]), 0);
const ARRIVE = ROUTES.map((r, i) => i * STAGGER + routeLen(r) / SPEED); // seconds after the packets leave
const ORDER = ARRIVE.map((t, i) => [t, i]).sort((a, b) => a[0] - b[0]).map((x) => x[1]); // arrival order (packet indices)

function drawNet(ctx, a, opts = {}) {
  const { busy = 0, broken = 0 } = opts;
  LINKS.forEach(([u, v]) => {
    const isBusy = u === 'A' && v === 'D';
    ctx.save(); ctx.globalAlpha = a * 0.6; ctx.strokeStyle = isBusy && busy > 0 ? C.proton : C.dim; ctx.lineWidth = isBusy && busy > 0 ? 6 : 3;
    if (isBusy && busy > 0) ctx.setLineDash([12, 10]);
    ctx.beginPath(); ctx.moveTo(...N[u]); ctx.lineTo(...N[v]); ctx.stroke(); ctx.restore();
  });
  if (busy > 0) label(ctx, 'busy', (N.A[0] + N.D[0]) / 2, (N.A[1] + N.D[1]) / 2 - 24, { size: 26, mono: true, color: C.proton, alpha: a * busy, weight: 700 });
  if (broken > 0) {
    const mx = (N.B[0] + N.E[0]) / 2, my = (N.B[1] + N.E[1]) / 2;
    label(ctx, '✗ broken', mx, my + 30, { size: 26, mono: true, color: C.proton, alpha: a * broken, weight: 700 });
  }
  Object.entries(N).forEach(([k, [x, y]]) => {
    const dev = k === 'S' || k === 'R';
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = dev ? 'rgba(126,231,135,0.12)' : 'rgba(77,216,255,0.10)'; ctx.strokeStyle = dev ? GREEN : C.electron; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.roundRect(x - (dev ? 70 : 44), y - (dev ? 50 : 34), dev ? 140 : 88, dev ? 100 : 68, 16); ctx.fill(); ctx.stroke(); ctx.restore();
    label(ctx, dev ? (k === 'S' ? 'sender' : 'receiver') : 'router', x, y, { size: dev ? 26 : 20, mono: true, weight: 700, alpha: a, color: dev ? GREEN : C.electron });
  });
}

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      PAYLOAD.forEach((_, i) => packet(ctx, 330 + i * 420, 200 + (i % 2) * 50, 300, i, a * 0.3 * range(t, 0.2 + i * 0.15, 0.8 + i * 0.15)));
      titleCard(ctx, t, T, { l1: 'How does data', l2: 'travel as packets?', sub: 'Unit 2 · Data transmission · Grade 9', tint: C.electron, size: 106 });
    },

    packets(ctx, t) {
      const a = chapterAlpha(T, 'packets', t), lt = t - T.packets[0];
      chapterTag(ctx, '01', 'Data packets', a);
      // the message splits
      const split = easeInOut(range(lt, sp('pk1', 0.35), sp('pk1', 0.35) + 1.4));
      const p1 = a * (1 - range(lt, CS.pk2 - 0.3, CS.pk2 + 0.3));
      label(ctx, 'HELLO WORLD!', CX, 260, { size: 84, mono: true, weight: 700, alpha: p1 * (1 - split) * range(lt, 0.4, 1.1) });
      PAYLOAD.forEach((_, i) => {
        const x = lerp(CX, 330 + i * 420, split), y = lerp(260, 520, split);
        packet(ctx, x, y, lerp(240, 320, split), i, p1 * split);
      });
      label(ctx, 'message', CX, 340, { size: 26, mono: true, color: C.dim, alpha: p1 * (1 - split), weight: 500 });
      label(ctx, '4 data packets', CX, 650, { size: 30, mono: true, color: C.electron, alpha: p1 * split, weight: 700 });

      // pk2: one packet, three parts
      const p2 = a * range(lt, CS.pk2, CS.pk2 + 0.6);
      if (p2 > 0) {
        packet(ctx, CX, 400, 1100, 1, p2, { labels: true, hr: 0.14 });
        [['header', 0.17, C.electron], ['payload (the data)', 0.55, C.gold], ['trailer', 0.87, VIOLET]].forEach(([n, f, col], i) => {
          const k = range(lt, sp('pk2', 0.25 + i * 0.22), sp('pk2', 0.25 + i * 0.22) + 0.6);
          label(ctx, n, CX - 550 + 1100 * f, 285, { size: 30, mono: true, color: col, alpha: p2 * k, weight: 700 });
        });
        // pk3: header contents
        const hk = range(lt, CS.pk3, CS.pk3 + 0.6);
        const fields = [['IP address of the sender', '192.168.1.5'], ['IP address of the receiver', '10.0.0.9'], ['sequence number', '2'], ['packet size', '512 bytes']];
        ctx.save(); ctx.globalAlpha = p2 * hk * 0.7; ctx.strokeStyle = C.electron; ctx.lineWidth = 3; ctx.setLineDash([8, 8]);
        ctx.beginPath(); ctx.moveTo(CX - 550 + 187, 480); ctx.lineTo(CX - 550 + 187, 540); ctx.stroke(); ctx.restore();
        fields.forEach(([n, v], i) => {
          const k = range(lt, sp('pk3', 0.1 + i * 0.2), sp('pk3', 0.1 + i * 0.2) + 0.6);
          const x = 250 + (i % 2) * 720, y = 620 + Math.floor(i / 2) * 120;
          panel(ctx, x, y - 44, 660, 90, C.electron, p2 * k, 0.05, 16);
          label(ctx, n, x + 24, y - 12, { size: 26, mono: true, color: C.dim, alpha: p2 * k, align: 'left', weight: 500 });
          label(ctx, v, x + 24, y + 22, { size: 34, mono: true, color: C.text, alpha: p2 * k, align: 'left', weight: 700 });
        });
      }
      caption(ctx, 'pk1', a, lt, CS.pk1);
      caption(ctx, 'pk2', a, lt, CS.pk2);
      caption(ctx, 'pk3', a, lt, CS.pk3);
    },

    switching(ctx, t) {
      const a = chapterAlpha(T, 'switching', t), lt = t - T.switching[0];
      chapterTag(ctx, '02', 'Packet switching', a);
      const t0 = sp('ps1', 0.3);
      const busy = range(lt, t0 + 0.4, t0 + 0.8) * (1 - range(lt, t0 + 1.4, t0 + 1.8));
      drawNet(ctx, a * easeOut(range(lt, 0.3, 1)), { busy });

      // packets in flight
      ROUTES.forEach((route, i) => {
        const start = t0 + i * STAGGER, len = routeLen(route);
        const u = clamp((lt - start) * SPEED / len, 0, 1);
        if (lt < start || u >= 1) return;
        const pts = route.map((k) => N[k]);
        const [x, y] = pathAt(pts, u);
        packet(ctx, x, y - 44, 130, i, a);
      });
      // the receiver's queue: arrival order, then sorted by sequence number
      const arrivalStart = t0;
      const sortT = sp('ps3', 0.45), sorted = easeInOut(range(lt, sortT, sortT + 1.2));
      label(ctx, 'arrived at the receiver:', 1000, 190, { size: 24, mono: true, color: C.dim, alpha: a * range(lt, t0 + 1.5, t0 + 2.2), align: 'right', weight: 600 });
      ORDER.forEach((pi, slot) => {
        const arrived = lt >= arrivalStart + ARRIVE[pi];
        if (!arrived) return;
        const x0 = 1120 + slot * 180, x1 = 1120 + pi * 180;
        packet(ctx, lerp(x0, x1, sorted), 200, 150, pi, a * range(lt, arrivalStart + ARRIVE[pi], arrivalStart + ARRIVE[pi] + 0.4));
      });
      const ordered = range(lt, sortT + 1.0, sortT + 1.8);
      label(ctx, sorted > 0.5 ? 'reassembled: HELLO WORLD!' : 'order of arrival', 1400, 260, { size: 26, mono: true, color: sorted > 0.5 ? GREEN : C.proton, alpha: a * range(lt, t0 + 3.2, t0 + 3.8), weight: 700 });
      void ordered;
      // router decision note during ps2
      const dk = range(lt, sp('ps2', 0.35), sp('ps2', 0.35) + 0.7);
      label(ctx, 'router A avoids the busy link and takes A → C → D', CX, 880, { size: 26, mono: true, color: C.gold, alpha: a * dk * (1 - range(lt, CS.ps3, CS.ps3 + 0.5)), weight: 600 });
      caption(ctx, 'ps1', a, lt, CS.ps1);
      caption(ctx, 'ps2', a, lt, CS.ps2);
      caption(ctx, 'ps3', a, lt, CS.ps3);
    },

    summary(ctx, t) {
      const a = chapterAlpha(T, 'summary', t), lt = t - T.summary[0];
      chapterTag(ctx, '03', 'Benefit and drawback', a);
      const cards = [
        { title: 'Benefit', color: GREEN, at: sp('ps4', 0.05), lines: ['alternative routes are', 'available if a route is', 'broken or overloaded'] },
        { title: 'Drawback', color: C.proton, at: sp('ps4', 0.55), lines: ['the data must be', 'reassembled when it', 'reaches its destination'] },
      ];
      cards.forEach((c, i) => {
        const x = 200 + i * 800, k = easeOut(range(lt, c.at, c.at + 0.8));
        panel(ctx, x, 280 + (1 - k) * 30, 720, 460, c.color, a * k);
        label(ctx, c.title, x + 360, 340 + (1 - k) * 30, { size: 52, weight: 700, color: c.color, alpha: a * k });
        c.lines.forEach((ln, j) => label(ctx, ln, x + 360, 420 + j * 46 + (1 - k) * 30, { size: 32, alpha: a * k, weight: 500 }));
        // mini illustrations
        if (i === 0) {
          ctx.save(); ctx.globalAlpha = a * k;
          const yy = 640 + (1 - k) * 30;
          ctx.strokeStyle = C.dim; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 120, yy); ctx.lineTo(x + 600, yy); ctx.stroke();
          ctx.strokeStyle = GREEN; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(x + 240, yy); ctx.quadraticCurveTo(x + 360, yy - 80, x + 480, yy); ctx.stroke(); ctx.setLineDash([]);
          ctx.strokeStyle = C.proton; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x + 330, yy - 18); ctx.lineTo(x + 390, yy + 18); ctx.moveTo(x + 390, yy - 18); ctx.lineTo(x + 330, yy + 18); ctx.stroke(); ctx.restore();
        } else {
          [2, 0, 3, 1].forEach((pi, j) => packet(ctx, x + 130 + j * 155, 640 + (1 - k) * 30, 140, pi, a * k * (1 - range(lt, sp('ps4', 0.85), sp('ps4', 0.85) + 0.6) * 0.5)));
        }
      });
      caption(ctx, 'ps4', a, lt, CS.ps4);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 5;
      [['split into packets', C.electron], ['routed independently', C.gold], ['reassembled at the destination', GREEN]].forEach(([txt, col], i) => {
        label(ctx, txt, CX, 340 + i * 110, { size: 66, weight: 700, color: col, alpha: a * range(lt, 0.4 + (s * i) / 3.5, 1.1 + (s * i) / 3.5) });
      });
    },
  },
});
