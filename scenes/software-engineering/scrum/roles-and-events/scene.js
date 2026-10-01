import { C, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, chip, panel, cycle } from '/runtime/kit.js';

const { range, easeOut, fadeWindow } = Scene;

const GREEN = '#7ee787';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- software-engineering/scrum/roles-and-events`.
const TXT = {
  r1: 'Scrum has three accountabilities, each solving a [[different problem]].',
  r2: 'The [[Product Owner:gold]] decides what is most valuable to build, and why.',
  r3: 'The [[Developers:electron]] decide how to build it, and own the quality.',
  r4: 'The [[Scrum Master:green]] removes obstacles and helps the team improve.',
  v1: 'Each event exists to [[inspect and adapt:green]].',
  v2: '[[Sprint Planning]] agrees what we can deliver, and how.',
  v3: 'The [[Daily Scrum]] is a short check on progress toward the goal.',
  v4: 'The [[Sprint Review]] shows the increment and gathers [[feedback]].',
  v5: 'The [[Retrospective]] improves how the team works.',
};
const nar = await narration('software-engineering/scrum/roles-and-events', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { roles: ['r1', 'r2', 'r3', 'r4'], events: ['v1', 'v2', 'v3', 'v4', 'v5'] });
const { CS, T } = P;
const sp = speech(nar, CS);

const ROLES = [
  { id: 'r2', x: 400, color: C.gold, short: 'PO', name: 'Product Owner', q: 'What, and why?', without: 'everyone pulls in a different direction' },
  { id: 'r3', x: 960, color: C.electron, short: 'DEV', name: 'Developers', q: 'How do we build it?', without: 'nobody owns the quality' },
  { id: 'r4', x: 1520, color: GREEN, short: 'SM', name: 'Scrum Master', q: 'How do we work better?', without: 'obstacles pile up unseen' },
];
const EVENTS = [
  { text: 'Planning', color: C.gold, purpose: 'what can we deliver, and how?', id: 'v2' },
  { text: 'Daily Scrum', color: C.electron, purpose: 'are we on track for the goal?', id: 'v3' },
  { text: 'Review', color: GREEN, purpose: 'what did we build, what do users say?', id: 'v4' },
  { text: 'Retrospective', color: C.copper, purpose: 'how do we work better next time?', id: 'v5' },
];

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      ROLES.forEach((r, i) => glowDot(ctx, 560 + i * 400, 190, 30, r.color, a * 0.35 * range(t, 0.5 + i * 0.2, 1.1 + i * 0.2)));
      titleCard(ctx, t, T, { l1: 'Scrum roles', l2: 'and events', sub: 'why each one exists', tint: GREEN });
    },

    roles(ctx, t) {
      const a = chapterAlpha(T, 'roles', t), lt = t - T.roles[0];
      chapterTag(ctx, '01', 'Three accountabilities', a);
      ROLES.forEach((r, i) => {
        const k = easeOut(range(lt, sp(r.id, 0.0), sp(r.id, 0.0) + 0.7)), hint = 0.25 * easeOut(range(lt, sp('r1', 0.4), sp('r1', 0.4) + 0.8));
        const aa = a * Math.max(k, hint);
        ctx.save(); ctx.globalAlpha = aa; ctx.fillStyle = r.color; ctx.shadowColor = r.color; ctx.shadowBlur = 30;
        ctx.beginPath(); ctx.arc(r.x, 330, 92, 0, Math.PI * 2); ctx.globalAlpha = aa * 0.18; ctx.fill(); ctx.globalAlpha = aa; ctx.lineWidth = 6; ctx.strokeStyle = r.color; ctx.stroke(); ctx.restore();
        label(ctx, r.short, r.x, 332, { size: 58, weight: 700, color: r.color, alpha: aa });
        chip(ctx, r.name, r.x - 190, 510, { color: r.color, size: 40, alpha: a * k, w: 380, weight: 700 });
        label(ctx, r.q, r.x, 605, { size: 34, weight: 600, alpha: a * range(k, 0.4, 1) });
        label(ctx, 'without it:', r.x, 700, { size: 24, mono: true, color: C.dim, alpha: a * range(k, 0.6, 1), weight: 500 });
        label(ctx, r.without, r.x, 742, { size: 26, mono: true, color: C.proton, alpha: a * range(k, 0.6, 1), weight: 600 });
      });
      caption(ctx, 'r1', a, lt, CS.r1);
      caption(ctx, 'r2', a, lt, CS.r2);
      caption(ctx, 'r3', a, lt, CS.r3);
      caption(ctx, 'r4', a, lt, CS.r4);
    },

    events(ctx, t) {
      const a = chapterAlpha(T, 'events', t), lt = t - T.events[0];
      chapterTag(ctx, '02', 'Four events', a);
      // which event is being explained right now
      const starts = EVENTS.map((e) => CS[e.id]);
      let active = -1;
      starts.forEach((s, i) => { if (lt >= s) active = i; });
      const reveal = EVENTS.reduce((s, e) => s + easeOut(range(lt, sp(e.id, 0.0), sp(e.id, 0.0) + 0.6)), 0);
      cycle(ctx, CX, 500, 560, 230, EVENTS, { alpha: a * easeOut(range(lt, 0.3, 1.0)), reveal, active, size: 38 });
      label(ctx, 'SPRINT', CX, 440, { size: 28, mono: true, color: C.dim, alpha: a * easeOut(range(lt, 0.3, 1.0)), weight: 600 });
      const ik = easeOut(range(lt, sp('v1', 0.45), sp('v1', 0.45) + 0.7));
      if (active < 0) {
        label(ctx, 'inspect  +  adapt', CX, 520, { size: 52, weight: 700, color: GREEN, alpha: a * ik });
      } else {
        const e = EVENTS[active], k = easeOut(range(lt, starts[active] + 0.7, starts[active] + 1.4));
        label(ctx, e.purpose, CX, 520, { size: 40, weight: 600, color: e.color, alpha: a * k });
      }
      caption(ctx, 'v1', a, lt, CS.v1);
      caption(ctx, 'v2', a, lt, CS.v2);
      caption(ctx, 'v3', a, lt, CS.v3);
      caption(ctx, 'v4', a, lt, CS.v4);
      caption(ctx, 'v5', a, lt, CS.v5);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 3;
      label(ctx, 'Every part', CX, CY - 60, { size: 100, weight: 700, color: C.gold, alpha: a * range(lt, 0.5, 1.3) });
      label(ctx, 'has a purpose.', CX, CY + 70, { size: 100, weight: 700, color: GREEN, alpha: a * range(lt, 0.5 + s * 0.5, 1.3 + s * 0.5) });
    },
  },
});
