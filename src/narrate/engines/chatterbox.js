// Chatterbox (Resemble AI): very natural, optional voice cloning, local, English. Fast on a GPU / Apple Silicon, slow on CPU.
// narration.json: "ref" (voice clip, optional), "exaggeration" (0.5), "cfg" (0.5). Chatterbox has no speed control.
import { ensureVenv, runScript } from '../python.js';
import { refPath, refHash } from './ref.js';

export default {
  nativeSpeed: false,
  hashExtra: (script, dir) => [refHash(script, dir), script.exaggeration ?? 0.5, script.cfg ?? 0.5],
  async synth(items, script, dir) {
    const py = ensureVenv('chatterbox', 'chatterbox-tts', '3.11');
    runScript(py, 'chatterbox.py', { items, ref: refPath(script, dir), exaggeration: script.exaggeration ?? 0.5, cfg: script.cfg ?? 0.5 });
  },
};
