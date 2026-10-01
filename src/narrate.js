// Text -> speech. Engines (set "engine" in narration.json):
//   kokoro (default) local, English only, model downloads on first use
//   piper            local, other languages (flat-sounding Vietnamese)
//   edge             Microsoft Edge neural voices via edge-tts (free, no key, sends the text to Microsoft), e.g. vi-VN-HoaiMyNeural
// Piper and edge use a Python venv in ~/.cache/video-creator that is set up automatically on first use.
//   npm run narrate -- <scene> [--lang vi]
// Reads scenes/<scene>/narration[.<lang>].json, writes one wav per line plus timing.json (durations)
// into scenes/<scene>/audio[/<lang>]/. The scene uses the durations to time itself; the renderer mixes the clips.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import { ROOT, resolveScene } from './server.js';

const argv = process.argv.slice(2);
const li = argv.indexOf('--lang');
const lang = li >= 0 ? argv.splice(li, 2)[1] : '';
const name = argv[0];
if (!name) {
  console.error('Usage: npm run narrate -- <field>/<sub>/<name> [--lang vi]');
  process.exit(1);
}
let sceneDir;
try {
  sceneDir = resolveScene(name).dir;
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
const script = JSON.parse(fs.readFileSync(path.join(sceneDir, lang ? `narration.${lang}.json` : 'narration.json'), 'utf8'));
const audioDir = path.join(sceneDir, 'audio', lang);
fs.mkdirSync(audioDir, { recursive: true });

const timingFile = path.join(audioDir, 'timing.json');
const timing = fs.existsSync(timingFile) ? JSON.parse(fs.readFileSync(timingFile, 'utf8')) : {};
const { engine = 'kokoro', voice = 'af_heart', speed = 1, lines } = script;

// ---- Piper (non-English) ----
const PIPER_HOME = path.join(os.homedir(), '.cache', 'video-creator');
const PIPER_PY = path.join(PIPER_HOME, 'venv', 'bin', 'python');
function run(cmd, args, input) {
  const r = spawnSync(cmd, args, { input, stdio: [input ? 'pipe' : 'inherit', 'inherit', 'inherit'] });
  if (r.status !== 0) throw new Error(`${cmd} ${args.slice(0, 3).join(' ')} failed`);
}
function ensurePip(pkg) {
  if (!fs.existsSync(PIPER_PY)) run('python3', ['-m', 'venv', path.join(PIPER_HOME, 'venv')]);
  if (spawnSync(PIPER_PY, ['-m', 'pip', 'show', pkg], { stdio: 'ignore' }).status !== 0) {
    console.log(`Installing ${pkg} into ${PIPER_HOME}/venv ...`);
    run(PIPER_PY, ['-m', 'pip', 'install', '-q', pkg]);
  }
}
function setupPiper() {
  ensurePip('piper-tts');
  const model = path.join(PIPER_HOME, 'piper', `${voice}.onnx`);
  if (!fs.existsSync(model)) {
    console.log(`Downloading Piper voice ${voice}...`);
    run(PIPER_PY, ['-m', 'piper.download_voices', voice, '--data-dir', path.join(PIPER_HOME, 'piper')]);
  }
  return model;
}
/** Edge neural voice: edge-tts writes mp3, ffmpeg converts it to the wav the renderer mixes. */
function speakEdge(text, wav) {
  ensurePip('edge-tts');
  const mp3 = `${wav}.mp3`;
  const rate = `${speed >= 1 ? '+' : ''}${Math.round((speed - 1) * 100)}%`;
  for (let attempt = 1; ; attempt++) {
    try {
      run(PIPER_PY, ['-m', 'edge_tts', '--voice', voice, `--rate=${rate}`, '--text', text, '--write-media', mp3]);
      break;
    } catch (e) {
      if (attempt >= 4) throw e; // the service drops connections now and then
      console.log(`  retry ${attempt}...`);
    }
  }
  run(ffmpegPath, ['-y', '-loglevel', 'error', '-i', mp3, '-ar', '24000', '-ac', '1', wav]);
  fs.rmSync(mp3);
}
/** wav duration in seconds (16-bit PCM mono, as Piper writes) */
function wavSeconds(file) {
  const b = fs.readFileSync(file);
  const rate = b.readUInt32LE(24), bytesPerFrame = b.readUInt16LE(32);
  const dataAt = b.indexOf('data') + 8;
  return (b.length - dataAt) / bytesPerFrame / rate;
}

let tts, piperModel;
for (const [id, text] of Object.entries(lines)) {
  const hash = crypto.createHash('sha1').update(JSON.stringify([text, voice, speed, engine])).digest('hex').slice(0, 12);
  const wav = path.join(audioDir, `${id}.wav`);
  if (timing[id]?.hash === hash && fs.existsSync(wav)) {
    console.log(`  cached  ${id}`);
    continue;
  }
  if (engine === 'piper' || engine === 'edge') {
    if (engine === 'edge') speakEdge(text, wav);
    else {
      piperModel ??= setupPiper();
      // Piper's length-scale is the inverse of speed
      run(PIPER_PY, ['-m', 'piper', '-m', piperModel, '-f', wav, '--length-scale', String(1 / speed)], text);
    }
    const duration = +wavSeconds(wav).toFixed(3);
    timing[id] = { hash, duration };
    console.log(`  spoke   ${id}  ${duration}s`);
    continue;
  }
  if (!tts) {
    const { KokoroTTS } = await import('kokoro-js');
    console.log('Loading Kokoro (first run downloads ~90MB)...');
    tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' });
  }
  const audio = await tts.generate(text, { voice, speed });
  await audio.save(wav);
  const duration = +(audio.audio.length / audio.sampling_rate).toFixed(3);
  timing[id] = { hash, duration };
  console.log(`  spoke   ${id}  ${duration}s`);
}

// drop entries for lines that no longer exist
for (const id of Object.keys(timing)) if (!(id in lines)) delete timing[id];
fs.writeFileSync(timingFile, JSON.stringify(timing, null, 2));
console.log(`Wrote ${path.relative(ROOT, timingFile)}`);
