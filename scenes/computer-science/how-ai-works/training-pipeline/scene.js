import { C, W, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, token, measure, chip } from '/runtime/kit.js';

const { clamp, lerp, range, easeInOut, easeOut, fadeWindow } = Scene;

const GREEN = '#7ee787', BASE = '#8a94b4', TUNED = '#4dd8ff';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- computer-science/training-pipeline`.
const TXT = {
  pt1: 'First, [[pretraining]]: the model reads a huge amount of text and learns to predict the [[next word]].',
  pt2: 'The result is a [[base model]]: great at continuing text, but not yet a helpful [[assistant]].',
  ft1: 'Next, [[fine-tuning]] on example conversations teaches it to [[follow instructions]].',
  ft2: 'Now the same question gets a direct [[answer]].',
  rl1: 'Then [[human feedback]]: people compare pairs of answers, and a [[reward model]] learns their preferences.',
  rl2: 'The model is nudged toward answers people rate higher: [[reinforcement learning:electron]] from human feedback.',
};
const nar = await narration('computer-science/how-ai-works/training-pipeline', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { pretrain: ['pt1', 'pt2'], finetune: ['ft1', 'ft2'], feedback: ['rl1', 'rl2'] });
const { CS, T } = P;
const sp = speech(nar, CS);

const PROMPT = 'What is the capital of France?';
const BASE_REPLY = ['What is the capital of Germany?', 'What is the capital of Italy?', 'What is the capital of Spain?'];
const TUNED_REPLY = ['The capital of France is Paris.'];

// ---- drawing helpers -----------------------------------------------------------
function model(ctx, x, y, size, color, name, a, lt = 0, pulse = 0) {
  const r = size / 2;
  ctx.save();
  ctx.globalAlpha = a; ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.shadowColor = color; ctx.shadowBlur = 16 * pulse;
  ctx.beginPath(); ctx.roundRect(x - r, y - r, size, size, 30); ctx.fill(); ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    const k = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(lt * 3 + i * 1.3 + j * 0.9)) * pulse;
    glowDot(ctx, x - r * 0.62 + (i * r * 1.24) / 4, y - r * 0.62 + (j * r * 1.24) / 4, size * 0.028, color, a * (0.3 + 0.7 * k));
  }
  label(ctx, name, x, y + r + 44, { size: 32, mono: true, color, alpha: a, weight: 600 });
}

/** a chat bubble pair: user prompt + a (possibly partly typed) reply, drawn inside a card */
function chat(ctx, x, y, w, { prompt = PROMPT, lines, typed = 1, color, title, alpha = 1, dim = false, mark = null }) {
  const h = 84 + 44 + lines.length * 44 + 30;
  ctx.save();
  ctx.globalAlpha = alpha * (dim ? 0.55 : 1);
  ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.strokeStyle = color; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.roundRect(x - w / 2, y, w, h, 22); ctx.fill(); ctx.stroke();
  ctx.restore();
  if (title) label(ctx, title, x - w / 2 + 24, y - 26, { size: 26, mono: true, color, alpha: alpha * (dim ? 0.55 : 1), align: 'left', weight: 600 });
  const pw = measure(ctx, prompt, 30, 500) + 36;
  chip(ctx, prompt, x + w / 2 - pw - 22, y + 50, { color: C.dim, size: 30, alpha: alpha * (dim ? 0.55 : 1), w: pw });
  let remaining = Math.floor(typed * lines.join('').length);
  lines.forEach((ln, i) => {
    const shown = ln.slice(0, Math.max(0, remaining));
    remaining -= ln.length;
    label(ctx, shown, x - w / 2 + 28, y + 112 + i * 44, { size: 32, color: C.text, alpha: alpha * (dim ? 0.55 : 1), align: 'left', weight: 500 });
  });
  if (mark) {
    ctx.save(); ctx.globalAlpha = alpha * mark.k; ctx.fillStyle = mark.color;
    ctx.beginPath(); ctx.arc(x + w / 2 - 34, y + h - 34, 24, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    label(ctx, mark.text, x + w / 2 - 34, y + h - 33, { size: 30, color: C.bg, alpha: alpha * mark.k, weight: 700 });
  }
  return h;
}

const typedAt = (lt, start, secs) => easeInOut(range(lt, start, start + secs));

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      for (let i = 0; i < 18; i++) {
        const y = 120 + ((i * 197) % 840), x = ((i * 331 + t * (40 + (i % 5) * 12)) % (W + 400)) - 200;
        ctx.save(); ctx.globalAlpha = a * 0.16; ctx.fillStyle = C.electron;
        ctx.beginPath(); ctx.roundRect(x, y, 60 + (i % 4) * 30, 10, 5); ctx.fill(); ctx.restore();
      }
      titleCard(ctx, t, T, { l1: 'How is a chatbot', l2: 'trained?', sub: 'pretraining, fine-tuning and feedback', size: 104 });
    },

    pretrain(ctx, t) {
      const a = chapterAlpha(T, 'pretrain', t), lt = t - T.pretrain[0];
      chapterTag(ctx, '01', 'Pretraining', a);
      const p1 = a * (1 - range(lt, CS.pt2 - 0.3, CS.pt2 + 0.3)), p2 = a * range(lt, CS.pt2, CS.pt2 + 0.6);

      if (p1 > 0) {
        const mx = 1150, my = 520;
        const sources = ['books', 'web pages', 'code', 'papers', 'forums'];
        sources.forEach((name, i) => {
          const y = 320 + i * 100, k = easeOut(range(lt, 0.4 + i * 0.2, 1.0 + i * 0.2));
          token(ctx, name, 300, y, C.gold, p1 * k, 28);
          for (let j = 0; j < 6; j++) {
            const u = (lt * 0.42 + j / 6 + i * 0.17) % 1;
            const x = lerp(430, mx - 150, u), yy = lerp(y, my, easeInOut(u));
            ctx.save(); ctx.globalAlpha = p1 * k * Math.sin(u * Math.PI); ctx.fillStyle = C.electron;
            ctx.beginPath(); ctx.roundRect(x - 22, yy - 5, 44 - (j % 3) * 8, 10, 5); ctx.fill(); ctx.restore();
          }
        });
        model(ctx, mx, my, 250, C.electron, 'language model', p1 * easeOut(range(lt, 0.6, 1.4)), lt, 1);
        const n = Math.pow(10, lerp(3, 13, easeOut(range(lt, 1.0, CS.pt2))));
        label(ctx, `words read: ${Math.round(n).toLocaleString('en-US')}`, CX, 800, { size: 40, mono: true, weight: 600, color: C.gold, alpha: p1 * range(lt, 1.2, 2) });
        label(ctx, 'goal: predict the next word', mx + 190, 470, { size: 28, mono: true, color: C.dim, alpha: p1 * range(lt, sp('pt1', 0.6), sp('pt1', 0.6) + 0.7), align: 'left', weight: 500 });
      }
      if (p2 > 0) {
        model(ctx, 420, 520, 210, BASE, 'base model', p2, lt, 0.5);
        chat(ctx, 1210, 380, 1000, { lines: BASE_REPLY, typed: typedAt(lt, sp('pt2', 0.25), 4), color: BASE, title: 'base model output', alpha: p2 });
        label(ctx, 'it just keeps writing what looks likely next', 1210, 730, { size: 28, mono: true, color: C.proton, alpha: p2 * range(lt, sp('pt2', 0.6), sp('pt2', 0.6) + 0.7), weight: 600 });
      }
      caption(ctx, 'pt1', a, lt, CS.pt1);
      caption(ctx, 'pt2', a, lt, CS.pt2);
    },

    finetune(ctx, t) {
      const a = chapterAlpha(T, 'finetune', t), lt = t - T.finetune[0];
      chapterTag(ctx, '02', 'Fine-tuning', a);
      const p1 = a * (1 - range(lt, CS.ft2 - 0.3, CS.ft2 + 0.3)), p2 = a * range(lt, CS.ft2, CS.ft2 + 0.6);
      const tune = easeInOut(range(lt, 1.2, sp('ft1', 0.9)));
      const col = tune < 0.5 ? BASE : TUNED;

      if (p1 > 0) {
        const mx = 1250, my = 520;
        const ex = [['Summarise this email…', 'Here is a short summary…'], ['Translate to Spanish…', 'Aquí está la traducción…'], ['Explain gravity…', 'Gravity is the force that…'], ['Write a poem…', 'Roses are red…']];
        ex.forEach(([q, ans], i) => {
          const y = 330 + i * 120, k = easeOut(range(lt, 0.4 + i * 0.35, 1.0 + i * 0.35));
          const w = 520;
          ctx.save(); ctx.globalAlpha = p1 * k; ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.strokeStyle = C.gold; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.roundRect(200, y - 44, w, 88, 16); ctx.fill(); ctx.stroke(); ctx.restore();
          label(ctx, q, 224, y - 14, { size: 26, mono: true, color: C.dim, alpha: p1 * k, align: 'left', weight: 500 });
          label(ctx, ans, 224, y + 18, { size: 28, color: C.text, alpha: p1 * k, align: 'left', weight: 500 });
          const u = (lt * 0.38 + i * 0.27) % 1;
          if (lt > 1) glowDot(ctx, lerp(200 + w + 10, mx - 150, u), lerp(y, my, easeInOut(u)), 7, C.gold, p1 * Math.sin(u * Math.PI));
        });
        model(ctx, mx, my, 250, col, tune < 0.5 ? 'base model' : 'fine-tuned model', p1 * easeOut(range(lt, 0.5, 1.2)), lt, 0.4 + 0.6 * (1 - tune) * 0 + 0.6);
        label(ctx, 'thousands of example conversations', 460, 840, { size: 28, mono: true, color: C.gold, alpha: p1 * range(lt, 1.6, 2.4), weight: 600 });
      }
      if (p2 > 0) {
        model(ctx, 420, 520, 210, TUNED, 'fine-tuned model', p2, lt, 0.7);
        chat(ctx, 1210, 420, 1000, { lines: TUNED_REPLY, typed: typedAt(lt, sp('ft2', 0.1), 1.6), color: TUNED, title: 'fine-tuned model output', alpha: p2 });
      }
      caption(ctx, 'ft1', a, lt, CS.ft1);
      caption(ctx, 'ft2', a, lt, CS.ft2);
    },

    feedback(ctx, t) {
      const a = chapterAlpha(T, 'feedback', t), lt = t - T.feedback[0];
      chapterTag(ctx, '03', 'Human feedback', a);
      const A = ['Paris.'];
      const B = ['The capital of France is Paris,', 'a city on the River Seine.'];
      const k = easeOut(range(lt, 0.4, 1.2));
      const pick = range(lt, sp('rl1', 0.55), sp('rl1', 0.55) + 0.7);
      chat(ctx, 470, 280, 700, { lines: A, typed: typedAt(lt, 1.0, 0.8), color: TUNED, title: 'answer A', alpha: a * k, dim: pick > 0.5, mark: { k: pick, color: C.proton, text: '✕' } });
      chat(ctx, 470, 540, 700, { lines: B, typed: typedAt(lt, 1.6, 1.6), color: TUNED, title: 'answer B', alpha: a * k, mark: { k: pick, color: GREEN, text: '✓' } });
      // human picks
      const hx = 1065, hy = 470, hk = range(lt, sp('rl1', 0.3), sp('rl1', 0.3) + 0.6);
      ctx.save(); ctx.globalAlpha = a * hk; ctx.strokeStyle = C.text; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(hx, hy - 50, 30, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx - 50, hy + 60); ctx.quadraticCurveTo(hx, hy - 10, hx + 50, hy + 60); ctx.stroke(); ctx.restore();
      label(ctx, 'person picks the better one', hx, hy + 110, { size: 24, mono: true, color: C.dim, alpha: a * hk, weight: 500 });
      // reward model learns the preference
      const rk = range(lt, sp('rl1', 0.75), sp('rl1', 0.75) + 0.8);
      const rx = 1420;
      ctx.save(); ctx.globalAlpha = a * rk; ctx.strokeStyle = C.gold; ctx.fillStyle = 'rgba(255,209,102,0.06)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect(rx - 150, 300, 300, 330, 24); ctx.fill(); ctx.stroke(); ctx.restore();
      label(ctx, 'reward model', rx, 340, { size: 28, mono: true, color: C.gold, alpha: a * rk, weight: 600 });
      [['A', 0.2, C.proton], ['B', 0.85, GREEN]].forEach(([n, v, c], i) => {
        const y = 430 + i * 90, w = 200 * v * easeOut(range(lt, sp('rl1', 0.85), sp('rl1', 0.85) + 1));
        label(ctx, n, rx - 120, y, { size: 30, mono: true, alpha: a * rk, weight: 600 });
        ctx.save(); ctx.globalAlpha = a * rk; ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(rx - 90, y - 18, Math.max(4, w), 36, 8); ctx.fill(); ctx.restore();
      });
      label(ctx, 'score', rx, 590, { size: 22, mono: true, color: C.dim, alpha: a * rk, weight: 500 });

      // rl2: the score steers the model
      const sk = range(lt, sp('rl2', 0.15), sp('rl2', 0.15) + 0.8);
      if (sk > 0) {
        ctx.save(); ctx.globalAlpha = a * sk * 0.8; ctx.strokeStyle = GREEN; ctx.fillStyle = GREEN; ctx.lineWidth = 5; ctx.setLineDash([12, 10]);
        ctx.beginPath(); ctx.moveTo(rx, 640); ctx.lineTo(rx, 730); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(rx, 752); ctx.lineTo(rx - 14, 724); ctx.lineTo(rx + 14, 724); ctx.closePath(); ctx.fill(); ctx.restore();
        model(ctx, rx, 810, 100, TUNED, '', a * sk, lt, 0.9);
        label(ctx, 'model nudged toward answers like B', rx, 880, { size: 26, mono: true, color: GREEN, alpha: a * sk, weight: 600 });
      }
      caption(ctx, 'rl1', a, lt, CS.rl1);
      caption(ctx, 'rl2', a, lt, CS.rl2);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 10;
      const steps = [
        { name: 'pretraining', sub: 'learns language', color: C.electron, at: 0.8 },
        { name: 'fine-tuning', sub: 'learns the format', color: C.gold, at: 0.8 + s * 0.28 },
        { name: 'feedback', sub: 'learns preferences', color: GREEN, at: 0.8 + s * 0.55 },
      ];
      const gap = 150, size = 46;
      const widths = steps.map((st) => Math.max(measure(ctx, st.name, size, 700), 330));
      let x = CX - (widths.reduce((n, w) => n + w, 0) + gap * 2) / 2;
      steps.forEach((st, i) => {
        const k = easeOut(range(lt, st.at, st.at + 0.8));
        chip(ctx, st.name, x, CY - 60, { color: st.color, size, alpha: a * k, w: widths[i], weight: 700 });
        label(ctx, st.sub, x + widths[i] / 2, CY + 20, { size: 28, mono: true, color: st.color, alpha: a * k, weight: 500 });
        if (i < 2) label(ctx, '→', x + widths[i] + gap / 2, CY - 60, { size: 56, color: C.dim, alpha: a * range(lt, steps[i + 1].at, steps[i + 1].at + 0.6), weight: 500 });
        x += widths[i] + gap;
      });
      const fin = range(lt, 0.8 + s * 0.78, 0.8 + s * 0.78 + 0.8);
      label(ctx, 'text predictor  →  assistant', CX, CY + 170, { size: 64, weight: 700, color: C.text, alpha: a * fin });
    },
  },
});
