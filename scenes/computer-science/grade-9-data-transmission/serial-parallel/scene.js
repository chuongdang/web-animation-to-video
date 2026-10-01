import { C, CX, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, chip, panel } from '/runtime/kit.js';

const { lerp, range, easeOut, fadeWindow, rng } = Scene;

const GREEN = '#7ee787';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- computer-science/g9-serial-parallel`.
const TXT = {
  sr1: '[[Serial]] transmission sends [[one bit at a time]] over a [[single wire]].',
  sr2: 'It works over [[long distances]] and arrives [[synchronised]], but at a slower rate.',
  pl1: '[[Parallel]] sends [[several bits]] (usually a byte) over [[several wires]] at the same time.',
  pl2: 'It suits [[short distances]], like circuits inside a computer, where [[high speed]] is essential.',
  pb1: 'Over long distances, parallel data suffers [[skew]]: bits arrive at [[different times]], even out of order.',
  pb2: '[[Crosstalk]] between the wires also causes [[interference]] if the cable is too long.',
  us1: 'The [[Universal Serial Bus]] (USB) sends data [[serially]].',
  us2: '[[Advantages:green]]: standard connector, devices detected automatically, power supplied, backwards compatible.',
  us3: '[[Disadvantages:proton]]: limited cable length, and slower than some other connections.',
};
const nar = await narration('computer-science/grade-9-data-transmission/serial-parallel', TXT, { hold: 2.2 });
const { caption, spoken } = nar;
const P = plan(nar, { serial: ['sr1', 'sr2'], parallel: ['pl1', 'pl2'], limits: ['pb1', 'pb2'], usb: ['us1', 'us2', 'us3'] });
const { CS, T } = P;
const sp = speech(nar, CS);

const BITS = '10110010';
const AX = 420, BX = 1500;

function endpoint(ctx, x, y, h, name, color, alpha) {
  panel(ctx, x - 100, y - h / 2, 200, h, color, alpha, 0.06, 22);
  label(ctx, name, x, y, { size: 34, weight: 700, alpha });
}

function bit(ctx, x, y, b, color, alpha, r = 22) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color + '33'; ctx.strokeStyle = color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(x - r, y - r, r * 2, r * 2, 8); ctx.fill(); ctx.stroke(); ctx.restore();
  label(ctx, b, x, y, { size: 28, mono: true, weight: 700, alpha });
}

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      [...BITS].forEach((b, i) => bit(ctx, 460 + i * 130, 200, b, C.electron, a * 0.3 * range(t, 0.2 + i * 0.08, 0.8 + i * 0.08), 26));
      titleCard(ctx, t, T, { l1: 'Serial or', l2: 'parallel?', sub: 'Unit 2 · Data transmission · Grade 9', tint: C.gold, size: 118 });
    },

    serial(ctx, t) {
      const a = chapterAlpha(T, 'serial', t), lt = t - T.serial[0];
      chapterTag(ctx, '01', 'Serial transmission', a);
      const k = easeOut(range(lt, 0.3, 1));
      endpoint(ctx, AX, 480, 200, 'Sender', C.electron, a * k);
      endpoint(ctx, BX, 480, 200, 'Receiver', GREEN, a * k);
      ctx.save(); ctx.globalAlpha = a * k * 0.7; ctx.strokeStyle = C.dim; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(AX + 100, 480); ctx.lineTo(BX - 100, 480); ctx.stroke(); ctx.restore();
      label(ctx, 'one wire / channel', CX, 550, { size: 26, mono: true, color: C.dim, alpha: a * k, weight: 500 });
      const t0 = sp('sr1', 0.25);
      [...BITS].forEach((b, i) => {
        const u = (lt - t0 - i * 0.42) / 4.2;
        if (u < 0 || u > 1) return;
        bit(ctx, lerp(AX + 130, BX - 130, u), 480, b, C.electron, a * Math.min(1, u * 8) * (1 - Math.max(0, u - 0.92) * 12));
      });
      label(ctx, 'one bit after another, as a single stream', CX, 400, { size: 30, mono: true, weight: 700, color: C.electron, alpha: a * range(lt, sp('sr1', 0.45), sp('sr1', 0.45) + 0.8) });
      [['long distances', GREEN, '✓'], ['fully synchronised', GREEN, '✓'], ['slower rate', C.proton, '✗']].forEach(([txt, col, mark], i) => {
        const at = sp('sr2', 0.15 + i * 0.28), kk = easeOut(range(lt, at, at + 0.7));
        chip(ctx, `${mark} ${txt}`, 340 + i * 440, 720, { color: col, size: 34, alpha: a * kk, w: 400 });
      });
      caption(ctx, 'sr1', a, lt, CS.sr1);
      caption(ctx, 'sr2', a, lt, CS.sr2);
    },

    parallel(ctx, t) {
      const a = chapterAlpha(T, 'parallel', t), lt = t - T.parallel[0];
      chapterTag(ctx, '02', 'Parallel transmission', a);
      const k = easeOut(range(lt, 0.3, 1));
      endpoint(ctx, AX, 480, 420, 'Sender', C.electron, a * k);
      endpoint(ctx, BX, 480, 420, 'Receiver', GREEN, a * k);
      const t0 = sp('pl1', 0.3), u = (lt - t0) / 2.6;
      [...BITS].forEach((b, i) => {
        const y = 320 + i * 46;
        ctx.save(); ctx.globalAlpha = a * k * 0.6; ctx.strokeStyle = C.dim; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(AX + 100, y); ctx.lineTo(BX - 100, y); ctx.stroke(); ctx.restore();
        const uu = ((u % 1.4) + 1.4) % 1.4;
        if (u > 0 && uu <= 1) bit(ctx, lerp(AX + 130, BX - 130, uu), y, b, C.electron, a * Math.min(1, uu * 8), 19);
      });
      label(ctx, '8 wires · 1 bit each · all at once', CX, 260, { size: 30, mono: true, weight: 700, color: C.electron, alpha: a * range(lt, sp('pl1', 0.45), sp('pl1', 0.45) + 0.8) });
      [['short distances', GREEN, '✓'], ['high speed', GREEN, '✓'], ['inside a computer', C.gold, '●']].forEach(([txt, col, mark], i) => {
        const at = sp('pl2', 0.15 + i * 0.28), kk = easeOut(range(lt, at, at + 0.7));
        chip(ctx, `${mark} ${txt}`, 340 + i * 440, 780, { color: col, size: 34, alpha: a * kk, w: 400 });
      });
      caption(ctx, 'pl1', a, lt, CS.pl1);
      caption(ctx, 'pl2', a, lt, CS.pl2);
    },

    limits(ctx, t) {
      const a = chapterAlpha(T, 'limits', t), lt = t - T.limits[0];
      chapterTag(ctx, '03', 'Limits of parallel', a);
      const p1 = a * (1 - range(lt, CS.pb2 - 0.3, CS.pb2 + 0.3)), p2 = a * range(lt, CS.pb2, CS.pb2 + 0.6);
      if (p1 > 0) {
        const rand = rng(4);
        const skew = [...BITS].map(() => rand());
        [...BITS].forEach((b, i) => {
          const y = 330 + i * 50, at = sp('pb1', 0.2);
          ctx.save(); ctx.globalAlpha = p1 * 0.5; ctx.strokeStyle = C.dim; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(420, y); ctx.lineTo(1450, y); ctx.stroke(); ctx.restore();
          const u = (lt - at) / 3.4 - skew[i] * 0.22;
          bit(ctx, lerp(460, 1400, Math.min(1, Math.max(0, u))), y, b, C.electron, p1 * range(u, 0, 0.1), 19);
          if (u >= 1) bit(ctx, 1400, y, b, C.proton, p1, 19);
        });
        label(ctx, 'sent together', 440, 270, { size: 24, mono: true, color: C.dim, alpha: p1, align: 'left', weight: 500 });
        label(ctx, 'arrive at different times: SKEW', 1480, 520, { size: 30, mono: true, color: C.proton, alpha: p1 * range(lt, sp('pb1', 0.55), sp('pb1', 0.55) + 0.8), align: 'left', weight: 700 });
        label(ctx, 'the receiver must wait until the whole set has arrived', 1480, 570, { size: 22, mono: true, color: C.dim, alpha: p1 * range(lt, sp('pb1', 0.75), sp('pb1', 0.75) + 0.8), align: 'left', weight: 500 });
      }
      if (p2 > 0) {
        [0, 1].forEach((i) => {
          const y = 430 + i * 110;
          ctx.save(); ctx.globalAlpha = p2; ctx.strokeStyle = i ? GREEN : C.electron; ctx.lineWidth = 5; ctx.beginPath();
          for (let x = 400; x <= 1500; x += 8) {
            const inter = range(lt, sp('pb2', 0.2), sp('pb2', 0.2) + 1.2) * 16;
            const yy = y + Math.sin(x * 0.03 + lt * 4 + i) * (i ? 4 + inter * 0.6 : 4 + inter * 0.4);
            x === 400 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
          }
          ctx.stroke(); ctx.restore();
        });
        const ck = range(lt, sp('pb2', 0.3), sp('pb2', 0.3) + 0.8);
        ctx.save(); ctx.globalAlpha = p2 * ck; ctx.strokeStyle = C.proton; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.roundRect(380, 380, 1140, 260, 24); ctx.stroke(); ctx.restore();
        label(ctx, 'crosstalk: interference between wires', CX, 700, { size: 34, mono: true, weight: 700, color: C.proton, alpha: p2 * ck });
        label(ctx, 'worse when the cable is too long', CX, 750, { size: 24, mono: true, color: C.dim, alpha: p2 * ck, weight: 500 });
      }
      caption(ctx, 'pb1', a, lt, CS.pb1);
      caption(ctx, 'pb2', a, lt, CS.pb2);
    },

    usb(ctx, t) {
      const a = chapterAlpha(T, 'usb', t), lt = t - T.usb[0];
      chapterTag(ctx, '04', 'Universal Serial Bus', a);
      const k = easeOut(range(lt, 0.3, 1));
      // connector
      ctx.save(); ctx.globalAlpha = a * k; ctx.strokeStyle = C.electron; ctx.lineWidth = 5; ctx.fillStyle = 'rgba(77,216,255,0.08)';
      ctx.beginPath(); ctx.roundRect(200, 330, 300, 150, 16); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.electron; ctx.fillRect(240, 372, 220, 26); ctx.fillRect(240, 412, 220, 26);
      ctx.restore();
      label(ctx, 'USB', 350, 530, { size: 56, weight: 700, alpha: a * k });
      label(ctx, 'sends data serially', 350, 590, { size: 26, mono: true, color: C.dim, alpha: a * k, weight: 500 });
      [['✓ Advantages', GREEN, ['standard connector', 'devices detected automatically', 'supplies power to devices', 'backwards compatible'], sp('us2', 0.05), 620],
       ['✗ Disadvantages', C.proton, ['limited cable length', 'slower than some other connections'], sp('us3', 0.05), 620]].forEach(([title, col, items, at, x], i) => {
        const px = i ? 1240 : 620, pw = i ? 560 : 560;
        const kk = easeOut(range(lt, at, at + 0.8));
        panel(ctx, px, 280 + (1 - kk) * 30, pw, 470, col, a * kk);
        label(ctx, title, px + 30, 335 + (1 - kk) * 30, { size: 40, weight: 700, color: col, alpha: a * kk, align: 'left' });
        items.forEach((it, j) => {
          const ik = range(lt, at + 0.3 + j * 0.35, at + 0.9 + j * 0.35);
          label(ctx, `• ${it}`, px + 30, 410 + j * 74 + (1 - kk) * 30, { size: 28, alpha: a * ik, align: 'left', weight: 500 });
        });
        void x;
      });
      caption(ctx, 'us1', a, lt, CS.us1);
      caption(ctx, 'us2', a, lt, CS.us2);
      caption(ctx, 'us3', a, lt, CS.us3);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 5;
      label(ctx, 'Serial: long distance', CX, 380, { size: 72, weight: 700, color: C.electron, alpha: a * range(lt, 0.4, 1.2) });
      label(ctx, 'Parallel: short, fast links', CX, 500, { size: 72, weight: 700, color: C.gold, alpha: a * range(lt, 0.4 + s * 0.3, 1.2 + s * 0.3) });
      label(ctx, 'USB is serial', CX, 640, { size: 64, weight: 700, color: GREEN, alpha: a * range(lt, 0.4 + s * 0.65, 1.2 + s * 0.65) });
    },
  },
});
