import { C, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, chip, panel, arrow, token, pathAt, bar } from '/runtime/kit.js';

const { clamp, lerp, range, easeOut, easeInOut, fadeWindow } = Scene;

const GREEN = '#7ee787';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- economics/money-and-rates/fed-rate-hikes`.
const TXT = {
  f1: 'The US central bank, the [[Federal Reserve]], sets the base [[interest rate]] for dollars. When it raises the rate, holding dollars pays more.',
  f2: 'Global investors chase the best safe return. So money leaves other countries and flows into [[American bonds]].',
  f3: 'To buy those bonds they need dollars, so they sell other currencies. The dollar [[strengthens]], and other currencies [[weaken:proton]].',
  f4: 'For other countries this hurts. [[Imports]] like oil and food cost more, and [[debts owed in dollars:proton]] become heavier to repay.',
  f5: 'Their central banks often raise their own rates to stop money leaving. That slows their economies: loans get costly, and [[growth]] drops.',
  f6: 'It reaches everywhere because the dollar is the world\'s main currency: [[oil, trade, loans, and reserves]] are mostly in dollars.',
};
const nar = await narration('economics/money-and-rates/fed-rate-hikes', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { rate: ['f1'], flow: ['f2', 'f3'], pain: ['f4', 'f5'], dollar: ['f6'] });
const { CS, T } = P;
const sp = speech(nar, CS);

const COUNTRIES = [['Vietnam', 330, 330, C.electron], ['Japan', 330, 560, C.copper], ['Brazil', 330, 790, C.gold]];
const US = [1480, 560];

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      label(ctx, '5.50%', CX, 215, { size: 70, mono: true, weight: 700, color: C.gold, alpha: a * 0.5 * range(t, 0.3, 1) });
      titleCard(ctx, t, T, { l1: 'Why US rate hikes', l2: 'shake the world', sub: 'one interest rate, felt everywhere', tint: C.proton, size: 104 });
    },

    rate(ctx, t) {
      const a = chapterAlpha(T, 'rate', t), lt = t - T.rate[0];
      chapterTag(ctx, '01', 'The Fed raises rates', a);
      const on = range(lt, 0.3, 0.9), s = sp('f1', 0.35), u = easeInOut(range(lt, s, s + 2));
      chip(ctx, 'Federal Reserve', 220, 260, { color: C.electron, size: 40, alpha: a * on, w: 460 });
      const r = lerp(1, 5, u);
      label(ctx, 'base interest rate', 450, 400, { size: 26, mono: true, color: C.dim, alpha: a * on, weight: 500 });
      label(ctx, r.toFixed(2) + '%', 450, 490, { size: 120, mono: true, weight: 700, color: u > 0.05 ? C.gold : C.text, alpha: a * on });
      label(ctx, '▲ raised', 450, 590, { size: 32, mono: true, color: C.proton, alpha: a * range(u, 0.1, 0.4), weight: 700 });
      panel(ctx, 960, 250, 760, 400, GREEN, a * on, 0.05, 22);
      label(ctx, 'save $100 in dollars for a year', 1340, 305, { size: 28, mono: true, color: C.dim, alpha: a * on, weight: 500 });
      bar(ctx, { x: 1130, y: 410, w: 300, color: C.dim, alpha: a * on, name: 'before', value: '$101', h: 50 });
      bar(ctx, { x: 1130, y: 520, w: lerp(300, 300 + 4 * 30, u), color: GREEN, alpha: a * on, name: 'after', value: '$' + (100 + r).toFixed(0), h: 50 });
      label(ctx, 'dollars now pay more', CX, 790, { size: 38, mono: true, color: GREEN, alpha: a * range(u, 0.6, 1), weight: 700 });
      caption(ctx, 'f1', a, lt, CS.f1);
    },

    flow(ctx, t) {
      const a = chapterAlpha(T, 'flow', t), lt = t - T.flow[0];
      chapterTag(ctx, '02', 'Money flows to the dollar', a);
      const on = range(lt, 0.3, 0.9);
      COUNTRIES.forEach(([n, x, y, col]) => chip(ctx, n, x - 130, y, { color: col, size: 34, alpha: a * on, w: 260 }));
      chip(ctx, 'US bonds', US[0] - 170, US[1], { color: GREEN, size: 44, alpha: a * on, w: 340 });
      const s = sp('f2', 0.3);
      COUNTRIES.forEach(([n, x, y, col], i) => {
        for (let k = 0; k < 4; k++) {
          const u = ((lt - s - k * 0.55 - i * 0.18) / 2.2);
          if (u <= 0 || lt > sp('f3', 0.9)) continue;
          const [px, py] = pathAt([[x + 140, y], [US[0] - 190, US[1]]], clamp(u % 1, 0, 1) );
          glowDot(ctx, px, py, 13, col, a * 0.9 * Math.min(1, u * 3));
        }
      });
      // f3: exchange rate lines
      const k = range(lt, sp('f3', 0.2), sp('f3', 0.2) + 0.7), d = easeInOut(range(lt, sp('f3', 0.3), sp('f3', 0.3) + 2.5));
      const usd = 100 + d * 8;
      label(ctx, 'USD', 960, 200, { size: 30, mono: true, color: C.gold, alpha: a * k, weight: 700 });
      label(ctx, 'index ' + usd.toFixed(0), 960, 250, { size: 50, mono: true, weight: 700, color: C.gold, alpha: a * k });
      label(ctx, '▲ stronger', 960, 305, { size: 28, mono: true, color: GREEN, alpha: a * k, weight: 700 });
      COUNTRIES.forEach(([n, x, y, col]) => label(ctx, '▼ weaker', x + 400, y + 52, { size: 26, mono: true, color: C.proton, alpha: a * k, weight: 700 }));
      caption(ctx, 'f2', a, lt, CS.f2);
      caption(ctx, 'f3', a, lt, CS.f3);
    },

    pain(ctx, t) {
      const a = chapterAlpha(T, 'pain', t), lt = t - T.pain[0];
      chapterTag(ctx, '03', 'The squeeze', a);
      const on = range(lt, 0.3, 0.9), s = sp('f4', 0.2);
      const rows = [
        ['imported oil', 'costs more', C.proton, 0.0],
        ['debt in dollars', 'harder to repay', C.proton, 0.5],
      ];
      rows.forEach(([n, d, col, off], i) => {
        const r = range(lt, s + off * 2, s + off * 2 + 0.6);
        chip(ctx, n, 220, 270 + i * 150, { color: col, size: 38, alpha: a * on * r, w: 440 });
        bar(ctx, { x: 820, y: 270 + i * 150, w: lerp(200, 520, easeInOut(range(lt, s + off * 2 + 0.3, s + off * 2 + 2.3))), color: col, alpha: a * on * r, name: '', value: '', h: 46 });
        label(ctx, d, 1420, 270 + i * 150, { size: 26, mono: true, color: C.dim, align: 'left', alpha: a * on * r, weight: 500 });
      });
      const s5 = sp('f5', 0.1), r5 = range(lt, s5, s5 + 0.6);
      chip(ctx, 'local central bank raises rates', 220, 560, { color: C.copper, size: 38, alpha: a * r5, w: 740 });
      arrow(ctx, 980, 560, 1100, 560, C.dim, a * r5, 4);
      chip(ctx, 'loans cost more', 1120, 560, { color: C.copper, size: 38, alpha: a * range(lt, s5 + 0.6, s5 + 1.2), w: 380 });
      arrow(ctx, 1510, 560, 1590, 560, C.dim, a * range(lt, s5 + 1.2, s5 + 1.6), 4);
      label(ctx, 'growth ↓', 1700, 560, { size: 40, mono: true, color: C.proton, alpha: a * range(lt, s5 + 1.2, s5 + 1.8), weight: 700 });
      caption(ctx, 'f4', a, lt, CS.f4);
      caption(ctx, 'f5', a, lt, CS.f5);
    },

    dollar(ctx, t) {
      const a = chapterAlpha(T, 'dollar', t), lt = t - T.dollar[0];
      chapterTag(ctx, '04', 'Why everyone feels it', a);
      const on = easeOut(range(lt, 0.3, 0.9)), cy = 470;
      glowDot(ctx, CX, cy, 90, C.gold, a * on);
      label(ctx, '$', CX, cy + 4, { size: 110, color: C.bg, weight: 700, mono: true, alpha: a * on });
      ['oil', 'trade', 'loans', 'reserves'].forEach((n, i) => {
        const px = CX + [-560, 560, -560, 560][i], py = [330, 330, 620, 620][i];
        const r = range(lt, sp('f6', 0.4 + i * 0.12), sp('f6', 0.4 + i * 0.12) + 0.6);
        arrow(ctx, CX + (px < CX ? -110 : 110), cy + (py < cy ? -30 : 30), px + (px < CX ? 160 : -160), py, C.gold, a * r * 0.8, 4);
        chip(ctx, n, px - 150, py, { color: C.gold, size: 40, alpha: a * r, w: 300 });
      });
      caption(ctx, 'f6', a, lt, CS.f6);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      label(ctx, 'US raises rates', CX, CY - 110, { size: 96, weight: 700, color: C.gold, alpha: a * range(lt, 0.4, 1.2) });
      label(ctx, 'the world feels it', CX, CY + 40, { size: 96, weight: 700, color: C.proton, alpha: a * range(lt, 1.2, 2) });
    },
  },
});
