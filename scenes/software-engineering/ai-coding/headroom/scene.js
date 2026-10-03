import { C, CX, CY, label, narration, plan, speech, mount, titleCard, token, measure } from '/runtime/kit.js';
import layer from './layer.js';
import compress from './compress.js';
import reversible from './reversible.js';

const { range, easeOut, fadeWindow } = Scene;

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- software-engineering/ai-coding/headroom`.
const TXT = {
  h1: 'Even when output must reach the model, most of it is [[repetition]]: JSON fields, log noise, boilerplate.',
  h2: '[[Headroom]] sits between your tools and the model, and [[compresses]] the content first.',
  h3: 'It is [[content-aware]]: JSON, code and logs each get their own compressor, so the [[key lines]] survive.',
  h4: 'And it is [[reversible]]: the original is cached locally, so the model can ask for the [[full detail]].',
  h5: 'Run it as a local [[proxy]], a [[library]] or an [[MCP server]], and your workflow stays the same.',
};
const nar = await narration('software-engineering/ai-coding/headroom', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { layer: ['h1', 'h2'], compress: ['h3'], reverse: ['h4', 'h5'] });
const { CS, T } = P;
const env = { T, CS, sp: speech(nar, CS), caption };

const GREEN = '#7ee787';
const WORDS = [['JSON', C.electron], ['code', C.gold], ['logs', C.copper], ['cache', GREEN]];

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
      titleCard(ctx, t, T, { l1: 'Shrink what the', l2: 'model reads', sub: 'Headroom: compress, stay reversible', size: 116 });
    },
    layer: layer(env),
    compress: compress(env),
    reverse: reversible(env),
    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 4;
      const parts = [['sandbox what you can', C.gold], ['compress what you must', C.electron]];
      const gap = 60, size = 56;
      const widths = parts.map(([txt]) => measure(ctx, txt, size, 700));
      let x = CX - (widths.reduce((q, w) => q + w, 0) + gap) / 2;
      parts.forEach(([txt, col], i) => {
        const k = easeOut(range(lt, 0.5 + (s * i) / 2, 1.2 + (s * i) / 2));
        label(ctx, txt, x, CY - 40, { size, weight: 700, color: col, alpha: a * k, align: 'left' });
        x += widths[i] + gap;
      });
      label(ctx, '= fewer tokens', CX, CY + 80, { size: 100, weight: 700, alpha: a * range(lt, 0.5 + s * 0.8, 1.3 + s * 0.8) });
    },
  },
});
