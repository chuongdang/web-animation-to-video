import { C, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard } from '/runtime/kit.js';

const { range, easeOut } = Scene;

// Caption markup: [[keyword]] is highlighted; [[keyword:electron]] picks a colour (electron, proton, gold, copper, green).
const TXT = {
  one1: 'The [[first]] thing to say.',
  one2: 'The [[second]] thing to say.',
};
const nar = await narration('__ID__', TXT);
const { caption } = nar;
// chapters -> caption ids, in order. Timing follows the narration (run `npm run narrate -- __ID__` first).
const P = plan(nar, { one: ['one1', 'one2'] });
const { CS, T } = P;
const sp = speech(nar, CS); // sp('one1', 0.5): when half of that line has been spoken

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      titleCard(ctx, t, T, { l1: '__TITLE__', l2: 'explained', sub: 'a short animated explainer' });
    },
    one(ctx, t) {
      const a = chapterAlpha(T, 'one', t), lt = t - T.one[0];
      chapterTag(ctx, '01', 'First chapter', a);
      glowDot(ctx, CX + Math.sin(lt) * 200, CY, 30, C.electron, a * range(lt, sp('one1', 0.3), sp('one1', 0.3) + 0.6));
      caption(ctx, 'one1', a, lt, CS.one1);
      caption(ctx, 'one2', a, lt, CS.one2);
    },
    outro(ctx, t) {
      const a = Scene.fadeWindow(t, ...T.outro, 0.7, 0.8), lt = t - T.outro[0];
      label(ctx, 'A closing line.', CX, CY, { size: 90, weight: 700, alpha: a * range(lt, 0.5, 1.3), color: C.electron });
    },
  },
});
