// Smoke test of the real renderer on a tiny fixture scene: frame count/duration, size, audio mixing, errors.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import ffmpegPath from 'ffmpeg-static';
import { makeProject, runTool, probe } from './fixture.js';

const SKIP = !fs.existsSync(chromium.executablePath()) && 'Chromium not installed: run `npm run setup`';

const SCENE_JS = `
Scene.define({
  width: 320, height: 180, duration: 1, background: '#102040',
  audio: ${JSON.stringify([{ src: '/scenes/t/s/tiny/beep.wav', start: 0.25 }])},
  draw(ctx, t) { ctx.fillStyle = '#4dd8ff'; ctx.fillRect(10, 10, 20 + t * 200, 20); },
});`;

describe('render', { skip: SKIP }, () => {
  let proj;
  before(() => {
    proj = makeProject();
    proj.scene('t/s/tiny', { 'scene.js': SCENE_JS });
    proj.write('scenes/t/s/tiny/index.html', '<!doctype html><body><script src="/runtime/scene.js"></script><script type="module" src="scene.js"></script></body>');
    const wav = proj.path('scenes/t/s/tiny/beep.wav');
    spawnSync(ffmpegPath, ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=0.5', '-ar', '24000', '-ac', '1', wav]);
  });
  after(() => proj.cleanup());

  it('renders a scene to an mp4 with the right duration, size and mixed audio', () => {
    const out = proj.path('out/t/s/tiny.mp4');
    const r = runTool(proj, 'render.js', ['t/s/tiny', '--fps', '5', '-j', '2']);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /320x180 design, 1s @ 5fps = 5 frames/);
    const p = probe(out);
    assert.equal(p.width, 320);
    assert.equal(p.height, 180);
    assert.ok(p.audio, 'audio stream');
    assert.ok(Math.abs(p.seconds - 1) < 0.3, `duration ${p.seconds}`);
  });

  it('--width scales the output and --lang changes the default file name', () => {
    const r = runTool(proj, 'render.js', ['t/s/tiny', '--fps', '5', '--width', '160', '-j', '1', '--lang', 'vi']);
    assert.equal(r.status, 0, r.stderr);
    const p = probe(proj.path('out/t/s/tiny.vi.mp4'));
    assert.equal(p.width, 160);
    assert.equal(p.height, 90);
  });

  it('--audio replaces the scene clips with the given file', () => {
    const out = proj.path('custom.mp4');
    const r = runTool(proj, 'render.js', ['t/s/tiny', '--fps', '5', '-j', '1', '--audio', proj.path('scenes/t/s/tiny/beep.wav'), '-o', out]);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(probe(out).audio);
  });

  it('fails clearly for an unknown scene and for no arguments', () => {
    const bad = runTool(proj, 'render.js', ['nope/nope/nope']);
    assert.equal(bad.status, 1);
    assert.match(bad.stderr, /not found/);
    const none = runTool(proj, 'render.js');
    assert.equal(none.status, 1);
    assert.match(none.stdout, /Usage/);
    assert.equal(runTool(proj, 'render.js', ['--help']).status, 0);
  });
});
