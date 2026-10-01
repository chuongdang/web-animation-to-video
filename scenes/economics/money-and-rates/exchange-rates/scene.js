import { C, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, chip, panel, arrow, card, token } from '/runtime/kit.js';

const { clamp, lerp, range, easeOut, easeInOut, fadeWindow } = Scene;

const GREEN = '#7ee787';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- economics/money-and-rates/exchange-rates`.
const TXT = {
  e1: 'An [[exchange rate]] is the price of one currency in another. If one dollar buys 25,000 dong, that is the rate.',
  e2: 'We need it because each country\'s money works mostly at home. To buy from abroad, someone must [[swap currencies]] first.',
  e3: 'Most rates are set by [[supply and demand]] in the foreign exchange market. When more people want a currency, its price goes [[up:green]].',
  e4: 'Demand comes from [[trade]], [[tourism]], [[investment]], and above all, the [[interest rate]] a country pays.',
  e5: 'When the dollar gets [[stronger]], imports from America cost more in dong, but Vietnamese exports look [[cheaper]] to American buyers.',
  e6: 'Some governments [[manage]] the rate. A central bank can buy or sell its reserves to keep the currency inside a [[target band]].',
};
const nar = await narration('economics/money-and-rates/exchange-rates', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { price: ['e1', 'e2'], market: ['e3', 'e4'], effect: ['e5'], manage: ['e6'] });
const { CS, T } = P;
const sp = speech(nar, CS);

const fmt = (n) => Math.round(n).toLocaleString('en-US');
// deterministic wobble so the rate line looks alive without Math.random
const wob = (x) => Math.sin(x * 1.7) * 0.35 + Math.sin(x * 3.1 + 1) * 0.2 + Math.sin(x * 0.7 + 2) * 0.3;

/** line chart of `fn(i)` for i in 0..n, drawn up to `upTo` (0..1) in the box x,y,w,h */
function chart(ctx, x, y, w, h, fn, n, upTo, color, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.beginPath();
  const m = Math.floor(n * upTo);
  for (let i = 0; i <= m; i++) { const px = x + (i / n) * w, py = y + h - fn(i / n) * h; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.stroke(); ctx.restore();
  const v = fn(m / n);
  glowDot(ctx, x + (m / n) * w, y + h - v * h, 11, color, alpha);
  return v;
}

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      ['USD', 'EUR', 'JPY', 'VND'].forEach((c, i) => token(ctx, c, CX - 330 + i * 220, 215, [C.gold, C.electron, C.proton, GREEN][i], a * range(t, 0.3 + i * 0.15, 0.9 + i * 0.15), 34));
      titleCard(ctx, t, T, { l1: 'How', l2: 'exchange rates work', sub: 'the price of one currency in another', tint: C.electron, size: 104 });
    },

    price(ctx, t) {
      const a = chapterAlpha(T, 'price', t), lt = t - T.price[0];
      chapterTag(ctx, '01', 'The rate', a);
      const k = easeOut(range(lt, 0.3, 0.9));
      chip(ctx, '1 USD', CX - 620, 300, { color: C.gold, size: 80, alpha: a * k, w: 360 });
      label(ctx, '=', CX - 170, 300, { size: 90, weight: 700, alpha: a * k });
      chip(ctx, '25,000 VND', CX - 70, 300, { color: GREEN, size: 80, alpha: a * k, w: 660 });
      // m2: a traveller swaps money at a booth
      const s = sp('e2', 0.15), on = range(lt, s, s + 0.6), u = clamp((lt - s - 0.5) / 2.2, 0, 1);
      panel(ctx, CX - 190, 560, 380, 190, C.dim, a * on, 0.05, 22);
      label(ctx, 'currency exchange', CX, 600, { size: 26, mono: true, color: C.dim, alpha: a * on, weight: 600 });
      label(ctx, 'USD ⇄ VND', CX, 670, { size: 50, mono: true, weight: 700, alpha: a * on });
      label(ctx, 'abroad', CX - 620, 600, { size: 28, mono: true, color: C.dim, alpha: a * on, weight: 500 });
      label(ctx, 'at home', CX + 620, 600, { size: 28, mono: true, color: C.dim, alpha: a * on, weight: 500 });
      card(ctx, lerp(CX - 620, CX - 260, easeInOut(u)), 700, C.gold, a * on * (u < 1 ? 1 : 0), 130, 52);
      label(ctx, '$', lerp(CX - 620, CX - 260, easeInOut(u)), 700, { size: 30, mono: true, color: C.gold, alpha: a * on * (u < 1 ? 1 : 0), weight: 700 });
      const v = range(lt, s + 2.7, s + 3.2);
      card(ctx, lerp(CX + 260, CX + 620, easeInOut(range(lt, s + 2.7, s + 4.5))), 700, GREEN, a * v, 190, 52);
      label(ctx, 'VND', lerp(CX + 260, CX + 620, easeInOut(range(lt, s + 2.7, s + 4.5))), 700, { size: 28, mono: true, color: GREEN, alpha: a * v, weight: 700 });
      caption(ctx, 'e1', a, lt, CS.e1);
      caption(ctx, 'e2', a, lt, CS.e2);
    },

    market(ctx, t) {
      const a = chapterAlpha(T, 'market', t), lt = t - T.market[0];
      chapterTag(ctx, '02', 'Supply and demand', a);
      const on = range(lt, 0.3, 0.9), s = sp('e3', 0.2);
      // buyers vs sellers of dollars
      const buy = clamp((lt - s) / 3, 0, 1);
      label(ctx, 'USD / VND', 520, 215, { size: 30, mono: true, color: C.dim, alpha: a * on, weight: 600 });
      const demand = (x) => 0.35 + 0.35 * easeInOut(clamp((x - 0.15) / 0.7, 0, 1)) + wob(x * 6) * 0.05;
      const v = chart(ctx, 230, 260, 600, 340, demand, 80, buy, C.gold, a * on);
      label(ctx, fmt(23800 + (v - 0.35) * 5400) + ' VND', 530, 650, { size: 44, mono: true, weight: 700, color: C.gold, alpha: a * on });
      // pressure arrows
      const n = Math.round(1 + buy * 4);
      for (let i = 0; i < n; i++) arrow(ctx, 1000, 330 + i * 38, 1180, 330 + i * 38, GREEN, a * on * 0.9, 5);
      label(ctx, 'more buyers of USD', 1420, 330, { size: 28, mono: true, color: GREEN, alpha: a * on, weight: 700 });
      label(ctx, '→ USD price up', 1420, 380, { size: 28, mono: true, color: C.gold, alpha: a * on * range(buy, 0.3, 0.8), weight: 700 });
      // drivers
      ['trade', 'tourism', 'investment', 'interest rate'].forEach((d, i) => {
        const r = easeOut(range(lt, sp('e4', 0.1 + i * 0.17), sp('e4', 0.1 + i * 0.17) + 0.5));
        chip(ctx, d, 240 + i * 395, 800, { color: i === 3 ? C.proton : C.electron, size: 36, alpha: a * r, w: 360, weight: i === 3 ? 700 : 500 });
      });
      label(ctx, 'what makes people want a currency', CX, 725, { size: 26, mono: true, color: C.dim, alpha: a * range(lt, sp('e4', 0), sp('e4', 0) + 0.6), weight: 500 });
      caption(ctx, 'e3', a, lt, CS.e3);
      caption(ctx, 'e4', a, lt, CS.e4);
    },

    effect(ctx, t) {
      const a = chapterAlpha(T, 'effect', t), lt = t - T.effect[0];
      chapterTag(ctx, '03', 'Strong dollar', a);
      const on = range(lt, 0.3, 0.9), u = easeInOut(range(lt, sp('e5', 0.1), sp('e5', 0.5)));
      const rate = lerp(24000, 26000, u);
      label(ctx, 'USD / VND', CX, 200, { size: 28, mono: true, color: C.dim, alpha: a * on, weight: 600 });
      label(ctx, fmt(rate), CX, 270, { size: 90, mono: true, weight: 700, color: C.gold, alpha: a * on });
      label(ctx, 'dollar gets stronger ▲', CX, 345, { size: 28, mono: true, color: GREEN, alpha: a * on * range(u, 0.1, 0.5), weight: 700 });
      panel(ctx, 160, 420, 740, 270, C.proton, a * on, 0.05, 22);
      panel(ctx, 1020, 420, 740, 270, GREEN, a * on, 0.05, 22);
      label(ctx, 'Import from the US', 530, 470, { size: 30, mono: true, color: C.proton, alpha: a * on, weight: 700 });
      label(ctx, 'item priced $100', 530, 530, { size: 28, mono: true, color: C.dim, alpha: a * on, weight: 500 });
      label(ctx, fmt(rate * 100) + ' VND', 530, 610, { size: 56, mono: true, weight: 700, alpha: a * on });
      label(ctx, 'costs more', 530, 660, { size: 26, mono: true, color: C.proton, alpha: a * on * range(u, 0.3, 0.8), weight: 600 });
      label(ctx, 'Export to the US', 1390, 470, { size: 30, mono: true, color: GREEN, alpha: a * on, weight: 700 });
      label(ctx, 'coffee priced 100,000 VND', 1390, 530, { size: 28, mono: true, color: C.dim, alpha: a * on, weight: 500 });
      label(ctx, '$' + (100000 / rate).toFixed(2), 1390, 610, { size: 56, mono: true, weight: 700, alpha: a * on });
      label(ctx, 'cheaper for buyers', 1390, 660, { size: 26, mono: true, color: GREEN, alpha: a * on * range(u, 0.3, 0.8), weight: 600 });
      caption(ctx, 'e5', a, lt, CS.e5);
    },

    manage(ctx, t) {
      const a = chapterAlpha(T, 'manage', t), lt = t - T.manage[0];
      chapterTag(ctx, '04', 'Managed rates', a);
      const on = range(lt, 0.3, 0.9), s = sp('e6', 0.35), band = range(lt, s, s + 0.7);
      const x0 = 330, w = 1260, y0 = 230, h = 380;
      ctx.save(); ctx.globalAlpha = a * band * 0.9; ctx.fillStyle = 'rgba(126,231,135,0.14)'; ctx.strokeStyle = GREEN; ctx.setLineDash([10, 8]); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(x0, y0 + h * 0.35, w, h * 0.3, 8); ctx.fill(); ctx.stroke(); ctx.restore();
      label(ctx, 'target band', x0 + w - 10, y0 + h * 0.35 - 22, { size: 26, mono: true, color: GREEN, align: 'right', alpha: a * band, weight: 700 });
      // free line drifts out; managed line is held in the band
      const free = (x) => 0.5 + (x - 0.2) * 0.9 + wob(x * 7) * 0.06;
      const held = (x) => clamp(free(x), 0.4, 0.6) + wob(x * 11) * 0.015;
      const up = clamp(lt / 6, 0, 1);
      chart(ctx, x0, y0, w, h, free, 90, up, C.dim, a * on * 0.7);
      chart(ctx, x0, y0, w, h, held, 90, up, C.gold, a * on);
      label(ctx, 'without intervention', x0 + w * 0.8, y0 + 20, { size: 24, mono: true, color: C.dim, alpha: a * on, weight: 500 });
      const r = range(lt, s + 1, s + 1.6);
      chip(ctx, 'central bank', 330, 740, { color: C.electron, size: 36, alpha: a * r, w: 330 });
      chip(ctx, 'sells / buys reserves', 760, 740, { color: C.copper, size: 36, alpha: a * r, w: 480 });
      arrow(ctx, 670, 740, 750, 740, C.dim, a * r, 4);
      chip(ctx, 'rate stays in band', 1340, 740, { color: GREEN, size: 36, alpha: a * r, w: 400 });
      arrow(ctx, 1250, 740, 1330, 740, C.dim, a * r, 4);
      caption(ctx, 'e6', a, lt, CS.e6);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      chip(ctx, '1 USD = 25,000 VND', CX - 480, CY - 100, { color: C.gold, size: 72, alpha: a * range(lt, 0.3, 1), w: 960 });
      label(ctx, 'just a price', CX, CY + 80, { size: 100, weight: 700, color: C.electron, alpha: a * range(lt, 0.8, 1.6) });
    },
  },
});
