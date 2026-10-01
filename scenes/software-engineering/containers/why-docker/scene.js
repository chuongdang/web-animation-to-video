import { C, CX, CY, MONO, label, chapterTag, narration, plan, speech, mount, chapterAlpha, titleCard, chip, token, panel, arrow, card, treeNode } from '/runtime/kit.js';

const { lerp, range, easeOut, easeInOut, fadeWindow } = Scene;

const GREEN = '#7ee787', DK = '#4dd8ff';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- software-engineering/containers/why-docker`.
const TXT = {
  d1: 'It works on my machine, but breaks on the server, because the [[environment]] is different.',
  d2: 'A Docker [[image]] packs the app together with its runtime, libraries and settings.',
  d3: 'Run an image and you get a [[container]]: an isolated process with its own files and network.',
  d4: 'Containers share the host [[kernel]], so they start in milliseconds and are far lighter than virtual machines.',
  d5: 'Images are built in [[layers]], so unchanged layers are cached and shared between images.',
  d6: 'Ship the same image to a laptop, a test server or the cloud, and it runs the [[same way:green]] everywhere.',
};
const nar = await narration('software-engineering/containers/why-docker', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { env: ['d1'], image: ['d2', 'd3'], vm: ['d4'], layers: ['d5'], ship: ['d6'] });
const { CS, T } = P;
const sp = speech(nar, CS);

const fade = (lt, at, d = 0.6) => easeOut(range(lt, at, at + d));

// image stack: top-down names
const STACK = ['app code', 'libraries', 'runtime', 'os base'];

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      [DK, C.gold, GREEN].forEach((c, i) => card(ctx, 760 + i * 200, 190, c, a * 0.4 * range(t, 0.3 + i * 0.2, 0.9 + i * 0.2), 150, 80));
      titleCard(ctx, t, T, { l1: 'Why', l2: 'Docker?', sub: 'package once, run anywhere', tint: DK, size: 128 });
    },

    env(ctx, t) {
      const a = chapterAlpha(T, 'env', t), lt = t - T.env[0];
      chapterTag(ctx, '01', 'It works on my machine', a);
      [[200, 'laptop', GREEN, ['node 20', 'libssl 3', 'config: dev']], [1040, 'server', C.proton, ['node 16', 'libssl 1', 'config: prod']]].forEach(([x, name, col, rows], i) => {
        const k = fade(lt, 0.2 + i * 0.3);
        panel(ctx, x, 200, 680, 520, col, a * k, 0.05, 22);
        label(ctx, name, x + 340, 252, { size: 34, mono: true, color: col, alpha: a * k, weight: 700 });
        rows.forEach((r, j) => chip(ctx, r, x + 120, 345 + j * 80, { color: col, size: 30, alpha: a * k, w: 440, family: MONO }));
      });
      const go = sp('d1', 0.35), u = easeInOut(range(lt, go, go + 1.4)), bad = range(lt, go + 1.4, go + 1.8);
      card(ctx, lerp(540, 1380, u), 640, bad > 0 ? C.proton : GREEN, a * fade(lt, 0.8), 150, 60);
      label(ctx, 'app', lerp(540, 1380, u), 640, { size: 28, mono: true, weight: 700, alpha: a * fade(lt, 0.8) });
      label(ctx, '✓', 700, 640, { size: 60, color: GREEN, alpha: a * fade(lt, 1.0) * (1 - u), weight: 700 });
      label(ctx, '✕', 1560, 640, { size: 70, color: C.proton, alpha: a * bad, weight: 700 });
      label(ctx, 'same code, different environment', CX, 800, { size: 30, mono: true, color: C.gold, alpha: a * range(lt, go + 1.8, go + 2.5), weight: 600 });
      caption(ctx, 'd1', a, lt, CS.d1);
    },

    image(ctx, t) {
      const a = chapterAlpha(T, 'image', t), lt = t - T.image[0];
      chapterTag(ctx, '02', 'Image and container', a);
      const pk = fade(lt, sp('d2', 0.55), 0.7);
      panel(ctx, 250, 170, 460, 460, DK, a * pk, 0.06, 22);
      label(ctx, 'image', 480, 205, { size: 30, mono: true, color: DK, alpha: a * pk, weight: 700 });
      STACK.forEach((s, i) => chip(ctx, s, 330, 285 + i * 85, { color: i === 0 ? C.gold : DK, size: 30, alpha: a * fade(lt, sp('d2', 0.05 + i * 0.12)), w: 300, family: MONO }));
      [270, 450, 630].forEach((y, i) => {
        const k = fade(lt, sp('d3', 0.25 + i * 0.18));
        arrow(ctx, 740, 400, 960, y, C.dim, a * k, 3);
        panel(ctx, 980, y - 70, 620, 140, GREEN, a * k, 0.05, 18);
        label(ctx, `container ${i + 1}`, 1020, y, { size: 28, mono: true, color: GREEN, align: 'left', alpha: a * k, weight: 700 });
        card(ctx, 1480, y, C.gold, a * k, 150, 60);
        label(ctx, 'app', 1480, y, { size: 26, mono: true, weight: 700, alpha: a * k });
      });
      label(ctx, 'docker run', 850, 340, { size: 24, mono: true, color: C.dim, alpha: a * fade(lt, sp('d3', 0.2)), weight: 600, align: 'center' });
      label(ctx, 'own files · own network · own processes', CX + 250, 800, { size: 28, mono: true, color: GREEN, alpha: a * fade(lt, sp('d3', 0.7)), weight: 600 });
      caption(ctx, 'd2', a, lt, CS.d2);
      caption(ctx, 'd3', a, lt, CS.d3);
    },

    vm(ctx, t) {
      const a = chapterAlpha(T, 'vm', t), lt = t - T.vm[0];
      chapterTag(ctx, '03', 'Containers vs VMs', a);
      const kl = fade(lt, 0.3), kr = fade(lt, sp('d4', 0.3)), cxL = 520, cxR = 1400;
      label(ctx, 'virtual machines', cxL, 200, { size: 36, weight: 700, alpha: a * kl });
      label(ctx, 'minutes · gigabytes', cxL, 252, { size: 26, mono: true, color: C.proton, alpha: a * kl, weight: 600 });
      label(ctx, 'containers', cxR, 200, { size: 36, weight: 700, alpha: a * kr });
      label(ctx, 'milliseconds · megabytes', cxR, 252, { size: 26, mono: true, color: GREEN, alpha: a * kr, weight: 600 });
      [['hardware', 790], ['host OS', 725], ['hypervisor', 660]].forEach(([s, y]) => treeNode(ctx, s, cxL, y, C.dim, a * kl, { w: 600, size: 26 }));
      [-190, 0, 190].forEach((dx, i) => {
        const k = fade(lt, 0.5 + i * 0.2);
        panel(ctx, cxL + dx - 80, 320, 160, 295, C.proton, a * k, 0.04, 14);
        treeNode(ctx, 'app', cxL + dx, 385, C.gold, a * k, { w: 120, size: 24 });
        treeNode(ctx, 'guest OS', cxL + dx, 520, C.proton, a * k, { w: 130, size: 22, fill: 0.3 });
      });
      [['hardware', 790], ['host OS + kernel', 725], ['container runtime', 660]].forEach(([s, y], i) =>
        treeNode(ctx, s, cxR, y, i === 1 ? GREEN : C.dim, a * kr, { w: 600, size: 26, fill: i === 1 ? 0.35 : 0.16 }));
      [-190, 0, 190].forEach((dx, i) => {
        const k = fade(lt, sp('d4', 0.5 + i * 0.1));
        panel(ctx, cxR + dx - 80, 560, 160, 70, GREEN, a * k, 0.04, 14);
        treeNode(ctx, 'app', cxR + dx, 595, C.gold, a * k, { w: 120, size: 24 });
      });
      label(ctx, '↑ one kernel shared by every container', cxR, 850, { size: 24, mono: true, color: GREEN, alpha: a * fade(lt, sp('d4', 0.45)), weight: 600 });
      caption(ctx, 'd4', a, lt, CS.d4);
    },

    layers(ctx, t) {
      const a = chapterAlpha(T, 'layers', t), lt = t - T.layers[0];
      chapterTag(ctx, '04', 'Layers', a);
      [[560, 'app v1', false], [1360, 'app v2', true]].forEach(([x, top, second]) => {
        const at = second ? sp('d5', 0.55) : 0;
        label(ctx, `image: ${top}`, x, 240, { size: 32, mono: true, weight: 700, alpha: a * fade(lt, at + 0.3) });
        STACK.forEach((s, i) => {
          const base = STACK.length - 1 - i;
          const shared = second && i > 0;
          const k = fade(lt, at + 0.3 + base * 0.25);
          const name = i === 0 ? top : s;
          chip(ctx, shared ? `${name}` : name, x - 200, 330 + i * 80, { color: shared ? GREEN : i === 0 ? C.gold : DK, size: 30, alpha: a * k, w: 400, family: MONO });
          if (shared) label(ctx, 'cached', x + 250, 330 + i * 80, { size: 22, mono: true, color: GREEN, alpha: a * k, align: 'left', weight: 600 });
        });
      });
      label(ctx, 'only the changed layer is rebuilt and sent', CX, 760, { size: 28, mono: true, color: C.text, alpha: a * range(lt, sp('d5', 0.7), sp('d5', 0.7) + 0.7), weight: 600 });
      caption(ctx, 'd5', a, lt, CS.d5);
    },

    ship(ctx, t) {
      const a = chapterAlpha(T, 'ship', t), lt = t - T.ship[0];
      chapterTag(ctx, '05', 'Build once, run anywhere', a);
      const k0 = fade(lt, 0.3);
      chip(ctx, 'image: app v2', CX - 200, 280, { color: DK, size: 40, alpha: a * k0, w: 400, family: MONO });
      ['laptop', 'test server', 'cloud'].forEach((s, i) => {
        const x = 400 + i * 560, k = fade(lt, sp('d6', 0.2 + i * 0.15));
        arrow(ctx, CX, 330, x, 540, C.dim, a * k, 3);
        panel(ctx, x - 190, 560, 380, 190, GREEN, a * k, 0.05, 20);
        label(ctx, s, x, 610, { size: 32, mono: true, color: GREEN, alpha: a * k, weight: 700 });
        card(ctx, x, 690, C.gold, a * k, 150, 56);
        label(ctx, 'app ✓', x, 690, { size: 26, mono: true, weight: 700, alpha: a * k });
      });
      caption(ctx, 'd6', a, lt, CS.d6);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 3;
      [['Package.', DK], ['Isolate.', C.gold], ['Ship.', GREEN]].forEach(([w, col], i) =>
        label(ctx, w, CX, CY - 150 + i * 150, { size: 100, weight: 700, color: col, alpha: a * range(lt, 0.5 + s * 0.3 * i, 1.3 + s * 0.3 * i) }));
    },
  },
});
