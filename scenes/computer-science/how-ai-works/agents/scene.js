import { C, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, token, chip, measure } from '/runtime/kit.js';

const { clamp, lerp, range, easeInOut, easeOut, fadeWindow } = Scene;

const GREEN = '#7ee787';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- computer-science/agents`.
const TXT = {
  ag1: 'A plain model can only produce [[text]]. It cannot search, calculate or act.',
  ag2: 'Give it [[tools]], and it can ask for them to be run.',
  ag3: 'An agent loops: [[think]], call a [[tool]], read the [[result]].',
  ag4: 'It repeats until the task is done, then writes the final [[answer]].',
  ag5: 'Because agents can act, they need [[guardrails]]: permissions, step limits and checks.',
  ag6: 'For risky actions, a [[human approves]] before anything happens.',
};
const nar = await narration('computer-science/how-ai-works/agents', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { tools: ['ag1', 'ag2'], loop: ['ag3', 'ag4'], guard: ['ag5', 'ag6'] });
const { CS, T } = P;
const sp = speech(nar, CS);

const TOOLS = [
  { name: 'search', color: C.electron },
  { name: 'calculator', color: C.gold },
  { name: 'code', color: GREEN },
  { name: 'calendar', color: C.copper },
  { name: 'files', color: '#b48cff' },
];
const TASK = 'Find the cheapest flight to Tokyo, plus 15% tax.';
const STEPS = [
  { think: 'I need current prices.', act: 'search("cheapest flight Tokyo")', obs: '$820 (Air Nova)' },
  { think: 'Now add the 15% tax.', act: 'calculator(820 * 1.15)', obs: '943' },
];
const FINAL = 'Cheapest: $820, about $943 with tax.';

function modelBox(ctx, x, y, size, color, name, a, lt) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.shadowColor = color; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.roundRect(x - size / 2, y - size / 2, size, size, 28); ctx.fill(); ctx.stroke(); ctx.restore();
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) glowDot(ctx, x - size * 0.3 + (i * size * 0.6) / 3, y - size * 0.3 + (j * size * 0.6) / 3, size * 0.03, color, a * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(lt * 3 + i + j))));
  label(ctx, name, x, y + size / 2 + 40, { size: 30, mono: true, color, alpha: a, weight: 600 });
}

function arrow(ctx, x0, y0, x1, y1, color, a, width = 4) {
  const ang = Math.atan2(y1 - y0, x1 - x0);
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - 18 * Math.cos(ang - 0.45), y1 - 18 * Math.sin(ang - 0.45)); ctx.lineTo(x1 - 18 * Math.cos(ang + 0.45), y1 - 18 * Math.sin(ang + 0.45)); ctx.closePath(); ctx.fill(); ctx.restore();
}

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      TOOLS.forEach((tl, i) => {
        const ang = t * 0.4 + (i / TOOLS.length) * Math.PI * 2;
        token(ctx, tl.name, CX + Math.cos(ang) * 780, 540 + Math.sin(ang) * 400, tl.color, a * 0.3, 26);
      });
      titleCard(ctx, t, T, { l1: 'What is an', l2: 'AI agent?', sub: 'models that use tools and take actions', size: 116 });
    },

    tools(ctx, t) {
      const a = chapterAlpha(T, 'tools', t), lt = t - T.tools[0];
      chapterTag(ctx, '01', 'Text only vs tools', a);
      const k = easeOut(range(lt, 0.3, 1.1));
      modelBox(ctx, 640, 520, 240, C.electron, 'language model', a * k, lt);
      chip(ctx, "What's the weather in Paris right now?", 200, 270, { color: C.dim, size: 34, alpha: a * range(lt, 0.8, 1.5) });
      arrow(ctx, 640, 320, 640, 390, C.dim, a * range(lt, 1.0, 1.6));
      const bad = range(lt, sp('ag1', 0.45), sp('ag1', 0.45) + 0.8);
      ctx.save(); ctx.globalAlpha = a * bad; ctx.fillStyle = 'rgba(255,107,107,0.08)'; ctx.strokeStyle = C.proton; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.roundRect(200, 760, 880, 80, 16); ctx.fill(); ctx.stroke(); ctx.restore();
      label(ctx, "I can't check live weather. It's usually mild in spring…", 228, 800, { size: 27, alpha: a * bad, align: 'left', weight: 500 });

      // tools
      const tx = 1400, ty = 520, R = 300;
      TOOLS.forEach((tl, i) => {
        const at = sp('ag2', 0.2 + i * 0.12), kk = easeOut(range(lt, at, at + 0.7));
        const ang = -Math.PI * 0.5 + (i / TOOLS.length) * Math.PI * 2;
        const x = tx + Math.cos(ang) * R * kk, y = ty + Math.sin(ang) * R * 0.8 * kk;
        ctx.save(); ctx.globalAlpha = a * kk * 0.6; ctx.strokeStyle = tl.color; ctx.lineWidth = 3; ctx.setLineDash([8, 8]);
        ctx.beginPath(); ctx.moveTo(880, 520); ctx.lineTo(x, y); ctx.stroke(); ctx.restore();
        token(ctx, tl.name, x, y, tl.color, a * kk, 30);
      });
      label(ctx, 'tools', tx, ty + 8, { size: 34, mono: true, color: C.dim, alpha: a * range(lt, sp('ag2', 0.2), sp('ag2', 0.2) + 0.8), weight: 700 });
      caption(ctx, 'ag1', a, lt, CS.ag1);
      caption(ctx, 'ag2', a, lt, CS.ag2);
    },

    loop(ctx, t) {
      const a = chapterAlpha(T, 'loop', t), lt = t - T.loop[0];
      chapterTag(ctx, '02', 'The agent loop', a);
      // the loop diagram
      const nodes = [
        { name: 'think', x: 460, y: 330, color: C.electron },
        { name: 'act', x: 700, y: 640, color: C.gold },
        { name: 'observe', x: 220, y: 640, color: GREEN },
      ];
      // which node is active follows the log: think -> act -> observe -> think ...
      const t0 = sp('ag3', 0.1), stepDur = 3.4;
      const idx = lt < t0 ? -1 : Math.floor((lt - t0) / (stepDur / 3)) % 3;
      nodes.forEach((n, i) => {
        const k = easeOut(range(lt, 0.4 + i * 0.25, 1.0 + i * 0.25)), on = idx === i ? 1 : 0.45;
        chip(ctx, n.name, n.x - 100, n.y, { color: n.color, size: 44, alpha: a * k * on, w: 200, weight: 700 });
      });
      [[0, 1], [1, 2], [2, 0]].forEach(([i, j], k) => {
        const A = nodes[i], B = nodes[j];
        const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy);
        arrow(ctx, A.x + (dx / d) * 120, A.y + (dy / d) * 60, B.x - (dx / d) * 120, B.y - (dy / d) * 60, C.dim, a * range(lt, 1.2 + k * 0.2, 1.8 + k * 0.2) * 0.8);
      });
      label(ctx, 'repeat until done', 460, 760, { size: 24, mono: true, color: C.dim, alpha: a * range(lt, sp('ag4', 0.2), sp('ag4', 0.2) + 0.8), weight: 500 });

      // the log
      const lx = 900, w = 900;
      ctx.save(); ctx.globalAlpha = a * easeOut(range(lt, 0.3, 1)); ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.strokeStyle = C.dim; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(lx, 240, w, 620, 22); ctx.fill(); ctx.stroke(); ctx.restore();
      const typed = (text, start, secs) => text.slice(0, Math.floor(text.length * easeInOut(range(lt, start, start + secs))));
      label(ctx, `task: ${typed(TASK, 0.8, 1.6)}`, lx + 30, 285, { size: 24, mono: true, color: C.text, alpha: a * range(lt, 0.8, 1.2), align: 'left', weight: 600 });
      let y = 345, at = t0;
      STEPS.forEach((s, i) => {
        [['think', s.think, C.electron], ['act', s.act, C.gold], ['obs', s.obs, GREEN]].forEach(([tag, txt, col], j) => {
          const st = at + j * (stepDur / 3), k = range(lt, st, st + 0.4);
          label(ctx, tag === 'obs' ? 'result:' : `${tag}:`, lx + 30, y, { size: 24, mono: true, color: col, alpha: a * k, align: 'left', weight: 700 });
          label(ctx, typed(txt, st, 0.9), lx + 170, y, { size: 24, mono: true, color: C.text, alpha: a * k, align: 'left', weight: 500 });
          y += 44;
        });
        y += 20;
        at += stepDur;
      });
      const fk = range(lt, at, at + 0.5);
      ctx.save(); ctx.globalAlpha = a * fk; ctx.strokeStyle = GREEN; ctx.fillStyle = 'rgba(126,231,135,0.08)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(lx + 20, y - 8, w - 40, 60, 12); ctx.fill(); ctx.stroke(); ctx.restore();
      label(ctx, `answer: ${typed(FINAL, at, 1.4)}`, lx + 40, y + 22, { size: 24, mono: true, color: GREEN, alpha: a * fk, align: 'left', weight: 700 });
      caption(ctx, 'ag3', a, lt, CS.ag3);
      caption(ctx, 'ag4', a, lt, CS.ag4);
    },

    guard(ctx, t) {
      const a = chapterAlpha(T, 'guard', t), lt = t - T.guard[0];
      chapterTag(ctx, '03', 'Guardrails', a);
      const cards = [
        { name: 'permissions', sub: 'only the tools it needs', color: C.electron, at: sp('ag5', 0.35) },
        { name: 'step limits', sub: 'stop after N actions', color: C.gold, at: sp('ag5', 0.6) },
        { name: 'checks', sub: 'validate results and outputs', color: GREEN, at: sp('ag5', 0.85) },
        { name: 'human approval', sub: 'for risky actions like payments', color: C.proton, at: sp('ag6', 0.3) },
      ];
      cards.forEach((c, i) => {
        const x = 160 + (i % 2) * 830, y = 290 + Math.floor(i / 2) * 250, k = easeOut(range(lt, c.at, c.at + 0.8));
        ctx.save(); ctx.globalAlpha = a * k; ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.strokeStyle = c.color; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.roundRect(x, y + (1 - k) * 30, 780, 200, 26); ctx.fill(); ctx.stroke(); ctx.restore();
        // shield / gate glyph
        ctx.save(); ctx.globalAlpha = a * k; ctx.strokeStyle = c.color; ctx.lineWidth = 6; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(x + 90, y + 50 + (1 - k) * 30); ctx.lineTo(x + 150, y + 70 + (1 - k) * 30); ctx.lineTo(x + 150, y + 120 + (1 - k) * 30); ctx.quadraticCurveTo(x + 150, y + 160 + (1 - k) * 30, x + 90, y + 175 + (1 - k) * 30); ctx.quadraticCurveTo(x + 30, y + 160 + (1 - k) * 30, x + 30, y + 120 + (1 - k) * 30); ctx.lineTo(x + 30, y + 70 + (1 - k) * 30); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 62, y + 114 + (1 - k) * 30); ctx.lineTo(x + 84, y + 136 + (1 - k) * 30); ctx.lineTo(x + 122, y + 92 + (1 - k) * 30); ctx.stroke(); ctx.restore();
        label(ctx, c.name, x + 190, y + 80 + (1 - k) * 30, { size: 44, weight: 700, alpha: a * k, align: 'left' });
        label(ctx, c.sub, x + 190, y + 130 + (1 - k) * 30, { size: 24, mono: true, color: c.color, alpha: a * k, align: 'left', weight: 500 });
      });
      caption(ctx, 'ag5', a, lt, CS.ag5);
      caption(ctx, 'ag6', a, lt, CS.ag6);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 5;
      const parts = [['model', C.electron], ['+ loop', C.gold], ['+ tools', GREEN], ['+ limits', C.proton]];
      const gap = 40, size = 60;
      const widths = parts.map(([txt]) => measure(ctx, txt, size, 700));
      let x = CX - (widths.reduce((q, w) => q + w, 0) + gap * 3) / 2;
      parts.forEach(([txt, col], i) => {
        const k = easeOut(range(lt, 0.5 + (s * i) / 5, 1.2 + (s * i) / 5));
        label(ctx, txt, x, CY - 40, { size, weight: 700, color: col, alpha: a * k, align: 'left' });
        x += widths[i] + gap;
      });
      label(ctx, '= an agent', CX, CY + 100, { size: 100, weight: 700, alpha: a * range(lt, 0.5 + s * 0.8, 1.3 + s * 0.8) });
    },
  },
});
