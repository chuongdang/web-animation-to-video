// Microsoft Edge neural voices via edge-tts: free, no key, but sends the text to Microsoft, e.g. vi-VN-HoaiMyNeural
import fs from 'node:fs';
import ffmpegPath from 'ffmpeg-static';
import { run, ensureVenv } from '../python.js';

export default {
  nativeSpeed: true,
  async synth(items, { voice, speed = 1 }) {
    const py = ensureVenv('venv', 'edge-tts');
    const rate = `${speed >= 1 ? '+' : ''}${Math.round((speed - 1) * 100)}%`;
    for (const { text, wav } of items) {
      const mp3 = `${wav}.mp3`;
      for (let attempt = 1; ; attempt++) {
        try {
          run(py, ['-m', 'edge_tts', '--voice', voice, `--rate=${rate}`, '--text', text, '--write-media', mp3]);
          break;
        } catch (e) {
          if (attempt >= 4) throw e; // the service drops connections now and then
          console.log(`  retry ${attempt}...`);
        }
      }
      run(ffmpegPath, ['-y', '-loglevel', 'error', '-i', mp3, '-ar', '24000', '-ac', '1', wav]);
      fs.rmSync(mp3);
    }
  },
};
