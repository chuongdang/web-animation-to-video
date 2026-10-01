import { C, CX, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, panel, arrow } from '/runtime/kit.js';

const { lerp, range, easeOut, fadeWindow } = Scene;

const GREEN = '#7ee787';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- computer-science/g9-transmission-modes`.
const TXT = {
  sx1: '[[Simplex]] sends data in [[one direction only]], from sender to receiver.',
  sx2: 'Example: a computer sending a document to a [[printer]].',
  hd1: '[[Half-duplex]] sends data in [[both directions]], but [[not at the same time]].',
  hd2: 'Example: a [[walkie-talkie]]: you speak, then you listen.',
  fd1: '[[Full-duplex]] sends data in both directions [[at the same time]].',
  fd2: 'Example: a [[broadband internet]] connection.',
  cm1: 'One direction only, both directions taking turns, or both directions at once.',
};
const nar = await narration('computer-science/grade-9-data-transmission/transmission-modes', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { simplex: ['sx1', 'sx2'], half: ['hd1', 'hd2'], full: ['fd1', 'fd2'], compare: ['cm1'] });
const { CS, T } = P;
const sp = speech(nar, CS);

const AX = 380, BX = 1540, Y = 500; // device centres

function device(ctx, x, y, name, sub, color, alpha) {
  panel(ctx, x - 130, y - 100, 260, 200, color, alpha, 0.06, 26);
  label(ctx, name, x, y - 12, { size: 44, weight: 700, alpha });
  label(ctx, sub, x, y + 40, { size: 24, mono: true, color, alpha, weight: 500 });
}

/** a moving data dot along the wire; dir +1 = A→B, -1 = B→A */
function dots(ctx, lt, t0, t1, dir, y, color, alpha, n = 7) {
  for (let i = 0; i < n; i++) {
    const u = (((lt - t0) * 0.32 + i / n) % 1 + 1) % 1;
    if (lt < t0 || lt > t1) continue;
    const x = dir > 0 ? lerp(AX + 150, BX - 150, u) : lerp(BX - 150, AX + 150, u);
    glowDot(ctx, x, y, 11, color, alpha * Math.sin(u * Math.PI));
  }
}

function wire(ctx, y, alpha, color = C.dim) {
  ctx.save(); ctx.globalAlpha = alpha * 0.7; ctx.strokeStyle = color; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(AX + 140, y); ctx.lineTo(BX - 140, y); ctx.stroke(); ctx.restore();
}

function scene(ctx, a, lt, cfg) {
  const k = easeOut(range(lt, 0.3, 1.0));
  device(ctx, AX, Y, cfg.aName, cfg.aSub, C.electron, a * k);
  device(ctx, BX, Y, cfg.bName, cfg.bSub, GREEN, a * k);
  cfg.draw(ctx, a * k, lt);
}

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      [[-1, 200], [1, 250]].forEach(([d, y], i) => {
        for (let j = 0; j < 8; j++) {
          const u = ((t * 0.25 + j / 8) % 1);
          glowDot(ctx, d > 0 ? lerp(300, 1620, u) : lerp(1620, 300, u), y, 9, i ? C.electron : GREEN, a * 0.3 * Math.sin(u * Math.PI));
        }
      });
      titleCard(ctx, t, T, { l1: 'Which way does', l2: 'the data flow?', sub: 'Unit 2 · Data transmission · Grade 9', tint: C.electron, size: 106 });
    },

    simplex(ctx, t) {
      const a = chapterAlpha(T, 'simplex', t), lt = t - T.simplex[0];
      chapterTag(ctx, '01', 'Simplex', a);
      const t0 = sp('sx1', 0.3), back = range(lt, sp('sx2', 0.55), sp('sx2', 0.55) + 0.8);
      scene(ctx, a, lt, {
        aName: 'Computer', aSub: 'sender', bName: 'Printer', bSub: 'receiver',
        draw(c, al, l) {
          wire(c, Y, al);
          arrow(c, AX + 200, Y - 90, BX - 200, Y - 90, C.electron, al * range(l, sp('sx1', 0.4), sp('sx1', 0.4) + 0.8), 6);
          label(c, 'ONE direction only', CX, Y - 130, { size: 38, mono: true, weight: 700, color: C.electron, alpha: al * range(l, sp('sx1', 0.4), sp('sx1', 0.4) + 0.8) });
          dots(c, l, t0, 999, 1, Y, C.electron, al);
          if (back > 0) {
            label(c, '✗  nothing can be sent back', CX, Y + 110, { size: 34, mono: true, weight: 700, color: C.proton, alpha: al * back });
            arrow(c, BX - 200, Y + 70, AX + 200, Y + 70, C.proton, al * back * 0.5, 4);
          }
        },
      });
      caption(ctx, 'sx1', a, lt, CS.sx1);
      caption(ctx, 'sx2', a, lt, CS.sx2);
    },

    half(ctx, t) {
      const a = chapterAlpha(T, 'half', t), lt = t - T.half[0];
      chapterTag(ctx, '02', 'Half-duplex', a);
      const t0 = sp('hd1', 0.3), turn = 2.6;
      scene(ctx, a, lt, {
        aName: 'Person A', aSub: 'walkie-talkie', bName: 'Person B', bSub: 'walkie-talkie',
        draw(c, al, l) {
          wire(c, Y, al);
          const on = range(l, sp('hd1', 0.3), sp('hd1', 0.3) + 0.7);
          const ph = Math.floor(Math.max(0, l - t0) / turn) % 2; // 0: A talks, 1: B talks
          for (let i = 0; i < 7; i++) {
            const u = (((l - t0) / turn * 0.9 + i / 7) % 1 + 1) % 1;
            if (l < t0) break;
            glowDot(c, ph === 0 ? lerp(AX + 150, BX - 150, u) : lerp(BX - 150, AX + 150, u), Y, 11, ph === 0 ? C.electron : GREEN, al * Math.sin(u * Math.PI));
          }
          label(c, 'BOTH directions, but not at the same time', CX, Y - 150, { size: 34, mono: true, weight: 700, color: C.gold, alpha: al * on });
          arrow(c, AX + 200, Y - 90, BX - 200, Y - 90, C.electron, al * on * (ph === 0 ? 1 : 0.25), 6);
          arrow(c, BX - 200, Y + 90, AX + 200, Y + 90, GREEN, al * on * (ph === 1 ? 1 : 0.25), 6);
          label(c, ph === 0 ? 'A speaks, B listens' : 'B speaks, A listens', CX, Y + 150, { size: 32, mono: true, weight: 600, color: ph === 0 ? C.electron : GREEN, alpha: al * on });
        },
      });
      caption(ctx, 'hd1', a, lt, CS.hd1);
      caption(ctx, 'hd2', a, lt, CS.hd2);
    },

    full(ctx, t) {
      const a = chapterAlpha(T, 'full', t), lt = t - T.full[0];
      chapterTag(ctx, '03', 'Full-duplex', a);
      const t0 = sp('fd1', 0.3);
      scene(ctx, a, lt, {
        aName: 'Computer', aSub: 'your device', bName: 'Server', bSub: 'website',
        draw(c, al, l) {
          wire(c, Y - 40, al); wire(c, Y + 40, al);
          dots(c, l, t0, 999, 1, Y - 40, C.electron, al);
          dots(c, l, t0 + 0.4, 999, -1, Y + 40, GREEN, al);
          const on = range(l, sp('fd1', 0.3), sp('fd1', 0.3) + 0.7);
          label(c, 'BOTH directions AT THE SAME TIME', CX, Y - 150, { size: 34, mono: true, weight: 700, color: GREEN, alpha: al * on });
          arrow(c, AX + 200, Y - 100, BX - 200, Y - 100, C.electron, al * on, 6);
          arrow(c, BX - 200, Y + 100, AX + 200, Y + 100, GREEN, al * on, 6);
        },
      });
      caption(ctx, 'fd1', a, lt, CS.fd1);
      caption(ctx, 'fd2', a, lt, CS.fd2);
    },

    compare(ctx, t) {
      const a = chapterAlpha(T, 'compare', t), lt = t - T.compare[0];
      chapterTag(ctx, '04', 'Compare', a);
      const rows = [
        { name: 'Simplex', ex: 'computer → printer', color: C.electron, dir: 'one' },
        { name: 'Half-duplex', ex: 'walkie-talkie', color: C.gold, dir: 'turns' },
        { name: 'Full-duplex', ex: 'broadband internet', color: GREEN, dir: 'both' },
      ];
      rows.forEach((r, i) => {
        const at = sp('cm1', 0.05 + i * 0.3), k = easeOut(range(lt, at, at + 0.8)), y = 320 + i * 190;
        panel(ctx, 220, y - 70, 1480, 140, r.color, a * k, 0.05, 22);
        label(ctx, r.name, 260, y - 14, { size: 46, weight: 700, color: r.color, alpha: a * k, align: 'left' });
        label(ctx, r.ex, 260, y + 34, { size: 26, mono: true, color: C.dim, alpha: a * k, align: 'left', weight: 500 });
        const ax0 = 800, ax1 = 1300;
        if (r.dir === 'one') arrow(ctx, ax0, y, ax1, y, r.color, a * k, 7);
        if (r.dir === 'turns') { arrow(ctx, ax0, y - 20, ax1, y - 20, r.color, a * k * (lt % 3 < 1.5 ? 1 : 0.25), 7); arrow(ctx, ax1, y + 24, ax0, y + 24, r.color, a * k * (lt % 3 < 1.5 ? 0.25 : 1), 7); }
        if (r.dir === 'both') { arrow(ctx, ax0, y - 20, ax1, y - 20, r.color, a * k, 7); arrow(ctx, ax1, y + 24, ax0, y + 24, r.color, a * k, 7); }
        label(ctx, r.dir === 'one' ? 'one way' : r.dir === 'turns' ? 'both ways, taking turns' : 'both ways, together', 1360, y, { size: 22, mono: true, color: r.color, alpha: a * k, align: 'left', weight: 600 });
      });
      caption(ctx, 'cm1', a, lt, CS.cm1);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 5;
      label(ctx, 'Simplex · Half-duplex · Full-duplex', CX, 400, { size: 70, weight: 700, alpha: a * range(lt, 0.4, 1.2) });
      label(ctx, 'direction, and timing', CX, 540, { size: 64, weight: 700, color: C.gold, alpha: a * range(lt, 0.4 + s * 0.55, 1.2 + s * 0.55) });
    },
  },
});
