import { CX, CY, C, label, chapterTag, glowDot, token, panel, arrow, narration, plan, speech, mount, chapterAlpha, titleCard } from '/runtime/kit.js';

const { range, lerp, easeOut, easeInOut, fadeWindow } = Scene;
const GREEN = '#7ee787', VIOLET = '#b48cff';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio comes from `npm run narrate -- web-to-video`.
const TXT = {
  fn1: 'A scene is a [[pure function of time]]: give it a moment, and it draws exactly that [[picture]].',
  fn2: '[[Canvas]], [[SVG]] or [[CSS]], it does not matter. Nothing depends on a [[real clock]].',
  br1: 'The renderer opens the page in [[headless Chromium]] and waits until fonts and assets are [[ready]].',
  br2: 'For every frame it calls [[setTime(t)]], then takes a [[screenshot]].',
  ff1: 'Several pages render [[in parallel]]; the frames are put back in [[order]].',
  ff2: 'They are piped into [[ffmpeg]], which encodes an [[H.264]] video.',
  au1: 'Narration is made separately: [[text]] becomes [[speech]], one clip per line.',
  au2: "Each clip's [[duration]] is saved, and the scene uses it to time its [[captions]].",
  mx1: '[[ffmpeg]] delays each clip to its [[start time]] and [[mixes]] them into one track.',
  mx2: 'Video and audio are [[muxed]] into a single [[MP4]], ready for the website.',
};
const nar = await narration('computer-science/behind-the-scenes/web-to-video', TXT);
const { caption } = nar;
const P = plan(nar, {
  fn: ['fn1', 'fn2'],
  br: ['br1', 'br2'],
  ff: ['ff1', 'ff2'],
  au: ['au1', 'au2'],
  mx: ['mx1', 'mx2'],
});
const { CS, T } = P;
const sp = speech(nar, CS); // sp('fn1', 0.5): chapter-relative time when half of that line has been spoken

// ---- shared drawing ------------------------------------------------------------
/** the tiny demo animation every frame is a snapshot of: a function of t only */
function mini(ctx, x, y, w, h, t, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#0e1530';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.clip();
  const cx = x + w / 2, cy = y + h * 0.45, r = Math.min(w, h) * 0.28, a = t * 6;
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = Math.max(1.5, w * 0.006);
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  glowDot(ctx, cx, cy, Math.max(5, w * 0.05), C.proton, alpha);
  glowDot(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.max(4, w * 0.035), C.electron, alpha);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x + w * 0.1, y + h * 0.86, w * 0.8, h * 0.05);
  ctx.fillStyle = C.gold; ctx.fillRect(x + w * 0.1, y + h * 0.86, w * 0.8 * ((t / 3) % 1), h * 0.05);
  ctx.restore();
  ctx.restore();
}

/** a captured frame: the mini scene at time t with a coloured outline and a mono caption below */
function frameCard(ctx, x, y, w, h, t, alpha, color, text) {
  if (alpha <= 0) return;
  mini(ctx, x, y, w, h, t, alpha);
  ctx.save();
  ctx.globalAlpha = alpha * 0.9; ctx.strokeStyle = color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.stroke();
  ctx.restore();
  if (text) label(ctx, text, x + w / 2, y + h + 24, { size: 20, mono: true, color: C.dim, alpha, weight: 500 });
}

const hr = (k) => { const v = Math.sin(k * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };

/** piecewise-smooth scrubbing of t: jumps around to show "any moment, any order" */
function scrub(u) {
  const K = [[0, 0], [1.0, 0], [2.0, 2.4], [3.0, 0.8], [4.0, 2.0], [5.0, 1.2], [99, 1.2]];
  for (let i = 1; i < K.length; i++) if (u <= K[i][0]) return lerp(K[i - 1][1], K[i][1], easeInOut(range(u, K[i - 1][0], K[i][0])));
  return 1.2;
}

/** small video-file icon with a play triangle */
function fileIcon(ctx, x, y, w, h, color, text, alpha) {
  if (alpha <= 0) return;
  panel(ctx, x - w / 2, y - h / 2, w, h, color, alpha, 0.07, 18);
  ctx.save();
  ctx.globalAlpha = alpha; ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(x - 20, y - 34); ctx.lineTo(x + 28, y - 8); ctx.lineTo(x - 20, y + 18); ctx.closePath(); ctx.fill();
  ctx.restore();
  label(ctx, text, x, y + h / 2 - 28, { size: 26, mono: true, weight: 600, alpha });
}

/** deterministic waveform */
function wave(ctx, x, y, w, h, seed, color, alpha, reveal = 1) {
  if (alpha <= 0) return;
  const n = Math.floor(w / 9), rnd = Scene.rng(seed);
  ctx.save();
  ctx.globalAlpha = alpha; ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const v = 0.25 + 0.75 * rnd() * (0.6 + 0.4 * Math.sin(i * 0.5));
    if (i / n > reveal) continue;
    ctx.beginPath(); ctx.roundRect(x + i * 9, y - (h * v) / 2, 5, h * v, 2); ctx.fill();
  }
  ctx.restore();
}

