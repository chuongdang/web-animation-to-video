import { C, W, CX, CY, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, token, measure, chip } from '/runtime/kit.js';

const { clamp, lerp, range, easeInOut, easeOut, fadeWindow, rng } = Scene;

const GREEN = '#7ee787';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- computer-science/diffusion`.
const TXT = {
  fw1: 'Diffusion models learn by watching pictures being destroyed: [[noise]] is added, step by step, until only static is left.',
  fw2: 'At every step, the model sees the noisy image and must [[predict the noise:proton]] that was added.',
  bw1: 'To generate, run it in reverse. Start from pure [[random noise]].',
  bw2: 'The model removes a little noise at each step, and a [[picture]] slowly emerges.',
  pr1: 'A text [[prompt]] steers the denoising: its [[embeddings:electron]] guide every step.',
  pr2: 'Different starting noise gives a [[different picture]], even for the same prompt.',
};
const nar = await narration('computer-science/how-ai-works/diffusion', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { forward: ['fw1', 'fw2'], reverse: ['bw1', 'bw2'], prompt: ['pr1', 'pr2'] });
const { CS, T } = P;
const sp = speech(nar, CS);

// ---- procedural pictures + noise ------------------------------------------------
const IW = 240, IH = 160;
const SKY = [['#1b2a6b', '#ff9a5a'], ['#0f1f4a', '#ffcf70'], ['#2a1b4d', '#ff6f91']];

function paintLandscape(g, seed) {
  const r = rng(seed * 977 + 5);
  const [top, bottom] = SKY[seed % SKY.length];
  const sky = g.createLinearGradient(0, 0, 0, IH); sky.addColorStop(0, top); sky.addColorStop(1, bottom);
  g.fillStyle = sky; g.fillRect(0, 0, IW, IH);
  const sx = IW * (0.22 + 0.56 * r()), sy = IH * (0.42 + 0.12 * r());
  const sg = g.createRadialGradient(sx, sy, 2, sx, sy, IH * 0.3); sg.addColorStop(0, 'rgba(255,240,200,0.9)'); sg.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = sg; g.fillRect(0, 0, IW, IH);
  g.fillStyle = '#fff2c2'; g.beginPath(); g.arc(sx, sy, IH * (0.07 + 0.03 * r()), 0, Math.PI * 2); g.fill();
  [['#3a4a86', 0.52, 26], ['#1c2748', 0.66, 22]].forEach(([col, base, amp], layer) => {
    const ph = r() * 6, f = 0.04 + 0.03 * r();
    g.fillStyle = col; g.beginPath(); g.moveTo(0, IH);
    for (let x = 0; x <= IW; x += 4) g.lineTo(x, IH * base + Math.sin(x * f + ph + layer) * amp * 0.6 + Math.sin(x * f * 2.7 + ph) * amp * 0.4 + r() * 3);
    g.lineTo(IW, IH); g.closePath(); g.fill();
  });
  g.fillStyle = '#0c1526'; g.beginPath(); g.ellipse(IW * (0.3 + 0.4 * r()), IH * 1.05, IW * 0.7, IH * 0.2, 0, 0, Math.PI * 2); g.fill();
}

const tmp = document.createElement('canvas');
tmp.width = IW; tmp.height = IH;
const tg = tmp.getContext('2d');

function makeState() {
  const imgs = [0, 1, 2].map((seed) => { paintLandscape(tg, seed); return tg.getImageData(0, 0, IW, IH).data.slice(); });
  const rand = rng(99);
  const noises = Array.from({ length: 6 }, () => Uint8ClampedArray.from({ length: IW * IH * 4 }, (_, i) => (i % 4 === 3 ? 255 : Math.floor(40 + rand() * 175))));
  const out = tg.createImageData(IW, IH);
  return { imgs, noises, out };
}

/** draw picture `img` mixed with noise `nz` at noise level sigma (0 = clean, 1 = pure static), at scale s */
function tile(ctx, S, x, y, s, { img = 0, nz = 0, sigma = 0, alpha = 1, border = C.dim, pureNoise = false }) {
  const o = S.out.data, im = S.imgs[img], n = S.noises[nz];
  for (let i = 0; i < o.length; i += 4) {
    const k = pureNoise ? 1 : sigma;
    o[i] = im[i] * (1 - k) + n[i] * k;
    o[i + 1] = im[i + 1] * (1 - k) + n[i + 1] * k;
    o[i + 2] = im[i + 2] * (1 - k) + n[i + 2] * k;
    o[i + 3] = 255;
  }
  tg.putImageData(S.out, 0, 0);
  ctx.save();
  ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tmp, x, y, IW * s, IH * s);
  ctx.strokeStyle = border; ctx.lineWidth = 3; ctx.strokeRect(x, y, IW * s, IH * s);
  ctx.restore();
}

const flick = (lt, off = 0) => (((Math.floor(lt * 6) + off) % 3) + 3) % 3; // which static frame to show
const STEPS = [0, 0.25, 0.5, 0.75, 1];
function strip(ctx, S, x0, y, a, sigmaNow, { reverse = false, nzBase = 0 }) {
  STEPS.forEach((sg, i) => {
    const sigma = reverse ? 1 - sg : sg;
    const on = reverse ? sigmaNow <= sigma + 0.001 : sigmaNow >= sigma - 0.001;
    const x = x0 + i * 160;
    tile(ctx, S, x, y, 0.5, { nz: nzBase, sigma, alpha: a * (on ? 1 : 0.25), border: on ? C.gold : C.dim });
    label(ctx, `step ${Math.round(sigma * 1000)}`, x + 60, y + 100, { size: 20, mono: true, color: on ? C.gold : C.dim, alpha: a, weight: 500 });
    if (i < 4) label(ctx, '→', x + 140, y + 40, { size: 28, color: C.dim, alpha: a * 0.7, weight: 500 });
  });
}

mount({
  plan: P,
  init: makeState,
  draws: {
    title(ctx, t, S) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      const sg = 1 - easeInOut(range(t, 0.6, 3.4));
      tile(ctx, S, CX - 360, 100, 3, { img: 1, nz: flick(t), sigma: sg, alpha: a * 0.16 * range(t, 0.2, 1), border: 'rgba(0,0,0,0)' });
      titleCard(ctx, t, T, { l1: 'How does AI', l2: 'draw pictures?', sub: 'diffusion models', size: 108 });
    },

    forward(ctx, t, S) {
      const a = chapterAlpha(T, 'forward', t), lt = t - T.forward[0];
      chapterTag(ctx, '01', 'Adding noise', a);
      const sigma = easeInOut(range(lt, 1.0, sp('fw1', 0.92)));
      const k = easeOut(range(lt, 0.3, 1.0));
      tile(ctx, S, 200, 230, 3, { img: 0, nz: 0, sigma, alpha: a * k, border: C.gold });
      strip(ctx, S, 200, 745, a * k, sigma, {});
      label(ctx, `noise: ${Math.round(sigma * 100)}%`, 1470, 290, { size: 44, mono: true, weight: 700, color: C.proton, alpha: a * k });
      label(ctx, 'noisy = image × (1 − σ) + noise × σ', 1470, 350, { size: 24, mono: true, color: C.dim, alpha: a * range(lt, sp('fw1', 0.3), sp('fw1', 0.3) + 0.7), weight: 500 });

      // fw2: the training task
      const p2 = a * range(lt, CS.fw2, CS.fw2 + 0.7);
      if (p2 > 0) {
        const nzp = S.noises;
        tile(ctx, S, 1150, 430, 0.8, { img: 0, nz: 0, sigma: 0.55, alpha: p2, border: C.gold });
        label(ctx, 'noisy image', 1246, 590, { size: 22, mono: true, color: C.gold, alpha: p2, weight: 500 });
        ctx.save(); ctx.globalAlpha = p2; ctx.strokeStyle = C.electron; ctx.fillStyle = 'rgba(77,216,255,0.1)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.roundRect(1390, 460, 110, 110, 20); ctx.fill(); ctx.stroke(); ctx.restore();
        label(ctx, 'model', 1445, 515, { size: 24, mono: true, weight: 600, alpha: p2 });
        const pk = range(lt, sp('fw2', 0.45), sp('fw2', 0.45) + 0.7);
        tile(ctx, S, 1560, 430, 0.8, { nz: 1, pureNoise: true, alpha: p2 * pk, border: C.electron });
        label(ctx, 'predicted noise', 1656, 590, { size: 22, mono: true, color: C.electron, alpha: p2 * pk, weight: 500 });
        tile(ctx, S, 1560, 650, 0.8, { nz: 0, pureNoise: true, alpha: p2 * pk, border: C.proton });
        label(ctx, 'actual noise', 1656, 810, { size: 22, mono: true, color: C.proton, alpha: p2 * pk, weight: 500 });
        label(ctx, '≈ ?', 1656, 640, { size: 34, mono: true, color: C.gold, alpha: p2 * pk, weight: 700 });
        void nzp;
      }
      caption(ctx, 'fw1', a, lt, CS.fw1);
      caption(ctx, 'fw2', a, lt, CS.fw2);
    },

    reverse(ctx, t, S) {
      const a = chapterAlpha(T, 'reverse', t), lt = t - T.reverse[0];
      chapterTag(ctx, '02', 'Removing noise', a);
      const k = easeOut(range(lt, 0.3, 1.0));
      const sigma = 1 - easeInOut(range(lt, sp('bw2', 0.05), sp('bw2', 0.95)));
      tile(ctx, S, 200, 230, 3, { img: 1, nz: sigma >= 0.999 ? flick(lt) : 2, sigma, alpha: a * k, border: C.gold });
      strip(ctx, S, 200, 745, a * k, sigma, { reverse: true, nzBase: 2 });
      label(ctx, `step ${Math.round(sigma * 1000)}`, 1450, 300, { size: 48, mono: true, weight: 700, color: C.gold, alpha: a * k });
      label(ctx, 'start: pure random noise', 1450, 380, { size: 26, mono: true, color: C.dim, alpha: a * range(lt, sp('bw1', 0.4), sp('bw1', 0.4) + 0.7) * (1 - range(lt, CS.bw2, CS.bw2 + 0.5)), weight: 500 });
      // the denoising loop
      const lk = range(lt, sp('bw2', 0.0), sp('bw2', 0.0) + 0.7);
      ctx.save(); ctx.globalAlpha = a * lk; ctx.strokeStyle = C.electron; ctx.fillStyle = 'rgba(77,216,255,0.1)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect(1340, 470, 220, 110, 20); ctx.fill(); ctx.stroke(); ctx.restore();
      label(ctx, 'model', 1450, 505, { size: 28, mono: true, weight: 600, alpha: a * lk });
      label(ctx, 'less noise', 1450, 545, { size: 22, mono: true, color: C.dim, alpha: a * lk, weight: 500 });
      ctx.save(); ctx.globalAlpha = a * lk * 0.8; ctx.strokeStyle = C.gold; ctx.lineWidth = 4; ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.arc(1450, 525, 118, Math.PI * 0.2, Math.PI * 1.75); ctx.stroke(); ctx.restore();
      label(ctx, 'repeat ~1000 times', 1450, 690, { size: 26, mono: true, color: C.gold, alpha: a * lk, weight: 600 });
      caption(ctx, 'bw1', a, lt, CS.bw1);
      caption(ctx, 'bw2', a, lt, CS.bw2);
    },

    prompt(ctx, t, S) {
      const a = chapterAlpha(T, 'prompt', t), lt = t - T.prompt[0];
      chapterTag(ctx, '03', 'Steering with words', a);
      const p1 = a * (1 - range(lt, CS.pr2 - 0.3, CS.pr2 + 0.3)), p2 = a * range(lt, CS.pr2, CS.pr2 + 0.6);
      if (p1 > 0) {
        const k = easeOut(range(lt, 0.3, 1.0));
        const text = 'a sunset over mountains';
        const shown = text.slice(0, Math.floor(text.length * easeInOut(range(lt, 0.6, 2.4))));
        ctx.save(); ctx.globalAlpha = p1 * k; ctx.strokeStyle = C.electron; ctx.fillStyle = 'rgba(77,216,255,0.08)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(140, 250, 720, 80, 16); ctx.fill(); ctx.stroke(); ctx.restore();
        label(ctx, shown, 172, 291, { size: 38, mono: true, weight: 500, alpha: p1 * k, align: 'left' });
        const words = ['a', 'sunset', 'over', 'mountains'];
        let x = 140;
        words.forEach((wd, i) => {
          const wk = range(lt, sp('pr1', 0.25 + i * 0.1), sp('pr1', 0.25 + i * 0.1) + 0.6);
          const w = chip(ctx, wd, x, 420, { color: [C.electron, C.gold, GREEN, C.copper][i], size: 32, alpha: p1 * wk });
          for (let r = 0; r < 5; r++) {
            const v = Math.sin(i * 1.7 + r * 2.1);
            ctx.save(); ctx.globalAlpha = p1 * wk * (0.25 + 0.75 * Math.abs(v)); ctx.fillStyle = v >= 0 ? C.gold : '#b48cff';
            ctx.beginPath(); ctx.roundRect(x + w / 2 - 30, 480 + r * 26, 60, 18, 5); ctx.fill(); ctx.restore();
          }
          x += w + 18;
        });
        label(ctx, 'embeddings', 500, 640, { size: 24, mono: true, color: C.dim, alpha: p1 * range(lt, sp('pr1', 0.6), sp('pr1', 0.6) + 0.7), weight: 500 });
        // guided denoising
        const sigma = 1 - easeInOut(range(lt, sp('pr1', 0.35), sp('pr1', 1.0) + 1.5));
        tile(ctx, S, 1050, 230, 3, { img: 0, nz: sigma >= 0.999 ? flick(lt) : 3, sigma, alpha: p1 * k, border: C.gold });
        const gk = range(lt, sp('pr1', 0.5), sp('pr1', 0.5) + 0.8);
        ctx.save(); ctx.globalAlpha = p1 * gk * 0.8; ctx.strokeStyle = C.electron; ctx.lineWidth = 4; ctx.setLineDash([12, 10]);
        ctx.beginPath(); ctx.moveTo(900, 560); ctx.bezierCurveTo(960, 560, 980, 480, 1040, 480); ctx.stroke(); ctx.restore();
        label(ctx, 'guides each step', 970, 600, { size: 24, mono: true, color: C.electron, alpha: p1 * gk, weight: 600 });
      }
      if (p2 > 0) {
        label(ctx, '"a sunset over mountains"', CX, 250, { size: 40, mono: true, weight: 600, color: C.electron, alpha: p2 });
        [0, 1, 2].forEach((i) => {
          const x = 130 + i * 590, start = sp('pr2', 0.2 + i * 0.18);
          const sigma = 1 - easeInOut(range(lt, start, start + 3.0));
          tile(ctx, S, x, 340, 2, { img: i, nz: sigma >= 0.999 ? flick(lt, i) : 3 + i % 3, sigma, alpha: p2, border: C.gold });
          label(ctx, `noise seed ${i + 1}`, x + 240, 690, { size: 26, mono: true, color: C.dim, alpha: p2, weight: 500 });
        });
      }
      caption(ctx, 'pr1', a, lt, CS.pr1);
      caption(ctx, 'pr2', a, lt, CS.pr2);
    },

    outro(ctx, t, S) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 7;
      const items = [
        { text: 'add noise to learn', color: C.proton, at: 0.6 },
        { text: 'remove noise to create', color: C.electron, at: 0.6 + s * 0.33 },
        { text: 'words steer the result', color: C.gold, at: 0.6 + s * 0.62 },
      ];
      items.forEach((it, i) => {
        const k = easeOut(range(lt, it.at, it.at + 0.7));
        label(ctx, it.text, CX, 300 + i * 90, { size: 56, weight: 700, color: it.color, alpha: a * k });
      });
      const sg = 1 - easeInOut(range(lt, 0.6, 0.6 + s));
      tile(ctx, S, CX - 180, 600, 1.5, { img: 2, nz: sg >= 0.999 ? flick(lt) : 4, sigma: sg, alpha: a, border: C.gold });
    },
  },
});
