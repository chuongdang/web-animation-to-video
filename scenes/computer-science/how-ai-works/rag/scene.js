import { C, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, token, measure, chip } from '/runtime/kit.js';

const { lerp, range, easeInOut, easeOut, fadeWindow, rng } = Scene;

const GREEN = '#7ee787';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- computer-science/rag`.
const TXT = {
  rg1: 'A model only knows what was in its [[training data]], which is frozen in time.',
  rg2: 'It cannot see your [[private documents]] or yesterday\'s news, so it may [[guess:proton]].',
  rg3: 'Documents are split into chunks; each becomes an [[embedding]]: a point on a [[map of meaning]].',
  rg4: 'Your question becomes a point too, and the [[nearest chunks]] are retrieved.',
  rg5: 'The retrieved chunks are pasted into the [[prompt]], next to your question.',
  rg6: 'Now the model answers from real [[sources]], and can even [[cite]] them.',
};
const nar = await narration('computer-science/how-ai-works/rag', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { problem: ['rg1', 'rg2'], search: ['rg3', 'rg4'], augment: ['rg5', 'rg6'] });
const { CS, T } = P;
const sp = speech(nar, CS);

const TOPICS = [
  { name: 'refunds', color: C.electron, cx: -300, cy: -60 },
  { name: 'shipping', color: C.gold, cx: 260, cy: -130 },
  { name: 'warranty', color: GREEN, cx: 300, cy: 150 },
  { name: 'careers', color: C.proton, cx: -320, cy: 190 },
];
const CHUNKS = [
  'Items can be returned within 30 days of delivery.',
  'Refunds go to the original payment method in 5–7 days.',
  'Sale items are final sale unless faulty.',
];
const QUESTION = 'How do I return an item?';
const ANSWER = ['You can return items within 30 days [1],', 'and the refund goes back to your', 'original payment method [2].'];

function makeState() {
  const rand = rng(8);
  const pts = [];
  TOPICS.forEach((tp, ti) => {
    for (let i = 0; i < 6; i++) pts.push({ ti, x: tp.cx + (rand() - 0.5) * 210, y: tp.cy + (rand() - 0.5) * 170, ph: rand() * 6.28 });
  });
  // the three chunks used in the answer: the first three refund points, moved close to the query
  const ref = pts.filter((p) => p.ti === 0);
  ref[0].x = -250; ref[0].y = -20; ref[1].x = -330; ref[1].y = -95; ref[2].x = -200; ref[2].y = -110;
  return { pts };
}

const MAPX = CX, MAPY = 480;
function box(ctx, x, y, w, h, color, a, fill = 0.05) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = `rgba(255,255,255,${fill})`; ctx.strokeStyle = color; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 22); ctx.fill(); ctx.stroke(); ctx.restore();
}
function llm(ctx, x, y, size, color, name, a, lt) {
  box(ctx, x - size / 2, y - size / 2, size, size, color, a, 0.04);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) glowDot(ctx, x - size * 0.3 + (i * size * 0.6) / 3, y - size * 0.3 + (j * size * 0.6) / 3, size * 0.03, color, a * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(lt * 3 + i + j))));
  label(ctx, name, x, y + size / 2 + 40, { size: 30, mono: true, color, alpha: a, weight: 600 });
}
function padlock(ctx, x, y, a, color) {
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y - 18, 22, Math.PI, 0); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(x - 34, y - 18, 68, 52, 10); ctx.fill(); ctx.restore();
}

mount({
  plan: P,
  init: makeState,
  draws: {
    title(ctx, t, S) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      S.pts.forEach((p) => glowDot(ctx, CX + p.x * 2 + Math.sin(t + p.ph) * 8, 540 + p.y * 2.4 + Math.cos(t * 0.8 + p.ph) * 8, 7, TOPICS[p.ti].color, a * 0.25 * range(t, 0.2, 1)));
      titleCard(ctx, t, T, { l1: 'How can AI use', l2: 'your own documents?', sub: 'retrieval-augmented generation (RAG)', size: 100 });
    },

    problem(ctx, t) {
      const a = chapterAlpha(T, 'problem', t), lt = t - T.problem[0];
      chapterTag(ctx, '01', 'The problem', a);
      const k = easeOut(range(lt, 0.3, 1.1));
      // training data (frozen)
      box(ctx, 150, 280, 460, 400, C.dim, a * k);
      label(ctx, 'training data', 380, 320, { size: 28, mono: true, color: C.text, alpha: a * k, weight: 600 });
      for (let i = 0; i < 12; i++) {
        ctx.save(); ctx.globalAlpha = a * k * 0.5; ctx.fillStyle = C.dim;
        ctx.beginPath(); ctx.roundRect(190 + (i % 4) * 100, 360 + Math.floor(i / 4) * 90, 70, 60, 8); ctx.fill(); ctx.restore();
      }
      label(ctx, 'frozen at a date', 380, 720, { size: 26, mono: true, color: C.electron, alpha: a * range(lt, sp('rg1', 0.5), sp('rg1', 0.5) + 0.7), weight: 600 });
      llm(ctx, 960, 480, 220, C.electron, 'language model', a * k, lt);
      ctx.save(); ctx.globalAlpha = a * k * 0.6; ctx.strokeStyle = C.electron; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(620, 480); ctx.lineTo(840, 480); ctx.stroke(); ctx.restore();

      // private documents behind a wall
      const p2 = range(lt, sp('rg2', 0.0), sp('rg2', 0.0) + 0.8);
      box(ctx, 1310, 280, 460, 400, C.gold, a * p2);
      label(ctx, 'your documents', 1540, 320, { size: 28, mono: true, color: C.gold, alpha: a * p2, weight: 600 });
      for (let i = 0; i < 6; i++) {
        ctx.save(); ctx.globalAlpha = a * p2 * 0.5; ctx.fillStyle = C.gold;
        ctx.beginPath(); ctx.roundRect(1350 + (i % 3) * 130, 370 + Math.floor(i / 3) * 110, 90, 70, 8); ctx.fill(); ctx.restore();
      }
      ctx.save(); ctx.globalAlpha = a * p2; ctx.strokeStyle = C.proton; ctx.lineWidth = 6; ctx.setLineDash([14, 12]);
      ctx.beginPath(); ctx.moveTo(1170, 260); ctx.lineTo(1170, 700); ctx.stroke(); ctx.restore();
      padlock(ctx, 1170, 480, a * p2, C.proton);
      label(ctx, 'model cannot see these', 1170, 745, { size: 26, mono: true, color: C.proton, alpha: a * p2, weight: 600 });
      const g = range(lt, sp('rg2', 0.6), sp('rg2', 0.6) + 0.8);
      token(ctx, 'refund policy? probably 14 days…', 960, 250, C.proton, a * g, 26);
      caption(ctx, 'rg1', a, lt, CS.rg1);
      caption(ctx, 'rg2', a, lt, CS.rg2);
    },

    search(ctx, t, S) {
      const a = chapterAlpha(T, 'search', t), lt = t - T.search[0];
      chapterTag(ctx, '02', 'Search by meaning', a);
      // documents -> chunks -> points on the map
      const dk = easeOut(range(lt, 0.3, 1.0)) * (1 - range(lt, sp('rg3', 0.35), sp('rg3', 0.35) + 0.6));
      if (dk > 0) {
        ['handbook.pdf', 'faq.md', 'policy.txt'].forEach((d, i) => {
          box(ctx, 200 + i * 240, 400, 200, 130, C.gold, a * dk);
          label(ctx, d, 300 + i * 240, 465, { size: 24, mono: true, color: C.gold, alpha: a * dk, weight: 600 });
        });
      }
      S.pts.forEach((p, i) => {
        const at = sp('rg3', 0.3) + (i / S.pts.length) * 1.8, k = easeOut(range(lt, at, at + 0.7));
        glowDot(ctx, MAPX + p.x + Math.sin(lt * 0.8 + p.ph) * 4, MAPY + p.y + Math.cos(lt * 0.7 + p.ph) * 4, 9 * k, TOPICS[p.ti].color, a * k * 0.9);
      });
      TOPICS.forEach((tp, i) => {
        label(ctx, tp.name, MAPX + tp.cx, MAPY + tp.cy - 125, { size: 26, mono: true, color: tp.color, alpha: a * range(lt, sp('rg3', 0.75) + i * 0.15, sp('rg3', 0.75) + i * 0.15 + 0.6), weight: 600 });
      });
      label(ctx, 'each dot = one chunk of text (an embedding)', CX, 195, { size: 26, mono: true, color: C.dim, alpha: a * range(lt, sp('rg3', 0.6), sp('rg3', 0.6) + 0.8), weight: 500 });

      // the query
      const qk = easeOut(range(lt, CS.rg4 + 0.2, CS.rg4 + 0.9));
      if (qk > 0) {
        const qx = MAPX - 250, qy = MAPY - 60;
        const rr = 150 * easeOut(range(lt, sp('rg4', 0.3), sp('rg4', 0.3) + 1.0));
        ctx.save(); ctx.globalAlpha = a * qk * 0.7; ctx.strokeStyle = C.text; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
        ctx.beginPath(); ctx.arc(qx, qy, rr, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        S.pts.filter((p) => p.ti === 0).slice(0, 3).forEach((p) => {
          const nk = range(lt, sp('rg4', 0.5), sp('rg4', 0.5) + 0.6);
          ctx.save(); ctx.globalAlpha = a * nk; ctx.strokeStyle = C.gold; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(MAPX + p.x, MAPY + p.y); ctx.stroke(); ctx.restore();
          glowDot(ctx, MAPX + p.x, MAPY + p.y, 14, C.gold, a * nk);
        });
        ctx.save(); ctx.globalAlpha = a * qk; ctx.fillStyle = C.text; ctx.translate(qx, qy); ctx.beginPath();
        for (let i = 0; i < 10; i++) { const r = i % 2 ? 9 : 22, ang = (i / 10) * Math.PI * 2 - Math.PI / 2; ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r); }
        ctx.closePath(); ctx.fill(); ctx.restore();
        label(ctx, `“${QUESTION}”`, qx, qy - 190, { size: 30, weight: 600, alpha: a * qk });
        CHUNKS.forEach((c, i) => {
          const ck = range(lt, sp('rg4', 0.65 + i * 0.1), sp('rg4', 0.65 + i * 0.1) + 0.6);
          label(ctx, `${i + 1}. ${c}`, 560, 800 + i * 42, { size: 24, mono: true, color: C.gold, alpha: a * ck, align: 'left', weight: 500 });
        });
      }
      caption(ctx, 'rg3', a, lt, CS.rg3);
      caption(ctx, 'rg4', a, lt, CS.rg4);
    },

    augment(ctx, t) {
      const a = chapterAlpha(T, 'augment', t), lt = t - T.augment[0];
      chapterTag(ctx, '03', 'Augment and generate', a);
      const k = easeOut(range(lt, 0.3, 1.1));
      // the assembled prompt
      box(ctx, 130, 240, 800, 500, C.electron, a * k);
      label(ctx, 'prompt', 170, 274, { size: 26, mono: true, color: C.electron, alpha: a * k, align: 'left', weight: 600 });
      label(ctx, 'Answer using only the context below.', 170, 330, { size: 26, mono: true, color: C.dim, alpha: a * k, align: 'left', weight: 500 });
      label(ctx, 'context:', 170, 390, { size: 26, mono: true, color: C.gold, alpha: a * k, align: 'left', weight: 600 });
      CHUNKS.forEach((c, i) => {
        const ck = easeOut(range(lt, sp('rg5', 0.2 + i * 0.2), sp('rg5', 0.2 + i * 0.2) + 0.8));
        ctx.save(); ctx.globalAlpha = a * ck; ctx.fillStyle = 'rgba(255,209,102,0.10)'; ctx.strokeStyle = C.gold; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.roundRect(170 + (1 - ck) * 60, 415 + i * 78, 720, 62, 12); ctx.fill(); ctx.stroke(); ctx.restore();
        label(ctx, `[${i + 1}] ${c}`, 188 + (1 - ck) * 60, 446 + i * 78, { size: 20, mono: true, alpha: a * ck, align: 'left', weight: 500 });
      });
      const qk = range(lt, sp('rg5', 0.75), sp('rg5', 0.75) + 0.6);
      label(ctx, `question: ${QUESTION}`, 170, 685, { size: 26, mono: true, color: C.text, alpha: a * qk, align: 'left', weight: 600 });

      // model and cited answer
      const mk = range(lt, CS.rg6, CS.rg6 + 0.7);
      ctx.save(); ctx.globalAlpha = a * mk * 0.7; ctx.strokeStyle = C.electron; ctx.fillStyle = C.electron; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(950, 490); ctx.lineTo(1040, 490); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(1064, 490); ctx.lineTo(1038, 476); ctx.lineTo(1038, 504); ctx.closePath(); ctx.fill(); ctx.restore();
      llm(ctx, 1150, 490, 150, C.electron, 'model', a * mk, lt);
      const ak = range(lt, sp('rg6', 0.2), sp('rg6', 0.2) + 0.6);
      box(ctx, 1290, 360, 520, 240, GREEN, a * ak);
      label(ctx, 'grounded answer', 1320, 392, { size: 22, mono: true, color: GREEN, alpha: a * ak, align: 'left', weight: 600 });
      const shown = easeInOut(range(lt, sp('rg6', 0.25), sp('rg6', 0.25) + 2.2));
      let remain = Math.floor(shown * ANSWER.join('').length);
      ANSWER.forEach((ln, i) => {
        label(ctx, ln.slice(0, Math.max(0, remain)), 1320, 440 + i * 46, { size: 27, weight: 500, alpha: a * ak, align: 'left' });
        remain -= ln.length;
      });
      const cite = range(lt, sp('rg6', 0.7), sp('rg6', 0.7) + 0.7);
      label(ctx, 'sources: [1] [2]', 1550, 640, { size: 28, mono: true, color: C.gold, alpha: a * cite, weight: 600 });
      caption(ctx, 'rg5', a, lt, CS.rg5);
      caption(ctx, 'rg6', a, lt, CS.rg6);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 8;
      const steps = [
        { text: 'retrieve', sub: 'find the relevant chunks', color: C.gold, at: 0.6 },
        { text: 'augment', sub: 'add them to the prompt', color: C.electron, at: 0.6 + s * 0.25 },
        { text: 'generate', sub: 'answer from the sources', color: GREEN, at: 0.6 + s * 0.45 },
      ];
      const gap = 150, size = 54;
      const widths = steps.map((st) => Math.max(measure(ctx, st.text, size, 700) + 60, 380));
      let x = CX - (widths.reduce((n, w) => n + w, 0) + gap * 2) / 2;
      steps.forEach((st, i) => {
        const k = easeOut(range(lt, st.at, st.at + 0.8));
        chip(ctx, st.text, x, CY - 50, { color: st.color, size, alpha: a * k, w: widths[i], weight: 700 });
        label(ctx, st.sub, x + widths[i] / 2, CY + 40, { size: 26, mono: true, color: st.color, alpha: a * k, weight: 500 });
        if (i < 2) label(ctx, '→', x + widths[i] + gap / 2, CY - 50, { size: 56, color: C.dim, alpha: a * range(lt, steps[i + 1].at, steps[i + 1].at + 0.6), weight: 500 });
        x += widths[i] + gap;
      });
      label(ctx, 'an open book for the model', CX, CY + 190, { size: 60, weight: 700, alpha: a * range(lt, 0.6 + s * 0.7, 0.6 + s * 0.7 + 0.8) });
    },
  },
});
