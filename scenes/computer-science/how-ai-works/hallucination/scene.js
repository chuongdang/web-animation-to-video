import { C, CX, CY, LEAD, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, measure, chip, bar } from '/runtime/kit.js';

const { clamp, lerp, range, easeInOut, easeOut, fadeWindow, rng } = Scene;

const GREEN = '#7ee787';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- computer-science/hallucination`.
const TXT = {
  h1: 'A language model predicts what text is [[likely]], not what is [[true]].',
  h2: 'When it lacks the facts, it still writes a fluent, confident guess: a [[hallucination:proton]].',
  h3: 'Rare or missing facts leave [[gaps]] in what it learned, and it fills them with [[patterns]].',
  h4: 'Each word it writes becomes [[context]] for the next, so a small error can [[snowball:proton]].',
  h5: 'Grounding answers in [[sources]], as in retrieval, gives the model real facts to draw on.',
  h6: 'And always [[verify]] important claims: names, numbers and quotes.',
};
const nar = await narration('computer-science/how-ai-works/hallucination', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { guess: ['h1', 'h2'], why: ['h3', 'h4'], fix: ['h5', 'h6'] });
const { CS, T } = P;
const sp = speech(nar, CS);

const QUESTION = 'Who wrote the novel “The Silent Orchard”?';
const CANDS = [['Sarah Mitchell', 22], ['James Turner', 18], ['Emma Clarke', 15], ['David Hughes', 12], ['I don\'t know', 3]];
const CHAIN = [
  ['“The Silent Orchard” was written by ', C.text],
  ['Sarah Mitchell', C.proton],
  [', who grew up in ', '#ff9c8a'],
  ['Vermont', '#ff9c8a'],
  [' and published it in ', '#ffb49f'],
  ['1998', '#ffb49f'],
  [', winning the ', '#ffc8b5'],
  ['Hartley Prize.', '#ffc8b5'],
];

function makeState() {
  const rand = rng(13);
  const pts = Array.from({ length: 70 }, () => {
    let x, y;
    do { x = (rand() - 0.5) * 1100; y = (rand() - 0.5) * 380; } while (Math.hypot(x - 90, y + 10) < 150);
    return { x, y, ph: rand() * 6.28 };
  });
  return { pts };
}

mount({
  plan: P,
  init: makeState,
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      const txt = 'The capital of France is Paris. The capital of Atlantis is';
      label(ctx, txt.slice(0, Math.floor(txt.length * easeInOut(range(t, 0.2, 2.6)))), CX, 230, { size: 38, mono: true, weight: 500, color: C.dim, alpha: a * 0.55 });
      titleCard(ctx, t, T, { l1: 'Why does AI', l2: 'make things up?', sub: 'hallucinations explained', tint: C.proton, size: 110 });
    },

    guess(ctx, t) {
      const a = chapterAlpha(T, 'guess', t), lt = t - T.guess[0];
      chapterTag(ctx, '01', 'Likely, not true', a);
      const k = easeOut(range(lt, 0.3, 1.0));
      chip(ctx, QUESTION, CX - measure(ctx, QUESTION, 40, 500) / 2 - 18, 260, { color: C.dim, size: 40, alpha: a * k });
      label(ctx, '(a book that does not exist)', CX, 320, { size: 24, mono: true, color: C.proton, alpha: a * range(lt, 1.0, 1.8), weight: 500 });

      // the model's next-word probabilities: flat = it is unsure
      label(ctx, "the model's own probabilities", 760, 400, { size: 24, mono: true, color: C.dim, alpha: a * range(lt, 1.4, 2), weight: 500 });
      CANDS.forEach(([name, pct], i) => {
        const gk = easeOut(range(lt, 1.6 + i * 0.15, 2.3 + i * 0.15));
        bar(ctx, { x: 760, y: 460 + i * 62, w: pct * 9 * gk, h: 40, color: i === 4 ? GREEN : C.electron, alpha: a * gk, name, value: `${Math.round(pct * gk)}%`, nameSize: 30, glow: 0 });
      });
      label(ctx, 'top choice only 22%: unsure', 1330, 520, { size: 26, mono: true, color: C.gold, alpha: a * range(lt, sp('h1', 0.7), sp('h1', 0.7) + 0.7), align: 'left', weight: 600 });

      // h2: but the text sounds sure
      const ak = easeOut(range(lt, sp('h2', 0.05), sp('h2', 0.05) + 0.8));
      if (ak > 0) {
        ctx.save(); ctx.globalAlpha = a * ak; ctx.fillStyle = 'rgba(255,107,107,0.08)'; ctx.strokeStyle = C.proton; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.roundRect(360, 790, 1200, 90, 20); ctx.fill(); ctx.stroke(); ctx.restore();
        const ans = '“The Silent Orchard” was written by Sarah Mitchell.';
        label(ctx, ans.slice(0, Math.floor(ans.length * easeInOut(range(lt, sp('h2', 0.15), sp('h2', 0.15) + 1.8)))), 400, 835, { size: 38, weight: 500, alpha: a * ak, align: 'left' });
        label(ctx, 'but it sounds 100% sure', 1560, 770, { size: 26, mono: true, color: C.proton, alpha: a * range(lt, sp('h2', 0.65), sp('h2', 0.65) + 0.7), align: 'right', weight: 700 });
      }
      caption(ctx, 'h1', a, lt, CS.h1);
      caption(ctx, 'h2', a, lt, CS.h2);
    },

    why(ctx, t, S) {
      const a = chapterAlpha(T, 'why', t), lt = t - T.why[0];
      chapterTag(ctx, '02', 'Why it happens', a);
      const p1 = a * (1 - range(lt, CS.h4 - 0.3, CS.h4 + 0.3)), p2 = a * range(lt, CS.h4, CS.h4 + 0.6);

      if (p1 > 0) {
        const ox = CX, oy = 520;
        S.pts.forEach((p, i) => {
          const k = easeOut(range(lt, 0.3 + (i / S.pts.length) * 1.2, 0.9 + (i / S.pts.length) * 1.2));
          glowDot(ctx, ox + p.x, oy + p.y, 7 * k, C.electron, p1 * k * 0.8);
        });
        const gk = range(lt, sp('h3', 0.15), sp('h3', 0.15) + 0.8);
        ctx.save(); ctx.globalAlpha = p1 * gk; ctx.strokeStyle = C.proton; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
        ctx.beginPath(); ctx.arc(ox + 90, oy - 10, 150, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        label(ctx, 'a gap: little or no training data', ox + 90, oy + 200, { size: 26, mono: true, color: C.proton, alpha: p1 * gk, weight: 600 });
        const qk = range(lt, sp('h3', 0.45), sp('h3', 0.45) + 0.7);
        glowDot(ctx, ox + 90, oy - 10, 14, C.gold, p1 * qk);
        label(ctx, 'your question', ox + 90, oy - 44, { size: 24, mono: true, color: C.gold, alpha: p1 * qk, weight: 600 });
        // filled from the nearest known patterns
        const fk = range(lt, sp('h3', 0.7), sp('h3', 0.7) + 0.8);
        S.pts.filter((p) => Math.hypot(p.x - 90, p.y + 10) < 260).slice(0, 5).forEach((p) => {
          ctx.save(); ctx.globalAlpha = p1 * fk * 0.7; ctx.strokeStyle = C.gold; ctx.lineWidth = 2.5; ctx.setLineDash([6, 6]);
          ctx.beginPath(); ctx.moveTo(ox + 90, oy - 10); ctx.lineTo(ox + p.x, oy + p.y); ctx.stroke(); ctx.restore();
        });
        label(ctx, 'fills the gap with similar-looking patterns', ox + 90, oy - 220, { size: 26, mono: true, color: C.gold, alpha: p1 * fk, weight: 600 });
      }

      if (p2 > 0) {
        // the chain of words: one wrong token colours everything after it
        let x = 180, y = 380;
        const s = spoken('h4') ?? 5;
        CHAIN.forEach(([txt, col], i) => {
          const at = CS.h4 + LEAD + (s * i) / (CHAIN.length + 1), k = range(lt, at, at + 0.5);
          if (k <= 0) return;
          const w = measure(ctx, txt, 44, i === 1 ? 700 : 500);
          if (x + w > 1740) { x = 180; y += 90; }
          label(ctx, txt, x, y, { size: 44, weight: i === 1 ? 700 : 500, color: col, alpha: p2 * k, align: 'left' });
          if (i === 1) label(ctx, 'first wrong word', x + w / 2, y - 62, { size: 24, mono: true, color: C.proton, alpha: p2 * k, weight: 600 });
          x += w;
        });
        label(ctx, 'invented details follow, built on the mistake', CX, 640, { size: 28, mono: true, color: '#ffb49f', alpha: p2 * range(lt, sp('h4', 0.75), sp('h4', 0.75) + 0.8), weight: 600 });
      }
      caption(ctx, 'h3', a, lt, CS.h3);
      caption(ctx, 'h4', a, lt, CS.h4);
    },

    fix(ctx, t) {
      const a = chapterAlpha(T, 'fix', t), lt = t - T.fix[0];
      chapterTag(ctx, '03', 'What helps', a);
      const items = [
        { text: 'ground answers in sources', sub: 'retrieval gives real facts to quote', color: C.gold, at: sp('h5', 0.25) },
        { text: 'allow “I don’t know”', sub: 'train and prompt it to admit gaps', color: C.electron, at: sp('h5', 0.65) },
        { text: 'ask for citations', sub: 'then check that they exist', color: GREEN, at: sp('h6', 0.05) },
        { text: 'verify what matters', sub: 'names · numbers · quotes · code', color: C.proton, at: sp('h6', 0.45) },
      ];
      items.forEach((it, i) => {
        const y = 320 + i * 130, k = easeOut(range(lt, it.at, it.at + 0.8));
        ctx.save(); ctx.globalAlpha = a * k; ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.strokeStyle = it.color; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.roundRect(300 + (1 - k) * 60, y - 50, 1320, 100, 20); ctx.fill(); ctx.stroke(); ctx.restore();
        ctx.save(); ctx.globalAlpha = a * k; ctx.strokeStyle = it.color; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(350 + (1 - k) * 60, y); ctx.lineTo(372 + (1 - k) * 60, y + 24); ctx.lineTo(414 + (1 - k) * 60, y - 22); ctx.stroke(); ctx.restore();
        label(ctx, it.text, 460 + (1 - k) * 60, y - 12, { size: 40, weight: 700, alpha: a * k, align: 'left' });
        label(ctx, it.sub, 460 + (1 - k) * 60, y + 26, { size: 24, mono: true, color: it.color, alpha: a * k, align: 'left', weight: 500 });
      });
      caption(ctx, 'h5', a, lt, CS.h5);
      caption(ctx, 'h6', a, lt, CS.h6);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 4;
      label(ctx, 'Fluent is not the same as factual.', CX, CY - 60, { size: 88, weight: 700, alpha: a * range(lt, 0.5, 1.3) });
      label(ctx, 'Trust, but verify.', CX, CY + 80, { size: 88, weight: 700, color: C.gold, alpha: a * range(lt, 0.5 + s * 0.6, 1.3 + s * 0.6) });
    },
  },
});
