import { C, CX, CY, label, chapterTag, narration, plan, speech, mount, chapterAlpha, titleCard, token, panel, arrow, pathAt, treeNode, chip, measure, MONO } from '/runtime/kit.js';

const { range, easeOut, easeInOut, fadeWindow } = Scene;

const GREEN = '#7ee787', ET = C.copper, K8 = '#7aa2ff';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- software-engineering/kubernetes-internals/etcd`.
const TXT = {
  e1: 'etcd is the [[database]] of Kubernetes: every object, from pods to secrets, is stored there.',
  e2: 'It is a [[key-value]] store: each object lives under a key, built from its type, namespace and name.',
  e3: 'Several etcd members form a cluster and elect a [[leader]]. Only the leader accepts writes.',
  e4: 'A write is committed once a [[majority]] of members have it. This is the Raft algorithm.',
  e5: 'That is why clusters run [[three or five]] members. With three, one can fail and the cluster still has a quorum.',
  e6: 'Clients can [[watch]] a key, and etcd pushes every change. That is how the scheduler, controllers and kubelets react in real time.',
  e7: 'Lose etcd without a backup, and you lose the cluster state. So take regular [[snapshots:green]].',
};
const nar = await narration('software-engineering/kubernetes-internals/etcd', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { kv: ['e1', 'e2'], raft: ['e3', 'e4', 'e5'], watch: ['e6', 'e7'] });
const { CS, T } = P;
const sp = speech(nar, CS);

const fade = (lt, at, d = 0.6) => easeOut(range(lt, at, at + d));

const ROWS = [
  ['/registry/pods/default/web-1', 'Pod'], ['/registry/services/default/web', 'Service'], ['/registry/secrets/default/db-pass', 'Secret'],
  ['/registry/deployments/default/web', 'Deployment'], ['/registry/nodes/node-1', 'Node'],
];
const KEY_SEGS = [['/registry', C.dim, 'prefix'], ['/pods', C.electron, 'type'], ['/default', C.gold, 'namespace'], ['/web-1', GREEN, 'name']];

const LEADER = [960, 410], FOLL = [[520, 620], [1400, 620]];

function msg(ctx, text, pts, color, a, lt, s, d = 1.0) {
  const u = range(lt, s, s + d);
  if (u <= 0 || u >= 1) return;
  const [x, y] = pathAt(pts, easeInOut(u));
  if (text) token(ctx, text, x, y - 30, color, a * range(u, 0, 0.1) * (1 - range(u, 0.9, 1)), 22);
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill(); ctx.restore();
}

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      [0, 1, 2].forEach((i) => treeNode(ctx, `etcd-${i + 1}`, 760 + i * 200, 190, ET, a * 0.5 * range(t, 0.3 + i * 0.2, 0.9 + i * 0.2), { w: 160, size: 26 }));
      titleCard(ctx, t, T, { l1: 'What does', l2: 'etcd do?', sub: 'the memory of Kubernetes', tint: ET, size: 124 });
    },

    kv(ctx, t) {
      const a = chapterAlpha(T, 'kv', t), lt = t - T.kv[0];
      chapterTag(ctx, '01', 'A key-value database', a);
      const pk = fade(lt, 0.2);
      panel(ctx, 200, 170, 1520, 480, ET, a * pk, 0.04, 22);
      label(ctx, 'etcd', 260, 210, { size: 30, mono: true, color: ET, align: 'left', alpha: a * pk, weight: 700 });
      ROWS.forEach(([k, v], i) => {
        const r = fade(lt, 0.5 + i * 0.35);
        label(ctx, k, 260, 290 + i * 70, { size: 30, mono: true, align: 'left', alpha: a * r, weight: 600 });
        chip(ctx, v, 1360, 290 + i * 70, { color: [C.gold, K8, C.proton, GREEN, C.electron][i], size: 26, alpha: a * r, w: 280, family: MONO });
      });
      const k2 = fade(lt, sp('e2', 0.3));
      ctx.save(); ctx.font = `600 46px ${MONO}`;
      const ws = KEY_SEGS.map(([s]) => measure(ctx, s, 46, 600, MONO));
      ctx.restore();
      let x = CX - ws.reduce((n, w) => n + w, 0) / 2;
      KEY_SEGS.forEach(([s, col, what], i) => {
        const at = sp('e2', 0.3 + i * 0.15), k = fade(lt, at);
        label(ctx, s, x, 770, { size: 46, mono: true, color: col, align: 'left', alpha: a * k, weight: 600 });
        label(ctx, what, x + ws[i] / 2, 830, { size: 24, mono: true, color: col, alpha: a * k, weight: 600 });
        x += ws[i];
      });
      label(ctx, 'one key → one object', CX, 710, { size: 26, mono: true, color: C.dim, alpha: a * k2, weight: 600 });
      caption(ctx, 'e1', a, lt, CS.e1);
      caption(ctx, 'e2', a, lt, CS.e2);
    },

    raft(ctx, t) {
      const a = chapterAlpha(T, 'raft', t), lt = t - T.raft[0];
      chapterTag(ctx, '02', 'Leader, majority, quorum', a);
      const k = fade(lt, 0.3);
      const dieAt = sp('e5', 0.35), die = range(lt, dieAt, dieAt + 0.5);
      chip(ctx, 'client', CX - 100, 220, { color: C.electron, size: 30, alpha: a * k, w: 200, family: MONO });
      arrow(ctx, CX, 255, CX, 365, C.dim, a * k, 3);
      treeNode(ctx, 'etcd-1  ·  leader', LEADER[0], LEADER[1], GREEN, a * fade(lt, 0.5), { w: 340, size: 30, fill: 0.4 });
      FOLL.forEach(([x, y], i) => {
        const kk = fade(lt, 0.7 + i * 0.2), dead = i === 1 ? die : 0;
        arrow(ctx, LEADER[0] + (i ? 60 : -60), LEADER[1] + 35, x + (i ? -40 : 40), y - 35, C.dim, a * kk * (1 - 0.7 * dead), 3);
        treeNode(ctx, `etcd-${i + 2}  ·  follower`, x, y, dead > 0.5 ? C.proton : ET, a * kk * (1 - 0.6 * dead), { w: 340, size: 28 });
        if (i === 1 && dead > 0) label(ctx, '✕', x, y + 90, { size: 90, color: C.proton, alpha: a * dead * 0.85, weight: 700 });
      });
      msg(ctx, 'write', [[CX, 260], [CX, 375]], C.electron, a, lt, sp('e3', 0.5), 1.0);
      const s = sp('e4', 0.15);
      FOLL.forEach(([x, y], i) => {
        const to = [x + (i ? -40 : 40), y - 40], from = [LEADER[0] + (i ? 60 : -60), LEADER[1] + 40];
        msg(ctx, 'log entry', [from, to], ET, a, lt, s, 0.9);
        msg(ctx, 'ack', [to, from], GREEN, a, lt, s + 1.2 + i * 0.25, 0.9);
      });
      label(ctx, 'majority (2 of 3) has it → committed ✓', CX, 760, { size: 30, mono: true, color: GREEN, alpha: a * range(lt, s + 2.0, s + 2.6) * (1 - range(lt, CS.e5, CS.e5 + 0.4)), weight: 700 });
      label(ctx, '1 of 3 down → 2 alive = quorum → writes continue', CX, 760, { size: 30, mono: true, color: GREEN, alpha: a * range(lt, dieAt + 0.6, dieAt + 1.2), weight: 700 });
      label(ctx, '3 members tolerate 1 failure · 5 members tolerate 2', CX, 825, { size: 24, mono: true, color: C.dim, alpha: a * range(lt, dieAt + 1.4, dieAt + 2.0), weight: 600 });
      caption(ctx, 'e3', a, lt, CS.e3);
      caption(ctx, 'e4', a, lt, CS.e4);
      caption(ctx, 'e5', a, lt, CS.e5);
    },

    watch(ctx, t) {
      const a = chapterAlpha(T, 'watch', t), lt = t - T.watch[0];
      chapterTag(ctx, '03', 'Watch and backup', a);
      const k = fade(lt, 0.3), s = sp('e6', 0.35);
      const flash = range(lt, s - 0.1, s + 0.2) * (1 - range(lt, s + 0.4, s + 1.0));
      treeNode(ctx, 'etcd', 420, 400, ET, a * k, { w: 280, size: 34, fill: 0.2 + 0.4 * flash });
      label(ctx, 'key changed', 420, 470, { size: 24, mono: true, color: C.gold, alpha: a * flash, weight: 700 });
      label(ctx, 'watch /registry/pods', 420, 330, { size: 22, mono: true, color: C.dim, alpha: a * k, weight: 600 });
      ['scheduler', 'controller manager', 'kubelet'].forEach((n, i) => {
        const y = 260 + i * 140, kk = fade(lt, 0.5 + i * 0.2);
        arrow(ctx, 570, 400, 1090, y, C.dim, a * kk, 3);
        treeNode(ctx, n, 1300, y, [C.gold, GREEN, C.electron][i], a * kk, { w: 380, size: 28 });
        msg(ctx, 'event', [[570, 400], [1090, y]], C.gold, a, lt, s + 0.2 + i * 0.15, 1.0);
      });
      const b = sp('e7', 0.35);
      chip(ctx, 'etcdctl snapshot save', 160, 740, { color: ET, size: 28, alpha: a * fade(lt, b), w: 460, family: MONO });
      arrow(ctx, 650, 740, 1000, 740, C.dim, a * fade(lt, b + 0.4), 3);
      treeNode(ctx, 'backup storage  ✓', 1250, 740, GREEN, a * fade(lt, b + 0.6), { w: 400, size: 30 });
      caption(ctx, 'e6', a, lt, CS.e6);
      caption(ctx, 'e7', a, lt, CS.e7);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 3;
      [['Store.', ET], ['Agree.', C.gold], ['Watch.', GREEN]].forEach(([w, col], i) =>
        label(ctx, w, CX, CY - 150 + i * 150, { size: 100, weight: 700, color: col, alpha: a * range(lt, 0.5 + s * 0.3 * i, 1.3 + s * 0.3 * i) }));
    },
  },
});
