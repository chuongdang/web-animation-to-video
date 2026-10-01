import { C, CX, CY, MONO, label, chapterTag, narration, plan, speech, mount, chapterAlpha, titleCard, chip, panel, arrow, card, pathAt, glowDot, repeat } from '/runtime/kit.js';

const { clamp, lerp, range, easeOut, easeInOut, fadeWindow } = Scene;

const GREEN = '#7ee787', K8 = '#7aa2ff';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- software-engineering/containers/why-kubernetes`.
const TXT = {
  q1: 'Running one container is easy. Running [[hundreds]] of them across many machines is not.',
  q2: 'Kubernetes is a [[container orchestrator]]: you declare what you want, and it makes it happen.',
  q3: 'It [[schedules]] containers onto nodes with free capacity, so you never pick machines by hand.',
  q4: 'If a container, or a whole node, dies, Kubernetes [[heals itself:green]]: it starts replacements elsewhere.',
  q5: 'Need more capacity? Change the [[replica count]], or let it autoscale, and Kubernetes adds or removes pods.',
  q6: 'Updates are [[rolling]]: new pods replace old ones gradually, with no downtime.',
  q7: 'A [[service]] gives pods one stable address, and load balances traffic between them.',
};
const nar = await narration('software-engineering/containers/why-kubernetes', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { why: ['q1', 'q2'], nodes: ['q3', 'q4'], scale: ['q5', 'q6'], service: ['q7'] });
const { CS, T } = P;
const sp = speech(nar, CS);

const fade = (lt, at, d = 0.6) => easeOut(range(lt, at, at + d));

// ---- chapter 1: a heap of containers ---------------------------------------------------
const R = Scene.rng(7);
const HEAP = Array.from({ length: 30 }, (_, i) => ({ x: 200 + R() * 1520, y: 230 + R() * 420, c: [C.electron, C.gold, C.copper, '#c792ea', GREEN][i % 5], at: R() * 2.2 }));

// ---- chapter 2: nodes and pods ----------------------------------------------------------
const NX = [150, 700, 1250];
const slot = (n, i) => [NX[n] + 95 + (i % 3) * 165, 365 + Math.floor(i / 3) * 90];
const PODS = [0, 1, 2, 0, 1, 2].map((n, j, all) => ({ n, i: all.slice(0, j).filter((m) => m === n).length }));

// ---- chapter 3: replicas ----------------------------------------------------------------
const px = (i) => 330 + i * 250;

function pod(ctx, x, y, color, alpha, name) {
  card(ctx, x, y, color, alpha, 140, 56);
  label(ctx, name, x, y, { size: 22, mono: true, weight: 700, alpha });
}

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      for (let i = 0; i < 7; i++) card(ctx, 660 + i * 100, 190, K8, a * 0.4 * range(t, 0.3 + i * 0.1, 0.8 + i * 0.1), 70, 70);
      titleCard(ctx, t, T, { l1: 'Why', l2: 'Kubernetes?', sub: 'orchestrating containers at scale', tint: K8, size: 124 });
    },

    why(ctx, t) {
      const a = chapterAlpha(T, 'why', t), lt = t - T.why[0];
      chapterTag(ctx, '01', 'Too many containers', a);
      const gone = 1 - range(lt, sp('q2', 0.05), sp('q2', 0.05) + 0.8);
      HEAP.forEach((h) => card(ctx, h.x, h.y, h.c, a * gone * fade(lt, 0.3 + h.at), 110, 44));
      label(ctx, 'hundreds of containers · dozens of machines · who runs what?', CX, 760, { size: 28, mono: true, color: C.proton, alpha: a * gone * range(lt, sp('q1', 0.5), sp('q1', 0.5) + 0.7), weight: 600 });
      const k = fade(lt, sp('q2', 0.15), 0.8);
      panel(ctx, 220, 230, 540, 330, C.gold, a * k, 0.05, 20);
      label(ctx, 'desired state', 490, 275, { size: 28, mono: true, color: C.gold, alpha: a * k, weight: 700 });
      ['image: shop:1.0', 'replicas: 3', 'cpu: 500m'].forEach((s, i) => chip(ctx, s, 270, 360 + i * 70, { color: C.gold, size: 28, alpha: a * k, w: 440, family: MONO }));
      arrow(ctx, 790, 390, 940, 390, C.dim, a * fade(lt, sp('q2', 0.4)), 4);
      chip(ctx, 'Kubernetes', 960, 390, { color: K8, size: 40, alpha: a * fade(lt, sp('q2', 0.4)), w: 340, weight: 700 });
      arrow(ctx, 1330, 390, 1480, 390, C.dim, a * fade(lt, sp('q2', 0.6)), 4);
      chip(ctx, 'cluster ✓', 1500, 390, { color: GREEN, size: 36, alpha: a * fade(lt, sp('q2', 0.6)), w: 240, family: MONO });
      label(ctx, 'you say what · Kubernetes works out how', CX, 700, { size: 30, mono: true, color: C.text, alpha: a * fade(lt, sp('q2', 0.7)), weight: 600 });
      caption(ctx, 'q1', a, lt, CS.q1);
      caption(ctx, 'q2', a, lt, CS.q2);
    },

    nodes(ctx, t) {
      const a = chapterAlpha(T, 'nodes', t), lt = t - T.nodes[0];
      chapterTag(ctx, '02', 'Scheduling and self-healing', a);
      const crashAt = sp('q4', 0.45), crash = range(lt, crashAt, crashAt + 0.5), heal = easeInOut(range(lt, crashAt + 1.3, crashAt + 2.3));
      NX.forEach((x, n) => {
        const k = fade(lt, 0.2 + n * 0.2), dead = n === 1 ? crash : 0;
        panel(ctx, x, 250, 520, 330, dead > 0.5 ? C.proton : C.dim, a * k, 0.05, 22);
        label(ctx, `node ${n + 1}`, x + 260, 295, { size: 28, mono: true, color: dead > 0.5 ? C.proton : C.dim, alpha: a * k, weight: 700 });
      });
      chip(ctx, 'scheduler', CX - 140, 160, { color: K8, size: 32, alpha: a * fade(lt, 0.4), w: 280, family: MONO });
      PODS.forEach((p, j) => {
        const start = sp('q3', 0.15) + j * 0.5, u = easeInOut(range(lt, start, start + 0.9));
        if (u <= 0) return;
        const [x, y] = slot(p.n, p.i);
        const dead = p.n === 1 ? crash : 0;
        const moved = p.n === 1 && heal > 0;
        const target = slot(p.i === 0 ? 0 : 2, 2);
        const px0 = moved ? lerp(x, target[0], heal) : lerp(CX, x, u), py0 = moved ? lerp(y, target[1], heal) : lerp(190, y, u);
        pod(ctx, px0, py0, dead > 0.5 && !moved ? C.proton : C.gold, a * (moved ? lerp(0.3, 1, heal) : 1 - 0.7 * dead), `web-${j + 1}`);
      });
      label(ctx, '✕', NX[1] + 260, 440, { size: 150, color: C.proton, alpha: a * crash * 0.8 * (1 - heal), weight: 700 });
      label(ctx, 'replacements start on healthy nodes', CX, 700, { size: 30, mono: true, color: GREEN, alpha: a * range(heal, 0.3, 1), weight: 700 });
      label(ctx, 'picks a node with free CPU and memory', CX, 700, { size: 28, mono: true, color: C.dim, alpha: a * range(lt, sp('q3', 0.5), sp('q3', 0.5) + 0.6) * (1 - range(lt, CS.q4, CS.q4 + 0.5)), weight: 600 });
      caption(ctx, 'q3', a, lt, CS.q3);
      caption(ctx, 'q4', a, lt, CS.q4);
    },

    scale(ctx, t) {
      const a = chapterAlpha(T, 'scale', t), lt = t - T.scale[0];
      chapterTag(ctx, '03', 'Scaling and rolling updates', a);
      const up = sp('q5', 0.4), isRoll = lt >= CS.q6 - 0.2;
      const title = isRoll ? 'image: shop:1.0 → shop:2.0' : `replicas: ${lt < up ? 3 : 6}`;
      label(ctx, title, CX, 250, { size: 44, mono: true, color: C.gold, weight: 700, alpha: a * fade(lt, 0.3) });
      label(ctx, 'autoscale: add pods when CPU > 70%', CX, 330, { size: 26, mono: true, color: C.dim, alpha: a * range(lt, sp('q5', 0.6), sp('q5', 0.6) + 0.6) * (isRoll ? 0 : 1), weight: 600 });
      for (let i = 0; i < 6; i++) {
        const k = i < 3 ? fade(lt, 0.4 + i * 0.15) : fade(lt, up + (i - 3) * 0.25);
        const ui = sp('q6', 0.25) + i * 0.7, st = lt < ui ? 0 : lt < ui + 0.55 ? 1 : 2;
        pod(ctx, px(i), 480, st === 2 ? GREEN : K8, a * k * (st === 1 ? 0.3 : 1), st === 2 ? 'v2' : 'v1');
      }
      label(ctx, 'never all down at once → zero downtime', CX, 640, { size: 30, mono: true, color: GREEN, alpha: a * range(lt, sp('q6', 0.3), sp('q6', 0.3) + 0.7), weight: 700 });
      caption(ctx, 'q5', a, lt, CS.q5);
      caption(ctx, 'q6', a, lt, CS.q6);
    },

    service(ctx, t) {
      const a = chapterAlpha(T, 'service', t), lt = t - T.service[0];
      chapterTag(ctx, '04', 'Services', a);
      const k = fade(lt, 0.3);
      chip(ctx, 'client', 160, 460, { color: C.electron, size: 34, alpha: a * k, w: 200 });
      chip(ctx, 'Service: shop', 640, 460, { color: K8, size: 34, alpha: a * fade(lt, 0.5), w: 320, weight: 700 });
      label(ctx, 'shop.default.svc : 80', 800, 540, { size: 24, mono: true, color: C.dim, alpha: a * fade(lt, 0.8), weight: 600 });
      arrow(ctx, 380, 460, 620, 460, C.dim, a * k, 3);
      [300, 460, 620].forEach((y, i) => {
        const kk = fade(lt, 0.6 + i * 0.2);
        arrow(ctx, 980, 460, 1240, y, C.dim, a * kk, 3);
        pod(ctx, 1380, y, C.gold, a * kk, `shop-${i + 1}`);
      });
      const t0 = sp('q7', 0.35), per = 0.8, n = Math.floor((lt - t0) / per), u = repeat(lt, t0, per, 0.75);
      if (u >= 0) {
        const [x, y] = pathAt([[380, 460], [800, 460], [1240, [300, 460, 620][n % 3]], [1300, [300, 460, 620][n % 3]]], easeInOut(u));
        glowDot(ctx, x, y, 12, C.electron, a);
      }
      label(ctx, 'pods come and go · the address stays', CX, 790, { size: 30, mono: true, color: C.text, alpha: a * range(lt, sp('q7', 0.5), sp('q7', 0.5) + 0.7), weight: 600 });
      caption(ctx, 'q7', a, lt, CS.q7);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 3;
      [['Declare.', C.gold], ['Schedule.', K8], ['Heal.', GREEN]].forEach(([w, col], i) =>
        label(ctx, w, CX, CY - 150 + i * 150, { size: 100, weight: 700, color: col, alpha: a * range(lt, 0.5 + s * 0.3 * i, 1.3 + s * 0.3 * i) }));
    },
  },
});
