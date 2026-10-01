/*
 * Scene runtime. A scene is a pure function of time: given t (seconds) it must
 * draw the exact same picture every time. That is what lets the renderer step
 * through frames one by one instead of recording in real time.
 *
 *   Scene.define({
 *     width: 1920, height: 1080, duration: 10, background: '#000',
 *     audio: [{ src: '/scenes/x/a.wav', start: 2.5 }],  // optional clips, mixed in by the renderer
 *     init({ stage, ctx })   { return state; },   // optional, runs once
 *     draw(ctx, t, state)    { ... },             // optional, canvas 2D (cleared each frame)
 *     update(t, state)       { ... },             // optional, for DOM/SVG scenes
 *   });
 *
 * CSS animations / transitions / Web Animations in the page are seeked to t
 * automatically, so plain CSS keyframes work too.
 *
 * Open a scene in the browser (npm run dev) for a live preview with a scrubber.
 * The renderer loads it with ?render, which hides the preview UI.
 */
(() => {
  const RENDER = new URLSearchParams(location.search).has('render');

  // ---- helpers for authoring -------------------------------------------------
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  /** 0..1 progress of t between a and b */
  const range = (t, a, b) => clamp((t - a) / (b - a));
  const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const easeOut = (k) => 1 - Math.pow(1 - k, 3);
  /** opacity that fades in over `fi`s after `a`, and out over `fo`s before `b` */
  const fadeWindow = (t, a, b, fi = 0.5, fo = 0.5) => Math.min(range(t, a, a + fi), 1 - range(t, b - fo, b));
  /** deterministic PRNG (mulberry32) — never use Math.random() in a scene */
  const rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  function define(opts) {
    const { width = 1920, height = 1080, duration, background = '#000', audio = [], init, draw, update } = opts;
    if (!(duration > 0)) throw new Error('Scene.define: duration (seconds) is required');

    Object.assign(document.documentElement.style, { background: RENDER ? background : '#05070d' });
    Object.assign(document.body.style, { margin: 0, overflow: 'hidden' });

    const stage = document.createElement('div');
    Object.assign(stage.style, {
      position: 'absolute', left: 0, top: 0, width: `${width}px`, height: `${height}px`,
      overflow: 'hidden', background, transformOrigin: '0 0',
    });
    document.body.append(stage);

    let canvas, ctx;
    if (draw) {
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.style.cssText = 'position:absolute;left:0;top:0';
      stage.append(canvas);
      ctx = canvas.getContext('2d');
    }

    const state = init ? init({ stage, canvas, ctx, width, height }) : undefined;

    function setTime(t) {
      t = clamp(t, 0, duration);
      for (const a of document.getAnimations()) {
        a.pause();
        a.currentTime = t * 1000;
      }
      if (update) update(t, state);
      if (draw) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, width, height);
        draw(ctx, t, state);
      }
    }

    window.setTime = setTime;
    window.__scene = { width, height, duration, audio };

    document.fonts.ready.then(() => {
      setTime(0);
      if (!RENDER) preview(stage, setTime, width, height, duration);
      window.__sceneReady = true;
    });
  }

  // ---- live preview (not used when rendering) --------------------------------
  function preview(stage, setTime, width, height, duration) {
    const bar = document.createElement('div');
    bar.style.cssText =
      'position:fixed;left:0;right:0;bottom:0;height:48px;display:flex;gap:12px;align-items:center;' +
      'padding:0 16px;background:#0e1424;color:#cfd6ea;font:14px system-ui;z-index:10';
    bar.innerHTML =
      '<button style="width:72px;height:30px">Pause</button>' +
      '<input type="range" min="0" max="1000" value="0" style="flex:1">' +
      '<span style="width:110px;text-align:right;font-variant-numeric:tabular-nums"></span>';
    document.body.append(bar);
    const [btn, slider, label] = bar.children;

    const fit = () => {
      const s = Math.min(innerWidth / width, (innerHeight - 48) / height);
      stage.style.transform = `scale(${s})`;
      stage.style.left = `${(innerWidth - width * s) / 2}px`;
      stage.style.top = `${(innerHeight - 48 - height * s) / 2}px`;
    };
    addEventListener('resize', fit);
    fit();

    let t = 0, playing = true, last = performance.now();
    const show = () => {
      setTime(t);
      slider.value = (t / duration) * 1000;
      label.textContent = `${t.toFixed(1)} / ${duration.toFixed(1)}s`;
    };
    const toggle = () => {
      playing = !playing;
      btn.textContent = playing ? 'Pause' : 'Play';
      last = performance.now();
    };
    btn.onclick = toggle;
    slider.oninput = () => { t = (slider.value / 1000) * duration; show(); };
    addEventListener('keydown', (e) => e.code === 'Space' && (e.preventDefault(), toggle()));

    (function loop(now) {
      if (playing) {
        t += (now - last) / 1000;
        if (t > duration) t = 0;
      }
      last = now;
      show();
      requestAnimationFrame(loop);
    })(last);
  }

  window.Scene = { define, clamp, lerp, range, easeInOut, easeOut, fadeWindow, rng };
})();
