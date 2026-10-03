// fully local, many languages, but flat-sounding (Vietnamese in particular): the last engine to reach for
import path from 'node:path';
import fs from 'node:fs';
import { HOME, run, ensureVenv } from '../python.js';

export default {
  nativeSpeed: true,
  async synth(items, { voice, speed = 1 }) {
    const py = ensureVenv('venv', 'piper-tts');
    const data = path.join(HOME, 'piper');
    const model = path.join(data, `${voice}.onnx`);
    if (!fs.existsSync(model)) {
      console.log(`Downloading Piper voice ${voice}...`);
      run(py, ['-m', 'piper.download_voices', voice, '--data-dir', data]);
    }
    // Piper's length-scale is the inverse of speed
    for (const { text, wav } of items) run(py, ['-m', 'piper', '-m', model, '-f', wav, '--length-scale', String(1 / speed)], text);
  },
};
