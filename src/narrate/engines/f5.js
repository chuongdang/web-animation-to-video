// F5-TTS: natural zero-shot voice cloning, local. Without "ref" it uses the sample bundled with the package.
// narration.json: "ref" (voice clip), "refText" (what the clip says; empty = transcribed automatically), "model" (F5TTS_v1_Base).
import { ensureVenv, runScript } from '../python.js';
import { refPath, refHash } from './ref.js';

export default {
  nativeSpeed: true,
  hashExtra: (script, dir) => [refHash(script, dir), script.refText ?? '', script.model ?? ''],
  async synth(items, script, dir) {
    const py = ensureVenv('f5', 'f5-tts', '3.11');
    runScript(py, 'f5.py', { items, ref: refPath(script, dir), refText: script.refText ?? '', model: script.model ?? 'F5TTS_v1_Base', speed: script.speed ?? 1 });
  },
};
