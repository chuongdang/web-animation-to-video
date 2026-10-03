import { C, label, chapterTag, chapterAlpha, glowDot, chip, arrow, card, token } from '/runtime/kit.js';

const { range, easeOut } = Scene;

const GREEN = '#7ee787';
const GC = { x: 1250, y: 430, rx: 330, ry: 200 }, N = 18;
const NAMES = { 0: 'index.js', 3: 'auth.js', 6: 'db.js', 9: 'api.js', 12: 'ui.js', 15: 'utils.js' };
const POS = Array.from({ length: N }, (_, i) => {
  const ang = i * 2.4 + 0.5, r = Math.sqrt((i + 0.6) / N);
  return [GC.x + Math.cos(ang) * GC.rx * r, GC.y + Math.sin(ang) * GC.ry * r];
});
// each node links to its two nearest earlier nodes
const EDGES = POS.flatMap((p, i) => POS.slice(0, i)
  .map((q, j) => [j, Math.hypot(p[0] - q[0], p[1] - q[1])])
  .sort((u, v) => u[1] - v[1]).slice(0, 2).map(([j]) => [j, i]));
const FOCUS = (() => {
  const q = 9, near = EDGES.filter(([u, v]) => u === q || v === q).map(([u, v]) => (u === q ? v : u));
  return [q, ...near.slice(0, 2)];
})();
const DEVS = [['you', C.electron, 1000], ['dev 2', C.gold, 1250], ['dev 3', GREEN, 1500]];

/** Chapter 2: index once with graphify, share the graph through git, query it instead of reading files. */
export default function graph({ T, CS, sp, caption }) {
  return (ctx, t) => {
    const a = chapterAlpha(T, 'graph', t), lt = t - T.graph[0];
    chapterTag(ctx, '02', 'Index once with graphify', a);
    const n0 = sp('g1', 0.35), n1 = sp('g1', 0.95), shown = (i) => range(lt, n0 + (i / N) * (n1 - n0), n0 + (i / N) * (n1 - n0) + 0.5);
    const g3 = range(lt, sp('g3', 0.05), sp('g3', 0.05) + 0.8), team = 1 - range(lt, CS.g3, CS.g3 + 0.6);

    // source -> graphify
    const sk = easeOut(range(lt, 0.4, 1.1));
    label(ctx, 'source code', 250, 205, { size: 28, mono: true, color: C.dim, alpha: a * sk, weight: 500 });
    for (let i = 0; i < 5; i++) card(ctx, 250, 270 + i * 90, C.dim, a * sk * 0.9, 150, 56);
    arrow(ctx, 340, 450, 440, 450, C.dim, a * range(lt, 0.8, 1.4));
    chip(ctx, 'graphify', 450, 450, { color: C.gold, size: 38, w: 230, weight: 700, alpha: a * range(lt, 0.9, 1.5) });
    arrow(ctx, 690, 450, 890, 450, C.gold, a * range(lt, n0 - 0.2, n0 + 0.4));

    // knowledge graph
    const dim = 1 - 0.75 * g3;
    EDGES.forEach(([u, v]) => {
      const k = Math.min(shown(u), shown(v)), foc = FOCUS.includes(u) && FOCUS.includes(v);
      if (k <= 0) return;
      ctx.save();
      ctx.globalAlpha = a * k * (foc ? lerp1(dim, 1, g3) : dim) * 0.7;
      ctx.strokeStyle = foc && g3 > 0 ? C.gold : C.electron; ctx.lineWidth = foc && g3 > 0 ? 5 : 2.5;
      ctx.beginPath(); ctx.moveTo(...POS[u]); ctx.lineTo(...POS[v]); ctx.stroke();
      ctx.restore();
    });
    POS.forEach(([x, y], i) => {
      const foc = FOCUS.includes(i);
      glowDot(ctx, x, y, foc ? 14 + 8 * g3 : 14, foc && g3 > 0 ? C.gold : C.electron, a * shown(i) * (foc ? 1 : dim));
      if (NAMES[i]) label(ctx, NAMES[i], x + 20, y - 24, { size: 22, mono: true, color: C.text, alpha: a * shown(i) * (foc ? 1 : dim), align: 'left', weight: 500 });
    });
    label(ctx, 'knowledge graph', GC.x, 175, { size: 28, mono: true, color: C.dim, alpha: a * range(lt, n0, n0 + 0.8), weight: 500 });

    // shared through git
    const tk = (i) => easeOut(range(lt, sp('g2', 0.3 + i * 0.15), sp('g2', 0.3 + i * 0.15) + 0.7)) * team;
    chip(ctx, 'committed to git', GC.x - 190, 705, { color: GREEN, size: 34, w: 380, alpha: a * tk(0) });
    DEVS.forEach(([name, col, x], i) => {
      ctx.save(); ctx.globalAlpha = a * tk(i) * 0.7; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(x, 790); ctx.lineTo(GC.x + (x - GC.x) * 0.3, 740); ctx.stroke(); ctx.restore();
      glowDot(ctx, x, 830, 26, col, a * tk(i));
      label(ctx, name, x, 885, { size: 26, mono: true, alpha: a * tk(i), weight: 500 });
    });

    // agent queries the graph through the graphify MCP server (not by loading graph.json)
    chip(ctx, 'claude', 100, 790, { color: C.copper, size: 34, w: 190, weight: 700, alpha: a * g3 });
    arrow(ctx, 300, 790, 360, 790, C.dim, a * g3, 3);
    chip(ctx, 'graphify MCP', 370, 790, { color: C.gold, size: 34, w: 320, weight: 700, alpha: a * g3 });
    const [fx, fy] = POS[FOCUS[0]];
    arrow(ctx, 700, 770, fx - 30, fy + 20, C.copper, a * g3, 3);
    token(ctx, 'query_graph', 840, 690, C.copper, a * g3, 24);
    label(ctx, 'not: cat graph.json', 530, 870, { size: 28, mono: true, color: C.proton, alpha: a * range(lt, sp('g3', 0.45), sp('g3', 0.45) + 0.7), weight: 600 });
    label(ctx, 'reads 3 files, not 30', GC.x, 790, { size: 44, weight: 700, color: C.gold, alpha: a * range(lt, sp('g3', 0.5), sp('g3', 0.5) + 0.8) });
    caption(ctx, 'g1', a, lt, CS.g1);
    caption(ctx, 'g2', a, lt, CS.g2);
    caption(ctx, 'g3', a, lt, CS.g3);
  };
}

const lerp1 = (x, y, k) => x + (y - x) * k;
