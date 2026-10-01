import { C, W, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, token, measure, chip } from '/runtime/kit.js';

const { clamp, lerp, range, easeInOut, easeOut, fadeWindow } = Scene;

const GREEN = '#7ee787';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- computer-science/temperature`.
const TXT = {
  sm1: 'The model scores every possible next word, then turns the scores into [[probabilities]].',
  sm2: 'Then it [[samples]]: a random draw, weighted by those probabilities.',
  tp1: '[[Temperature]] reshapes them. A [[low temperature:electron]] sharpens: the top word almost always wins.',
  tp2: 'A [[high temperature:proton]] flattens them, so unlikely words get a real chance.',
  ef1: 'At low temperature, the same prompt gives nearly [[identical]] answers.',
  ef2: 'At high temperature they vary: more [[creative]], but also more likely to [[wander off:proton]].',
};
const nar = await narration('computer-science/how-ai-works/temperature', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { sample: ['sm1', 'sm2'], temp: ['tp1', 'tp2'], effect: ['ef1', 'ef2'] });
const { CS, T } = P;
const sp = speech(nar, CS);

const WORDS = [
  { w: 'blue', s: 4.0, c: C.electron },
  { w: 'clear', s: 3.0, c: GREEN },
  { w: 'cloudy', s: 2.6, c: C.gold },
  { w: 'gray', s: 2.2, c: '#b48cff' },
  { w: 'falling', s: 0.5, c: C.proton },
  { w: 'green', s: -0.5, c: C.copper },
];
const softmax = (temp) => {
  const e = WORDS.map((x) => Math.exp(x.s / temp));
  const z = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / z);
};

function bars(ctx, probs, a, { x = 700, y0 = 380, scale = 6.4, showP = true, grow = 1, scoreMix = 0 }) {
  WORDS.forEach((wd, i) => {
    const y = y0 + i * 78;
    const pl = probs[i] * 100 * scale * grow;
    const sl = (wd.s + 1.5) * 70; // raw-score length
    const w = lerp(sl, pl, scoreMix ? 1 - scoreMix : 1) ;
    label(ctx, wd.w, x - 24, y, { size: 36, mono: true, weight: 500, alpha: a, align: 'right' });
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = wd.c;
    ctx.beginPath(); ctx.roundRect(x, y - 24, Math.max(4, w), 48, 8); ctx.fill(); ctx.restore();
    const txt = scoreMix > 0.5 ? `score ${wd.s.toFixed(1)}` : `${(probs[i] * 100).toFixed(probs[i] < 0.1 ? 1 : 0)}%`;
    if (showP) label(ctx, txt, x + Math.max(4, w) + 18, y, { size: 30, mono: true, weight: 600, alpha: a, align: 'left', color: scoreMix > 0.5 ? C.gold : C.text });
  });
}

function slider(ctx, temp, a, y = 250) {
  const x0 = 560, x1 = 1360, k = clamp((temp - 0.2) / 2.3, 0, 1);
  ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round';
  const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, C.electron); g.addColorStop(1, C.proton);
  ctx.strokeStyle = g; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.restore();
  glowDot(ctx, x0 + k * (x1 - x0), y, 22, C.text, a);
  label(ctx, `T = ${temp.toFixed(2)}`, x0 + k * (x1 - x0), y - 58, { size: 44, mono: true, weight: 700, alpha: a, color: C.gold });
  label(ctx, 'focused', x0 - 30, y, { size: 26, mono: true, color: C.electron, alpha: a, align: 'right', weight: 600 });
  label(ctx, 'random', x1 + 30, y, { size: 26, mono: true, color: C.proton, alpha: a, align: 'left', weight: 600 });
}

const tempAt = (lt) => {
  const a = easeInOut(range(lt, sp('tp1', 0.15), sp('tp1', 0.65)));
  const b = easeInOut(range(lt, sp('tp2', 0.1), sp('tp2', 0.85)));
  return lt < CS.tp2 ? lerp(1.0, 0.25, a) : lerp(0.25, 2.2, b);
};

const DRAWS = [0.3, 0.62, 0.2, 0.8];

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      const probs = softmax(0.4 + 1.8 * (0.5 + 0.5 * Math.sin(t * 1.3)));
      bars(ctx, probs, a * 0.1 * range(t, 0.2, 1), { x: 1540, y0: 200, scale: 3.4, showP: false });
      titleCard(ctx, t, T, { l1: 'What does', l2: 'temperature do?', sub: 'sampling in language models', size: 108 });
    },

    sample(ctx, t) {
      const a = chapterAlpha(T, 'sample', t), lt = t - T.sample[0];
      chapterTag(ctx, '01', 'Scores to probabilities', a);
      const probs = softmax(1);
      const conv = easeInOut(range(lt, sp('sm1', 0.5), sp('sm1', 0.5) + 1.6)); // scores -> probabilities
      label(ctx, 'The sky is …', 700, 250, { size: 64, weight: 600, alpha: a, align: 'left' });
      bars(ctx, probs, a * easeOut(range(lt, 0.5, 1.3)), { x: 780, y0: 350, scoreMix: 1 - conv, grow: 1 });
      label(ctx, 'softmax', 1450, 480, { size: 34, mono: true, weight: 600, color: C.gold, alpha: a * range(conv, 0.05, 0.4) * (1 - range(lt, CS.sm2 - 0.3, CS.sm2)), align: 'left' });

      // sampling: a strip of the same probabilities and a random pointer
      const sk = range(lt, CS.sm2, CS.sm2 + 0.7);
      if (sk > 0) {
        const x0 = 560, w = 800, y = 850;
        let x = x0;
        WORDS.forEach((wd, i) => {
          const sw = probs[i] * w;
          ctx.save(); ctx.globalAlpha = a * sk; ctx.fillStyle = wd.c; ctx.beginPath(); ctx.roundRect(x, y - 30, Math.max(3, sw - 3), 60, 8); ctx.fill(); ctx.restore();
          if (sw > 70) label(ctx, wd.w, x + sw / 2, y, { size: 24, mono: true, color: C.bg, alpha: a * sk, weight: 700 });
          x += sw;
        });
        DRAWS.forEach((d, i) => {
          const at = sp('sm2', 0.15 + i * 0.22), k = range(lt, at, at + 0.45);
          if (k <= 0) return;
          const last = i === DRAWS.length - 1 || lt < sp('sm2', 0.15 + (i + 1) * 0.22);
          const px = x0 + d * w;
          if (last) {
            ctx.save(); ctx.globalAlpha = a * sk; ctx.fillStyle = C.text;
            ctx.beginPath(); ctx.moveTo(px, y - 40); ctx.lineTo(px - 14, y - 74); ctx.lineTo(px + 14, y - 74); ctx.closePath(); ctx.fill(); ctx.restore();
          }
          let acc = 0, pick = 0;
          for (let j = 0; j < probs.length; j++) { acc += probs[j]; if (d <= acc) { pick = j; break; } }
          token(ctx, WORDS[pick].w, 1520 + (i % 2) * 150, 560 + Math.floor(i / 2) * 70, WORDS[pick].c, a * k, 26);
        });
        label(ctx, 'random draws:', 1520, 500, { size: 26, mono: true, color: C.dim, alpha: a * sk, align: 'left', weight: 500 });
      }
      caption(ctx, 'sm1', a, lt, CS.sm1);
      caption(ctx, 'sm2', a, lt, CS.sm2);
    },

    temp(ctx, t) {
      const a = chapterAlpha(T, 'temp', t), lt = t - T.temp[0];
      chapterTag(ctx, '02', 'Temperature', a);
      const temp = tempAt(lt);
      slider(ctx, temp, a * easeOut(range(lt, 0.3, 1)));
      const probs = softmax(temp);
      bars(ctx, probs, a * easeOut(range(lt, 0.5, 1.3)), { x: 780, y0: 380 });
      label(ctx, 'probability = softmax( score / T )', CX, 850, { size: 32, mono: true, weight: 500, color: C.dim, alpha: a * range(lt, 1, 1.8) });
      const sharp = range(temp, 0.6, 0.3), flat = range(temp, 1.2, 2);
      label(ctx, 'the top word dominates', 1480, 420, { size: 28, mono: true, color: C.electron, alpha: a * sharp, align: 'left', weight: 600 });
      label(ctx, 'many words are in play', 1300, 600, { size: 28, mono: true, color: C.proton, alpha: a * flat, align: 'left', weight: 600 });
      caption(ctx, 'tp1', a, lt, CS.tp1);
      caption(ctx, 'tp2', a, lt, CS.tp2);
    },

    effect(ctx, t) {
      const a = chapterAlpha(T, 'effect', t), lt = t - T.effect[0];
      chapterTag(ctx, '03', 'The effect', a);
      const cols = [
        { x: 130, title: 'T = 0.2  ·  reliable', color: C.electron, at: CS.ef1, id: 'ef1', rows: ['The sky is blue.', 'The sky is blue.', 'The sky is blue.', 'The sky is clear.', 'The sky is blue.'] },
        { x: 1010, title: 'T = 1.5  ·  creative', color: C.proton, at: CS.ef2, id: 'ef2', rows: ['The sky is blue today.', 'The sky is a bruised gray.', 'The sky is green over the sea.', 'The sky is clear and endless.', 'The sky is falling in slow motion.'] },
      ];
      cols.forEach((col) => {
        const hk = easeOut(range(lt, col.at, col.at + 0.7));
        label(ctx, col.title, col.x, 270, { size: 40, mono: true, weight: 700, color: col.color, alpha: a * hk, align: 'left' });
        ctx.save(); ctx.globalAlpha = a * hk * 0.6; ctx.strokeStyle = col.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(col.x, 305); ctx.lineTo(col.x + 780, 305); ctx.stroke(); ctx.restore();
        col.rows.forEach((row, i) => {
          const s = sp(col.id, 0.1 + i * 0.16), k = range(lt, s, s + 0.5);
          const wander = col.id === 'ef2' && i === 4;
          label(ctx, `${i + 1}.`, col.x, 380 + i * 90, { size: 28, mono: true, color: C.dim, alpha: a * k, align: 'left', weight: 500 });
          const shown = row.slice(0, Math.floor(row.length * easeInOut(range(lt, s, s + 0.9))));
          label(ctx, shown, col.x + 50, 380 + i * 90, { size: 38, weight: wander ? 700 : 500, color: wander ? C.proton : C.text, alpha: a * k, align: 'left' });
        });
      });
      caption(ctx, 'ef1', a, lt, CS.ef1);
      caption(ctx, 'ef2', a, lt, CS.ef2);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 9;
      const temp = 0.25 + 1.95 * (0.5 - 0.5 * Math.cos(clamp(lt / (s + 1), 0, 1) * Math.PI * 2));
      slider(ctx, temp, a * range(lt, 0.3, 1), 400);
      label(ctx, 'facts · code', 560, 520, { size: 32, mono: true, color: C.electron, alpha: a * range(lt, 0.8 + s * 0.05, 1.6 + s * 0.05), align: 'left', weight: 600 });
      label(ctx, 'stories · ideas', 1360, 520, { size: 32, mono: true, color: C.proton, alpha: a * range(lt, 0.8 + s * 0.35, 1.6 + s * 0.35), align: 'right', weight: 600 });
      label(ctx, 'One dial between', CX, CY + 130, { size: 76, weight: 700, alpha: a * range(lt, 0.8 + s * 0.65, 1.6 + s * 0.65) });
      label(ctx, 'reliable and creative.', CX, CY + 235, { size: 76, weight: 700, color: C.gold, alpha: a * range(lt, 1.2 + s * 0.7, 2 + s * 0.7) });
    },
  },
});
