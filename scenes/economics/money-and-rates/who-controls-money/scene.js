import { C, CX, CY, label, chapterTag, narration, plan, speech, mount, chapterAlpha, titleCard, chip, panel, arrow, card, bar } from '/runtime/kit.js';

const { clamp, lerp, range, easeOut, easeInOut, fadeWindow } = Scene;

const GREEN = '#7ee787';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- economics/money-and-rates/who-controls-money`.
const TXT = {
  q1: 'Who decides how much [[money]] a country has? And if no new paper money is printed, how can there be so much more in the [[bank]]?',
  c1: 'Cash is only a small slice. In most countries, roughly [[nine tenths]] of all money is just numbers in bank accounts.',
  c2: 'Those numbers are [[real money]]. You can pay, save and borrow with them, exactly like cash.',
  b1: 'So where does it come from? Mostly from [[banks]]. When a bank approves a loan, it types the amount into the borrower\'s account.',
  b1b: 'That new deposit is [[new money]], and no printing press is involved.',
  b2: 'When the loan is repaid, the money [[disappears]] again. So the money supply grows and shrinks with lending.',
  r1: 'Nobody controls it with one switch. The [[central bank]] sets the interest rate, the price of borrowing. High rates mean fewer loans, low rates mean more.',
  r2: 'It also creates [[reserves]], the money banks hold with it, and regulators set rules on how much banks may lend against their [[capital]].',
  r3: 'Governments matter too: when they spend and borrow, more money flows into accounts. And in the end, people and firms must [[want]] to borrow.',
  i1: 'The real limit is not a number of notes. It is what the economy can [[produce]]. If money grows much faster than goods, prices rise: that is [[inflation:proton]].',
};
const nar = await narration('economics/money-and-rates/who-controls-money', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { question: ['q1'], slice: ['c1', 'c2'], loan: ['b1', 'b1b', 'b2'], control: ['r1', 'r2', 'r3'], limit: ['i1'] });
const { CS, T } = P;
const sp = speech(nar, CS);

/** a small chart frame: axes from (x0, y0) going right w and up h */
function axes(ctx, x0, y0, w, h, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x0, y0 - h); ctx.lineTo(x0, y0); ctx.lineTo(x0 + w, y0); ctx.stroke(); ctx.restore();
}
function curve(ctx, x0, y0, w, h, fn, u, color, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.beginPath();
  for (let i = 0; i <= 60 * u; i++) { const x = i / 60; i ? ctx.lineTo(x0 + x * w, y0 - fn(x) * h) : ctx.moveTo(x0 + x * w, y0 - fn(x) * h); }
  ctx.stroke(); ctx.restore();
}
/** a panel with a mono heading, appearing at alpha a */
function box(ctx, x, y, w, h, title, color, a) {
  panel(ctx, x, y, w, h, color, a, 0.05, 22);
  label(ctx, title, x + w / 2, y + 44, { size: 30, mono: true, color, alpha: a, weight: 700 });
}
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      label(ctx, '$', CX, 220, { size: 190, weight: 700, color: GREEN, alpha: a * range(t, 0.2, 1) });
      titleCard(ctx, t, T, { l1: 'Who controls', l2: 'the money supply?', sub: 'banks, central banks and inflation', tint: GREEN, size: 112 });
    },

    question(ctx, t) {
      const a = chapterAlpha(T, 'question', t), lt = t - T.question[0];
      chapterTag(ctx, '01', 'The question', a);
      const on = easeOut(range(lt, 0.3, 1));
      label(ctx, 'How much money does a country have?', CX, 250, { size: 64, weight: 700, alpha: a * on });
      // left: printed cash, right: bank balances
      const r1 = range(lt, 1.2, 2), r2 = range(lt, sp('q1', 0.55), sp('q1', 0.55) + 0.8);
      box(ctx, 220, 340, 600, 440, 'printed paper money', GREEN, a * r1);
      [0, 1, 2].forEach((i) => card(ctx, 520 + i * 18, 540 - i * 18, GREEN, a * r1, 170, 90));
      label(ctx, '$', 556, 504, { size: 44, mono: true, weight: 700, alpha: a * r1, color: GREEN });
      label(ctx, 'no new notes', 520, 700, { size: 32, mono: true, color: C.dim, alpha: a * r1, weight: 600 });
      box(ctx, 1100, 340, 600, 440, 'money in the bank', C.electron, a * r2);
      for (let row = 0; row < 5; row++) {
        const x = 1180 + ((row * 83 + lt * 70) % 120) * 0.4, v = 1000 + ((row * 7919 + Math.floor(lt * 3 + row) * 104729) % 90000);
        label(ctx, money(v * (row + 2)), x + 150, 450 + row * 56, { size: 34, mono: true, align: 'left', alpha: a * r2 * (0.5 + 0.5 * Math.sin(lt * 2 + row)) , color: C.electron, weight: 600 });
      }
      label(ctx, 'so much more?', 1400, 735, { size: 34, mono: true, color: C.gold, alpha: a * r2, weight: 700 });
      label(ctx, '?', CX, 560, { size: 160, weight: 700, color: C.gold, alpha: a * range(lt, 1.6, 2.2) * (0.7 + 0.3 * Math.sin(lt * 3)) });
      caption(ctx, 'q1', a, lt, CS.q1);
    },

    slice(ctx, t) {
      const a = chapterAlpha(T, 'slice', t), lt = t - T.slice[0];
      chapterTag(ctx, '02', 'Most money is digital', a);
      const on = range(lt, 0.3, 0.9), x0 = 260, w = 1400, y = 400, h = 130;
      const fill = easeInOut(range(lt, 0.5, 2.2));
      const cash = w * 0.1 * fill, dep = w * 0.9 * fill;
      ctx.save(); ctx.globalAlpha = a * on;
      ctx.fillStyle = GREEN; ctx.beginPath(); ctx.roundRect(x0, y, Math.max(2, cash), h, [14, 0, 0, 14]); ctx.fill();
      ctx.fillStyle = C.electron; ctx.shadowColor = C.electron; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.roundRect(x0 + cash, y, Math.max(2, dep), h, [0, 14, 14, 0]); ctx.fill(); ctx.restore();
      label(ctx, 'all money in the economy', CX, 320, { size: 40, weight: 700, alpha: a * on });
      const k = range(lt, 2.2, 3);
      label(ctx, 'cash', x0 + w * 0.05, y + h + 60, { size: 36, mono: true, color: GREEN, alpha: a * k, weight: 700 });
      label(ctx, '~10%', x0 + w * 0.05, y + h + 110, { size: 30, mono: true, alpha: a * k, weight: 500 });
      label(ctx, 'bank deposits (digital)', x0 + w * 0.55, y + h + 60, { size: 36, mono: true, color: C.electron, alpha: a * k, weight: 700 });
      label(ctx, '~90%', x0 + w * 0.55, y + h + 110, { size: 30, mono: true, alpha: a * k, weight: 500 });
      // c2: what you can do with it
      ['pay', 'save', 'borrow'].forEach((s, i) => {
        const r = range(lt, sp('c2', 0.3 + i * 0.2), sp('c2', 0.3 + i * 0.2) + 0.6);
        chip(ctx, '✓ ' + s, 560 + i * 280, 760, { color: C.electron, size: 40, alpha: a * r, w: 240 });
      });
      caption(ctx, 'c1', a, lt, CS.c1);
      caption(ctx, 'c2', a, lt, CS.c2);
    },

    loan(ctx, t) {
      const a = chapterAlpha(T, 'loan', t), lt = t - T.loan[0];
      chapterTag(ctx, '03', 'Banks create money by lending', a);
      const on = range(lt, 0.3, 0.9);
      const s1 = sp('b1b', 0), s2 = sp('b2', 0.15);
      const up = easeInOut(range(lt, s1 + 1.2, s1 + 2.8)), down = easeInOut(range(lt, s2, s2 + 1.6));
      const lent = up - down, supply = 1000 + 100 * lent;
      // money supply meter
      label(ctx, 'money supply', 520, 240, { size: 30, mono: true, color: C.dim, alpha: a * on, weight: 600 });
      bar(ctx, { x: 700, y: 240, w: 560 * (supply / 1100), h: 46, color: GREEN, alpha: a * on, name: '', value: money(supply), glow: 12 });
      // bank and borrower
      box(ctx, 360, 380, 460, 330, 'the bank', C.gold, a * on);
      label(ctx, 'loan to Bob', 590, 500, { size: 30, mono: true, alpha: a * on * range(up, 0.01, 0.3) * (1 - range(down, 0.3, 0.8)), weight: 600, color: C.gold });
      label(ctx, '$100 owed', 590, 550, { size: 40, mono: true, alpha: a * on * range(up, 0.01, 0.3) * (1 - range(down, 0.3, 0.8)), weight: 700, color: C.gold });
      box(ctx, 1100, 380, 460, 330, "Bob's account", C.electron, a * on);
      label(ctx, money(100 * lent), 1330, 540, { size: 80, mono: true, weight: 700, alpha: a * on, color: C.electron });
      const x1 = lerp(830, 1090, easeOut(up));
      if (up > 0 && up < 1) arrow(ctx, 830, 540, x1, 540, GREEN, a * 0.9, 6);
      if (down > 0 && down < 1) arrow(ctx, 1090, 600, lerp(1090, 830, easeOut(down)), 600, C.proton, a * 0.9, 6);
      label(ctx, 'typed in, not printed', 1330, 650, { size: 28, mono: true, color: GREEN, alpha: a * range(up, 0.8, 1) * (1 - range(down, 0, 0.3)), weight: 700 });
      label(ctx, 'repaid: the money is gone', 1330, 650, { size: 28, mono: true, color: C.proton, alpha: a * range(down, 0.7, 1), weight: 700 });
      caption(ctx, 'b1', a, lt, CS.b1);
      caption(ctx, 'b1b', a, lt, CS.b1b);
      caption(ctx, 'b2', a, lt, CS.b2);
    },

    control(ctx, t) {
      const a = chapterAlpha(T, 'control', t), lt = t - T.control[0];
      chapterTag(ctx, '04', 'Who holds the levers', a);
      const y = 190, h = 560, w = 540;
      // 1: central bank rate -> loans
      const r1 = easeOut(range(lt, sp('r1', 0), sp('r1', 0) + 0.8));
      box(ctx, 130, y, w, h, 'central bank: rate', C.electron, a * r1);
      const swing = easeInOut(range(lt, sp('r1', 0.45), sp('r1', 0.45) + 1.4)), back = easeInOut(range(lt, sp('r1', 0.8), sp('r1', 0.8) + 1.4));
      const rate = lerp(1, 6, swing) - 5 * back * 0.8, loans = 0.9 - 0.65 * swing + 0.6 * back * 0.9;
      label(ctx, rate.toFixed(1) + '%', 130 + w / 2, y + 190, { size: 110, mono: true, weight: 700, alpha: a * r1, color: rate > 3 ? C.proton : GREEN });
      label(ctx, 'new loans', 130 + w / 2, y + 340, { size: 28, mono: true, color: C.dim, alpha: a * r1, weight: 600 });
      ctx.save(); ctx.globalAlpha = a * r1; ctx.fillStyle = C.electron; ctx.beginPath(); ctx.roundRect(170, y + 380, 460 * clamp(loans, 0.05, 1), 50, 8); ctx.fill(); ctx.restore();
      label(ctx, rate > 3 ? 'borrowing costly: fewer loans' : 'borrowing cheap: more loans', 130 + w / 2, y + 490, { size: 26, mono: true, color: C.text, alpha: a * r1, weight: 500 });
      // 2: reserves + rules
      const r2 = easeOut(range(lt, sp('r2', 0), sp('r2', 0) + 0.8));
      box(ctx, 690, y, w, h, 'rules for banks', C.gold, a * r2);
      chip(ctx, 'reserves at central bank', 730, y + 170, { color: C.gold, size: 30, alpha: a * r2, w: 460 });
      chip(ctx, 'capital requirements', 730, y + 290, { color: C.gold, size: 30, alpha: a * r2 * range(lt, sp('r2', 0.5), sp('r2', 0.5) + 0.6), w: 460 });
      label(ctx, 'caps how much a bank can lend', 960, y + 440, { size: 26, mono: true, color: C.text, alpha: a * r2 * range(lt, sp('r2', 0.7), sp('r2', 0.7) + 0.6), weight: 500 });
      // 3: government + demand
      const r3 = easeOut(range(lt, sp('r3', 0), sp('r3', 0) + 0.8));
      box(ctx, 1250, y, w, h, 'spending and demand', GREEN, a * r3);
      chip(ctx, 'government spends', 1290, y + 170, { color: GREEN, size: 30, alpha: a * r3, w: 460 });
      chip(ctx, 'people want loans', 1290, y + 290, { color: GREEN, size: 30, alpha: a * r3 * range(lt, sp('r3', 0.55), sp('r3', 0.55) + 0.6), w: 460 });
      label(ctx, 'no borrowers, no new money', 1520, y + 440, { size: 26, mono: true, color: C.text, alpha: a * r3 * range(lt, sp('r3', 0.75), sp('r3', 0.75) + 0.6), weight: 500 });
      caption(ctx, 'r1', a, lt, CS.r1);
      caption(ctx, 'r2', a, lt, CS.r2);
      caption(ctx, 'r3', a, lt, CS.r3);
    },

    limit(ctx, t) {
      const a = chapterAlpha(T, 'limit', t), lt = t - T.limit[0];
      chapterTag(ctx, '05', 'The real limit', a);
      const on = range(lt, 0.3, 0.9), u = easeInOut(range(lt, sp('i1', 0.2), sp('i1', 0.2) + 4));
      const x0 = 420, y0 = 780, w = 1000, h = 460;
      axes(ctx, x0, y0, w, h, a * on);
      const goods = (x) => 0.2 + 0.18 * x, cash = (x) => 0.2 + 0.7 * x * x;
      curve(ctx, x0, y0, w, h, goods, u, C.electron, a * on);
      curve(ctx, x0, y0, w, h, cash, u, GREEN, a * on);
      label(ctx, 'goods the economy can make', x0 + w - 10, y0 - h * goods(1) + 50, { size: 26, mono: true, color: C.electron, align: 'right', alpha: a * on, weight: 700 });
      label(ctx, 'money', x0 + w - 10, y0 - h * cash(1) - 30, { size: 26, mono: true, color: GREEN, align: 'right', alpha: a * on, weight: 700 });
      const k = range(u, 0.75, 1);
      label(ctx, 'gap = prices rise', x0 + w * 0.55, y0 - h * 0.85, { size: 30, mono: true, color: C.proton, align: 'right', alpha: a * k, weight: 700 });
      chip(ctx, 'inflation', 1520, 300, { color: C.proton, size: 56, alpha: a * range(lt, sp('i1', 0.7), sp('i1', 0.7) + 0.6), w: 300 });
      label(ctx, '$1  →  $1.50', 1670, 420, { size: 34, mono: true, color: C.proton, alpha: a * range(lt, sp('i1', 0.8), sp('i1', 0.8) + 0.6), weight: 700 });
      caption(ctx, 'i1', a, lt, CS.i1);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 3;
      label(ctx, 'Money is mostly a promise', CX, CY - 50, { size: 90, weight: 700, color: C.text, alpha: a * range(lt, 0.4, 1.2) });
      label(ctx, 'managed as trust', CX, CY + 80, { size: 90, weight: 700, color: GREEN, alpha: a * range(lt, 0.4 + s * 0.45, 1.2 + s * 0.45) });
    },
  },
});
