import { C, CX, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, chip, panel, arrow } from '/runtime/kit.js';

const { clamp, lerp, range, easeOut, easeInOut, fadeWindow } = Scene;

const GREEN = '#7ee787', VIOLET = '#b48cff';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- computer-science/g9-error-detection`.
const TXT = {
  nd1: 'When data is transmitted it can be [[corrupted]], [[lost]] or even [[gained:proton]].',
  nd2: 'Causes: [[interference]], problems during [[packet switching]], and [[skewing]] of data.',
  ck1: 'A [[checksum]] is calculated from a block of data and sent at the end. The receiver [[recalculates]] and compares.',
  ec1: 'With an [[echo check]], the data is sent back to the sender, who [[compares]] the two copies.',
  ar1: 'With [[ARQ]], the receiver sends an [[acknowledgement]] when data arrives correctly; then the next block is sent.',
  ar2: 'No acknowledgement before the [[timeout]], or a [[negative acknowledgement]]: the block is [[sent again]].',
};
const nar = await narration('computer-science/grade-9-data-transmission/error-detection', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { need: ['nd1', 'nd2'], check: ['ck1', 'ec1'], arq: ['ar1', 'ar2'] });
const { CS, T } = P;
const sp = speech(nar, CS);

function bits(ctx, x, y, str, color, alpha, { bad = -1, gap = 76, size = 44 } = {}) {
  [...str].forEach((b, i) => {
    const col = i === bad ? C.proton : color;
    panel(ctx, x + i * gap - 32, y - 34, 64, 68, col, alpha, b === '1' ? 0.14 : 0.03, 12);
    label(ctx, b, x + i * gap, y, { size, mono: true, weight: 700, alpha, color: i === bad ? C.proton : C.text });
  });
}

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      bits(ctx, CX - 266, 200, '10110010', C.electron, a * 0.3 * range(t, 0.2, 1), { bad: Math.floor(t * 1.5) % 8, gap: 76 });
      titleCard(ctx, t, T, { l1: 'How do computers', l2: 'detect errors?', sub: 'Unit 2 · Data transmission · Grade 9', tint: C.proton, size: 106 });
    },

    need(ctx, t) {
      const a = chapterAlpha(T, 'need', t), lt = t - T.need[0];
      chapterTag(ctx, '01', 'The need for error detection', a);
      const p1 = a * (1 - range(lt, CS.nd2 - 0.3, CS.nd2 + 0.3)), p2 = a * range(lt, CS.nd2, CS.nd2 + 0.6);
      if (p1 > 0) {
        const cases = [
          { name: 'corrupted', sub: 'a bit changes', color: C.proton, from: '10110010', to: '10111010', bad: 4, at: sp('nd1', 0.2) },
          { name: 'lost', sub: 'data goes missing', color: C.gold, from: '10110010', to: '1011', bad: -1, at: sp('nd1', 0.45) },
          { name: 'gained', sub: 'extra data appears', color: VIOLET, from: '10110010', to: '101100110', bad: 6, at: sp('nd1', 0.75) },
        ];
        cases.forEach((c, i) => {
          const y = 330 + i * 150, k = easeOut(range(lt, c.at, c.at + 0.8));
          label(ctx, c.name, 250, y - 14, { size: 40, weight: 700, color: c.color, alpha: p1 * k, align: 'left' });
          label(ctx, c.sub, 250, y + 26, { size: 22, mono: true, color: C.dim, alpha: p1 * k, align: 'left', weight: 500 });
          bits(ctx, 620, y, c.from, C.electron, p1 * k, { gap: 60, size: 34 });
          arrow(ctx, 1130, y, 1200, y, C.dim, p1 * k, 4);
          bits(ctx, 1290, y, c.to, C.electron, p1 * k * range(lt, c.at + 0.5, c.at + 1.1), { gap: 60, size: 34, bad: c.bad });
          if (c.name === 'lost') label(ctx, '(4 bits never arrived)', 1290 + 4 * 60 + 90, y, { size: 22, mono: true, color: C.gold, alpha: p1 * k * range(lt, c.at + 0.8, c.at + 1.4), align: 'left', weight: 500 });
        });
      }
      if (p2 > 0) {
        const causes = [
          { name: 'interference', sub: 'electric interference corrupts or loses data on any cable', color: C.electron, at: sp('nd2', 0.1) },
          { name: 'packet switching', sub: 'problems can lose data, or even add data', color: C.gold, at: sp('nd2', 0.4) },
          { name: 'skewing', sub: 'bits arrive out of sync in parallel transmission', color: GREEN, at: sp('nd2', 0.7) },
        ];
        causes.forEach((c, i) => {
          const y = 330 + i * 150, k = easeOut(range(lt, c.at, c.at + 0.8));
          panel(ctx, 260 + (1 - k) * 60, y - 56, 1400, 112, c.color, p2 * k, 0.05, 22);
          label(ctx, c.name, 310 + (1 - k) * 60, y - 12, { size: 46, weight: 700, color: c.color, alpha: p2 * k, align: 'left' });
          label(ctx, c.sub, 310 + (1 - k) * 60, y + 30, { size: 26, mono: true, color: C.dim, alpha: p2 * k, align: 'left', weight: 500 });
        });
      }
      caption(ctx, 'nd1', a, lt, CS.nd1);
      caption(ctx, 'nd2', a, lt, CS.nd2);
    },

    check(ctx, t) {
      const a = chapterAlpha(T, 'check', t), lt = t - T.check[0];
      chapterTag(ctx, '02', 'Checksum and echo check', a);
      const p1 = a * (1 - range(lt, CS.ec1 - 0.3, CS.ec1 + 0.3)), p2 = a * range(lt, CS.ec1, CS.ec1 + 0.6);
      if (p1 > 0) {
        const sent = [4, 8, 15, 3], got = [4, 8, 16, 3];
        const sum = (arr) => arr.reduce((s, v) => s + v, 0);
        label(ctx, 'sender', 400, 260, { size: 30, mono: true, color: C.electron, alpha: p1, weight: 700 });
        label(ctx, 'receiver', 1420, 260, { size: 30, mono: true, color: GREEN, alpha: p1, weight: 700 });
        sent.forEach((v, i) => { panel(ctx, 290 + i * 100 - 40, 320, 80, 70, C.electron, p1 * range(lt, 0.4 + i * 0.1, 0.9 + i * 0.1), 0.06, 12); label(ctx, String(v), 290 + i * 100, 355, { size: 34, mono: true, weight: 700, alpha: p1 * range(lt, 0.4 + i * 0.1, 0.9 + i * 0.1) }); });
        const ck = range(lt, sp('ck1', 0.25), sp('ck1', 0.25) + 0.7);
        panel(ctx, 690 - 50, 320, 100, 70, C.gold, p1 * ck, 0.1, 12);
        label(ctx, String(sum(sent)), 690, 355, { size: 34, mono: true, weight: 700, color: C.gold, alpha: p1 * ck });
        label(ctx, 'checksum = 4 + 8 + 15 + 3', 490, 430, { size: 24, mono: true, color: C.gold, alpha: p1 * ck, weight: 600 });
        // in transit
        const move = easeInOut(range(lt, sp('ck1', 0.45), sp('ck1', 0.45) + 1.6));
        ctx.save(); ctx.globalAlpha = p1 * range(lt, sp('ck1', 0.45), sp('ck1', 0.45) + 0.5); ctx.translate(lerp(0, 1000, move) * 0.0, 0); ctx.restore();
        arrow(ctx, 780, 355, 1000, 355, C.dim, p1 * range(lt, sp('ck1', 0.45), sp('ck1', 0.45) + 0.6), 5);
        const rk = range(lt, sp('ck1', 0.6), sp('ck1', 0.6) + 0.7);
        got.forEach((v, i) => { const bad = i === 2; panel(ctx, 1160 + i * 100 - 40, 320, 80, 70, bad ? C.proton : GREEN, p1 * rk, 0.06, 12); label(ctx, String(v), 1160 + i * 100, 355, { size: 34, mono: true, weight: 700, alpha: p1 * rk, color: bad ? C.proton : C.text }); });
        panel(ctx, 1560 - 50, 320, 100, 70, C.gold, p1 * rk, 0.1, 12);
        label(ctx, String(sum(sent)), 1560, 355, { size: 34, mono: true, weight: 700, color: C.gold, alpha: p1 * rk });
        const vk = range(lt, sp('ck1', 0.8), sp('ck1', 0.8) + 0.7);
        label(ctx, `receiver recalculates: 4 + 8 + 16 + 3 = ${sum(got)}`, CX, 560, { size: 34, mono: true, alpha: p1 * vk, weight: 600 });
        label(ctx, `${sum(got)} ≠ ${sum(sent)}   ✗  error detected`, CX, 640, { size: 46, mono: true, weight: 700, color: C.proton, alpha: p1 * vk });
      }
      if (p2 > 0) {
        label(ctx, 'sender', 400, 260, { size: 30, mono: true, color: C.electron, alpha: p2, weight: 700 });
        label(ctx, 'receiver', 1420, 260, { size: 30, mono: true, color: GREEN, alpha: p2, weight: 700 });
        const go = range(lt, sp('ec1', 0.2), sp('ec1', 0.2) + 1.0), back = range(lt, sp('ec1', 0.45), sp('ec1', 0.45) + 1.0);
        bits(ctx, 240, 360, '1011', C.electron, p2 * range(lt, 0.3, 0.9), { gap: 90 });
        label(ctx, 'sent', 240 + 135, 300, { size: 22, mono: true, color: C.dim, alpha: p2, weight: 500 });
        arrow(ctx, 640, 340, 1100, 340, C.electron, p2 * go, 5);
        bits(ctx, 1180, 360, '1001', GREEN, p2 * go, { gap: 90, bad: 2 });
        label(ctx, 'received', 1180 + 135, 300, { size: 22, mono: true, color: C.dim, alpha: p2 * go, weight: 500 });
        arrow(ctx, 1100, 470, 640, 470, GREEN, p2 * back, 5);
        label(ctx, 'echoed back', 870, 510, { size: 24, mono: true, color: GREEN, alpha: p2 * back, weight: 600 });
        bits(ctx, 240, 590, '1001', GREEN, p2 * back, { gap: 90, bad: 2 });
        label(ctx, 'sender compares:', 240 + 135, 680, { size: 26, mono: true, color: C.dim, alpha: p2 * back, weight: 600 });
        const vk = range(lt, sp('ec1', 0.75), sp('ec1', 0.75) + 0.7);
        label(ctx, '1011  vs  1001   ✗  not the same: error!', CX + 200, 760, { size: 40, mono: true, weight: 700, color: C.proton, alpha: p2 * vk });
      }
      caption(ctx, 'ck1', a, lt, CS.ck1);
      caption(ctx, 'ec1', a, lt, CS.ec1);
    },

    arq(ctx, t) {
      const a = chapterAlpha(T, 'arq', t), lt = t - T.arq[0];
      chapterTag(ctx, '03', 'ARQ', a);
      const SX = 520, RX = 1400;
      const k = easeOut(range(lt, 0.3, 1));
      label(ctx, 'sender', SX, 230, { size: 34, mono: true, color: C.electron, alpha: a * k, weight: 700 });
      label(ctx, 'receiver', RX, 230, { size: 34, mono: true, color: GREEN, alpha: a * k, weight: 700 });
      [SX, RX].forEach((x, i) => { ctx.save(); ctx.globalAlpha = a * k * 0.6; ctx.strokeStyle = i ? GREEN : C.electron; ctx.lineWidth = 4; ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.moveTo(x, 260); ctx.lineTo(x, 850); ctx.stroke(); ctx.restore(); });
      const msg = (from, to, y0, y1, text, color, start, { lostAt = null } = {}) => {
        const u = range(lt, start, start + 1.0);
        if (u <= 0) return;
        const uu = lostAt !== null ? Math.min(u, lostAt) : u;
        const x0 = from, x1 = lerp(from, to, uu), yy1 = lerp(y0, y1, uu);
        arrow(ctx, x0, y0, x1, yy1, color, a, 5);
        label(ctx, text, (x0 + x1) / 2, (y0 + yy1) / 2 - 22, { size: 26, mono: true, color, alpha: a, weight: 700 });
        if (lostAt !== null && u > lostAt) label(ctx, '✗ lost', x1, yy1 + 34, { size: 30, mono: true, color: C.proton, alpha: a * range(u, lostAt, 1), weight: 700 });
      };
      const t1 = sp('ar1', 0.05), t2 = sp('ar1', 0.5), t3 = sp('ar2', 0.05), t4 = sp('ar2', 0.55);
      msg(SX, RX, 300, 350, 'block 1', C.electron, t1);
      msg(RX, SX, 400, 450, 'ACK ✓', GREEN, t2);
      msg(SX, RX, 500, 550, 'block 2', C.electron, t3, { lostAt: 0.55 });
      // timeout bar
      const tk = range(lt, t3 + 0.8, t4);
      if (tk > 0) {
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = C.gold; ctx.beginPath(); ctx.roundRect(SX - 90, 520, 26, 220 * tk, 8); ctx.fill(); ctx.restore();
        label(ctx, 'timeout…', SX - 120, 640, { size: 26, mono: true, color: C.gold, alpha: a * tk, align: 'right', weight: 700 });
      }
      msg(SX, RX, 690, 740, 'block 2 (again)', C.electron, t4);
      msg(RX, SX, 770, 810, 'ACK ✓', GREEN, t4 + 1.4);
      // NACK note
      const nk = range(lt, sp('ar2', 0.8), sp('ar2', 0.8) + 0.8);
      panel(ctx, 1520 - 20, 300, 400, 200, C.proton, a * nk, 0.05, 20);
      label(ctx, 'NACK ✗', 1720, 350, { size: 40, mono: true, color: C.proton, alpha: a * nk, weight: 700 });
      label(ctx, 'negative acknowledgement:', 1720, 405, { size: 20, mono: true, color: C.dim, alpha: a * nk, weight: 500 });
      label(ctx, 'block sent again', 1720, 440, { size: 24, mono: true, alpha: a * nk, weight: 600 });
      label(ctx, 'immediately', 1720, 470, { size: 24, mono: true, alpha: a * nk, weight: 600 });
      caption(ctx, 'ar1', a, lt, CS.ar1);
      caption(ctx, 'ar2', a, lt, CS.ar2);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 5;
      [['checksum', C.gold], ['echo check', C.electron], ['ARQ', GREEN]].forEach(([txt, col], i) => {
        chip(ctx, txt, CX - 300, 330 + i * 130, { color: col, size: 56, alpha: a * range(lt, 0.4 + (s * i) / 4, 1.1 + (s * i) / 4), w: 600, weight: 700 });
      });
      label(ctx, 'catch errors, and fix them', CX, 750, { size: 56, weight: 700, alpha: a * range(lt, 0.4 + s * 0.75, 1.1 + s * 0.75) });
    },
  },
});
