import { C, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, token, chip, measure } from '/runtime/kit.js';

const { clamp, lerp, range, easeInOut, easeOut, fadeWindow } = Scene;

const GREEN = '#7ee787', VIOLET = '#b48cff';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- computer-science/context-window`.
const TXT = {
  cw1: 'A model reads only a fixed number of tokens at once: its [[context window]].',
  cw2: 'Your prompt, the chat history and even its own reply must all [[fit inside]].',
  cw3: 'When a conversation grows, the oldest tokens [[fall out]] of the window.',
  cw4: 'The model has no memory outside it, so it can [[forget:proton]] what you said earlier.',
  cw5: 'Attention compares every token with every other, so longer windows cost [[far more]] compute.',
  cw6: 'Tricks like [[summarising]] the history or [[retrieving]] only what matters keep the key parts in view.',
};
const nar = await narration('computer-science/how-ai-works/context-window', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { window: ['cw1', 'cw2'], forget: ['cw3', 'cw4'], cost: ['cw5', 'cw6'] });
const { CS, T } = P;
const sp = speech(nar, CS);

const WORDS = 'The cat sat on the mat and purred while I read my book by the window on a rainy Sunday after a long week'.split(' ');
const CHAT = [
  ['user', 'My name is Sam.'],
  ['ai', 'Nice to meet you, Sam!'],
  ['user', 'Plan a 3-day trip to Lisbon.'],
  ['ai', 'Sure! Day 1: Alfama and the castle…'],
  ['user', 'Add a food tour.'],
  ['ai', 'Done! Day 2 now starts with pastel de nata…'],
  ['user', "What's my name?"],
];

function bracket(ctx, x0, x1, y, h, color, a, name) {
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.shadowColor = color; ctx.shadowBlur = 16; ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(77,216,255,0.06)';
  ctx.beginPath(); ctx.roundRect(x0, y - h / 2, x1 - x0, h, 18); ctx.fill(); ctx.stroke(); ctx.restore();
  if (name) label(ctx, name, (x0 + x1) / 2, y - h / 2 - 34, { size: 30, mono: true, color, alpha: a, weight: 700 });
}

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      WORDS.forEach((w, i) => {
        const x = ((i * 130 - t * 70) % 3000 + 3000) % 3000 - 300;
        chip(ctx, w, x, 190 + (i % 3) * 8, { color: C.electron, size: 32, alpha: a * 0.2 });
      });
      bracket(ctx, CX - 330, CX + 330, 190, 90, C.electron, a * 0.5 * range(t, 0.4, 1.2), '');
      titleCard(ctx, t, T, { l1: 'How much can', l2: 'an AI remember?', sub: 'context windows', size: 108 });
    },

    window(ctx, t) {
      const a = chapterAlpha(T, 'window', t), lt = t - T.window[0];
      chapterTag(ctx, '01', 'The context window', a);
      // token strip
      const n = 24, cw = 62, gap = 8, x0 = CX - (n * (cw + gap)) / 2, y = 390;
      const wStart = 6, wEnd = 17;
      WORDS.slice(0, n).forEach((wd, i) => {
        const k = easeOut(range(lt, 0.3 + i * 0.04, 0.8 + i * 0.04));
        const inside = i >= wStart && i <= wEnd;
        const on = range(lt, sp('cw1', 0.4), sp('cw1', 0.4) + 0.8);
        const al = a * k * lerp(1, inside ? 1 : 0.22, on);
        ctx.save(); ctx.globalAlpha = al * 0.16; ctx.fillStyle = C.electron; ctx.beginPath(); ctx.roundRect(x0 + i * (cw + gap), y - 26, cw, 52, 8); ctx.fill();
        ctx.globalAlpha = al * 0.8; ctx.strokeStyle = C.electron; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
        label(ctx, wd, x0 + i * (cw + gap) + cw / 2, y, { size: wd.length > 5 ? 17 : 21, mono: true, alpha: al, weight: 500 });
      });
      const on = range(lt, sp('cw1', 0.4), sp('cw1', 0.4) + 0.8);
      bracket(ctx, x0 + wStart * (cw + gap) - 8, x0 + (wEnd + 1) * (cw + gap) - 2, y, 100, C.gold, a * on, 'context window');
      label(ctx, 'outside the window: the model cannot see it', x0 + 3 * (cw + gap), y + 90, { size: 22, mono: true, color: C.dim, alpha: a * on, weight: 500 });

      // what fills it
      const ck = range(lt, CS.cw2, CS.cw2 + 0.6);
      if (ck > 0) {
        const bx = 300, bw = 1320, by = 640;
        label(ctx, 'window capacity: 8,000 tokens', bx, by - 50, { size: 26, mono: true, color: C.dim, alpha: a * ck, align: 'left', weight: 500 });
        ctx.save(); ctx.globalAlpha = a * ck; ctx.strokeStyle = C.dim; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(bx, by, bw, 70, 12); ctx.stroke(); ctx.restore();
        const segs = [['system', 0.10, C.gold], ['prompt', 0.15, C.electron], ['chat history', 0.50, C.copper], ['reply', 0.25, GREEN]];
        let x = bx;
        segs.forEach(([name, frac, col], i) => {
          const k = easeOut(range(lt, sp('cw2', 0.1 + i * 0.2), sp('cw2', 0.1 + i * 0.2) + 0.8)), w = bw * frac * k;
          ctx.save(); ctx.globalAlpha = a * ck; ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x + 3, by + 4, Math.max(0, w - 6), 62, 8); ctx.fill(); ctx.restore();
          label(ctx, name, x + (bw * frac) / 2, by + 108, { size: 24, mono: true, color: col, alpha: a * k, weight: 600 });
          x += bw * frac;
        });
      }
      caption(ctx, 'cw1', a, lt, CS.cw1);
      caption(ctx, 'cw2', a, lt, CS.cw2);
    },

    forget(ctx, t) {
      const a = chapterAlpha(T, 'forget', t), lt = t - T.forget[0];
      chapterTag(ctx, '02', 'Forgetting', a);
      const slide = easeInOut(range(lt, sp('cw3', 0.2), sp('cw3', 0.8)));
      const rowH = 78, y0 = 250, x0 = 420, w = 900, visible = 4;
      const first = lerp(0, CHAT.length - visible, slide);
      CHAT.forEach(([who, text], i) => {
        const k = easeOut(range(lt, 0.3 + i * 0.28, 0.9 + i * 0.28));
        const y = y0 + i * rowH;
        const out = clamp(first - i + 0.5, 0, 1); // 1 when fully outside the window
        const col = who === 'user' ? C.electron : GREEN;
        const al = a * k * lerp(1, 0.25, out);
        ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.strokeStyle = col; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(who === 'user' ? x0 + 120 : x0, y, w - 120, rowH - 14, 16); ctx.fill(); ctx.stroke(); ctx.restore();
        label(ctx, text, (who === 'user' ? x0 + 150 : x0 + 30), y + (rowH - 14) / 2, { size: 30, alpha: al, align: 'left', weight: 500 });
        label(ctx, who === 'user' ? 'you' : 'AI', who === 'user' ? x0 + w + 20 : x0 - 20, y + (rowH - 14) / 2, { size: 22, mono: true, color: col, alpha: al, align: who === 'user' ? 'left' : 'right', weight: 600 });
      });
      // the sliding window
      const wy = y0 + first * rowH - 8;
      ctx.save(); ctx.globalAlpha = a * range(lt, 1.5, 2.2); ctx.strokeStyle = C.gold; ctx.lineWidth = 5; ctx.shadowColor = C.gold; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.roundRect(x0 - 40, wy, w + 100, visible * rowH + 8, 20); ctx.stroke(); ctx.restore();
      label(ctx, 'context window', x0 + w + 80, wy + 20, { size: 24, mono: true, color: C.gold, alpha: a * range(lt, 1.5, 2.2), align: 'left', weight: 700 });
      label(ctx, 'fell out of the window', x0 + w + 80, y0 + 40, { size: 24, mono: true, color: C.proton, alpha: a * slide, align: 'left', weight: 600 });
      // the answer
      const ak = range(lt, sp('cw4', 0.3), sp('cw4', 0.3) + 0.8);
      const ans = "I'm sorry, I don't know your name.";
      ctx.save(); ctx.globalAlpha = a * ak; ctx.fillStyle = 'rgba(255,107,107,0.08)'; ctx.strokeStyle = C.proton; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.roundRect(x0, y0 + CHAT.length * rowH, w - 120, rowH - 14, 16); ctx.fill(); ctx.stroke(); ctx.restore();
      label(ctx, ans.slice(0, Math.floor(ans.length * easeInOut(range(lt, sp('cw4', 0.35), sp('cw4', 0.35) + 1.4)))), x0 + 30, y0 + CHAT.length * rowH + (rowH - 14) / 2, { size: 30, alpha: a * ak, align: 'left', weight: 500 });
      caption(ctx, 'cw3', a, lt, CS.cw3);
      caption(ctx, 'cw4', a, lt, CS.cw4);
    },

    cost(ctx, t) {
      const a = chapterAlpha(T, 'cost', t), lt = t - T.cost[0];
      chapterTag(ctx, '03', 'The cost of long windows', a);
      const p1 = a * (1 - range(lt, CS.cw6 - 0.3, CS.cw6 + 0.3)), p2 = a * range(lt, CS.cw6, CS.cw6 + 0.6);
      if (p1 > 0) {
        const sizes = [4, 8, 16, 32], cell = 12, gap = 100;
        const widths = sizes.map((s) => s * cell);
        let x = CX - (widths.reduce((q, w) => q + w, 0) + gap * 3) / 2;
        sizes.forEach((s, gi) => {
          const at = sp('cw5', 0.25 + gi * 0.16), k = easeOut(range(lt, at, at + 0.9));
          const size = s * cell, y = 720 - size;
          for (let r = 0; r < s; r++) for (let c = 0; c < s; c++) {
            const d = (r + c) / (2 * s);
            ctx.save(); ctx.globalAlpha = p1 * k * (0.35 + 0.55 * (0.5 + 0.5 * Math.sin(lt * 3 + r * 0.7 + c * 0.5))); ctx.fillStyle = gi === 3 ? C.proton : gi === 2 ? C.gold : C.electron;
            ctx.fillRect(x + c * cell + 1, y + r * cell + 1, cell - 2, cell - 2); ctx.restore();
          }
          label(ctx, `${s} tokens`, x + size / 2, 760, { size: 26, mono: true, alpha: p1 * k, weight: 600 });
          label(ctx, `${(s * s).toLocaleString('en-US')} pairs`, x + size / 2, 800, { size: 26, mono: true, color: gi === 3 ? C.proton : C.gold, alpha: p1 * k, weight: 700 });
          x += size + gap;
        });
        label(ctx, 'double the tokens → four times the comparisons', CX, 250, { size: 32, mono: true, color: C.gold, alpha: p1 * range(lt, sp('cw5', 0.6), sp('cw5', 0.6) + 0.8), weight: 600 });
      }
      if (p2 > 0) {
        // summarise
        const k1 = range(lt, sp('cw6', 0.15), sp('cw6', 0.15) + 0.8);
        label(ctx, 'summarise', 330, 300, { size: 34, mono: true, color: C.copper, alpha: p2 * k1, align: 'left', weight: 700 });
        for (let i = 0; i < 12; i++) {
          const c = easeInOut(range(lt, sp('cw6', 0.3), sp('cw6', 0.3) + 1.2));
          ctx.save(); ctx.globalAlpha = p2 * k1 * (1 - c * 0.9); ctx.fillStyle = C.copper;
          ctx.beginPath(); ctx.roundRect(330 + (i % 6) * 70 + c * (1 - (i % 6)) * 20, 350 + Math.floor(i / 6) * 60, 56, 40, 8); ctx.fill(); ctx.restore();
        }
        label(ctx, '→', 800, 400, { size: 60, color: C.dim, alpha: p2 * k1, weight: 500 });
        token(ctx, 'summary', 980, 400, C.copper, p2 * range(lt, sp('cw6', 0.3) + 0.8, sp('cw6', 0.3) + 1.6), 34);
        label(ctx, '40 messages → 1 short note', 700, 480, { size: 24, mono: true, color: C.dim, alpha: p2 * k1, weight: 500 });
        // retrieve
        const k2 = range(lt, sp('cw6', 0.55), sp('cw6', 0.55) + 0.8);
        label(ctx, 'retrieve', 330, 590, { size: 34, mono: true, color: GREEN, alpha: p2 * k2, align: 'left', weight: 700 });
        for (let i = 0; i < 18; i++) {
          const hit = i === 4 || i === 11;
          ctx.save(); ctx.globalAlpha = p2 * k2 * (hit ? 1 : 0.28); ctx.fillStyle = hit ? GREEN : C.dim;
          ctx.beginPath(); ctx.roundRect(330 + (i % 9) * 70, 640 + Math.floor(i / 9) * 60, 56, 40, 8); ctx.fill(); ctx.restore();
        }
        label(ctx, '→', 1010, 700, { size: 60, color: C.dim, alpha: p2 * k2, weight: 500 });
        bracket(ctx, 1080, 1420, 700, 100, C.gold, p2 * k2, '');
        token(ctx, 'only the relevant chunks', 1250, 700, GREEN, p2 * range(k2, 0.6, 1), 24);
      }
      caption(ctx, 'cw5', a, lt, CS.cw5);
      caption(ctx, 'cw6', a, lt, CS.cw6);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 5;
      bracket(ctx, CX - 400, CX + 400, CY - 120, 120, C.gold, a * range(lt, 0.3, 1), 'context window');
      label(ctx, "The model's working memory.", CX, CY + 50, { size: 76, weight: 700, alpha: a * range(lt, 0.6, 1.4) });
      label(ctx, 'Choose what goes in.', CX, CY + 160, { size: 76, weight: 700, color: C.gold, alpha: a * range(lt, 0.6 + s * 0.55, 1.4 + s * 0.55) });
    },
  },
});
