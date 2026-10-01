import { C, CX, CY, MONO, label, chapterTag, narration, plan, speech, mount, chapterAlpha, titleCard, panel, arrow, card, treeNode, chip } from '/runtime/kit.js';

const { lerp, range, easeOut, easeInOut, fadeWindow } = Scene;

const GREEN = '#7ee787', K8 = '#7aa2ff';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- software-engineering/kubernetes-internals/scheduler`.
const TXT = {
  s1: 'When you create a pod, it has no node yet. The [[scheduler]] watches for these unassigned pods.',
  s2: 'For each pod, it first [[filters]] out the nodes that cannot run it: not enough CPU or memory, or a taint the pod does not tolerate.',
  s3: 'Then it [[scores]] the remaining nodes, preferring those with more free resources.',
  s4: 'The pod goes to the highest score. The scheduler only writes the [[node name]] into the pod. The kubelet does the rest.',
  s5: 'You can guide it with [[resource requests]], node selectors, affinity rules, and taints and tolerations.',
};
const nar = await narration('software-engineering/kubernetes-internals/scheduler', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { queue: ['s1'], pick: ['s2', 's3', 's4'], hints: ['s5'] });
const { CS, T } = P;
const sp = speech(nar, CS);

const fade = (lt, at, d = 0.6) => easeOut(range(lt, at, at + d));

const NODES = [
  { name: 'node-1', used: 92, why: 'not enough CPU' },
  { name: 'node-2', used: 30, why: 'taint: gpu-only' },
  { name: 'node-3', used: 60, score: 55 },
  { name: 'node-4', used: 35, score: 90 },
];
const NY = (i) => 250 + i * 150;
const POD = [240, 520], SCHED = [640, 520], WIN = [1690, NY(3)];

/** pods, scheduler and the four candidate nodes; f / g / h = filter / score / bind progress */
function board(ctx, a, lt, { f = 0, g = 0, h = 0, rv = false } = {}) {
  const k = (at) => (rv ? fade(lt, at) : 1);
  card(ctx, lerp(POD[0], WIN[0], h), lerp(POD[1], WIN[1], h), C.gold, a * k(0.3), lerp(150, 110, h), lerp(60, 46, h));
  label(ctx, 'web-4', lerp(POD[0], WIN[0], h), lerp(POD[1], WIN[1], h), { size: lerp(26, 20, h), mono: true, weight: 700, alpha: a * k(0.3) });
  label(ctx, 'nodeName: —', POD[0], 590, { size: 22, mono: true, color: C.proton, alpha: a * k(0.5) * (1 - h), weight: 600 });
  label(ctx, 'Pending', POD[0], 450, { size: 24, mono: true, color: C.gold, alpha: a * k(0.5) * (1 - h), weight: 700 });
  treeNode(ctx, 'scheduler', SCHED[0], SCHED[1], K8, a * k(0.6), { w: 260, size: 32, fill: 0.3 });
  arrow(ctx, 340, 520, 500, 520, C.dim, a * k(0.7), 3);
  NODES.forEach((n, i) => {
    const y = NY(i), kk = k(0.8 + i * 0.15), out = n.why ? f : 0;
    const al = a * kk * (1 - 0.65 * out);
    arrow(ctx, 790, 520, 1040, y, C.dim, al * 0.7, 2.5);
    panel(ctx, 1050, y - 60, 710, 120, n.why && out > 0.5 ? C.proton : i === 3 && h > 0.5 ? GREEN : C.dim, al, 0.05, 18);
    label(ctx, n.name, 1085, y - 22, { size: 28, mono: true, align: 'left', alpha: al, weight: 700 });
    ctx.save(); ctx.globalAlpha = al * 0.25; ctx.fillStyle = C.dim; ctx.beginPath(); ctx.roundRect(1085, y + 12, 250, 20, 6); ctx.fill();
    ctx.globalAlpha = al; ctx.fillStyle = n.used > 80 ? C.proton : C.electron; ctx.beginPath(); ctx.roundRect(1085, y + 12, 250 * n.used / 100, 20, 6); ctx.fill(); ctx.restore();
    label(ctx, `cpu ${n.used}%`, 1350, y + 22, { size: 20, mono: true, color: C.dim, align: 'left', alpha: al, weight: 600 });
    if (n.why) label(ctx, `✕ ${n.why}`, 1490, y - 22, { size: 22, mono: true, color: C.proton, align: 'left', alpha: a * kk * out, weight: 700 });
    else label(ctx, `score ${n.score}`, 1490, y - 22, { size: 26, mono: true, color: n.score > 80 ? GREEN : C.gold, align: 'left', alpha: a * kk * g, weight: 700 });
  });
}

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      [0, 1, 2, 3].forEach((i) => treeNode(ctx, `node-${i + 1}`, 700 + i * 170, 190, K8, a * 0.45 * range(t, 0.3 + i * 0.15, 0.9 + i * 0.15), { w: 140, size: 24 }));
      titleCard(ctx, t, T, { l1: 'How the', l2: 'scheduler works', sub: 'which node gets the pod?', tint: K8, size: 112 });
    },

    queue(ctx, t) {
      const a = chapterAlpha(T, 'queue', t), lt = t - T.queue[0];
      chapterTag(ctx, '01', 'Unassigned pods', a);
      board(ctx, a, lt, { rv: true });
      const ring = (lt * 0.8) % 1;
      ctx.save(); ctx.globalAlpha = a * (1 - ring) * 0.6 * range(lt, 1, 1.5); ctx.strokeStyle = K8; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect(SCHED[0] - 130 - ring * 30, SCHED[1] - 30 - ring * 16, 260 + ring * 60, 60 + ring * 32, 16); ctx.stroke(); ctx.restore();
      label(ctx, 'watching for pods with no node', SCHED[0], 640, { size: 24, mono: true, color: C.dim, alpha: a * range(lt, sp('s1', 0.5), sp('s1', 0.5) + 0.7), weight: 600 });
      caption(ctx, 's1', a, lt, CS.s1);
    },

    pick(ctx, t) {
      const a = chapterAlpha(T, 'pick', t), lt = t - T.pick[0];
      chapterTag(ctx, '02', 'Filter, score, bind', a);
      const f = range(lt, sp('s2', 0.35), sp('s2', 0.35) + 1.0), g = range(lt, sp('s3', 0.3), sp('s3', 0.3) + 1.0), h = easeInOut(range(lt, sp('s4', 0.3), sp('s4', 0.3) + 1.3));
      board(ctx, a, lt, { f, g, h });
      const stage = lt < CS.s3 - 0.2 ? ['1 · FILTER', C.proton] : lt < CS.s4 - 0.2 ? ['2 · SCORE', C.gold] : ['3 · BIND', GREEN];
      label(ctx, stage[0], SCHED[0], 400, { size: 36, mono: true, color: stage[1], weight: 700, alpha: a * range(lt, sp('s2', 0.1), sp('s2', 0.1) + 0.5) });
      label(ctx, 'pod.spec.nodeName = node-4', SCHED[0], 700, { size: 26, mono: true, color: GREEN, alpha: a * range(h, 0.5, 1), weight: 700 });
      caption(ctx, 's2', a, lt, CS.s2);
      caption(ctx, 's3', a, lt, CS.s3);
      caption(ctx, 's4', a, lt, CS.s4);
    },

    hints(ctx, t) {
      const a = chapterAlpha(T, 'hints', t), lt = t - T.hints[0];
      chapterTag(ctx, '03', 'Guiding the scheduler', a);
      [['resource requests', 'cpu: 500m   memory: 256Mi'], ['node selector', 'disk: ssd'], ['affinity', 'spread replicas across zones'], ['taints & tolerations', 'dedicated=gpu:NoSchedule']].forEach(([title, snip], i) => {
        const x = 170 + (i % 2) * 790, y = 220 + Math.floor(i / 2) * 220, k = fade(lt, sp('s5', 0.3 + i * 0.12));
        panel(ctx, x, y, 740, 170, [C.gold, C.electron, GREEN, C.proton][i], a * k, 0.05, 20);
        label(ctx, title, x + 40, y + 55, { size: 34, weight: 700, align: 'left', alpha: a * k });
        label(ctx, snip, x + 40, y + 115, { size: 26, mono: true, color: C.dim, align: 'left', alpha: a * k, weight: 600 });
      });
      label(ctx, 'you describe the needs · the scheduler finds the match', CX, 700, { size: 28, mono: true, color: C.text, alpha: a * range(lt, sp('s5', 0.8), sp('s5', 0.8) + 0.7), weight: 600 });
      caption(ctx, 's5', a, lt, CS.s5);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 3;
      [['Filter.', C.proton], ['Score.', C.gold], ['Bind.', GREEN]].forEach(([w, col], i) =>
        label(ctx, w, CX, CY - 150 + i * 150, { size: 100, weight: 700, color: col, alpha: a * range(lt, 0.5 + s * 0.3 * i, 1.3 + s * 0.3 * i) }));
    },
  },
});
