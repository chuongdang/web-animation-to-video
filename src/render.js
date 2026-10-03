import { parseArgs } from 'node:util';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
import ffmpegPath from 'ffmpeg-static';
import { startServer, resolveScene, ROOT } from './server.js';
import { workerStats } from './render/stats.js';

const { values: opt, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: 'string', short: 'o' },
    fps: { type: 'string', default: '30' },
    width: { type: 'string' }, // output width in px; height follows the scene's aspect ratio
    crf: { type: 'string', default: '18' },
    workers: { type: 'string', short: 'j' }, // parallel browser pages (default: about half the CPU cores)
    lang: { type: 'string' }, // language variant of the scene (e.g. vi): ?lang=vi, out/<field>/<sub>/<name>.vi.mp4
    audio: { type: 'string' }, // optional soundtrack / narration file
    help: { type: 'boolean', short: 'h' },
  },
});

if (opt.help || positionals.length === 0) {
  console.log(`Usage: npm run render -- <scene> [options]

  <scene>            <field>/<sub>/<name> (e.g. "physics/electricity-basics/electricity"), a unique bare name, or an .html path

  -o, --out <file>   output file            (default: out/<field>/<sub>/<name>.mp4)
      --fps <n>      frames per second      (default: 30)
      --width <px>   output width           (default: the scene's design width)
      -j, --workers <n> parallel browser workers (default: about half the CPU cores, max 8)
      --crf <n>      x264 quality, lower=better (default: 18)
      --lang <code>  render a language variant (e.g. vi) -> out/<field>/<sub>/<name>.<code>.mp4
      --audio <file> mux this audio file instead of the scene's own clips (narration)`);
  process.exit(opt.help ? 0 : 1);
}

const target = positionals[0];
let sceneFile, outDefault;
if (/\.html$/.test(target)) {
  sceneFile = path.resolve(target);
  outDefault = path.join('out', `${path.basename(path.dirname(sceneFile))}.mp4`);
} else {
  try {
    const scene = resolveScene(target);
    sceneFile = path.join(scene.dir, 'index.html');
    outDefault = path.join('out', scene.field, scene.sub, `${scene.name}.mp4`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
if (opt.lang) outDefault = outDefault.replace(/\.mp4$/, `.${opt.lang}.mp4`);
if (!sceneFile.startsWith(ROOT + path.sep) || !fs.existsSync(sceneFile)) {
  console.error(`Scene not found (or outside the project): ${sceneFile}`);
  process.exit(1);
}

const fps = Number(opt.fps);
const workerCount = Math.max(1, Number(opt.workers ?? Math.min(8, Math.ceil(os.availableParallelism() / 2))));
const outFile = path.resolve(opt.out ?? outDefault);
fs.mkdirSync(path.dirname(outFile), { recursive: true });

const server = await startServer();
const pageUrl = `${server.url}/${path.relative(ROOT, sceneFile).split(path.sep).join('/')}?render${opt.lang ? `&lang=${opt.lang}` : ''}`;
const browser = await chromium.launch();

async function openScene(context) {
  const page = await context.newPage();
  page.on('pageerror', (e) => console.error('[scene error]', e.message));
  page.on('console', (m) => m.type() === 'error' && console.error('[scene console]', m.text()));
  await page.goto(pageUrl);
  await page.waitForFunction(() => window.__sceneReady === true, null, { timeout: 30_000 });
  return page;
}

try {
  // Probe the scene's design size / duration, then open a context with the right scale factor.
  const probeCtx = await browser.newContext();
  const meta = await (await openScene(probeCtx)).evaluate(() => window.__scene);
  await probeCtx.close();

  const scale = opt.width ? Number(opt.width) / meta.width : 1;
  const context = await browser.newContext({
    viewport: { width: meta.width, height: meta.height },
    deviceScaleFactor: scale,
  });
  const total = Math.round(meta.duration * fps);
  console.log(`${path.basename(sceneFile)}: ${meta.width}x${meta.height} design, ${meta.duration}s @ ${fps}fps = ${total} frames, ${Math.min(workerCount, total)} workers`);

  // Audio: --audio replaces everything; otherwise mix the clips the scene declares (e.g. narration).
  const clips = opt.audio ? [] : (meta.audio ?? []).map((c) => ({ file: path.join(ROOT, c.src), start: c.start }));
  const audioInputs = opt.audio ? [path.resolve(opt.audio)] : clips.map((c) => c.file);
  const mix = clips.length
    ? [
        ...clips.map((c, i) => `[${i + 1}:a]adelay=${Math.round(c.start * 1000)}:all=1[a${i}]`),
        `${clips.map((_, i) => `[a${i}]`).join('')}amix=inputs=${clips.length}:normalize=0:duration=longest,apad[aout]`,
      ].join(';')
    : null;

  const args = [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    ...audioInputs.flatMap((f) => ['-i', f]),
    ...(mix ? ['-filter_complex', mix, '-map', '0:v', '-map', '[aout]'] : []),
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', // yuv420p needs even dimensions
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', opt.crf, '-preset', 'medium',
    ...(audioInputs.length ? ['-c:a', 'aac', '-b:a', '192k', '-shortest'] : []),
    '-movflags', '+faststart',
    outFile,
  ];
  const ff = spawn(ffmpegPath, args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const ffDone = new Promise((resolve, reject) => {
    ff.on('error', reject);
    ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited with code ${code}`))));
  });
  ff.stdin.on('error', () => {}); // surfaced through ffDone instead

  // Each worker owns a page (in its own context, so its own renderer process) and takes the next
  // unrendered frame. Frames finish out of order, so they are buffered and written to ffmpeg in
  // order; workers pause when they get too far ahead of the writer to bound memory.
  const started = Date.now();
  const pending = new Map();
  const maxAhead = workerCount * 3;
  let nextFrame = 0, nextWrite = 0, wake = [];
  const stats = workerStats(Math.min(workerCount, total));

  const flush = async () => {
    while (pending.has(nextWrite)) {
      const png = pending.get(nextWrite);
      pending.delete(nextWrite++);
      if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    }
    wake.forEach((r) => r());
    wake = [];
    const done = nextWrite;
    if (done % 10 === 0 || done === total) {
      const eta = (((Date.now() - started) / done) * (total - done) / 1000).toFixed(0);
      process.stdout.write(`\r  frame ${done}/${total} (${((done / total) * 100).toFixed(0)}%) eta ${eta}s | ${stats.line()}   `);
    }
  };
  let writer = Promise.resolve();

  const work = async (page, w) => {
    while (nextFrame < total) {
      while (nextFrame - nextWrite >= maxAhead) await new Promise((r) => wake.push(r));
      const i = nextFrame++;
      if (i >= total) break;
      const t0 = Date.now();
      await page.evaluate((t) => window.setTime(t), i / fps);
      pending.set(i, await page.screenshot({ type: 'jpeg', quality: 95 }));
      stats.record(w, Date.now() - t0);
      writer = writer.then(flush);
      await writer;
    }
  };

  const pages = [];
  for (let w = 0; w < Math.min(workerCount, total); w++) {
    const ctx = w === 0 ? context : await browser.newContext({ viewport: { width: meta.width, height: meta.height }, deviceScaleFactor: scale });
    pages.push(await openScene(ctx));
  }
  await Promise.all(pages.map((page, w) => work(page, w)));
  ff.stdin.end();
  await ffDone;
  console.log(`\n${stats.summary()}\nDone -> ${path.relative(process.cwd(), outFile)}`);
} finally {
  await browser.close();
  await server.close();
}
