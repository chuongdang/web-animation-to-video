import { C, CX, CY, label, chapterTag, narration, plan, speech, mount, chapterAlpha, titleCard, panel, arrow, card, treeNode, chip, edge, cycle } from '/runtime/kit.js';

const { range, easeOut, fadeWindow } = Scene;

const GREEN = '#7ee787', K8 = '#7aa2ff';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- software-engineering/kubernetes-internals/controllers`.
const TXT = {
  r1: 'Kubernetes is built on [[control loops]]. A controller watches the current state and compares it to the desired state.',
  r2: 'A Deployment asks for [[three replicas]]. The controller looks, and finds only two pods running.',
  r3: 'So it creates one more pod. The loop never stops: [[observe, compare, act:green]].',
  r4: 'That is why Kubernetes is [[declarative]]. You state the goal, and controllers keep reality matching it, even after failures.',
  r5: 'A Deployment manages a [[ReplicaSet]], and the ReplicaSet manages the [[pods]]. Each layer has its own controller.',
  r6: 'The [[kubelet]] runs a loop too: it makes sure the containers on its node match the pods assigned to it.',
};
const nar = await narration('software-engineering/kubernetes-internals/controllers', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { loop: ['r1'], fix: ['r2', 'r3', 'r4'], layers: ['r5', 'r6'] });
const { CS, T } = P;
const sp = speech(nar, CS);

const fade = (lt, at, d = 0.6) => easeOut(range(lt, at, at + d));

const SLOT = [480, 960, 1440];
const TIER = [[960, 230], [960, 370]];
const PODX = [620, 960, 1300];

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      cycle(ctx, CX, 190, 150, 50, [{ text: '', color: C.electron }, { text: '', color: C.gold }, { text: '', color: GREEN }], { alpha: a * 0.4, reveal: 3 * range(t, 0.3, 1.5), size: 14 });
      titleCard(ctx, t, T, { l1: 'Controllers and', l2: 'reconciliation', sub: 'the loop that keeps Kubernetes honest', tint: K8, size: 112 });
    },

    loop(ctx, t) {
      const a = chapterAlpha(T, 'loop', t), lt = t - T.loop[0];
      chapterTag(ctx, '01', 'The control loop', a);
      const rev = range(lt, 0.4, 2.2) * 3;
      cycle(ctx, CX, 470, 330, 210, [{ text: 'observe', color: C.electron }, { text: 'compare', color: C.gold }, { text: 'act', color: GREEN }],
        { alpha: a, reveal: rev, active: lt > 2.4 ? Math.floor(lt * 0.7) % 3 : -1, size: 34 });
      label(ctx, 'controller', CX, 480, { size: 34, mono: true, color: C.dim, alpha: a * fade(lt, 1.2), weight: 700 });
      const k = fade(lt, sp('r1', 0.35));
      chip(ctx, 'desired state', 120, 300, { color: C.gold, size: 32, alpha: a * k, w: 360 });
      chip(ctx, 'actual state', 1440, 300, { color: C.electron, size: 32, alpha: a * k, w: 360 });
      arrow(ctx, 490, 300, 820, 330, C.dim, a * k, 3);
      arrow(ctx, 1430, 300, 1100, 330, C.dim, a * k, 3);
      caption(ctx, 'r1', a, lt, CS.r1);
    },

    fix(ctx, t) {
      const a = chapterAlpha(T, 'fix', t), lt = t - T.fix[0];
      chapterTag(ctx, '02', 'Closing the gap', a);
      const spawnAt = sp('r3', 0.2), crashAt = sp('r4', 0.5), backAt = crashAt + 1.2;
      const spawned = lt >= spawnAt, crashed = lt >= crashAt && lt < backAt;
      const actual = 2 + (spawned ? 1 : 0) - (crashed ? 1 : 0);
      chip(ctx, 'desired: 3', 380, 250, { color: C.gold, size: 36, alpha: a * fade(lt, 0.3), w: 280 });
      chip(ctx, `actual: ${actual}`, 1340, 250, { color: actual === 3 ? GREEN : C.proton, size: 36, alpha: a * fade(lt, 0.5), w: 280 });
      SLOT.forEach((x, i) => {
        const k = fade(lt, 0.5 + i * 0.2);
        if (i === 2 && !spawned) { treeNode(ctx, 'missing', x, 480, C.dim, a * k, { w: 220, size: 28, dashed: true, fill: 0.04 }); return; }
        if (i === 2) {
          const g = easeOut(range(lt, spawnAt, spawnAt + 0.6));
          card(ctx, x, 480, GREEN, a * g, 220 * g + 20, 110); label(ctx, 'pod-3', x, 480, { size: 30, mono: true, weight: 700, alpha: a * g });
          return;
        }
        if (i === 0 && crashed) {
          card(ctx, x, 480, C.proton, a * 0.5, 220, 110); label(ctx, '✕', x, 480, { size: 90, color: C.proton, alpha: a, weight: 700 });
          return;
        }
        const reborn = i === 0 && lt >= backAt;
        const g = reborn ? easeOut(range(lt, backAt, backAt + 0.5)) : 1;
        card(ctx, x, 480, reborn ? GREEN : C.gold, a * k * g, 220, 110);
        label(ctx, reborn ? 'pod-4' : `pod-${i + 1}`, x, 480, { size: 30, mono: true, weight: 700, alpha: a * k * g });
      });
      const cmpAt = sp('r2', 0.5);
      label(ctx, actual === 3 ? '3 = 3 ✓ nothing to do' : `${actual} ≠ 3 → create ${3 - actual}`, CX, 640, { size: 34, mono: true, color: actual === 3 ? GREEN : C.proton, alpha: a * range(lt, cmpAt, cmpAt + 0.6), weight: 700 });
      label(ctx, 'you declare the goal · controllers keep it true', CX, 780, { size: 28, mono: true, color: C.text, alpha: a * range(lt, sp('r4', 0.3), sp('r4', 0.3) + 0.7), weight: 600 });
      caption(ctx, 'r2', a, lt, CS.r2);
      caption(ctx, 'r3', a, lt, CS.r3);
      caption(ctx, 'r4', a, lt, CS.r4);
    },

    layers(ctx, t) {
      const a = chapterAlpha(T, 'layers', t), lt = t - T.layers[0];
      chapterTag(ctx, '03', 'Layers of controllers', a);
      const k0 = fade(lt, 0.3), k1 = fade(lt, sp('r5', 0.3)), k2 = fade(lt, sp('r5', 0.6));
      treeNode(ctx, 'Deployment', TIER[0][0], TIER[0][1], C.gold, a * k0, { size: 32 });
      label(ctx, 'Deployment controller', 1130, TIER[0][1], { size: 22, mono: true, color: C.dim, align: 'left', alpha: a * k0, weight: 600 });
      edge(ctx, 960, TIER[0][1] + 30, 960, TIER[1][1] - 30, a * k1);
      treeNode(ctx, 'ReplicaSet', TIER[1][0], TIER[1][1], C.electron, a * k1, { size: 32 });
      label(ctx, 'ReplicaSet controller', 1130, TIER[1][1], { size: 22, mono: true, color: C.dim, align: 'left', alpha: a * k1, weight: 600 });
      PODX.forEach((x, i) => {
        edge(ctx, 960, TIER[1][1] + 30, x, 495, a * k2);
        card(ctx, x, 520, GREEN, a * k2, 200, 52);
        label(ctx, `pod-${i + 1}`, x, 520, { size: 26, mono: true, weight: 700, alpha: a * k2 });
      });
      const k3 = fade(lt, sp('r6', 0.2));
      panel(ctx, 280, 620, 1260, 200, C.dim, a * k3, 0.04, 20);
      label(ctx, 'node 1', 1480, 650, { size: 22, mono: true, color: C.dim, alpha: a * k3, weight: 600 });
      treeNode(ctx, 'kubelet', 400, 730, C.electron, a * k3, { w: 190, size: 28, fill: 0.4 });
      PODX.forEach((x, i) => {
        arrow(ctx, x, 548, x, 700, C.dim, a * k3 * 0.7, 2.5);
        card(ctx, x, 740, C.gold, a * k3, 190, 50);
        label(ctx, 'container', x, 740, { size: 22, mono: true, weight: 700, alpha: a * k3 });
      });
      label(ctx, 'pods assigned ↔ containers running', CX, 860, { size: 26, mono: true, color: C.electron, alpha: a * range(lt, sp('r6', 0.5), sp('r6', 0.5) + 0.7), weight: 600 });
      caption(ctx, 'r5', a, lt, CS.r5);
      caption(ctx, 'r6', a, lt, CS.r6);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 3;
      [['Observe.', C.electron], ['Compare.', C.gold], ['Act.', GREEN]].forEach(([w, col], i) =>
        label(ctx, w, CX, CY - 150 + i * 150, { size: 100, weight: 700, color: col, alpha: a * range(lt, 0.5 + s * 0.3 * i, 1.3 + s * 0.3 * i) }));
    },
  },
});
