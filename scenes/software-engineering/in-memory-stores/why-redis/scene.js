import { C, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, chip, token, panel, arrow, pathAt, card } from '/runtime/kit.js';

const { clamp, lerp, range, easeOut, easeInOut, fadeWindow } = Scene;

const GREEN = '#7ee787', RD = '#ff6b5c';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- software-engineering/in-memory-stores/why-redis`.
const TXT = {
  d1: 'Asking a disk-based database for the same data again and again is [[slow:proton]].',
  d2: 'Redis keeps data in [[memory]], so reads and writes are [[extremely fast:green]].',
  d3: 'As a [[cache]]: check Redis first. On a miss, load from the database and store the result.',
  d4: 'A [[time to live]] expires old entries, so the cache does not serve stale data forever.',
  d5: 'It is more than key and value: strings, [[lists]], [[sets]], [[sorted sets]], and hashes.',
  d6: 'That powers [[sessions]], rate limits, queues, and [[leaderboards]].',
};
const nar = await narration('software-engineering/in-memory-stores/why-redis', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { slow: ['d1', 'd2'], flow: ['d3'], ttl: ['d4'], types: ['d5', 'd6'] });
const { CS, T } = P;
const sp = speech(nar, CS);

const lerp2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
function node(ctx, name, x, y, color, alpha, w = 260, h = 150) {
  if (alpha <= 0) return;
  panel(ctx, x - w / 2, y - h / 2, w, h, color, alpha, 0.07, 22);
  label(ctx, name, x, y - h / 2 + 32, { size: 24, mono: true, color, alpha, weight: 700 });
}
function cylinder(ctx, x, y, w, h, color, alpha, name) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.ellipse(x, y + h / 2, w / 2, 22, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillRect(x - w / 2, y - h / 2, w, h); ctx.beginPath(); ctx.moveTo(x - w / 2, y - h / 2); ctx.lineTo(x - w / 2, y + h / 2); ctx.moveTo(x + w / 2, y - h / 2); ctx.lineTo(x + w / 2, y + h / 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x, y - h / 2, w / 2, 22, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
  label(ctx, name, x, y + 10, { size: 22, mono: true, color, alpha, weight: 700 });
}

// ---- chapter 1 ---------------------------------------------------------------------------
const APP = [300, 450], DB = [1550, 450], RDS = [960, 450];
// ---- chapter 2 ---------------------------------------------------------------------------
const APP2 = [250, 500], RDS2 = [900, 500], DB2 = [1560, 500];

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      for (let i = 0; i < 6; i++) glowDot(ctx, 560 + i * 160, 190, 14, RD, a * 0.4 * range(t, 0.3 + i * 0.12, 0.9 + i * 0.12));
      titleCard(ctx, t, T, { l1: 'Why', l2: 'Redis?', sub: 'keep hot data in memory', tint: RD, size: 128 });
    },

    slow(ctx, t) {
      const a = chapterAlpha(T, 'slow', t), lt = t - T.slow[0];
      chapterTag(ctx, '01', 'Disk vs memory', a);
      const nk = easeOut(range(lt, 0.2, 0.8)), rk = easeOut(range(lt, CS.d2 + 0.2, CS.d2 + 0.9));
      node(ctx, 'app', ...APP, C.electron, a * nk, 220, 130);
      cylinder(ctx, DB[0], DB[1] - 20, 200, 110, C.gold, a * nk * (1 - 0.6 * rk), 'database (disk)');
      node(ctx, 'Redis (memory)', ...RDS, RD, a * rk, 260, 150);
      const swap = CS.d2 + 0.5;
      // identical requests, first to the database, later to Redis
      const dbP = 2.6;
      for (let k = 0; k < 8; k++) {
        const t0 = 0.8 + k * dbP;
        if (t0 > swap) break;
        const u = (lt - t0) / dbP;
        if (u <= 0 || u >= 1) continue;
        const out = u < 0.4;
        card(ctx, ...lerp2(out ? [APP[0] + 130, 430] : [DB[0] - 110, 480], out ? [DB[0] - 110, 430] : [APP[0] + 130, 480], easeInOut(out ? u / 0.4 : (u - 0.4) / 0.4 > 1 ? 1 : (u - 0.4) / 0.4)), out ? C.electron : C.gold, a * (1 - range(lt, swap - 0.3, swap + 0.1)) * (u > 0.8 ? 0 : 1), 130, 44);
        if (out) label(ctx, 'GET user:42', lerp(APP[0] + 130, DB[0] - 110, easeInOut(u / 0.4)), 390, { size: 18, mono: true, color: C.dim, alpha: a * 0.8, weight: 500 });
      }
      for (let k = 0; k < 20; k++) {
        const t0 = swap + k * 0.9, u = (lt - t0) / 0.9;
        if (u <= 0 || u >= 1) continue;
        const out = u < 0.5;
        card(ctx, ...lerp2(out ? [APP[0] + 130, 430] : [RDS[0] - 150, 480], out ? [RDS[0] - 150, 430] : [APP[0] + 130, 480], easeInOut(out ? u / 0.5 : (u - 0.5) / 0.5)), out ? C.electron : GREEN, a * rk, 130, 44);
      }
      // round-trip bars
      const bk = range(lt, sp('d1', 0.5), sp('d1', 0.5) + 0.7), fk = range(lt, sp('d2', 0.5), sp('d2', 0.5) + 0.7);
      label(ctx, 'database', 360, 740, { size: 24, mono: true, color: C.gold, align: 'right', alpha: a * bk, weight: 600 });
      label(ctx, 'Redis', 360, 810, { size: 24, mono: true, color: RD, align: 'right', alpha: a * fk, weight: 600 });
      [[740, 1000 * easeOut(bk), C.gold, bk], [810, 130 * easeOut(fk), RD, fk]].forEach(([y, w, col, k]) => {
        ctx.save(); ctx.globalAlpha = a * k; ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(390, y - 16, Math.max(2, w), 32, 8); ctx.fill(); ctx.restore();
      });
      label(ctx, 'time per request →', 390, 690, { size: 22, mono: true, color: C.dim, align: 'left', alpha: a * bk, weight: 500 });
      caption(ctx, 'd1', a, lt, CS.d1);
      caption(ctx, 'd2', a, lt, CS.d2);
    },

    flow(ctx, t) {
      const a = chapterAlpha(T, 'flow', t), lt = t - T.flow[0];
      chapterTag(ctx, '02', 'Cache-aside', a);
      const nk = easeOut(range(lt, 0.2, 0.8));
      node(ctx, 'app', ...APP2, C.electron, a * nk, 220, 130);
      node(ctx, 'Redis (cache)', ...RDS2, RD, a * nk, 340, 220);
      cylinder(ctx, DB2[0], DB2[1] - 20, 200, 110, C.gold, a * nk, 'database');
      const b = sp('d3', 0.05);
      const seg = (s, d, from, to, col, text, via) => {
        const u = (lt - b - s) / d;
        if (u <= 0 || u >= 1) return;
        const pos = via ? pathAt([from, via, to], easeInOut(u)) : lerp2(from, to, easeInOut(u));
        card(ctx, ...pos, col, a, 110, 40);
        label(ctx, text, ...pos, { size: 16, mono: true, weight: 700, alpha: a });
      };
      const A = [APP2[0] + 130, 500], R = [RDS2[0] - 180, 500], R2 = [RDS2[0] + 180, 500], D = [DB2[0] - 110, 500];
      seg(0, 0.7, A, R, C.electron, 'GET');
      seg(1.2, 1.2, [R2[0] - 100, 400], [D[0], 440], C.electron, 'SELECT', [1230, 320]);
      seg(2.4, 1.2, [D[0], 560], [A[0] + 150, 600], C.gold, 'row', [1230, 680]);
      seg(3.6, 0.7, A, R, C.gold, 'SET');
      seg(5.0, 0.7, A, R, C.electron, 'GET');
      seg(5.7, 0.7, R, A, GREEN, 'value');
      const stored = easeOut(range(lt, b + 4.3, b + 4.8));
      chip(ctx, 'user:42', RDS2[0] - 100, 530, { color: GREEN, size: 28, alpha: a * stored, w: 200 });
      token(ctx, 'miss', RDS2[0], 390, C.proton, a * range(lt, b + 0.7, b + 1.0) * (1 - range(lt, b + 2.6, b + 3.0)), 28);
      token(ctx, 'hit', RDS2[0], 390, GREEN, a * range(lt, b + 5.5, b + 5.8), 28);
      label(ctx, 'slow path, once', 1230, 250, { size: 24, mono: true, color: C.gold, alpha: a * range(lt, b + 1.2, b + 1.8) * (1 - range(lt, b + 4.5, b + 5.0)), weight: 600 });
      label(ctx, 'fast path from now on', RDS2[0], 780, { size: 28, mono: true, color: GREEN, alpha: a * range(lt, b + 6.0, b + 6.6), weight: 700 });
      caption(ctx, 'd3', a, lt, CS.d3);
    },

    ttl(ctx, t) {
      const a = chapterAlpha(T, 'ttl', t), lt = t - T.ttl[0];
      chapterTag(ctx, '03', 'Time to live', a);
      const pk = easeOut(range(lt, 0.2, 0.8));
      node(ctx, 'Redis', CX, 450, RD, a * pk, 900, 420);
      const keys = [['session:7f3a', 0.45], ['user:42', 0.8], ['config:flags', 3]];
      const t0 = sp('d4', 0.1);
      keys.forEach(([name, at], i) => {
        const y = 400 + i * 100, k = easeOut(range(lt, 0.5 + i * 0.2, 1.0 + i * 0.2)), exp = sp('d4', Math.min(at, 0.95));
        const remain = at >= 3 ? 1 - 0.15 * range(lt, t0, t0 + 6) : 1 - range(lt, t0, exp), gone = at < 3 && lt >= exp;
        const col = remain < 0.35 ? C.proton : GREEN;
        label(ctx, name, 560, y, { size: 30, mono: true, align: 'left', alpha: a * k * (gone ? 0.25 : 1), weight: 600 });
        ctx.save(); ctx.globalAlpha = a * k * (gone ? 0.25 : 1); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.roundRect(900, y - 16, 500, 32, 10); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(900, y - 16, Math.max(0.01, 500 * remain), 32, 10); ctx.fill(); ctx.restore();
        label(ctx, gone ? 'expired' : at >= 3 ? 'no TTL' : 'TTL', 1440, y, { size: 22, mono: true, color: gone ? C.proton : C.dim, align: 'left', alpha: a * k, weight: 700 });
      });
      label(ctx, 'old entries disappear on their own', CX, 790, { size: 30, mono: true, color: GREEN, alpha: a * range(lt, sp('d4', 0.6), sp('d4', 0.6) + 0.8), weight: 700 });
      caption(ctx, 'd4', a, lt, CS.d4);
    },

    types(ctx, t) {
      const a = chapterAlpha(T, 'types', t), lt = t - T.types[0];
      chapterTag(ctx, '04', 'Data structures', a);
      const names = ['string', 'list', 'set', 'sorted set', 'hash'], at = [0.0, 0.3, 0.5, 0.65, 0.85];
      names.forEach((n, i) => {
        const x = 100 + i * 360, k = easeOut(range(lt, sp('d5', at[i]), sp('d5', at[i]) + 0.7));
        panel(ctx, x, 270, 330, 380, RD, a * k, 0.05, 22);
        label(ctx, n, x + 165, 308, { size: 26, mono: true, color: RD, alpha: a * k, weight: 700 });
        const cxp = x + 165;
        if (i === 0) chip(ctx, '"hello"', x + 40, 450, { color: C.electron, size: 40, alpha: a * k, w: 250 });
        if (i === 1) { ['a', 'b', 'c', 'd'].forEach((s, j) => card(ctx, x + 62 + j * 68, 450, KC(j), a * k, 58, 70)); label(ctx, 'push / pop at ends', cxp, 540, { size: 18, mono: true, color: C.dim, alpha: a * k, weight: 500 }); }
        if (i === 2) { [[-60, -30], [40, -50], [-20, 30], [70, 20], [-70, 60]].forEach(([dx, dy], j) => glowDot(ctx, cxp + dx, 440 + dy, 22, KC(j), a * k)); label(ctx, 'unique members', cxp, 560, { size: 18, mono: true, color: C.dim, alpha: a * k, weight: 500 }); }
        if (i === 3) { [[200, 'ann'], [160, 'bo'], [110, 'cy'], [70, 'di']].forEach(([w, s], j) => { ctx.save(); ctx.globalAlpha = a * k; ctx.fillStyle = KC(j); ctx.beginPath(); ctx.roundRect(x + 40, 390 + j * 52, w, 34, 8); ctx.fill(); ctx.restore(); label(ctx, `${s}`, x + 50, 407 + j * 52, { size: 18, mono: true, color: C.bg, align: 'left', alpha: a * k, weight: 700 }); }); label(ctx, 'ranked by score', cxp, 620, { size: 18, mono: true, color: C.dim, alpha: a * k, weight: 500 }); }
        if (i === 4) { [['name', 'Ada'], ['role', 'dev'], ['team', 'api']].forEach(([f, v], j) => { label(ctx, f, x + 50, 410 + j * 62, { size: 24, mono: true, color: C.gold, align: 'left', alpha: a * k, weight: 600 }); label(ctx, v, x + 190, 410 + j * 62, { size: 24, mono: true, align: 'left', alpha: a * k, weight: 600 }); }); label(ctx, 'fields in one key', cxp, 620, { size: 18, mono: true, color: C.dim, alpha: a * k, weight: 500 }); }
      });
      ['sessions', 'rate limits', 'queues', 'leaderboards'].forEach((s, i) =>
        chip(ctx, s, 150 + i * 420, 790, { color: GREEN, size: 34, alpha: a * easeOut(range(lt, sp('d6', 0.15 + i * 0.2), sp('d6', 0.15 + i * 0.2) + 0.6)), w: 380 }));
      caption(ctx, 'd5', a, lt, CS.d5);
      caption(ctx, 'd6', a, lt, CS.d6);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 3;
      label(ctx, 'Keep hot data', CX, CY - 60, { size: 100, weight: 700, color: C.text, alpha: a * range(lt, 0.5, 1.3) });
      label(ctx, 'close.', CX, CY + 70, { size: 100, weight: 700, color: RD, alpha: a * range(lt, 0.5 + s * 0.5, 1.3 + s * 0.5) });
    },
  },
});

function KC(i) { return [C.electron, C.gold, GREEN, C.copper, '#c792ea'][i % 5]; }
