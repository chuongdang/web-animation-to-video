import { C, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, chip, token, panel, arrow, pathAt, card } from '/runtime/kit.js';

const { clamp, lerp, range, easeOut, easeInOut, fadeWindow, rng } = Scene;

const GREEN = '#7ee787', JAVA = '#ff8a5c';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- software-engineering/backend-runtimes/why-java`.
const TXT = {
  j1: 'Java was created so one program could run on [[any machine]]: [[write once, run anywhere:green]].',
  j2: 'The compiler turns source code into [[bytecode]], not machine code for one chip.',
  j3: 'Each platform has its own [[Java Virtual Machine]] that runs the same bytecode.',
  j4: 'The [[JIT compiler]] finds code that runs often, and turns those [[hot spots:copper]] into fast machine code.',
  j5: 'The [[garbage collector]] frees memory you no longer use, so you do not free it by hand.',
  j6: 'Strong typing, a huge ecosystem and mature tooling make Java a [[safe choice:green]] for large systems.',
};
const nar = await narration('software-engineering/backend-runtimes/why-java', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { code: ['j1', 'j2', 'j3'], jit: ['j4'], gc: ['j5'], why: ['j6'] });
const { CS, T } = P;
const sp = speech(nar, CS);

const MACH = [{ x: 400, name: 'Windows' }, { x: 960, name: 'Linux' }, { x: 1520, name: 'macOS' }];

// JIT: which bytecode line runs at each step (lines 2 and 5 are the hot loop)
const SEQ = [0, 2, 1, 2, 3, 2, 4, 5, 6, 5, 7, 5];
const LINE_W = [300, 420, 360, 240, 330, 400, 280, 220];
const HOT = [2, 5];

// GC: a heap of cells, some in use and some garbage
const rand = rng(8);
const CELLS = Array.from({ length: 40 }, (_, i) => ({ x: 505 + (i % 10) * 100, y: 310 + Math.floor(i / 10) * 100, state: rand() < 0.28 ? 'empty' : rand() < 0.42 ? 'garbage' : 'live', c: i % 4 }));
const LIVE = CELLS.filter((c) => c.state === 'live').length, USED0 = CELLS.filter((c) => c.state !== 'empty').length;

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      MACH.forEach((m, i) => card(ctx, m.x + (i - 1) * 40, 190, JAVA, a * 0.3 * range(t, 0.5 + i * 0.2, 1.1 + i * 0.2), 240, 60));
      titleCard(ctx, t, T, { l1: 'Why', l2: 'Java?', sub: 'write once, run anywhere', tint: JAVA, size: 128 });
    },

    code(ctx, t) {
      const a = chapterAlpha(T, 'code', t), lt = t - T.code[0];
      chapterTag(ctx, '01', 'Bytecode and the JVM', a);
      const k = (id, f) => easeOut(range(lt, sp(id, f), sp(id, f) + 0.6));
      chip(ctx, 'Main.java', 280, 250, { color: C.dim, size: 40, alpha: a * k('j1', 0.2), w: 300 });
      label(ctx, 'write once', 430, 190, { size: 26, mono: true, color: GREEN, alpha: a * k('j1', 0.35), weight: 700 });
      label(ctx, 'run anywhere', CX, 480, { size: 26, mono: true, color: GREEN, alpha: a * k('j1', 0.6), weight: 700 });
      MACH.forEach((m, i) => {
        const pk = k('j1', 0.5 + i * 0.12);
        panel(ctx, m.x - 210, 520, 420, 300, C.dim, a * pk, 0.05, 22);
        label(ctx, m.name, m.x, 560, { size: 30, mono: true, color: C.dim, alpha: a * pk, weight: 600 });
      });
      arrow(ctx, 590, 250, 660, 250, C.dim, a * k('j2', 0.0));
      token(ctx, 'javac', 760, 250, C.gold, a * k('j2', 0.1), 28);
      arrow(ctx, 860, 250, 930, 250, C.dim, a * k('j2', 0.3));
      chip(ctx, 'Main.class', 950, 250, { color: JAVA, size: 40, alpha: a * k('j2', 0.4), w: 320, weight: 700 });
      label(ctx, 'bytecode', 1110, 310, { size: 26, mono: true, color: JAVA, alpha: a * k('j2', 0.55), weight: 600 });
      MACH.forEach((m, i) => {
        const u = k('j3', 0.25 + i * 0.12);
        if (u > 0) {
          ctx.save(); ctx.globalAlpha = a * u * 0.7; ctx.strokeStyle = JAVA; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
          ctx.beginPath(); ctx.moveTo(1110, 335); ctx.lineTo(lerp(1110, m.x, u), lerp(335, 515, u)); ctx.stroke(); ctx.restore();
        }
        chip(ctx, 'JVM', m.x - 110, 670, { color: C.electron, size: 40, alpha: a * k('j3', 0.05 + i * 0.12), w: 220, weight: 700 });
        label(ctx, 'runs Main.class', m.x, 760, { size: 22, mono: true, color: JAVA, alpha: a * k('j3', 0.6 + i * 0.1), weight: 500 });
      });
      caption(ctx, 'j1', a, lt, CS.j1);
      caption(ctx, 'j2', a, lt, CS.j2);
      caption(ctx, 'j3', a, lt, CS.j3);
    },

    jit(ctx, t) {
      const a = chapterAlpha(T, 'jit', t), lt = t - T.jit[0];
      chapterTag(ctx, '02', 'The JIT compiler', a);
      const pk = easeOut(range(lt, 0.2, 0.8));
      panel(ctx, 200, 250, 680, 400, C.dim, a * pk, 0.04, 22);
      panel(ctx, 1040, 250, 680, 400, JAVA, a * pk, 0.04, 22);
      label(ctx, 'bytecode', 540, 285, { size: 26, mono: true, color: C.dim, alpha: a * pk, weight: 700 });
      label(ctx, 'machine code', 1380, 285, { size: 26, mono: true, color: JAVA, alpha: a * pk, weight: 700 });
      const step = Math.floor((lt - 0.8) / 0.28), count = Array(8).fill(0);
      for (let s = 0; s <= step; s++) count[SEQ[s % SEQ.length]]++;
      const cur = step >= 0 ? SEQ[step % SEQ.length] : -1;
      LINE_W.forEach((w, i) => {
        const y = 330 + i * 36, hot = count[i] >= 4;
        ctx.save(); ctx.globalAlpha = a * pk * (i === cur ? 1 : 0.55); ctx.fillStyle = hot ? JAVA : i === cur ? C.text : C.dim;
        if (hot) { ctx.shadowColor = JAVA; ctx.shadowBlur = 14; }
        ctx.beginPath(); ctx.roundRect(250, y - 11, w, 22, 6); ctx.fill(); ctx.restore();
        if (HOT.includes(i)) {
          const mk = easeOut(range(count[i], 4, 5));
          if (mk > 0) { ctx.save(); ctx.globalAlpha = a * mk; ctx.fillStyle = JAVA; ctx.beginPath(); ctx.roundRect(1090, y - 11, w * 1.15, 22, 6); ctx.fill(); ctx.restore(); }
        }
      });
      const hk = easeOut(range(lt, sp('j4', 0.55), sp('j4', 0.55) + 0.7));
      label(ctx, 'hot spot', 960, 560, { size: 26, mono: true, color: JAVA, alpha: a * hk, weight: 700 });
      arrow(ctx, 890, 520, 1030, 520, JAVA, a * hk);
      // speed before / after
      const sk = easeOut(range(lt, sp('j4', 0.7), sp('j4', 0.7) + 1.2));
      label(ctx, 'interpreted', 480, 740, { size: 26, mono: true, color: C.dim, align: 'right', alpha: a * hk, weight: 600 });
      label(ctx, 'after JIT', 480, 810, { size: 26, mono: true, color: JAVA, align: 'right', alpha: a * hk, weight: 600 });
      [[740, 240, C.dim], [810, 240 + 900 * sk, JAVA]].forEach(([y, w, col]) => {
        ctx.save(); ctx.globalAlpha = a * hk; ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(520, y - 18, w, 36, 8); ctx.fill(); ctx.restore();
      });
      label(ctx, 'speed →', 520, 690, { size: 22, mono: true, color: C.dim, align: 'left', alpha: a * hk, weight: 500 });
      caption(ctx, 'j4', a, lt, CS.j4);
    },

    gc(ctx, t) {
      const a = chapterAlpha(T, 'gc', t), lt = t - T.gc[0];
      chapterTag(ctx, '03', 'Garbage collection', a);
      const pk = easeOut(range(lt, 0.2, 0.8));
      panel(ctx, 450, 250, 1020, 440, C.dim, a * pk, 0.04, 22);
      label(ctx, 'heap', 480, 285, { size: 24, mono: true, color: C.dim, align: 'left', alpha: a * pk, weight: 700 });
      const mark = range(lt, sp('j5', 0.3), sp('j5', 0.3) + 0.8), sweepU = easeInOut(range(lt, sp('j5', 0.55), sp('j5', 0.55) + 1.8));
      const sweepX = 470 + sweepU * 1000;
      CELLS.forEach((c, i) => {
        if (c.state === 'empty') return;
        const k = easeOut(range(lt, 0.4 + i * 0.015, 0.9 + i * 0.015));
        const swept = c.state === 'garbage' && sweepX > c.x;
        const col = c.state === 'live' && mark > 0 ? GREEN : mark > 0 && c.state === 'garbage' ? C.proton : TINTS_OF(c.c);
        card(ctx, c.x, c.y, col, a * k * (swept ? 0.08 : 1), 76, 76);
      });
      if (sweepU > 0 && sweepU < 1) {
        ctx.save(); ctx.globalAlpha = a * 0.9; ctx.strokeStyle = C.gold; ctx.lineWidth = 5; ctx.shadowColor = C.gold; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.moveTo(sweepX, 290); ctx.lineTo(sweepX, 670); ctx.stroke(); ctx.restore();
      }
      chip(ctx, 'in use', 520, 770, { color: GREEN, size: 32, alpha: a * mark, w: 200 });
      chip(ctx, 'garbage', 760, 770, { color: C.proton, size: 32, alpha: a * mark, w: 200 });
      chip(ctx, 'freed', 980, 770, { color: C.gold, size: 32, alpha: a * range(sweepU, 0.2, 0.6), w: 200 });
      const freed = easeOut(range(lt, sp('j5', 0.55) + 1.8, sp('j5', 0.55) + 2.4)), used = lerp(USED0, LIVE, Math.max(sweepU, freed));
      label(ctx, `memory in use: ${Math.round((used / 40) * 100)}%`, 1230, 770, { size: 30, mono: true, color: C.text, align: 'left', alpha: a * pk, weight: 600 });
      caption(ctx, 'j5', a, lt, CS.j5);
    },

    why(ctx, t) {
      const a = chapterAlpha(T, 'why', t), lt = t - T.why[0];
      chapterTag(ctx, '04', 'Why teams pick it', a);
      ['strong static typing', 'huge ecosystem', 'mature tooling', 'backward compatible'].forEach((s, i) => {
        const k = easeOut(range(lt, sp('j6', 0.05 + i * 0.18), sp('j6', 0.05 + i * 0.18) + 0.6));
        chip(ctx, s, 240 + (i % 2) * 740, 380 + Math.floor(i / 2) * 170, { color: i % 2 ? JAVA : GREEN, size: 46, alpha: a * k, w: 700, weight: 600 });
      });
      caption(ctx, 'j6', a, lt, CS.j6);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 3;
      label(ctx, 'Write once.', CX, CY - 60, { size: 100, weight: 700, color: JAVA, alpha: a * range(lt, 0.5, 1.3) });
      label(ctx, 'Run anywhere.', CX, CY + 70, { size: 100, weight: 700, color: GREEN, alpha: a * range(lt, 0.5 + s * 0.5, 1.3 + s * 0.5) });
    },
  },
});

function TINTS_OF(i) { return [C.electron, C.gold, '#c792ea', C.copper][i % 4]; }
