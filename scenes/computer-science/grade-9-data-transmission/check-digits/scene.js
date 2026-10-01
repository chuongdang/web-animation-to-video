import { C, CX, CY, label, chapterTag, narration, plan, speech, mount, chapterAlpha, titleCard, chip, panel, arrow } from '/runtime/kit.js';

const { lerp, range, easeOut, fadeWindow } = Scene;

const GREEN = '#7ee787';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- computer-science/g9-check-digits`.
const TXT = {
  cd1: 'A [[check digit]] is the final digit of a code, calculated from all the [[other digits]].',
  cd2: 'Used on [[barcodes]], [[ISBNs]], vehicle identification numbers and credit card numbers.',
  me1: '[[Multiply]] each digit by its position, [[add]] the totals, [[divide by 10]]: the [[remainder]] is the check digit.',
  we1: 'Code 945344: 9 + 8 + 15 + 12 + 20 = [[64]].',
  we2: '64 ÷ 10 leaves a remainder of [[4]]. It matches the last digit, so the code is [[accepted:green]].',
  pr1: 'Now 352132: 3 + 10 + 6 + 4 + 15 = [[38]], and the remainder is [[8]].',
  pr2: 'The last digit is 2, not 8, so the code is [[rejected:proton]].',
};
const nar = await narration('computer-science/grade-9-data-transmission/check-digits', TXT, { hold: 2.2 });
const { caption, spoken } = nar;
const P = plan(nar, { idea: ['cd1', 'cd2'], method: ['me1'], worked: ['we1', 'we2'], practice: ['pr1', 'pr2'] });
const { CS, T } = P;
const sp = speech(nar, CS);

// ---- the working table --------------------------------------------------------
const X0 = 720, DX = 150; // first digit column and spacing
const ROWS = { code: 320, pos: 415, mul: 510, sum: 630, rem: 730 };

/** Draws the check-digit table for `digits` (6 digits, last is the check digit). */
function table(ctx, a, lt, digits, ev) {
  const first5 = digits.slice(0, 5);
  const prods = first5.map((d, i) => d * (i + 1));
  const total = prods.reduce((s, v) => s + v, 0);
  const rem = total % 10;
  const cell = (x, y, text, color, alpha, size = 40, w = 110) => {
    panel(ctx, x - w / 2, y - 34, w, 68, color, alpha, 0.05, 14);
    label(ctx, String(text), x, y, { size, mono: true, weight: 700, alpha, color: C.text });
  };
  const rowLabel = (text, y, k) => label(ctx, text, X0 - 120, y, { size: 28, mono: true, color: C.dim, alpha: a * k, align: 'right', weight: 600 });

  // code row (digits, with the check digit highlighted)
  rowLabel('Code', ROWS.code, easeOut(range(lt, ev.digits, ev.digits + 0.6)));
  digits.forEach((d, i) => {
    const k = easeOut(range(lt, ev.digits + i * 0.12, ev.digits + 0.6 + i * 0.12));
    cell(X0 + i * DX, ROWS.code, d, i === 5 ? C.gold : C.electron, a * k);
  });
  label(ctx, 'check digit', X0 + 5 * DX, ROWS.code - 62, { size: 24, mono: true, color: C.gold, alpha: a * range(lt, ev.digits + 0.8, ev.digits + 1.4), weight: 600 });

  // position weighting row
  rowLabel('Position', ROWS.pos, range(lt, ev.pos, ev.pos + 0.5));
  first5.forEach((_, i) => cell(X0 + i * DX, ROWS.pos, i + 1, C.dim, a * easeOut(range(lt, ev.pos + i * 0.1, ev.pos + 0.5 + i * 0.1)), 34));

  // multiply row: one product at a time
  rowLabel('Multiply', ROWS.mul, range(lt, ev.mul, ev.mul + 0.5));
  prods.forEach((p, i) => {
    const t0 = ev.mul + i * ev.mulStep, k = easeOut(range(lt, t0, t0 + 0.5));
    if (k > 0) {
      label(ctx, `${first5[i]} × ${i + 1}`, X0 + i * DX, ROWS.mul - 44, { size: 22, mono: true, color: C.dim, alpha: a * k, weight: 500 });
      cell(X0 + i * DX, ROWS.mul, p, C.gold, a * k);
    }
  });

  // sum
  const sk = easeOut(range(lt, ev.sum, ev.sum + 0.6));
  rowLabel('Sum', ROWS.sum, sk);
  label(ctx, prods.join(' + ') + ' =', X0 + 2 * DX, ROWS.sum, { size: 34, mono: true, alpha: a * sk, weight: 500 });
  chip(ctx, String(total), X0 + 4.15 * DX, ROWS.sum, { color: C.gold, size: 44, alpha: a * sk, w: 130, weight: 700, family: '"IBM Plex Mono", monospace' });

  // remainder and verdict
  const rk = easeOut(range(lt, ev.rem, ev.rem + 0.6));
  rowLabel('Remainder', ROWS.rem, rk);
  label(ctx, `${total} ÷ 10  →  remainder`, X0 + 1.4 * DX, ROWS.rem, { size: 34, mono: true, alpha: a * rk, weight: 500 });
  chip(ctx, String(rem), X0 + 4.15 * DX, ROWS.rem, { color: C.electron, size: 44, alpha: a * rk, w: 130, weight: 700, family: '"IBM Plex Mono", monospace' });

  const vk = easeOut(range(lt, ev.verdict, ev.verdict + 0.7));
  if (vk > 0) {
    const ok = rem === digits[5], col = ok ? GREEN : C.proton;
    ctx.save(); ctx.globalAlpha = a * vk; ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.setLineDash([12, 8]);
    ctx.beginPath(); ctx.moveTo(X0 + 4.15 * DX + 65, ROWS.rem); ctx.bezierCurveTo(X0 + 5 * DX + 40, ROWS.rem, X0 + 5 * DX + 40, ROWS.code + 90, X0 + 5 * DX, ROWS.code + 44); ctx.stroke(); ctx.restore();
    label(ctx, ok ? `${rem} = ${digits[5]}  ✓  ACCEPTED` : `${rem} ≠ ${digits[5]}  ✗  REJECTED`, CX, 830, { size: 60, mono: true, weight: 700, color: col, alpha: a * vk });
  }
}

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      '9 4 5 3 4 4'.split(' ').forEach((d, i) => {
        panel(ctx, CX - 450 + i * 150, 200, 110, 90, i === 5 ? C.gold : C.electron, a * 0.4 * range(t, 0.2 + i * 0.1, 0.8 + i * 0.1), 0.05, 16);
        label(ctx, d, CX - 395 + i * 150, 245, { size: 56, mono: true, weight: 700, alpha: a * 0.4 * range(t, 0.2 + i * 0.1, 0.8 + i * 0.1), color: i === 5 ? C.gold : C.text });
      });
      titleCard(ctx, t, T, { l1: 'How do', l2: 'check digits work?', sub: 'Unit 2 · Data transmission · Grade 9', tint: C.gold, size: 112 });
    },

    idea(ctx, t) {
      const a = chapterAlpha(T, 'idea', t), lt = t - T.idea[0];
      chapterTag(ctx, '01', 'What is a check digit?', a);
      const k = easeOut(range(lt, 0.4, 1.2));
      '9 4 5 3 4 4'.split(' ').forEach((d, i) => {
        panel(ctx, 420 + i * 180, 300, 130, 110, i === 5 ? C.gold : C.electron, a * k, 0.05, 18);
        label(ctx, d, 485 + i * 180, 355, { size: 68, mono: true, weight: 700, alpha: a * k });
      });
      const ck = range(lt, sp('cd1', 0.35), sp('cd1', 0.35) + 0.8);
      label(ctx, 'check digit', 485 + 5 * 180, 445, { size: 30, mono: true, color: C.gold, alpha: a * ck, weight: 700 });
      arrow(ctx, 485 + 5 * 180, 462, 485 + 5 * 180, 425, C.gold, a * ck);
      const fk = range(lt, sp('cd1', 0.6), sp('cd1', 0.6) + 0.8);
      ctx.save(); ctx.globalAlpha = a * fk * 0.7; ctx.strokeStyle = C.electron; ctx.lineWidth = 4; ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.moveTo(420, 440); ctx.lineTo(420 + 4 * 180 + 130, 440); ctx.stroke(); ctx.restore();
      label(ctx, 'calculated from these digits', 420 + 2 * 180 + 65, 480, { size: 28, mono: true, color: C.electron, alpha: a * fk, weight: 600 });
      label(ctx, 'purpose: make sure every digit was transmitted correctly', CX, 590, { size: 30, mono: true, color: C.dim, alpha: a * range(lt, sp('cd1', 0.8), sp('cd1', 0.8) + 0.8), weight: 500 });

      // where they are used
      const uses = [['barcodes', 0], ['ISBN (books)', 1], ['VIN (vehicles)', 2], ['credit cards', 3]];
      uses.forEach(([name, i]) => {
        const at = sp('cd2', 0.2 + i * 0.18), kk = easeOut(range(lt, at, at + 0.8));
        chip(ctx, name, 260 + i * 410, 730, { color: [C.electron, C.gold, GREEN, C.proton][i], size: 34, alpha: a * kk, w: 360 });
      });
      caption(ctx, 'cd1', a, lt, CS.cd1);
      caption(ctx, 'cd2', a, lt, CS.cd2);
    },

    method(ctx, t) {
      const a = chapterAlpha(T, 'method', t), lt = t - T.method[0];
      chapterTag(ctx, '02', 'The method', a);
      const steps = [
        ['1', 'multiply each digit by its position', C.electron],
        ['2', 'add the totals together', C.gold],
        ['3', 'divide by 10', GREEN],
        ['4', 'the remainder is the check digit', C.proton],
      ];
      steps.forEach(([n, text, col], i) => {
        const at = sp('me1', 0.02 + i * 0.22), k = easeOut(range(lt, at, at + 0.8)), y = 300 + i * 120;
        panel(ctx, 340 + (1 - k) * 60, y - 44, 1240, 88, col, a * k, 0.05, 20);
        label(ctx, n, 400 + (1 - k) * 60, y, { size: 56, mono: true, color: col, alpha: a * k, weight: 700 });
        label(ctx, text, 480 + (1 - k) * 60, y, { size: 46, alpha: a * k, align: 'left', weight: 600 });
      });
      caption(ctx, 'me1', a, lt, CS.me1);
    },

    worked(ctx, t) {
      const a = chapterAlpha(T, 'worked', t), lt = t - T.worked[0];
      chapterTag(ctx, '03', 'Worked example: 945344', a);
      table(ctx, a, lt, [9, 4, 5, 3, 4, 4], {
        digits: 0.5, pos: 1.4, mul: sp('we1', 0.05), mulStep: (spoken('we1') ?? 6) * 0.12, sum: sp('we1', 0.78), rem: sp('we2', 0.15), verdict: sp('we2', 0.65),
      });
      caption(ctx, 'we1', a, lt, CS.we1);
      caption(ctx, 'we2', a, lt, CS.we2);
    },

    practice(ctx, t) {
      const a = chapterAlpha(T, 'practice', t), lt = t - T.practice[0];
      chapterTag(ctx, '04', 'Practice: 352132', a);
      table(ctx, a, lt, [3, 5, 2, 1, 3, 2], {
        digits: 0.5, pos: 1.4, mul: sp('pr1', 0.15), mulStep: (spoken('pr1') ?? 6) * 0.1, sum: sp('pr1', 0.7), rem: sp('pr1', 0.88), verdict: sp('pr2', 0.2),
      });
      caption(ctx, 'pr1', a, lt, CS.pr1);
      caption(ctx, 'pr2', a, lt, CS.pr2);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 6;
      [['multiply by position', C.electron], ['add', C.gold], ['divide by 10', GREEN]].forEach(([txt, col], i) => {
        label(ctx, txt, CX, 330 + i * 100, { size: 64, weight: 700, color: col, alpha: a * range(lt, 0.4 + (s * i) / 4, 1.1 + (s * i) / 4) });
      });
      label(ctx, 'remainder = check digit ?', CX, 680, { size: 68, mono: true, weight: 700, alpha: a * range(lt, 0.4 + s * 0.75, 1.1 + s * 0.75) });
    },
  },
});