// ---- chapter 3: parallel workers (frame k is rendered by page k % 4) ---------------
const FRAMES = 72, LANES = 4;
const startAt = (k) => 0.4 + Math.floor(k / LANES) * 1.0 + (k % LANES) * 0.08;
const doneAt = (k) => startAt(k) + 0.55 + hr(k) * 0.65;
const releaseAt = [];
for (let k = 0, m = 0; k < FRAMES; k++) { m = Math.max(m, doneAt(k)); releaseAt.push(m); }

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      titleCard(ctx, t, T, { l1: 'How a web animation', l2: 'becomes a video', sub: 'frame by frame, with sound', tint: GREEN, size: 100 });
    },

    // ---------------------------------------------------------------- 01 a scene is a function
    fn(ctx, t) {
      const a = chapterAlpha(T, 'fn', t), lt = t - T.fn[0];
      chapterTag(ctx, '01', 'A scene is a function', a);
      ctx.save(); ctx.translate(0, 45);
      const td = scrub(lt - sp('fn1', 0.3));
      const on = range(lt, 0.5, 1.3);
      const x0 = 170, x1 = 720, y = 400;
      label(ctx, 'time', (x0 + x1) / 2, y - 80, { size: 30, mono: true, color: C.dim, alpha: a * on, weight: 500 });
      ctx.save(); ctx.globalAlpha = a * on; ctx.strokeStyle = C.dim; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.restore();
      for (let s = 0; s <= 3; s++) label(ctx, `${s}s`, lerp(x0, x1, s / 3), y + 36, { size: 20, mono: true, color: C.dim, alpha: a * on, weight: 500 });
      glowDot(ctx, lerp(x0, x1, td / 3), y, 18, C.gold, a * on);
      label(ctx, `t = ${td.toFixed(2)}`, (x0 + x1) / 2, y + 100, { size: 46, mono: true, color: C.gold, alpha: a * on, weight: 600 });
      arrow(ctx, 770, y, 880, y, C.dim, a * on);
      panel(ctx, 890, y - 95, 360, 190, C.electron, a * on);
      label(ctx, 'draw(ctx, t)', 1070, y - 15, { size: 40, mono: true, weight: 600, alpha: a * on });
      label(ctx, 'same t → same picture', 1070, y + 45, { size: 22, mono: true, color: C.dim, alpha: a * on, weight: 500 });
      arrow(ctx, 1290, y, 1390, y, C.dim, a * on);
      mini(ctx, 1410, y - 150, 440, 300, td, a * on);
      // three snapshots, taken in any order
      const snaps = [[2.0, 'draw(ctx, 2.0)'], [0.0, 'draw(ctx, 0.0)'], [1.0, 'draw(ctx, 1.0)']];
      snaps.forEach(([ts, text], i) => {
        const k = easeOut(range(lt, sp('fn2', 0.15 + i * 0.22), sp('fn2', 0.15 + i * 0.22) + 0.6));
        frameCard(ctx, 560 + i * 280, 640 + (1 - k) * 30, 210, 126, ts, a * k, GREEN, text);
      });
      label(ctx, 'any t, in any order', 300, 703, { size: 28, mono: true, color: GREEN, alpha: a * range(lt, sp('fn2', 0.1), sp('fn2', 0.1) + 0.6), weight: 600, align: 'center' });
      ctx.restore();
      caption(ctx, 'fn1', a, lt, CS.fn1);
      caption(ctx, 'fn2', a, lt, CS.fn2);
    },

    // ---------------------------------------------------------------- 02 frame by frame
    br(ctx, t) {
      const a = chapterAlpha(T, 'br', t), lt = t - T.br[0];
      chapterTag(ctx, '02', 'Frame by frame', a);
      ctx.save(); ctx.translate(0, 45);
      const on = range(lt, 0.4, 1.1);
      const t0 = sp('br2', 0.0), STEP = 0.6;
      const n = lt < t0 ? -1 : Math.floor((lt - t0) / STEP);
      const ph = n < 0 ? 1 : ((lt - t0) / STEP) % 1;
      const ft = Math.max(0, n) / 30;
      // browser window
      const bx = 150, by = 190, bw = 760, bh = 500;
      panel(ctx, bx, by, bw, bh, C.electron, a * on, 0.04);
      for (let i = 0; i < 3; i++) glowDot(ctx, bx + 36 + i * 30, by + 34, 8, [C.proton, C.gold, GREEN][i], a * on);
      label(ctx, 'headless Chromium', bx + bw / 2, by + 34, { size: 24, mono: true, color: C.dim, alpha: a * on, weight: 500 });
      mini(ctx, bx + 30, by + 70, bw - 60, bh - 100, ft, a * on);
      const flash = n >= 0 ? (1 - range(ph, 0, 0.25)) * 0.55 : 0;
      if (flash > 0) { ctx.save(); ctx.globalAlpha = a * flash; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(bx + 30, by + 70, bw - 60, bh - 100, 10); ctx.fill(); ctx.restore(); }
      token(ctx, 'ready ✓', bx + bw - 90, by + 100, GREEN, a * range(lt, sp('br1', 0.7), sp('br1', 0.7) + 0.5), 24);
      label(ctx, 'page.evaluate(t => window.setTime(t))', bx + bw / 2, by + bh + 50, { size: 24, mono: true, color: C.gold, alpha: a * range(lt, sp('br2', 0), sp('br2', 0) + 0.6), weight: 600 });
      // captured frames queue
      arrow(ctx, 940, 440, 1010, 440, C.dim, a * range(lt, t0, t0 + 0.5));
      for (let k = Math.max(0, n - 4); k <= n; k++) {
        const e = k === n ? easeOut(range(ph, 0, 0.35)) : 1;
        const s = n - k - (1 - e);
        const al = a * (1 - range(s, 2.2, 3.6)) * (k === n ? e : 1);
        frameCard(ctx, 1030 + s * 210, 380, 180, 108, k / 30, al, VIOLET, `frame ${k}`);
      }
      label(ctx, n >= 0 ? `frame ${n} / 1872` : 'frame – / 1872', 1430, 600, { size: 44, mono: true, color: C.gold, alpha: a * range(lt, t0 - 0.2, t0 + 0.4), weight: 600 });
      label(ctx, `t = ${(Math.max(0, n) / 30).toFixed(3)} s   ·   JPEG, 30 per second`, 1430, 660, { size: 24, mono: true, color: C.dim, alpha: a * range(lt, t0 - 0.2, t0 + 0.4), weight: 500 });
      ctx.restore();
      caption(ctx, 'br1', a, lt, CS.br1);
      caption(ctx, 'br2', a, lt, CS.br2);
    },

    // ---------------------------------------------------------------- 03 parallel -> ffmpeg
    ff(ctx, t) {
      const a = chapterAlpha(T, 'ff', t), lt = t - T.ff[0];
      chapterTag(ctx, '03', 'Parallel, then ffmpeg', a);
      ctx.save(); ctx.translate(0, 45);
      const u = lt - CS.ff1;
      const on = range(lt, 0.3, 1.0);
      const laneY = (w) => 250 + w * 125;
      for (let w = 0; w < LANES; w++) {
        label(ctx, `page ${w + 1}`, 130, laneY(w), { size: 26, mono: true, color: C.dim, alpha: a * on, align: 'left', weight: 500 });
        ctx.save(); ctx.globalAlpha = a * on * 0.35; ctx.strokeStyle = C.dim; ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
        ctx.beginPath(); ctx.moveTo(250, laneY(w) + 66); ctx.lineTo(850, laneY(w) + 66); ctx.stroke(); ctx.restore();
      }
      label(ctx, 'in parallel', 320, 190, { size: 26, mono: true, color: C.electron, alpha: a * on, weight: 600 });
      label(ctx, 'back in order', 1000, 190, { size: 26, mono: true, color: VIOLET, alpha: a * on, weight: 600 });
      // a frame renders in its page, then waits in the buffer until every earlier frame is done, then flows on in order
      for (let k = 0; k < FRAMES; k++) {
        const w = k % LANES, s0 = startAt(k), c0 = doneAt(k), r0 = releaseAt[k];
        if (u < s0 || u > r0 + 2.4) continue;
        const col = [C.electron, GREEN, C.gold, C.copper][w];
        const y = laneY(w), bx = 560 + (Math.floor(k / LANES) % 2) * 120;
        if (u < r0) {
          const waiting = r0 > c0 + 0.05;
          const x = lerp(270, bx, easeInOut(range(u, c0, c0 + 0.4)));
          mini(ctx, x, y - 38, 100, 60, k / 30, a * range(u, s0, s0 + 0.3) * (u >= c0 && waiting ? 0.55 : 1));
          if (u < c0) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillRect(x, y + 28, 100 * range(u, s0, c0), 6); ctx.restore(); }
          label(ctx, `#${k}`, x + 50, y + 54, { size: 20, mono: true, color: u >= c0 && waiting ? C.dim : col, alpha: a, weight: 600 });
        } else {
          const m = (u - r0) / 2.2;
          const x = lerp(bx, 1180, easeInOut(Math.min(1, m)));
          const yy = lerp(y, 330, easeInOut(range(m, 0, 0.35)));
          const al = a * (1 - range(m, 0.85, 1));
          mini(ctx, x, yy - 30, 100, 60, k / 30, al);
          label(ctx, `#${k}`, x + 50, yy + 54, { size: 20, mono: true, color: VIOLET, alpha: al, weight: 600 });
        }
      }
      label(ctx, 'waits for earlier frames', 680, laneY(LANES - 1) + 100, { size: 22, mono: true, color: C.dim, alpha: a * range(lt, 3, 4), weight: 500 });
      // ffmpeg box + output
      const fOn = range(lt, sp('ff2', 0.0), sp('ff2', 0.0) + 0.7);
      const busy = fOn * (0.7 + 0.3 * Math.sin(lt * 9));
      panel(ctx, 1260, 215, 300, 300, GREEN, a * Math.max(on * 0.5, fOn), 0.06 + busy * 0.05);
      label(ctx, 'ffmpeg', 1410, 290, { size: 56, weight: 700, alpha: a * Math.max(on * 0.6, fOn) });
      label(ctx, 'H.264 · crf 18', 1410, 350, { size: 26, mono: true, color: GREEN, alpha: a * fOn, weight: 600 });
      label(ctx, 'stdin  ←  frames', 1410, 410, { size: 22, mono: true, color: C.dim, alpha: a * fOn, weight: 500 });
      arrow(ctx, 1590, 365, 1670, 365, C.dim, a * fOn);
      fileIcon(ctx, 1770, 365, 160, 210, GREEN, 'video', a * fOn);
      ctx.restore();
      caption(ctx, 'ff1', a, lt, CS.ff1);
      caption(ctx, 'ff2', a, lt, CS.ff2);
    },

    // ---------------------------------------------------------------- 04 narration
    au(ctx, t) {
      const a = chapterAlpha(T, 'au', t), lt = t - T.au[0];
      chapterTag(ctx, '04', 'Narration', a);
      ctx.save(); ctx.translate(0, 45);
      const rows = [['A leaf is layered…', 5.1, 'an1'], ['Below, palisade cells…', 4.5, 'an2'], ['Veins carry water up…', 3.4, 'an3']];
      const rowsOn = (i) => range(lt, sp('au1', 0.1 + i * 0.25), sp('au1', 0.1 + i * 0.25) + 0.7);
      rows.forEach(([text, dur, id], i) => {
        const y = 270 + i * 130, k = rowsOn(i);
        label(ctx, text, 130, y, { size: 30, weight: 500, alpha: a * k, align: 'left' });
        token(ctx, 'TTS', 640, y, VIOLET, a * k, 24);
        arrow(ctx, 690, y, 760, y, C.dim, a * k);
        wave(ctx, 790, y, dur * 70, 76, 11 + i, C.electron, a * k, easeOut(range(lt, sp('au1', 0.25 + i * 0.25), sp('au1', 0.25 + i * 0.25) + 0.8)));
        label(ctx, `${dur.toFixed(2)} s`, 790 + dur * 70 + 24, y, { size: 28, mono: true, color: C.gold, alpha: a * range(lt, sp('au1', 0.5 + i * 0.2), sp('au1', 0.5 + i * 0.2) + 0.5), align: 'left', weight: 600 });
      });
      // timing.json
      const jx = 1330, jy = 190, jk = range(lt, sp('au2', 0.0), sp('au2', 0.0) + 0.7);
      panel(ctx, jx, jy, 480, 330, GREEN, a * jk, 0.05);
      label(ctx, 'timing.json', jx + 240, jy + 44, { size: 28, mono: true, color: GREEN, alpha: a * jk, weight: 600 });
      rows.forEach(([, dur, id], i) => label(ctx, `"${id}": ${dur.toFixed(2)},`, jx + 40, jy + 120 + i * 62, { size: 32, mono: true, alpha: a * range(lt, sp('au2', 0.15 + i * 0.15), sp('au2', 0.15 + i * 0.15) + 0.5), align: 'left', weight: 500 }));
      // caption timeline driven by those durations
      const tk = range(lt, sp('au2', 0.4), sp('au2', 0.4) + 0.8);
      label(ctx, 'scene timeline', 130, 640, { size: 24, mono: true, color: C.dim, alpha: a * tk, align: 'left', weight: 500 });
      let x = 450;
      const tcol = [C.electron, GREEN, C.gold];
      rows.forEach(([, dur, id], i) => {
        const w = dur * 80;
        ctx.save(); ctx.globalAlpha = a * tk * 0.25; ctx.fillStyle = tcol[i]; ctx.beginPath(); ctx.roundRect(x, 610, w, 60, 10); ctx.fill();
        ctx.globalAlpha = a * tk; ctx.strokeStyle = tcol[i]; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
        label(ctx, 'caption', x + w / 2, 640, { size: 22, mono: true, alpha: a * tk, weight: 500 });
        x += w + 18;
      });
      label(ctx, 'captions & keyword highlights follow the speech', 450, 705, { size: 24, mono: true, color: GREEN, alpha: a * tk, align: 'left', weight: 500 });
      ctx.restore();
      caption(ctx, 'au1', a, lt, CS.au1);
      caption(ctx, 'au2', a, lt, CS.au2);
    },

    // ---------------------------------------------------------------- 05 mixing and muxing
    mx(ctx, t) {
      const a = chapterAlpha(T, 'mx', t), lt = t - T.mx[0];
      chapterTag(ctx, '05', 'Mixing and muxing', a);
      ctx.save(); ctx.translate(0, 45);
      const TX0 = 330, TW = 1100, vy = 290, ay = 450;
      const on = range(lt, 0.3, 1.0);
      label(ctx, 'video', 130, vy, { size: 30, mono: true, color: C.dim, alpha: a * on, align: 'left', weight: 600 });
      label(ctx, 'audio', 130, ay, { size: 30, mono: true, color: C.dim, alpha: a * on, align: 'left', weight: 600 });
      // video track: a run of frames
      const frames = 52;
      for (let i = 0; i < frames; i++) {
        ctx.save(); ctx.globalAlpha = a * on * range(lt, 0.4 + i * 0.01, 0.9 + i * 0.01) * 0.75; ctx.fillStyle = C.electron;
        ctx.beginPath(); ctx.roundRect(TX0 + (i * TW) / frames, vy - 32, TW / frames - 4, 64, 4); ctx.fill(); ctx.restore();
      }
      // audio track: clips placed at their start times
      const clips = [[0.03, 0.17, 'an1'], [0.25, 0.13, 'an2'], [0.43, 0.16, 'an3'], [0.63, 0.12, 'an4'], [0.80, 0.15, 'an5']];
      ctx.save(); ctx.globalAlpha = a * on * 0.3; ctx.strokeStyle = C.dim; ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
      ctx.beginPath(); ctx.moveTo(TX0, ay + 52); ctx.lineTo(TX0 + TW, ay + 52); ctx.stroke(); ctx.restore();
      clips.forEach(([s, w, id], i) => {
        const k = easeOut(range(lt, sp('mx1', 0.05 + i * 0.12), sp('mx1', 0.05 + i * 0.12) + 0.6));
        const x = TX0 + s * TW, ww = w * TW, y = ay - 150 * (1 - k);
        ctx.save(); ctx.globalAlpha = a * k * 0.25; ctx.fillStyle = GREEN; ctx.beginPath(); ctx.roundRect(x, y - 34, ww, 68, 10); ctx.fill();
        ctx.globalAlpha = a * k; ctx.strokeStyle = GREEN; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
        wave(ctx, x + 12, y, ww - 24, 40, 30 + i, GREEN, a * k);
        label(ctx, `+${(s * 62).toFixed(1)}s`, x + 6, ay + 82, { size: 20, mono: true, color: C.gold, alpha: a * k * range(lt, sp('mx1', 0.5), sp('mx1', 0.5) + 0.5), align: 'left', weight: 600 });
      });
      label(ctx, 'adelay → amix', TX0 + TW / 2, ay + 130, { size: 28, mono: true, color: GREEN, alpha: a * range(lt, sp('mx1', 0.55), sp('mx1', 0.55) + 0.6), weight: 600 });
      // playhead
      const ph = range(lt, sp('mx2', 0.0), sp('mx2', 0.0) + 3.2);
      if (ph > 0 && ph < 1) {
        ctx.save(); ctx.globalAlpha = a * 0.9; ctx.strokeStyle = C.gold; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(TX0 + ph * TW, vy - 70); ctx.lineTo(TX0 + ph * TW, ay + 80); ctx.stroke(); ctx.restore();
      }
      // mux into one file
      const mk = easeOut(range(lt, sp('mx2', 0.2), sp('mx2', 0.2) + 0.9));
      arrow(ctx, TX0 + TW + 30, (vy + ay) / 2, TX0 + TW + 110, (vy + ay) / 2, C.dim, a * mk);
      fileIcon(ctx, 1730, (vy + ay) / 2, 170, 230, VIOLET, 'MP4', a * mk);
      label(ctx, 'H.264 + AAC', 1730, (vy + ay) / 2 + 150, { size: 24, mono: true, color: VIOLET, alpha: a * mk, weight: 600 });
      // publish
      const pk = range(lt, sp('mx2', 0.65), sp('mx2', 0.65) + 0.7);
      chipRow(ctx, CX, 760, a * pk);
      ctx.restore();
      caption(ctx, 'mx1', a, lt, CS.mx1);
      caption(ctx, 'mx2', a, lt, CS.mx2);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, ...T.outro, 0.7, 0.8), lt = t - T.outro[0];
      label(ctx, 'A function of time,', CX, CY - 120, { size: 92, weight: 700, alpha: a * range(lt, 0.3, 1.1) });
      label(ctx, 'sampled frame by frame,', CX, CY - 10, { size: 92, weight: 700, alpha: a * range(lt, 1.2, 2.0), color: C.electron });
      label(ctx, 'mixed with sound.', CX, CY + 100, { size: 92, weight: 700, alpha: a * range(lt, 2.2, 3.0), color: GREEN });
      const k = range(lt, 3.2, 4.0);
      token(ctx, 'draw(ctx, t)', CX - 420, CY + 250, C.electron, a * k, 30);
      arrow(ctx, CX - 290, CY + 250, CX - 170, CY + 250, C.dim, a * k);
      token(ctx, 'frames + clips', CX, CY + 250, VIOLET, a * k, 30);
      arrow(ctx, CX + 190, CY + 250, CX + 310, CY + 250, C.dim, a * k);
      token(ctx, 'MP4', CX + 420, CY + 250, GREEN, a * k, 30);
    },
  },
});

/** the last step: from MP4 to the website */
function chipRow(ctx, cx, y, alpha) {
  if (alpha <= 0) return;
  token(ctx, 'npm run site', cx - 260, y, C.gold, alpha, 28);
  arrow(ctx, cx - 120, y, cx - 40, y, C.dim, alpha);
  token(ctx, 'npm run deploy', cx + 150, y, C.gold, alpha, 28);
  arrow(ctx, cx + 320, y, cx + 400, y, C.dim, alpha);
  label(ctx, 'your-domain.com', cx + 420, y, { size: 26, mono: true, color: C.dim, alpha, align: 'left', weight: 500 });
}
