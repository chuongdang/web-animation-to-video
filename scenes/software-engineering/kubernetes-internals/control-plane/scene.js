import { C, CX, CY, label, chapterTag, narration, plan, speech, mount, chapterAlpha, titleCard, token, panel, arrow, card, pathAt, treeNode, chip } from '/runtime/kit.js';

const { lerp, range, easeOut, easeInOut, fadeWindow } = Scene;

const GREEN = '#7ee787', K8 = '#7aa2ff';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- software-engineering/kubernetes-internals/control-plane`.
const TXT = {
  c1: 'A Kubernetes cluster has a [[control plane]] that makes decisions, and [[worker nodes]] that run your containers.',
  c2: 'Every request goes through the [[API server]]. It is the front door, and the only component that talks to the database.',
  c3: 'The desired state is stored in [[etcd]], a consistent key-value store.',
  c4: 'The [[scheduler]] watches for pods with no node, and picks a node for each one.',
  c5: '[[Controllers]] compare the desired state with reality, and act to close the gap.',
  c7: 'Each node also runs [[kube-proxy]]. It sets up network rules, so traffic sent to a Service reaches one of the right pods.',
  c6: 'On each node, the [[kubelet]] sees the pods assigned to it, and asks the container runtime to start them.',
};
const nar = await narration('software-engineering/kubernetes-internals/control-plane', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { arch: ['c1'], request: ['c2', 'c3'], decide: ['c4', 'c5'], run: ['c6'], net: ['c7'] });
const { CS, T } = P;
const sp = speech(nar, CS);

const fade = (lt, at, d = 0.6) => easeOut(range(lt, at, at + d));

const COMP = {
  sched: { x: 440, y: 270, w: 360, name: 'scheduler', col: C.gold },
  ctrl: { x: 440, y: 400, w: 360, name: 'controller manager', col: GREEN },
  api: { x: 960, y: 335, w: 320, name: 'API server', col: K8 },
  etcd: { x: 1480, y: 335, w: 260, name: 'etcd', col: C.copper },
};
const KUBELET = [[330, 660], [1190, 660]];
const NODE_PODS = [[[300, 750], [470, 750]], [[1160, 750], [1330, 750], [1500, 750]]];
const NEW_POD = [640, 750];
const KPROXY = [[590, 660], [1450, 660]], KP = '#c792ea';

/** the whole cluster; `hot` names the components in focus, `rv` animates the first reveal */
function diagram(ctx, a, lt, hot = [], rv = false) {
  const k = (at) => (rv ? fade(lt, at) : 1);
  const dim = (name) => (hot.length && !hot.includes(name) ? 0.4 : 1);
  panel(ctx, 140, 170, 1640, 320, C.dim, a * k(0.2), 0.03, 24);
  label(ctx, 'CONTROL PLANE', 170, 205, { size: 24, mono: true, color: C.dim, align: 'left', alpha: a * k(0.3), weight: 700 });
  panel(ctx, 140, 560, 1640, 290, C.dim, a * k(1.4), 0.03, 24);
  label(ctx, 'WORKER NODES', 170, 590, { size: 24, mono: true, color: C.dim, align: 'left', alpha: a * k(1.5), weight: 700 });
  Object.entries(COMP).forEach(([id, c], i) =>
    treeNode(ctx, c.name, c.x, c.y, c.col, a * k(0.5 + i * 0.25) * dim(id), { w: c.w, size: 28, fill: hot.includes(id) ? 0.5 : 0.16 }));
  const line = (x0, y0, x1, y1, at, who) => arrow(ctx, x0, y0, x1, y1, C.dim, a * k(at) * (hot.length && !who.some((w) => hot.includes(w)) ? 0.4 : 1), 3);
  line(620, 275, 800, 320, 1.0, ['sched', 'api']);
  line(620, 395, 800, 350, 1.1, ['ctrl', 'api']);
  line(1120, 335, 1350, 335, 1.2, ['api', 'etcd']);
  [200, 1060].forEach((x, n) => {
    panel(ctx, x, 610, 660, 210, C.dim, a * k(1.6 + n * 0.2) * 0.8, 0.03, 18);
    label(ctx, `node ${n + 1}`, x + 590, 640, { size: 22, mono: true, color: C.dim, alpha: a * k(1.6 + n * 0.2), weight: 600 });
    treeNode(ctx, 'kubelet', KUBELET[n][0], KUBELET[n][1], C.electron, a * k(1.7 + n * 0.2) * dim('kubelet'), { w: 200, size: 26, fill: hot.includes('kubelet') ? 0.5 : 0.16 });
    treeNode(ctx, 'kube-proxy', KPROXY[n][0], KPROXY[n][1], KP, a * k(1.75 + n * 0.2) * dim('kubeproxy'), { w: 220, size: 26, fill: hot.includes('kubeproxy') ? 0.5 : 0.16 });
    NODE_PODS[n].forEach(([px, py], j) => {
      card(ctx, px, py, C.gold, a * k(1.9 + n * 0.2 + j * 0.1), 140, 56);
      label(ctx, `pod`, px, py, { size: 22, mono: true, weight: 700, alpha: a * k(1.9 + n * 0.2 + j * 0.1) });
    });
  });
  line(KUBELET[0][0] + 40, 635, 880, 365, 1.8, ['kubelet', 'api']);
  line(KUBELET[1][0] - 40, 635, 1040, 365, 1.9, ['kubelet', 'api']);
}

/** a labelled message travelling along `pts` between times s and s+d (chapter-relative) */
function msg(ctx, text, pts, color, a, lt, s, d = 1.0) {
  const u = range(lt, s, s + d);
  if (u <= 0 || u >= 1) return;
  const [x, y] = pathAt(pts, easeInOut(u));
  token(ctx, text, x, y - 30, color, a * range(u, 0, 0.1) * (1 - range(u, 0.9, 1)), 22);
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill(); ctx.restore();
}

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      ['API', 'etcd', 'sched'].forEach((s, i) => chip(ctx, s, 640 + i * 230, 190, { color: [K8, C.copper, C.gold][i], size: 30, alpha: a * 0.5 * range(t, 0.3 + i * 0.2, 0.9 + i * 0.2), w: 200 }));
      titleCard(ctx, t, T, { l1: 'Inside', l2: 'Kubernetes', sub: 'the control plane, piece by piece', tint: K8, size: 124 });
    },

    arch(ctx, t) {
      const a = chapterAlpha(T, 'arch', t), lt = t - T.arch[0];
      chapterTag(ctx, '01', 'The cluster', a);
      diagram(ctx, a, lt, [], true);
      caption(ctx, 'c1', a, lt, CS.c1);
    },

    request(ctx, t) {
      const a = chapterAlpha(T, 'request', t), lt = t - T.request[0];
      chapterTag(ctx, '02', 'API server and etcd', a);
      const hotNow = lt < CS.c3 - 0.3 ? ['api'] : ['api', 'etcd'];
      diagram(ctx, a, lt, hotNow);
      msg(ctx, 'kubectl apply', [[960, 120], [960, 305]], K8, a, lt, sp('c2', 0.15), 1.1);
      msg(ctx, 'pod spec', [[1120, 335], [1480, 335]], C.copper, a, lt, sp('c3', 0.2), 1.2);
      label(ctx, 'desired state saved', 1480, 410, { size: 22, mono: true, color: GREEN, alpha: a * range(lt, sp('c3', 0.2) + 1.1, sp('c3', 0.2) + 1.6), weight: 700 });
      label(ctx, 'validates · authenticates · is the only one that touches etcd', CX, 520, { size: 24, mono: true, color: C.dim, alpha: a * range(lt, sp('c2', 0.5), sp('c2', 0.5) + 0.7) * (1 - range(lt, CS.c3, CS.c3 + 0.4)), weight: 600 });
      caption(ctx, 'c2', a, lt, CS.c2);
      caption(ctx, 'c3', a, lt, CS.c3);
    },

    decide(ctx, t) {
      const a = chapterAlpha(T, 'decide', t), lt = t - T.decide[0];
      chapterTag(ctx, '03', 'Scheduler and controllers', a);
      diagram(ctx, a, lt, lt < CS.c5 - 0.3 ? ['sched', 'api'] : ['ctrl', 'api']);
      const s4 = sp('c4', 0.2);
      msg(ctx, 'unscheduled pod', [[800, 320], [620, 270]], C.gold, a, lt, s4, 1.0);
      msg(ctx, 'node-1', [[620, 270], [800, 320]], C.gold, a, lt, s4 + 1.4, 1.0);
      label(ctx, 'pod → node-1', 440, 330, { size: 22, mono: true, color: GREEN, alpha: a * range(lt, s4 + 2.4, s4 + 2.9) * (1 - range(lt, CS.c5, CS.c5 + 0.4)), weight: 700 });
      const s5 = sp('c5', 0.3);
      label(ctx, 'desired 3  ≠  actual 2', 440, 462, { size: 24, mono: true, color: C.proton, alpha: a * range(lt, s5, s5 + 0.6), weight: 700 });
      msg(ctx, 'create 1 pod', [[620, 395], [800, 350]], GREEN, a, lt, s5 + 1.2, 1.0);
      caption(ctx, 'c4', a, lt, CS.c4);
      caption(ctx, 'c5', a, lt, CS.c5);
    },

    run(ctx, t) {
      const a = chapterAlpha(T, 'run', t), lt = t - T.run[0];
      chapterTag(ctx, '04', 'Kubelet and the runtime', a);
      diagram(ctx, a, lt, ['kubelet', 'api']);
      const s = sp('c6', 0.15);
      msg(ctx, 'pod → node 1', [[900, 365], [KUBELET[0][0] + 60, 635]], K8, a, lt, s, 1.2);
      const k = easeOut(range(lt, s + 2.2, s + 3.0));
      msg(ctx, 'start container', [[KUBELET[0][0] + 60, 690], NEW_POD], C.electron, a, lt, s + 1.8, 0.9);
      card(ctx, NEW_POD[0], NEW_POD[1], GREEN, a * k, 140 * k + 10, 56);
      label(ctx, 'pod', NEW_POD[0], NEW_POD[1], { size: 22, mono: true, weight: 700, alpha: a * k });
      label(ctx, 'container runtime (containerd)', CX, 880, { size: 24, mono: true, color: C.dim, alpha: a * range(lt, sp('c6', 0.6), sp('c6', 0.6) + 0.6), weight: 600 });
      caption(ctx, 'c6', a, lt, CS.c6);
    },

    net(ctx, t) {
      const a = chapterAlpha(T, 'net', t), lt = t - T.net[0];
      chapterTag(ctx, '05', 'kube-proxy and Services', a);
      diagram(ctx, a, lt, ['kubeproxy', 'api']);
      card(ctx, NEW_POD[0], NEW_POD[1], GREEN, a, 140, 56);
      label(ctx, 'pod', NEW_POD[0], NEW_POD[1], { size: 22, mono: true, weight: 700, alpha: a });
      const s = sp('c7', 0.15);
      msg(ctx, 'Service → pods', [[900, 365], [KPROXY[0][0] + 20, 632]], K8, a, lt, s, 1.2);
      label(ctx, 'iptables / IPVS rules', KPROXY[0][0], 595, { size: 22, mono: true, color: KP, alpha: a * range(lt, s + 1.2, s + 1.8), weight: 700 });
      const t0 = s + 2.2;
      [[NEW_POD[0], 'request'], [470, 'request'], [NEW_POD[0], 'request'], [470, 'request']].forEach(([x, txt], i) =>
        msg(ctx, txt, [[KPROXY[0][0], 690], [x, 750]], C.electron, a, lt, t0 + i * 1.0, 0.9));
      label(ctx, 'one Service address → any healthy pod', CX, 880, { size: 24, mono: true, color: C.dim, alpha: a * range(lt, sp('c7', 0.5), sp('c7', 0.5) + 0.7), weight: 600 });
      caption(ctx, 'c7', a, lt, CS.c7);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 3;
      [['Watch.', C.electron], ['Decide.', C.gold], ['Act.', GREEN]].forEach(([w, col], i) =>
        label(ctx, w, CX, CY - 150 + i * 150, { size: 100, weight: 700, color: col, alpha: a * range(lt, 0.5 + s * 0.3 * i, 1.3 + s * 0.3 * i) }));
    },
  },
});
