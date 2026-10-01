import { C, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, chip, token, panel, arrow, pathAt, card, measure } from '/runtime/kit.js';

const { clamp, lerp, range, easeOut, easeInOut, fadeWindow, rng } = Scene;

const GREEN = '#7ee787', GO = '#4dd8ff';
const TINTS = [C.electron, C.gold, GREEN, C.copper, '#c792ea'];

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- software-engineering/backend-runtimes/why-go`.
const TXT = {
  g1: 'Go was built at Google for [[fast servers:electron]] that handle [[many things at once]].',
  g2: 'It compiles to a [[single binary]], so deploying means copying one file.',
  g3: 'A [[goroutine]] is a function running on its own, and it costs only a few [[kilobytes]].',
  g4: 'The runtime schedules thousands of goroutines onto a [[few OS threads]].',
  g5: 'Goroutines talk to each other through [[channels]].',
  g6: 'Do not communicate by sharing memory; [[share memory by communicating:green]].',
};
const nar = await narration('software-engineering/backend-runtimes/why-go', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { build: ['g1', 'g2'], sched: ['g3', 'g4'], chan: ['g5', 'g6'] });
const { CS, T } = P;
const sp = speech(nar, CS);

const rand = rng(11);
const REQ = Array.from({ length: 44 }, () => ({ y: 360 + rand() * 280, c: Math.floor(rand() * 5) }));
const GRID = Array.from({ length: 160 }, (_, i) => ({ x: 300 + (i % 20) * 70, y: 200 + Math.floor(i / 20) * 34, c: i % 5 }));
const PIPE = [[640, 440], [1280, 440]];

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      GRID.slice(0, 40).forEach((d, i) => glowDot(ctx, 400 + (i % 10) * 124, 150 + Math.floor(i / 10) * 0, 7, TINTS[d.c], a * 0.35 * range(t, 0.3 + i * 0.03, 0.8 + i * 0.03)));
      titleCard(ctx, t, T, { l1: 'Why', l2: 'Go?', sub: 'simple, fast, concurrent', tint: GO, size: 128 });
    },

    build(ctx, t) {
      const a = chapterAlpha(T, 'build', t), lt = t - T.build[0];
      chapterTag(ctx, '01', 'Servers and one binary', a);
      const sk = easeOut(range(lt, 0.3, 1.0));
      panel(ctx, 1280, 330, 380, 340, GO, a * sk, 0.06, 24);
      label(ctx, 'server', 1470, 372, { size: 28, mono: true, color: GO, alpha: a * sk, weight: 700 });
      // many requests arriving at once
      const gone = 1 - range(lt, CS.g2, CS.g2 + 0.5);
      REQ.forEach((r, i) => {
        const u = (lt - (sp('g1', 0.1) + i * 0.1)) / 1.6;
        if (u <= 0 || u >= 1) return;
        const e = easeInOut(u);
        glowDot(ctx, lerp(120, 1290, e), lerp(r.y, 500, e * 0.6), 8, TINTS[r.c], a * gone * (1 - range(u, 0.9, 1)));
      });
      label(ctx, 'many requests at once', 600, 300, { size: 26, mono: true, color: C.dim, alpha: a * gone * range(lt, sp('g1', 0.5), sp('g1', 0.5) + 0.6), weight: 600 });
      // go build -> a single binary -> the server
      const k = (f) => easeOut(range(lt, sp('g2', f), sp('g2', f) + 0.6));
      chip(ctx, 'main.go', 100, 500, { color: C.dim, size: 40, alpha: a * k(0.0), w: 240 });
      arrow(ctx, 360, 500, 440, 500, C.dim, a * k(0.2));
      token(ctx, 'go build', 560, 500, C.gold, a * k(0.25), 28);
      arrow(ctx, 680, 500, 760, 500, C.dim, a * k(0.4));
      chip(ctx, 'app', 780, 500, { color: GREEN, size: 44, alpha: a * k(0.45), w: 240, weight: 700 });
      label(ctx, 'one binary', 900, 570, { size: 24, mono: true, color: GREEN, alpha: a * k(0.5), weight: 600 });
      arrow(ctx, 1040, 500, 1270, 500, C.dim, a * k(0.6));
      chip(ctx, 'app', 1370, 520, { color: GREEN, size: 40, alpha: a * k(0.8), w: 200, weight: 700 });
      caption(ctx, 'g1', a, lt, CS.g1);
      caption(ctx, 'g2', a, lt, CS.g2);
    },

    sched(ctx, t) {
      const a = chapterAlpha(T, 'sched', t), lt = t - T.sched[0];
      chapterTag(ctx, '02', 'Goroutines and threads', a);
      GRID.forEach((d, i) => {
        const k = easeOut(range(lt, sp('g3', 0.1) + i * 0.012, sp('g3', 0.1) + i * 0.012 + 0.4));
        glowDot(ctx, d.x, d.y, 9, TINTS[d.c], a * k);
      });
      const n = Math.round(10000 * easeOut(range(lt, sp('g3', 0.1), sp('g3', 0.95))));
      label(ctx, `${n.toLocaleString('en-US')} goroutines`, CX, 520, { size: 54, weight: 700, color: C.text, alpha: a * range(lt, sp('g3', 0.1), sp('g3', 0.1) + 0.5) });
      label(ctx, '~2 KB each', CX, 568, { size: 26, mono: true, color: C.dim, alpha: a * range(lt, sp('g3', 0.7), sp('g3', 0.7) + 0.6), weight: 500 });
      const lk = easeOut(range(lt, CS.g4 + 0.2, CS.g4 + 0.9));
      for (let i = 0; i < 4; i++) {
        const y = 650 + i * 62;
        ctx.save(); ctx.globalAlpha = a * lk * 0.8; ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.roundRect(300, y - 20, 1320, 40, 20); ctx.fill(); ctx.restore();
        label(ctx, `OS thread ${i + 1}`, 270, y, { size: 22, mono: true, color: C.dim, align: 'right', alpha: a * lk, weight: 500 });
        for (let j = 0; j < 8; j++) {
          const x = 300 + (((lt - CS.g4) * 130 + j * 165 + i * 47) % 1320 + 1320) % 1320;
          glowDot(ctx, x, y, 11, TINTS[(i + j) % 5], a * lk * range(x, 300, 360) * (1 - range(x, 1560, 1620)));
        }
      }
      label(ctx, 'Go scheduler  ↓', CX, 610, { size: 26, mono: true, color: C.gold, alpha: a * lk, weight: 700 });
      caption(ctx, 'g3', a, lt, CS.g3);
      caption(ctx, 'g4', a, lt, CS.g4);
    },

    chan(ctx, t) {
      const a = chapterAlpha(T, 'chan', t), lt = t - T.chan[0];
      chapterTag(ctx, '03', 'Channels', a);
      const nk = easeOut(range(lt, 0.3, 1.0));
      [[520, 'goroutine A'], [1400, 'goroutine B']].forEach(([x, name]) => {
        glowDot(ctx, x, 440, 80, GO, a * nk * 0.3);
        ctx.save(); ctx.globalAlpha = a * nk; ctx.strokeStyle = GO; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, 440, 80, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        label(ctx, name, x, 570, { size: 28, mono: true, color: GO, alpha: a * nk, weight: 600 });
      });
      const ck = easeOut(range(lt, sp('g5', 0.3), sp('g5', 0.3) + 0.7));
      ctx.save(); ctx.globalAlpha = a * ck; ctx.strokeStyle = C.gold; ctx.lineWidth = 5; ctx.lineCap = 'round';
      [410, 470].forEach((y) => { ctx.beginPath(); ctx.moveTo(PIPE[0][0], y); ctx.lineTo(PIPE[1][0], y); ctx.stroke(); }); ctx.restore();
      label(ctx, 'channel', CX, 360, { size: 32, mono: true, color: C.gold, alpha: a * ck, weight: 700 });
      for (let k = 0; k < 8; k++) {
        const u = (lt - sp('g5', 0.5) - k * 0.8) / 2.2;
        if (u <= 0 || u >= 1) continue;
        card(ctx, lerp(PIPE[0][0] + 30, PIPE[1][0] - 30, u), 440, TINTS[k % 5], a * ck, 70, 36);
      }
      const bad = 'communicate by sharing memory', good = 'share memory by communicating';
      const gk = easeOut(range(lt, sp('g6', 0.1), sp('g6', 0.1) + 0.7)), sk = easeOut(range(lt, sp('g6', 0.55), sp('g6', 0.55) + 0.7));
      label(ctx, bad, CX, 690, { size: 46, weight: 600, color: C.proton, alpha: a * gk * 0.7 });
      const w = measure(ctx, bad, 46, 600);
      ctx.save(); ctx.globalAlpha = a * gk * range(sk, 0, 1); ctx.strokeStyle = C.proton; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(CX - w / 2, 690); ctx.lineTo(CX - w / 2 + w * sk, 690); ctx.stroke(); ctx.restore();
      label(ctx, good, CX, 770, { size: 54, weight: 700, color: GREEN, alpha: a * sk });
      caption(ctx, 'g5', a, lt, CS.g5);
      caption(ctx, 'g6', a, lt, CS.g6);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 3;
      [['Simple.', C.electron], ['Fast.', C.gold], ['Concurrent.', GREEN]].forEach(([w, col], i) =>
        label(ctx, w, CX, CY - 150 + i * 150, { size: 100, weight: 700, color: col, alpha: a * range(lt, 0.5 + s * 0.3 * i, 1.3 + s * 0.3 * i) }));
    },
  },
});
