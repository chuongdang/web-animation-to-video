import { C, CX, label, chapterTag, narration, plan, speech, mount, chapterAlpha, titleCard, chip, panel } from '/runtime/kit.js';

const { lerp, range, easeOut, easeInOut, fadeWindow } = Scene;

const GREEN = '#7ee787';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- computer-science/g9-parity`.
const TXT = {
  pa1: 'Parity checking counts the number of [[1-bits]] in a byte. The parity is [[even]] or [[odd]].',
  pa2: 'The left-most bit is reserved as the [[parity bit]]. For even parity, it makes the total number of 1s [[even]].',
  pa3: 'Four 1s is already even, so the parity bit is [[0]]. With three 1s, the parity bit must be [[1]].',
  bk1: 'A [[parity block]] adds a [[parity byte]] after a block of bytes: every column gets a parity bit too.',
  bk2: 'If one bit flips, one [[row]] and one [[column]] fail. The wrong bit is where they [[cross]].',
};
const nar = await narration('computer-science/grade-9-data-transmission/parity', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { bit: ['pa1', 'pa2', 'pa3'], block: ['bk1', 'bk2'] });
const { CS, T } = P;
const sp = speech(nar, CS);

// ---- data -----------------------------------------------------------------------
const DATA7 = ['1011001', '0110100', '1110010', '0001111'];
const ones = (bits) => [...bits].filter((b) => b === '1').length;
const withParity = (d7) => (ones(d7) % 2 ? '1' : '0') + d7; // even parity, parity bit on the left
const ROWS = DATA7.map(withParity);
const PARITY_BYTE = Array.from({ length: 8 }, (_, c) => (ROWS.reduce((s, r) => s + Number(r[c]), 0) % 2 ? '1' : '0')).join('');
const ERR = { r: 2, c: 3 }; // the bit that flips in transit

function bitCell(ctx, x, y, bit, { color = C.electron, alpha = 1, w = 100, h = 70, glow = false, size = 44 }) {
  panel(ctx, x - w / 2, y - h / 2, w, h, color, alpha, bit === '1' ? 0.14 : 0.03, 14);
  if (glow) { ctx.save(); ctx.globalAlpha = alpha * 0.5; ctx.shadowColor = color; ctx.shadowBlur = 24; ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, 14); ctx.stroke(); ctx.restore(); }
  label(ctx, bit, x, y, { size, mono: true, weight: 700, alpha, color: bit === '1' ? C.text : C.dim });
}

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      ROWS.forEach((r, i) => [...r].forEach((b, j) => label(ctx, b, CX - 330 + j * 95, 160 + i * 70, { size: 46, mono: true, weight: 600, color: j === 0 ? C.gold : C.electron, alpha: a * 0.28 * range(t, 0.2 + j * 0.05 + i * 0.1, 0.8 + j * 0.05 + i * 0.1) })));
      titleCard(ctx, t, T, { l1: 'How does', l2: 'parity checking work?', sub: 'Unit 2 · Data transmission · Grade 9', tint: C.gold, size: 108 });
    },

    bit(ctx, t) {
      const a = chapterAlpha(T, 'bit', t), lt = t - T.bit[0];
      chapterTag(ctx, '01', 'Parity bit', a);
      const rows = [
        { d7: DATA7[0], y: 380, at: 0.5 },
        { d7: DATA7[1], y: 600, at: sp('pa3', 0.05) },
      ];
      rows.forEach((row, ri) => {
        const bits = withParity(row.d7), k = easeOut(range(lt, row.at, row.at + 0.8));
        if (k <= 0) return;
        const x0 = CX - 3.5 * 120;
        const count = ones(row.d7), even = count % 2 === 0;
        const showPar = range(lt, ri === 0 ? sp('pa2', 0.35) : sp('pa3', 0.45), (ri === 0 ? sp('pa2', 0.35) : sp('pa3', 0.45)) + 0.7);
        [...bits].forEach((b, j) => {
          const isPar = j === 0;
          if (isPar && showPar <= 0) { bitCell(ctx, x0, row.y, '?', { color: C.gold, alpha: a * k * 0.8 }); return; }
          const hl = b === '1' && !isPar && range(lt, row.at + 0.9, row.at + 1.6) > 0;
          bitCell(ctx, x0 + j * 120, row.y, b, { color: isPar ? C.gold : C.electron, alpha: a * k, glow: hl });
        });
        label(ctx, 'parity bit', x0, row.y - 66, { size: 22, mono: true, color: C.gold, alpha: a * k * range(lt, sp('pa2', 0.1), sp('pa2', 0.1) + 0.7) * (ri === 0 ? 1 : 0), weight: 600 });
        label(ctx, '7 data bits', x0 + 4 * 120, row.y - 66, { size: 22, mono: true, color: C.electron, alpha: a * k * range(lt, sp('pa1', 0.3), sp('pa1', 0.3) + 0.7) * (ri === 0 ? 1 : 0), weight: 600 });
        const ck = range(lt, row.at + 1.2, row.at + 1.9);
        label(ctx, `number of 1s in the data: ${count}  →  ${even ? 'even' : 'odd'}`, CX, row.y + 78, { size: 28, mono: true, color: C.text, alpha: a * ck, weight: 600 });
        label(ctx, even ? 'parity bit = 0 (already even)' : 'parity bit = 1 (makes it even)', CX, row.y + 118, { size: 28, mono: true, color: C.gold, alpha: a * showPar, weight: 700 });
        label(ctx, `total 1s: ${ones(bits)}  ✓ even`, x0 + 7 * 120 + 100, row.y, { size: 24, mono: true, color: GREEN, alpha: a * showPar, align: 'left', weight: 600 });
      });
      label(ctx, 'EVEN parity: the byte has an even number of 1s', CX, 220, { size: 30, mono: true, color: C.dim, alpha: a * range(lt, sp('pa1', 0.55), sp('pa1', 0.55) + 0.8), weight: 600 });
      caption(ctx, 'pa1', a, lt, CS.pa1);
      caption(ctx, 'pa2', a, lt, CS.pa2);
      caption(ctx, 'pa3', a, lt, CS.pa3);
    },

    block(ctx, t) {
      const a = chapterAlpha(T, 'block', t), lt = t - T.block[0];
      chapterTag(ctx, '02', 'Parity block', a);
      const x0 = 520, y0 = 330, dx = 118, dy = 82;
      const flip = easeInOut(range(lt, sp('bk2', 0.05), sp('bk2', 0.05) + 0.6));
      const found = range(lt, sp('bk2', 0.35), sp('bk2', 0.35) + 0.8);
      const fixed = range(lt, sp('bk2', 0.8), sp('bk2', 0.8) + 0.7);
      const cellBit = (r, c) => {
        const orig = r < 4 ? ROWS[r][c] : PARITY_BYTE[c];
        return r === ERR.r && c === ERR.c && flip > 0.5 && fixed < 0.5 ? (orig === '1' ? '0' : '1') : orig;
      };
      // header
      label(ctx, 'parity bit', x0, y0 - 70, { size: 22, mono: true, color: C.gold, alpha: a * range(lt, 1.6, 2.2), weight: 600 });
      label(ctx, 'data bits', x0 + 4 * dx, y0 - 70, { size: 22, mono: true, color: C.electron, alpha: a * range(lt, 1.6, 2.2), weight: 600 });
      for (let r = 0; r < 5; r++) {
        const isPB = r === 4;
        const at = isPB ? sp('bk1', 0.5) : 0.4 + r * 0.3, k = easeOut(range(lt, at, at + 0.7));
        label(ctx, isPB ? 'parity byte' : `byte ${r + 1}`, x0 - 90, y0 + r * dy + (isPB ? 14 : 0), { size: 24, mono: true, color: isPB ? C.gold : C.dim, alpha: a * k, align: 'right', weight: 600 });
        for (let c = 0; c < 8; c++) {
          const errHere = r === ERR.r && c === ERR.c && flip > 0.5 && fixed < 0.5;
          const rowBad = r === ERR.r && flip > 0.5 && fixed < 0.5, colBad = c === ERR.c && flip > 0.5 && fixed < 0.5;
          const col = errHere ? C.proton : isPB ? C.gold : c === 0 ? C.gold : C.electron;
          bitCell(ctx, x0 + c * dx, y0 + r * dy + (isPB ? 14 : 0), cellBit(r, c), { color: col, alpha: a * k * (rowBad || colBad || errHere ? 1 : 1), w: 96, h: 64, size: 38, glow: errHere });
          void colBad;
        }
      }
      // row / column parity checks
      const bad = flip > 0.5 && fixed < 0.5;
      for (let r = 0; r < 5; r++) {
        const rowBad = bad && r === ERR.r;
        label(ctx, rowBad ? 'odd ✗' : found > 0 || r < 5 ? 'even ✓' : '', x0 + 7.4 * dx + 40, y0 + r * dy + (r === 4 ? 14 : 0), { size: 22, mono: true, color: rowBad ? C.proton : GREEN, alpha: a * range(lt, sp('bk2', 0.0), sp('bk2', 0.0) + 0.6), align: 'left', weight: 700 });
      }
      for (let c = 0; c < 8; c++) {
        const colBad = bad && c === ERR.c;
        label(ctx, colBad ? 'odd ✗' : 'even ✓', x0 + c * dx, y0 + 5 * dy + 22, { size: 22, mono: true, color: colBad ? C.proton : GREEN, alpha: a * range(lt, sp('bk2', 0.0), sp('bk2', 0.0) + 0.6), weight: 700 });
      }
      if (bad && found > 0) {
        ctx.save(); ctx.globalAlpha = a * found; ctx.strokeStyle = C.proton; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(x0 + ERR.c * dx, y0 + ERR.r * dy, 56, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        label(ctx, 'the wrong bit is where the odd row and odd column cross', CX, 800, { size: 30, mono: true, color: C.proton, alpha: a * found * (1 - fixed), weight: 700 });
      }
      if (fixed > 0) label(ctx, 'flipped back: corrected ✓', CX, 850, { size: 34, mono: true, color: GREEN, alpha: a * fixed, weight: 700 });
      caption(ctx, 'bk1', a, lt, CS.bk1);
      caption(ctx, 'bk2', a, lt, CS.bk2);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 6;
      chip(ctx, 'parity bit → each byte', CX - 400, 360, { color: C.gold, size: 52, alpha: a * range(lt, 0.4, 1.1), w: 800, weight: 700 });
      chip(ctx, 'parity byte → each block', CX - 400, 500, { color: C.electron, size: 52, alpha: a * range(lt, 0.4 + s * 0.35, 1.1 + s * 0.35), w: 800, weight: 700 });
      label(ctx, 'errors found, and even fixed', CX, 690, { size: 64, weight: 700, color: GREEN, alpha: a * range(lt, 0.4 + s * 0.7, 1.1 + s * 0.7) });
    },
  },
});
