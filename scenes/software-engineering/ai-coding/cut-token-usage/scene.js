import { C, CX, CY, label, narration, plan, speech, mount, titleCard, token, measure } from '/runtime/kit.js';
import problem from './problem.js';
import graph from './graph.js';
import planning from './planning.js';
import delegate from './delegate.js';
import validate from './validate.js';

const { range, easeOut, fadeWindow } = Scene;

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- software-engineering/ai-coding/cut-token-usage`.
const TXT = {
  p1: 'Every file Claude reads lands in the [[context window]], and every [[token]] costs money.',
  p2: 'On a big repo, most of those tokens go to code that has [[nothing to do]] with the task.',
  g1: 'Index the code once with [[graphify]]: a knowledge graph of files, functions and links.',
  g2: 'Commit the graph, and the [[whole team]] shares it.',
  g3: 'It queries the graph via [[graphify MCP]], not the big JSON, and reads only the [[few files]] that matter.',
  pl1: 'It queries the [[graph]] over [[MCP]], reads your [[requirements]], then writes an execution [[plan]].',
  pl2: 'You [[confirm]] the plan first. If something is off, it [[refines]] and asks again.',
  pl3: 'Fixing a [[plan]] costs a few lines. Fixing [[code]] costs a rewrite.',
  d1: 'Once approved, the main agent [[delegates]] each step to a subagent.',
  d2: 'Each subagent gets a small, [[clean context]] and returns only a [[short summary]].',
  v1: 'At the end, [[validate]]: run the tests, check against the requirements.',
  v2: 'Anything missing goes [[back]] to a subagent for a fix.',
};
const nar = await narration('software-engineering/ai-coding/cut-token-usage', TXT);
const { caption, spoken } = nar;
const P = plan(nar, {
  problem: ['p1', 'p2'],
  graph: ['g1', 'g2', 'g3'],
  planning: ['pl1', 'pl2', 'pl3'],
  delegate: ['d1', 'd2'],
  validate: ['v1', 'v2'],
});
const { CS, T } = P;
const env = { T, CS, sp: speech(nar, CS), caption };

const GREEN = '#7ee787';
const WORDS = [['graph', C.electron], ['plan', C.gold], ['delegate', GREEN], ['validate', C.copper]];

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      WORDS.forEach(([w, col], i) => {
        const ang = t * 0.4 + (i / WORDS.length) * Math.PI * 2;
        token(ctx, w, CX + Math.cos(ang) * 780, CY + Math.sin(ang) * 400, col, a * 0.3, 26);
      });
      titleCard(ctx, t, T, { l1: 'Cut Claude Code', l2: 'token usage', sub: 'graph, plan, delegate, validate', size: 116 });
    },
    problem: problem(env),
    graph: graph(env),
    planning: planning(env),
    delegate: delegate(env),
    validate: validate(env),
    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 5;
      const parts = [['index once', C.electron], ['plan first', C.gold], ['delegate small', GREEN], ['validate last', C.copper]];
      const gap = 36, size = 56;
      const widths = parts.map(([txt]) => measure(ctx, txt, size, 700));
      let x = CX - (widths.reduce((q, w) => q + w, 0) + gap * 3) / 2;
      parts.forEach(([txt, col], i) => {
        const k = easeOut(range(lt, 0.5 + (s * i) / 5, 1.2 + (s * i) / 5));
        label(ctx, txt, x, CY - 40, { size, weight: 700, color: col, alpha: a * k, align: 'left' });
        x += widths[i] + gap;
      });
      label(ctx, '= fewer tokens', CX, CY + 80, { size: 100, weight: 700, alpha: a * range(lt, 0.5 + s * 0.8, 1.3 + s * 0.8) });
    },
  },
});
