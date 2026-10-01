import { C, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, chip, token, panel, arrow, pathAt } from '/runtime/kit.js';

const { clamp, lerp, range, easeOut, easeInOut, fadeWindow } = Scene;

const GREEN = '#7ee787', SC = C.electron, KB = C.gold;
const TINTS = [C.electron, C.gold, GREEN, C.copper, '#c792ea'];

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- software-engineering/scrum/scrum-vs-kanban`.
const TXT = {
  c1: 'Scrum and Kanban both make work [[visible]] on a [[board]].',
  c2: 'Both aim for [[steady delivery]] and constant improvement.',
  k1: '[[Scrum:electron]] works in fixed-length [[sprints]], committing to a goal up front.',
  k2: '[[Kanban:gold]] is a [[continuous flow]]: new work is pulled in when there is capacity.',
  l1: 'Scrum limits work by [[time]]. Kanban limits it with a [[work-in-progress limit]].',
  l2: 'Scrum protects the sprint from change. Kanban welcomes [[change at any time:green]].',
  m1: 'Scrum prescribes [[roles and events]]. Kanban prescribes none.',
  m2: 'Scrum tracks [[velocity]]. Kanban tracks [[cycle time]].',
  w1: 'Choose [[Scrum:electron]] for [[product work]] that benefits from a steady rhythm.',
  w2: 'Choose [[Kanban:gold]] when work [[arrives unpredictably]], like support or operations.',
  w3: 'Many teams blend both, often called [[Scrumban:green]].',
};
const nar = await narration('software-engineering/scrum/scrum-vs-kanban', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { same: ['c1', 'c2'], cadence: ['k1', 'k2'], limits: ['l1', 'l2'], table: ['m1', 'm2'], choose: ['w1', 'w2', 'w3'] });
const { CS, T } = P;
const sp = speech(nar, CS);

function card(ctx, x, y, color, alpha = 1, w = 150, h = 52) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha * 0.25; ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, 10); ctx.fill();
  ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
}
const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

// ---- chapter 1: a shared board -------------------------------------------------------
const COLS = [480, 960, 1440];
const slotY = (i) => 370 + i * 82;

// ---- chapter 3: limits ---------------------------------------------------------------
const KC = [1170, 1380, 1590];     // Kanban board columns: next, doing, done

// ---- chapter 4: comparison table -----------------------------------------------------
const ROWS = [
  ['Cadence', 'fixed sprints', 'continuous flow'],
  ['Limit', 'sprint capacity', 'WIP limits'],
  ['Change', 'between sprints', 'any time'],
  ['Roles', 'PO, SM, Developers', 'none prescribed'],
  ['Metric', 'velocity', 'cycle time'],
];

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      [[560, SC], [1360, KB]].forEach(([x, col], i) => {
        const k = range(t, 0.5 + i * 0.2, 1.2 + i * 0.2);
        for (let j = 0; j < 3; j++) card(ctx, x - 180 + j * 180, 190, col, a * 0.3 * k, 150, 52);
      });
      titleCard(ctx, t, T, { l1: 'Scrum vs', l2: 'Kanban', sub: 'two ways to manage work', tint: KB });
    },

    same(ctx, t) {
      const a = chapterAlpha(T, 'same', t), lt = t - T.same[0];
      chapterTag(ctx, '01', 'What they share', a);
      ['To do', 'Doing', 'Done'].forEach((n, i) => {
        const k = easeOut(range(lt, 0.2 + i * 0.2, 0.8 + i * 0.2));
        panel(ctx, COLS[i] - 190, 250, 380, 520, C.dim, a * k, 0.04);
        label(ctx, n, COLS[i], 292, { size: 30, mono: true, color: C.dim, alpha: a * k, weight: 600 });
      });
      for (let i = 0; i < 5; i++) {
        const ms = sp('c2', 0.05) + i * 0.5;
        const k1 = easeInOut(range(lt, ms, ms + 0.8)), k2 = easeInOut(range(lt, ms + 1.4, ms + 2.2));
        const x = COLS[0] + (COLS[1] - COLS[0]) * k1 + (COLS[2] - COLS[1]) * k2;
        card(ctx, x, slotY(i), TINTS[i], a * easeOut(range(lt, sp('c1', 0.3) + i * 0.15, sp('c1', 0.3) + i * 0.15 + 0.5)));
      }
      chip(ctx, 'visible work', 480, 850, { color: SC, size: 38, alpha: a * range(lt, sp('c1', 0.5), sp('c1', 0.5) + 0.6), w: 400 });
      chip(ctx, 'steady delivery', 960, 850, { color: GREEN, size: 38, alpha: a * range(lt, sp('c2', 0.3), sp('c2', 0.3) + 0.6), w: 440 });
      caption(ctx, 'c1', a, lt, CS.c1);
      caption(ctx, 'c2', a, lt, CS.c2);
    },

    cadence(ctx, t) {
      const a = chapterAlpha(T, 'cadence', t), lt = t - T.cadence[0];
      chapterTag(ctx, '02', 'Cadence', a);
      const k1a = range(lt, 0.2, 0.8);
      label(ctx, 'SCRUM', 90, 330, { size: 34, mono: true, color: SC, align: 'left', weight: 700, alpha: a * k1a });
      label(ctx, 'commit up front', 90, 372, { size: 22, mono: true, color: C.dim, align: 'left', weight: 500, alpha: a * k1a });
      for (let i = 0; i < 3; i++) {
        const at = sp('k1', 0.15 + i * 0.25), k = easeOut(range(lt, at, at + 0.6)), bx = 360 + i * 486;
        panel(ctx, bx, 240, 466, 190, SC, a * k, 0.06, 18);
        label(ctx, `Sprint ${i + 1}`, bx + 24, 270, { size: 24, mono: true, color: SC, align: 'left', weight: 600, alpha: a * k });
        for (let j = 0; j < 3; j++) card(ctx, bx + 90 + j * 140, 355, TINTS[(i + j) % 5], a * easeOut(range(lt, at + 0.3 + j * 0.15, at + 0.8 + j * 0.15)), 120, 48);
      }
      const k2a = range(lt, sp('k2', 0.0), sp('k2', 0.0) + 0.6);
      label(ctx, 'KANBAN', 90, 650, { size: 34, mono: true, color: KB, align: 'left', weight: 700, alpha: a * k2a });
      label(ctx, 'pull when ready', 90, 692, { size: 22, mono: true, color: C.dim, align: 'left', weight: 500, alpha: a * k2a });
      ctx.save(); ctx.globalAlpha = a * k2a * 0.6; ctx.strokeStyle = C.dim; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(360, 650); ctx.lineTo(1800, 650); ctx.stroke(); ctx.restore();
      const t0 = sp('k2', 0.1);
      for (let i = 0; i < 14; i++) {
        const u = (lt - t0) * 0.13 - i * 0.1;
        if (u <= 0 || u >= 1) continue;
        card(ctx, lerp(360, 1800, u), 650, TINTS[i % 5], a * range(u, 0, 0.05) * (1 - range(u, 0.95, 1)), 100, 46);
      }
      label(ctx, 'no sprints: work flows continuously', 1080, 740, { size: 26, mono: true, color: KB, alpha: a * range(lt, sp('k2', 0.5), sp('k2', 0.5) + 0.7), weight: 600 });
      caption(ctx, 'k1', a, lt, CS.k1);
      caption(ctx, 'k2', a, lt, CS.k2);
    },

    limits(ctx, t) {
      const a = chapterAlpha(T, 'limits', t), lt = t - T.limits[0];
      chapterTag(ctx, '03', 'Limits and change', a);
      // Scrum: a sprint box that holds a fixed amount of work
      const pk = easeOut(range(lt, 0.2, 0.9));
      panel(ctx, 200, 240, 680, 540, SC, a * pk, 0.04, 26);
      label(ctx, 'Scrum: limit by time', 540, 285, { size: 28, mono: true, color: SC, alpha: a * pk, weight: 700 });
      panel(ctx, 260, 330, 560, 270, SC, a * pk, 0.08, 18);
      label(ctx, 'this sprint', 284, 358, { size: 22, mono: true, color: C.dim, align: 'left', alpha: a * pk, weight: 500 });
      for (let i = 0; i < 6; i++) card(ctx, 355 + (i % 3) * 185, 430 + Math.floor(i / 3) * 90, TINTS[i % 5], a * easeOut(range(lt, sp('l1', 0.05 + i * 0.05), sp('l1', 0.05 + i * 0.05) + 0.5)), 150, 56);
      const ek = easeOut(range(lt, sp('l1', 0.3), sp('l1', 0.3) + 0.6));
      [440, 640].forEach((x) => card(ctx, x, 680, C.dim, a * ek * 0.7, 150, 52));
      label(ctx, 'next sprint', 540, 740, { size: 22, mono: true, color: C.dim, alpha: a * ek, weight: 500 });

      // Kanban: a board where Doing holds at most three cards
      const kk = easeOut(range(lt, 0.4, 1.1));
      panel(ctx, 1040, 240, 680, 540, KB, a * kk, 0.04, 26);
      label(ctx, 'Kanban: limit work in progress', 1380, 285, { size: 28, mono: true, color: KB, alpha: a * kk, weight: 700 });
      ['Next', 'Doing', 'Done'].forEach((n, i) => label(ctx, n, KC[i], 345, { size: 24, mono: true, color: C.dim, alpha: a * kk, weight: 600 }));
      const wk = range(lt, sp('l1', 0.45), sp('l1', 0.45) + 0.6);
      token(ctx, 'max 3', KC[1], 392, C.proton, a * wk, 22);
      const tryAt = sp('l1', 0.65), leaveAt = sp('l1', 0.9) + 0.5, enterAt = leaveAt + 0.6;
      // the three cards in Doing; the top one finishes later and moves to Done
      for (let i = 0; i < 3; i++) {
        const k = easeOut(range(lt, sp('l1', 0.1 + i * 0.1), sp('l1', 0.1 + i * 0.1) + 0.5));
        const move = i === 0 ? easeInOut(range(lt, leaveAt, leaveAt + 0.8)) : 0;
        card(ctx, lerp(KC[1], KC[2], move), 450 + i * 80, TINTS[i], a * kk * k, 150, 56);
      }
      // the fourth card is blocked, then enters once there is room
      const fk = easeOut(range(lt, sp('l1', 0.35), sp('l1', 0.35) + 0.5));
      let p = [KC[0], 450];
      p = mix(p, [KC[0] + 110, 450], easeOut(range(lt, tryAt, tryAt + 0.4)) * (1 - easeOut(range(lt, tryAt + 0.5, tryAt + 0.9))));
      p = mix(p, [KC[1], 450], easeInOut(range(lt, enterAt, enterAt + 0.8)));
      card(ctx, p[0], p[1], TINTS[3], a * kk * fk, 150, 56);
      const bk = range(lt, tryAt + 0.3, tryAt + 0.5) * (1 - range(lt, tryAt + 1.0, tryAt + 1.3));
      if (bk > 0) label(ctx, '✕', KC[0] + 110, 400, { size: 52, color: C.proton, alpha: a * bk, weight: 700 });

      // change: a new idea waits for the next sprint, but is reprioritised at any time in Kanban
      const c0 = sp('l2', 0.1);
      const route1 = [[540, 150], [540, 322], [850, 420], [850, 620], [640, 680]];
      const u1 = easeInOut(range(lt, c0, c0 + 2.0));
      if (u1 > 0) { const [x, y] = pathAt(route1, u1); token(ctx, 'new idea', x, y, C.copper, a, 24); }
      const hit = range(u1, 0.2, 0.3) * (1 - range(u1, 0.3, 0.45));
      if (hit > 0) { ctx.save(); ctx.globalAlpha = a * hit; ctx.strokeStyle = SC; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(470, 330); ctx.lineTo(610, 330); ctx.stroke(); ctx.restore(); }
      const u2 = easeInOut(range(lt, c0 + 0.3, c0 + 1.6));
      if (u2 > 0) { const [x, y] = pathAt([[KC[0], 150], [KC[0], 450]], u2); token(ctx, 'urgent', x, y, C.copper, a * (1 - range(u2, 0.97, 1)), 24); card(ctx, KC[0], 450, C.copper, a * range(u2, 0.97, 1), 150, 56); }
      const lk = range(lt, sp('l2', 0.6), sp('l2', 0.6) + 0.7);
      label(ctx, 'change waits', 540, 835, { size: 28, mono: true, color: C.dim, alpha: a * lk, weight: 600 });
      label(ctx, 'reprioritised any time', 1380, 835, { size: 28, mono: true, color: GREEN, alpha: a * lk, weight: 600 });
      caption(ctx, 'l1', a, lt, CS.l1);
      caption(ctx, 'l2', a, lt, CS.l2);
    },

    table(ctx, t) {
      const a = chapterAlpha(T, 'table', t), lt = t - T.table[0];
      chapterTag(ctx, '04', 'Side by side', a);
      const hk = easeOut(range(lt, 0.2, 0.8));
      label(ctx, 'SCRUM', 960, 250, { size: 40, mono: true, color: SC, weight: 700, alpha: a * hk });
      label(ctx, 'KANBAN', 1500, 250, { size: 40, mono: true, color: KB, weight: 700, alpha: a * hk });
      ROWS.forEach((r, i) => {
        const at = i < 3 ? 0.5 + i * 0.35 : i === 3 ? sp('m1', 0.0) : sp('m2', 0.0), k = easeOut(range(lt, at, at + 0.6)), y = 340 + i * 100;
        ctx.save(); ctx.globalAlpha = a * k * 0.5; ctx.strokeStyle = C.dim; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(240, y - 50); ctx.lineTo(1700, y - 50); ctx.stroke(); ctx.restore();
        label(ctx, r[0], 260, y, { size: 30, mono: true, color: C.dim, align: 'left', weight: 600, alpha: a * k });
        label(ctx, r[1], 960, y, { size: 38, weight: 600, alpha: a * k });
        label(ctx, r[2], 1500, y, { size: 38, weight: 600, alpha: a * k });
      });
      caption(ctx, 'm1', a, lt, CS.m1);
      caption(ctx, 'm2', a, lt, CS.m2);
    },

    choose(ctx, t) {
      const a = chapterAlpha(T, 'choose', t), lt = t - T.choose[0];
      chapterTag(ctx, '05', 'Which to choose', a);
      [['w1', 240, SC, 'Scrum', ['product work', 'steady rhythm', 'regular goals']], ['w2', 1020, KB, 'Kanban', ['support and operations', 'unpredictable arrivals', 'continuous flow']]].forEach(([id, x, col, name, items]) => {
        const k = easeOut(range(lt, sp(id, 0.0), sp(id, 0.0) + 0.7));
        panel(ctx, x, 250, 660, 370, col, a * k, 0.06, 24);
        label(ctx, name, x + 330, 305, { size: 44, mono: true, color: col, weight: 700, alpha: a * k });
        items.forEach((s, i) => label(ctx, s, x + 330, 395 + i * 62, { size: 36, weight: 600, alpha: a * range(k, 0.3 + i * 0.2, 0.6 + i * 0.2) }));
      });
      const bk = easeOut(range(lt, sp('w3', 0.2), sp('w3', 0.2) + 0.8));
      label(ctx, '+', CX, 435, { size: 100, weight: 700, color: C.dim, alpha: a * bk });
      chip(ctx, 'Scrumban', CX - 240, 770, { color: GREEN, size: 66, alpha: a * bk, w: 480, weight: 700 });
      arrow(ctx, 570, 630, CX - 110, 725, SC, a * bk, 4);
      arrow(ctx, 1350, 630, CX + 110, 725, KB, a * bk, 4);
      caption(ctx, 'w1', a, lt, CS.w1);
      caption(ctx, 'w2', a, lt, CS.w2);
      caption(ctx, 'w3', a, lt, CS.w3);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 3;
      label(ctx, 'Pick the rhythm', CX, CY - 60, { size: 100, weight: 700, color: SC, alpha: a * range(lt, 0.5, 1.3) });
      label(ctx, 'that fits the work.', CX, CY + 70, { size: 100, weight: 700, color: KB, alpha: a * range(lt, 0.5 + s * 0.5, 1.3 + s * 0.5) });
    },
  },
});
