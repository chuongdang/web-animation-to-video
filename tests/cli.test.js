import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, listScenes } from '../src/server.js';
import { makeProject, runTool } from './fixture.js';

const node = (script, ...args) => spawnSync(process.execPath, [path.join(ROOT, 'src', script), ...args], { cwd: ROOT, encoding: 'utf8' });

describe('install-skill', () => {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-skills-'));
  const skills = fs.readdirSync(path.join(ROOT, 'skills'), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);

  it('copies every skill into --dest and fills in {{REPO}}', () => {
    const r = node('install-skill.js', '--dest', dest);
    assert.equal(r.status, 0, r.stderr);
    for (const name of skills) {
      const text = fs.readFileSync(path.join(dest, name, 'SKILL.md'), 'utf8');
      assert.ok(!text.includes('{{REPO}}'), `${name} still has the placeholder`);
    }
    const source = fs.readFileSync(path.join(ROOT, 'skills', skills[0], 'SKILL.md'), 'utf8');
    if (source.includes('{{REPO}}')) assert.ok(fs.readFileSync(path.join(dest, skills[0], 'SKILL.md'), 'utf8').includes(ROOT));
  });

  it('--uninstall removes them again', () => {
    const r = node('install-skill.js', '--dest', dest, '--uninstall');
    assert.equal(r.status, 0, r.stderr);
    for (const name of skills) assert.ok(!fs.existsSync(path.join(dest, name)));
    fs.rmSync(dest, { recursive: true, force: true });
  });
});

describe('new scene', () => {
  it('rejects ids that are not field/sub/name', () => {
    for (const bad of [[], ['one'], ['a/b'], ['a/b/c/d'], ['a b/c/d'], ['../x/y']]) {
      const r = node('new.js', ...bad);
      assert.equal(r.status, 1, bad.join(' '));
      assert.match(r.stderr, /Usage/);
    }
  });

  it('refuses to overwrite an existing scene', () => {
    const r = node('new.js', listScenes()[0].id);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /already exists/);
  });

  it('scaffolds from the template, filling in the id and title', () => {
    const proj = makeProject();
    try {
      const r = runTool(proj, 'new.js', ['f/s/my-scene', 'My Scene']);
      assert.equal(r.status, 0, r.stderr);
      const dir = proj.path('scenes/f/s/my-scene');
      for (const f of ['index.html', 'scene.js', 'narration.json']) assert.ok(fs.existsSync(path.join(dir, f)), f);
      const all = ['index.html', 'scene.js'].map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
      assert.ok(all.includes("narration('f/s/my-scene'"));
      assert.ok(all.includes('My Scene'));
      assert.ok(!all.includes('__ID__') && !all.includes('__TITLE__'));
      assert.equal(runTool(proj, 'new.js', ['f/s/my-scene']).status, 1); // second time: exists
    } finally {
      proj.cleanup();
    }
  });
});
