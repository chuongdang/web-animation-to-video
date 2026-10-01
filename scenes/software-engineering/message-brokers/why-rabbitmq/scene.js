import { C, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, chip, token, panel, arrow, pathAt, card } from '/runtime/kit.js';

const { clamp, lerp, range, easeOut, easeInOut, fadeWindow } = Scene;

const GREEN = '#7ee787', RB = '#ff9d4d';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- software-engineering/message-brokers/why-rabbitmq`.
const TXT = {
  r1: 'Services that call each other directly are [[tightly coupled:proton]]: if one is down, the caller suffers.',
  r2: 'A [[message broker]] sits in the middle, so producers and consumers do not need to be online together.',
  r3: 'In RabbitMQ, a producer publishes to an [[exchange]], which routes messages into [[queues]] using bindings.',
  r4: 'Consumers take messages from a queue and send an [[acknowledgement:green]]. Unacknowledged messages are delivered again.',
  r5: 'Several consumers on one queue share the work, which is how you [[scale out:green]].',
  r6: 'RabbitMQ is a great fit for [[background jobs]], flexible routing, and request and reply.',
};
const nar = await narration('software-engineering/message-brokers/why-rabbitmq', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { coupling: ['r1', 'r2'], model: ['r3', 'r4'], scale: ['r5', 'r6'] });
const { CS, T } = P;
const sp = speech(nar, CS);

function node(ctx, name, x, y, color, alpha, w = 260, h = 150) {
  if (alpha <= 0) return;
  panel(ctx, x - w / 2, y - h / 2, w, h, color, alpha, 0.07, 22);
  label(ctx, name, x, y - h / 2 + 32, { size: 24, mono: true, color, alpha, weight: 700 });
}
const lerp2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

// ---- chapter 1: direct calls vs a broker ----------------------------------------------
const PR = [330, 450], BR = [960, 450], CO = [1590, 450];
const BSLOT = (j) => [BR[0] - 80 + (j % 3) * 80, BR[1] + 25 + Math.floor(j / 3) * 50];

// ---- chapter 2: exchange, bindings, queues ---------------------------------------------
const PX = [250, 450], X = [700, 450], Q = [[1150, 340], [1150, 560]], CN = [[1650, 340], [1650, 560]];
const MSGS = [{ q: 0, t: 0 }, { q: 1, t: 0.7 }, { q: 0, t: 1.4 }, { q: 1, t: 2.1 }];
const QCOL = [RB, C.electron];
const slotQ = (q, n) => [Q[q][0] - 110 + n * 120, Q[q][1]];

// ---- chapter 3: competing consumers -----------------------------------------------------
const WK = [[1400, 340], [1400, 480], [1400, 620]];

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      for (let i = 0; i < 5; i++) card(ctx, 540 + i * 210, 190, RB, a * 0.3 * range(t, 0.4 + i * 0.15, 1.0 + i * 0.15), 150, 52);
      titleCard(ctx, t, T, { l1: 'Why', l2: 'RabbitMQ?', sub: 'decoupling work with queues', tint: RB, size: 120 });
    },

    coupling(ctx, t) {
      const a = chapterAlpha(T, 'coupling', t), lt = t - T.coupling[0];
      chapterTag(ctx, '01', 'Why a broker', a);
      const nk = easeOut(range(lt, 0.2, 0.8));
      const downAt = sp('r1', 0.45), brokerAt = CS.r2 + 0.2, upAt = sp('r2', 0.8);
      const down = lt >= downAt && lt < upAt;
      const bk = easeOut(range(lt, brokerAt, brokerAt + 0.7));
      node(ctx, 'producer', ...PR, C.electron, a * nk);
      node(ctx, 'consumer', ...CO, down ? C.proton : C.electron, a * nk);
      arrow(ctx, PR[0] + 140, 450, CO[0] - 140, 450, C.dim, a * nk * (1 - bk), 4);
      // direct calls: messages flow until the consumer goes down, then pile up and block the producer
      const firstStuck = Math.ceil((downAt - 1.0 - 0.7) / 0.8);
      for (let k = 0; k < 9; k++) {
        const tk = 0.7 + k * 0.8;
        if (tk >= brokerAt - 0.3) break;
        const u = (lt - tk) / 1.8;
        if (u <= 0) continue;
        const stuck = k >= firstStuck && tk + 1.8 > downAt, si = k - firstStuck;
        const end = stuck ? [1430, 450 + ((si % 3) - 1) * 50] : [CO[0] - 150, 450];
        const [x, y] = lerp2([PR[0] + 150, 450], end, easeInOut(Math.min(u, 1)));
        const fade = stuck ? 1 - range(lt, brokerAt - 0.3, brokerAt + 0.2) : 1 - range(u, 0.85, 1);
        card(ctx, x, y, stuck ? C.proton : RB, a * fade, 90, 40);
      }
      if (lt >= downAt && lt < brokerAt) token(ctx, 'blocked…', PR[0], 340, C.proton, a * range(lt, downAt + 0.8, downAt + 1.4) * (1 - range(lt, brokerAt - 0.3, brokerAt + 0.1)), 26);
      token(ctx, 'down', CO[0], 340, C.proton, a * (down ? 1 : 0), 28);
      token(ctx, 'back online', CO[0], 340, GREEN, a * range(lt, upAt, upAt + 0.4) * (1 - range(lt, upAt + 1.8, upAt + 2.2)), 26);
      // with a broker in between
      node(ctx, 'RabbitMQ broker', ...BR, RB, a * bk, 320, 210);
      arrow(ctx, PR[0] + 140, 450, BR[0] - 170, 450, C.dim, a * bk, 4);
      arrow(ctx, BR[0] + 170, 450, CO[0] - 140, 450, C.dim, a * bk, 4);
      for (let j = 0; j < 5; j++) {
        const tj = brokerAt + 0.7 + j * 0.7, leave = upAt + j * 0.5;
        const u1 = (lt - tj) / 0.9, u2 = (lt - leave) / 0.9;
        if (u1 <= 0) continue;
        const pos = lt < leave ? lerp2([PR[0] + 150, 450], BSLOT(j), easeInOut(Math.min(u1, 1))) : lerp2(BSLOT(j), [CO[0] - 150, 450], easeInOut(Math.min(u2, 1)));
        card(ctx, ...pos, RB, a * (1 - range(u2, 0.85, 1)), 70, 36);
      }
      label(ctx, 'messages wait safely', BR[0], 600, { size: 26, mono: true, color: RB, alpha: a * range(lt, brokerAt + 1.5, brokerAt + 2.2) * (1 - range(lt, upAt + 1.5, upAt + 2.2)), weight: 600 });
      caption(ctx, 'r1', a, lt, CS.r1);
      caption(ctx, 'r2', a, lt, CS.r2);
    },

    model(ctx, t) {
      const a = chapterAlpha(T, 'model', t), lt = t - T.model[0];
      chapterTag(ctx, '02', 'Exchanges and queues', a);
      const k = (f, id = 'r3') => easeOut(range(lt, sp(id, f), sp(id, f) + 0.6));
      node(ctx, 'producer', ...PX, C.electron, a * k(0.0), 200, 130);
      // exchange: a diamond
      const xk = k(0.25);
      ctx.save(); ctx.globalAlpha = a * xk; ctx.strokeStyle = RB; ctx.fillStyle = 'rgba(255,157,77,0.12)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(X[0], X[1] - 90); ctx.lineTo(X[0] + 100, X[1]); ctx.lineTo(X[0], X[1] + 90); ctx.lineTo(X[0] - 100, X[1]); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      label(ctx, 'exchange', X[0], X[1], { size: 24, mono: true, color: RB, alpha: a * xk, weight: 700 });
      arrow(ctx, PX[0] + 110, 450, X[0] - 110, 450, C.dim, a * xk, 4);
      Q.forEach((q, i) => {
        const qk = k(0.45 + i * 0.1);
        panel(ctx, q[0] - 190, q[1] - 55, 380, 110, QCOL[i], a * qk, 0.07, 18);
        label(ctx, i ? 'queue: emails' : 'queue: orders', q[0], q[1] - 78, { size: 22, mono: true, color: QCOL[i], alpha: a * qk, weight: 700 });
        arrow(ctx, X[0] + 100, 450 + (i ? 30 : -30), q[0] - 200, q[1], C.dim, a * qk, 3);
        label(ctx, i ? 'binding: email.*' : 'binding: order.*', lerp(X[0] + 100, q[0] - 200, 0.45), lerp(450, q[1], 0.45) + (i ? 40 : -40), { size: 20, mono: true, color: C.dim, alpha: a * qk, weight: 500 });
      });
      // consumers + delivery + acknowledgement (second caption)
      const tA = sp('r4', 0.35), tB = sp('r4', 0.7);
      CN.forEach((c, i) => node(ctx, 'consumer', ...c, QCOL[i], a * k(0.0, 'r4') , 230, 120));
      const cnt = [0, 0];
      MSGS.forEach((m, mi) => {
        const slot = slotQ(m.q, cnt[m.q]++), start = sp('r3', 0.4) + m.t, u = (lt - start) / 1.8;
        if (u <= 0) return;
        const route = [[PX[0] + 120, 450], [X[0] - 70, 450], [X[0] + 40, 450 + (m.q ? 60 : -60)], [Q[m.q][0] - 190, Q[m.q][1]], slot];
        let pos = u < 1 ? pathAt(route, easeInOut(u)) : slot, col = QCOL[m.q], alpha = 1;
        if (mi === 0 && lt >= tA) { const d = (lt - tA) / 1.0; pos = lerp2(slot, [CN[0][0] - 130, CN[0][1]], easeInOut(clamp(d, 0, 1))); alpha = 1 - range(d, 1, 1.15); }
        if (mi === 1 && lt >= tB) {
          const d = (lt - tB) / 1.0, r = (lt - tB - 1.5) / 1.0;
          pos = lt < tB + 1.5 ? lerp2(slot, [CN[1][0] - 130, CN[1][1]], easeInOut(clamp(d, 0, 1))) : lerp2([CN[1][0] - 130, CN[1][1]], slot, easeInOut(clamp(r, 0, 1)));
          if (d >= 1 && r < 1) col = C.proton;
        }
        card(ctx, ...pos, col, a, 100, 40);
      });
      // ack token flies back, or "no ack" and redelivery
      const ackU = (lt - tA - 1.1) / 0.9;
      if (ackU > 0 && ackU < 1) token(ctx, 'ack ✓', ...lerp2([CN[0][0] - 130, CN[0][1] + 30], [Q[0][0] + 190, Q[0][1] + 30], easeInOut(ackU)), GREEN, a, 24);
      label(ctx, 'acknowledged: removed', 1650, 420, { size: 20, mono: true, color: GREEN, alpha: a * range(lt, tA + 2.0, tA + 2.5), weight: 600 });
      label(ctx, 'no ack → delivered again', 1650, 640, { size: 22, mono: true, color: C.proton, alpha: a * range(lt, tB + 1.0, tB + 1.4) * (1 - range(lt, tB + 3.2, tB + 3.8)), weight: 700 });
      caption(ctx, 'r3', a, lt, CS.r3);
      caption(ctx, 'r4', a, lt, CS.r4);
    },

    scale(ctx, t) {
      const a = chapterAlpha(T, 'scale', t), lt = t - T.scale[0];
      chapterTag(ctx, '03', 'Competing consumers', a);
      const qk = easeOut(range(lt, 0.2, 0.8));
      panel(ctx, 260, 280, 400, 400, RB, a * qk, 0.06, 24);
      label(ctx, 'queue', 460, 318, { size: 26, mono: true, color: RB, alpha: a * qk, weight: 700 });
      const done = [0, 0, 0];
      for (let j = 0; j < 9; j++) {
        const slot = [330 + (j % 3) * 130, 400 + Math.floor(j / 3) * 80], w = j % 3;
        const start = sp('r5', 0.3) + j * 0.45, u = (lt - start) / 1.1;
        const appear = easeOut(range(lt, 0.4 + j * 0.06, 0.9 + j * 0.06));
        if (u >= 1) { done[w]++; continue; }
        const pos = u > 0 ? lerp2(slot, [WK[w][0] - 150, WK[w][1]], easeInOut(u)) : slot;
        card(ctx, ...pos, RB, a * appear, 100, 44);
      }
      WK.forEach((w, i) => {
        const k = easeOut(range(lt, 0.4 + i * 0.15, 1.0 + i * 0.15));
        node(ctx, `worker ${i + 1}`, ...w, C.electron, a * k, 260, 110);
        label(ctx, `done: ${done[i]}`, w[0], w[1] + 22, { size: 26, mono: true, color: GREEN, alpha: a * k, weight: 600 });
      });
      ['background jobs', 'flexible routing', 'request / reply'].forEach((s, i) =>
        chip(ctx, s, 320 + i * 440, 790, { color: RB, size: 36, alpha: a * easeOut(range(lt, sp('r6', 0.35 + i * 0.15), sp('r6', 0.35 + i * 0.15) + 0.6)), w: 400 }));
      caption(ctx, 'r5', a, lt, CS.r5);
      caption(ctx, 'r6', a, lt, CS.r6);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 3;
      label(ctx, 'Decouple the work.', CX, CY - 60, { size: 96, weight: 700, color: RB, alpha: a * range(lt, 0.5, 1.3) });
      label(ctx, 'Deliver it reliably.', CX, CY + 70, { size: 96, weight: 700, color: GREEN, alpha: a * range(lt, 0.5 + s * 0.5, 1.3 + s * 0.5) });
    },
  },
});
