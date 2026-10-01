import { C, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, chip, token, panel, arrow, pathAt, card } from '/runtime/kit.js';

const { clamp, lerp, range, easeOut, easeInOut, fadeWindow } = Scene;

const GREEN = '#7ee787', KF = '#c792ea';
const KC = [C.electron, C.gold, GREEN, C.copper, KF];

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- software-engineering/message-brokers/why-kafka`.
const TXT = {
  k1: 'Kafka is a [[distributed log]]: events are appended and kept, not removed when they are read.',
  k2: 'Each consumer tracks its own [[offset]], so many consumers can read the same events at their own pace.',
  k3: 'A topic is split into [[partitions]], so writes and reads spread across many machines.',
  k4: 'Events with the same [[key]] always go to the same partition, so their [[order]] is kept.',
  k5: 'Partitions are [[replicated]] across brokers, so the data survives a machine failure.',
  k6: 'Because events are kept, you can [[replay history:green]]: rebuild a service, or feed a new consumer from the start.',
  k7: 'Kafka is a great fit for [[event streaming]], analytics pipelines, and [[event sourcing]].',
};
const nar = await narration('software-engineering/message-brokers/why-kafka', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { log: ['k1', 'k2'], parts: ['k3', 'k4'], repl: ['k5'], replay: ['k6', 'k7'] });
const { CS, T } = P;
const sp = speech(nar, CS);

// ---- chapter 1: one append-only log ----------------------------------------------------
const cx1 = (i) => 330 + i * 98;

// ---- chapter 2: partitions and keys ------------------------------------------------------
const LANE_Y = [360, 490, 620];
const KEY_LANE = [0, 1, 2, 0, 1];                       // key -> partition (what hash(key) would decide)
const KEY_NAME = ['user A', 'user B', 'user C', 'user D', 'user E'];
const EVENTS = [0, 1, 2, 3, 4, 0, 1, 2, 0, 3, 4, 2, 1, 0].map((key, j, all) => ({ key, lane: KEY_LANE[key], idx: all.slice(0, j).filter((k) => KEY_LANE[k] === KEY_LANE[key]).length }));
const cx2 = (i) => 400 + i * 110;

// ---- chapter 3: brokers and replicas ------------------------------------------------------
const BRK = [480, 960, 1440];
const LEADER = [0, 1, 2];                                // broker i leads partition i

// ---- chapter 4: replay ---------------------------------------------------------------------
const cx4 = (i) => 330 + i * 118;

function cells(ctx, n, x, y, alpha, at, lit = () => 0) {
  for (let i = 0; i < n; i++) {
    const k = easeOut(range(at(i), 0, 0.5));
    if (k <= 0) continue;
    const l = lit(i);
    card(ctx, x(i), y - 30 * (1 - k), l > 0 ? GREEN : KC[i % 5], alpha * k, 88, 88);
    label(ctx, String(i), x(i), y - 30 * (1 - k), { size: 32, mono: true, weight: 700, alpha: alpha * k });
  }
}
function pointer(ctx, x, y, name, color, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.moveTo(x, y - 52); ctx.lineTo(x - 18, y - 22); ctx.lineTo(x + 18, y - 22); ctx.closePath(); ctx.fill(); ctx.restore();
  label(ctx, name, x, y, { size: 26, mono: true, color, alpha, weight: 700 });
}

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      for (let i = 0; i < 9; i++) card(ctx, 600 + i * 90, 190, KC[i % 5], a * 0.35 * range(t, 0.3 + i * 0.12, 0.8 + i * 0.12), 70, 70);
      titleCard(ctx, t, T, { l1: 'Why', l2: 'Kafka?', sub: 'an event log you can replay', tint: KF, size: 128 });
    },

    log(ctx, t) {
      const a = chapterAlpha(T, 'log', t), lt = t - T.log[0];
      chapterTag(ctx, '01', 'A distributed log', a);
      chip(ctx, 'producer', 70, 430, { color: C.electron, size: 28, alpha: a * range(lt, 0.2, 0.7), w: 170 });
      arrow(ctx, 250, 430, 280, 430, C.dim, a * range(lt, 0.3, 0.7), 3);
      cells(ctx, 15, cx1, 430, a, (i) => lt - (0.6 + i * 0.32));
      label(ctx, 'append-only: events stay after they are read', CX + 100, 300, { size: 28, mono: true, color: KF, alpha: a * range(lt, sp('k1', 0.5), sp('k1', 0.5) + 0.7), weight: 600 });
      label(ctx, 'offset', cx1(0), 355, { size: 22, mono: true, color: C.dim, alpha: a * range(lt, 1.0, 1.5), weight: 500 });
      const t0 = sp('k2', 0.25), pk = range(lt, sp('k2', 0.1), sp('k2', 0.1) + 0.6);
      const bill = clamp(3 + (lt - t0) * 0.7, 3, 9), ana = clamp(8 + (lt - t0) * 1.4, 8, 14);
      pointer(ctx, cx1(bill), 580, 'Billing', C.gold, a * pk);
      pointer(ctx, cx1(ana), 660, 'Analytics', C.electron, a * pk);
      label(ctx, 'each consumer has its own offset', CX, 760, { size: 28, mono: true, color: C.text, alpha: a * range(lt, sp('k2', 0.55), sp('k2', 0.55) + 0.7), weight: 600 });
      caption(ctx, 'k1', a, lt, CS.k1);
      caption(ctx, 'k2', a, lt, CS.k2);
    },

    parts(ctx, t) {
      const a = chapterAlpha(T, 'parts', t), lt = t - T.parts[0];
      chapterTag(ctx, '02', 'Partitions and keys', a);
      chip(ctx, 'producer', CX - 100, 230, { color: C.electron, size: 28, alpha: a * range(lt, 0.2, 0.7), w: 200 });
      label(ctx, 'topic: orders', 90, 290, { size: 24, mono: true, color: KF, align: 'left', alpha: a * range(lt, 0.3, 0.8), weight: 700 });
      LANE_Y.forEach((y, i) => {
        const k = easeOut(range(lt, 0.3 + i * 0.15, 0.9 + i * 0.15));
        ctx.save(); ctx.globalAlpha = a * k * 0.7; ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.beginPath(); ctx.roundRect(300, y - 55, 1400, 110, 16); ctx.fill(); ctx.restore();
        label(ctx, `partition ${i}`, 90, y, { size: 26, mono: true, color: KF, align: 'left', alpha: a * k, weight: 700 });
      });
      EVENTS.forEach((e, j) => {
        const start = sp('k3', 0.12) + j * 0.5, u = (lt - start) / 0.9;
        if (u <= 0) return;
        const dest = [cx2(e.idx), LANE_Y[e.lane]];
        const [x, y] = u < 1 ? pathAt([[CX, 255], [CX, 300], dest], easeInOut(u)) : dest;
        card(ctx, x, y, KC[e.key], a, 90, 56);
        label(ctx, String.fromCharCode(65 + e.key), x, y, { size: 24, mono: true, weight: 700, alpha: a });
      });
      const lk = range(lt, sp('k4', 0.1), sp('k4', 0.1) + 0.7);
      KEY_NAME.forEach((n, i) => chip(ctx, n, 330 + i * 270, 790, { color: KC[i], size: 28, alpha: a * lk, w: 230 }));
      label(ctx, 'same key → same partition → order kept', CX, 725, { size: 28, mono: true, color: GREEN, alpha: a * lk, weight: 700 });
      caption(ctx, 'k3', a, lt, CS.k3);
      caption(ctx, 'k4', a, lt, CS.k4);
    },

    repl(ctx, t) {
      const a = chapterAlpha(T, 'repl', t), lt = t - T.repl[0];
      chapterTag(ctx, '03', 'Replication', a);
      const crashAt = sp('k5', 0.5), crash = range(lt, crashAt, crashAt + 0.5), fail = range(lt, crashAt + 0.4, crashAt + 1.2);
      BRK.forEach((x, b) => {
        const k = easeOut(range(lt, 0.2 + b * 0.2, 0.8 + b * 0.2)), dead = b === 0 ? crash : 0;
        panel(ctx, x - 190, 270, 380, 380, dead > 0.5 ? C.proton : C.dim, a * k, 0.05, 22);
        label(ctx, `broker ${b + 1}`, x, 308, { size: 26, mono: true, color: dead > 0.5 ? C.proton : C.dim, alpha: a * k, weight: 700 });
        for (let p = 0; p < 3; p++) {
          const lead = LEADER[p] === b || (p === 0 && b === 1 && fail > 0.5);
          const gone = b === 0 ? crash : 0;
          chip(ctx, `P${p} ${lead ? 'leader' : 'follower'}`, x - 140, 380 + p * 90, { color: lead ? GREEN : KF, size: 30, alpha: a * k * (1 - 0.75 * gone), w: 280, weight: lead ? 700 : 500 });
        }
        if (b === 0 && crash > 0) label(ctx, '✕', x, 460, { size: 150, color: C.proton, alpha: a * crash * 0.8, weight: 700 });
      });
      label(ctx, 'replicas: 3 copies of every partition', CX, 720, { size: 26, mono: true, color: C.dim, alpha: a * range(lt, 1.0, 1.6), weight: 500 });
      label(ctx, 'new leader elected → no data lost', CX, 780, { size: 30, mono: true, color: GREEN, alpha: a * fail, weight: 700 });
      caption(ctx, 'k5', a, lt, CS.k5);
    },

    replay(ctx, t) {
      const a = chapterAlpha(T, 'replay', t), lt = t - T.replay[0];
      chapterTag(ctx, '04', 'Replay', a);
      const jump = sp('k6', 0.3), back = easeInOut(range(lt, jump, jump + 0.9)), run = clamp((lt - jump - 1.0) * 3.2, 0, 11);
      const cons = lerp(11, 0, back) + (lt > jump + 1.0 ? run : 0);
      cells(ctx, 12, cx4, 400, a, (i) => lt - (0.2 + i * 0.08), (i) => (lt > jump + 0.9 && i <= cons ? 1 : 0));
      pointer(ctx, cx4(Math.min(11, cons)), 560, 'consumer', C.gold, a * range(lt, 0.4, 0.9));
      const nk = range(lt, sp('k6', 0.6), sp('k6', 0.6) + 0.6), nrun = clamp((lt - sp('k6', 0.6) - 0.6) * 2.6, 0, 11);
      pointer(ctx, cx4(Math.min(11, nrun)), 660, 'new service', GREEN, a * nk);
      label(ctx, 'replay from offset 0', CX, 300, { size: 30, mono: true, color: GREEN, alpha: a * range(back, 0.6, 1), weight: 700 });
      ['event streaming', 'analytics pipelines', 'event sourcing'].forEach((s, i) =>
        chip(ctx, s, 250 + i * 480, 790, { color: KF, size: 34, alpha: a * easeOut(range(lt, sp('k7', 0.35 + i * 0.15), sp('k7', 0.35 + i * 0.15) + 0.6)), w: 440 }));
      caption(ctx, 'k6', a, lt, CS.k6);
      caption(ctx, 'k7', a, lt, CS.k7);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 3;
      [['Append.', C.electron], ['Partition.', C.gold], ['Replay.', GREEN]].forEach(([w, col], i) =>
        label(ctx, w, CX, CY - 150 + i * 150, { size: 100, weight: 700, color: col, alpha: a * range(lt, 0.5 + s * 0.3 * i, 1.3 + s * 0.3 * i) }));
    },
  },
});
