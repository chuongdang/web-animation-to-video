// Python helpers for the engines that run in a venv under ~/.cache/video-creator (created and filled on first use).
// Pass `python` (e.g. '3.11') to pin the interpreter: uv provides it when installed, otherwise python<ver> must be on PATH.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

export const HOME = path.join(os.homedir(), '.cache', 'video-creator');

export function run(cmd, args, input) {
  const r = spawnSync(cmd, args, { input, stdio: [input ? 'pipe' : 'inherit', 'inherit', 'inherit'] });
  if (r.status !== 0) throw new Error(`${cmd} ${args.slice(0, 3).join(' ')} failed`);
}

const hasUv = () => spawnSync('uv', ['--version'], { stdio: 'ignore' }).status === 0;

/** path to the venv's python, with `pkg` installed (and the venv created) when missing */
export function ensureVenv(name, pkg, python) {
  const dir = path.join(HOME, name);
  const py = path.join(dir, 'bin', 'python');
  const uv = python && hasUv();
  if (!fs.existsSync(py)) {
    if (uv) run('uv', ['venv', '--python', python, dir]);
    else run(python ? `python${python}` : 'python3', ['-m', 'venv', dir]);
  }
  const installed = (uv ? spawnSync('uv', ['pip', 'show', '--python', py, pkg]) : spawnSync(py, ['-m', 'pip', 'show', pkg])).status === 0;
  if (!installed) {
    console.log(`Installing ${pkg} into ${dir} (first run, can take a few minutes) ...`);
    if (uv) run('uv', ['pip', 'install', '--python', py, pkg]);
    else run(py, ['-m', 'pip', 'install', '-q', pkg]);
  }
  return py;
}

/** run one of src/narrate/py/*.py with a JSON job on stdin */
export function runScript(py, script, job) {
  run(py, [path.join(import.meta.dirname, 'py', script)], JSON.stringify(job));
}
