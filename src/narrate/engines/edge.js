// Microsoft Edge neural voices via edge-tts: free, no key, but sends the text to Microsoft, e.g. vi-VN-HoaiMyNeural
import fs from 'node:fs';
import ffmpegPath from 'ffmpeg-static';
import { run, ensureVenv } from '../python.js';
import { retry } from '../retry.js';

/** edge-tts --rate value for a speed multiplier: 0.95 -> "-5%", 1.2 -> "+20%" */
export const edgeRate = (speed) => `${speed >= 1 ? '+' : ''}${Math.round((speed - 1) * 100)}%`;

export default {
  nativeSpeed: true,
  async synth(items, { voice, speed = 1 }) {
    const py = ensureVenv('venv', 'edge-tts');
    const rate = edgeRate(speed);
    for (const { text, wav } of items) {
      const mp3 = `${wav}.mp3`;
      // the service drops connections now and then
      retry(() => run(py, ['-m', 'edge_tts', '--voice', voice, `--rate=${rate}`, '--text', text, '--write-media', mp3]), {
        onRetry: (n) => console.log(`  retry ${n}...`),
      });
      run(ffmpegPath, ['-y', '-loglevel', 'error', '-i', mp3, '-ar', '24000', '-ac', '1', wav]);
      fs.rmSync(mp3);
    }
  },
};
