import { C, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, chip, panel, arrow, card, pathAt, bar } from '/runtime/kit.js';

const { clamp, lerp, range, easeOut, easeInOut, fadeWindow } = Scene;

const GREEN = '#7ee787';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- economics/money-and-rates/what-is-money`.
const TXT = {
  m1: 'Without money, people must [[barter]]: I trade my eggs for your shoes.',
  m2: 'But it only works if you want my eggs, and I want your shoes. That rare match is the [[double coincidence of wants]].',
  m3: 'Money fixes this. It is a [[medium of exchange]]: sell to anyone, buy from anyone.',
  m4: 'It is a [[store of value]]: you can earn today, and spend months later.',
  m5: 'And it is a [[unit of account]]: every price uses the same measure, so we can compare eggs, shoes, and rent.',
  m6: 'Modern money, like the dollar, is [[fiat money]]. It is not backed by gold. It works because the government says so, and because everyone [[trusts]] it.',
  m7: 'If too much new money is created while goods stay the same, each unit buys less. Prices rise. That is [[inflation:proton]].',
};
const nar = await narration('economics/money-and-rates/what-is-money', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { barter: ['m1', 'm2'], funcs: ['m3', 'm4', 'm5'], fiat: ['m6'], infl: ['m7'] });
const { CS, T } = P;
const sp = speech(nar, CS);

function person(ctx, x, y, name, has, wants, color, alpha) {
  glowDot(ctx, x, y - 70, 38, color, alpha);
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x - 55, y - 20, 110, 120, 40); ctx.fill(); ctx.restore();
  label(ctx, name, x, y + 140, { size: 30, mono: true, alpha, weight: 700 });
  label(ctx, `has: ${has}`, x, y + 190, { size: 26, mono: true, color: C.dim, alpha, weight: 500 });
  label(ctx, `wants: ${wants}`, x, y + 230, { size: 26, mono: true, color: C.gold, alpha, weight: 500 });
}
function coin(ctx, x, y, r, alpha) {
  glowDot(ctx, x, y, r, C.gold, alpha);
  label(ctx, '$', x, y + 2, { size: r * 1.2, color: C.bg, alpha, weight: 700, mono: true });
}

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      coin(ctx, CX, 230, 60, a * 0.9 * range(t, 0.2, 1));
      titleCard(ctx, t, T, { l1: 'What is', l2: 'money?', sub: 'from barter to the dollar', tint: C.gold, size: 128 });
    },

    barter(ctx, t) {
      const a = chapterAlpha(T, 'barter', t), lt = t - T.barter[0];
      chapterTag(ctx, '01', 'Barter', a);
      const k = easeOut(range(lt, 0.3, 0.9));
      person(ctx, 480, 330, 'farmer', 'eggs', 'bread', C.electron, a * k);
      person(ctx, 1440, 330, 'cobbler', 'shoes', 'cheese', C.copper, a * k);
      // m1: the hopeful trade; m2: it fails
      const o = range(lt, sp('m1', 0.4), sp('m1', 0.4) + 0.6);
      card(ctx, 780, 360, C.electron, a * o, 150, 56); label(ctx, 'eggs', 780, 360, { size: 28, mono: true, alpha: a * o, weight: 700 });
      card(ctx, 1140, 360, C.copper, a * o, 150, 56); label(ctx, 'shoes', 1140, 360, { size: 28, mono: true, alpha: a * o, weight: 700 });
      arrow(ctx, 870, 360, 1050, 360, C.dim, a * o, 4);
      const no = range(lt, sp('m2', 0.35), sp('m2', 0.35) + 0.5);
      label(ctx, '✕', CX, 360, { size: 150, color: C.proton, alpha: a * no * 0.85, weight: 700 });
      label(ctx, 'no match → no trade', CX, 560, { size: 34, mono: true, color: C.proton, alpha: a * no, weight: 700 });
      caption(ctx, 'm1', a, lt, CS.m1);
      caption(ctx, 'm2', a, lt, CS.m2);
    },

    funcs(ctx, t) {
      const a = chapterAlpha(T, 'funcs', t), lt = t - T.funcs[0];
      chapterTag(ctx, '02', 'What money does', a);
      const cols = [CX - 600, CX, CX + 600];
      const names = ['medium of exchange', 'store of value', 'unit of account'], cols_ = [C.electron, GREEN, C.gold], ids = ['m3', 'm4', 'm5'];
      names.forEach((n, i) => {
        const k = easeOut(range(lt, sp(ids[i], 0.0), sp(ids[i], 0.0) + 0.6));
        panel(ctx, cols[i] - 270, 220, 540, 480, cols_[i], a * k, 0.05, 22);
        label(ctx, n, cols[i], 270, { size: 32, mono: true, color: cols_[i], alpha: a * k, weight: 700 });
      });
      // exchange: coin goes A -> B -> C
      {
        const x = cols[0], s0 = sp('m3', 0.3), u = ((lt - s0) * 0.5) % 1, on = range(lt, s0 - 0.2, s0);
        [[x - 150, 520], [x, 400], [x + 150, 520]].forEach(([px, py], j) => glowDot(ctx, px, py, 34, [C.electron, C.copper, C.proton][j], a * on));
        const [cx, cy] = pathAt([[x - 150, 520], [x, 400], [x + 150, 520], [x - 150, 520]], u);
        coin(ctx, cx, cy - 56, 24, a * on);
      }
      // store: bar of savings stays level over time
      {
        const x = cols[1], s0 = sp('m4', 0.1), on = range(lt, s0, s0 + 0.5), u = clamp((lt - s0) / 4, 0, 1);
        bar(ctx, { x: x - 150, y: 440, w: 300, color: GREEN, alpha: a * on, name: '', value: '', h: 56 });
        label(ctx, 'earn today', x - 110, 530, { size: 26, mono: true, color: C.dim, alpha: a * on, weight: 500 });
        label(ctx, 'spend later', x + 110, 530, { size: 26, mono: true, color: C.dim, alpha: a * on, weight: 500 });
        arrow(ctx, x - 130, 590, x - 130 + 260 * u, 590, GREEN, a * on, 4);
        label(ctx, 'still worth about the same', x, 650, { size: 24, mono: true, color: GREEN, alpha: a * on * range(u, 0.5, 1), weight: 600 });
      }
      // account: one price list
      {
        const x = cols[2], on = range(lt, sp('m5', 0.15), sp('m5', 0.15) + 0.5);
        [['eggs', '$3'], ['shoes', '$60'], ['rent', '$900']].forEach(([n, p], i) => {
          const r = range(lt, sp('m5', 0.25 + i * 0.15), sp('m5', 0.25 + i * 0.15) + 0.5);
          label(ctx, n, x - 150, 390 + i * 100, { size: 34, mono: true, align: 'left', alpha: a * on * r, weight: 600 });
          label(ctx, p, x + 150, 390 + i * 100, { size: 34, mono: true, align: 'right', color: C.gold, alpha: a * on * r, weight: 700 });
        });
      }
      caption(ctx, 'm3', a, lt, CS.m3);
      caption(ctx, 'm4', a, lt, CS.m4);
      caption(ctx, 'm5', a, lt, CS.m5);
    },

    fiat(ctx, t) {
      const a = chapterAlpha(T, 'fiat', t), lt = t - T.fiat[0];
      chapterTag(ctx, '03', 'Fiat money', a);
      const k = easeOut(range(lt, 0.3, 0.9));
      ctx.save(); ctx.globalAlpha = a * k; ctx.fillStyle = 'rgba(126,231,135,0.18)'; ctx.strokeStyle = GREEN; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect(CX - 170, 250, 340, 180, 16); ctx.fill(); ctx.stroke(); ctx.restore();
      label(ctx, '$20', CX, 340, { size: 90, mono: true, weight: 700, alpha: a * k });
      label(ctx, 'just paper', CX, 470, { size: 30, mono: true, color: C.dim, alpha: a * k, weight: 500 });
      const nogold = range(lt, sp('m6', 0.3), sp('m6', 0.3) + 0.5);
      chip(ctx, 'not backed by gold', CX - 700, 340, { color: C.proton, size: 32, alpha: a * nogold, w: 400 });
      const trust = sp('m6', 0.6);
      ['government says so', 'everyone accepts it'].forEach((s, i) => {
        const r = range(lt, trust + i * 0.5, trust + i * 0.5 + 0.6);
        chip(ctx, s, CX + 300, 280 + i * 120, { color: GREEN, size: 32, alpha: a * r, w: 440 });
        arrow(ctx, CX + 290, 300 + i * 120, CX + 190, 340, GREEN, a * r * 0.7, 3);
      });
      for (let i = 0; i < 14; i++) {
        const ang = (i / 14) * Math.PI * 2, r = 100 + (i % 2) * 20;
        glowDot(ctx, CX + Math.cos(ang) * (300 + r), 700 + Math.sin(ang) * 80, 12, i % 2 ? C.electron : C.copper, a * range(lt, trust + 0.4, trust + 1.2) * 0.8);
      }
      label(ctx, 'trust is the real backing', CX, 830, { size: 36, mono: true, color: GREEN, alpha: a * range(lt, trust + 1.2, trust + 1.9), weight: 700 });
      caption(ctx, 'm6', a, lt, CS.m6);
    },

    infl(ctx, t) {
      const a = chapterAlpha(T, 'infl', t), lt = t - T.infl[0];
      chapterTag(ctx, '04', 'Inflation', a);
      const s0 = sp('m7', 0.1), u = easeInOut(range(lt, s0 + 0.4, s0 + 4.2));
      const on = range(lt, 0.3, 0.9);
      bar(ctx, { x: 520, y: 320, w: lerp(200, 700, u), color: GREEN, alpha: a * on, name: 'money', value: '' });
      bar(ctx, { x: 520, y: 430, w: 200, color: C.electron, alpha: a * on, name: 'goods', value: 'same' });
      const price = Math.round(lerp(3, 12, u));
      label(ctx, 'price of eggs', CX, 580, { size: 30, mono: true, color: C.dim, alpha: a * on, weight: 500 });
      label(ctx, `$${price}`, CX, 680, { size: 120, mono: true, weight: 700, color: lerp(0, 1, u) > 0.3 ? C.proton : C.text, alpha: a * on });
      label(ctx, 'each dollar buys less', CX, 790, { size: 34, mono: true, color: C.proton, alpha: a * range(u, 0.4, 0.9), weight: 700 });
      caption(ctx, 'm7', a, lt, CS.m7);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 3;
      coin(ctx, CX, CY - 220, 70, a * range(lt, 0.3, 1));
      label(ctx, 'Money is trust.', CX, CY - 40, { size: 110, weight: 700, color: C.gold, alpha: a * range(lt, 0.5, 1.3) });
      label(ctx, 'that we can all count on', CX, CY + 90, { size: 54, weight: 600, alpha: a * range(lt, 0.5 + s * 0.4, 1.3 + s * 0.4) });
    },
  },
});
