// A throwaway project tree for tests that run the real tools against fake scenes (VC_ROOT points them at it).
// runtime/ is symlinked and web/ copied from the repo (the build copies web/ itself, which breaks on a symlink); scenes/ and out/ are generated, with tiny real videos.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import { ROOT } from '../src/server.js';

const REPO = ROOT;

export function makeProject() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'vc-project-')));
  fs.symlinkSync(path.join(REPO, 'runtime'), path.join(root, 'runtime'));
  fs.cpSync(path.join(REPO, 'web'), path.join(root, 'web'), { recursive: true });
  fs.cpSync(path.join(REPO, 'scenes', '_template'), path.join(root, 'scenes', '_template'), { recursive: true });
  const p = (...a) => path.join(root, ...a);
  return {
    root,
    path: p,
    write(rel, content) {
      fs.mkdirSync(path.dirname(p(rel)), { recursive: true });
      fs.writeFileSync(p(rel), typeof content === 'string' ? content : JSON.stringify(content));
    },
    /** scene dir with an index.html (listScenes needs it) */
    scene(id, files = {}) {
      this.write(`scenes/${id}/index.html`, '<!doctype html><title>x</title>');
      for (const [f, c] of Object.entries(files)) this.write(`scenes/${id}/${f}`, c);
    },
    /** copy a tiny mp4 to out/<rel> */
    video(rel) {
      fs.mkdirSync(path.dirname(p('out', rel)), { recursive: true });
      fs.copyFileSync(sampleVideo(), p('out', rel));
    },
    env: (extra = {}) => ({ ...process.env, VC_ROOT: root, ...extra }),
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}

let sample;
/** one 3.5s 64x64 mp4, made once per run (the site build takes a poster at 2.8s) */
function sampleVideo() {
  if (sample) return sample;
  sample = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'vc-sample-')), 'v.mp4');
  const r = spawnSync(ffmpegPath, ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=blue:s=64x64:r=5:d=3.5', '-pix_fmt', 'yuv420p', sample]);
  if (r.status !== 0) throw new Error('could not make the sample video');
  return sample;
}

/** run a src/ script (cwd = project) and return { status, stdout, stderr } */
export function runTool(project, script, args = [], env = {}) {
  return spawnSync(process.execPath, [path.join(REPO, 'src', script), ...args], { cwd: project.root, env: project.env(env), encoding: 'utf8' });
}

/** ffmpeg -i output: duration (s), whether there is an audio stream, and the video size */
export function probe(file) {
  const err = spawnSync(ffmpegPath, ['-i', file], { encoding: 'utf8' }).stderr;
  const d = /Duration: (\d+):(\d+):([\d.]+)/.exec(err);
  const size = /Video:.*?, (\d+)x(\d+)/.exec(err);
  return {
    seconds: d ? Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3]) : 0,
    audio: /Audio:/.test(err),
    width: size && Number(size[1]),
    height: size && Number(size[2]),
  };
}
