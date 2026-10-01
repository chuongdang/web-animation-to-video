import { C, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, token, chip, measure, bar } from '/runtime/kit.js';

const { clamp, lerp, range, easeInOut, easeOut, fadeWindow, rng } = Scene;

const GREEN = '#7ee787', A_COL = C.electron, B_COL = C.gold;

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- computer-science/bias`.
const TXT = {
  b1: 'A model learns the [[patterns]] in its training data, including ones we would rather not repeat.',
  b2: 'If the data is [[skewed:proton]], the predictions will be skewed too.',
  b3: 'Bias enters through [[unrepresentative samples]], biased [[labels]] and [[proxies]] like postcode.',
  b4: 'Removing a sensitive column is not enough: other features can [[stand in:proton]] for it.',
  b5: 'Test results [[by group]], not just on average, to find where the model fails.',
  b6: 'Then [[balance the data]], review the labels, and keep [[humans accountable]].',
};
const nar = await narration('computer-science/how-ai-works/bias', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { data: ['b1', 'b2'], source: ['b3', 'b4'], audit: ['b5', 'b6'] });
const { CS, T } = P;
const sp = speech(nar, CS);

function makeState() {
  const rand = rng(5);
  // 100 training examples: 90 group A (circles), 10 group B (squares); outcome = approved?
  const ex = Array.from({ length: 100 }, (_, i) => {
    const group = i < 90 ? 'A' : 'B';
    const approved = group === 'A' ? rand() < 0.8 : rand() < 0.4;
    return { group, approved };
  });
  // shuffle deterministically
  for (let i = ex.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [ex[i], ex[j]] = [ex[j], ex[i]]; }
  return { ex };
}

mount({
  plan: P,
  init: makeState,
  draws: {
    title(ctx, t, S) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      S.ex.forEach((e, i) => {
        const x = 200 + (i % 25) * 60, y = 120 + Math.floor(i / 25) * 60;
        ctx.save(); ctx.globalAlpha = a * 0.14 * range(t, 0.1 + i * 0.01, 0.6 + i * 0.01); ctx.fillStyle = e.group === 'A' ? A_COL : B_COL;
        ctx.beginPath(); if (e.group === 'A') ctx.arc(x, y, 14, 0, Math.PI * 2); else ctx.rect(x - 13, y - 13, 26, 26); ctx.fill(); ctx.restore();
      });
      titleCard(ctx, t, T, { l1: 'Can AI', l2: 'be biased?', sub: 'where bias comes from, and what helps', tint: C.proton, size: 118 });
    },

    data(ctx, t, S) {
      const a = chapterAlpha(T, 'data', t), lt = t - T.data[0];
      chapterTag(ctx, '01', 'Learning from skewed data', a);
      // 10x10 grid of training examples
      label(ctx, '100 training examples', 460, 240, { size: 28, mono: true, color: C.dim, alpha: a * range(lt, 0.3, 1), weight: 600 });
      S.ex.forEach((e, i) => {
        const x = 260 + (i % 10) * 52, y = 300 + Math.floor(i / 10) * 52, k = easeOut(range(lt, 0.4 + i * 0.012, 0.9 + i * 0.012));
        ctx.save(); ctx.globalAlpha = a * k; ctx.fillStyle = e.group === 'A' ? A_COL : B_COL;
        ctx.beginPath(); if (e.group === 'A') ctx.arc(x, y, 16 * k, 0, Math.PI * 2); else ctx.rect(x - 15 * k, y - 15 * k, 30 * k, 30 * k); ctx.fill(); ctx.restore();
      });
      const lk = range(lt, sp('b1', 0.3), sp('b1', 0.3) + 0.8);
      label(ctx, '90% group A ●', 460, 850, { size: 26, mono: true, color: A_COL, alpha: a * lk, weight: 600 });
      label(ctx, '10% group B ■', 460, 890, { size: 26, mono: true, color: B_COL, alpha: a * lk, weight: 600 });

      // historical outcomes then model predictions
      const x0 = 1180;
      label(ctx, 'approved in the past data', x0 + 200, 270, { size: 28, mono: true, color: C.dim, alpha: a * range(lt, sp('b1', 0.5), sp('b1', 0.5) + 0.8), weight: 600 });
      [['A', 80, A_COL, 340], ['B', 40, B_COL, 420]].forEach(([g, v, col, y]) => {
        const k = easeOut(range(lt, sp('b1', 0.6), sp('b1', 0.6) + 1.0));
        bar(ctx, { x: x0, y, w: v * 5 * k, h: 44, color: col, alpha: a * range(lt, sp('b1', 0.5), sp('b1', 0.5) + 0.6), name: `group ${g}`, value: `${Math.round(v * k)}%`, nameSize: 28 });
      });
      label(ctx, 'for equally qualified people', x0 + 200, 480, { size: 22, mono: true, color: C.dim, alpha: a * range(lt, sp('b1', 0.7), sp('b1', 0.7) + 0.8), weight: 500 });

      const mk = range(lt, sp('b2', 0.1), sp('b2', 0.1) + 0.8);
      if (mk > 0) {
        ctx.save(); ctx.globalAlpha = a * mk; ctx.strokeStyle = C.proton; ctx.fillStyle = C.proton; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(x0 + 200, 520); ctx.lineTo(x0 + 200, 590); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x0 + 200, 610); ctx.lineTo(x0 + 186, 584); ctx.lineTo(x0 + 214, 584); ctx.closePath(); ctx.fill(); ctx.restore();
        label(ctx, 'model learns the pattern', x0 + 260, 555, { size: 22, mono: true, color: C.proton, alpha: a * mk, align: 'left', weight: 600 });
        label(ctx, 'model predictions', x0 + 200, 645, { size: 28, mono: true, color: C.dim, alpha: a * mk, weight: 600 });
        [['A', 80, A_COL, 710], ['B', 40, B_COL, 790]].forEach(([g, v, col, y]) => {
          const k = easeOut(range(lt, sp('b2', 0.3), sp('b2', 0.3) + 1.0));
          bar(ctx, { x: x0, y, w: v * 5 * k, h: 44, color: col, alpha: a * mk, name: `group ${g}`, value: `${Math.round(v * k)}%`, nameSize: 28, glow: g === 'B' ? 16 : 0 });
        });
      }
      caption(ctx, 'b1', a, lt, CS.b1);
      caption(ctx, 'b2', a, lt, CS.b2);
    },

    source(ctx, t) {
      const a = chapterAlpha(T, 'source', t), lt = t - T.source[0];
      chapterTag(ctx, '02', 'Where bias comes from', a);
      const p1 = a * (1 - range(lt, CS.b4 - 0.3, CS.b4 + 0.3)), p2 = a * range(lt, CS.b4, CS.b4 + 0.6);
      if (p1 > 0) {
        const cards = [
          { title: 'unrepresentative samples', sub: 'some groups barely appear', color: A_COL, at: sp('b3', 0.3) },
          { title: 'biased labels', sub: 'past human decisions were unfair', color: C.gold, at: sp('b3', 0.55) },
          { title: 'proxies', sub: 'postcode can stand in for group', color: C.proton, at: sp('b3', 0.8) },
        ];
        cards.forEach((c, i) => {
          const x = 140 + i * 590, k = easeOut(range(lt, c.at, c.at + 0.8));
          ctx.save(); ctx.globalAlpha = p1 * k; ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.strokeStyle = c.color; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.roundRect(x, 300 + (1 - k) * 30, 540, 420, 26); ctx.fill(); ctx.stroke(); ctx.restore();
          label(ctx, c.title, x + 270, 350 + (1 - k) * 30, { size: 34, weight: 700, alpha: p1 * k });
          label(ctx, c.sub, x + 270, 395 + (1 - k) * 30, { size: 22, mono: true, color: c.color, alpha: p1 * k, weight: 500 });
          // little illustrations
          const cx = x + 270, cy = 560 + (1 - k) * 30;
          if (i === 0) for (let j = 0; j < 12; j++) { ctx.save(); ctx.globalAlpha = p1 * k; ctx.fillStyle = j < 11 ? A_COL : B_COL; ctx.beginPath(); if (j < 11) ctx.arc(cx - 150 + (j % 6) * 60, cy - 30 + Math.floor(j / 6) * 60, 18, 0, Math.PI * 2); else ctx.rect(cx + 120 - 16, cy + 30 - 16, 32, 32); ctx.fill(); ctx.restore(); }
          if (i === 1) { ['approved', 'denied'].forEach((w, j) => { chip(ctx, w, cx - 150 + j * 170, cy - 30, { color: j ? C.proton : GREEN, size: 28, alpha: p1 * k, w: 150 }); }); label(ctx, 'label = someone\'s past choice', cx, cy + 50, { size: 20, mono: true, color: C.dim, alpha: p1 * k, weight: 500 }); }
          if (i === 2) { chip(ctx, 'postcode', cx - 220, cy - 10, { color: C.proton, size: 28, alpha: p1 * k, w: 170 }); ctx.save(); ctx.globalAlpha = p1 * k; ctx.strokeStyle = C.dim; ctx.setLineDash([8, 8]); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 40, cy - 10); ctx.lineTo(cx + 40, cy - 10); ctx.stroke(); ctx.restore(); chip(ctx, 'group', cx + 50, cy - 10, { color: B_COL, size: 28, alpha: p1 * k, w: 150 }); }
        });
      }
      if (p2 > 0) {
        // proxies survive deleting the sensitive column
        const cols = [['group', B_COL, 'removed'], ['postcode', C.proton, 'kept'], ['income', C.dim, 'kept'], ['age', C.dim, 'kept']];
        cols.forEach(([name, col, state], i) => {
          const x = 300 + i * 340, k = easeOut(range(lt, 0.3 + i * 0.15, 0.9 + i * 0.15));
          const dead = i === 0 ? range(lt, sp('b4', 0.15), sp('b4', 0.15) + 0.7) : 0;
          chip(ctx, name, x, 360, { color: col, size: 40, alpha: p2 * k * (1 - dead * 0.7), w: 260, weight: 700 });
          if (dead > 0) { ctx.save(); ctx.globalAlpha = p2 * dead; ctx.strokeStyle = C.proton; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - 10, 390); ctx.lineTo(x + 270, 330); ctx.stroke(); ctx.restore(); }
          label(ctx, state, x + 130, 440, { size: 22, mono: true, color: i === 0 ? C.proton : C.dim, alpha: p2 * k, weight: 600 });
        });
        const lk = range(lt, sp('b4', 0.5), sp('b4', 0.5) + 0.8);
        ctx.save(); ctx.globalAlpha = p2 * lk; ctx.strokeStyle = C.proton; ctx.lineWidth = 5; ctx.setLineDash([12, 10]);
        ctx.beginPath(); ctx.moveTo(760, 330); ctx.bezierCurveTo(760, 200, 500, 200, 430, 320); ctx.stroke(); ctx.restore();
        label(ctx, 'postcode still reveals group', 600, 210, { size: 28, mono: true, color: C.proton, alpha: p2 * lk, weight: 700 });
        label(ctx, 'the model can rebuild the same bias from proxies', CX, 620, { size: 32, mono: true, color: C.gold, alpha: p2 * range(lt, sp('b4', 0.75), sp('b4', 0.75) + 0.8), weight: 600 });
      }
      caption(ctx, 'b3', a, lt, CS.b3);
      caption(ctx, 'b4', a, lt, CS.b4);
    },

    audit(ctx, t) {
      const a = chapterAlpha(T, 'audit', t), lt = t - T.audit[0];
      chapterTag(ctx, '03', 'Auditing and fixing', a);
      const rows = [['overall', 91, 91, C.text], ['group A', 95, 92, A_COL], ['group B', 78, 90, B_COL]];
      const fix = easeInOut(range(lt, sp('b6', 0.15), sp('b6', 0.15) + 2));
      label(ctx, 'accuracy', 600, 250, { size: 26, mono: true, color: C.dim, alpha: a * range(lt, 0.4, 1), weight: 600 });
      label(ctx, fix > 0.5 ? 'after fixes' : 'before fixes', 1250, 250, { size: 26, mono: true, color: fix > 0.5 ? GREEN : C.proton, alpha: a * range(lt, 0.4, 1), weight: 700 });
      rows.forEach(([name, before, after, col], i) => {
        const y = 340 + i * 110, at = i === 0 ? 0.8 : sp('b5', 0.35 + i * 0.25), k = easeOut(range(lt, at, at + 0.9));
        const v = lerp(before, after, fix);
        bar(ctx, { x: 620, y, w: v * 7.5 * k, h: 56, color: col, alpha: a * range(lt, at, at + 0.4), name, value: `${Math.round(v * k)}%`, nameSize: 32, glow: name === 'group B' && fix < 0.5 ? 20 : 0 });
      });
      const gap = range(lt, sp('b5', 0.75), sp('b5', 0.75) + 0.8) * (1 - fix);
      label(ctx, '← the average hides a 17-point gap', 620 + 78 * 7.5 + 180, 560, { size: 24, mono: true, color: C.proton, alpha: a * gap, align: 'left', weight: 700 });
      ['balance the data', 'review the labels', 'human accountability'].forEach((f, i) => {
        const k = easeOut(range(lt, sp('b6', 0.3 + i * 0.22), sp('b6', 0.3 + i * 0.22) + 0.7));
        chip(ctx, f, 300 + i * 500, 720, { color: GREEN, size: 34, alpha: a * k, w: 440 });
      });
      caption(ctx, 'b5', a, lt, CS.b5);
      caption(ctx, 'b6', a, lt, CS.b6);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 3;
      label(ctx, 'Data in, bias out,', CX, CY - 40, { size: 100, weight: 700, alpha: a * range(lt, 0.4, 1.2) });
      label(ctx, 'unless we look.', CX, CY + 90, { size: 100, weight: 700, color: C.gold, alpha: a * range(lt, 0.4 + s * 0.5, 1.2 + s * 0.5) });
    },
  },
});
