import { C, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, chip, token, panel, arrow, pathAt, card } from '/runtime/kit.js';

const { clamp, lerp, range, easeOut, easeInOut, fadeWindow } = Scene;

const GREEN = '#7ee787', RD = '#ff6b5c', VK = '#7ee787';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- software-engineering/in-memory-stores/redis-vs-valkey`.
const TXT = {
  v1: 'In 2024, Redis moved from a permissive open source license to [[source-available licenses:proton]].',
  v2: 'In response, the Linux Foundation and the community [[forked:green]] the last open source version as [[Valkey:green]].',
  v3: 'Valkey stays [[compatible]]: the same protocol, the same commands, and the same client libraries.',
  v4: 'So moving between them is usually just a [[change of address:green]].',
  v5: 'Valkey is developed [[in the open]], with backing from major cloud providers.',
  v6: 'Choose by your [[license needs]], your cloud\'s [[managed offering]], and the features you rely on.',
};
const nar = await narration('software-engineering/in-memory-stores/redis-vs-valkey', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { fork: ['v1', 'v2'], compat: ['v3', 'v4'], choose: ['v5', 'v6'] });
const { CS, T } = P;
const sp = speech(nar, CS);

const lerp2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
function node(ctx, name, x, y, color, alpha, w = 260, h = 150) {
  if (alpha <= 0) return;
  panel(ctx, x - w / 2, y - h / 2, w, h, color, alpha, 0.07, 22);
  label(ctx, name, x, y - h / 2 + 32, { size: 24, mono: true, color, alpha, weight: 700 });
}
const bez = (p0, p1, p2, p3, u) => {
  const m = 1 - u;
  return [m * m * m * p0[0] + 3 * m * m * u * p1[0] + 3 * m * u * u * p2[0] + u * u * u * p3[0], m * m * m * p0[1] + 3 * m * m * u * p1[1] + 3 * m * u * u * p2[1] + u * u * u * p3[1]];
};
function strokePath(ctx, fn, u, color, alpha, width = 8) {
  if (u <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  const n = Math.max(1, Math.floor(80 * u));
  for (let i = 0; i <= n; i++) { const [x, y] = fn(i / 80); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.stroke(); ctx.restore();
}

// ---- chapter 1: the fork ------------------------------------------------------------------
const FORK = [820, 450];
const upper = (u) => bez(FORK, [1100, 450], [1300, 310], [1700, 310], u);
const lower = (u) => bez(FORK, [1100, 450], [1300, 590], [1700, 590], u);

// ---- chapter 2: one client, two servers -----------------------------------------------------
const CLI = [330, 450], SRV = [[1450, 320], [1450, 580]];

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      const k = range(t, 0.5, 1.6);
      strokePath(ctx, (u) => [lerp(640, 960, u), 190], k, RD, a * 0.35, 6);
      strokePath(ctx, (u) => bez([960, 190], [1060, 190], [1100, 150], [1300, 150], u), k, RD, a * 0.35, 6);
      strokePath(ctx, (u) => bez([960, 190], [1060, 190], [1100, 230], [1300, 230], u), k, VK, a * 0.35, 6);
      titleCard(ctx, t, T, { l1: 'Redis', l2: 'vs Valkey', sub: 'a fork, and why it happened', tint: VK, size: 120 });
    },

    fork(ctx, t) {
      const a = chapterAlpha(T, 'fork', t), lt = t - T.fork[0];
      chapterTag(ctx, '01', 'The fork', a);
      const base = easeOut(range(lt, 0.3, 1.3));
      strokePath(ctx, (u) => [lerp(200, FORK[0], u), 450], base, RD, a, 8);
      label(ctx, 'Redis', 360, 395, { size: 38, weight: 700, color: RD, alpha: a * range(lt, 0.5, 1.0) });
      label(ctx, 'permissive license (BSD)', 460, 510, { size: 26, mono: true, color: C.dim, alpha: a * range(lt, 0.8, 1.4), weight: 500 });
      const mk = easeOut(range(lt, sp('v1', 0.3), sp('v1', 0.3) + 0.6));
      ctx.save(); ctx.globalAlpha = a * mk; ctx.strokeStyle = C.gold; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(FORK[0], 380); ctx.lineTo(FORK[0], 520); ctx.stroke(); ctx.restore();
      label(ctx, '2024: license change', FORK[0], 565, { size: 28, mono: true, color: C.gold, alpha: a * mk, weight: 700 });
      const uk = easeInOut(range(lt, sp('v1', 0.5), sp('v1', 0.5) + 1.2));
      strokePath(ctx, upper, uk, RD, a, 8);
      chip(ctx, 'Redis · source-available', 1260, 250, { color: C.proton, size: 32, alpha: a * range(uk, 0.8, 1), w: 480 });
      const lk = easeInOut(range(lt, sp('v2', 0.3), sp('v2', 0.3) + 1.4));
      strokePath(ctx, lower, lk, VK, a, 8);
      chip(ctx, 'Valkey · BSD · Linux Foundation', 1180, 650, { color: VK, size: 32, alpha: a * range(lk, 0.8, 1), w: 580, weight: 700 });
      label(ctx, 'forked from the last open source version', FORK[0] + 20, 640, { size: 24, mono: true, color: VK, alpha: a * range(lk, 0.2, 0.6) * (1 - range(lk, 0.9, 1)), weight: 600 });
      caption(ctx, 'v1', a, lt, CS.v1);
      caption(ctx, 'v2', a, lt, CS.v2);
    },

    compat(ctx, t) {
      const a = chapterAlpha(T, 'compat', t), lt = t - T.compat[0];
      chapterTag(ctx, '02', 'Compatibility', a);
      const nk = easeOut(range(lt, 0.2, 0.8));
      node(ctx, 'your app + client', ...CLI, C.electron, a * nk, 320, 170);
      node(ctx, 'Redis', ...SRV[0], RD, a * nk, 300, 140);
      node(ctx, 'Valkey', ...SRV[1], VK, a * nk, 300, 140);
      // both servers answer the same commands; at the end the app is simply pointed at Valkey
      const swStart = sp('v4', 0.45), sw = easeInOut(range(lt, swStart, swStart + 0.9));
      [0, 1].forEach((i) => {
        const w = i === 0 ? 1 - sw : 1;
        ctx.save(); ctx.globalAlpha = a * nk * (0.15 + 0.85 * w); ctx.strokeStyle = i ? VK : RD; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(CLI[0] + 170, CLI[1] + (i ? 20 : -20)); ctx.lineTo(SRV[i][0] - 160, SRV[i][1]); ctx.stroke(); ctx.restore();
      });
      const cmds = [['SET k v', 'OK'], ['GET k', 'v']];
      for (let n = 0; n < 14; n++) {
        const t0 = sp('v3', 0.25) + n * 1.2, [cmd, rep] = cmds[n % 2];
        [0, 1].forEach((i) => {
          if (i === 0 && lt >= swStart + 0.9) return;
          const u = (lt - t0) / 1.4;
          if (u <= 0 || u >= 1) return;
          const from = [CLI[0] + 190, CLI[1] + (i ? 20 : -20)], to = [SRV[i][0] - 200, SRV[i][1]];
          const out = u < 0.5, p = out ? lerp2(from, to, easeInOut(u / 0.5)) : lerp2(to, from, easeInOut((u - 0.5) / 0.5));
          card(ctx, ...p, out ? C.electron : (i ? VK : RD), a * (i === 0 ? 1 - sw : 1), 110, 40);
          label(ctx, out ? cmd : rep, ...p, { size: 18, mono: true, weight: 700, alpha: a * (i === 0 ? 1 - sw : 1) });
        });
      }
      label(ctx, 'same protocol · same commands · same clients', CX, 790, { size: 28, mono: true, color: GREEN, alpha: a * range(lt, sp('v3', 0.6), sp('v3', 0.6) + 0.8), weight: 700 });
      label(ctx, 'only the host changes', CX, 730, { size: 28, mono: true, color: C.gold, alpha: a * range(sw, 0.2, 0.6), weight: 700 });
      caption(ctx, 'v3', a, lt, CS.v3);
      caption(ctx, 'v4', a, lt, CS.v4);
    },

    choose(ctx, t) {
      const a = chapterAlpha(T, 'choose', t), lt = t - T.choose[0];
      chapterTag(ctx, '03', 'Which to choose', a);
      [['v5', 240, VK, 'Valkey', ['BSD license', 'Linux Foundation governance', 'cloud-managed options']], ['v6', 1020, RD, 'Redis', ['vendor roadmap', 'commercial support', 'its own feature set']]].forEach(([id, x, col, name, items], pi) => {
        const k = easeOut(range(lt, sp('v5', pi * 0.1), sp('v5', pi * 0.1) + 0.7)), vis = pi ? easeOut(range(lt, sp('v6', 0.0), sp('v6', 0.0) + 0.7)) : k;
        panel(ctx, x, 250, 660, 370, col, a * vis, 0.06, 24);
        label(ctx, name, x + 330, 305, { size: 44, mono: true, color: col, weight: 700, alpha: a * vis });
        items.forEach((s, i) => label(ctx, s, x + 330, 395 + i * 62, { size: 36, weight: 600, alpha: a * range(vis, 0.3 + i * 0.2, 0.6 + i * 0.2) }));
      });
      ['license needs', 'managed offering', 'features you need'].forEach((s, i) =>
        chip(ctx, s, 250 + i * 480, 790, { color: C.gold, size: 34, alpha: a * easeOut(range(lt, sp('v6', 0.35 + i * 0.15), sp('v6', 0.35 + i * 0.15) + 0.6)), w: 440 }));
      caption(ctx, 'v5', a, lt, CS.v5);
      caption(ctx, 'v6', a, lt, CS.v6);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 3;
      label(ctx, 'Same protocol.', CX, CY - 60, { size: 100, weight: 700, color: C.electron, alpha: a * range(lt, 0.5, 1.3) });
      label(ctx, 'Different governance.', CX, CY + 70, { size: 100, weight: 700, color: VK, alpha: a * range(lt, 0.5 + s * 0.5, 1.3 + s * 0.5) });
    },
  },
});
