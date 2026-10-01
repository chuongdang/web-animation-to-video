import { C, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, chip, token, panel, arrow, pathAt, card } from '/runtime/kit.js';

const { clamp, lerp, range, easeOut, easeInOut, fadeWindow } = Scene;

const GREEN = '#7ee787', NODE = '#7ee787';
const TINTS = [C.electron, C.gold, C.copper];

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- software-engineering/backend-runtimes/why-nodejs`.
const TXT = {
  n1: 'Node.js runs [[JavaScript]] outside the browser, on Chrome\'s [[V8 engine]].',
  n2: 'Most servers spend their time [[waiting:proton]] on databases, files and networks.',
  n3: 'Instead of one thread per request, Node uses [[one thread]] and an [[event loop]].',
  n4: 'A slow operation is [[handed off:electron]]. When it finishes, its [[callback]] is queued and run.',
  n5: 'Thousands of connections stay cheap, but one [[heavy calculation:proton]] blocks everyone.',
  n6: 'So Node shines at [[I/O-heavy work:green]], and uses [[worker threads]] for heavy CPU jobs.',
};
const nar = await narration('software-engineering/backend-runtimes/why-nodejs', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { what: ['n1'], wait: ['n2'], loop: ['n3', 'n4'], trade: ['n5', 'n6'] });
const { CS, T } = P;
const sp = speech(nar, CS);

// event loop diagram geometry
const STACK = [230, 300, 400, 420], IO = [1260, 260, 460, 200], QUEUE = [1260, 520, 460, 200];

// where request `i` is, `s` seconds after it starts: stack -> I/O (slow work) -> callback queue -> stack
function tokenPos(s) {
  const seg = (a, b, from, to) => [lerp(from[0], to[0], easeInOut(range(s, a, b))), lerp(from[1], to[1], easeInOut(range(s, a, b)))];
  if (s < 1.0) return seg(0, 1.0, [640, 480], [1400, 360]);
  if (s < 2.2) return [1400 + Math.sin(s * 9) * 10, 360];
  if (s < 3.0) return seg(2.2, 3.0, [1400, 360], [1400, 620]);
  if (s < 3.5) return [1400, 620];
  return seg(3.5, 4.6, [1400, 620], [640, 560]);
}

// the timeline of the single thread: many short tasks, one heavy block, short tasks again
const BLOCKS = [...Array(8).fill(54), 600, ...Array(6).fill(54)];

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      ctx.save(); ctx.globalAlpha = a * 0.3 * range(t, 0.5, 1.5); ctx.strokeStyle = NODE; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.ellipse(CX, 190, 140, 50, 0, Math.PI * 0.1, Math.PI * 1.8); ctx.stroke(); ctx.restore();
      titleCard(ctx, t, T, { l1: 'Why', l2: 'Node.js?', sub: 'one thread, an event loop', tint: NODE, size: 128 });
    },

    what(ctx, t) {
      const a = chapterAlpha(T, 'what', t), lt = t - T.what[0];
      chapterTag(ctx, '01', 'JavaScript on the server', a);
      [[300, 'Browser', C.dim, ['JavaScript', 'V8', 'DOM · window']], [1040, 'Node.js', NODE, ['JavaScript', 'V8', 'files · network · OS']]].forEach(([x, name, col, items], pi) => {
        const pk = easeOut(range(lt, 0.2 + pi * 0.3, 0.8 + pi * 0.3));
        panel(ctx, x, 270, 580, 440, col, a * pk, 0.05, 24);
        label(ctx, name, x + 290, 320, { size: 36, mono: true, color: col, alpha: a * pk, weight: 700 });
        items.forEach((s, i) => {
          const k = easeOut(range(lt, 0.7 + pi * 0.3 + i * 0.2, 1.3 + pi * 0.3 + i * 0.2)), isV8 = i === 1;
          chip(ctx, s, x + 90, 420 + i * 100, { color: isV8 ? C.gold : col === C.dim ? C.electron : NODE, size: 38, alpha: a * k * (isV8 ? 0.85 + 0.15 * Math.sin(lt * 4) : 1), w: 400, weight: 600 });
        });
      });
      caption(ctx, 'n1', a, lt, CS.n1);
    },

    wait(ctx, t) {
      const a = chapterAlpha(T, 'wait', t), lt = t - T.wait[0];
      chapterTag(ctx, '02', 'Servers mostly wait', a);
      label(ctx, 'one thread per request: each thread is mostly idle', CX, 250, { size: 30, mono: true, color: C.dim, alpha: a * range(lt, 0.3, 0.9), weight: 600 });
      for (let i = 0; i < 3; i++) {
        const y = 380 + i * 130, p = easeInOut(range(lt, sp('n2', 0.1 + i * 0.12), sp('n2', 0.1 + i * 0.12) + 2.4)), k = range(lt, 0.4 + i * 0.2, 1.0 + i * 0.2);
        label(ctx, `thread ${i + 1}`, 240, y, { size: 26, mono: true, color: C.dim, align: 'left', alpha: a * k, weight: 600 });
        ctx.save(); ctx.globalAlpha = a * k * 0.8; ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.beginPath(); ctx.roundRect(440, y - 28, 1240, 56, 12); ctx.fill(); ctx.restore();
        // work (short) -> wait for the database (long) -> work (short)
        const segs = [[0, 0.07, C.electron], [0.07, 0.93, C.proton], [0.93, 1, C.electron]];
        segs.forEach(([s0, s1, col]) => {
          const w = Math.max(0, Math.min(p, s1) - s0) * 1240;
          if (w <= 0) return;
          ctx.save(); ctx.globalAlpha = a * k * (col === C.proton ? 0.4 : 1); ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(440 + s0 * 1240, y - 28, w, 56, 10); ctx.fill(); ctx.restore();
        });
        label(ctx, 'waiting for the database…', 1060, y, { size: 26, mono: true, color: C.proton, alpha: a * k * range(p, 0.2, 0.3), weight: 600 });
      }
      chip(ctx, 'work', 440, 790, { color: C.electron, size: 30, alpha: a * range(lt, 1.5, 2.0), w: 150 });
      chip(ctx, 'waiting', 620, 790, { color: C.proton, size: 30, alpha: a * range(lt, 1.5, 2.0), w: 170 });
      caption(ctx, 'n2', a, lt, CS.n2);
    },

    loop(ctx, t) {
      const a = chapterAlpha(T, 'loop', t), lt = t - T.loop[0];
      chapterTag(ctx, '03', 'The event loop', a);
      const k = easeOut(range(lt, 0.3, 1.0));
      panel(ctx, ...STACK, NODE, a * k, 0.06, 22);
      label(ctx, 'call stack', STACK[0] + STACK[2] / 2, STACK[1] + 36, { size: 28, mono: true, color: NODE, alpha: a * k, weight: 700 });
      label(ctx, 'ONE THREAD', STACK[0] + STACK[2] / 2, STACK[1] - 30, { size: 24, mono: true, color: C.gold, alpha: a * range(lt, sp('n3', 0.2), sp('n3', 0.2) + 0.6), weight: 700 });
      // the loop arrow in the middle
      const lk = easeOut(range(lt, sp('n3', 0.55), sp('n3', 0.55) + 0.7));
      ctx.save(); ctx.globalAlpha = a * lk; ctx.strokeStyle = C.gold; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(945, 510, 90, 0.5, Math.PI * 2 - 0.5); ctx.stroke();
      const ea = Math.PI * 2 - 0.5, ex = 945 + Math.cos(ea) * 90, ey = 510 + Math.sin(ea) * 90;
      ctx.fillStyle = C.gold; ctx.beginPath(); ctx.moveTo(ex + 22, ey + 6); ctx.lineTo(ex - 12, ey - 14); ctx.lineTo(ex - 8, ey + 22); ctx.closePath(); ctx.fill(); ctx.restore();
      label(ctx, 'event loop', 945, 510, { size: 26, mono: true, color: C.gold, alpha: a * lk, weight: 700 });
      const ik = easeOut(range(lt, sp('n4', 0.0), sp('n4', 0.0) + 0.7));
      panel(ctx, ...IO, C.electron, a * ik, 0.06, 22);
      label(ctx, 'libuv · OS (files, network)', IO[0] + IO[2] / 2, IO[1] + 36, { size: 24, mono: true, color: C.electron, alpha: a * ik, weight: 700 });
      panel(ctx, ...QUEUE, C.copper, a * ik, 0.06, 22);
      label(ctx, 'callback queue', QUEUE[0] + QUEUE[2] / 2, QUEUE[1] + 36, { size: 24, mono: true, color: C.copper, alpha: a * ik, weight: 700 });
      ['A', 'B', 'C'].forEach((n, i) => {
        const s = lt - (sp('n4', 0.15) + i * 0.5);
        if (s <= 0 || s > 4.8) return;
        const [x, y] = tokenPos(s);
        card(ctx, x, y, TINTS[i], a * (1 - range(s, 4.4, 4.8)), 70, 50);
        label(ctx, n, x, y + 1, { size: 28, weight: 700, mono: true, alpha: a * (1 - range(s, 4.4, 4.8)) });
        if (s > 0.9 && s < 1.1) glowDot(ctx, x, y, 30, TINTS[i], a * 0.3);
      });
      caption(ctx, 'n3', a, lt, CS.n3);
      caption(ctx, 'n4', a, lt, CS.n4);
    },

    trade(ctx, t) {
      const a = chapterAlpha(T, 'trade', t), lt = t - T.trade[0];
      chapterTag(ctx, '04', 'The trade-off', a);
      const y = 560, x0 = 240, total = BLOCKS.reduce((s, w) => s + w + 8, 0);
      label(ctx, 'event loop thread', x0, y - 100, { size: 26, mono: true, color: C.dim, align: 'left', alpha: a * range(lt, 0.3, 0.9), weight: 600 });
      const ph = x0 + total * easeInOut(range(lt, 0.5, sp('n5', 0.95)));
      let x = x0, heavyStart = 0, heavyW = 0;
      BLOCKS.forEach((w) => {
        const heavy = w > 100, drawn = Math.max(0, Math.min(w, ph - x));
        if (heavy) { heavyStart = x; heavyW = w; }
        if (drawn > 0) {
          ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = heavy ? C.proton : C.electron; ctx.beginPath(); ctx.roundRect(x, y - 30, drawn, 60, 8); ctx.fill(); ctx.restore();
        }
        x += w + 8;
      });
      if (heavyW) label(ctx, 'heavy calculation', heavyStart + heavyW / 2, y, { size: 26, mono: true, color: C.bg, weight: 700, alpha: a * range(ph, heavyStart + 200, heavyStart + 300) });
      // requests pile up while the loop is blocked, then are served
      const prog = range(ph, heavyStart, heavyStart + heavyW);
      for (let i = 0; i < 5; i++) {
        const k = range(prog, 0.1 + i * 0.16, 0.2 + i * 0.16), served = range(ph, heavyStart + heavyW + i * 25, heavyStart + heavyW + i * 25 + 40);
        card(ctx, heavyStart + 60 + i * 110, 430 - i * 0, served > 0.5 ? C.electron : C.proton, a * k, 96, 44);
        label(ctx, served > 0.5 ? 'ok' : 'waiting', heavyStart + 60 + i * 110, 431, { size: 18, mono: true, weight: 600, alpha: a * k });
      }
      const fk = (f) => easeOut(range(lt, sp('n6', f), sp('n6', f) + 0.6));
      ['APIs', 'chat', 'streaming'].forEach((s, i) => chip(ctx, s, 300 + i * 260, 790, { color: GREEN, size: 36, alpha: a * fk(0.25 + i * 0.1), w: 220 }));
      chip(ctx, 'worker threads', 1120, 790, { color: C.gold, size: 36, alpha: a * fk(0.7), w: 380 });
      label(ctx, 'good fit', 560, 725, { size: 24, mono: true, color: GREEN, alpha: a * fk(0.25), weight: 600 });
      label(ctx, 'for heavy CPU jobs', 1310, 725, { size: 24, mono: true, color: C.gold, alpha: a * fk(0.7), weight: 600 });
      caption(ctx, 'n5', a, lt, CS.n5);
      caption(ctx, 'n6', a, lt, CS.n6);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      label(ctx, 'Never block', CX, CY - 60, { size: 100, weight: 700, color: GREEN, alpha: a * range(lt, 0.5, 1.3) });
      label(ctx, 'the loop.', CX, CY + 70, { size: 100, weight: 700, color: C.gold, alpha: a * range(lt, 1.2, 2.0) });
    },
  },
});
