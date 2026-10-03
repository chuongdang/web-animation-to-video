import { C, CX, CY, label, narration, plan, speech, mount, titleCard, token, measure } from '/runtime/kit.js';
import drain from './drain.js';
import sandbox from './sandbox.js';
import index from './index.js';
import memory from './memory.js';

const { range, easeOut, fadeWindow } = Scene;

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- software-engineering/ai-coding/context-mode`.
const TXT = {
  c1: 'The biggest drain is [[tool output]]: one test run or log file can dump [[tens of thousands]] of tokens.',
  c2: 'Run it in a [[sandbox]] instead: the raw output stays outside, only the [[answer]] comes back.',
  c3: 'Large content is [[indexed]] into a local database with ranked full-text search.',
  c4: 'The agent [[searches]] and gets back only the [[matching snippets]].',
  c5: 'It also records [[session events]]: edits, tasks and decisions.',
  c6: 'After [[compaction]], it retrieves just the [[relevant memories]] so the agent keeps its thread.',
};
const nar = await narration('software-engineering/ai-coding/context-mode', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { drain: ['c1'], sandbox: ['c2'], index: ['c3', 'c4'], memory: ['c5', 'c6'] });
const { CS, T } = P;
const env = { T, CS, sp: speech(nar, CS), caption };

const GREEN = '#7ee787';
const WORDS = [['sandbox', C.gold], ['index', C.electron], ['search', GREEN], ['memory', C.copper]];

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
      titleCard(ctx, t, T, { l1: 'Keep raw output', l2: 'out of context', sub: 'context-mode: sandbox, index, remember', size: 116 });
    },
    drain: drain(env),
    sandbox: sandbox(env),
    index: index(env),
    memory: memory(env),
    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 5;
      const parts = [['sandbox', C.gold], ['search', C.electron], ['remember', GREEN]];
      const gap = 50, size = 70;
      const widths = parts.map(([txt]) => measure(ctx, txt, size, 700));
      let x = CX - (widths.reduce((q, w) => q + w, 0) + gap * 2) / 2;
      parts.forEach(([txt, col], i) => {
        const k = easeOut(range(lt, 0.5 + (s * i) / 4, 1.2 + (s * i) / 4));
        label(ctx, txt, x, CY - 40, { size, weight: 700, color: col, alpha: a * k, align: 'left' });
        x += widths[i] + gap;
      });
      label(ctx, '= a lean context', CX, CY + 80, { size: 100, weight: 700, alpha: a * range(lt, 0.5 + s * 0.8, 1.3 + s * 0.8) });
    },
  },
});
