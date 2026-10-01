// Quick visual check of a scene:  npm run preview -- <scene> [seconds-between-frames, default 4]
// Renders a low-res silent copy and tiles frames into out/preview/<name>.png (a contact sheet to eyeball layout and timing).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import ffmpegPath from 'ffmpeg-static';
import { ROOT, resolveScene } from './server.js';

const [ref, every = '4'] = process.argv.slice(2);
if (!ref) { console.error('Usage: npm run preview -- <scene> [seconds-between-frames]'); process.exit(1); }
const scene = resolveScene(ref);
const dir = path.join(ROOT, 'out', 'preview');
fs.mkdirSync(dir, { recursive: true });
const mp4 = path.join(dir, `${scene.name}.mp4`), png = path.join(dir, `${scene.name}.png`);
const r = spawnSync('node', [path.join(ROOT, 'src', 'render.js'), scene.id, '--fps', '4', '--width', '960', '-o', mp4], { stdio: ['ignore', 'ignore', 'inherit'] });
if (r.status) process.exit(r.status);
const sec = Number(every);
const info = spawnSync(ffmpegPath, ['-i', mp4], { encoding: 'utf8' }).stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);
const total = info ? Number(info[1]) * 3600 + Number(info[2]) * 60 + Number(info[3]) : 60;
const n = Math.ceil(total / sec), cols = 4;
spawnSync(ffmpegPath, ['-loglevel', 'error', '-y', '-i', mp4, '-vf', `fps=1/${sec},scale=640:-1,tile=${cols}x${Math.ceil(n / cols)}`, '-frames:v', '1', png]);
console.log(`${png}  (${total.toFixed(0)}s, a frame every ${sec}s, left-to-right)`);
