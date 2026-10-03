// Text -> speech. Set "engine" in narration.json (modules in src/narrate/engines/, preferred first):
//   chatterbox  local, very natural, optional voice cloning ("ref"), English; fast on GPU / Apple Silicon
//   f5          local, natural zero-shot voice cloning ("ref", "refText")
//   kokoro      (default) local, English only, model downloads on first use
//   edge        Microsoft Edge neural voices via edge-tts (free, no key, sends the text to Microsoft), e.g. vi-VN-HoaiMyNeural
//   piper       local, many languages, flat-sounding: last resort
// Python engines run in venvs under ~/.cache/video-creator that are set up automatically on first use.
//   npm run narrate -- <scene> [--lang vi]
// Reads scenes/<scene>/narration[.<lang>].json, writes one wav per line plus timing.json (durations)
// into scenes/<scene>/audio[/<lang>]/. The scene uses the durations to time itself; the renderer mixes the clips.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import ffmpegPath from 'ffmpeg-static';
import { ROOT, resolveScene } from './server.js';
import { getEngine } from './narrate/engines/index.js';
import { run } from './narrate/python.js';
import { wavSeconds } from './narrate/wav.js';

const argv = process.argv.slice(2);
const li = argv.indexOf('--lang');
const lang = li >= 0 ? argv.splice(li, 2)[1] : '';
const name = argv[0];
if (!name) {
  console.error('Usage: npm run narrate -- <field>/<sub>/<name> [--lang vi]');
  process.exit(1);
}
let sceneDir, engine;
const script = (() => {
  try {
    sceneDir = resolveScene(name).dir;
    const s = JSON.parse(fs.readFileSync(path.join(sceneDir, lang ? `narration.${lang}.json` : 'narration.json'), 'utf8'));
    engine = getEngine(s.engine ?? 'kokoro');
    return s;
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
const { engine: engineName = 'kokoro', voice = 'af_heart', speed = 1, lines } = script;
const audioDir = path.join(sceneDir, 'audio', lang);
fs.mkdirSync(audioDir, { recursive: true });

const timingFile = path.join(audioDir, 'timing.json');
const timing = fs.existsSync(timingFile) ? JSON.parse(fs.readFileSync(timingFile, 'utf8')) : {};

// lines whose text / voice / speed / engine options changed (or whose wav is missing)
const todo = [];
for (const [id, text] of Object.entries(lines)) {
  const key = [text, voice, speed, engineName, ...(engine.hashExtra?.(script, sceneDir) ?? [])];
  const hash = crypto.createHash('sha1').update(JSON.stringify(key)).digest('hex').slice(0, 12);
  const wav = path.join(audioDir, `${id}.wav`);
  if (timing[id]?.hash === hash && fs.existsSync(wav)) console.log(`  cached  ${id}`);
  else todo.push({ id, text, wav, hash });
}

if (todo.length) {
  await engine.synth(todo, script, sceneDir);
  for (const { id, wav, hash } of todo) {
    if (!engine.nativeSpeed && speed !== 1) { // engine can't change pace itself: stretch with ffmpeg (atempo is 0.5..2)
      const tmp = `${wav}.tmp.wav`;
      run(ffmpegPath, ['-y', '-loglevel', 'error', '-i', wav, '-filter:a', `atempo=${speed}`, tmp]);
      fs.renameSync(tmp, wav);
    }
    const duration = +wavSeconds(wav).toFixed(3);
    timing[id] = { hash, duration };
    console.log(`  spoke   ${id}  ${duration}s`);
  }
}

// drop entries for lines that no longer exist
for (const id of Object.keys(timing)) if (!(id in lines)) delete timing[id];
fs.writeFileSync(timingFile, JSON.stringify(timing, null, 2));
console.log(`Wrote ${path.relative(ROOT, timingFile)}`);
