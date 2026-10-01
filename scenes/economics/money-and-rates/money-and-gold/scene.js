import { C, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, chip, panel, arrow, card, pathAt } from '/runtime/kit.js';

const { clamp, lerp, range, easeOut, easeInOut, fadeWindow } = Scene;

const GREEN = '#7ee787';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- economics/money-and-rates/money-and-gold`.
const TXT = {
  g1: 'For thousands of years, [[gold]] was money: it is rare, it lasts, it can be divided, and nobody can simply print it.',
  g2: 'Carrying gold was risky, so people stored it with goldsmiths and banks, who handed back paper [[receipts]]. Those receipts began to circulate as [[paper money]].',
  g3: 'Under the [[gold standard]], every note could be exchanged for a fixed amount of gold. So the money supply was [[limited]] by the gold in the vaults.',
  g4: 'It also fixed [[exchange rates]], because every currency was a weight of gold. After the second world war, the dollar was tied to gold, and other currencies were tied to the dollar.',
  g5: 'But economies grew faster than the gold supply, and governments could not create money in a crisis. In [[1971:proton]], the United States stopped exchanging dollars for gold.',
  g6: 'Today money is fiat, but gold has not disappeared. Central banks still hold it as a [[reserve]], and investors buy it as a [[store of value]] when they fear inflation or crisis.',
};
const nar = await narration('economics/money-and-rates/money-and-gold', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { gold: ['g1'], receipt: ['g2'], standard: ['g3', 'g4'], end: ['g5'], today: ['g6'] });
const { CS, T } = P;
const sp = speech(nar, CS);

function bullion(ctx, x, y, alpha, w = 150, h = 70) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.shadowColor = C.gold; ctx.shadowBlur = 18;
  ctx.fillStyle = C.gold; ctx.beginPath(); ctx.moveTo(x - w / 2 + 18, y - h / 2); ctx.lineTo(x + w / 2 - 18, y - h / 2); ctx.lineTo(x + w / 2, y + h / 2); ctx.lineTo(x - w / 2, y + h / 2); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x - w / 2 + 28, y - h / 2 + 10, w - 56, 8); ctx.restore();
}
function note(ctx, x, y, alpha, text = '$') {
  card(ctx, x, y, GREEN, alpha, 120, 64);
  label(ctx, text, x, y, { size: 30, mono: true, weight: 700, alpha });
}
function vault(ctx, x, y, w, h, alpha, nBars) {
  panel(ctx, x - w / 2, y - h / 2, w, h, C.dim, alpha, 0.06, 20);
  label(ctx, 'vault', x, y - h / 2 + 34, { size: 26, mono: true, color: C.dim, alpha, weight: 600 });
  for (let i = 0; i < nBars; i++) bullion(ctx, x - 90 + (i % 2) * 180, y - 20 + Math.floor(i / 2) * 85 * 0.9 - 10, alpha, 150, 66);
}

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      bullion(ctx, CX, 230, a * 0.9 * range(t, 0.2, 1), 220, 100);
      titleCard(ctx, t, T, { l1: 'Money', l2: 'and gold', sub: 'from vault receipts to the dollar', tint: C.gold, size: 128 });
    },

    gold(ctx, t) {
      const a = chapterAlpha(T, 'gold', t), lt = t - T.gold[0];
      chapterTag(ctx, '01', 'Gold as money', a);
      const k = easeOut(range(lt, 0.3, 1));
      bullion(ctx, CX, 420, a * k, 380, 170);
      label(ctx, 'Au', CX, 420, { size: 70, color: C.bg, mono: true, weight: 700, alpha: a * k });
      [['rare', -620, 300], ['lasts', 620, 300], ['divisible', -620, 560], ['can\'t be printed', 620, 560]].forEach(([s, dx, y], i) => {
        const r = range(lt, sp('g1', 0.25 + i * 0.17), sp('g1', 0.25 + i * 0.17) + 0.6);
        const w = 420, x = CX + dx - w / 2;
        chip(ctx, s, x, y, { color: C.gold, size: 38, alpha: a * r, w });
        arrow(ctx, dx < 0 ? x + w + 10 : x - 10, y, dx < 0 ? CX - 220 : CX + 220, 420 + (y - 420) * 0.4, C.gold, a * r * 0.6, 3);
      });
      caption(ctx, 'g1', a, lt, CS.g1);
    },

    receipt(ctx, t) {
      const a = chapterAlpha(T, 'receipt', t), lt = t - T.receipt[0];
      chapterTag(ctx, '02', 'Storage becomes paper', a);
      const on = range(lt, 0.3, 0.9), s = sp('g2', 0.1);
      vault(ctx, CX, 430, 460, 330, a * on, 4);
      glowDot(ctx, 330, 430, 40, C.electron, a * on); label(ctx, 'Alice', 330, 510, { size: 28, mono: true, alpha: a * on, weight: 700 });
      glowDot(ctx, 1590, 430, 40, C.copper, a * on); label(ctx, 'Bob', 1590, 510, { size: 28, mono: true, alpha: a * on, weight: 700 });
      // deposit: gold bar goes into the vault, receipt comes back
      const d = easeInOut(range(lt, s, s + 1.6));
      const [bx, by] = pathAt([[330, 420], [CX - 120, 430]], d);
      bullion(ctx, bx, by, a * on * (d < 1 ? 1 : 0), 110, 52);
      const r1 = easeInOut(range(lt, s + 1.6, s + 3));
      const [rx, ry] = pathAt([[CX - 120, 560], [330, 600]], r1);
      note(ctx, rx, ry, a * range(lt, s + 1.6, s + 1.9) * (lt < s + 4.6 ? 1 : 0), 'receipt');
      // later: Alice pays Bob with the receipt; gold stays put
      const r2 = easeInOut(range(lt, s + 4.6, s + 6.5));
      const [px, py] = pathAt([[330, 600], [1590, 600]], r2);
      note(ctx, px, py, a * range(lt, s + 4.6, s + 4.9), 'receipt');
      label(ctx, 'the receipt is spent, the gold stays in the vault', CX, 780, { size: 30, mono: true, color: GREEN, alpha: a * range(lt, s + 5.5, s + 6.3), weight: 700 });
      caption(ctx, 'g2', a, lt, CS.g2);
    },

    standard(ctx, t) {
      const a = chapterAlpha(T, 'standard', t), lt = t - T.standard[0];
      chapterTag(ctx, '03', 'The gold standard', a);
      const on = range(lt, 0.3, 0.9);
      // g3: note supply capped by gold
      const grow = easeInOut(range(lt, sp('g3', 0.2), sp('g3', 0.2) + 3)), gold = 0.55;
      chip(ctx, '$35 = 1 ounce of gold', CX - 400, 250, { color: C.gold, size: 52, alpha: a * on, w: 800 });
      const mx = lerp(0.3, gold, grow);
      ctx.save(); ctx.globalAlpha = a * on; ctx.fillStyle = GREEN; ctx.beginPath(); ctx.roundRect(520, 360, 880 * mx, 54, 8); ctx.fill(); ctx.restore();
      label(ctx, 'notes', 490, 387, { size: 30, mono: true, align: 'right', alpha: a * on, weight: 600 });
      ctx.save(); ctx.globalAlpha = a * on * 0.9; ctx.strokeStyle = C.gold; ctx.setLineDash([10, 8]); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(520 + 880 * gold, 335); ctx.lineTo(520 + 880 * gold, 440); ctx.stroke(); ctx.restore();
      label(ctx, 'gold in vaults', 520 + 880 * gold + 14, 460, { size: 26, mono: true, color: C.gold, align: 'left', alpha: a * on * range(grow, 0.5, 1), weight: 700 });
      label(ctx, 'cannot print past the limit', CX, 520, { size: 30, mono: true, color: C.proton, alpha: a * range(grow, 0.7, 1), weight: 700 });
      // g4: chain gold -> dollar -> other currencies
      const s4 = sp('g4', 0.3);
      const r = (d) => range(lt, s4 + d, s4 + d + 0.6);
      chip(ctx, 'gold', 220, 700, { color: C.gold, size: 40, alpha: a * r(0), w: 200 });
      arrow(ctx, 440, 700, 540, 700, C.dim, a * r(0.4), 4);
      chip(ctx, 'dollar', 560, 700, { color: GREEN, size: 40, alpha: a * r(0.4), w: 240 });
      ['pound', 'franc', 'yen'].forEach((n, i) => {
        arrow(ctx, 820, 700, 930, 620 + i * 80, C.dim, a * r(0.9 + i * 0.2), 3);
        chip(ctx, n, 950, 620 + i * 80, { color: C.electron, size: 34, alpha: a * r(0.9 + i * 0.2), w: 220 });
      });
      label(ctx, 'fixed exchange rates', 1450, 700, { size: 36, mono: true, color: C.electron, alpha: a * r(1.8), weight: 700 });
      caption(ctx, 'g3', a, lt, CS.g3);
      caption(ctx, 'g4', a, lt, CS.g4);
    },

    end(ctx, t) {
      const a = chapterAlpha(T, 'end', t), lt = t - T.end[0];
      chapterTag(ctx, '04', 'The link is cut', a);
      const on = range(lt, 0.3, 0.9), u = easeInOut(range(lt, 0.6, sp('g5', 0.6)));
      const x0 = 360, y0 = 250, w = 1200, h = 380;
      ctx.save(); ctx.globalAlpha = a * on; ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke(); ctx.restore();
      const goldY = (x) => 0.2 + 0.12 * x, econ = (x) => 0.2 + 0.7 * x * x;
      [[goldY, C.gold], [econ, GREEN]].forEach(([fn, col]) => {
        ctx.save(); ctx.globalAlpha = a * on; ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.beginPath();
        for (let i = 0; i <= 60 * u; i++) { const x = i / 60, px = x0 + x * w, py = y0 + h - fn(x) * h; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
        ctx.stroke(); ctx.restore();
      });
      label(ctx, 'economy / money needed', x0 + w - 20, y0 + 30, { size: 26, mono: true, color: GREEN, align: 'right', alpha: a * on, weight: 700 });
      label(ctx, 'gold supply', x0 + w - 20, y0 + h - 70, { size: 26, mono: true, color: C.gold, align: 'right', alpha: a * on, weight: 700 });
      const k = range(lt, sp('g5', 0.55), sp('g5', 0.55) + 0.7);
      chip(ctx, '1971', CX - 430, 740, { color: C.proton, size: 64, alpha: a * k, w: 260 });
      chip(ctx, '$  ⇄  gold', CX - 130, 740, { color: C.proton, size: 64, alpha: a * k, w: 420 });
      label(ctx, '✕', CX + 80, 740, { size: 100, color: C.proton, alpha: a * range(lt, sp('g5', 0.7), sp('g5', 0.7) + 0.4) * 0.9, weight: 700 });
      label(ctx, 'dollars no longer exchanged for gold', CX, 850, { size: 26, mono: true, color: C.dim, alpha: a * range(lt, sp('g5', 0.8), sp('g5', 0.8) + 0.6), weight: 500 });
      caption(ctx, 'g5', a, lt, CS.g5);
    },

    today(ctx, t) {
      const a = chapterAlpha(T, 'today', t), lt = t - T.today[0];
      chapterTag(ctx, '05', 'Gold today', a);
      const on = range(lt, 0.3, 0.9), s = sp('g6', 0.1);
      const r1 = easeOut(range(lt, s, s + 0.7)), r2 = easeOut(range(lt, sp('g6', 0.55), sp('g6', 0.55) + 0.7));
      chip(ctx, 'central banks', 300, 250, { color: C.electron, size: 40, alpha: a * r1, w: 420 });
      vault(ctx, 510, 480, 400, 260, a * r1, 4);
      label(ctx, 'reserves', 510, 650, { size: 30, mono: true, color: C.electron, alpha: a * r1, weight: 700 });
      chip(ctx, 'investors', 1200, 250, { color: C.gold, size: 40, alpha: a * r2, w: 420 });
      // gold price jumps when fear rises
      const x0 = 1130, y0 = 330, w = 560, h = 260, fear = easeInOut(range(lt, sp('g6', 0.7), sp('g6', 0.7) + 2));
      ctx.save(); ctx.globalAlpha = a * r2; ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke();
      ctx.strokeStyle = C.gold; ctx.lineWidth = 6; ctx.beginPath();
      const f = (x) => 0.25 + Math.sin(x * 9) * 0.03 + 0.5 * easeInOut(clamp((x - 0.5) / 0.4, 0, 1));
      for (let i = 0; i <= 60 * fear; i++) { const x = i / 60, px = x0 + x * w, py = y0 + h - f(x) * h; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke(); ctx.restore();
      label(ctx, 'gold price', x0 + w / 2, y0 + h + 40, { size: 26, mono: true, color: C.dim, alpha: a * r2, weight: 500 });
      label(ctx, 'fear of inflation or crisis → gold ▲', x0 + w / 2, 720, { size: 28, mono: true, color: C.gold, alpha: a * range(fear, 0.4, 0.9), weight: 700 });
      caption(ctx, 'g6', a, lt, CS.g6);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 3;
      bullion(ctx, CX, CY - 210, a * range(lt, 0.3, 1), 220, 100);
      label(ctx, 'Not money anymore', CX, CY - 40, { size: 90, weight: 700, color: C.text, alpha: a * range(lt, 0.5, 1.3) });
      label(ctx, 'but still trusted', CX, CY + 90, { size: 90, weight: 700, color: C.gold, alpha: a * range(lt, 0.5 + s * 0.45, 1.3 + s * 0.45) });
    },
  },
});
